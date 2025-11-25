"""
Enhanced Session Manager - Integrates with Strands Best Practices
Manages both anonymous and authenticated user sessions with proper data lifecycle
"""

import boto3
import json
import logging
import os
import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class SessionManager:
    """
    Enhanced session manager that integrates with Strands best practices
    Handles both anonymous (1-hour TTL) and authenticated (persistent) users
    """
    
    def __init__(self, user_id: str, is_authenticated: bool, region_name: str = 'us-west-2'):
        self.user_id = user_id
        self.is_authenticated = is_authenticated
        self.region_name = region_name
        
        # Initialize DynamoDB clients
        self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
        
        # Table references
        self.conversation_table = self.dynamodb.Table(os.environ['CONVERSATION_TABLE'])
        self.vehicle_table = self.dynamodb.Table(os.environ['VEHICLE_TABLE'])
        self.session_context_table = self.dynamodb.Table(os.environ['SESSION_CONTEXT_TABLE'])
        
        # Configuration
        self.anonymous_ttl = int(os.environ.get('ANONYMOUS_SESSION_TTL', '3600'))  # 1 hour
        self.max_vehicles = int(os.environ.get('MAX_VEHICLES_PER_USER', '10'))
        
        logger.info(f"SessionManager initialized for user: {user_id}, authenticated: {is_authenticated}")
    
    # ==========================================
    # ANONYMOUS USER METHODS (1-hour TTL)
    # ==========================================
    
    def create_anonymous_session(self, session_id: str, initial_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create anonymous session with 1-hour TTL
        
        Args:
            session_id: Anonymous session ID (format: 'anon-session-12345-timestamp')
            initial_context: Initial session context data
            
        Returns:
            Created session context
        """
        try:
            current_time = datetime.utcnow()
            ttl_timestamp = int((current_time + timedelta(seconds=self.anonymous_ttl)).timestamp())
            
            session_context = {
                'sessionId': session_id,
                'contextData': initial_context or {
                    'diagnostic_level': 'quick',
                    'interaction_state': {
                        'has_described_problem': False,
                        'has_selected_diagnostic_level': False,
                        'current_step': 'initial'
                    }
                },
                'created_at': current_time.isoformat(),
                'ttl': ttl_timestamp
            }
            
            # Store in SessionContext table
            self.session_context_table.put_item(Item=session_context)
            
            logger.info(f"✅ Anonymous session created: {session_id}, expires at: {ttl_timestamp}")
            return session_context
            
        except Exception as e:
            logger.error(f"❌ Failed to create anonymous session {session_id}: {e}")
            raise
    
    def get_anonymous_context(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve anonymous session context (auto-expires after 1 hour)
        
        Args:
            session_id: Anonymous session ID
            
        Returns:
            Session context or None if not found/expired
        """
        try:
            response = self.session_context_table.get_item(Key={'sessionId': session_id})
            
            if 'Item' not in response:
                logger.info(f"🔍 No anonymous session found: {session_id}")
                return None
            
            session_data = response['Item']
            
            # Check if expired (DynamoDB TTL might not have cleaned up yet)
            current_timestamp = int(time.time())
            if session_data.get('ttl', 0) < current_timestamp:
                logger.info(f"⏰ Anonymous session expired: {session_id}")
                self.cleanup_anonymous_session(session_id)
                return None
            
            logger.info(f"✅ Anonymous session context retrieved: {session_id}")
            return session_data.get('contextData', {})
            
        except Exception as e:
            logger.error(f"❌ Failed to get anonymous context {session_id}: {e}")
            return None
    
    def update_anonymous_context(self, session_id: str, context_updates: Dict[str, Any]) -> bool:
        """
        Update anonymous session context
        
        Args:
            session_id: Anonymous session ID
            context_updates: Context data to update
            
        Returns:
            Success status
        """
        try:
            # Extend TTL on update
            current_time = datetime.utcnow()
            new_ttl = int((current_time + timedelta(seconds=self.anonymous_ttl)).timestamp())
            
            # Update context data
            self.session_context_table.update_item(
                Key={'sessionId': session_id},
                UpdateExpression='SET contextData = :context, ttl = :ttl',
                ExpressionAttributeValues={
                    ':context': context_updates,
                    ':ttl': new_ttl
                }
            )
            
            logger.info(f"✅ Anonymous session context updated: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to update anonymous context {session_id}: {e}")
            return False
    
    def cleanup_anonymous_session(self, session_id: str) -> bool:
        """
        Manually cleanup anonymous session (TTL handles automatic cleanup)
        
        Args:
            session_id: Anonymous session ID
            
        Returns:
            Success status
        """
        try:
            self.session_context_table.delete_item(Key={'sessionId': session_id})
            logger.info(f"🗑️ Anonymous session cleaned up: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to cleanup anonymous session {session_id}: {e}")
            return False
    
    # ==========================================
    # AUTHENTICATED USER METHODS (Persistent)
    # ==========================================
    
    def get_user_vehicles(self) -> List[Dict[str, Any]]:
        """
        Get user's vehicle library (max 10 vehicles)
        
        Returns:
            List of user vehicles
        """
        try:
            response = self.vehicle_table.query(
                IndexName='UserVehiclesIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id},
                ScanIndexForward=False  # Most recently used first
            )
            
            vehicles = response.get('Items', [])
            logger.info(f"✅ Retrieved {len(vehicles)} vehicles for user: {self.user_id}")
            return vehicles
            
        except Exception as e:
            logger.error(f"❌ Failed to get user vehicles for {self.user_id}: {e}")
            return []
    
    def add_user_vehicle(self, vehicle_data: Dict[str, Any]) -> Optional[str]:
        """
        Add vehicle to user's library (enforce 10-vehicle limit)
        
        Args:
            vehicle_data: Vehicle information (basic + optional VIN)
            
        Returns:
            Vehicle ID if successful, None if failed
        """
        try:
            # Check vehicle limit
            current_vehicles = self.get_user_vehicles()
            if len(current_vehicles) >= self.max_vehicles:
                logger.warning(f"⚠️ Vehicle limit reached for user {self.user_id}: {len(current_vehicles)}/{self.max_vehicles}")
                return None
            
            # Generate vehicle ID
            vehicle_id = f"vehicle-{uuid.uuid4().hex[:8]}"
            current_time = datetime.utcnow().isoformat()
            
            # Prepare vehicle record
            vehicle_record = {
                'id': vehicle_id,
                'userId': self.user_id,
                'vehicleData': {
                    'basic': vehicle_data.get('basic', {}),
                    'vin': vehicle_data.get('vin'),
                    'nickname': vehicle_data.get('nickname'),
                    'created_at': current_time,
                    'last_used': current_time,
                    'usage_count': 1
                }
            }
            
            # Store vehicle
            self.vehicle_table.put_item(Item=vehicle_record)
            
            logger.info(f"✅ Vehicle added for user {self.user_id}: {vehicle_id}")
            return vehicle_id
            
        except Exception as e:
            logger.error(f"❌ Failed to add vehicle for user {self.user_id}: {e}")
            return None
    
    def update_vehicle_usage(self, vehicle_id: str) -> bool:
        """
        Update vehicle usage statistics
        
        Args:
            vehicle_id: Vehicle ID to update
            
        Returns:
            Success status
        """
        try:
            current_time = datetime.utcnow().isoformat()
            
            self.vehicle_table.update_item(
                Key={'id': vehicle_id},
                UpdateExpression='SET vehicleData.last_used = :time, vehicleData.usage_count = vehicleData.usage_count + :inc',
                ExpressionAttributeValues={
                    ':time': current_time,
                    ':inc': 1
                }
            )
            
            logger.info(f"✅ Vehicle usage updated: {vehicle_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to update vehicle usage {vehicle_id}: {e}")
            return False
    
    def get_chat_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get user's chat sessions
        
        Args:
            limit: Maximum number of sessions to return
            
        Returns:
            List of chat sessions
        """
        try:
            response = self.conversation_table.query(
                IndexName='UserConversationsIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id},
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
            
            sessions = response.get('Items', [])
            logger.info(f"✅ Retrieved {len(sessions)} chat sessions for user: {self.user_id}")
            return sessions
            
        except Exception as e:
            logger.error(f"❌ Failed to get chat sessions for {self.user_id}: {e}")
            return []
    
    def create_chat_session(self, vehicle_id: Optional[str] = None, title: Optional[str] = None) -> Optional[str]:
        """
        Create new chat session for authenticated user
        
        Args:
            vehicle_id: Optional vehicle ID for vehicle-specific chat
            title: Optional custom title (auto-generated if not provided)
            
        Returns:
            Session ID if successful
        """
        try:
            session_id = f"conv-{int(time.time() * 1000)}"
            current_time = datetime.utcnow().isoformat()
            
            # Auto-generate title if not provided
            if not title:
                if vehicle_id:
                    # Get vehicle info for title
                    vehicle = self.get_vehicle_by_id(vehicle_id)
                    if vehicle:
                        vehicle_info = vehicle.get('vehicleData', {}).get('basic', {})
                        title = f"{vehicle_info.get('year', '')} {vehicle_info.get('make', '')} {vehicle_info.get('model', '')} - New Chat".strip()
                    else:
                        title = f"Chat Session - {datetime.utcnow().strftime('%b %d, %Y')}"
                else:
                    title = f"Chat Session - {datetime.utcnow().strftime('%b %d, %Y')}"
            
            # Create session record
            session_record = {
                'id': session_id,
                'userId': self.user_id,
                'createdAt': current_time,
                'sessionData': {
                    'title': title,
                    'vehicleId': vehicle_id,
                    'diagnostic_level': 'quick',
                    'preferences': {
                        'parts_preference': 'equivalent',
                        'cost_display': 'summary'
                    },
                    'interaction_summary': {
                        'diagnosed_issues': [],
                        'parts_discussed': [],
                        'cost_estimates_provided': False
                    },
                    'last_accessed': current_time,
                    'message_count': 0,
                    'is_active': True
                }
            }
            
            # Store session
            self.conversation_table.put_item(Item=session_record)
            
            # Update vehicle usage if vehicle selected
            if vehicle_id:
                self.update_vehicle_usage(vehicle_id)
            
            logger.info(f"✅ Chat session created: {session_id} for user: {self.user_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"❌ Failed to create chat session for user {self.user_id}: {e}")
            return None
    
    def get_session_context(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session context for authenticated user
        
        Args:
            session_id: Session ID
            
        Returns:
            Session context or None if not found
        """
        try:
            response = self.conversation_table.get_item(Key={'id': session_id})
            
            if 'Item' not in response:
                logger.info(f"🔍 No session found: {session_id}")
                return None
            
            session_data = response['Item']
            
            # Verify user ownership
            if session_data.get('userId') != self.user_id:
                logger.warning(f"⚠️ Session access denied: {session_id} for user: {self.user_id}")
                return None
            
            logger.info(f"✅ Session context retrieved: {session_id}")
            return session_data.get('sessionData', {})
            
        except Exception as e:
            logger.error(f"❌ Failed to get session context {session_id}: {e}")
            return None
    
    def update_session_context(self, session_id: str, context_updates: Dict[str, Any]) -> bool:
        """
        Update session context for authenticated user
        
        Args:
            session_id: Session ID
            context_updates: Context updates to apply
            
        Returns:
            Success status
        """
        try:
            current_time = datetime.utcnow().isoformat()
            
            # Build update expression
            update_expression = "SET sessionData.last_accessed = :time"
            expression_values = {':time': current_time}
            
            # Add context updates
            for key, value in context_updates.items():
                update_expression += f", sessionData.{key} = :{key}"
                expression_values[f":{key}"] = value
            
            self.conversation_table.update_item(
                Key={'id': session_id},
                UpdateExpression=update_expression,
                ConditionExpression='userId = :user_id',
                ExpressionAttributeValues={**expression_values, ':user_id': self.user_id}
            )
            
            logger.info(f"✅ Session context updated: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to update session context {session_id}: {e}")
            return False
    
    def update_session_title(self, session_id: str, title: str) -> bool:
        """
        Update session title (user-editable)
        
        Args:
            session_id: Session ID
            title: New title
            
        Returns:
            Success status
        """
        return self.update_session_context(session_id, {'title': title})
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete chat session (authenticated users only)
        
        Args:
            session_id: Session ID to delete
            
        Returns:
            Success status
        """
        try:
            self.conversation_table.delete_item(
                Key={'id': session_id},
                ConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id}
            )
            
            logger.info(f"🗑️ Session deleted: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete session {session_id}: {e}")
            return False
    
    # ==========================================
    # PRIVACY CONTROLS
    # ==========================================
    
    def clear_vehicle_data(self, vehicle_id: str) -> bool:
        """
        Clear specific vehicle data (privacy control)
        
        Args:
            vehicle_id: Vehicle ID to clear
            
        Returns:
            Success status
        """
        try:
            self.vehicle_table.delete_item(
                Key={'id': vehicle_id},
                ConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id}
            )
            
            logger.info(f"🗑️ Vehicle data cleared: {vehicle_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to clear vehicle data {vehicle_id}: {e}")
            return False
    
    def clear_all_user_data(self) -> bool:
        """
        Clear all user data (privacy control)
        
        Returns:
            Success status
        """
        try:
            # Clear all vehicles
            vehicles = self.get_user_vehicles()
            for vehicle in vehicles:
                self.clear_vehicle_data(vehicle['id'])
            
            # Clear all sessions
            sessions = self.get_chat_sessions()
            for session in sessions:
                self.delete_session(session['id'])
            
            logger.info(f"🗑️ All user data cleared for: {self.user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to clear all user data for {self.user_id}: {e}")
            return False
    
    # ==========================================
    # UTILITY METHODS
    # ==========================================
    
    def get_vehicle_by_id(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        """
        Get vehicle by ID (with user ownership check)
        
        Args:
            vehicle_id: Vehicle ID
            
        Returns:
            Vehicle data or None
        """
        try:
            response = self.vehicle_table.get_item(Key={'id': vehicle_id})
            
            if 'Item' not in response:
                return None
            
            vehicle = response['Item']
            
            # Verify user ownership
            if vehicle.get('userId') != self.user_id:
                logger.warning(f"⚠️ Vehicle access denied: {vehicle_id} for user: {self.user_id}")
                return None
            
            return vehicle
            
        except Exception as e:
            logger.error(f"❌ Failed to get vehicle {vehicle_id}: {e}")
            return None
    
    def generate_session_title(self, first_message: str, vehicle_info: Optional[Dict] = None) -> str:
        """
        Generate smart session title from first message and vehicle info
        
        Args:
            first_message: User's first message
            vehicle_info: Optional vehicle information
            
        Returns:
            Generated title
        """
        try:
            # Extract problem type from message
            problem_keywords = {
                'brake': 'Brake Issues',
                'engine': 'Engine Problems', 
                'transmission': 'Transmission Issues',
                'battery': 'Battery Problems',
                'tire': 'Tire Issues',
                'oil': 'Oil Service',
                'noise': 'Noise Diagnosis',
                'leak': 'Leak Diagnosis',
                'light': 'Warning Light',
                'start': 'Starting Problems'
            }
            
            problem_type = 'General Issue'
            message_lower = first_message.lower()
            
            for keyword, issue_type in problem_keywords.items():
                if keyword in message_lower:
                    problem_type = issue_type
                    break
            
            # Build title with vehicle info
            if vehicle_info:
                basic_info = vehicle_info.get('basic', {})
                vehicle_desc = f"{basic_info.get('year', '')} {basic_info.get('make', '')} {basic_info.get('model', '')}".strip()
                if vehicle_desc:
                    return f"{vehicle_desc} - {problem_type}"
            
            # Fallback to problem type with timestamp
            return f"{problem_type} - {datetime.utcnow().strftime('%b %d, %Y')}"
            
        except Exception as e:
            logger.error(f"❌ Failed to generate session title: {e}")
            return f"Chat Session - {datetime.utcnow().strftime('%b %d, %Y')}"
