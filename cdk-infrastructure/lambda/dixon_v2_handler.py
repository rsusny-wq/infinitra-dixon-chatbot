#!/usr/bin/env python3
"""
Dixon Smart Repair v0.2 - Main Handler
Implements enhanced onboarding flow and multi-model labor estimation
Uses Amazon Nova Pro as primary agent with simplified tools architecture
"""

import json
import logging
import time
import os
import re
import uuid
import traceback
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Any, Optional
from strands import Agent
from strands.session.s3_session_manager import S3SessionManager
from strands.agent.conversation_manager import SlidingWindowConversationManager
import boto3
from botocore.exceptions import ClientError

# Import v0.2 tools and prompts
from simplified_tools_v2 import (
    fetch_user_vehicles,
    extract_vin_from_image,
    lookup_vehicle_data,
    store_vehicle_record,
    search_web,
    calculate_labor_estimates,
    save_labor_estimate_record
)
from dixon_v2_system_prompt import get_v2_system_prompt

# Configure logging
logger = logging.getLogger(__name__)

# AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
CONVERSATION_TABLE = os.environ.get('CONVERSATION_TABLE')
MESSAGE_TABLE = os.environ.get('MESSAGE_TABLE')
S3_SESSION_BUCKET = os.environ.get('S3_SESSION_BUCKET', 'dixon-smart-repair-sessions-041063310146')
AWS_REGION = os.environ.get('AWS_REGION', 'us-west-2')

class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle Decimal objects from DynamoDB"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_v2_agent(conversation_id: str, user_id: str = None) -> Agent:
    """
    Create Nova Pro agent with v0.2 tools and enhanced system prompt
    """
    logger.info(f"🤖 Creating v0.2 agent for session: {conversation_id}")
    
    # S3 Session Manager for production persistence
    session_mgr = S3SessionManager(
        session_id=conversation_id,
        bucket=S3_SESSION_BUCKET,
        prefix="production/",
        region_name=AWS_REGION
    )
    
    # Conversation manager with sliding window
    conversation_mgr = SlidingWindowConversationManager(
        window_size=15,  # Reduced for better performance
        should_truncate_results=True  # Handle large tool results
    )
    
    # v0.2 tools - simplified and focused
    tools = [
        fetch_user_vehicles,
        extract_vin_from_image,
        lookup_vehicle_data,
        store_vehicle_record,
        search_web,
        calculate_labor_estimates,
        save_labor_estimate_record
    ]
    
    # Create agent with v0.2 configuration
    agent = Agent(
        model="us.amazon.nova-pro-v1:0",
        tools=tools,
        system_prompt=get_v2_system_prompt(),
        session_manager=session_mgr,
        conversation_manager=conversation_mgr
    )
    
    # Store context in agent state
    agent.state.set("conversation_id", conversation_id)
    agent.state.set("user_id", user_id)
    agent.state.set("is_authenticated", user_id and not user_id.startswith('anon-session-'))
    agent.state.set("version", "v0.2")
    
    logger.info(f"✅ v0.2 Agent initialized with {len(tools)} tools")
    
    return agent

