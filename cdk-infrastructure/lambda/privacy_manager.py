"""
Privacy Manager - GDPR/CCPA Compliance Service
Phase 5: Privacy & Data Management Implementation
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

class PrivacyManager:
    """
    GDPR/CCPA compliant privacy management service
    Handles data retention, deletion, export, and user privacy controls
    """
    
    def __init__(self, user_id: str, region_name: str = 'us-west-2'):
        self.user_id = user_id
        self.region_name = region_name
        
        # Initialize AWS clients
        self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
        self.s3 = boto3.client('s3', region_name=region_name)
        
        # Table references
        self.conversation_table = self.dynamodb.Table(os.environ['CONVERSATION_TABLE'])
        self.message_table = self.dynamodb.Table(os.environ['MESSAGE_TABLE'])
        self.vehicle_table = self.dynamodb.Table(os.environ['VEHICLE_TABLE'])
        self.session_context_table = self.dynamodb.Table(os.environ['SESSION_CONTEXT_TABLE'])
        
        # S3 bucket for session data
        self.session_bucket = os.environ.get('SESSION_BUCKET', 'dixon-smart-repair-sessions-041063310146')
        
        logger.info(f"PrivacyManager initialized for user: {user_id}")
    
    # ==========================================
    # DATA EXPORT METHODS (GDPR Article 20)
    # ==========================================
    
    def export_user_data(self, export_format: str = 'json') -> Dict[str, Any]:
        """
        Export all user data in compliance with GDPR Article 20 (Right to Data Portability)
        
        Args:
            export_format: Format for export ('json', 'csv', 'xml')
            
        Returns:
            Dictionary containing all user data and export metadata
        """
        try:
            logger.info(f"Starting data export for user: {self.user_id}")
            
            export_data = {
                'export_metadata': {
                    'user_id': self.user_id,
                    'export_timestamp': datetime.utcnow().isoformat(),
                    'export_format': export_format,
                    'gdpr_compliance': True,
                    'data_controller': 'Dixon Smart Repair',
                    'export_version': '1.0'
                },
                'user_conversations': self._export_conversations(),
                'user_messages': self._export_messages(),
                'user_vehicles': self._export_vehicles(),
                'session_data': self._export_session_data(),
                'privacy_settings': self._get_privacy_settings()
            }
            
            # Calculate data summary
            export_data['data_summary'] = {
                'total_conversations': len(export_data['user_conversations']),
                'total_messages': len(export_data['user_messages']),
                'total_vehicles': len(export_data['user_vehicles']),
                'data_retention_period': self._get_data_retention_period(),
                'last_activity': self._get_last_activity_date()
            }
            
            logger.info(f"Data export completed for user: {self.user_id}")
            return export_data
            
        except Exception as e:
            logger.error(f"Failed to export user data: {e}")
            raise
    
    def _export_conversations(self) -> List[Dict[str, Any]]:
        """Export all user conversations"""
        try:
            response = self.conversation_table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id}
            )
            
            conversations = []
            for item in response.get('Items', []):
                # Remove internal metadata, keep user-relevant data
                conversation = {
                    'conversation_id': item.get('id'),
                    'created_at': item.get('createdAt'),
                    'last_accessed': item.get('sessionData', {}).get('last_accessed'),
                    'title': item.get('sessionData', {}).get('title', 'Untitled Session'),
                    'message_count': item.get('sessionData', {}).get('message_count', 0),
                    'diagnostic_level': item.get('sessionData', {}).get('diagnostic_level'),
                    'diagnostic_accuracy': item.get('sessionData', {}).get('diagnostic_accuracy'),
                    'vin_enhanced': item.get('sessionData', {}).get('vin_enhanced', False),
                    'vehicle_info': item.get('sessionData', {}).get('vehicleId')
                }
                conversations.append(conversation)
            
            return conversations
            
        except Exception as e:
            logger.error(f"Failed to export conversations: {e}")
            return []
    
    def _export_messages(self) -> List[Dict[str, Any]]:
        """Export all user messages"""
        try:
            # Get all conversations first
            conversations = self._export_conversations()
            all_messages = []
            
            for conversation in conversations:
                conversation_id = conversation['conversation_id']
                
                # Query messages for this conversation
                response = self.message_table.query(
                    KeyConditionExpression='conversationId = :conv_id',
                    ExpressionAttributeValues={':conv_id': conversation_id}
                )
                
                for item in response.get('Items', []):
                    message = {
                        'conversation_id': conversation_id,
                        'timestamp': item.get('timestamp'),
                        'sender': item.get('sender'),
                        'content': item.get('content'),
                        'message_type': item.get('type'),
                        'diagnostic_context': item.get('session_context', {}).get('diagnostic_level')
                    }
                    all_messages.append(message)
            
            return all_messages
            
        except Exception as e:
            logger.error(f"Failed to export messages: {e}")
            return []
    
    def _export_vehicles(self) -> List[Dict[str, Any]]:
        """Export all user vehicles"""
        try:
            response = self.vehicle_table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id}
            )
            
            vehicles = []
            for item in response.get('Items', []):
                vehicle = {
                    'vehicle_id': item.get('id'),
                    'make': item.get('vehicleData', {}).get('basic', {}).get('make'),
                    'model': item.get('vehicleData', {}).get('basic', {}).get('model'),
                    'year': item.get('vehicleData', {}).get('basic', {}).get('year'),
                    'nickname': item.get('vehicleData', {}).get('basic', {}).get('nickname'),
                    'vin': item.get('vehicleData', {}).get('vin', {}).get('vin'),
                    'vin_verified': item.get('vehicleData', {}).get('vin', {}).get('verified', False),
                    'created_at': item.get('vehicleData', {}).get('created_at'),
                    'last_used': item.get('vehicleData', {}).get('last_used'),
                    'usage_count': item.get('vehicleData', {}).get('usage_count', 0)
                }
                vehicles.append(vehicle)
            
            return vehicles
            
        except Exception as e:
            logger.error(f"Failed to export vehicles: {e}")
            return []
    
    def _export_session_data(self) -> Dict[str, Any]:
        """Export S3 session data"""
        try:
            session_data = {
                'session_files': [],
                'total_sessions': 0
            }
            
            # List all session files for this user in S3
            prefix = f"production/{self.user_id}/"
            
            response = self.s3.list_objects_v2(
                Bucket=self.session_bucket,
                Prefix=prefix
            )
            
            for obj in response.get('Contents', []):
                session_file = {
                    'file_key': obj['Key'],
                    'last_modified': obj['LastModified'].isoformat(),
                    'size_bytes': obj['Size']
                }
                session_data['session_files'].append(session_file)
            
            session_data['total_sessions'] = len(session_data['session_files'])
            return session_data
            
        except Exception as e:
            logger.error(f"Failed to export session data: {e}")
            return {'session_files': [], 'total_sessions': 0}
    
    # ==========================================
    # DATA DELETION METHODS (GDPR Article 17)
    # ==========================================
    
    def delete_all_user_data(self, confirmation_token: str) -> Dict[str, Any]:
        """
        Delete all user data in compliance with GDPR Article 17 (Right to Erasure)
        
        Args:
            confirmation_token: Security token to confirm deletion intent
            
        Returns:
            Dictionary with deletion results
        """
        try:
            logger.info(f"Starting complete data deletion for user: {self.user_id}")
            
            # Verify confirmation token (simple implementation)
            expected_token = f"DELETE-{self.user_id}-{int(time.time() // 3600)}"  # Hourly token
            if confirmation_token != expected_token:
                raise ValueError("Invalid confirmation token")
            
            deletion_results = {
                'user_id': self.user_id,
                'deletion_timestamp': datetime.utcnow().isoformat(),
                'gdpr_compliance': True,
                'deletion_results': {}
            }
            
            # Delete conversations
            deletion_results['deletion_results']['conversations'] = self._delete_user_conversations()
            
            # Delete messages
            deletion_results['deletion_results']['messages'] = self._delete_user_messages()
            
            # Delete vehicles
            deletion_results['deletion_results']['vehicles'] = self._delete_user_vehicles()
            
            # Delete session data from S3
            deletion_results['deletion_results']['session_data'] = self._delete_user_session_data()
            
            # Delete session context
            deletion_results['deletion_results']['session_context'] = self._delete_user_session_context()
            
            logger.info(f"Complete data deletion completed for user: {self.user_id}")
            return deletion_results
            
        except Exception as e:
            logger.error(f"Failed to delete user data: {e}")
            raise
    
    def delete_specific_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """Delete a specific conversation and its messages"""
        try:
            logger.info(f"Deleting conversation: {conversation_id} for user: {self.user_id}")
            
            # Verify conversation belongs to user
            conversation = self.conversation_table.get_item(Key={'id': conversation_id})
            if not conversation.get('Item') or conversation['Item'].get('userId') != self.user_id:
                raise ValueError("Conversation not found or access denied")
            
            deletion_results = {
                'conversation_id': conversation_id,
                'deletion_timestamp': datetime.utcnow().isoformat(),
                'deleted_items': {}
            }
            
            # Delete conversation messages
            messages_deleted = self._delete_conversation_messages(conversation_id)
            deletion_results['deleted_items']['messages'] = messages_deleted
            
            # Delete conversation record
            self.conversation_table.delete_item(Key={'id': conversation_id})
            deletion_results['deleted_items']['conversation'] = 1
            
            # Delete S3 session data for this conversation
            session_data_deleted = self._delete_conversation_session_data(conversation_id)
            deletion_results['deleted_items']['session_data'] = session_data_deleted
            
            logger.info(f"Conversation deletion completed: {conversation_id}")
            return deletion_results
            
        except Exception as e:
            logger.error(f"Failed to delete conversation: {e}")
            raise
    
    def delete_specific_vehicle(self, vehicle_id: str) -> Dict[str, Any]:
        """Delete a specific vehicle"""
        try:
            logger.info(f"Deleting vehicle: {vehicle_id} for user: {self.user_id}")
            
            # Verify vehicle belongs to user
            vehicle = self.vehicle_table.get_item(Key={'id': vehicle_id})
            if not vehicle.get('Item') or vehicle['Item'].get('userId') != self.user_id:
                raise ValueError("Vehicle not found or access denied")
            
            # Delete vehicle record
            self.vehicle_table.delete_item(Key={'id': vehicle_id})
            
            deletion_result = {
                'vehicle_id': vehicle_id,
                'deletion_timestamp': datetime.utcnow().isoformat(),
                'deleted_items': {'vehicle': 1}
            }
            
            logger.info(f"Vehicle deletion completed: {vehicle_id}")
            return deletion_result
            
        except Exception as e:
            logger.error(f"Failed to delete vehicle: {e}")
            raise
    
    # ==========================================
    # PRIVACY SETTINGS METHODS
    # ==========================================
    
    def get_privacy_settings(self) -> Dict[str, Any]:
        """Get user's privacy settings"""
        return self._get_privacy_settings()
    
    def update_privacy_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update user's privacy settings"""
        try:
            logger.info(f"Updating privacy settings for user: {self.user_id}")
            
            # Validate settings
            valid_settings = self._validate_privacy_settings(settings)
            
            # Store in DynamoDB (we'll use the conversation table with a special record)
            privacy_record = {
                'id': f"privacy-{self.user_id}",
                'userId': self.user_id,
                'recordType': 'privacy_settings',
                'settings': valid_settings,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            self.conversation_table.put_item(Item=privacy_record)
            
            logger.info(f"Privacy settings updated for user: {self.user_id}")
            return valid_settings
            
        except Exception as e:
            logger.error(f"Failed to update privacy settings: {e}")
            raise
    
    def _get_privacy_settings(self) -> Dict[str, Any]:
        """Get privacy settings from DynamoDB"""
        try:
            response = self.conversation_table.get_item(
                Key={'id': f"privacy-{self.user_id}"}
            )
            
            if response.get('Item'):
                return response['Item'].get('settings', self._get_default_privacy_settings())
            else:
                return self._get_default_privacy_settings()
                
        except Exception as e:
            logger.error(f"Failed to get privacy settings: {e}")
            return self._get_default_privacy_settings()
    
    def _get_default_privacy_settings(self) -> Dict[str, Any]:
        """Get default privacy settings"""
        return {
            'data_retention_days': 365,  # 1 year default
            'allow_data_processing': True,
            'allow_diagnostic_improvements': True,
            'allow_service_communications': True,
            'data_sharing_consent': False,
            'marketing_consent': False,
            'analytics_consent': True,
            'created_at': datetime.utcnow().isoformat(),
            'gdpr_consent_version': '1.0',
            'ccpa_opt_out': False
        }
    
    def _validate_privacy_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Validate privacy settings"""
        valid_settings = self._get_default_privacy_settings()
        
        # Update with provided settings
        for key, value in settings.items():
            if key in valid_settings:
                if isinstance(value, bool) and key.endswith(('_consent', '_opt_out', 'allow_')):
                    valid_settings[key] = value
                elif key == 'data_retention_days' and isinstance(value, int) and 30 <= value <= 2555:  # 30 days to 7 years
                    valid_settings[key] = value
                elif key == 'gdpr_consent_version' and isinstance(value, str):
                    valid_settings[key] = value
        
        valid_settings['updated_at'] = datetime.utcnow().isoformat()
        return valid_settings
    
    # ==========================================
    # DATA RETENTION METHODS
    # ==========================================
    
    def _get_data_retention_period(self) -> int:
        """Get user's data retention period in days"""
        settings = self._get_privacy_settings()
        return settings.get('data_retention_days', 365)
    
    def _get_last_activity_date(self) -> Optional[str]:
        """Get user's last activity date"""
        try:
            # Get most recent conversation
            response = self.conversation_table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id},
                ScanIndexForward=False,  # Descending order
                Limit=1
            )
            
            items = response.get('Items', [])
            if items:
                return items[0].get('sessionData', {}).get('last_accessed')
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get last activity date: {e}")
            return None
    
    # ==========================================
    # HELPER METHODS FOR DELETION
    # ==========================================
    
    def _delete_user_conversations(self) -> int:
        """Delete all user conversations"""
        try:
            response = self.conversation_table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id}
            )
            
            deleted_count = 0
            for item in response.get('Items', []):
                self.conversation_table.delete_item(Key={'id': item['id']})
                deleted_count += 1
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to delete conversations: {e}")
            return 0
    
    def _delete_user_messages(self) -> int:
        """Delete all user messages"""
        try:
            conversations = self._export_conversations()
            total_deleted = 0
            
            for conversation in conversations:
                deleted = self._delete_conversation_messages(conversation['conversation_id'])
                total_deleted += deleted
            
            return total_deleted
            
        except Exception as e:
            logger.error(f"Failed to delete messages: {e}")
            return 0
    
    def _delete_conversation_messages(self, conversation_id: str) -> int:
        """Delete messages for a specific conversation"""
        try:
            response = self.message_table.query(
                KeyConditionExpression='conversationId = :conv_id',
                ExpressionAttributeValues={':conv_id': conversation_id}
            )
            
            deleted_count = 0
            for item in response.get('Items', []):
                self.message_table.delete_item(
                    Key={
                        'conversationId': item['conversationId'],
                        'timestamp': item['timestamp']
                    }
                )
                deleted_count += 1
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to delete conversation messages: {e}")
            return 0
    
    def _delete_user_vehicles(self) -> int:
        """Delete all user vehicles"""
        try:
            response = self.vehicle_table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': self.user_id}
            )
            
            deleted_count = 0
            for item in response.get('Items', []):
                self.vehicle_table.delete_item(Key={'id': item['id']})
                deleted_count += 1
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to delete vehicles: {e}")
            return 0
    
    def _delete_user_session_data(self) -> int:
        """Delete all user session data from S3"""
        try:
            prefix = f"production/{self.user_id}/"
            
            response = self.s3.list_objects_v2(
                Bucket=self.session_bucket,
                Prefix=prefix
            )
            
            deleted_count = 0
            for obj in response.get('Contents', []):
                self.s3.delete_object(
                    Bucket=self.session_bucket,
                    Key=obj['Key']
                )
                deleted_count += 1
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to delete session data: {e}")
            return 0
    
    def _delete_conversation_session_data(self, conversation_id: str) -> int:
        """Delete session data for a specific conversation"""
        try:
            prefix = f"production/{conversation_id}/"
            
            response = self.s3.list_objects_v2(
                Bucket=self.session_bucket,
                Prefix=prefix
            )
            
            deleted_count = 0
            for obj in response.get('Contents', []):
                self.s3.delete_object(
                    Bucket=self.session_bucket,
                    Key=obj['Key']
                )
                deleted_count += 1
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to delete conversation session data: {e}")
            return 0
    
    def _delete_user_session_context(self) -> int:
        """Delete user session context records"""
        try:
            # For anonymous users, delete session context records
            if self.user_id.startswith('anon-session-'):
                self.session_context_table.delete_item(Key={'sessionId': self.user_id})
                return 1
            
            return 0
            
        except Exception as e:
            logger.error(f"Failed to delete session context: {e}")
            return 0
    
    # ==========================================
    # COMPLIANCE METHODS
    # ==========================================
    
    def generate_deletion_confirmation_token(self) -> str:
        """Generate a time-based confirmation token for data deletion"""
        return f"DELETE-{self.user_id}-{int(time.time() // 3600)}"
    
    def get_data_processing_record(self) -> Dict[str, Any]:
        """Get record of data processing activities (GDPR Article 30)"""
        try:
            export_data = self.export_user_data()
            
            processing_record = {
                'user_id': self.user_id,
                'data_controller': 'Dixon Smart Repair',
                'processing_purposes': [
                    'Automotive diagnostic assistance',
                    'Vehicle information management',
                    'Session management and user experience',
                    'Service improvement and analytics'
                ],
                'data_categories': [
                    'Vehicle information (make, model, year, VIN)',
                    'Diagnostic conversations and messages',
                    'User preferences and settings',
                    'Session and usage data'
                ],
                'data_subjects': ['Vehicle owners and automotive service seekers'],
                'recipients': ['Internal systems only - no third-party sharing'],
                'retention_period': f"{self._get_data_retention_period()} days",
                'security_measures': [
                    'Encryption in transit and at rest',
                    'Access controls and authentication',
                    'Regular security assessments',
                    'Data minimization practices'
                ],
                'data_summary': export_data['data_summary'],
                'last_updated': datetime.utcnow().isoformat()
            }
            
            return processing_record
            
        except Exception as e:
            logger.error(f"Failed to generate processing record: {e}")
            raise
