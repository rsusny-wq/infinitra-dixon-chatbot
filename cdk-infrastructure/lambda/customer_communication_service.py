#!/usr/bin/env python3
"""
Dixon Smart Repair - Customer Communication Service
Phase 2.1: Real-time mechanic-customer messaging with AI assistance
Implements hybrid approach with queue-based communication and real-time AI suggestions
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
MECHANIC_MESSAGE_TABLE = os.environ.get('MECHANIC_MESSAGE_TABLE', 'MechanicMessageTable')
MECHANIC_NOTIFICATION_TABLE = os.environ.get('MECHANIC_NOTIFICATION_TABLE', 'MechanicNotificationTable')
CONVERSATION_TABLE = os.environ.get('CONVERSATION_TABLE')
MESSAGE_TABLE = os.environ.get('MESSAGE_TABLE')
SHOP_TABLE = os.environ.get('SHOP_TABLE')

class CustomerCommunicationService:
    """
    Service class for handling customer-mechanic communication
    Implements hybrid approach: AI conversation continues, mechanic gets separate interface with AI context
    """
    
    def __init__(self):
        self.mechanic_request_table = dynamodb.Table(MECHANIC_REQUEST_TABLE)
        self.mechanic_message_table = dynamodb.Table(MECHANIC_MESSAGE_TABLE)
        self.mechanic_notification_table = dynamodb.Table(MECHANIC_NOTIFICATION_TABLE)
        self.conversation_table = dynamodb.Table(CONVERSATION_TABLE)
        self.message_table = dynamodb.Table(MESSAGE_TABLE)
        self.shop_table = dynamodb.Table(SHOP_TABLE)
        # NEW: Mechanics management table
        self.mechanics_table = dynamodb.Table(os.environ.get('MECHANICS_TABLE', 'dixon-mechanics'))
    
    def get_shop_statistics(self, shop_id: str) -> Dict[str, Any]:
        """
        Get statistics for a shop (total requests, active, completed, etc.)
        """
        try:
            logger.info(f"📊 Getting statistics for shop: {shop_id}")
            
            # Get all requests for the shop
            response = self.mechanic_request_table.scan(
                FilterExpression='shopId = :shop_id',
                ExpressionAttributeValues={':shop_id': shop_id}
            )
            
            requests = response.get('Items', [])
            
            # Calculate statistics
            total_requests = len(requests)
            queued_requests = len([r for r in requests if r.get('status') == 'queued'])
            active_requests = len([r for r in requests if r.get('status') == 'active'])
            assigned_requests = len([r for r in requests if r.get('status') == 'assigned'])
            completed_requests = len([r for r in requests if r.get('status') == 'completed'])
            
            # Calculate urgency breakdown
            high_urgency = len([r for r in requests if r.get('urgency') == 'high'])
            medium_urgency = len([r for r in requests if r.get('urgency') == 'medium'])
            low_urgency = len([r for r in requests if r.get('urgency') == 'low'])
            
            statistics = {
                'shopId': shop_id,
                'totalRequests': total_requests,
                'queuedRequests': queued_requests,
                'activeRequests': active_requests,
                'assignedRequests': assigned_requests,
                'completedRequests': completed_requests,
                'highUrgencyRequests': high_urgency,
                'mediumUrgencyRequests': medium_urgency,
                'lowUrgencyRequests': low_urgency,
                'lastUpdated': datetime.utcnow().isoformat()
            }
            
            logger.info(f"✅ Shop statistics calculated: {total_requests} total requests")
            
            return {
                'success': True,
                'data': statistics
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting shop statistics: {e}")
            return {
                'success': False,
                'error': str(e)
            }

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
    
    def convert_decimals_to_float(self, obj):
        """Convert Decimal values to float for JSON serialization"""
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {k: self.convert_decimals_to_float(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_decimals_to_float(item) for item in obj]
        return obj
    
    def _convert_sets_to_lists(self, obj):
        """Convert DynamoDB sets to lists for JSON serialization"""
        if isinstance(obj, dict):
            for key, value in obj.items():
                if isinstance(value, set):
                    obj[key] = list(value)
                elif isinstance(value, dict):
                    self._convert_sets_to_lists(value)
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            self._convert_sets_to_lists(item)
        return obj
    
    def transform_estimate_for_graphql(self, estimate):
        """Transform DynamoDB estimate data to match GraphQL UserCostEstimate schema"""
        try:
            logger.info(f"🔄 Transforming estimate: {estimate.get('estimateId')}")
            logger.info(f"🔍 Estimate keys: {list(estimate.keys())}")
            
            # Transform field names from snake_case to camelCase
            transformed = {
                'id': estimate.get('estimateId'),
                'estimateId': estimate.get('estimateId'),
                'userId': estimate.get('userId'),
                'conversationId': estimate.get('conversationId'),
                'status': estimate.get('status', 'draft'),
                'createdAt': estimate.get('createdAt'),
                'confidence': estimate.get('confidence', 85)
            }
            
            # Transform vehicleInfo (already in camelCase in DynamoDB)
            if 'vehicleInfo' in estimate:
                logger.info(f"✅ Found vehicleInfo: {estimate['vehicleInfo']}")
                vehicle_info = estimate['vehicleInfo']
                transformed['vehicleInfo'] = {
                    'make': vehicle_info.get('make', 'Unknown'),
                    'model': vehicle_info.get('model', 'Unknown'),
                    'year': int(vehicle_info.get('year', 0)) if vehicle_info.get('year') else 0,
                    'trim': vehicle_info.get('trim', 'Unknown'),
                    'vin': vehicle_info.get('vin', '')
                }
                logger.info(f"✅ Transformed vehicleInfo: {transformed['vehicleInfo']}")
            else:
                logger.warning(f"⚠️ No vehicleInfo found in estimate")
                # Provide default vehicleInfo if missing (to satisfy non-nullable GraphQL field)
                transformed['vehicleInfo'] = {
                    'make': 'Unknown',
                    'model': 'Unknown', 
                    'year': 0,
                    'trim': 'Unknown',
                    'vin': ''
                }
            
            # Transform selectedOption (already in camelCase)
            transformed['selectedOption'] = estimate.get('selectedOption', 'oem_equivalent')
            
            # Transform breakdown structure
            if 'breakdown' in estimate:
                logger.info(f"✅ Found breakdown: {estimate['breakdown']}")
                breakdown = estimate['breakdown']
                
                # Convert all Decimal objects to float for JSON serialization
                def convert_decimals(obj):
                    if isinstance(obj, dict):
                        return {k: convert_decimals(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [convert_decimals(item) for item in obj]
                    elif hasattr(obj, '__class__') and obj.__class__.__name__ == 'Decimal':
                        return float(obj)
                    else:
                        return obj
                
                transformed['breakdown'] = {
                    'total': float(breakdown.get('total', 0)),
                    'parts': convert_decimals(breakdown.get('parts', {})),
                    'labor': convert_decimals(breakdown.get('labor', {})),
                    'shopFees': convert_decimals(breakdown.get('shopFees', {})),
                    'tax': float(breakdown.get('tax', 0))
                }
            else:
                logger.warning(f"⚠️ No breakdown found in estimate")
                # Fallback for old format
                parts_total = 0
                labor_total = 0
                
                # Calculate parts total
                if 'parts_found' in estimate:
                    for part in estimate['parts_found']:
                        parts_total += float(part.get('price', 0))
                
                # Calculate labor total
                if 'labor_estimate' in estimate:
                    labor_est = estimate['labor_estimate']
                    estimated_hours = float(labor_est.get('estimated_hours', 1.5))
                    labor_total = estimated_hours * 95.0  # $95/hour rate
                
                # Create breakdown structure for old format
                transformed['breakdown'] = {
                    'total': parts_total + labor_total + 25.0,  # Add $25 shop fees
                    'parts': {'total': parts_total},
                    'labor': {'total': labor_total},
                    'shopFees': {'total': 25.0},
                    'tax': 0.0
                }
            
            logger.info(f"✅ Final transformed estimate: {transformed}")
            return transformed
            
        except Exception as e:
            logger.error(f"Error transforming estimate for GraphQL: {e}")
            return None
    
    def request_mechanic(self, request_data: Dict[str, Any], customer_id: str, customer_name: str) -> Dict[str, Any]:
        """
        Create a mechanic request and add to shop queue
        Implements queue-based communication system
        """
        try:
            logger.info(f"🔧 Creating mechanic request for customer: {customer_id}")
            
            request_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()
            
            # Get AI context from conversation
            ai_context = self._get_ai_context_for_request(request_data['conversationId'])
            
            # Convert floats to Decimal
            safe_request_data = self.convert_floats_to_decimal(request_data)
            
            request_item = {
                'id': request_id,
                'conversationId': safe_request_data['conversationId'],
                'customerId': customer_id,
                'customerName': customer_name,
                'requestMessage': safe_request_data['requestMessage'],
                'urgency': safe_request_data['urgency'],
                'status': 'queued',  # queued -> assigned -> active -> completed
                'shopId': safe_request_data['shopId'],
                'aiContext': ai_context,
                'createdAt': timestamp,
                'updatedAt': timestamp,
                'estimatedResponseTime': self._calculate_estimated_response_time(safe_request_data['urgency'])
            }
            
            # Only add assignedMechanicId if it has a value (to avoid GSI issues)
            # assignedMechanicName is also omitted when null
            
            # Store request in DynamoDB
            self.mechanic_request_table.put_item(Item=request_item)
            
            # Create notifications for available mechanics
            self._notify_available_mechanics(safe_request_data['shopId'], request_item)
            
            logger.info(f"✅ Mechanic request created successfully: {request_id}")
            
            return {
                'success': True,
                'data': request_item
            }
            
        except Exception as e:
            logger.error(f"❌ Error creating mechanic request: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def assign_mechanic_request(self, request_id: str, mechanic_id: str, mechanic_name: str) -> Dict[str, Any]:
        """
        Assign a queued request to a specific mechanic
        """
        try:
            logger.info(f"👨‍🔧 Assigning request {request_id} to mechanic: {mechanic_id}")
            
            # First, find the request using scan (since we have composite key)
            response = self.mechanic_request_table.scan(
                FilterExpression='id = :request_id',
                ExpressionAttributeValues={':request_id': request_id}
            )
            
            items = response.get('Items', [])
            if not items:
                return {
                    'success': False,
                    'error': 'Mechanic request not found'
                }
            
            request_item = items[0]
            timestamp = datetime.utcnow().isoformat()
            
            # Update request with composite key
            response = self.mechanic_request_table.update_item(
                Key={
                    'id': request_id,
                    'createdAt': request_item['createdAt']
                },
                UpdateExpression='SET #status = :status, assignedMechanicId = :mechanic_id, assignedMechanicName = :mechanic_name, updatedAt = :timestamp',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'assigned',
                    ':mechanic_id': mechanic_id,
                    ':mechanic_name': mechanic_name,
                    ':timestamp': timestamp
                },
                ReturnValues='ALL_NEW'
            )
            
            updated_request = response['Attributes']
            
            # Notify customer that mechanic has been assigned
            self._notify_customer_mechanic_assigned(updated_request)
            
            logger.info(f"✅ Request assigned successfully to mechanic: {mechanic_name}")
            
            return {
                'success': True,
                'data': updated_request
            }
            
        except Exception as e:
            logger.error(f"❌ Error assigning mechanic request: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_mechanic_message(self, message_data: Dict[str, Any], sender_id: str, sender_name: str, sender_type: str) -> Dict[str, Any]:
        """
        Send message in mechanic-customer conversation
        Includes real-time AI suggestions for mechanics
        """
        try:
            logger.info(f"💬 Sending mechanic message from {sender_type}: {sender_id}")
            
            message_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()
            
            # Convert floats to Decimal
            safe_message_data = self.convert_floats_to_decimal(message_data)
            
            message_item = {
                'id': message_id,
                'mechanicRequestId': safe_message_data['mechanicRequestId'],
                'senderId': sender_id,
                'senderType': sender_type,  # customer, mechanic, ai_assistant
                'senderName': sender_name,
                'content': safe_message_data['content'],
                'messageType': safe_message_data['messageType'],  # text, info_request, service_update, ai_suggestion
                'timestamp': timestamp,
                'metadata': safe_message_data.get('metadata', {})
            }
            
            # Generate AI suggestion for mechanic if customer sent message
            if sender_type == 'customer' and safe_message_data['messageType'] == 'text':
                ai_suggestion = self._generate_ai_suggestion_for_mechanic(
                    safe_message_data['mechanicRequestId'], 
                    safe_message_data['content']
                )
                message_item['aiSuggestion'] = ai_suggestion
            
            # Store message in DynamoDB
            self.mechanic_message_table.put_item(Item=message_item)
            
            # Update request status to active if first message
            self._update_request_status_if_needed(safe_message_data['mechanicRequestId'], sender_type)
            
            logger.info(f"✅ Mechanic message sent successfully: {message_id}")
            
            return {
                'success': True,
                'data': message_item
            }
            
        except Exception as e:
            logger.error(f"❌ Error sending mechanic message: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def share_estimate_with_mechanic(self, user_id: str, estimate_id: str, customer_comment: str, shop_id: str, estimate_data: Dict) -> Dict:
        """
        Share a cost estimate with a mechanic by creating a mechanic request
        """
        try:
            # Get customer info from user context or estimate data
            customer_name = f"Customer {user_id[:8]}"  # Fallback name
            
            # Create the mechanic request
            request_id = f"req-{int(time.time())}-{str(uuid.uuid4())[:8]}"
            
            # Build AI context from estimate data
            ai_context = {
                'conversationHistory': [],
                'sessionSummary': f"Customer is sharing a cost estimate for review and discussion",
                'lastCostEstimate': {
                    'description': f"Cost estimate {estimate_id}",
                    'min': float(estimate_data.get('breakdown', {}).get('total', 0)),
                    'max': float(estimate_data.get('breakdown', {}).get('total', 0))
                },
                'vehicleInfo': estimate_data.get('vehicleInfo', {}),
                'customerPreferences': {}
            }
            
            # Create request message
            request_message = f"Customer has shared cost estimate {estimate_id} for review."
            if customer_comment.strip():
                request_message += f" Customer comment: {customer_comment}"
            
            # Create the mechanic request item
            request_item = {
                'id': request_id,
                'customerId': user_id,
                'customerName': customer_name,
                'shopId': shop_id,
                'conversationId': estimate_data.get('conversationId', f'conv-{estimate_id}'),
                'requestMessage': request_message,
                'urgency': 'medium',
                'status': 'queued',
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat(),
                'aiContext': self.convert_floats_to_decimal(ai_context),
                'sharedEstimateId': estimate_id,
                'customerComment': customer_comment,
                'estimatedResponseTime': '2-4 hours'
            }
            
            # Save to DynamoDB
            self.mechanic_request_table.put_item(Item=request_item)
            
            # Create initial notification for mechanics
            self.create_mechanic_notification(
                shop_id=shop_id,
                request_id=request_id,
                message=f"New cost estimate shared by customer for review",
                priority='medium',
                notification_type='estimate_shared'
            )
            
            logger.info(f"✅ Cost estimate {estimate_id} shared with shop {shop_id}")
            
            return {
                'success': True,
                'data': self.convert_decimals_to_float(request_item)
            }
            
        except Exception as e:
            logger.error(f"Error sharing estimate with mechanic: {e}")
            return {
                'success': False,
                'error': f"Failed to share estimate: {str(e)}"
            }
    
    def get_mechanic_requests(self, customer_id: str) -> Dict[str, Any]:
        """
        Get all mechanic requests for a customer, including shared estimate data
        """
        try:
            logger.info(f"📋 Fetching mechanic requests for customer: {customer_id}")
            
            response = self.mechanic_request_table.scan(
                FilterExpression='customerId = :customer_id',
                ExpressionAttributeValues={':customer_id': customer_id}
            )
            
            requests = response.get('Items', [])
            
            # Fetch shared estimate data for requests that have it
            for request in requests:
                if request.get('sharedEstimateId'):
                    try:
                        # Get the shared estimate data
                        cost_estimates_table = dynamodb.Table(os.environ.get('COST_ESTIMATES_TABLE'))
                        estimate_response = cost_estimates_table.get_item(
                            Key={'estimateId': request['sharedEstimateId']}
                        )
                        
                        if 'Item' in estimate_response:
                            # Transform the estimate data to match GraphQL schema
                            estimate = estimate_response['Item']
                            transformed_estimate = self.transform_estimate_for_graphql(estimate)
                            request['sharedEstimate'] = transformed_estimate
                            
                    except Exception as e:
                        logger.warning(f"Could not fetch shared estimate {request.get('sharedEstimateId')}: {e}")
                        request['sharedEstimate'] = None
            
            # Sort by creation date (newest first)
            requests.sort(key=lambda x: x['createdAt'], reverse=True)
            
            return {
                'success': True,
                'data': requests,
                'count': len(requests)
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching mechanic requests: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_queued_requests(self, shop_id: str) -> Dict[str, Any]:
        """
        Get all queued requests for a shop (mechanic queue), including shared estimate data
        """
        try:
            logger.info(f"🏪 Fetching queued requests for shop: {shop_id}")
            
            response = self.mechanic_request_table.scan(
                FilterExpression='shopId = :shop_id AND #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':shop_id': shop_id,
                    ':status': 'queued'
                }
            )
            
            requests = response.get('Items', [])
            
            # Convert DynamoDB sets to lists for JSON serialization
            for request in requests:
                self._convert_sets_to_lists(request)
            
            # Fetch shared estimate data for requests that have it
            for request in requests:
                if request.get('sharedEstimateId'):
                    try:
                        # Get the shared estimate data
                        cost_estimates_table = dynamodb.Table(os.environ.get('COST_ESTIMATES_TABLE'))
                        estimate_response = cost_estimates_table.get_item(
                            Key={'estimateId': request['sharedEstimateId']}
                        )
                        
                        if 'Item' in estimate_response:
                            logger.info(f"📊 [get_queued_requests] Found estimate item for {request['sharedEstimateId']}")
                            # Transform the estimate data to match GraphQL schema
                            estimate = estimate_response['Item']
                            transformed_estimate = self.transform_estimate_for_graphql(estimate)
                            logger.info(f"🔄 [get_queued_requests] Assigning transformed estimate to request: {transformed_estimate is not None}")
                            request['sharedEstimate'] = transformed_estimate
                            logger.info(f"✅ [get_queued_requests] Request now has sharedEstimate: {request.get('sharedEstimate') is not None}")
                        else:
                            logger.warning(f"⚠️ [get_queued_requests] No estimate found for {request['sharedEstimateId']}")
                            request['sharedEstimate'] = None
                            
                    except Exception as e:
                        logger.warning(f"Could not fetch shared estimate {request.get('sharedEstimateId')}: {e}")
                        request['sharedEstimate'] = None
            
            # Sort by urgency and creation date
            urgency_priority = {'high': 3, 'medium': 2, 'low': 1}
            requests.sort(key=lambda x: (urgency_priority.get(x['urgency'], 1), x['createdAt']), reverse=True)
            
            return {
                'success': True,
                'data': requests,
                'count': len(requests)
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching queued requests: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_mechanic_messages(self, mechanic_request_id: str) -> Dict[str, Any]:
        """
        Get all messages for a mechanic request conversation
        """
        try:
            logger.info(f"💬 Fetching messages for request: {mechanic_request_id}")
            
            response = self.mechanic_message_table.scan(
                FilterExpression='mechanicRequestId = :request_id',
                ExpressionAttributeValues={':request_id': mechanic_request_id}
            )
            
            messages = response.get('Items', [])
            
            # Sort by timestamp (oldest first for conversation flow)
            messages.sort(key=lambda x: x['timestamp'])
            
            return {
                'success': True,
                'data': messages,
                'count': len(messages)
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching mechanic messages: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_ai_context_for_request(self, conversation_id: str) -> Dict[str, Any]:
        """
        Extract AI context from conversation for mechanic handoff
        """
        try:
            # Get conversation messages
            response = self.message_table.scan(
                FilterExpression='conversationId = :conv_id',
                ExpressionAttributeValues={':conv_id': conversation_id}
            )
            
            messages = response.get('Items', [])
            messages.sort(key=lambda x: x['timestamp'])
            
            # Extract last 10 messages for context
            recent_messages = messages[-10:] if len(messages) > 10 else messages
            
            # Generate session summary
            session_summary = self._generate_session_summary(messages)
            
            return {
                'conversationHistory': recent_messages,
                'lastDiagnosis': self._extract_last_diagnosis(messages),
                'lastCostEstimate': self._extract_last_cost_estimate(messages),
                'vehicleInfo': self._extract_vehicle_info(messages),
                'customerPreferences': self._extract_customer_preferences(messages),
                'sessionSummary': session_summary
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting AI context: {e}")
            return {
                'conversationHistory': [],
                'sessionSummary': 'Unable to load conversation context'
            }
    
    def _generate_ai_suggestion_for_mechanic(self, request_id: str, customer_message: str) -> Dict[str, Any]:
        """
        Generate real-time AI suggestions for mechanics
        """
        try:
            # Get request context
            response = self.mechanic_request_table.get_item(Key={'id': request_id})
            request_data = response.get('Item', {})
            
            ai_context = request_data.get('aiContext', {})
            
            # Analyze customer message and generate suggestion
            suggestion_content = self._analyze_customer_message_for_suggestion(customer_message, ai_context)
            
            return {
                'suggestionType': 'response_suggestion',
                'content': suggestion_content,
                'confidence': 85,
                'reasoning': 'Based on AI analysis of customer message and conversation context',
                'suggestedActions': self._generate_suggested_actions(customer_message, ai_context)
            }
            
        except Exception as e:
            logger.error(f"❌ Error generating AI suggestion: {e}")
            return {
                'suggestionType': 'response_suggestion',
                'content': 'Unable to generate AI suggestion at this time',
                'confidence': 0,
                'reasoning': 'Error in AI suggestion generation',
                'suggestedActions': []
            }
    
    def _analyze_customer_message_for_suggestion(self, message: str, ai_context: Dict[str, Any]) -> str:
        """
        Analyze customer message and provide mechanic response suggestion
        """
        message_lower = message.lower()
        
        # Pattern-based suggestions (in production, would use AI model)
        if any(word in message_lower for word in ['when', 'how long', 'time']):
            return "Customer is asking about timing. Consider providing a specific timeframe based on the diagnostic complexity."
        
        elif any(word in message_lower for word in ['cost', 'price', 'expensive', 'cheap']):
            return "Customer has cost concerns. Explain the value proposition and offer different service tiers if applicable."
        
        elif any(word in message_lower for word in ['urgent', 'emergency', 'asap', 'immediately']):
            return "Customer indicates urgency. Prioritize this request and provide immediate next steps."
        
        elif any(word in message_lower for word in ['confused', 'understand', 'explain']):
            return "Customer needs clarification. Use simple, non-technical language to explain the diagnosis and next steps."
        
        else:
            return "Acknowledge the customer's message and provide helpful, specific information based on their concern."
    
    def _generate_suggested_actions(self, message: str, ai_context: Dict[str, Any]) -> List[str]:
        """
        Generate suggested actions for mechanic based on customer message
        """
        actions = []
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['when', 'how long', 'time']):
            actions.extend([
                "Provide specific timeframe estimate",
                "Explain factors that might affect timing",
                "Offer to prioritize if urgent"
            ])
        
        elif any(word in message_lower for word in ['cost', 'price']):
            actions.extend([
                "Break down cost components",
                "Explain value of recommended service",
                "Offer alternative service options"
            ])
        
        elif any(word in message_lower for word in ['urgent', 'emergency']):
            actions.extend([
                "Assess true urgency level",
                "Provide immediate safety guidance",
                "Schedule priority appointment"
            ])
        
        return actions[:3]  # Limit to top 3 suggestions
    
    def _calculate_estimated_response_time(self, urgency: str) -> str:
        """
        Calculate estimated response time based on urgency
        """
        urgency_times = {
            'high': '15 minutes',
            'medium': '1 hour',
            'low': '4 hours'
        }
        return urgency_times.get(urgency, '2 hours')
    
    def _notify_available_mechanics(self, shop_id: str, request_data: Dict[str, Any]):
        """
        Create notifications for available mechanics about new request
        """
        try:
            # In production, would query actual mechanics for the shop
            # For now, create a general notification
            notification_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()
            
            notification_item = {
                'id': notification_id,
                'mechanicId': 'all_mechanics',  # Broadcast to all mechanics in shop
                'type': 'new_request',
                'title': f'New {request_data["urgency"].title()} Priority Request',
                'message': f'Customer {request_data["customerName"]} needs assistance: {request_data["requestMessage"][:100]}...',
                'mechanicRequestId': request_data['id'],
                'priority': request_data['urgency'],
                'isRead': False,
                'createdAt': timestamp
            }
            
            self.mechanic_notification_table.put_item(Item=notification_item)
            
        except Exception as e:
            logger.error(f"❌ Error creating mechanic notifications: {e}")
    
    def _notify_customer_mechanic_assigned(self, request_data: Dict[str, Any]):
        """
        Notify customer that mechanic has been assigned
        """
        try:
            # In production, would send push notification or email
            logger.info(f"📱 Customer notification: Mechanic {request_data['assignedMechanicName']} assigned to request {request_data['id']}")
            
        except Exception as e:
            logger.error(f"❌ Error notifying customer: {e}")
    
    def _update_request_status_if_needed(self, request_id: str, sender_type: str):
        """
        Update request status to active when conversation starts
        """
        try:
            if sender_type == 'mechanic':
                self.mechanic_request_table.update_item(
                    Key={'id': request_id},
                    UpdateExpression='SET #status = :status, updatedAt = :timestamp',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': 'active',
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
                
        except Exception as e:
            logger.error(f"❌ Error updating request status: {e}")
    
    def _generate_session_summary(self, messages: List[Dict[str, Any]]) -> str:
        """
        Generate an AI-powered summary of the conversation session for mechanic handoff
        """
        if not messages:
            return "No conversation history available"
        
        try:
            # Extract key conversation elements
            customer_messages = [msg for msg in messages if msg.get('sender') == 'user']
            ai_messages = [msg for msg in messages if msg.get('sender') == 'assistant']
            
            if not customer_messages:
                return "No customer messages in conversation"
            
            # Build comprehensive summary using AI analysis
            summary_parts = []
            
            # 1. Basic conversation stats
            summary_parts.append(f"Conversation: {len(customer_messages)} customer messages, {len(ai_messages)} AI responses")
            
            # 2. Initial customer concern
            if customer_messages:
                first_message = customer_messages[0].get('content', '')
                initial_concern = self._extract_key_concern(first_message)
                summary_parts.append(f"Initial Issue: {initial_concern}")
            
            # 3. Vehicle information extraction
            vehicle_info = self._extract_vehicle_info_enhanced(messages)
            if vehicle_info:
                summary_parts.append(f"Vehicle: {vehicle_info}")
            
            # 4. Diagnosed problems
            diagnosed_issues = self._extract_diagnosed_issues(messages)
            if diagnosed_issues:
                summary_parts.append(f"Diagnosed Issues: {', '.join(diagnosed_issues)}")
            
            # 5. Cost estimates mentioned
            cost_estimates = self._extract_cost_mentions(messages)
            if cost_estimates:
                summary_parts.append(f"Cost Estimates: {cost_estimates}")
            
            # 6. Customer preferences and constraints
            preferences = self._extract_customer_preferences_enhanced(messages)
            if preferences:
                summary_parts.append(f"Customer Preferences: {preferences}")
            
            # 7. Urgency indicators
            urgency_indicators = self._extract_urgency_indicators(messages)
            if urgency_indicators:
                summary_parts.append(f"Urgency: {urgency_indicators}")
            
            # 8. Next steps or unresolved questions
            unresolved = self._extract_unresolved_questions(messages)
            if unresolved:
                summary_parts.append(f"Unresolved: {unresolved}")
            
            return " | ".join(summary_parts)
            
        except Exception as e:
            logger.error(f"❌ Error generating AI summary: {e}")
            # Fallback to simple summary
            return self._generate_simple_summary(messages)
    
    def _generate_simple_summary(self, messages: List[Dict[str, Any]]) -> str:
        """Fallback simple summary generation"""
        customer_messages = [msg for msg in messages if msg.get('sender') == 'user']
        ai_messages = [msg for msg in messages if msg.get('sender') == 'assistant']
        
        summary = f"Conversation with {len(customer_messages)} customer messages and {len(ai_messages)} AI responses. "
        
        if customer_messages:
            first_message = customer_messages[0].get('content', '')[:100]
            summary += f"Initial concern: {first_message}..."
        
        return summary
    
    def _extract_key_concern(self, message: str) -> str:
        """Extract the main concern from customer's first message"""
        # Clean and truncate the message
        concern = message.strip()[:150]
        
        # Look for key automotive issue keywords
        issue_keywords = [
            'brake', 'engine', 'transmission', 'battery', 'tire', 'oil', 
            'noise', 'vibration', 'leak', 'smoke', 'warning light',
            'steering', 'suspension', 'air conditioning', 'heating'
        ]
        
        # Highlight if specific automotive terms are mentioned
        for keyword in issue_keywords:
            if keyword.lower() in concern.lower():
                return f"{concern} [AUTO: {keyword.upper()}]"
        
        return concern
    
    def _extract_vehicle_info_enhanced(self, messages: List[Dict[str, Any]]) -> Optional[str]:
        """Extract vehicle information from conversation"""
        vehicle_info = []
        
        # Look through all messages for vehicle details
        all_content = " ".join([msg.get('content', '') for msg in messages])
        
        # Extract year (4-digit number between 1990-2025)
        import re
        year_match = re.search(r'\b(19[9][0-9]|20[0-2][0-9])\b', all_content)
        if year_match:
            vehicle_info.append(year_match.group(1))
        
        # Extract common car makes
        makes = ['toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes', 'audi', 'volkswagen', 'hyundai', 'kia', 'mazda', 'subaru']
        for make in makes:
            if make.lower() in all_content.lower():
                vehicle_info.append(make.title())
                break
        
        # Extract common models (simplified)
        models = ['civic', 'accord', 'camry', 'corolla', 'f-150', 'silverado', 'altima', 'sentra']
        for model in models:
            if model.lower() in all_content.lower():
                vehicle_info.append(model.title())
                break
        
        return " ".join(vehicle_info) if vehicle_info else None
    
    def _extract_diagnosed_issues(self, messages: List[Dict[str, Any]]) -> List[str]:
        """Extract diagnosed automotive issues from AI responses"""
        issues = []
        
        # Look through AI messages for diagnostic terms
        ai_messages = [msg for msg in messages if msg.get('sender') == 'assistant']
        
        diagnostic_terms = [
            'brake pad', 'brake rotor', 'brake fluid', 'oil change', 'air filter',
            'spark plug', 'battery', 'alternator', 'starter', 'transmission',
            'coolant', 'radiator', 'thermostat', 'water pump', 'timing belt',
            'serpentine belt', 'tire rotation', 'wheel alignment', 'suspension'
        ]
        
        for msg in ai_messages:
            content = msg.get('content', '').lower()
            for term in diagnostic_terms:
                if term in content and term not in issues:
                    issues.append(term.title())
        
        return issues[:5]  # Limit to top 5 issues
    
    def _extract_cost_mentions(self, messages: List[Dict[str, Any]]) -> Optional[str]:
        """Extract cost estimates mentioned in conversation"""
        import re
        
        all_content = " ".join([msg.get('content', '') for msg in messages])
        
        # Look for dollar amounts
        cost_matches = re.findall(r'\$[\d,]+(?:\.\d{2})?', all_content)
        
        if cost_matches:
            if len(cost_matches) == 1:
                return cost_matches[0]
            else:
                return f"{cost_matches[0]} - {cost_matches[-1]}"
        
        return None
    
    def _extract_customer_preferences_enhanced(self, messages: List[Dict[str, Any]]) -> Optional[str]:
        """Extract customer preferences and constraints"""
        preferences = []
        
        customer_messages = [msg for msg in messages if msg.get('sender') == 'user']
        all_customer_content = " ".join([msg.get('content', '') for msg in customer_messages]).lower()
        
        # Budget constraints
        if any(word in all_customer_content for word in ['budget', 'cheap', 'affordable', 'expensive', 'cost']):
            preferences.append('Budget-conscious')
        
        # Quality preferences
        if any(word in all_customer_content for word in ['quality', 'best', 'premium', 'oem']):
            preferences.append('Quality-focused')
        
        # Urgency preferences
        if any(word in all_customer_content for word in ['urgent', 'asap', 'quickly', 'emergency']):
            preferences.append('Urgent')
        
        # DIY mentions
        if any(word in all_customer_content for word in ['diy', 'myself', 'own repair']):
            preferences.append('DIY-interested')
        
        return ', '.join(preferences) if preferences else None
    
    def _extract_urgency_indicators(self, messages: List[Dict[str, Any]]) -> Optional[str]:
        """Extract urgency indicators from conversation"""
        customer_messages = [msg for msg in messages if msg.get('sender') == 'user']
        all_content = " ".join([msg.get('content', '') for msg in customer_messages]).lower()
        
        high_urgency = ['emergency', 'urgent', 'asap', 'immediately', 'dangerous', 'unsafe']
        medium_urgency = ['soon', 'quickly', 'this week', 'important']
        
        if any(word in all_content for word in high_urgency):
            return 'HIGH - Safety/Emergency'
        elif any(word in all_content for word in medium_urgency):
            return 'MEDIUM - Time-sensitive'
        
        return None
    
    def _extract_unresolved_questions(self, messages: List[Dict[str, Any]]) -> Optional[str]:
        """Extract unresolved questions or next steps"""
        if not messages:
            return None
        
        # Look at the last few customer messages for questions
        customer_messages = [msg for msg in messages if msg.get('sender') == 'user']
        
        if customer_messages:
            last_message = customer_messages[-1].get('content', '')
            
            # Check if last message contains questions
            if '?' in last_message:
                return f"Customer asked: {last_message[:100]}..."
            
            # Check for uncertainty indicators
            uncertainty_words = ['not sure', 'confused', 'unclear', 'help me understand']
            if any(word in last_message.lower() for word in uncertainty_words):
                return "Customer needs clarification"
        
        return None
    
    def _extract_last_diagnosis(self, messages: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Extract the last AI diagnosis from messages"""
        # In production, would parse actual diagnosis data
        return None
    
    def _extract_last_cost_estimate(self, messages: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Extract the last cost estimate from messages"""
        # In production, would parse actual cost estimate data
        return None
    
    def _extract_vehicle_info(self, messages: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Extract vehicle information from messages"""
        # In production, would parse actual vehicle data
        return None
    
    def _extract_customer_preferences(self, messages: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Extract customer preferences from messages"""
        # In production, would parse actual preference data
        return None

    def respond_to_estimate_review(self, estimate_id: str, response: str, customer_comment: str, user_id: str) -> Dict[str, Any]:
        """
        Customer response to mechanic-reviewed estimate
        """
        try:
            logger.info(f"🔍 Customer responding to estimate review: {estimate_id} with {response}")
            
            response_id = str(uuid.uuid4())
            response_item = {
                'id': response_id,
                'estimateId': estimate_id,
                'customerId': user_id,
                'response': response,  # 'accepted', 'rejected', 'needs_clarification'
                'customerComment': customer_comment,
                'respondedAt': datetime.utcnow().isoformat(),
                'createdAt': datetime.utcnow().isoformat()
            }
            
            # Store response in EstimateResponses table (we'll need to create this table)
            # For now, let's store it in the MechanicReviews table with a different type
            response_item['type'] = 'customer_response'
            response_item['mechanicId'] = 'customer'  # Placeholder
            response_item['sessionId'] = estimate_id  # Use estimate ID as session ID
            response_item['status'] = response
            response_item['mechanicNotes'] = customer_comment
            response_item['reviewedAt'] = response_item['respondedAt']
            
            self.mechanic_reviews_table.put_item(Item=response_item)
            
            # Update estimate status
            cost_estimates_table = dynamodb.Table(os.environ.get('COST_ESTIMATES_TABLE'))
            cost_estimates_table.update_item(
                Key={'estimateId': estimate_id},
                UpdateExpression='SET #status = :status, customerResponseId = :responseId',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': f'customer_{response}',
                    ':responseId': response_id
                }
            )
            
            # If accepted, we could create work authorization here
            if response == 'accepted':
                logger.info(f"✅ Customer accepted estimate {estimate_id}")
                # TODO: Create work authorization
            
            return {
                'success': True,
                'data': {
                    'success': True,
                    'estimateId': estimate_id,
                    'response': response,
                    'customerComment': customer_comment,
                    'respondedAt': response_item['respondedAt']
                }
            }
            
        except Exception as e:
            logger.error(f"Error responding to estimate review: {e}")
            return {'success': False, 'error': str(e)}

    def create_mechanic_notification(self, shop_id: str, request_id: str, message: str, priority: str = 'medium', notification_type: str = 'general') -> Dict[str, Any]:
        """
        Create a notification for mechanics about new requests or updates
        """
        try:
            logger.info(f"📢 Creating mechanic notification for shop {shop_id}: {message}")
            
            notification_id = f"notif-{int(time.time())}-{str(uuid.uuid4())[:8]}"
            
            notification_item = {
                'id': notification_id,
                'shopId': shop_id,
                'requestId': request_id,
                'message': message,
                'priority': priority,
                'notificationType': notification_type,
                'status': 'unread',
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            # Save to DynamoDB notifications table
            self.mechanic_notification_table.put_item(Item=notification_item)
            
            logger.info(f"✅ Mechanic notification created: {notification_id}")
            
            return {
                'success': True,
                'data': notification_item
            }
            
        except Exception as e:
            logger.error(f"Error creating mechanic notification: {e}")
            return {'success': False, 'error': str(e)}

    def update_modified_estimate(self, request_id: str, modified_estimate: Dict[str, Any], mechanic_notes: str, mechanic_id: str) -> Dict[str, Any]:
        """
        Update a mechanic request with modified estimate and send back to customer for approval
        """
        try:
            logger.info(f"🔧 Updating modified estimate for request: {request_id}")
            
            # Get the original request - need to scan since we only have the id
            response = self.mechanic_request_table.scan(
                FilterExpression='id = :request_id',
                ExpressionAttributeValues={':request_id': request_id}
            )
            
            if not response.get('Items'):
                return {'success': False, 'error': 'Request not found'}
            
            request_item = response['Items'][0]
            
            # Convert floats to Decimal for DynamoDB
            safe_modified_estimate = self.convert_floats_to_decimal(modified_estimate)
            
            # Update the request with modified estimate
            timestamp = datetime.utcnow().isoformat()
            
            update_expression = """
                SET modifiedEstimate = :modified_estimate,
                    mechanicNotes = :mechanic_notes,
                    modifiedByMechanicId = :mechanic_id,
                    modifiedAt = :modified_at,
                    #status = :status,
                    updatedAt = :updated_at
            """
            
            expression_attribute_names = {
                '#status': 'status'
            }
            
            expression_attribute_values = {
                ':modified_estimate': safe_modified_estimate,
                ':mechanic_notes': mechanic_notes,
                ':mechanic_id': mechanic_id,
                ':modified_at': timestamp,
                ':status': 'pending_customer_approval',
                ':updated_at': timestamp
            }
            
            self.mechanic_request_table.update_item(
                Key={
                    'id': request_id,
                    'createdAt': request_item['createdAt']
                },
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values
            )
            
            # Create notification for customer
            customer_id = request_item.get('customerId')
            if customer_id:
                notification_message = f"Your estimate has been reviewed and modified by a mechanic. Please review the changes and approve or request revisions."
                # TODO: Send actual notification to customer
                logger.info(f"📧 Would send notification to customer {customer_id}: {notification_message}")
            
            logger.info(f"✅ Modified estimate updated for request: {request_id}")
            
            # Return the updated data structure
            return {
                'success': True,
                'data': {
                    'id': request_id,
                    'status': 'pending_customer_approval',
                    'modifiedEstimate': {
                        'estimateId': safe_modified_estimate.get('estimateId'),
                        'breakdown': safe_modified_estimate.get('breakdown'),
                        'confidence': safe_modified_estimate.get('confidence'),
                        'mechanicNotes': mechanic_notes,
                        'modifiedAt': timestamp
                    },
                    'updatedAt': timestamp
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error updating modified estimate: {e}")
            return {'success': False, 'error': str(e)}

    def approve_modified_estimate(self, estimate_id: str, customer_notes: str = None) -> Dict[str, Any]:
        """
        Customer approves a modified estimate
        """
        try:
            logger.info(f"✅ Customer approving modified estimate: {estimate_id}")
            
            # Find the mechanic request with this estimate
            response = self.mechanic_request_table.scan(
                FilterExpression='sharedEstimateId = :estimate_id',
                ExpressionAttributeValues={':estimate_id': estimate_id}
            )
            
            if not response.get('Items'):
                return {'success': False, 'error': 'Estimate request not found'}
            
            request_item = response['Items'][0]
            request_id = request_item['id']
            
            # Update the request status
            timestamp = datetime.utcnow().isoformat()
            
            update_expression = """
                SET #status = :status,
                    customerApprovalNotes = :customer_notes,
                    approvedAt = :approved_at,
                    updatedAt = :updated_at
            """
            
            expression_attribute_names = {
                '#status': 'status'
            }
            
            expression_attribute_values = {
                ':status': 'customer_approved',
                ':customer_notes': customer_notes or '',
                ':approved_at': timestamp,
                ':updated_at': timestamp
            }
            
            self.mechanic_request_table.update_item(
                Key={
                    'id': request_id,
                    'createdAt': request_item['createdAt']
                },
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values
            )
            
            # Update the cost estimate status
            cost_estimates_table = dynamodb.Table(os.environ.get('COST_ESTIMATES_TABLE'))
            cost_estimates_table.update_item(
                Key={'estimateId': estimate_id},
                UpdateExpression='SET #status = :status, updatedAt = :updated_at',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'customer_approved',
                    ':updated_at': timestamp
                }
            )
            
            # Notify mechanic
            mechanic_id = request_item.get('assignedMechanicId')
            if mechanic_id:
                notification_message = f"Customer approved the modified estimate for {request_item.get('customerName', 'customer')}."
                # TODO: Send actual notification to mechanic
                logger.info(f"📧 Would send notification to mechanic {mechanic_id}: {notification_message}")
            
            logger.info(f"✅ Modified estimate approved: {estimate_id}")
            
            return {
                'success': True,
                'data': {
                    'id': request_id,
                    'status': 'customer_approved',
                    'customerApprovalNotes': customer_notes or '',
                    'approvedAt': timestamp,
                    'updatedAt': timestamp
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error approving modified estimate: {e}")
            return {'success': False, 'error': str(e)}

    def reject_modified_estimate(self, estimate_id: str, customer_notes: str) -> Dict[str, Any]:
        """
        Customer rejects a modified estimate and requests changes
        """
        try:
            logger.info(f"❌ Customer rejecting modified estimate: {estimate_id}")
            
            # Find the mechanic request with this estimate
            response = self.mechanic_request_table.scan(
                FilterExpression='sharedEstimateId = :estimate_id',
                ExpressionAttributeValues={':estimate_id': estimate_id}
            )
            
            if not response.get('Items'):
                return {'success': False, 'error': 'Estimate request not found'}
            
            request_item = response['Items'][0]
            request_id = request_item['id']
            
            # Update the request status
            timestamp = datetime.utcnow().isoformat()
            
            update_expression = """
                SET #status = :status,
                    customerRejectionNotes = :customer_notes,
                    rejectedAt = :rejected_at,
                    updatedAt = :updated_at
            """
            
            expression_attribute_names = {
                '#status': 'status'
            }
            
            expression_attribute_values = {
                ':status': 'customer_rejected',
                ':customer_notes': customer_notes,
                ':rejected_at': timestamp,
                ':updated_at': timestamp
            }
            
            self.mechanic_request_table.update_item(
                Key={
                    'id': request_id,
                    'createdAt': request_item['createdAt']
                },
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values
            )
            
            # Update the cost estimate status
            cost_estimates_table = dynamodb.Table(os.environ.get('COST_ESTIMATES_TABLE'))
            cost_estimates_table.update_item(
                Key={'estimateId': estimate_id},
                UpdateExpression='SET #status = :status, updatedAt = :updated_at',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'customer_rejected',
                    ':updated_at': timestamp
                }
            )
            
            # Notify mechanic
            mechanic_id = request_item.get('assignedMechanicId')
            if mechanic_id:
                notification_message = f"Customer requested changes to the estimate for {request_item.get('customerName', 'customer')}. Reason: {customer_notes}"
                # TODO: Send actual notification to mechanic
                logger.info(f"📧 Would send notification to mechanic {mechanic_id}: {notification_message}")
            
            logger.info(f"❌ Modified estimate rejected: {estimate_id}")
            
            return {
                'success': True,
                'data': {
                    'id': request_id,
                    'status': 'customer_rejected',
                    'customerRejectionNotes': customer_notes,
                    'rejectedAt': timestamp,
                    'updatedAt': timestamp
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error rejecting modified estimate: {e}")
            return {'success': False, 'error': str(e)}

    def get_modified_estimate_data(self, estimate_id: str) -> Dict[str, Any]:
        """
        Get modified estimate data for a given estimate ID
        """
        try:
            # Find the mechanic request with this estimate
            response = self.mechanic_request_table.scan(
                FilterExpression='sharedEstimateId = :estimate_id',
                ExpressionAttributeValues={':estimate_id': estimate_id}
            )
            
            if not response.get('Items'):
                return {'success': False, 'error': 'No modification found'}
            
            request_item = response['Items'][0]
            
            # Check if it has been modified
            if 'modifiedEstimate' not in request_item:
                return {'success': False, 'error': 'Not modified'}
            
            return {
                'success': True,
                'data': {
                    'requestId': request_item['id'],
                    'status': request_item.get('status', ''),
                    'modifiedEstimate': request_item.get('modifiedEstimate', {}),
                    'mechanicNotes': request_item.get('mechanicNotes', ''),
                    'modifiedAt': request_item.get('modifiedAt', ''),
                    'modifiedByMechanicId': request_item.get('modifiedByMechanicId', ''),
                    'customerApprovalNotes': request_item.get('customerApprovalNotes', ''),
                    'customerRejectionNotes': request_item.get('customerRejectionNotes', ''),
                    'approvedAt': request_item.get('approvedAt', ''),
                    'rejectedAt': request_item.get('rejectedAt', '')
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting modified estimate data: {e}")
            return {'success': False, 'error': str(e)}

# Global instance
customer_communication_service = CustomerCommunicationService()
