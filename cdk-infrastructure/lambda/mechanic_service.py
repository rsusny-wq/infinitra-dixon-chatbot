#!/usr/bin/env python3
"""
Dixon Smart Repair - Mechanic Service Handler
Handles shop management and mechanic interface operations
Following atomic tools best practices and shop-based multi-tenant architecture
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
bedrock_runtime = boto3.client('bedrock-runtime')

# Table names from environment
SHOP_TABLE = os.environ.get('SHOP_TABLE')
MECHANIC_TABLE = os.environ.get('MECHANIC_TABLE')
DIAGNOSIS_REVIEW_TABLE = os.environ.get('DIAGNOSIS_REVIEW_TABLE')
CONVERSATION_TABLE = os.environ.get('CONVERSATION_TABLE')
MESSAGE_TABLE = os.environ.get('MESSAGE_TABLE')
MECHANIC_REQUEST_TABLE = os.environ.get('MECHANIC_REQUEST_TABLE')

class MechanicService:
    """
    Service class for handling mechanic interface operations
    Implements shop-based multi-tenant architecture with proper data isolation
    """
    
    def __init__(self):
        self.shop_table = dynamodb.Table(SHOP_TABLE)
        self.mechanic_table = dynamodb.Table(MECHANIC_TABLE)
        self.diagnosis_review_table = dynamodb.Table(DIAGNOSIS_REVIEW_TABLE)
        self.conversation_table = dynamodb.Table(CONVERSATION_TABLE)
        self.message_table = dynamodb.Table(MESSAGE_TABLE)
        self.mechanic_request_table = dynamodb.Table(MECHANIC_REQUEST_TABLE)
    
    def convert_floats_to_decimal(self, obj):
        """Convert float values to Decimal for DynamoDB compatibility"""
        if isinstance(obj, float):
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {key: self.convert_floats_to_decimal(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_floats_to_decimal(item) for item in obj]
        return obj
        return obj
    
    def get_conversation_summary(self, conversation_id: str) -> Dict[str, Any]:
        """
        Generate AI-powered conversation summary for mechanic handoff
        Queries conversation by conversationId and uses Nova Pro for summarization
        """
        try:
            logger.info(f"🤖 Generating conversation summary for: {conversation_id}")
            
            # Get conversation messages from DynamoDB
            response = self.message_table.scan(
                FilterExpression='conversationId = :conv_id',
                ExpressionAttributeValues={':conv_id': conversation_id}
            )
            
            messages = response.get('Items', [])
            
            if not messages:
                return {
                    'success': False,
                    'error': 'No conversation found for this ID',
                    'summary': 'No conversation history available'
                }
            
            # Sort messages by timestamp
            messages.sort(key=lambda x: x['timestamp'])
            
            # Prepare conversation text for Nova Pro
            conversation_text = self._format_conversation_for_ai(messages)
            
            # Generate summary using Nova Pro
            summary = self._generate_ai_summary_with_nova(conversation_text)
            
            logger.info(f"✅ Conversation summary generated successfully")
            
            return {
                'success': True,
                'summary': summary,
                'message_count': len(messages),
                'conversation_id': conversation_id
            }
            
        except Exception as e:
            logger.error(f"❌ Error generating conversation summary: {e}")
            return {
                'success': False,
                'error': str(e),
                'summary': 'Error generating conversation summary'
            }
    
    def _format_conversation_for_ai(self, messages: List[Dict[str, Any]]) -> str:
        """
        Format conversation messages for AI summarization
        """
        formatted_lines = []
        
        for msg in messages:
            sender = msg.get('sender', 'unknown')
            content = msg.get('content', '')
            timestamp = msg.get('timestamp', '')
            
            # Format each message clearly
            if sender == 'user':
                formatted_lines.append(f"CUSTOMER: {content}")
            elif sender == 'assistant':
                formatted_lines.append(f"AI_ASSISTANT: {content}")
            else:
                formatted_lines.append(f"{sender.upper()}: {content}")
        
        return "\n".join(formatted_lines)
    
    def _generate_ai_summary_with_nova(self, conversation_text: str) -> str:
        """
        Generate conversation summary using Amazon Nova Pro
        """
        try:
            # Prepare the prompt for Nova Pro
            prompt = f"""You are an automotive expert assistant helping mechanics understand customer conversations. 

