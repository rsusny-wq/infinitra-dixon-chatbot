#!/usr/bin/env python3
"""
Dixon Smart Repair - Admin Management Service
Handles shop owner/admin functions: mechanic management, shop settings, analytics
Separate from customer communication for proper separation of concerns
"""

import json
import logging
import time
import uuid
import os
from datetime import datetime
from typing import Dict, Any, List
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
cognito = boto3.client('cognito-idp')

# Environment variables
MECHANICS_TABLE = os.environ.get('MECHANICS_TABLE', 'dixon-mechanics')
SHOP_TABLE = os.environ.get('SHOP_TABLE', 'dixon-shops')
USER_POOL_ID = os.environ.get('USER_POOL_ID')

class AdminManagementService:
    """
    Service class for admin/shop owner functions
    - Mechanic account management
    - Shop settings and configuration
    - Analytics and reporting
    - User role management
    """
    
    def __init__(self):
        self.mechanics_table = dynamodb.Table(MECHANICS_TABLE)
        self.shop_table = dynamodb.Table(SHOP_TABLE)
    
    def create_mechanic_record(self, mechanic_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a mechanic record in DynamoDB when admin creates a mechanic account
        This complements the Cognito user creation done by the frontend
        """
        try:
            logger.info(f"👨‍🔧 Creating mechanic record: {mechanic_data.get('email')}")
            
            mechanic_id = mechanic_data.get('mechanicId') or f"mech-{int(time.time())}-{str(uuid.uuid4())[:8]}"
            
            mechanic_item = {
                'mechanicId': mechanic_id,
                'shopId': mechanic_data['shopId'],
                'userId': mechanic_data['userId'],  # Cognito user ID
                'email': mechanic_data['email'],
                'givenName': mechanic_data['givenName'],
                'familyName': mechanic_data['familyName'],
                'phoneNumber': mechanic_data.get('phoneNumber'),
                'specialties': mechanic_data.get('specialties', []),
                'status': 'active',
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat(),
                'createdBy': mechanic_data.get('createdBy', 'admin'),
                'lastLoginAt': None,
                'totalRequestsHandled': 0,
                'averageRating': Decimal('0.0')
            }
            
            # Save to mechanics table
            self.mechanics_table.put_item(Item=mechanic_item)
            
            logger.info(f"✅ Mechanic record created: {mechanic_id}")
            
            return {
                'success': True,
                'data': mechanic_item
            }
            
        except Exception as e:
            logger.error(f"Error creating mechanic record: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_shop_mechanics(self, shop_id: str) -> Dict[str, Any]:
        """
        Get all mechanics for a shop (for admin dashboard)
        """
        try:
            logger.info(f"🏪 Fetching mechanics for shop: {shop_id}")
            
            # Query using GSI to get all mechanics for the shop
            response = self.mechanics_table.query(
                IndexName='ShopMechanicsIndex',
                KeyConditionExpression=Key('shopId').eq(shop_id),
                ScanIndexForward=False  # Most recent first
            )
            
            mechanics = response.get('Items', [])
            
            # Enrich with additional data if needed
            for mechanic in mechanics:
                # Convert DynamoDB sets to lists for JSON serialization
                if 'specialties' in mechanic and isinstance(mechanic['specialties'], set):
                    mechanic['specialties'] = list(mechanic['specialties'])
                
                # Add computed fields
                mechanic['displayName'] = f"{mechanic['givenName']} {mechanic['familyName']}"
                mechanic['isActive'] = mechanic.get('status') == 'active'
                
                # Add last activity info (could be enhanced with real data)
                if mechanic.get('lastLoginAt'):
                    mechanic['lastActivityText'] = self._format_last_activity(mechanic['lastLoginAt'])
                else:
                    mechanic['lastActivityText'] = 'Never logged in'
            
            logger.info(f"✅ Found {len(mechanics)} mechanics for shop {shop_id}")
            
            return {
                'success': True,
                'data': mechanics,
                'count': len(mechanics)
            }
            
        except Exception as e:
            logger.error(f"Error fetching shop mechanics: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_mechanic_status(self, mechanic_id: str, shop_id: str, status: str) -> Dict[str, Any]:
        """
        Update mechanic status (active/inactive)
        """
        try:
            logger.info(f"🔄 Updating mechanic {mechanic_id} status to: {status}")
            
            # Validate status
            if status not in ['active', 'inactive', 'suspended']:
                return {'success': False, 'error': 'Invalid status. Must be active, inactive, or suspended'}
            
            # Update the mechanic record
            response = self.mechanics_table.update_item(
                Key={
                    'mechanicId': mechanic_id,
                    'shopId': shop_id
                },
                UpdateExpression='SET #status = :status, updatedAt = :updated_at',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': status,
                    ':updated_at': datetime.utcnow().isoformat()
                },
                ReturnValues='ALL_NEW'
            )
            
            updated_mechanic = response.get('Attributes')
            
            logger.info(f"✅ Mechanic status updated: {mechanic_id} -> {status}")
            
            return {
                'success': True,
                'data': updated_mechanic
            }
            
        except Exception as e:
            logger.error(f"Error updating mechanic status: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_shop_analytics(self, shop_id: str, time_range: str = '30d') -> Dict[str, Any]:
        """
        Get shop analytics and metrics for admin dashboard
        """
        try:
            logger.info(f"📊 Fetching analytics for shop: {shop_id}")
            
            # Get mechanics count and status
            mechanics_result = self.get_shop_mechanics(shop_id)
            mechanics = mechanics_result.get('data', []) if mechanics_result.get('success') else []
            
            active_mechanics = len([m for m in mechanics if m.get('status') == 'active'])
            total_mechanics = len(mechanics)
            
            # TODO: Add more analytics from other tables
            # - Total requests handled
            # - Average response time
            # - Customer satisfaction
            # - Revenue metrics
            
            analytics = {
                'shopId': shop_id,
                'timeRange': time_range,
                'mechanics': {
                    'total': total_mechanics,
                    'active': active_mechanics,
                    'inactive': total_mechanics - active_mechanics
                },
                'requests': {
                    'total': 0,  # TODO: Query from requests table
                    'pending': 0,
                    'completed': 0,
                    'averageResponseTime': '0 min'
                },
                'performance': {
                    'customerSatisfaction': 0.0,
                    'completionRate': 0.0,
                    'averageRating': 0.0
                },
                'generatedAt': datetime.utcnow().isoformat()
            }
            
            logger.info(f"✅ Analytics generated for shop {shop_id}")
            
            return {
                'success': True,
                'data': analytics
            }
            
        except Exception as e:
            logger.error(f"Error fetching shop analytics: {e}")
            return {'success': False, 'error': str(e)}
    
    def _format_last_activity(self, last_activity: str) -> str:
        """
        Format last activity timestamp for display
        """
        try:
            last_time = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
            now = datetime.utcnow()
            diff = now - last_time.replace(tzinfo=None)
            
            if diff.days > 0:
                return f"{diff.days} days ago"
            elif diff.seconds > 3600:
                hours = diff.seconds // 3600
                return f"{hours} hours ago"
            elif diff.seconds > 60:
                minutes = diff.seconds // 60
                return f"{minutes} minutes ago"
            else:
                return "Just now"
        except:
            return "Unknown"

# Global instance
admin_management_service = AdminManagementService()

def lambda_handler(event, context):
    """
    Lambda handler for admin management operations
    """
    try:
        # AppSync passes field name in event.info.fieldName
        field_name = event.get('info', {}).get('fieldName', 'unknown')
        logger.info(f"📥 Admin management request: {field_name}")
        
        arguments = event.get('arguments', {})
        
        if field_name == 'createMechanicRecord':
            # Handle input parameter correctly - frontend sends data wrapped in 'input'
            input_data = arguments.get('input', arguments)
            return admin_management_service.create_mechanic_record(input_data)
        
        elif field_name == 'getShopMechanics':
            shop_id = arguments.get('shopId')
            if not shop_id:
                return {'success': False, 'error': 'shopId is required'}
            return admin_management_service.get_shop_mechanics(shop_id)
        
        elif field_name == 'updateMechanicStatus':
            mechanic_id = arguments.get('mechanicId')
            shop_id = arguments.get('shopId')
            status = arguments.get('status')
            
            if not all([mechanic_id, shop_id, status]):
                return {'success': False, 'error': 'mechanicId, shopId, and status are required'}
            
            return admin_management_service.update_mechanic_status(mechanic_id, shop_id, status)
        
        elif field_name == 'getShopAnalytics':
            shop_id = arguments.get('shopId')
            time_range = arguments.get('timeRange', '30d')
            
            if not shop_id:
                return {'success': False, 'error': 'shopId is required'}
            
            return admin_management_service.get_shop_analytics(shop_id, time_range)
        
        else:
            return {'success': False, 'error': f'Unknown field: {field_name}'}
    
    except Exception as e:
        logger.error(f"❌ Lambda handler error: {e}")
        return {'success': False, 'error': str(e)}
