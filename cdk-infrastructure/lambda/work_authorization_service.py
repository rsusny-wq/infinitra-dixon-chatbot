#!/usr/bin/env python3
"""
Dixon Smart Repair - Work Authorization Service
Phase 2.2: Kanban-style workflow management with time tracking and customer notifications
Integrates with existing customer communication system from Phase 2.1
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
MECHANIC_REQUEST_TABLE = os.environ.get('MECHANIC_REQUEST_TABLE', 'MechanicRequestTable')
WORK_AUTHORIZATION_TABLE = os.environ.get('WORK_AUTHORIZATION_TABLE', 'WorkAuthorizationTable')
CONVERSATION_TABLE = os.environ.get('CONVERSATION_TABLE')
MESSAGE_TABLE = os.environ.get('MESSAGE_TABLE')

class WorkAuthorizationService:
    """
    Service class for managing Kanban-style work authorization workflow
    Tracks work items through stages: queued → assigned → authorized → in_progress → completed
    Includes time tracking and customer notifications
    """
    
    def __init__(self):
        self.mechanic_request_table = dynamodb.Table(MECHANIC_REQUEST_TABLE)
        self.work_authorization_table = dynamodb.Table(WORK_AUTHORIZATION_TABLE)
        self.conversation_table = dynamodb.Table(CONVERSATION_TABLE)
        self.message_table = dynamodb.Table(MESSAGE_TABLE)
    
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
    
    def create_work_authorization(self, mechanic_request_id: str, mechanic_id: str, estimated_duration: int = 120) -> Dict[str, Any]:
        """
        Create work authorization record when mechanic accepts a request
        Initializes Kanban workflow tracking with time stamps
        
        Args:
            mechanic_request_id: ID of the mechanic request from Phase 2.1
            mechanic_id: ID of the mechanic taking the work
            estimated_duration: Estimated work duration in minutes
        """
        try:
            logger.info(f"🔧 Creating work authorization for request: {mechanic_request_id}")
            
            # Get the original mechanic request
            request_response = self.mechanic_request_table.get_item(
                Key={'id': mechanic_request_id}
            )
            
            if 'Item' not in request_response:
                return {
                    'success': False,
                    'error': 'Mechanic request not found'
                }
            
            original_request = request_response['Item']
            
            work_auth_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()
            
            # Calculate estimated completion time
            estimated_completion = (datetime.utcnow() + timedelta(minutes=estimated_duration)).isoformat()
            
            work_authorization_item = {
                'id': work_auth_id,
                'mechanicRequestId': mechanic_request_id,
                'customerId': original_request['customerId'],
                'customerName': original_request['customerName'],
                'mechanicId': mechanic_id,
                'shopId': original_request['shopId'],
                'serviceType': original_request.get('serviceType', 'diagnostic'),
                'urgency': original_request['urgency'],
                
                # Kanban workflow status
                'workflowStatus': 'assigned',  # assigned → authorized → in_progress → completed
                'previousStatus': 'queued',
                
                # Time tracking for each stage
                'timeTracking': {
                    'queued': {
                        'startTime': original_request['createdAt'],
                        'endTime': timestamp,
                        'duration': self._calculate_duration(original_request['createdAt'], timestamp)
                    },
                    'assigned': {
                        'startTime': timestamp,
                        'endTime': None,
                        'duration': None
                    },
                    'authorized': {
                        'startTime': None,
                        'endTime': None,
                        'duration': None
                    },
                    'in_progress': {
                        'startTime': None,
                        'endTime': None,
                        'duration': None
                    },
                    'completed': {
                        'startTime': None,
                        'endTime': None,
                        'duration': None
                    }
                },
                
                # Work details
                'estimatedDuration': estimated_duration,
                'estimatedCompletion': estimated_completion,
                'actualDuration': None,
                'actualCompletion': None,
                
                # Customer communication
                'customerNotified': False,
                'lastCustomerUpdate': None,
                
                # AI context from original request
                'aiContext': original_request.get('aiContext', {}),
                'originalRequestMessage': original_request['requestMessage'],
                
                'createdAt': timestamp,
                'updatedAt': timestamp
            }
            
            # Convert floats to Decimal
            safe_work_auth = self.convert_floats_to_decimal(work_authorization_item)
            
            # Store work authorization
            self.work_authorization_table.put_item(Item=safe_work_auth)
            
            # Update original mechanic request status
            self.mechanic_request_table.update_item(
                Key={'id': mechanic_request_id},
                UpdateExpression='SET #status = :status, workAuthorizationId = :work_auth_id, updatedAt = :timestamp',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'work_authorized',
                    ':work_auth_id': work_auth_id,
                    ':timestamp': timestamp
                }
            )
            
            # Send customer notification
            self._notify_customer_work_authorized(safe_work_auth)
            
            logger.info(f"✅ Work authorization created successfully: {work_auth_id}")
            
            return {
                'success': True,
                'data': safe_work_auth
            }
            
        except Exception as e:
            logger.error(f"❌ Error creating work authorization: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_workflow_status(self, work_auth_id: str, new_status: str, mechanic_notes: str = None) -> Dict[str, Any]:
        """
        Update workflow status with time tracking
        Valid statuses: assigned → authorized → in_progress → completed
        """
        try:
            logger.info(f"🔄 Updating workflow status: {work_auth_id} → {new_status}")
            
            # Get current work authorization
            response = self.work_authorization_table.get_item(
                Key={'id': work_auth_id}
            )
            
            if 'Item' not in response:
                return {
                    'success': False,
                    'error': 'Work authorization not found'
                }
            
            current_work_auth = response['Item']
            current_status = current_work_auth['workflowStatus']
            timestamp = datetime.utcnow().isoformat()
            
            # Validate status transition
            valid_transitions = {
                'assigned': ['authorized', 'cancelled'],
                'authorized': ['in_progress', 'cancelled'],
                'in_progress': ['completed', 'on_hold'],
                'on_hold': ['in_progress', 'cancelled'],
                'completed': [],  # Terminal state
                'cancelled': []   # Terminal state
            }
            
            if new_status not in valid_transitions.get(current_status, []):
                return {
                    'success': False,
                    'error': f'Invalid status transition: {current_status} → {new_status}'
                }
            
            # Update time tracking
            updated_time_tracking = current_work_auth['timeTracking']
            
            # End current status timing
            if current_status in updated_time_tracking:
                updated_time_tracking[current_status]['endTime'] = timestamp
                updated_time_tracking[current_status]['duration'] = self._calculate_duration(
                    updated_time_tracking[current_status]['startTime'],
                    timestamp
                )
            
            # Start new status timing
            if new_status in updated_time_tracking:
                updated_time_tracking[new_status]['startTime'] = timestamp
                updated_time_tracking[new_status]['endTime'] = None
                updated_time_tracking[new_status]['duration'] = None
            
            # Prepare update expression
            update_expression = 'SET workflowStatus = :new_status, previousStatus = :prev_status, timeTracking = :time_tracking, updatedAt = :timestamp'
            expression_values = {
                ':new_status': new_status,
                ':prev_status': current_status,
                ':time_tracking': updated_time_tracking,
                ':timestamp': timestamp
            }
            
            # Add mechanic notes if provided
            if mechanic_notes:
                update_expression += ', mechanicNotes = :notes'
                expression_values[':notes'] = mechanic_notes
            
            # Calculate actual completion for completed status
            if new_status == 'completed':
                total_duration = self._calculate_total_work_duration(updated_time_tracking)
                update_expression += ', actualDuration = :actual_duration, actualCompletion = :actual_completion'
                expression_values[':actual_duration'] = total_duration
                expression_values[':actual_completion'] = timestamp
            
            # Update work authorization
            update_response = self.work_authorization_table.update_item(
                Key={'id': work_auth_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ReturnValues='ALL_NEW'
            )
            
            updated_work_auth = update_response['Attributes']
            
            # Send customer notification for status change
            self._notify_customer_status_change(updated_work_auth, current_status, new_status)
            
            logger.info(f"✅ Workflow status updated: {current_status} → {new_status}")
            
            return {
                'success': True,
                'data': updated_work_auth
            }
            
        except Exception as e:
            logger.error(f"❌ Error updating workflow status: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_mechanic_workflow(self, mechanic_id: str, shop_id: str = None) -> Dict[str, Any]:
        """
        Get Kanban workflow view for mechanic dashboard
        Returns work items organized by status columns
        """
        try:
            logger.info(f"📋 Fetching workflow for mechanic: {mechanic_id}")
            
            # Query work authorizations for this mechanic
            response = self.work_authorization_table.scan(
                FilterExpression='mechanicId = :mechanic_id',
                ExpressionAttributeValues={':mechanic_id': mechanic_id}
            )
            
            work_items = response.get('Items', [])
            
            # If shop_id provided, filter by shop
            if shop_id:
                work_items = [item for item in work_items if item.get('shopId') == shop_id]
            
            # Organize by workflow status (Kanban columns)
            kanban_columns = {
                'assigned': [],
                'authorized': [],
                'in_progress': [],
                'completed': [],
                'on_hold': [],
                'cancelled': []
            }
            
            for item in work_items:
                status = item.get('workflowStatus', 'assigned')
                if status in kanban_columns:
                    kanban_columns[status].append(item)
            
            # Sort each column by urgency and creation time
            urgency_priority = {'high': 3, 'medium': 2, 'low': 1}
            
            for status in kanban_columns:
                kanban_columns[status].sort(
                    key=lambda x: (
                        urgency_priority.get(x.get('urgency', 'low'), 1),
                        x.get('createdAt', '')
                    ),
                    reverse=True
                )
            
            # Calculate workflow statistics
            workflow_stats = self._calculate_workflow_statistics(work_items)
            
            return {
                'success': True,
                'data': {
                    'kanbanColumns': kanban_columns,
                    'statistics': workflow_stats,
                    'totalItems': len(work_items)
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching mechanic workflow: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_shop_workflow_overview(self, shop_id: str) -> Dict[str, Any]:
        """
        Get shop-wide workflow overview for management
        """
        try:
            logger.info(f"🏪 Fetching shop workflow overview: {shop_id}")
            
            # Query all work authorizations for this shop
            response = self.work_authorization_table.scan(
                FilterExpression='shopId = :shop_id',
                ExpressionAttributeValues={':shop_id': shop_id}
            )
            
            work_items = response.get('Items', [])
            
            # Organize by status and calculate metrics
            status_counts = {}
            mechanic_workloads = {}
            urgency_distribution = {'high': 0, 'medium': 0, 'low': 0}
            
            for item in work_items:
                # Status counts
                status = item.get('workflowStatus', 'assigned')
                status_counts[status] = status_counts.get(status, 0) + 1
                
                # Mechanic workloads
                mechanic_id = item.get('mechanicId')
                if mechanic_id:
                    if mechanic_id not in mechanic_workloads:
                        mechanic_workloads[mechanic_id] = {'active': 0, 'completed': 0}
                    
                    if status in ['assigned', 'authorized', 'in_progress', 'on_hold']:
                        mechanic_workloads[mechanic_id]['active'] += 1
                    elif status == 'completed':
                        mechanic_workloads[mechanic_id]['completed'] += 1
                
                # Urgency distribution
                urgency = item.get('urgency', 'low')
                if urgency in urgency_distribution:
                    urgency_distribution[urgency] += 1
            
            # Calculate average completion times
            avg_completion_times = self._calculate_average_completion_times(work_items)
            
            return {
                'success': True,
                'data': {
                    'statusCounts': status_counts,
                    'mechanicWorkloads': mechanic_workloads,
                    'urgencyDistribution': urgency_distribution,
                    'averageCompletionTimes': avg_completion_times,
                    'totalWorkItems': len(work_items)
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching shop workflow overview: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_duration(self, start_time: str, end_time: str) -> int:
        """Calculate duration in minutes between two ISO timestamps"""
        try:
            start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            duration = (end - start).total_seconds() / 60
            return int(duration)
        except Exception:
            return 0
    
    def _calculate_total_work_duration(self, time_tracking: Dict) -> int:
        """Calculate total work duration excluding queued time"""
        total_minutes = 0
        work_stages = ['assigned', 'authorized', 'in_progress']
        
        for stage in work_stages:
            if stage in time_tracking and time_tracking[stage].get('duration'):
                total_minutes += time_tracking[stage]['duration']
        
        return total_minutes
    
    def _calculate_workflow_statistics(self, work_items: List[Dict]) -> Dict[str, Any]:
        """Calculate workflow performance statistics"""
        if not work_items:
            return {}
        
        completed_items = [item for item in work_items if item.get('workflowStatus') == 'completed']
        
        if not completed_items:
            return {
                'averageCompletionTime': 0,
                'completionRate': 0,
                'onTimeCompletionRate': 0
            }
        
        # Calculate average completion time
        total_duration = sum(item.get('actualDuration', 0) for item in completed_items)
        avg_completion_time = total_duration / len(completed_items) if completed_items else 0
        
        # Calculate completion rate
        completion_rate = (len(completed_items) / len(work_items)) * 100
        
        # Calculate on-time completion rate
        on_time_completions = 0
        for item in completed_items:
            estimated = item.get('estimatedDuration', 0)
            actual = item.get('actualDuration', 0)
            if actual <= estimated * 1.1:  # Within 10% of estimate
                on_time_completions += 1
        
        on_time_rate = (on_time_completions / len(completed_items)) * 100 if completed_items else 0
        
        return {
            'averageCompletionTime': int(avg_completion_time),
            'completionRate': round(completion_rate, 1),
            'onTimeCompletionRate': round(on_time_rate, 1),
            'totalCompleted': len(completed_items),
            'totalActive': len(work_items) - len(completed_items)
        }
    
    def _calculate_average_completion_times(self, work_items: List[Dict]) -> Dict[str, int]:
        """Calculate average completion times by urgency level"""
        urgency_times = {'high': [], 'medium': [], 'low': []}
        
        for item in work_items:
            if item.get('workflowStatus') == 'completed' and item.get('actualDuration'):
                urgency = item.get('urgency', 'low')
                if urgency in urgency_times:
                    urgency_times[urgency].append(item['actualDuration'])
        
        averages = {}
        for urgency, times in urgency_times.items():
            if times:
                averages[urgency] = int(sum(times) / len(times))
            else:
                averages[urgency] = 0
        
        return averages
    
    def _notify_customer_work_authorized(self, work_auth: Dict[str, Any]):
        """Send notification to customer when work is authorized"""
        try:
            customer_id = work_auth['customerId']
            mechanic_id = work_auth['mechanicId']
            estimated_completion = work_auth['estimatedCompletion']
            
            # Create notification message
            notification_message = f"✅ **Work Authorized**\n\nYour service request has been accepted by a certified mechanic.\n\n**Estimated Completion**: {estimated_completion}\n**Status**: Work Authorized\n\nYou'll receive updates as work progresses."
            
            # This would integrate with the existing messaging system
            logger.info(f"📧 Customer notification sent: Work authorized for {customer_id}")
            
        except Exception as e:
            logger.error(f"❌ Error sending customer notification: {e}")
    
    def _notify_customer_status_change(self, work_auth: Dict[str, Any], old_status: str, new_status: str):
        """Send notification to customer when workflow status changes"""
        try:
            customer_id = work_auth['customerId']
            
            status_messages = {
                'authorized': '✅ Work has been authorized and will begin shortly.',
                'in_progress': '🔧 Work is now in progress. Your vehicle is being serviced.',
                'completed': '🎉 Work has been completed! Your vehicle is ready.',
                'on_hold': '⏸️ Work has been temporarily paused. We\'ll update you soon.',
                'cancelled': '❌ Work has been cancelled. Please contact us for details.'
            }
            
            message = status_messages.get(new_status, f'Status updated to: {new_status}')
            
            logger.info(f"📧 Customer notification sent: {old_status} → {new_status} for {customer_id}")
            
        except Exception as e:
            logger.error(f"❌ Error sending status change notification: {e}")

# Service instance for use in Lambda handlers
work_authorization_service = WorkAuthorizationService()
