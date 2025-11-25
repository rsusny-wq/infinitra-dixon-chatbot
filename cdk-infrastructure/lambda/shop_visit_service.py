#!/usr/bin/env python3
"""
Dixon Smart Repair - Shop Visit Service Handler
Phase 1.1 - Shop Visit Recognition
Handles shop visit recording, session data loading, and visit management
"""

import json
import logging
import time
import os
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger(__name__)

# AWS clients
dynamodb = boto3.resource('dynamodb')

# Table names from environment
SHOP_VISITS_TABLE = os.environ.get('SHOP_VISITS_TABLE')
CONVERSATION_TABLE = os.environ.get('CONVERSATION_TABLE')
MESSAGE_TABLE = os.environ.get('MESSAGE_TABLE')
VEHICLE_TABLE = os.environ.get('VEHICLE_TABLE')
SHOP_TABLE = os.environ.get('SHOP_TABLE')

class ShopVisitService:
    """
    Service class for handling shop visit operations
    Implements permanent storage with 10-year retention for authenticated users
    """
    
    def __init__(self):
        self.shop_visits_table = dynamodb.Table(SHOP_VISITS_TABLE)
        self.conversation_table = dynamodb.Table(CONVERSATION_TABLE)
        self.message_table = dynamodb.Table(MESSAGE_TABLE)
        self.vehicle_table = dynamodb.Table(VEHICLE_TABLE)
        self.shop_table = dynamodb.Table(SHOP_TABLE)
    
    def convert_floats_to_decimal(self, obj):
        """Convert float values to Decimal for DynamoDB compatibility"""
        if isinstance(obj, float):
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {key: self.convert_floats_to_decimal(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_floats_to_decimal(item) for item in obj]
        else:
            return obj
    
    def record_shop_visit(self, visit_input: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Record a new shop visit with session data for mechanic handoff
        
        Args:
            visit_input: Visit data from GraphQL input
            user_id: Authenticated user ID
            
        Returns:
            Dict with visit data and success status
        """
        try:
            # Generate unique visit ID
            visit_id = f"visit-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
            timestamp = datetime.utcnow().isoformat()
            
            # Validate required fields
            required_fields = ['shopId', 'serviceType']
            for field in required_fields:
                if field not in visit_input:
                    return {
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }
            
            # Collect session data for mechanic handoff
            session_data = self._collect_session_data(
                visit_input.get('sessionData', {}),
                user_id
            )
            
            # Create visit record
            visit_record = {
                'visitId': visit_id,
                'shopId': visit_input['shopId'],
                'userId': user_id,
                'serviceType': visit_input['serviceType'],
                'timestamp': timestamp,
                'status': 'checked_in',
                'sessionData': self.convert_floats_to_decimal(session_data),
                'customerName': visit_input.get('customerName', ''),
                'vehicleInfo': self.convert_floats_to_decimal(visit_input.get('vehicleInfo', {})),
                'estimatedServiceTime': visit_input.get('estimatedServiceTime', 'TBD'),
                'actualServiceTime': None,
                'mechanicNotes': '',
                'createdAt': timestamp,
                'updatedAt': timestamp
            }
            
            # Store visit in DynamoDB
            self.shop_visits_table.put_item(Item=visit_record)
            
            logger.info(f"Shop visit recorded: {visit_id} for user {user_id}")
            
            return {
                'success': True,
                'visit': self._format_visit_for_response(visit_record)
            }
            
        except Exception as e:
            logger.error(f"Failed to record shop visit: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to record visit: {str(e)}'
            }
    
    def _collect_session_data(self, session_input: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Collect comprehensive session data for mechanic handoff
        
        Args:
            session_input: Session data from frontend
            user_id: User ID for data collection
            
        Returns:
            Dict with complete session data
        """
        try:
            session_data = {
                'conversationId': session_input.get('conversationId'),
                'conversationHistory': [],
                'aiDiagnosis': session_input.get('aiDiagnosis'),
                'approvedEstimate': session_input.get('approvedEstimate'),
                'customerPreferences': session_input.get('customerPreferences', {}),
                'specialInstructions': session_input.get('specialInstructions', []),
                'collectedAt': datetime.utcnow().isoformat()
            }
            
            # Load conversation history if conversation ID provided
            if session_input.get('conversationId'):
                conversation_history = self._load_conversation_history(
                    session_input['conversationId'],
                    user_id
                )
                session_data['conversationHistory'] = conversation_history
            
            # Load vehicle information
            vehicle_info = self._load_user_vehicle_info(user_id)
            if vehicle_info:
                session_data['vehicleInfo'] = vehicle_info
            
            return session_data
            
        except Exception as e:
            logger.error(f"Failed to collect session data: {str(e)}")
            return {
                'conversationId': session_input.get('conversationId'),
                'conversationHistory': [],
                'aiDiagnosis': None,
                'approvedEstimate': None,
                'customerPreferences': {},
                'specialInstructions': [],
                'collectedAt': datetime.utcnow().isoformat(),
                'error': f'Failed to collect complete data: {str(e)}'
            }
    
    def _load_conversation_history(self, conversation_id: str, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Load recent conversation messages for mechanic context"""
        try:
            # Query messages for the conversation
            response = self.message_table.query(
                KeyConditionExpression='conversationId = :conv_id',
                ExpressionAttributeValues={':conv_id': conversation_id},
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
            
            messages = []
            for item in response.get('Items', []):
                messages.append({
                    'id': item.get('id', ''),
                    'content': item.get('content', ''),
                    'sender': item.get('sender', ''),
                    'timestamp': item.get('timestamp', ''),
                    'messageType': item.get('messageType', 'communication')
                })
            
            # Reverse to get chronological order
            return list(reversed(messages))
            
        except Exception as e:
            logger.error(f"Failed to load conversation history: {str(e)}")
            return []
    
    def _load_user_vehicle_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Load user's most recent vehicle information"""
        try:
            # Query user's vehicles
            response = self.vehicle_table.query(
                IndexName='UserVehiclesIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': user_id},
                ScanIndexForward=False,  # Most recent first
                Limit=1
            )
            
            items = response.get('Items', [])
            if items:
                vehicle = items[0]
                return {
                    'id': vehicle.get('id', ''),
                    'year': vehicle.get('year'),
                    'make': vehicle.get('make', ''),
                    'model': vehicle.get('model', ''),
                    'vin': vehicle.get('vin', ''),
                    'mileage': vehicle.get('mileage')
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to load vehicle info: {str(e)}")
            return None
    
    def get_user_visits(self, user_id: str, limit: int = 20) -> Dict[str, Any]:
        """
        Get user's visit history
        
        Args:
            user_id: User ID
            limit: Maximum number of visits to return
            
        Returns:
            Dict with visits list and success status
        """
        try:
            response = self.shop_visits_table.query(
                IndexName='UserVisitsIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': user_id},
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
            
            visits = []
            for item in response.get('Items', []):
                visits.append(self._format_visit_for_response(item))
            
            return {
                'success': True,
                'visits': visits
            }
            
        except Exception as e:
            logger.error(f"Failed to get user visits: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to load visits: {str(e)}',
                'visits': []
            }
    
    def get_shop_visits(self, shop_id: str, start_date: Optional[str] = None, 
                       end_date: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        """
        Get shop's visit history with optional date filtering
        
        Args:
            shop_id: Shop ID
            start_date: Optional start date filter (ISO format)
            end_date: Optional end date filter (ISO format)
            limit: Maximum number of visits to return
            
        Returns:
            Dict with visits list and success status
        """
        try:
            # Build query parameters
            query_params = {
                'IndexName': 'ShopVisitsIndex',
                'KeyConditionExpression': 'shopId = :shop_id',
                'ExpressionAttributeValues': {':shop_id': shop_id},
                'ScanIndexForward': False,  # Most recent first
                'Limit': limit
            }
            
            # Add date filtering if provided
            if start_date and end_date:
                query_params['KeyConditionExpression'] += ' AND #ts BETWEEN :start_date AND :end_date'
                query_params['ExpressionAttributeNames'] = {'#ts': 'timestamp'}
                query_params['ExpressionAttributeValues'].update({
                    ':start_date': start_date,
                    ':end_date': end_date
                })
            elif start_date:
                query_params['KeyConditionExpression'] += ' AND #ts >= :start_date'
                query_params['ExpressionAttributeNames'] = {'#ts': 'timestamp'}
                query_params['ExpressionAttributeValues'][':start_date'] = start_date
            
            response = self.shop_visits_table.query(**query_params)
            
            visits = []
            for item in response.get('Items', []):
                visits.append(self._format_visit_for_response(item))
            
            return {
                'success': True,
                'visits': visits
            }
            
        except Exception as e:
            logger.error(f"Failed to get shop visits: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to load shop visits: {str(e)}',
                'visits': []
            }
    
    def get_visit_by_id(self, visit_id: str) -> Dict[str, Any]:
        """
        Get specific visit by ID
        
        Args:
            visit_id: Visit ID
            
        Returns:
            Dict with visit data and success status
        """
        try:
            # Extract timestamp from visit_id for query
            # Format: visit-YYYYMMDD-xxxxxxxx
            date_part = visit_id.split('-')[1] if '-' in visit_id else ''
            
            if not date_part:
                return {
                    'success': False,
                    'error': 'Invalid visit ID format'
                }
            
            # Query by visitId and timestamp pattern
            response = self.shop_visits_table.query(
                KeyConditionExpression='visitId = :visit_id',
                ExpressionAttributeValues={':visit_id': visit_id}
            )
            
            items = response.get('Items', [])
            if not items:
                return {
                    'success': False,
                    'error': 'Visit not found'
                }
            
            visit = self._format_visit_for_response(items[0])
            
            return {
                'success': True,
                'visit': visit
            }
            
        except Exception as e:
            logger.error(f"Failed to get visit by ID: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to load visit: {str(e)}'
            }
    
    def update_visit_status(self, visit_id: str, status: str, mechanic_notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Update visit status and add mechanic notes
        
        Args:
            visit_id: Visit ID
            status: New status
            mechanic_notes: Optional mechanic notes
            
        Returns:
            Dict with updated visit and success status
        """
        try:
            # Build update expression
            update_expression = 'SET #status = :status, updatedAt = :updated_at'
            expression_attribute_names = {'#status': 'status'}
            expression_attribute_values = {
                ':status': status,
                ':updated_at': datetime.utcnow().isoformat()
            }
            
            if mechanic_notes:
                update_expression += ', mechanicNotes = :notes'
                expression_attribute_values[':notes'] = mechanic_notes
            
            # Update the visit
            response = self.shop_visits_table.update_item(
                Key={'visitId': visit_id, 'timestamp': self._extract_timestamp_from_visit_id(visit_id)},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues='ALL_NEW'
            )
            
            updated_visit = self._format_visit_for_response(response['Attributes'])
            
            return {
                'success': True,
                'visit': updated_visit
            }
            
        except Exception as e:
            logger.error(f"Failed to update visit status: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to update visit: {str(e)}'
            }
    
    def _extract_timestamp_from_visit_id(self, visit_id: str) -> str:
        """Extract timestamp from visit ID for DynamoDB operations"""
        # This is a simplified approach - in production, you'd store the timestamp separately
        # or use a different key structure
        return datetime.utcnow().isoformat()
    
    def _format_visit_for_response(self, visit_item: Dict[str, Any]) -> Dict[str, Any]:
        """Format visit item for GraphQL response"""
        return {
            'visitId': visit_item.get('visitId', ''),
            'shopId': visit_item.get('shopId', ''),
            'userId': visit_item.get('userId', ''),
            'serviceType': visit_item.get('serviceType', ''),
            'timestamp': visit_item.get('timestamp', ''),
            'status': visit_item.get('status', ''),
            'sessionData': visit_item.get('sessionData', {}),
            'customerName': visit_item.get('customerName', ''),
            'vehicleInfo': visit_item.get('vehicleInfo', {}),
            'estimatedServiceTime': visit_item.get('estimatedServiceTime', ''),
            'actualServiceTime': visit_item.get('actualServiceTime', ''),
            'mechanicNotes': visit_item.get('mechanicNotes', ''),
            'createdAt': visit_item.get('createdAt', ''),
            'updatedAt': visit_item.get('updatedAt', '')
        }

# Service instance for Lambda handler
shop_visit_service = ShopVisitService()

def handle_record_shop_visit(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """GraphQL resolver for recordShopVisit mutation"""
    try:
        visit_input = event.get('arguments', {}).get('visit', {})
        user_id = event.get('identity', {}).get('sub')
        
        if not user_id:
            return {
                'success': False,
                'error': 'Authentication required'
            }
        
        result = shop_visit_service.record_shop_visit(visit_input, user_id)
        
        if result['success']:
            return result['visit']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"GraphQL recordShopVisit error: {str(e)}")
        raise e

def handle_get_user_visits(event: Dict[str, Any], context: Any) -> List[Dict[str, Any]]:
    """GraphQL resolver for getUserVisits query"""
    try:
        user_id = event.get('arguments', {}).get('userId')
        
        if not user_id:
            raise Exception('User ID required')
        
        result = shop_visit_service.get_user_visits(user_id)
        
        if result['success']:
            return result['visits']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"GraphQL getUserVisits error: {str(e)}")
        raise e

def handle_get_shop_visits(event: Dict[str, Any], context: Any) -> List[Dict[str, Any]]:
    """GraphQL resolver for getShopVisits query"""
    try:
        args = event.get('arguments', {})
        shop_id = args.get('shopId')
        start_date = args.get('startDate')
        end_date = args.get('endDate')
        
        if not shop_id:
            raise Exception('Shop ID required')
        
        result = shop_visit_service.get_shop_visits(shop_id, start_date, end_date)
        
        if result['success']:
            return result['visits']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"GraphQL getShopVisits error: {str(e)}")
        raise e

def handle_get_visit_by_id(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """GraphQL resolver for getVisitById query"""
    try:
        visit_id = event.get('arguments', {}).get('visitId')
        
        if not visit_id:
            raise Exception('Visit ID required')
        
        result = shop_visit_service.get_visit_by_id(visit_id)
        
        if result['success']:
            return result['visit']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"GraphQL getVisitById error: {str(e)}")
        raise e

def handle_update_visit_status(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """GraphQL resolver for updateVisitStatus mutation"""
    try:
        args = event.get('arguments', {})
        visit_id = args.get('visitId')
        status = args.get('status')
        mechanic_notes = args.get('mechanicNotes')
        
        if not visit_id or not status:
            raise Exception('Visit ID and status required')
        
        result = shop_visit_service.update_visit_status(visit_id, status, mechanic_notes)
        
        if result['success']:
            return result['visit']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"GraphQL updateVisitStatus error: {str(e)}")
        raise e