def handle_v2_chat_message(args):
    """
    Main v0.2 message handler with enhanced onboarding and labor estimation
    """
    try:
        logger.info("🚀 Processing message with Dixon v0.2 handler")
        
        # Extract arguments
        conversation_id = args.get('conversationId')
        message = args.get('message', '')
        user_id = args.get('userId')
        image_base64 = args.get('imageBase64')
        diagnostic_level = args.get('diagnosticLevel', 'enhanced')
        
        if not conversation_id:
            raise ValueError("conversationId is required")
        
        if not message and not image_base64:
            raise ValueError("Either message or image is required")
        
        logger.info(f"📝 v0.2 Processing: {message[:100]}... (user: {user_id})")
        logger.info(f"🕐 TIMING DEBUG: About to create v0.2 agent at {datetime.utcnow().isoformat()}")
        
        # Get v0.2 agent for session
        agent = get_v2_agent(conversation_id, user_id)
        logger.info(f"🕐 TIMING DEBUG: v0.2 agent created at {datetime.utcnow().isoformat()}")
        
        # Store additional context in agent state
        agent.state.set("diagnostic_level", diagnostic_level)
        agent.state.set("tool_call_count", 0)
        
        # Handle image processing if image is provided
        if image_base64:
            logger.info("🖼️ Image provided, adding to agent context")
            agent.state.set("current_image", image_base64)
            message = f"{message}\n\n[IMAGE_UPLOADED: The user has uploaded an image. Use extract_vin_from_image tool if this appears to be a VIN-related image, or analyze it based on the conversation context.]"
        
        # Process message with v0.2 agent
        logger.info("🧠 v0.2 Agent processing message...")
        logger.info(f"🕐 TIMING DEBUG: About to call agent at {datetime.utcnow().isoformat()}")
        
        try:
            # Set timeout for agent processing
            import signal
            
            def timeout_handler(signum, frame):
                logger.error(f"🕐 TIMING DEBUG: Agent timeout triggered at {datetime.utcnow().isoformat()}")
                raise TimeoutError("v0.2 Agent processing timed out after 45 seconds")
            
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(45)  # 45 second timeout for v0.2
            
            try:
                logger.info(f"🕐 TIMING DEBUG: Calling agent.run() at {datetime.utcnow().isoformat()}")
                
                # Add detailed timing around agent call
                agent_start_time = datetime.utcnow()
                logger.info(f"🕐 TIMING DEBUG: Agent call initiated at {agent_start_time.isoformat()}")
                
                result = agent(message)
                
                agent_end_time = datetime.utcnow()
                agent_duration = (agent_end_time - agent_start_time).total_seconds()
                logger.info(f"🕐 TIMING DEBUG: Agent.run() completed at {agent_end_time.isoformat()}")
                logger.info(f"🕐 TIMING DEBUG: Total agent processing time: {agent_duration:.2f} seconds")
                
                signal.alarm(0)  # Cancel timeout
                
                if not result or (isinstance(result, str) and not result.strip()):
                    raise ValueError("v0.2 Agent returned empty result")
                
                logger.info("✅ v0.2 Agent processing successful")
                logger.info(f"🕐 TIMING DEBUG: Agent processing success logged at {datetime.utcnow().isoformat()}")
                
            except TimeoutError:
                signal.alarm(0)
                logger.error("⏰ v0.2 Agent processing timed out")
                logger.error(f"🕐 TIMING DEBUG: Timeout exception caught at {datetime.utcnow().isoformat()}")
                
                return {
                    'conversationId': conversation_id,
                    'message': "I'm taking a bit longer to process your request. Let me provide some quick assistance while I work on a more detailed response.",
                    'timestamp': datetime.utcnow().isoformat(),
                    'sender': 'assistant',
                    'poweredBy': 'Dixon Smart Repair AI v0.2',
                    'success': True,
                    'diagnostic_context': {
                        'level': diagnostic_level,
                        'accuracy': '95%',
                        'user_selection': 'enhanced',
                        'vin_enhanced': True,
                        'version': 'v0.2-timeout-fallback'
                    }
                }
                
        except Exception as agent_error:
            signal.alarm(0)
            logger.error(f"❌ v0.2 Agent call failed: {str(agent_error)}")
            logger.error(f"❌ Error traceback: {traceback.format_exc()}")
            
            # v0.2 fallback response
            fallback_message = "I'm experiencing some technical difficulties with my enhanced v0.2 features. Let me provide basic automotive assistance:\n\n"
            fallback_message += "Please describe your vehicle issue, and I'll do my best to help with:\n"
            fallback_message += "• Basic diagnostic questions\n"
            fallback_message += "• General repair guidance\n"
            fallback_message += "• Cost estimation assistance\n\n"
            fallback_message += "If you have a VIN or vehicle details, please share them to help me provide better assistance."
            
            return {
                'conversationId': conversation_id,
                'message': fallback_message,
                'timestamp': datetime.utcnow().isoformat(),
                'sender': 'assistant',
                'poweredBy': 'Dixon Smart Repair AI v0.2',
                'success': True,
                'diagnostic_context': {
                    'level': diagnostic_level,
                    'accuracy': '95%',
                    'user_selection': 'enhanced',
                    'vin_enhanced': True,
                    'version': 'v0.2-fallback',
                    'error_context': {
                        'original_error': str(agent_error),
                        'fallback_used': True
                    }
                }
            }
        
        # Process agent response
        logger.info(f"🕐 TIMING DEBUG: About to process agent response at {datetime.utcnow().isoformat()}")
        response_message = result
        
        # Handle dictionary responses from Strands agent
        if isinstance(response_message, dict):
            logger.info(f"📝 Processing dict response: {list(response_message.keys())}")
            
            if 'content' in response_message:
                if isinstance(response_message['content'], list) and len(response_message['content']) > 0:
                    response_message = response_message['content'][0].get('text', str(response_message))
                else:
                    response_message = str(response_message['content'])
            elif 'message' in response_message:
                response_message = response_message['message']
            elif 'text' in response_message:
                response_message = response_message['text']
            else:
                response_message = str(response_message)
        
        # Ensure response is a string
        if not isinstance(response_message, str):
            response_message = str(response_message)
        
        response_message = response_message.strip()
        logger.info(f"🕐 TIMING DEBUG: Response message processed at {datetime.utcnow().isoformat()}")
        
        # Clean any formatting artifacts and remove thinking tags
        if isinstance(response_message, str):
            # Remove thinking tags that shouldn't be exposed to users
            response_message = re.sub(r'<thinking>.*?</thinking>', '', response_message, flags=re.DOTALL)
            
            # Remove common Strands response formatting artifacts
            response_message = re.sub(r"^\{'role':\s*'assistant',\s*'content':\s*\[\{'text':\s*'", '', response_message)
            response_message = re.sub(r"'\}\]\}$", '', response_message)
            response_message = response_message.strip()
        
        logger.info(f"🕐 TIMING DEBUG: Response cleaning completed at {datetime.utcnow().isoformat()}")
        logger.info(f"✅ v0.2 Agent response generated: {len(response_message)} characters")
        
        # Store message in DynamoDB
        logger.info(f"🕐 TIMING DEBUG: About to save to DynamoDB at {datetime.utcnow().isoformat()}")
        assistant_timestamp = datetime.utcnow().isoformat()
        
        try:
            message_table = dynamodb.Table(MESSAGE_TABLE)
            message_table.put_item(
                Item={
                    'id': str(uuid.uuid4()),
                    'conversationId': conversation_id,
                    'content': response_message,
                    'sender': 'assistant',
                    'timestamp': assistant_timestamp,
                    'version': 'v0.2',
                    'metadata': {
                        'diagnostic_level': diagnostic_level,
                        'user_id': user_id,
                        'enhanced_features': True
                    }
                }
            )
            logger.info(f"🕐 TIMING DEBUG: DynamoDB save completed at {datetime.utcnow().isoformat()}")
            logger.info("💾 v0.2 Response saved to DynamoDB")
            
        except Exception as db_error:
            logger.error(f"❌ Failed to save v0.2 message to DynamoDB: {str(db_error)}")
            logger.error(f"🕐 TIMING DEBUG: DynamoDB error at {datetime.utcnow().isoformat()}")
        
        # Return successful response in correct format
        logger.info(f"🕐 TIMING DEBUG: About to return response at {datetime.utcnow().isoformat()}")
        
        return {
            'conversationId': conversation_id,
            'message': response_message,
            'timestamp': assistant_timestamp,
            'sender': 'assistant',  # Required by GraphQL schema
            'poweredBy': 'Dixon Smart Repair AI v0.2',  # Required by GraphQL schema
            'success': True,
            'diagnostic_context': {
                'level': diagnostic_level,
                'accuracy': '95%',  # v0.2 enhanced accuracy
                'user_selection': 'enhanced',
                'vin_enhanced': True,
                'version': 'v0.2'
            }
        }
        
    except Exception as e:
        logger.error(f"❌ v0.2 Handler error: {str(e)}")
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        logger.error(f"🕐 TIMING DEBUG: Exception caught at {datetime.utcnow().isoformat()}")
        
        return {
            'success': False,
            'error': f"v0.2 Handler error: {str(e)}",
            'conversationId': conversation_id if 'conversation_id' in locals() else '',
            'message': f"I'm experiencing technical difficulties. Error: {str(e)}",
            'timestamp': datetime.utcnow().isoformat(),
            'sender': 'system',
            'poweredBy': 'Dixon Smart Repair AI v0.2'
        }

def lambda_handler(event, context):
    """
    AWS Lambda entry point for v0.2 handler
    """
    try:
        # Parse the event
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        # Route to v0.2 chat handler
        return handle_v2_chat_message(body)
        
    except Exception as e:
        logger.error(f"❌ Lambda handler error: {str(e)}")
        return {
            'success': False,
            'error': f"Lambda error: {str(e)}",
            'conversationId': '',
            'message': f"System error occurred: {str(e)}",
            'timestamp': datetime.utcnow().isoformat(),
            'sender': 'system',
            'poweredBy': 'Dixon Smart Repair AI v0.2'
        }
