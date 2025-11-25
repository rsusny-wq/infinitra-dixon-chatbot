#!/usr/bin/env python3
"""
Dixon Smart Repair - Strands Best Practices Compliant Handler (FIXED VERSION)
100% compliant with Strands best practices - simplified, clean implementation
FIXES: Correct AgentState API usage without default values and TTL parameters
"""

import json
import logging
import time
import os
import re
import uuid
import traceback
from datetime import datetime
from ai_title_generator import generate_ai_title, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional
from strands import Agent
from strands.session.s3_session_manager import S3SessionManager
from strands.agent.conversation_manager import SlidingWindowConversationManager
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

# Import versioned system prompts
from dixon_system_prompt import get_system_prompt, get_prompt_info

# Configure logging
logger = logging.getLogger(__name__)

class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle Decimal objects from DynamoDB"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def convert_dynamodb_item(item):
    """Convert DynamoDB item format to regular format and handle Decimal objects"""
    if isinstance(item, dict):
        converted = {}
        for k, v in item.items():
            if isinstance(v, Decimal):
                converted[k] = float(v)
            elif isinstance(v, dict):
                converted[k] = convert_dynamodb_item(v)
            elif isinstance(v, list):
                converted[k] = [convert_dynamodb_item(i) for i in v]
            else:
                converted[k] = v
        return converted
    elif isinstance(item, Decimal):
        return float(item)
    elif isinstance(item, list):
        return [convert_dynamodb_item(i) for i in item]
    else:
        return item

# PHASE 5: Import privacy management components
try:
    from privacy_manager import PrivacyManager
    PRIVACY_MANAGER_AVAILABLE = True
    logger.info("✅ Privacy Manager available")
except ImportError as e:
    logger.warning(f"⚠️ Privacy Manager not available: {e}")
    PRIVACY_MANAGER_AVAILABLE = False

# NEW: Import mechanic service for mechanic interface operations
try:
    from mechanic_service import mechanic_service
    MECHANIC_SERVICE_AVAILABLE = True
    logger.info("✅ Mechanic Service available")
except ImportError as e:
    logger.warning(f"⚠️ Mechanic Service not available: {e}")
    MECHANIC_SERVICE_AVAILABLE = False

# NEW: Import shop visit service for Phase 1.1 - Shop Visit Recognition
try:
    from shop_visit_service import (
        handle_record_shop_visit,
        handle_get_user_visits,
        handle_get_shop_visits,
        handle_get_visit_by_id,
        handle_update_visit_status
    )
    SHOP_VISIT_SERVICE_AVAILABLE = True
    logger.info("✅ Shop Visit Service available")
except ImportError as e:
    logger.warning(f"⚠️ Shop Visit Service not available: {e}")
    SHOP_VISIT_SERVICE_AVAILABLE = False

# NEW: Phase 2.1 - Import customer communication service
try:
    from customer_communication_service import customer_communication_service
    CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE = True
    logger.info("✅ Customer Communication Service available")
except ImportError as e:
    logger.warning(f"⚠️ Customer Communication Service not available: {e}")
    CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE = False

# NEW: Phase 2.2 - Import work authorization service
try:
    from work_authorization_service import work_authorization_service
    WORK_AUTHORIZATION_SERVICE_AVAILABLE = True
    logger.info("✅ Work Authorization Service available")
except ImportError as e:
    logger.warning(f"⚠️ Work Authorization Service not available: {e}")
    WORK_AUTHORIZATION_SERVICE_AVAILABLE = False

# NEW: Vehicle Management Service
try:
    from vehicle_service import (
        handle_add_user_vehicle,
        handle_get_user_vehicles,
        handle_get_vehicle_by_id,
        handle_update_user_vehicle,
        handle_delete_user_vehicle
    )
    VEHICLE_SERVICE_AVAILABLE = True
    logger.info("✅ Vehicle Service available")
except ImportError as e:
    logger.warning(f"⚠️ Vehicle Service not available: {e}")
    VEHICLE_SERVICE_AVAILABLE = False

# Import INTELLIGENT automotive tools - NEW: Agent intelligence approach
try:
    # NEW: Import intelligent automotive search tools
    from intelligent_automotive_search import intelligent_automotive_search, get_vehicle_context
    
    # Keep existing NHTSA tools
    from automotive_tools_atomic_fixed import nhtsa_vehicle_lookup
    
    # NEW: Import save cost estimate tool (simplified approach)
    from save_cost_estimate_tool import save_cost_estimate
    
    logger.info("✅ Using INTELLIGENT automotive tools architecture")
    ATOMIC_TOOLS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"⚠️ Intelligent tools not available, trying fallback: {e}")
    try:
        # Fallback to existing atomic tools
        from automotive_tools_atomic_fixed import (
            tavily_automotive_search,
            nhtsa_vehicle_lookup
        )
        from save_cost_estimate_tool import save_cost_estimate
        
        logger.info("✅ Using fallback atomic tools")
        ATOMIC_TOOLS_AVAILABLE = True
    except ImportError as e2:
        logger.warning(f"⚠️ Atomic tools not available, trying legacy: {e2}")
        try:
            # Final fallback to existing working tools
            from automotive_tools_enhanced import (
                symptom_diagnosis_analyzer as automotive_symptom_analyzer,
                repair_instructions as repair_procedure_lookup,
                # interactive_parts_selector removed - now handled via agent prompt instructions
                parts_availability_lookup,
                labor_estimator,
                pricing_calculator
            )
            logger.info("✅ Using legacy automotive tools")
            ATOMIC_TOOLS_AVAILABLE = False
        except ImportError as e3:
            logger.error(f"❌ No automotive tools available: {e3}")
            ATOMIC_TOOLS_AVAILABLE = False

# Import VIN Context Manager
try:
    from vin_context_manager import VINContextManager
    VIN_CONTEXT_AVAILABLE = True
except ImportError:
    VIN_CONTEXT_AVAILABLE = False

# Configuration
S3_SESSION_BUCKET = "dixon-smart-repair-sessions-041063310146"
AWS_REGION = "us-west-2"

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)

# DynamoDB Tables
CONVERSATION_TABLE = os.environ.get('CONVERSATION_TABLE')
MESSAGE_TABLE = os.environ.get('MESSAGE_TABLE') 
VEHICLE_TABLE = os.environ.get('VEHICLE_TABLE')

# Get system prompt (default to light wrapper version)
PROMPT_VERSION = os.environ.get('DIXON_PROMPT_VERSION', 'light_wrapper')
DIXON_SYSTEM_PROMPT = get_system_prompt(PROMPT_VERSION)

# Log prompt version info
prompt_info = get_prompt_info()
logger.info(f"🎯 Using Dixon System Prompt v{prompt_info['version']} ({PROMPT_VERSION})")
logger.info(f"📅 Last updated: {prompt_info['last_updated']}")