Please analyze this conversation between a customer and an AI automotive assistant, then provide a concise summary for a mechanic that includes:

1. **Vehicle Information**: Make, model, year if mentioned
2. **Primary Issue**: Main problem the customer is experiencing  
3. **Symptoms**: Key symptoms or details described
4. **Urgency Level**: How urgent this seems based on customer language
5. **Customer Concerns**: Any specific worries or preferences mentioned
6. **Next Steps**: What the customer needs help with

Keep the summary professional, concise, and focused on actionable information for the mechanic.

CONVERSATION:
{conversation_text}

SUMMARY:"""

            # Call Nova Pro via Bedrock (using same model ID as main chatbot)
            response = bedrock_runtime.invoke_model(
                modelId='us.amazon.nova-pro-v1:0',
                body=json.dumps({
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"text": prompt}]
                        }
                    ],
                    "inferenceConfig": {
                        "max_new_tokens": 500,
                        "temperature": 0.3,
                        "top_p": 0.9
                    }
                })
            )
            
            # Parse the response
            response_body = json.loads(response['body'].read())
            summary = response_body['output']['message']['content'][0]['text']
            
            return summary.strip()
            
        except Exception as e:
            logger.error(f"❌ Error calling Nova Pro: {e}")
            # Fallback to simple summary
            return self._generate_fallback_summary(conversation_text)
    
    def _generate_fallback_summary(self, conversation_text: str) -> str:
        """
        Generate a simple fallback summary if Nova Pro fails
        """
        lines = conversation_text.split('\n')
        customer_messages = [line for line in lines if line.startswith('CUSTOMER:')]
        
        if not customer_messages:
            return "No customer messages found in conversation"
        
        # Extract first customer message as primary concern
        first_concern = customer_messages[0].replace('CUSTOMER:', '').strip()
        
        summary = f"**Primary Issue**: {first_concern[:200]}...\n"
        summary += f"**Conversation Length**: {len(customer_messages)} customer messages\n"
        summary += f"**Status**: AI summary generation failed, showing basic info"
        
        return summary
    
    def get_pending_diagnoses(self, shop_id: str) -> Dict[str, Any]:
        """
        Get pending diagnostic sessions for a shop
        Implements shop-based data isolation
        """
        try:
            logger.info(f"🔧 Fetching pending diagnoses for shop: {shop_id}")
            
            # For now, we'll create mock diagnostic sessions based on recent conversations
            # In production, this would query actual diagnostic sessions
            mock_sessions = self._generate_mock_diagnostic_sessions(shop_id)
            
            return {
                'success': True,
                'data': mock_sessions,
                'count': len(mock_sessions)
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching pending diagnoses: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_shop_statistics(self, shop_id: str) -> Dict[str, Any]:
        """
        Get statistics for a shop
        """
        try:
            logger.info(f"📊 Fetching shop statistics for: {shop_id}")
            
            # Mock statistics - in production, would query actual data
            stats = {
                'totalPendingReviews': 3,
                'totalCompletedToday': 7,
                'highPriorityCount': 1,
                'averageResponseTime': 24.5  # minutes
            }
            
            return {
                'success': True,
                'data': stats
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching shop statistics: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def review_diagnosis(self, review_data: Dict[str, Any], mechanic_id: str) -> Dict[str, Any]:
        """
        Submit mechanic review for a diagnostic session or cost estimate
        """
        try:
            logger.info(f"✅ Processing mechanic review for session: {review_data.get('sessionId')}")
            
            review_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()
            
            # Convert floats to Decimal for DynamoDB
            safe_review_data = self.convert_floats_to_decimal(review_data)
            
            review_item = {
                'id': review_id,
                'sessionId': safe_review_data['sessionId'],
                'mechanicId': mechanic_id,
                'status': safe_review_data['status'],
                'mechanicNotes': safe_review_data['mechanicNotes'],
                'reviewedAt': timestamp,
                'createdAt': timestamp
            }
            
            # Add optional fields if present
            if 'modifiedDiagnosis' in safe_review_data:
                review_item['modifiedDiagnosis'] = safe_review_data['modifiedDiagnosis']
            
            if 'modifiedCost' in safe_review_data:
                review_item['modifiedCost'] = safe_review_data['modifiedCost']
            
            if 'recommendedUrgency' in safe_review_data:
                review_item['recommendedUrgency'] = safe_review_data['recommendedUrgency']
            
            if 'additionalServices' in safe_review_data:
                review_item['additionalServices'] = safe_review_data['additionalServices']
            
            # NEW: Handle cost estimate ID if this is a cost estimate review
            if 'estimateId' in safe_review_data:
                review_item['estimateId'] = safe_review_data['estimateId']
                
                # Update the original cost estimate status
                try:
                    cost_estimates_table = dynamodb.Table(os.environ.get('COST_ESTIMATES_TABLE'))
                    cost_estimates_table.update_item(
                        Key={'estimateId': safe_review_data['estimateId']},
                        UpdateExpression='SET #status = :status, mechanicReviewId = :reviewId, updatedAt = :timestamp',
                        ExpressionAttributeNames={'#status': 'status'},
                        ExpressionAttributeValues={
                            ':status': f"mechanic_{safe_review_data['status']}", # mechanic_approved, mechanic_modified, etc.
                            ':reviewId': review_id,
                            ':timestamp': timestamp
                        }
                    )
                    logger.info(f"✅ Updated cost estimate {safe_review_data['estimateId']} status")
                except Exception as e:
                    logger.warning(f"Could not update cost estimate status: {e}")
            
            # Store review in DynamoDB
            self.diagnosis_review_table.put_item(Item=review_item)
            
            logger.info(f"✅ Mechanic review stored successfully: {review_id}")
            
            # NEW: Send notification to customer if this was a cost estimate review
            if 'estimateId' in safe_review_data:
                self._notify_customer_of_estimate_review(review_item, safe_review_data)
            
            return {
                'success': True,
                'data': review_item
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing mechanic review: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _notify_customer_of_estimate_review(self, review_item: Dict, review_data: Dict):
        """Send notification to customer about estimate review"""
        try:
            # This would integrate with the customer communication system
            # For now, we'll create a mechanic message in the related request
            
            # Find the mechanic request associated with this estimate
            if 'estimateId' in review_data:
                # Implementation would go here to notify customer
                logger.info(f"📧 Customer notification sent for estimate review: {review_item['id']}")
                
        except Exception as e:
            logger.warning(f"Could not send customer notification: {e}")
    
    def request_more_info(self, request_data: Dict[str, Any], mechanic_id: str) -> Dict[str, Any]:
        """
        Create an information request from mechanic to customer
        """
        try:
            logger.info(f"📝 Processing info request for session: {request_data.get('sessionId')}")
            
            request_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()
            
            request_item = {
                'id': request_id,
                'sessionId': request_data['sessionId'],
                'mechanicId': mechanic_id,
                'requestType': request_data['requestType'],
                'message': request_data['message'],
                'urgency': request_data['urgency'],
                'status': 'pending',
                'createdAt': timestamp
            }
            
            # Store request in DynamoDB (using diagnosis review table for now)
            self.diagnosis_review_table.put_item(Item=request_item)
            
            logger.info(f"✅ Info request stored successfully: {request_id}")
            
            return {
                'success': True,
                'data': request_item
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing info request: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_quote(self, session_id: str, quote_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update quote for a diagnostic session
        """
        try:
            logger.info(f"💰 Updating quote for session: {session_id}")
            
            # Convert floats to Decimal
            safe_quote = self.convert_floats_to_decimal(quote_data)
            
            # Mock response - in production, would update actual session
            updated_session = {
                'id': session_id,
                'conversationId': f"conv_{session_id}",
                'customerId': 'customer_123',
                'estimatedCost': safe_quote,
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            return {
                'success': True,
                'data': updated_session
            }
            
        except Exception as e:
            logger.error(f"❌ Error updating quote: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_diagnostic_session(self, session_id: str) -> Dict[str, Any]:
        """
        Get detailed diagnostic session information
        """
        try:
            logger.info(f"🔍 Fetching diagnostic session: {session_id}")
            
            # Mock session data - in production, would query actual session
            session_data = self._generate_mock_diagnostic_session(session_id)
            
            return {
                'success': True,
                'data': session_data
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching diagnostic session: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_mock_diagnostic_sessions(self, shop_id: str) -> List[Dict[str, Any]]:
        """Generate mock diagnostic sessions for testing"""
        return [
            {
                'id': 'session_001',
                'conversationId': 'conv_456',
                'customerId': 'customer_123',
                'shopId': shop_id,
                'vehicleInfo': {
                    'year': 2018,
                    'make': 'Toyota',
                    'model': 'Camry',
                    'vin': 'WBXYZ1234567890AB'
                },
                'symptoms': [
                    'Brakes making squealing noise when stopping',
                    'Brake pedal feels soft'
                ],
                'aiDiagnosis': {
                    'primaryDiagnosis': {
                        'issue': 'Worn brake pads and possible brake fluid leak',
                        'confidence': 87,
                        'description': 'The squealing noise typically indicates worn brake pads, while the soft pedal suggests a brake fluid leak or air in the brake lines.'
                    },
                    'alternativeDiagnoses': [
                        {
                            'issue': 'Warped brake rotors',
                            'confidence': 65,
                            'description': 'Could be causing noise and pedal issues'
                        }
                    ],
                    'recommendedActions': [
                        'Inspect brake pads for wear',
                        'Check brake fluid level and condition',
                        'Test brake system for leaks'
                    ],
                    'confidence': 87
                },
                'estimatedCost': {
                    'min': Decimal('250'),
                    'max': Decimal('450'),
                    'description': 'Brake pad replacement and fluid service'
                },
                'urgency': 'high',
                'status': 'pending',
                'createdAt': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                'updatedAt': (datetime.utcnow() - timedelta(hours=2)).isoformat()
            },
            {
                'id': 'session_002',
                'conversationId': 'conv_012',
                'customerId': 'customer_789',
                'shopId': shop_id,
                'vehicleInfo': {
                    'year': 2020,
                    'make': 'Honda',
                    'model': 'Civic'
                },
                'symptoms': [
                    'Engine making rattling noise on startup',
                    'Noise goes away after warming up'
                ],
                'aiDiagnosis': {
                    'primaryDiagnosis': {
                        'issue': 'Cold start engine rattle - likely timing chain or VVT system',
                        'confidence': 72,
                        'description': 'Rattling noise on cold start that disappears when warm is commonly related to timing chain stretch or VVT system issues.'
                    },
                    'alternativeDiagnoses': [
                        {
                            'issue': 'Low oil pressure on startup',
                            'confidence': 58,
                            'description': 'Could cause temporary rattling until oil circulates'
                        }
                    ],
                    'recommendedActions': [
                        'Check engine oil level and condition',
                        'Inspect timing chain tension',
                        'Diagnose VVT system operation'
                    ],
                    'confidence': 72
                },
                'estimatedCost': {
                    'min': Decimal('150'),
                    'max': Decimal('800'),
                    'description': 'Diagnosis and potential timing chain service'
                },
                'urgency': 'medium',
                'status': 'pending',
                'createdAt': (datetime.utcnow() - timedelta(hours=4)).isoformat(),
                'updatedAt': (datetime.utcnow() - timedelta(hours=4)).isoformat()
            }
        ]
    
    def _generate_mock_diagnostic_session(self, session_id: str) -> Dict[str, Any]:
        """Generate a single mock diagnostic session"""
        sessions = self._generate_mock_diagnostic_sessions('shop_001')
        for session in sessions:
            if session['id'] == session_id:
                return session
        
        # Return first session if specific ID not found
        return sessions[0] if sessions else {}
    
    def get_mechanic_request_with_summary(self, request_id: str) -> Dict[str, Any]:
        """
        Get mechanic request details with AI-generated conversation summary
        This is called when a mechanic views a specific request
        """
        try:
            logger.info(f"🔧 Fetching mechanic request with summary: {request_id}")
            logger.info(f"🔍 Using scan operation for composite key table")
            
            # Since the table has composite key (id + createdAt), we need to query by id
            # using the GSI or scan with filter
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
            
            request_item = items[0]  # Get the first (should be only) match
            
            # Get conversation summary
            conversation_id = request_item.get('conversationId')
            if conversation_id:
                summary_result = self.get_conversation_summary(conversation_id)
                request_item['conversationSummary'] = summary_result.get('summary', 'Summary not available')
                request_item['summaryStatus'] = 'success' if summary_result.get('success') else 'failed'
            else:
                request_item['conversationSummary'] = 'No conversation ID available'
                request_item['summaryStatus'] = 'no_conversation'
            
            logger.info(f"✅ Mechanic request with summary retrieved successfully")
            
            return {
                'success': True,
                'data': request_item
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching mechanic request with summary: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Global instance
mechanic_service = MechanicService()