def convert_floats_to_decimal(obj):
    """
    Recursively convert float values to Decimal for DynamoDB compatibility
    """
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {key: convert_floats_to_decimal(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimal(item) for item in obj]
    else:
        return obj

def safe_agent_state_get(agent, key: str, default_value=None):
    """
    Safely get value from agent state with default fallback
    FIXED: Handles AgentState.get() API correctly
    """
    try:
        value = agent.state.get(key)
        return value if value is not None else default_value
    except Exception as e:
        logger.warning(f"Error getting agent state key '{key}': {e}")
        return default_value

def save_message_to_dynamodb(conversation_id: str, message_content: str, role: str, user_id: str = None, metadata: Dict = None):
    """
    Save message to DynamoDB message table
    """
    if not MESSAGE_TABLE:
        logger.warning("MESSAGE_TABLE not configured, skipping message persistence")
        return
    
    try:
        table = dynamodb.Table(MESSAGE_TABLE)
        
        message_item = {
            'id': str(uuid.uuid4()),
            'conversationId': conversation_id,
            'content': message_content,
            'role': role.upper(),
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata or {}
        }
        
        if user_id:
            message_item['metadata']['user_id'] = user_id
            
        # Convert floats to Decimal for DynamoDB
        message_item = convert_floats_to_decimal(message_item)
        
        table.put_item(Item=message_item)
        logger.info(f"✅ Saved {role} message to DynamoDB: {conversation_id}")
        
    except Exception as e:
        logger.error(f"❌ Failed to save message to DynamoDB: {e}")

def save_conversation_context(conversation_id: str, vehicle_context: str = None, user_id: str = None, diagnostic_level: str = 'quick', title: str = 'New Chat'):
    """
    Save or create conversation context in DynamoDB with all required fields for UI display
    Ensures every conversation has all fields needed for getUserConversations query
    """
    logger.info(f"💾 save_conversation_context called with: conversation_id={conversation_id}, user_id={user_id}, diagnostic_level={diagnostic_level}")
    
    if not CONVERSATION_TABLE:
        logger.warning("CONVERSATION_TABLE not configured, skipping conversation persistence")
        return
        
    try:
        table = dynamodb.Table(CONVERSATION_TABLE)
        current_time = datetime.utcnow().isoformat()
        
        # Try to get existing conversation first
        try:
            existing = table.get_item(Key={'id': conversation_id})
            conversation_exists = 'Item' in existing
            existing_item = existing.get('Item', {}) if conversation_exists else {}
        except Exception:
            conversation_exists = False
            existing_item = {}
        
        if conversation_exists:
            # Update existing conversation, ensuring all required fields are present
            update_expression = "SET updatedAt = :timestamp"
            expression_values = {':timestamp': current_time}
            
            # Ensure required fields exist - add them if missing
            if 'createdAt' not in existing_item:
                update_expression += ", createdAt = :createdAt"
                expression_values[':createdAt'] = current_time
                
            if 'title' not in existing_item:
                update_expression += ", title = :title"
                expression_values[':title'] = title
                
            if 'diagnosticLevel' not in existing_item:
                update_expression += ", diagnosticLevel = :diagnosticLevel"
                expression_values[':diagnosticLevel'] = diagnostic_level
                
            if 'diagnosticAccuracy' not in existing_item:
                update_expression += ", diagnosticAccuracy = :diagnosticAccuracy"
                expression_values[':diagnosticAccuracy'] = '80%'
                
            if 'vinEnhanced' not in existing_item:
                update_expression += ", vinEnhanced = :vinEnhanced"
                expression_values[':vinEnhanced'] = False
                
            if 'messageCount' not in existing_item:
                update_expression += ", messageCount = :messageCount"
                expression_values[':messageCount'] = 0
            
            # Always update vehicle context if provided
            if vehicle_context:
                update_expression += ", vehicleContext = :vehicle"
                expression_values[':vehicle'] = vehicle_context
                
            # Ensure userId is set for authenticated users
            if user_id and 'userId' not in existing_item:
                update_expression += ", userId = :userId"
                expression_values[':userId'] = user_id
                
            table.update_item(
                Key={'id': conversation_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values
            )
            logger.info(f"✅ Updated conversation with all required fields: {conversation_id}")
        else:
            # Create new conversation with all required fields
            conversation_item = {
                'id': conversation_id,
                'title': title,
                'createdAt': current_time,
                'updatedAt': current_time,
                'diagnosticLevel': diagnostic_level,
                'diagnosticAccuracy': '80%',  # Default accuracy
                'vinEnhanced': False,
                'messageCount': 0
            }
            
            if vehicle_context:
                conversation_item['vehicleContext'] = vehicle_context
                
            if user_id:
                conversation_item['userId'] = user_id
                logger.info(f"💾 Setting userId in conversation: {user_id}")
            else:
                logger.warning(f"💾 No userId provided for conversation: {conversation_id}")
                
            table.put_item(Item=conversation_item)
            logger.info(f"✅ Created new conversation with all required fields: {conversation_id} (userId: {user_id})")
        
    except Exception as e:
        logger.error(f"❌ Failed to save conversation context: {e}")
        # Log the full error for debugging
        import traceback
        logger.error(f"❌ Full error traceback: {traceback.format_exc()}")

def get_tools_for_diagnostic_level(diagnostic_level: str) -> List:
    """
    Get appropriate tools - INTELLIGENT APPROACH: Give agent all tools, let it decide usage
    Following Strands best practices: Trust the agent's intelligence
    """
    if not ATOMIC_TOOLS_AVAILABLE:
        # Fallback to existing tools
        return [
            automotive_symptom_analyzer,
            repair_procedure_lookup,
            # interactive_parts_selector removed - now handled via agent prompt instructions
            parts_availability_lookup,
            labor_estimator,
            pricing_calculator
        ]
    
    # INTELLIGENT APPROACH: Simplified tools, agent decides when to use them
    # The system prompt guides intelligent usage and result validation
    try:
        # Try to use new intelligent tools
        all_tools = [
            intelligent_automotive_search,  # Simplified intelligent search
            get_vehicle_context,           # Simple vehicle context access
            nhtsa_vehicle_lookup,          # For precise vehicle data when needed
            save_cost_estimate             # For saving estimates (handles auth internally)
        ]
        logger.info("✅ Using intelligent automotive search tools")
    except NameError:
        # Fallback to existing tools if new ones aren't available
        try:
            all_tools = [
                tavily_automotive_search,  # Fallback search tool
                nhtsa_vehicle_lookup,      # For precise vehicle data when needed
                save_cost_estimate         # For saving estimates (handles auth internally)
            ]
            logger.info("✅ Using fallback automotive tools")
        except NameError:
            # Final fallback to legacy tools
            all_tools = [
                automotive_symptom_analyzer,
                repair_procedure_lookup,
                # interactive_parts_selector removed - now handled via agent prompt instructions
                parts_availability_lookup,
                labor_estimator,
                pricing_calculator
            ]
            logger.info("✅ Using legacy automotive tools")
    
    # Add image processing and VIN association tools if available
    try:
        from strands_tools import image_reader  # Use Strands built-in image_reader tool
        from vin_vehicle_association_tool import get_user_vehicles, create_vehicle_with_vin, associate_vin_with_existing_vehicle
        all_tools.extend([
            image_reader,                       # Strands built-in image processing
            get_user_vehicles,                  # Get user's existing vehicles
            create_vehicle_with_vin,            # Create new vehicle with VIN
            associate_vin_with_existing_vehicle # Associate VIN with existing vehicle
        ])
        logger.info("✅ Strands image_reader and VIN association tools added to agent")
    except ImportError as e:
        logger.warning(f"⚠️ Image processing tools not available: {e}")
    
    logger.info(f"🧠 Providing all tools to agent for intelligent usage (level: {diagnostic_level})")
    return all_tools
    """
    Generate unified system prompt - COMPREHENSIVE ADAPTIVE APPROACH
    Uses the new unified prompt that combines intelligent behavior with comprehensive functionality
    """
    try:
        from dixon_unified_prompt import get_system_prompt
        
        # Determine authentication status
        is_authenticated = user_id and not user_id.startswith('anon-session-')
        
        logger.info(f"🧠 Using unified system prompt (auth: {is_authenticated}, level: {diagnostic_level})")
        return get_system_prompt()
        
    except ImportError:
        logger.warning("⚠️ Unified prompt not available, using fallback")
        # Fallback to existing prompt
        base_prompt = DIXON_SYSTEM_PROMPT
        
        # Determine authentication status
        is_authenticated = user_id and not user_id.startswith('anon-session-')
        auth_status = "AUTHENTICATED" if is_authenticated else "NON-AUTHENTICATED"
        
        # Simple intelligent context
        level_context = f"""
**CURRENT SESSION CONTEXT:**
- Diagnostic Level: {diagnostic_level}
- Authentication: {auth_status}
- User ID: {user_id}

**INTELLIGENT BEHAVIOR:**
- Use tools strategically based on search result quality
- Ask for vehicle information when search results are too generic
- Provide immediate value with available information
- Guide conversation flow based on tool feedback
        """
        
        return f"{base_prompt}\n\n{level_context}"

def get_agent_for_session(conversation_id: str, diagnostic_level: str = "quick", user_id: str = None) -> Agent:
    """
    Create or retrieve Strands Agent for session with diagnostic level context
    PHASE 4: Context-aware agent initialization
    """
    logger.info(f"🤖 Creating agent for session: {conversation_id} (level: {diagnostic_level})")
    
    # S3 Session Manager for production persistence
    session_manager = S3SessionManager(
        session_id=conversation_id,
        bucket=S3_SESSION_BUCKET,
        prefix="production/",
        region_name=AWS_REGION
    )
    
    # Sliding Window Conversation Manager for context (optimized for performance)
    conversation_manager = SlidingWindowConversationManager(
        window_size=15,  # Reduced from 20 to 15 for better performance
        should_truncate_results=True  # Handle large tool results
    )
    
    # Get appropriate tools for diagnostic level
    tools = get_tools_for_diagnostic_level(diagnostic_level)
    
    # Create agent with intelligent configuration
    agent = Agent(
        model="us.amazon.nova-pro-v1:0",
        tools=tools,
        system_prompt=get_contextual_system_prompt(diagnostic_level, user_id=user_id),
        session_manager=session_manager,
        conversation_manager=conversation_manager
    )
    
    # Store context in agent state for tool access
    agent.state.set("diagnostic_level", diagnostic_level)
    agent.state.set("conversation_id", conversation_id)
    agent.state.set("user_id", user_id)
    agent.state.set("is_authenticated", user_id and not user_id.startswith('anon-session-'))
    
    logger.info(f"🤖 Agent initialized with intelligent prompt (auth: {agent.state.get('is_authenticated')})")
    
    return agent

def handle_chat_message(args):
    """
    Handle chat message with Strands best practices
    PHASE 4: Context-aware diagnostic processing
    v0.2 ENHANCEMENT: Feature flag support for gradual migration
    """
    try:
        # v0.2 FEATURE FLAGS - Check if we should use v0.2 features
        USE_V2_HANDLER = os.environ.get('USE_V2_HANDLER', 'false').lower() == 'true'
        USE_V2_LABOR_ESTIMATION = os.environ.get('USE_V2_LABOR_ESTIMATION', 'false').lower() == 'true'
        USE_V2_ONBOARDING = os.environ.get('USE_V2_ONBOARDING', 'false').lower() == 'true'
        
        # If full v0.2 handler is enabled, delegate to v0.2
        if USE_V2_HANDLER:
            try:
                from dixon_v2_handler_refactored import handle_v2_chat_message_refactored
                logger.info("🚀 Routing to v0.2 refactored handler (with Llama 3.1 8B)")
                
                # 🔍 DEBUG: Log arguments being passed to v2 handler
                logger.info(f"🔍 DEBUG: Arguments passed to v2 handler: {json.dumps(args, indent=2, default=str)}")
                
                return handle_v2_chat_message_refactored(args)
            except ImportError as e:
                logger.warning(f"⚠️ v0.2 handler not available, falling back to v0.1: {e}")
                # Continue with existing logic
        
        # Log which features are enabled
        if USE_V2_LABOR_ESTIMATION or USE_V2_ONBOARDING:
            logger.info(f"🔄 v0.2 Features enabled - Labor: {USE_V2_LABOR_ESTIMATION}, Onboarding: {USE_V2_ONBOARDING}")
        
        # Extract parameters with proper null checks
        if not args:
            return {
                'success': False,
                'error': 'No arguments provided',
                'conversationId': '',
                'message': 'Error: No arguments provided',
                'timestamp': datetime.utcnow().isoformat(),
                'sender': 'system',
                'poweredBy': 'Dixon Smart Repair AI'
            }
            
        conversation_id = args.get('conversationId')
        message = args.get('message', '')
        user_id = args.get('userId', '')
        image_base64 = args.get('image_base64')  # Keep for backward compatibility
        image_s3_key = args.get('image_s3_key')  # NEW: S3 image key
        image_s3_bucket = args.get('image_s3_bucket')  # NEW: S3 bucket name
        
        # PHASE 4: Extract diagnostic context with proper null handling and JSON parsing
        diagnostic_context = args.get('diagnostic_context')
        if diagnostic_context is None:
            diagnostic_context = {}
        elif isinstance(diagnostic_context, str):
            # Parse JSON string to dictionary
            try:
                diagnostic_context = json.loads(diagnostic_context)
                logger.info(f"📋 Parsed diagnostic context: {diagnostic_context}")
            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ Failed to parse diagnostic_context JSON: {e}")
                diagnostic_context = {}
        elif not isinstance(diagnostic_context, dict):
            logger.warning(f"⚠️ Unexpected diagnostic_context type: {type(diagnostic_context)}")
            diagnostic_context = {}
        
        diagnostic_level = diagnostic_context.get('level', 'quick') if diagnostic_context else 'quick'
        diagnostic_accuracy = diagnostic_context.get('accuracy', 65) if diagnostic_context else 65
        user_selection = diagnostic_context.get('user_selection', 'Quick help') if diagnostic_context else 'Quick help'
        
        logger.info(f"💬 Processing message for {conversation_id} (level: {diagnostic_level})")
        
        if not conversation_id or not message:
            return {
                'success': False,
                'error': 'Missing required parameters: conversationId and message',
                'conversationId': args.get('conversationId', ''),
                'message': 'Error: Missing required parameters',
                'timestamp': datetime.utcnow().isoformat(),
                'sender': 'system',
                'poweredBy': 'Dixon Smart Repair AI'
            }
        
        # Get agent for session with diagnostic context
        agent = get_agent_for_session(conversation_id, diagnostic_level, user_id)
        
        # Store user context in agent state (FIXED: No default value parameter)
        agent.state.set("user_id", user_id)
        agent.state.set("conversation_id", conversation_id)
        agent.state.set("diagnostic_accuracy", diagnostic_accuracy)
        agent.state.set("user_selection", user_selection)
        agent.state.set("tool_call_count", 0)  # Track tool calls to prevent excessive retries
        is_authenticated = bool(user_id and not user_id.startswith('anon-'))
        agent.state.set("is_authenticated", is_authenticated)
        
        # Handle image processing if image is provided (S3 or base64)
        temp_image_path = None
        if image_s3_key and image_s3_bucket:
            logger.info(f"🖼️ S3 image provided: s3://{image_s3_bucket}/{image_s3_key}")
            temp_image_path = _download_s3_image_to_temp(image_s3_bucket, image_s3_key)
            agent.state.set("temp_image_path", temp_image_path)
            message = f"{message}\n\n[IMAGE_UPLOADED: I've uploaded an image at {temp_image_path}. Please analyze it if relevant to my request, especially for VIN extraction.]"
        elif image_base64:
            logger.info(f"🖼️ Base64 image provided (legacy), converting to temp file")
            temp_image_path = _save_base64_image_to_temp(image_base64)
            agent.state.set("temp_image_path", temp_image_path)
            message = f"{message}\n\n[IMAGE_UPLOADED: I've uploaded an image at {temp_image_path}. Please analyze it if relevant to my request, especially for VIN extraction.]"
        
        # Process message with agent - WITH COMPREHENSIVE ERROR HANDLING
        logger.info(f"🧠 Agent processing message: {message[:100]}...")
        
        try:
            # Set a reasonable timeout for agent processing (30 seconds - reduced from 60)
            import signal
            
            def timeout_handler(signum, frame):
                raise TimeoutError("Agent processing timed out after 30 seconds")
            
            # Set timeout signal
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(30)  # 30 second timeout (reduced from 60 for faster failure)
            
            try:
                result = agent(message)
                signal.alarm(0)  # Cancel timeout
                
                # Validate agent result
                if not result:
                    raise ValueError("Agent returned empty/None result")
                
                if isinstance(result, str) and not result.strip():
                    raise ValueError("Agent returned empty string")
                    
                logger.info(f"✅ Agent processing successful")
                
            except TimeoutError:
                signal.alarm(0)  # Cancel timeout
                logger.error("⏰ Agent processing timed out after 30 seconds")
                
                # Return timeout fallback response
                return {
                    'conversationId': conversation_id,
                    'message': "I'm taking longer than usual to process your request. Let me provide some quick automotive guidance:\n\n" +
                              "For car not starting issues, check:\n" +
                              "1. Battery connections and charge\n" +
                              "2. Fuel level and fuel pump\n" +
                              "3. Starter motor function\n" +
                              "4. Ignition system\n\n" +
                              "Please try your question again, and I'll do my best to help!",
                    'timestamp': datetime.utcnow().isoformat(),
                    'sender': 'assistant',
                    'poweredBy': 'Dixon Smart Repair AI (Fallback)',
                    'success': True,
                    'diagnostic_context': {
                        'level': diagnostic_level,
                        'accuracy': 'basic',
                        'user_selection': 'Fallback Help',
                        'vin_enhanced': False
                    }
                }
                
        except Exception as agent_error:
            signal.alarm(0)  # Cancel timeout if set
            logger.error(f"❌ Agent call failed: {str(agent_error)}")
            logger.error(f"❌ Agent error type: {type(agent_error).__name__}")
            
            # Categorize error types for better user messages
            error_type = type(agent_error).__name__
            
            if "Bedrock" in str(agent_error) or "bedrock" in str(agent_error).lower():
                fallback_message = "I'm having trouble accessing my AI knowledge base right now. Here's some basic automotive help:\n\n"
            elif "Tavily" in str(agent_error) or "search" in str(agent_error).lower():
                fallback_message = "I'm having trouble searching for specific information right now. Let me provide general guidance:\n\n"
            elif "timeout" in str(agent_error).lower() or "time" in str(agent_error).lower():
                fallback_message = "My response is taking longer than expected. Here's some quick help:\n\n"
            else:
                fallback_message = "I encountered a technical issue, but I can still provide basic automotive guidance:\n\n"
            
            # Add relevant automotive guidance based on message content
            message_lower = message.lower()
            if "not starting" in message_lower or "won't start" in message_lower:
                fallback_message += "For starting issues:\n• Check battery charge and connections\n• Verify fuel level\n• Listen for starter motor sounds\n• Check for dashboard warning lights"
            elif "battery" in message_lower:
                fallback_message += "For battery issues:\n• Test battery voltage (should be 12.6V when off)\n• Clean battery terminals\n• Check alternator charging (13.5-14.5V when running)\n• Consider battery age (3-5 years typical lifespan)"
            elif "brake" in message_lower:
                fallback_message += "For brake issues:\n• Check brake fluid level\n• Listen for squealing or grinding sounds\n• Feel for vibration when braking\n• Inspect brake pads through wheel spokes"
            else:
                fallback_message += "Common automotive troubleshooting:\n• Check fluid levels\n• Look for warning lights\n• Listen for unusual sounds\n• Note any performance changes"
            
            fallback_message += "\n\nPlease try your question again - I should be back to full functionality shortly!"
            
            return {
                'conversationId': conversation_id,
                'message': fallback_message,
                'timestamp': datetime.utcnow().isoformat(),
                'sender': 'assistant',
                'poweredBy': 'Dixon Smart Repair AI (Fallback)',
                'success': True,
                'diagnostic_context': {
                    'level': 'basic',
                    'accuracy': 'fallback',
                    'user_selection': 'Emergency Help',
                    'vin_enhanced': False
                },
                'error_context': {
                    'original_error': str(agent_error),
                    'error_type': error_type,
                    'fallback_used': True
                }
            }
        
        # Extract clean response message with proper dict handling
        if hasattr(result, 'message'):
            response_message = result.message
        else:
            response_message = result
        
        # Handle dictionary responses from Strands agent
        if isinstance(response_message, dict):
            logger.info(f"📝 Processing dict response: {list(response_message.keys())}")
            
            # Common patterns for Strands agent responses
            if 'content' in response_message:
                if isinstance(response_message['content'], list) and len(response_message['content']) > 0:
                    # Handle content as list of text blocks
                    content_item = response_message['content'][0]
                    if isinstance(content_item, dict) and 'text' in content_item:
                        response_message = content_item['text']
                    else:
                        response_message = str(content_item)
                else:
                    response_message = str(response_message['content'])
            elif 'text' in response_message:
                response_message = response_message['text']
            elif 'message' in response_message:
                response_message = response_message['message']
            else:
                # Fallback: convert entire dict to string
                response_message = str(response_message)
        
        # Ensure we have a string before applying regex
        if not isinstance(response_message, str):
            response_message = str(response_message)
        
        # Clean any formatting artifacts (only if it's a string)
        if isinstance(response_message, str):
            # Remove thinking tags that shouldn't be exposed to users
            response_message = re.sub(r'<thinking>.*?</thinking>', '', response_message, flags=re.DOTALL)
            
            # Remove common Strands response formatting artifacts
            response_message = re.sub(r"^\{'role':\s*'assistant',\s*'content':\s*\[\{'text':\s*'", '', response_message)
            response_message = re.sub(r"'\}\]\}$", '', response_message)
            response_message = response_message.strip()
        
        logger.info(f"✅ Agent response generated: {len(response_message)} characters")
        
        # Store assistant message timestamp
        assistant_timestamp = datetime.utcnow().isoformat()
        
        # PHASE 2 ENHANCEMENT: Update session metadata after successful processing (FIXED)
        try:
            if hasattr(agent, 'session_mgr'):
                session_mgr = agent.session_mgr
                is_authenticated = safe_agent_state_get(agent, "is_authenticated", False)
                
                if is_authenticated:
                    # Update authenticated user session metadata
                    diagnostic_level_value = safe_agent_state_get(agent, "diagnostic_level", "quick")
                    vin_data = safe_agent_state_get(agent, "vin_data")
                    
                    session_mgr.update_session_context(conversation_id, {
                        "last_accessed": assistant_timestamp,
                        "message_count": len(agent.messages),
                        "diagnostic_level": diagnostic_level_value,
                        "diagnostic_accuracy": "95%" if vin_data else "65%",
                        "vin_enhanced": bool(vin_data)
                    })
                    logger.info(f"✅ Updated session metadata for authenticated user: {conversation_id}")
                else:
                    # Update anonymous user session context
                    user_id_value = safe_agent_state_get(agent, "user_id", "")
                    if user_id_value.startswith('anon-session-'):
                        diagnostic_level_value = safe_agent_state_get(agent, "diagnostic_level", "quick")
                        
                        session_mgr.update_anonymous_context(user_id_value, {
                            "diagnostic_level": diagnostic_level_value,
                            "interaction_state": {
                                "has_described_problem": True,
                                "has_selected_diagnostic_level": True,
                                "current_step": "diagnosis_complete"
                            },
                            "last_interaction": assistant_timestamp
                        })
                        logger.info(f"✅ Updated anonymous session context: {user_id_value}")
        except Exception as session_error:
            logger.warning(f"⚠️ Could not update session metadata: {session_error}")
        
        # PHASE 5: Save messages to DynamoDB for persistence
        try:
            # Save user message
            save_message_to_dynamodb(
                conversation_id=conversation_id,
                message_content=message,
                role='USER',
                user_id=user_id,
                metadata={'diagnostic_level': diagnostic_level}
            )
            
            # Save assistant response
            save_message_to_dynamodb(
                conversation_id=conversation_id,
                message_content=response_message,
                role='ASSISTANT',
                user_id=user_id,
                metadata={
                    'diagnostic_level': diagnostic_level,
                    'diagnostic_accuracy': diagnostic_accuracy,
                    'vin_enhanced': bool(safe_agent_state_get(agent, "vin_data"))
                }
            )
            
            # Save conversation context if we have vehicle information
            vehicle_context = None
            if hasattr(agent, 'messages') and len(agent.messages) > 0:
                # Try to extract vehicle context from the conversation
                for msg in agent.messages:
                    msg_content = str(msg).lower()
                    if any(year in msg_content for year in ['2020', '2021', '2022', '2023', '2024']) and \
                       any(make in msg_content for make in ['honda', 'toyota', 'ford', 'chevrolet', 'nissan']):
                        vehicle_context = f"basic:{msg_content[:50]}"
                        break
            
            # Save conversation context for authenticated users
            if is_authenticated and user_id:
                logger.info(f"💾 Saving conversation for authenticated user: {user_id} (conversation: {conversation_id})")
                save_conversation_context(
                    conversation_id=conversation_id,
                    vehicle_context=vehicle_context,
                    user_id=user_id,
                    diagnostic_level=diagnostic_level,
                    title='New Chat'  # Will be updated by AI title generation later
                )
            else:
                logger.info(f"⏭️ Skipping conversation save - is_authenticated: {is_authenticated}, user_id: {user_id}")
                if not is_authenticated:
                    logger.info("⏭️ User is not authenticated")
                if not user_id:
                    logger.info("⏭️ User ID is empty or None")
                
        except Exception as persistence_error:
            logger.warning(f"⚠️ Could not save messages to DynamoDB: {persistence_error}")
        
        # PHASE 4: Return clean response with diagnostic level context
        response = {
            'conversationId': conversation_id,
            'message': response_message,
            'timestamp': assistant_timestamp,
            'sender': 'assistant',  # Required by GraphQL schema
            'poweredBy': 'Dixon Smart Repair AI',  # Required by GraphQL schema
            'success': True,
            'diagnostic_context': {
                'level': diagnostic_level,
                'accuracy': diagnostic_accuracy,
                'user_selection': user_selection,
                'vin_enhanced': bool(safe_agent_state_get(agent, "vin_data"))
            }
        }
        
        logger.info(f"🎯 Chat response ready: {conversation_id}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Error in handle_chat_message: {e}")
        
        # Clean up temp files if they exist
        try:
            _cleanup_temp_files(agent)
        except:
            pass  # Don't let cleanup errors mask the original error
        
        return {
            'success': False,
            'error': str(e),
            'conversationId': args.get('conversationId', ''),
            'message': f'Error: {str(e)}',
            'timestamp': datetime.utcnow().isoformat(),
            'sender': 'system',
            'poweredBy': 'Dixon Smart Repair AI'
        }
    finally:
        # Always try to clean up temp files
        try:
            if 'agent' in locals():
                _cleanup_temp_files(agent)
        except:
            pass  # Don't let cleanup errors cause issues

# NEW: Phase 3.1 - User-Centric Cost Estimation GraphQL Handlers
def handle_get_user_cost_estimates(event, context):
    """Handle getUserCostEstimates GraphQL query - get all estimates for a user"""
    
    try:
        arguments = event.get('arguments', {})
        user_id = arguments.get('userId')
        limit = arguments.get('limit', 10)
        
        if not user_id:
            return {
                'success': False,
                'error': 'userId is required',
                'estimates': [],
                'count': 0
            }
        
        logger.info(f"📊 Getting cost estimates for user: {user_id}")
        
        # Use environment variable for table name
        cost_estimates_table_name = os.environ.get('COST_ESTIMATES_TABLE')
        if not cost_estimates_table_name:
            logger.error("❌ COST_ESTIMATES_TABLE environment variable not set")
            return {
                'success': False,
                'error': 'Cost estimates table configuration missing',
                'estimates': [],
                'count': 0
            }
        
        # Query DynamoDB directly for cost estimates
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(cost_estimates_table_name)
        
        logger.info(f"📊 Querying table {cost_estimates_table_name} for user {user_id}")
        
        # Query using UserIndex GSI
        response = table.query(
            IndexName='UserIndex',
            KeyConditionExpression=Key('userId').eq(user_id),
            Limit=limit,
            ScanIndexForward=False  # Sort by createdAt descending (newest first)
        )
        
        estimates = response.get('Items', [])
        logger.info(f"📊 Raw query returned {len(estimates)} items")
        
        # Convert DynamoDB format to regular format and handle Decimal objects
        converted_estimates = []
        for estimate in estimates:
            try:
                converted_estimate = convert_dynamodb_item(estimate)
                
                # Ensure required fields exist for GraphQL schema compatibility
                if 'id' not in converted_estimate:
                    converted_estimate['id'] = converted_estimate.get('estimateId', 'unknown')
                
                # Ensure required fields have default values
                if 'validUntil' not in converted_estimate or not converted_estimate['validUntil']:
                    # Set validUntil to 30 days from creation date
                    try:
                        created_date = datetime.fromisoformat(converted_estimate.get('createdAt', '2025-07-28T00:00:00'))
                        valid_until = created_date + timedelta(days=30)
                        converted_estimate['validUntil'] = valid_until.isoformat()
                    except:
                        converted_estimate['validUntil'] = '2025-08-28T00:00:00'
                
                if 'confidence' not in converted_estimate or converted_estimate['confidence'] is None:
                    converted_estimate['confidence'] = 85  # Default confidence level
                
                # Transform data structure to match GraphQL schema
                if 'vehicle_info' in converted_estimate:
                    converted_estimate['vehicleInfo'] = converted_estimate.pop('vehicle_info')
                
                if 'selected_option' in converted_estimate:
                    converted_estimate['selectedOption'] = converted_estimate.pop('selected_option')
                
                # NEW: Check for modified estimate data
                estimate_id = converted_estimate.get('estimateId')
                if estimate_id and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                    try:
                        # Check if this estimate has been modified by a mechanic
                        modified_data = customer_communication_service.get_modified_estimate_data(estimate_id)
                        if modified_data and modified_data.get('success'):
                            modified_info = modified_data.get('data', {})
                            if modified_info:
                                converted_estimate['isModified'] = True
                                converted_estimate['originalEstimate'] = {
                                    'breakdown': converted_estimate.get('breakdown', {}),
                                    'confidence': converted_estimate.get('confidence', 85)
                                }
                                converted_estimate['modifiedEstimate'] = modified_info.get('modifiedEstimate', {})
                                converted_estimate['mechanicNotes'] = modified_info.get('mechanicNotes', '')
                                converted_estimate['modifiedAt'] = modified_info.get('modifiedAt', '')
                                converted_estimate['mechanicRequestId'] = modified_info.get('requestId', '')
                                
                                # Update status based on modification status
                                request_status = modified_info.get('status', '')
                                if request_status == 'pending_customer_approval':
                                    converted_estimate['status'] = 'pending_customer_approval'
                                elif request_status == 'customer_approved':
                                    converted_estimate['status'] = 'customer_approved'
                                elif request_status == 'customer_rejected':
                                    converted_estimate['status'] = 'customer_rejected'
                    except Exception as e:
                        logger.warning(f"⚠️ Could not fetch modified estimate data for {estimate_id}: {e}")
                
                # Ensure breakdown structure matches schema
                if 'breakdown' not in converted_estimate:
                    # Create breakdown from available data
                    parts_total = 0
                    labor_total = 0
                    
                    if 'parts_found' in converted_estimate:
                        for part in converted_estimate.get('parts_found', []):
                            if isinstance(part, dict) and 'price' in part:
                                parts_total += float(part['price'])
                    
                    if 'labor_estimate' in converted_estimate:
                        labor_est = converted_estimate['labor_estimate']
                        if isinstance(labor_est, dict):
                            hours = float(labor_est.get('estimated_hours', 0))
                            rate = 100.0  # Default rate
                            labor_total = hours * rate
                    
                    total_cost = parts_total + labor_total
                    tax = total_cost * 0.08  # 8% tax
                    
                    converted_estimate['breakdown'] = {
                        'parts': {
                            'total': parts_total,
                            'selectedOption': converted_estimate.get('selectedOption', 'unknown')
                        },
                        'labor': {
                            'total': labor_total,
                            'totalHours': float(converted_estimate.get('labor_estimate', {}).get('estimated_hours', 0))
                        },
                        'total': total_cost + tax,
                        'tax': tax
                    }
                
                converted_estimates.append(converted_estimate)
                
            except Exception as item_error:
                logger.error(f"❌ Error converting estimate item: {item_error}")
                continue
        
        logger.info(f"📊 Successfully converted {len(converted_estimates)} cost estimates for user {user_id}")
        
        return {
            'success': True,
            'estimates': converted_estimates,
            'count': len(converted_estimates),
            'error': None
        }
            
    except Exception as e:
        logger.error(f"❌ Error in handle_get_user_cost_estimates: {e}")
        logger.error(f"❌ Full error details: {traceback.format_exc()}")
        return {
            'success': False,
            'error': str(e),
            'estimates': [],
            'count': 0
        }

def handle_get_user_labour_estimates(event, context):
    """Handle getUserLabourEstimates GraphQL query - get all labour estimates for a user"""
    
    try:
        arguments = event.get('arguments', {})
        user_id = arguments.get('userId')
        limit = arguments.get('limit', 10)
        
        if not user_id:
            return {
                'success': False,
                'error': 'userId is required',
                'estimates': [],
                'count': 0
            }
        
        logger.info(f"🔧 Getting labour estimates for user: {user_id}")
        
        # Query DynamoDB directly for labour estimates from LaborEstimateReports table
        dynamodb = boto3.resource('dynamodb')
        table_name = 'LaborEstimateReports'  # Direct table name since it's not environment-specific
        table = dynamodb.Table(table_name)
        
        logger.info(f"🔧 Querying table {table_name} for user {user_id}")
        
        # Query using userId as partition key with the UserReportsIndex GSI for proper time-based sorting
        response = table.query(
            IndexName='UserReportsIndex',
            KeyConditionExpression=Key('userId').eq(user_id),
            Limit=limit,
            ScanIndexForward=False  # Sort by createdAt descending (newest first)
        )
        
        estimates = response.get('Items', [])
        logger.info(f"🔧 Raw query returned {len(estimates)} labour estimate items")
        
        # Convert DynamoDB format to regular format and handle Decimal objects
        converted_estimates = []
        for estimate in estimates:
            try:
                converted_estimate = convert_dynamodb_item(estimate)
                
                # Ensure all required fields exist with proper structure
                if 'vehicleInfo' not in converted_estimate and 'vehicle_info' in converted_estimate:
                    converted_estimate['vehicleInfo'] = converted_estimate.pop('vehicle_info')
                
                if 'initialEstimate' not in converted_estimate and 'agentInitialEstimate' in converted_estimate:
                    converted_estimate['initialEstimate'] = converted_estimate.pop('agentInitialEstimate')
                
                # Ensure nested structures exist
                if 'vehicleInfo' not in converted_estimate:
                    converted_estimate['vehicleInfo'] = {}
                
                if 'initialEstimate' not in converted_estimate:
                    converted_estimate['initialEstimate'] = {}
                
                if 'modelResults' not in converted_estimate:
                    converted_estimate['modelResults'] = {}
                
                if 'finalEstimate' not in converted_estimate:
                    converted_estimate['finalEstimate'] = {}
                
                if 'dataQuality' not in converted_estimate:
                    converted_estimate['dataQuality'] = {}
                
                # Ensure required string fields have defaults
                if 'repairType' not in converted_estimate:
                    converted_estimate['repairType'] = 'Unknown Repair'
                
                if 'consensusReasoning' not in converted_estimate:
                    converted_estimate['consensusReasoning'] = 'No reasoning provided'
                
                if 'version' not in converted_estimate:
                    converted_estimate['version'] = 'v0.2'
                
                if 'createdAt' not in converted_estimate:
                    converted_estimate['createdAt'] = datetime.utcnow().isoformat()
                
                converted_estimates.append(converted_estimate)
                
            except Exception as item_error:
                logger.error(f"❌ Error converting labour estimate item: {item_error}")
                continue
        
        logger.info(f"🔧 Successfully converted {len(converted_estimates)} labour estimates for user {user_id}")
        
        return {
            'success': True,
            'estimates': converted_estimates,
            'count': len(converted_estimates),
            'error': None
        }
            
    except Exception as e:
        logger.error(f"❌ Error in handle_get_user_labour_estimates: {e}")
        logger.error(f"❌ Full error details: {traceback.format_exc()}")
        return {
            'success': False,
            'error': str(e),
            'estimates': [],
            'count': 0
        }

def handle_get_cost_estimate_by_id(event, context):
    """Handle getCostEstimateById GraphQL query - get specific estimate by ID"""
    
    try:
        arguments = event.get('arguments', {})
        estimate_id = arguments.get('estimateId')
        
        if not estimate_id:
            return {
                'success': False,
                'error': 'estimateId is required'
            }
        
        logger.info(f"📊 Getting cost estimate by ID: {estimate_id}")
        
        # Query DynamoDB directly for the specific estimate
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('COST_ESTIMATES_TABLE')
        
        if not table_name:
            logger.error("❌ COST_ESTIMATES_TABLE environment variable not set")
            return {
                'success': False,
                'error': 'Cost estimates table not configured'
            }
        
        table = dynamodb.Table(table_name)
        
        # Query the table for the specific estimate ID
        response = table.get_item(
            Key={'estimateId': estimate_id}
        )
        
        if 'Item' not in response:
            logger.info(f"📊 No cost estimate found with ID: {estimate_id}")
            return {
                'success': False,
                'estimate': None,
                'error': f'No cost estimate found with ID: {estimate_id}'
            }
        
        item = response['Item']
        logger.info(f"📊 Found cost estimate: {item.get('estimateId')}")
        
        # Use the fixed transformation method from customer_communication_service
        try:
            from customer_communication_service import CustomerCommunicationService
            comm_service = CustomerCommunicationService()
            estimate = comm_service.transform_estimate_for_graphql(item)
            
            if estimate is None:
                logger.error(f"❌ Failed to transform estimate {estimate_id}")
                return {
                    'success': False,
                    'estimate': None,
                    'error': 'Failed to transform estimate data'
                }
                
            logger.info(f"✅ Successfully transformed estimate using fixed method")
            
        except Exception as transform_error:
            logger.error(f"❌ Error using fixed transformation: {transform_error}")
            # Fallback to old method if the new one fails
            estimate = convert_dynamodb_item(item)
            
            # Ensure required fields exist for GraphQL schema compatibility
            if 'id' not in estimate:
                estimate['id'] = estimate.get('estimateId', 'unknown')
            
            # Provide default vehicleInfo if missing
            if 'vehicleInfo' not in estimate:
                estimate['vehicleInfo'] = {
                    'make': 'Unknown',
                    'model': 'Unknown',
                    'year': 0,
                    'trim': 'Unknown',
                    'vin': ''
                }
        
        return {
            'success': True,
            'estimate': estimate,
            'error': None
        }
            
    except Exception as e:
        logger.error(f"❌ Error in handle_get_cost_estimate_by_id: {e}")
        return {
            'success': False,
            'estimate': None,
            'error': str(e)
        }

def handle_get_cost_estimate(event, context):
    """Handle getCostEstimate GraphQL query by querying DynamoDB directly"""
    
    try:
        arguments = event.get('arguments', {})
        conversation_id = arguments.get('conversationId')
        
        if not conversation_id:
            return {
                'success': False,
                'error': 'conversationId is required'
            }
        
        logger.info(f"📊 Getting cost estimate for conversation: {conversation_id}")
        
        # Query DynamoDB directly for estimates by conversation ID
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('COST_ESTIMATES_TABLE')
        
        if not table_name:
            logger.error("❌ COST_ESTIMATES_TABLE environment variable not set")
            return None
        
        table = dynamodb.Table(table_name)
        
        # Query the ConversationIndex GSI for estimates with matching conversation ID
        response = table.query(
            IndexName='ConversationIndex',
            KeyConditionExpression=Key('conversationId').eq(conversation_id)
        )
        
        items = response.get('Items', [])
        
        if not items:
            logger.info(f"📊 No cost estimate found for conversation: {conversation_id}")
            return None
        
        # Get the most recent estimate (assuming items are sorted by creation time)
        item = max(items, key=lambda x: x.get('createdAt', ''))
        logger.info(f"📊 Found cost estimate: {item.get('id')}")
        
        # Convert DynamoDB item to GraphQL format
        estimate = convert_dynamodb_item(item)
        
        # Ensure required fields have default values
        if 'validUntil' not in estimate or not estimate['validUntil']:
            # Calculate validUntil as 30 days from creation
            created_at = estimate.get('createdAt', datetime.now().isoformat())
            try:
                created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                valid_until = created_date + timedelta(days=30)
                estimate['validUntil'] = valid_until.isoformat()
            except:
                estimate['validUntil'] = (datetime.now() + timedelta(days=30)).isoformat()
        
        if 'confidence' not in estimate or not estimate['confidence']:
            estimate['confidence'] = 85  # Default confidence level
        
        # Ensure the estimate has the expected structure for the frontend
        if estimate and 'vehicleInfo' in estimate:
            # Add an 'id' field if it doesn't exist (frontend expects it)
            if 'id' not in estimate:
                estimate['id'] = estimate.get('estimateId', 'unknown')
            
            return estimate
        else:
            logger.warning(f"Estimate data missing vehicleInfo: {estimate}")
            return None
            
    except Exception as e:
        logger.error(f"❌ Error in handle_get_cost_estimate: {e}")
        return None

def handle_get_conversation_messages(event, context):
    """
    Get messages for a specific conversation
    """
    try:
        arguments = event.get('arguments', {})
        conversation_id = arguments.get('conversationId')
        
        if not conversation_id:
            return {
                'success': False,
                'error': 'Conversation ID is required',
                'messages': []
            }
        
        logger.info(f"📚 Getting messages for conversation: {conversation_id}")
        
        # Query messages from DynamoDB
        table = dynamodb.Table(MESSAGE_TABLE)
        
        response = table.query(
            IndexName='ConversationMessagesIndex',
            KeyConditionExpression='conversationId = :conversationId',
            ExpressionAttributeValues={
                ':conversationId': conversation_id
            },
            ScanIndexForward=True  # Sort by timestamp ascending
        )
        
        messages = []
        for item in response.get('Items', []):
            messages.append({
                'id': item.get('id', ''),
                'content': item.get('content', ''),
                'role': item.get('role', ''),
                'timestamp': item.get('timestamp', ''),
                'metadata': item.get('metadata', {})
            })
        
        logger.info(f"✅ Retrieved {len(messages)} messages for conversation: {conversation_id}")
        
        return {
            'success': True,
            'messages': messages,
            'error': None
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting conversation messages: {e}")
        return {
            'success': False,
            'error': str(e),
            'messages': []
        }

def handle_get_user_conversations(event, context):
    """Handle getUserConversations GraphQL query - get user's conversation history from DynamoDB"""
    try:
        import boto3
        from boto3.dynamodb.conditions import Key
        
        arguments = event.get('arguments', {})
        user_id = arguments.get('userId')
        limit = arguments.get('limit', 50)  # Default to 50 conversations
        
        if not user_id:
            return {'success': False, 'error': 'Missing userId', 'conversations': [], 'count': 0}
        
        logger.info(f"📚 Getting conversations for user: {user_id}")
        
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb')
        conversation_table = dynamodb.Table(os.environ['CONVERSATION_TABLE'])
        
        # Query the UserConversationsByActivityIndex GSI for most recent activity first
        response = conversation_table.query(
            IndexName='UserConversationsByActivityIndex',
            KeyConditionExpression=Key('userId').eq(user_id),
            ScanIndexForward=False,  # Sort by updatedAt descending (most recent activity first)
            Limit=limit
        )
        
        conversations = []
        for item in response.get('Items', []):
            # Calculate message count by querying MessageTable
            message_table = dynamodb.Table(os.environ['MESSAGE_TABLE'])
            message_response = message_table.query(
                KeyConditionExpression=Key('conversationId').eq(item['id']),
                Select='COUNT'
            )
            
            # Format conversation for frontend
            conversation = {
                'id': item['id'],
                'title': item.get('title', 'New Chat'),
                'createdAt': item.get('createdAt', ''),
                'lastAccessed': item.get('updatedAt', item.get('createdAt', '')),
                'messageCount': message_response.get('Count', 0),
                'diagnosticLevel': item.get('diagnosticLevel', 'quick'),
                'diagnosticAccuracy': item.get('diagnosticAccuracy', '80%'),
                'vinEnhanced': item.get('vinEnhanced', False),
                'isActive': False
            }
            conversations.append(conversation)
        
        logger.info(f"✅ Found {len(conversations)} conversations for user {user_id}")
        
        return {
            'success': True,
            'conversations': conversations,
            'count': len(conversations)
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting user conversations: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return {
            'success': False, 
            'error': str(e),
            'conversations': [],
            'count': 0
        }

def handle_generate_conversation_title(arguments: Dict) -> Dict:
    """
    Handle generateConversationTitle GraphQL mutation
    """
    try:
        content = arguments.get('content', '')
        user_id = arguments.get('userId', '')
        
        logger.info(f"Title generation request: {content[:50]}...")
        
        # Check if user is anonymous - skip title generation for anonymous users
        if not user_id or user_id.startswith('anon-') or user_id.startswith('anonymous-'):
            logger.info("Skipping title generation for anonymous user")
            return {
                'success': True,
                'title': 'New Chat',
                'error': None,
                'generatedBy': 'default',
                'processingTime': 0
            }
        
        if not content:
            logger.warning("No content provided for title generation")
            return {
                'success': False,
                'error': 'Content is required for title generation'
            }
        
        logger.info(f"Generating title for content: {content[:50]}...")
        
        # Use AI title generator
        result = generate_ai_title(content)
        
        logger.info(f"Title generation result: {result}")
        
        return {
            'success': result['success'],
            'title': result.get('title'),
            'error': result.get('error'),
            'generatedBy': result.get('generatedBy', 'ai'),
            'processingTime': result.get('processingTime', 0)
        }
        
    except Exception as e:
        logger.error(f"Error in handle_generate_conversation_title: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        
        # Return fallback response
        return {
            'success': True,  # Still successful with fallback
            'title': 'New Chat',
            'error': f"Title generation failed: {str(e)}",
            'generatedBy': 'fallback',
            'processingTime': 0
        }

def handle_update_conversation_title(arguments: Dict) -> Dict:
    """
    Handle updateConversationTitle GraphQL mutation
    """
    try:
        conversation_id = arguments.get('conversationId')
        title = arguments.get('title')
        
        if not conversation_id or not title:
            return {
                'success': False,
                'error': 'conversationId and title are required'
            }
        
        logger.info(f"📝 Updating conversation title: {conversation_id} -> {title}")
        
        if not CONVERSATION_TABLE:
            logger.warning("CONVERSATION_TABLE not configured")
            return {
                'success': False,
                'error': 'Conversation table not configured'
            }
        
        # Update conversation title in DynamoDB
        table = dynamodb.Table(CONVERSATION_TABLE)
        
        response = table.update_item(
            Key={'id': conversation_id},
            UpdateExpression='SET title = :title, updatedAt = :updated',
            ExpressionAttributeValues={
                ':title': title,
                ':updated': datetime.utcnow().isoformat()
            },
            ReturnValues='UPDATED_NEW'
        )
        
        logger.info(f"✅ Conversation title updated successfully: {conversation_id}")
        
        return {
            'success': True,
            'title': title
        }
        
    except Exception as e:
        logger.error(f"❌ Error updating conversation title: {str(e)}")
        return {
            'success': False,
            'error': f"Failed to update title: {str(e)}"
        }

def handle_generate_image_upload_url(event, context):
    """Handle generateImageUploadUrl GraphQL mutation"""
    try:
        args = event.get('arguments', {})
        file_name = args.get('fileName', '')
        content_type = args.get('contentType', 'image/jpeg')
        user_id = args.get('userId', 'anonymous')
        
        logger.info(f"📥 Generating image upload URL for: {file_name}")
        
        # Validate inputs
        if not file_name:
            raise ValueError("fileName is required")
        
        if not content_type.startswith('image/'):
            raise ValueError("Only image files are allowed")
        
        # Get S3 bucket from environment
        bucket_name = os.environ.get('IMAGES_S3_BUCKET')
        if not bucket_name:
            raise ValueError("IMAGES_S3_BUCKET environment variable not set")
        
        # Generate unique S3 key
        import uuid
        from datetime import datetime
        
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        unique_id = str(uuid.uuid4())[:8]
        
        # Clean filename (remove special characters)
        clean_filename = "".join(c for c in file_name if c.isalnum() or c in ('-', '_', '.'))
        
        s3_key = f"images/{user_id}/{timestamp}-{unique_id}-{clean_filename}"
        
        logger.info(f"🔑 Generated S3 key: {s3_key}")
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Generate pre-signed URL for PUT operation
        expires_in = 300  # 5 minutes
        
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': s3_key,
                'ContentType': content_type,
                'ServerSideEncryption': 'AES256'
            },
            ExpiresIn=expires_in
        )
        
        logger.info(f"✅ Generated pre-signed URL for: {s3_key}")
        
        return {
            'uploadUrl': presigned_url,
            's3Key': s3_key,
            's3Bucket': bucket_name,
            'expiresIn': expires_in
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating upload URL: {str(e)}")
        return {
            'uploadUrl': '',
            's3Key': '',
            's3Bucket': '',
            'expiresIn': 0,
            'error': str(e)
        }

def lambda_handler(event, context):
    """
    AWS Lambda handler - routes requests to appropriate handlers
    Handles both direct invocations and AppSync GraphQL events
    """
    try:
        # Check if this is an AppSync GraphQL event
        info = event.get('info') if event else None
        if info and isinstance(info, dict) and 'fieldName' in info:
            # This is an AppSync GraphQL event
            field_name = info['fieldName']
            arguments = event.get('arguments', {})
            
            logger.info(f"📥 AppSync GraphQL invocation: {field_name}")
            
            # 🔍 DEBUG: Log all arguments received from AppSync
            logger.info(f"🔍 DEBUG: AppSync arguments: {json.dumps(arguments, indent=2, default=str)}")
            
            if field_name == 'sendMessage' or field_name == 'sendAnonymousMessage':
                return handle_chat_message(arguments)
            elif field_name == 'createConversation':
                # Handle conversation creation if needed
                return {
                    'success': False,
                    'error': 'createConversation not implemented yet',
                    'conversationId': arguments.get('conversationId', ''),
                    'message': 'Error: Operation not implemented',
                    'timestamp': datetime.utcnow().isoformat(),
                    'sender': 'system',
                    'poweredBy': 'Dixon Smart Repair AI'
                }
            elif field_name == 'deleteConversation':
                return handle_delete_conversation(arguments)
            # NEW: Shop Visit GraphQL Resolvers - Phase 1.1
            elif field_name == 'recordShopVisit' and SHOP_VISIT_SERVICE_AVAILABLE:
                return handle_record_shop_visit(event, context)
            elif field_name == 'getUserVisits' and SHOP_VISIT_SERVICE_AVAILABLE:
                return handle_get_user_visits(event, context)
            elif field_name == 'getShopVisits' and SHOP_VISIT_SERVICE_AVAILABLE:
                return handle_get_shop_visits(event, context)
            elif field_name == 'getVisitById' and SHOP_VISIT_SERVICE_AVAILABLE:
                return handle_get_visit_by_id(event, context)
            elif field_name == 'updateVisitStatus' and SHOP_VISIT_SERVICE_AVAILABLE:
                return handle_update_visit_status(event, context)
            
            # NEW: Vehicle Management GraphQL Resolvers
            elif field_name == 'addUserVehicle' and VEHICLE_SERVICE_AVAILABLE:
                return handle_add_user_vehicle(event, context)
            elif field_name == 'getUserVehicles' and VEHICLE_SERVICE_AVAILABLE:
                return handle_get_user_vehicles(event, context)
            elif field_name == 'getVehicleById' and VEHICLE_SERVICE_AVAILABLE:
                return handle_get_vehicle_by_id(event, context)
            elif field_name == 'updateUserVehicle' and VEHICLE_SERVICE_AVAILABLE:
                return handle_update_user_vehicle(event, context)
            elif field_name == 'deleteUserVehicle' and VEHICLE_SERVICE_AVAILABLE:
                return handle_delete_user_vehicle(event, context)
            
            # NEW: Phase 2.1 - Customer Communication GraphQL Resolvers
            elif field_name == 'requestMechanic' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_request_mechanic(event, context)
            elif field_name == 'shareEstimateWithMechanic' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_share_estimate_with_mechanic(event, context)
            elif field_name == 'reviewDiagnosis' and MECHANIC_SERVICE_AVAILABLE:
                return handle_review_diagnosis(event, context)
            elif field_name == 'reviewCostEstimate' and MECHANIC_SERVICE_AVAILABLE:
                return handle_review_cost_estimate(event, context)
            elif field_name == 'respondToEstimateReview' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_respond_to_estimate_review(event, context)
            elif field_name == 'assignMechanicRequest' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_assign_mechanic_request(event, context)
            elif field_name == 'sendMechanicMessage' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_send_mechanic_message(event, context)
            elif field_name == 'getMechanicRequests' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_get_mechanic_requests(event, context)
            elif field_name == 'getQueuedRequests' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_get_queued_requests(event, context)
            elif field_name == 'getMechanicRequestById' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_get_mechanic_request_by_id(event, context)
            elif field_name == 'getMechanicMessages' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_get_mechanic_messages(event, context)
            elif field_name == 'updateRequestStatus' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_update_request_status(event, context)
            elif field_name == 'updateModifiedEstimate' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_update_modified_estimate(event, context)
            elif field_name == 'approveModifiedEstimate' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_approve_modified_estimate(event, context)
            elif field_name == 'rejectModifiedEstimate' and CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
                return handle_reject_modified_estimate(event, context)
            elif field_name == 'getShopStatistics' and MECHANIC_SERVICE_AVAILABLE:
                return handle_get_shop_statistics(event, context)
            elif field_name == 'getPendingDiagnoses' and MECHANIC_SERVICE_AVAILABLE:
                return handle_get_pending_diagnoses(event, context)
            
            # NEW: Image Upload URL Generation
            elif field_name == 'generateImageUploadUrl':
                return handle_generate_image_upload_url(event, context)
            
            # NEW: Phase 2.2 - Work Authorization GraphQL Resolvers
            elif field_name == 'createWorkAuthorization' and WORK_AUTHORIZATION_SERVICE_AVAILABLE:
                return handle_create_work_authorization(event, context)
            elif field_name == 'updateWorkflowStatus' and WORK_AUTHORIZATION_SERVICE_AVAILABLE:
                return handle_update_workflow_status(event, context)
            elif field_name == 'getMechanicWorkflow' and WORK_AUTHORIZATION_SERVICE_AVAILABLE:
                return handle_get_mechanic_workflow(event, context)
            elif field_name == 'getShopWorkflowOverview' and WORK_AUTHORIZATION_SERVICE_AVAILABLE:
                return handle_get_shop_workflow_overview(event, context)
            elif field_name == 'getWorkAuthorization' and WORK_AUTHORIZATION_SERVICE_AVAILABLE:
                return handle_get_work_authorization(event, context)
            elif field_name == 'getCustomerWorkStatus' and WORK_AUTHORIZATION_SERVICE_AVAILABLE:
                return handle_get_customer_work_status(event, context)
            
            # NEW: Phase 3.1 - User-Centric Cost Estimation GraphQL Resolvers
            elif field_name == 'getUserCostEstimates':
                return handle_get_user_cost_estimates(event, context)
            elif field_name == 'getUserLabourEstimates':
                return handle_get_user_labour_estimates(event, context)
            elif field_name == 'getCostEstimateById':
                return handle_get_cost_estimate_by_id(event, context)
            elif field_name == 'getCostEstimate':
                return handle_get_cost_estimate(event, context)
            elif field_name == 'getUserConversations':
                return handle_get_user_conversations(event, context)
            elif field_name == 'getConversationMessages':
                return handle_get_conversation_messages(event, context)
            elif field_name == 'generateConversationTitle':
                return handle_generate_conversation_title(arguments)
            elif field_name == 'updateConversationTitle':
                return handle_update_conversation_title(arguments)
            
            else:
                return {
                    'success': False,
                    'error': f'Unknown GraphQL field: {field_name}',
                    'conversationId': arguments.get('conversationId', ''),
                    'message': f'Error: Unknown operation {field_name}',
                    'timestamp': datetime.utcnow().isoformat(),
                    'sender': 'system',
                    'poweredBy': 'Dixon Smart Repair AI'
                }
        
        # Handle direct Lambda invocations (legacy format)
        operation = event.get('operation') if event else None
        logger.info(f"📥 Direct Lambda invocation: {operation or 'unknown'}")
        
        if operation == 'chatMessage':
            return handle_chat_message(event.get('arguments', {}))
        elif operation == 'generateDeletionToken' and PRIVACY_MANAGER_AVAILABLE:
            return handle_generate_deletion_token(event.get('arguments', {}))
        elif operation == 'getPrivacySettings' and PRIVACY_MANAGER_AVAILABLE:
            return handle_get_privacy_settings(event.get('arguments', {}))
        elif operation == 'updatePrivacySettings' and PRIVACY_MANAGER_AVAILABLE:
            return handle_update_privacy_settings(event.get('arguments', {}))
        elif operation == 'exportUserData' and PRIVACY_MANAGER_AVAILABLE:
            return handle_export_user_data(event.get('arguments', {}))
        elif operation == 'deleteUserData' and PRIVACY_MANAGER_AVAILABLE:
            return handle_delete_user_data(event.get('arguments', {}))
        elif operation == 'deleteConversation' and PRIVACY_MANAGER_AVAILABLE:
            return handle_delete_conversation(event.get('arguments', {}))
        elif operation and operation.startswith('mechanic') and MECHANIC_SERVICE_AVAILABLE:
            return mechanic_service.handle_mechanic_operation(operation, event.get('arguments', {}))
        else:
            return {
                'success': False,
                'error': f'Unknown operation: {operation}',
                'conversationId': '',
                'message': f'Error: Unknown operation {operation}',
                'timestamp': datetime.utcnow().isoformat(),
                'sender': 'system',
                'poweredBy': 'Dixon Smart Repair AI'
            }
            
    except Exception as e:
        logger.error(f"❌ Lambda handler error: {e}")
        return {
            'success': False,
            'error': str(e),
            'conversationId': '',
            'message': f'Error: {str(e)}',
            'timestamp': datetime.utcnow().isoformat(),
            'sender': 'system',
            'poweredBy': 'Dixon Smart Repair AI'
        }

# Privacy management handlers (if available)
def handle_generate_deletion_token(args):
    """Generate deletion confirmation token"""
    if not PRIVACY_MANAGER_AVAILABLE:
        return {'success': False, 'error': 'Privacy manager not available'}
    
    try:
        user_id = args.get('userId')
        if not user_id:
            return {'success': False, 'error': 'Missing userId'}
        
        privacy_manager = PrivacyManager(user_id)
        token = privacy_manager.generate_deletion_token()
        
        return {
            'success': True,
            'token': token,
            'expiresAt': (datetime.utcnow().timestamp() + 3600) * 1000  # 1 hour from now in milliseconds
        }
    except Exception as e:
        logger.error(f"Error generating deletion token: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_privacy_settings(args):
    """Get user privacy settings"""
    if not PRIVACY_MANAGER_AVAILABLE:
        return {'success': False, 'error': 'Privacy manager not available'}
    
    try:
        user_id = args.get('userId')
        if not user_id:
            return {'success': False, 'error': 'Missing userId'}
        
        privacy_manager = PrivacyManager(user_id)
        settings = privacy_manager.get_privacy_settings()
        
        return {
            'success': True,
            'settings': settings
        }
    except Exception as e:
        logger.error(f"Error getting privacy settings: {e}")
        return {'success': False, 'error': str(e)}

def handle_update_privacy_settings(args):
    """Update user privacy settings"""
    if not PRIVACY_MANAGER_AVAILABLE:
        return {'success': False, 'error': 'Privacy manager not available'}
    
    try:
        user_id = args.get('userId')
        settings = args.get('settings', {})
        
        if not user_id:
            return {'success': False, 'error': 'Missing userId'}
        
        privacy_manager = PrivacyManager(user_id)
        updated_settings = privacy_manager.update_privacy_settings(settings)
        
        return {
            'success': True,
            'settings': updated_settings
        }
    except Exception as e:
        logger.error(f"Error updating privacy settings: {e}")
        return {'success': False, 'error': str(e)}

def handle_export_user_data(args):
    """Export user data"""
    if not PRIVACY_MANAGER_AVAILABLE:
        return {'success': False, 'error': 'Privacy manager not available'}
    
    try:
        user_id = args.get('userId')
        format_type = args.get('format', 'json')
        
        if not user_id:
            return {'success': False, 'error': 'Missing userId'}
        
        privacy_manager = PrivacyManager(user_id)
        export_result = privacy_manager.export_user_data(format_type)
        
        return {
            'success': True,
            'exportUrl': export_result.get('export_url'),
            'expiresAt': export_result.get('expires_at')
        }
    except Exception as e:
        logger.error(f"Error exporting user data: {e}")
        return {'success': False, 'error': str(e)}

def handle_delete_user_data(args):
    """Delete user data with confirmation token"""
    if not PRIVACY_MANAGER_AVAILABLE:
        return {'success': False, 'error': 'Privacy manager not available'}
    
    try:
        user_id = args.get('userId')
        confirmation_token = args.get('confirmationToken')
        
        if not user_id or not confirmation_token:
            return {'success': False, 'error': 'Missing userId or confirmationToken'}
        
        privacy_manager = PrivacyManager(user_id)
        deletion_result = privacy_manager.delete_all_user_data(confirmation_token)
        
        return {
            'success': True,
            'deletedItems': deletion_result.get('deleted_items', 0),
            'deletionId': deletion_result.get('deletion_id')
        }
    except Exception as e:
        logger.error(f"Error deleting user data: {e}")
        return {'success': False, 'error': str(e)}

def handle_delete_conversation(args):
    """Delete specific conversation"""
    if not PRIVACY_MANAGER_AVAILABLE:
        return {
            'success': False, 
            'message': 'Privacy manager not available',
            'error': 'Privacy manager not available'
        }
    
    try:
        conversation_id = args.get('conversationId')
        
        if not conversation_id:
            return {
                'success': False, 
                'message': 'Missing conversationId',
                'error': 'Missing conversationId'
            }
        
        # For GraphQL calls, we need to get userId from the conversation
        # First, let's get the conversation to find the userId
        import boto3
        dynamodb = boto3.resource('dynamodb')
        conversation_table = dynamodb.Table(os.environ['CONVERSATION_TABLE'])
        
        conversation_response = conversation_table.get_item(Key={'id': conversation_id})
        if not conversation_response.get('Item'):
            return {
                'success': False,
                'message': 'Conversation not found',
                'error': 'Conversation not found'
            }
        
        user_id = conversation_response['Item'].get('userId')
        if not user_id:
            return {
                'success': False,
                'message': 'Invalid conversation data',
                'error': 'Invalid conversation data'
            }
        
        privacy_manager = PrivacyManager(user_id)
        deletion_result = privacy_manager.delete_specific_conversation(conversation_id)
        
        total_deleted = sum(deletion_result.get('deleted_items', {}).values())
        
        return {
            'success': True,
            'message': f'Conversation deleted successfully',
            'deletedItems': total_deleted
        }
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        return {
            'success': False, 
            'message': f'Failed to delete conversation: {str(e)}',
            'error': str(e)
        }

# NEW: Phase 2.1 - Customer Communication Handler Functions

def handle_review_cost_estimate(event, context):
    """Handle mechanic cost estimate review"""
    if not MECHANIC_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Mechanic service not available'}
    
    try:
        arguments = event.get('arguments', {})
        review_data = arguments.get('review', {})
        
        # Get mechanic ID from context
        mechanic_id = event.get('identity', {}).get('sub')
        if not mechanic_id:
            return {'success': False, 'error': 'Mechanic not authenticated'}
        
        # Ensure this is a cost estimate review
        if not review_data.get('estimateId'):
            return {'success': False, 'error': 'Estimate ID is required for cost estimate reviews'}
        
        # Submit the review (same method, but with estimateId)
        result = mechanic_service.review_diagnosis(review_data, mechanic_id)
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error handling cost estimate review: {e}")
        return {'success': False, 'error': str(e)}

def handle_review_diagnosis(event, context):
    """Handle mechanic diagnosis review"""
    if not MECHANIC_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Mechanic service not available'}
    
    try:
        arguments = event.get('arguments', {})
        review_data = arguments.get('review', {})
        
        # Get mechanic ID from context
        mechanic_id = event.get('identity', {}).get('sub')
        if not mechanic_id:
            return {'success': False, 'error': 'Mechanic not authenticated'}
        
        # Submit the review
        result = mechanic_service.review_diagnosis(review_data, mechanic_id)
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error handling diagnosis review: {e}")
        return {'success': False, 'error': str(e)}

def handle_share_estimate_with_mechanic(event, context):
    """Handle sharing cost estimate with mechanic"""
    logger.info(f"🔍 Share estimate request: {event}")
    
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        logger.error("❌ Customer communication service not available")
        raise Exception('Customer communication service not available')
    
    try:
        arguments = event.get('arguments', {})
        estimate_id = arguments.get('estimateId')
        customer_comment = arguments.get('customerComment', '')
        shop_id = arguments.get('shopId')
        
        logger.info(f"🔍 Share estimate params: estimateId={estimate_id}, shopId={shop_id}, comment={customer_comment}")
        
        # Get user info from context - User authentication required
        user_id = event.get('identity', {}).get('sub') if event.get('identity') else None
        if not user_id:
            logger.error("❌ User authentication required for sharing estimates")
            raise Exception('This operation requires user authentication. Please use Cognito authentication instead of API key.')
        
        logger.info(f"🔍 User ID: {user_id}")
        
        # Get the cost estimate first
        cost_estimates_table = dynamodb.Table(os.environ.get('COST_ESTIMATES_TABLE'))
        
        try:
            logger.info(f"🔍 Looking up cost estimate: {estimate_id}")
            estimate_response = cost_estimates_table.get_item(
                Key={'estimateId': estimate_id}
            )
            
            if 'Item' not in estimate_response:
                logger.error(f"❌ Cost estimate not found: {estimate_id}")
                raise Exception('Cost estimate not found')
                
            estimate = estimate_response['Item']
            logger.info(f"✅ Found cost estimate for user: {estimate.get('userId')}")
            
            # Verify the estimate belongs to the requesting user
            if estimate.get('userId') != user_id:
                logger.error(f"❌ Unauthorized access: estimate belongs to {estimate.get('userId')}, requested by {user_id}")
                raise Exception('Unauthorized access to estimate')
                
        except Exception as e:
            logger.error(f"❌ Error retrieving cost estimate: {e}")
            raise Exception('Failed to retrieve cost estimate')
        
        # Create mechanic request with shared estimate
        logger.info(f"🔍 Calling customer communication service...")
        result = customer_communication_service.share_estimate_with_mechanic(
            user_id=user_id,
            estimate_id=estimate_id,
            customer_comment=customer_comment,
            shop_id=shop_id,
            estimate_data=estimate
        )
        
        logger.info(f"🔍 Service result: {result}")
        
        if result['success']:
            logger.info(f"✅ Successfully shared estimate with mechanic")
            return result['data']
        else:
            logger.error(f"❌ Service error: {result['error']}")
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"❌ Error sharing estimate with mechanic: {e}")
        raise e

    """Handle customer request for mechanic assistance"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        request_data = arguments.get('request', {})
        
        # Extract customer info from context (in production, would get from JWT token)
        customer_id = context.get('identity', {}).get('sub', 'anonymous')
        customer_name = context.get('identity', {}).get('username', 'Customer')
        
        result = customer_communication_service.request_mechanic(
            request_data, customer_id, customer_name
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error handling mechanic request: {e}")
        return {'success': False, 'error': str(e)}

def handle_assign_mechanic_request(event, context):
    """Handle assignment of mechanic to customer request"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        request_id = arguments.get('requestId')
        mechanic_id = arguments.get('mechanicId')
        
        # Extract mechanic info from GraphQL identity context
        identity = event.get('identity', {})
        
        if identity and identity.get('sub'):
            # Authenticated mechanic
            mechanic_name = identity.get('username', f'Mechanic {mechanic_id}')
        else:
            # Fallback for system assignment
            mechanic_name = f'Mechanic {mechanic_id}'
        
        result = customer_communication_service.assign_mechanic_request(
            request_id, mechanic_id, mechanic_name
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error assigning mechanic request: {e}")
        return {'success': False, 'error': str(e)}

def handle_send_mechanic_message(event, context):
    """Handle sending message in mechanic-customer conversation"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        message_data = arguments.get('message', {})
        
        # Extract sender info from event identity (not context)
        identity = event.get('identity', {})
        sender_id = identity.get('sub', 'anonymous')
        sender_name = identity.get('username', 'User')
        sender_type = 'mechanic'  # Since this is mechanic messaging
        
        result = customer_communication_service.send_mechanic_message(
            message_data, sender_id, sender_name, sender_type
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error sending mechanic message: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_mechanic_requests(event, context):
    """Handle getting customer's mechanic requests"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        customer_id = arguments.get('customerId')
        
        result = customer_communication_service.get_mechanic_requests(customer_id)
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error getting mechanic requests: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_queued_requests(event, context):
    """Handle getting queued requests for shop"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        shop_id = arguments.get('shopId')
        
        result = customer_communication_service.get_queued_requests(shop_id)
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error getting queued requests: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_mechanic_request_by_id(event, context):
    """Handle getting specific mechanic request by ID with AI conversation summary"""
    if not MECHANIC_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Mechanic service not available'}
    
    try:
        arguments = event.get('arguments', {})
        request_id = arguments.get('requestId')
        
        if not request_id:
            return {'success': False, 'error': 'Request ID is required'}
        
        # Get mechanic request with AI-generated conversation summary
        result = mechanic_service.get_mechanic_request_with_summary(request_id)
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error getting mechanic request by ID: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_mechanic_messages(event, context):
    """Handle getting messages for mechanic request conversation"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        mechanic_request_id = arguments.get('mechanicRequestId')
        
        result = customer_communication_service.get_mechanic_messages(mechanic_request_id)
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error getting mechanic messages: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_shop_statistics(event, context):
    """Handle getting shop statistics for mechanic dashboard"""
    if not MECHANIC_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Mechanic service not available'}
    
    try:
        arguments = event.get('arguments', {})
        shop_id = arguments.get('shopId')
        
        if not shop_id:
            return {'success': False, 'error': 'Shop ID is required'}
        
        result = mechanic_service.get_shop_statistics(shop_id)
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error getting shop statistics: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_pending_diagnoses(event, context):
    """Handle getting pending diagnoses for mechanic dashboard"""
    if not MECHANIC_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Mechanic service not available'}
    
    try:
        arguments = event.get('arguments', {})
        shop_id = arguments.get('shopId')
        
        if not shop_id:
            return {'success': False, 'error': 'Shop ID is required'}
        
        result = mechanic_service.get_pending_diagnoses(shop_id)
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error getting pending diagnoses: {e}")
        return {'success': False, 'error': str(e)}

def handle_update_request_status(event, context):
    """Handle updating mechanic request status"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        request_id = arguments.get('requestId')
        status = arguments.get('status')
        
        # For now, return mock success - would implement actual update in production
        return {
            'id': request_id,
            'status': status,
            'updatedAt': datetime.utcnow().isoformat(),
            'success': True
        }
            
    except Exception as e:
        logger.error(f"Error updating request status: {e}")
        return {'success': False, 'error': str(e)}

def handle_update_modified_estimate(event, context):
    """Handle updating modified estimate from mechanic"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        request_id = arguments.get('requestId')
        modified_estimate_json = arguments.get('modifiedEstimate')
        mechanic_notes = arguments.get('mechanicNotes')
        mechanic_id = arguments.get('mechanicId')
        
        logger.info(f"🔧 Updating modified estimate for request: {request_id}")
        
        if not all([request_id, modified_estimate_json, mechanic_notes, mechanic_id]):
            return {'success': False, 'error': 'Missing required parameters'}
        
        # Parse the modified estimate
        try:
            modified_estimate = json.loads(modified_estimate_json)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in modified estimate: {e}")
            return {'success': False, 'error': 'Invalid estimate data format'}
        
        # Use customer communication service to update the estimate
        result = customer_communication_service.update_modified_estimate(
            request_id, 
            modified_estimate, 
            mechanic_notes, 
            mechanic_id
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"❌ Error updating modified estimate: {e}")
        return {'success': False, 'error': str(e)}

def handle_approve_modified_estimate(event, context):
    """Handle customer approval of modified estimate"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        estimate_id = arguments.get('estimateId')
        customer_notes = arguments.get('customerNotes')
        
        logger.info(f"✅ Customer approving modified estimate: {estimate_id}")
        
        if not estimate_id:
            return {'success': False, 'error': 'Missing required parameter: estimateId'}
        
        # Use customer communication service to approve the estimate
        result = customer_communication_service.approve_modified_estimate(
            estimate_id, 
            customer_notes
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"❌ Error approving modified estimate: {e}")
        return {'success': False, 'error': str(e)}

def handle_reject_modified_estimate(event, context):
    """Handle customer rejection of modified estimate"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        estimate_id = arguments.get('estimateId')
        customer_notes = arguments.get('customerNotes')
        
        logger.info(f"❌ Customer rejecting modified estimate: {estimate_id}")
        
        if not all([estimate_id, customer_notes]):
            return {'success': False, 'error': 'Missing required parameters: estimateId and customerNotes'}
        
        # Use customer communication service to reject the estimate
        result = customer_communication_service.reject_modified_estimate(
            estimate_id, 
            customer_notes
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"❌ Error rejecting modified estimate: {e}")
        return {'success': False, 'error': str(e)}

# NEW: Phase 2.2 - Work Authorization Handler Functions

def handle_create_work_authorization(event, context):
    """Handle creating work authorization from mechanic request"""
    if not WORK_AUTHORIZATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Work authorization service not available'}
    
    try:
        arguments = event.get('arguments', {})
        input_data = arguments.get('input', {})
        
        mechanic_request_id = input_data.get('mechanicRequestId')
        mechanic_id = input_data.get('mechanicId')
        estimated_duration = input_data.get('estimatedDuration', 120)
        
        if not mechanic_request_id or not mechanic_id:
            return {'success': False, 'error': 'Missing required fields: mechanicRequestId and mechanicId'}
        
        result = work_authorization_service.create_work_authorization(
            mechanic_request_id, 
            mechanic_id, 
            estimated_duration
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error creating work authorization: {e}")
        return {'success': False, 'error': str(e)}

def handle_update_workflow_status(event, context):
    """Handle updating workflow status with time tracking"""
    if not WORK_AUTHORIZATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Work authorization service not available'}
    
    try:
        arguments = event.get('arguments', {})
        input_data = arguments.get('input', {})
        
        work_auth_id = input_data.get('workAuthorizationId')
        new_status = input_data.get('newStatus')
        mechanic_notes = input_data.get('mechanicNotes')
        
        if not work_auth_id or not new_status:
            return {'success': False, 'error': 'Missing required fields: workAuthorizationId and newStatus'}
        
        result = work_authorization_service.update_workflow_status(
            work_auth_id, 
            new_status, 
            mechanic_notes
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error updating workflow status: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_mechanic_workflow(event, context):
    """Handle getting Kanban workflow view for mechanic"""
    if not WORK_AUTHORIZATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Work authorization service not available'}
    
    try:
        arguments = event.get('arguments', {})
        mechanic_id = arguments.get('mechanicId')
        shop_id = arguments.get('shopId')
        
        if not mechanic_id:
            return {'success': False, 'error': 'Missing required field: mechanicId'}
        
        result = work_authorization_service.get_mechanic_workflow(mechanic_id, shop_id)
        
        if result['success']:
            # Transform data for GraphQL response
            workflow_data = result['data']
            kanban_columns = []
            
            for status, items in workflow_data['kanbanColumns'].items():
                kanban_columns.append({
                    'status': status,
                    'items': items,
                    'count': len(items)
                })
            
            return {
                'kanbanColumns': kanban_columns,
                'statistics': workflow_data['statistics'],
                'totalItems': workflow_data['totalItems']
            }
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error getting mechanic workflow: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_shop_workflow_overview(event, context):
    """Handle getting shop-wide workflow overview"""
    if not WORK_AUTHORIZATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Work authorization service not available'}
    
    try:
        arguments = event.get('arguments', {})
        shop_id = arguments.get('shopId')
        
        if not shop_id:
            return {'success': False, 'error': 'Missing required field: shopId'}
        
        result = work_authorization_service.get_shop_workflow_overview(shop_id)
        
        if result['success']:
            # Transform data for GraphQL response
            overview_data = result['data']
            
            # Transform mechanic workloads to list format
            mechanic_workloads = []
            for mechanic_id, workload in overview_data['mechanicWorkloads'].items():
                mechanic_workloads.append({
                    'mechanicId': mechanic_id,
                    'active': workload['active'],
                    'completed': workload['completed']
                })
            
            return {
                'statusCounts': overview_data['statusCounts'],
                'mechanicWorkloads': mechanic_workloads,
                'urgencyDistribution': overview_data['urgencyDistribution'],
                'averageCompletionTimes': overview_data['averageCompletionTimes'],
                'totalWorkItems': overview_data['totalWorkItems']
            }
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error getting shop workflow overview: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_work_authorization(event, context):
    """Handle getting specific work authorization by ID"""
    if not WORK_AUTHORIZATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Work authorization service not available'}
    
    try:
        arguments = event.get('arguments', {})
        work_auth_id = arguments.get('workAuthorizationId')
        
        if not work_auth_id:
            return {'success': False, 'error': 'Missing required field: workAuthorizationId'}
        
        # For now, return mock data - would implement actual lookup in production
        return {
            'id': work_auth_id,
            'mechanicRequestId': 'req_001',
            'customerId': 'customer_001',
            'customerName': 'John Doe',
            'mechanicId': 'mechanic_001',
            'shopId': 'shop_001',
            'serviceType': 'diagnostic',
            'urgency': 'medium',
            'workflowStatus': 'in_progress',
            'previousStatus': 'authorized',
            'timeTracking': {
                'assigned': {'startTime': '2025-07-25T10:00:00Z', 'endTime': '2025-07-25T10:30:00Z', 'duration': 30},
                'authorized': {'startTime': '2025-07-25T10:30:00Z', 'endTime': '2025-07-25T11:00:00Z', 'duration': 30},
                'in_progress': {'startTime': '2025-07-25T11:00:00Z', 'endTime': None, 'duration': None}
            },
            'estimatedDuration': 120,
            'estimatedCompletion': '2025-07-25T13:00:00Z',
            'customerNotified': True,
            'createdAt': '2025-07-25T10:00:00Z',
            'updatedAt': '2025-07-25T11:00:00Z'
        }
            
    except Exception as e:
        logger.error(f"Error getting work authorization: {e}")
        return {'success': False, 'error': str(e)}

def handle_get_customer_work_status(event, context):
    """Handle getting customer's work status"""
    if not WORK_AUTHORIZATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Work authorization service not available'}
    
    try:
        arguments = event.get('arguments', {})
        customer_id = arguments.get('customerId')
        
        if not customer_id:
            return {'success': False, 'error': 'Missing required field: customerId'}
        
        # For now, return mock data - would implement actual lookup in production
        return [{
            'id': 'work_001',
            'mechanicRequestId': 'req_001',
            'customerId': customer_id,
            'customerName': 'John Doe',
            'mechanicId': 'mechanic_001',
            'shopId': 'shop_001',
            'serviceType': 'diagnostic',
            'urgency': 'medium',
            'workflowStatus': 'in_progress',
            'previousStatus': 'authorized',
            'estimatedCompletion': '2025-07-25T13:00:00Z',
            'customerNotified': True,
            'createdAt': '2025-07-25T10:00:00Z',
            'updatedAt': '2025-07-25T11:00:00Z'
        }]
            
    except Exception as e:
        logger.error(f"Error getting customer work status: {e}")
        return {'success': False, 'error': str(e)}

# NEW: Phase 2.1 - Customer Communication Handler Functions

def handle_request_mechanic(event, context):
    """Handle customer request for mechanic assistance"""
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        return {'success': False, 'error': 'Customer communication service not available'}
    
    try:
        arguments = event.get('arguments', {})
        request_data = arguments.get('request', {})
        
        # Extract customer info from GraphQL identity context
        # This works for both authenticated and non-authenticated users
        identity = event.get('identity', {})
        
        if identity and identity.get('sub'):
            # Authenticated user
            customer_id = identity.get('sub')
            customer_name = identity.get('username', 'Authenticated User')
            user_type = 'authenticated'
        else:
            # Non-authenticated user - create anonymous session ID
            customer_id = f"anon-{int(time.time())}-{uuid.uuid4().hex[:8]}"
            customer_name = 'Anonymous User'
            user_type = 'anonymous'
        
        # Add user type to request data for mechanic context
        enhanced_request_data = {
            **request_data,
            'userType': user_type,
            'customerId': customer_id,
            'customerName': customer_name
        }
        
        result = customer_communication_service.request_mechanic(
            enhanced_request_data, customer_id, customer_name
        )
        
        if result['success']:
            return result['data']
        else:
            return {'success': False, 'error': result['error']}
            
    except Exception as e:
        logger.error(f"Error handling mechanic request: {e}")
        return {'success': False, 'error': str(e)}


def handle_respond_to_estimate_review(event, context):
    """Handle customer response to mechanic-reviewed estimate"""
    logger.info(f"🔍 Respond to estimate review request: {event}")
    
    if not CUSTOMER_COMMUNICATION_SERVICE_AVAILABLE:
        logger.error("❌ Customer communication service not available")
        raise Exception('Customer communication service not available')
    
    try:
        arguments = event.get('arguments', {})
        estimate_id = arguments.get('estimateId')
        response = arguments.get('response')  # 'accepted', 'rejected', 'needs_clarification'
        customer_comment = arguments.get('customerComment', '')
        
        logger.info(f"🔍 Respond to estimate params: estimateId={estimate_id}, response={response}, comment={customer_comment}")
        
        # Get user info from context - User authentication required
        user_id = event.get('identity', {}).get('sub') if event.get('identity') else None
        if not user_id:
            logger.error("❌ User authentication required for estimate responses")
            raise Exception('This operation requires user authentication. Please use Cognito authentication instead of API key.')
        
        logger.info(f"🔍 User ID: {user_id}")
        
        # Call customer communication service
        result = customer_communication_service.respond_to_estimate_review(
            estimate_id=estimate_id,
            response=response,
            customer_comment=customer_comment,
            user_id=user_id
        )
        
        logger.info(f"🔍 Service result: {result}")
        
        if result['success']:
            logger.info(f"✅ Successfully responded to estimate review")
            return result['data']
        else:
            logger.error(f"❌ Service error: {result['error']}")
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"❌ Error responding to estimate review: {e}")
        raise e

def _download_s3_image_to_temp(bucket: str, key: str) -> str:
    """Download S3 image to temporary file and return path"""
    try:
        import boto3
        import tempfile
        import os
        
        s3 = boto3.client('s3')
        
        # Create temp file with appropriate extension
        file_extension = os.path.splitext(key)[1] or '.png'
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension, dir='/tmp') as tmp_file:
            temp_path = tmp_file.name
        
        # Download from S3 to temp file
        s3.download_file(bucket, key, temp_path)
        
        logger.info(f"🖼️ Image downloaded from S3 to temp file: {temp_path}")
        return temp_path
        
    except Exception as e:
        logger.error(f"❌ Error downloading image from S3: {e}")
        raise

def _save_base64_image_to_temp(image_base64: str) -> str:
    """Save base64 image to temporary file and return path (legacy support)"""
    try:
        import base64
        import tempfile
        
        # Clean base64 data
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode image
        image_bytes = base64.b64decode(image_base64)
        
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png', dir='/tmp') as tmp_file:
            tmp_file.write(image_bytes)
            temp_path = tmp_file.name
        
        logger.info(f"🖼️ Base64 image saved to temp file: {temp_path}")
        return temp_path
        
    except Exception as e:
        logger.error(f"❌ Error saving base64 image to temp file: {e}")
        raise

def _cleanup_temp_files(agent):
    """Clean up temporary files after processing"""
    temp_image_path = agent.state.get("temp_image_path")
    if temp_image_path and os.path.exists(temp_image_path):
        try:
            os.unlink(temp_image_path)
            logger.info(f"🧹 Cleaned up temp file: {temp_image_path}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to cleanup temp file: {e}")
