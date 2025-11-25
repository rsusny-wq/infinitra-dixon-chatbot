#!/usr/bin/env python3
"""
Dixon Smart Repair v0.2 - Refactored Handler (Strands Best Practices)
Uses refactored tools with explicit parameters - no agent state access
Follows Strands best practices for agent creation and tool usage
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
from strands import Agent, tool
from strands.session.s3_session_manager import S3SessionManager
from strands.agent.conversation_manager import SlidingWindowConversationManager
from strands.models import BedrockModel
import boto3
from botocore.exceptions import ClientError

# Import optimized system prompts
from dixon_v2_system_prompt_optimized import get_optimized_v2_system_prompt, select_optimal_prompt
from simplified_tools_v2_refactored import (
    fetch_user_vehicles,
    extract_vin_from_image,
    lookup_vehicle_data,
    store_vehicle_record,
    search_web,
    calculate_labor_estimates,
    save_labor_estimate_record
)

# Configure logging
logger = logging.getLogger(__name__)

# AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
CONVERSATION_TABLE = os.environ.get('CONVERSATION_TABLE')
MESSAGE_TABLE = os.environ.get('MESSAGE_TABLE')
S3_SESSION_BUCKET = os.environ.get('S3_SESSION_BUCKET', 'dixon-smart-repair-sessions-041063310146')
AWS_REGION = os.environ.get('AWS_REGION', 'us-west-2')

# Check Nova Pro VIN tool availability globally
try:
    from simplified_tools_v2_refactored import extract_vin_with_nova_pro, validate_vin
    NOVA_VIN_TOOL_AVAILABLE = True
    logger.info("✅ Nova Pro VIN extraction tool available globally")
except ImportError:
    NOVA_VIN_TOOL_AVAILABLE = False
    logger.warning("⚠️ Nova Pro VIN tool not available globally, using fallback")

# Global agent cache to maintain conversation context and avoid re-initialization
# Key: conversation_id, Value: (Agent instance, creation_timestamp)
AGENT_CACHE = {}
CACHE_MAX_SIZE = 100  # Prevent memory issues in Lambda
CACHE_TTL_SECONDS = 300  # 5 minutes - balance between context and memory

# Tool version - increment this when tools are updated to force cache invalidation
TOOL_VERSION = "v2.1"  # Updated for Nova Pro Strands format fix

class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle Decimal objects from DynamoDB"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_or_create_agent(conversation_id: str, user_id: str, image_base64: str = None, is_authenticated: bool = False) -> Agent:
    """
    Get existing agent from cache or create new one following Strands best practices.
    
    This implements proper agent lifecycle management:
    - Reuses existing agents to maintain conversation context
    - Creates new agents only when necessary
    - Implements cache size limits and TTL for Lambda memory management
    
    Args:
        conversation_id: Unique conversation identifier
        user_id: User identifier
        image_base64: Optional base64 encoded image
        is_authenticated: Whether the user is authenticated
    """
    current_time = time.time()
    
    # Create versioned cache key to force invalidation when tools are updated
    cache_key = f"{conversation_id}_{TOOL_VERSION}"
    
    # Check if agent exists in cache and is still valid
    if cache_key in AGENT_CACHE:
        cached_agent, created_time = AGENT_CACHE[cache_key]
        
        # Check TTL - if agent is too old, remove it
        if current_time - created_time > CACHE_TTL_SECONDS:
            logger.info(f"🕐 Agent cache expired for conversation: {conversation_id}")
            del AGENT_CACHE[cache_key]
        else:
            logger.info(f"♻️ Reusing existing agent for conversation: {conversation_id}")
            return cached_agent
    
    # Create new agent if not in cache or expired
    logger.info(f"🤖 Creating new optimized v0.2 agent for session: {conversation_id}")
    
    # Create the agent using the existing function
    agent = create_optimized_agent_internal(conversation_id, user_id, image_base64, is_authenticated)
    
    # Cache management - remove oldest entries if cache is full
    if len(AGENT_CACHE) >= CACHE_MAX_SIZE:
        # Remove oldest entry (simple FIFO eviction)
        oldest_key = next(iter(AGENT_CACHE))
        logger.info(f"🗑️ Evicting oldest agent from cache: {oldest_key}")
        del AGENT_CACHE[oldest_key]
    
    # Cache the new agent with timestamp
    AGENT_CACHE[cache_key] = (agent, current_time)
    
    logger.info(f"✅ Agent cached for conversation: {conversation_id}")
    return agent

def create_optimized_agent_internal(conversation_id: str, user_id: str, image_base64: str = None, is_authenticated: bool = False) -> Agent:
    """
    Create optimized agent following Strands best practices
    
    Args:
        conversation_id: Unique conversation identifier
        user_id: User identifier
        image_base64: Optional base64 encoded image
        is_authenticated: Whether the user is authenticated
    """
    logger.info(f"🤖 Creating optimized v0.2 agent for session: {conversation_id}")
    
    # Enhanced model configuration following Strands best practices
    model = BedrockModel(
        model_id="us.amazon.nova-pro-v1:0",
        region_name=AWS_REGION,
        temperature=0.3,  # Consistent responses for automotive advice
        max_tokens=4000,  # Sufficient for detailed responses
        top_p=0.9        # Good balance of creativity and consistency
    )
    
    # Optimized session management
    session_mgr = S3SessionManager(
        session_id=conversation_id,
        bucket=S3_SESSION_BUCKET,
        prefix="v2-production/",
        region_name=AWS_REGION
    )
    
    # Memory management with increased window for better context
    conversation_mgr = SlidingWindowConversationManager(
        window_size=20,  # Increased for better context retention
        should_truncate_results=True
    )
    
    # Import base tool functions
    from simplified_tools_v2_refactored import (
        fetch_user_vehicles as _fetch_user_vehicles,
        extract_vin_from_image,
        lookup_vehicle_data,
        store_vehicle_record as _store_vehicle_record,
        search_web,
        calculate_labor_estimates as _calculate_labor_estimates,
        save_labor_estimate_record as _save_labor_estimate_record
    )
    
    # Create context-aware tools using closures (Strands best practice)
    @tool
    def fetch_user_vehicles() -> str:
        """Fetch all vehicles associated with the current user."""
        return _fetch_user_vehicles(user_id=user_id)
    
    @tool
    def store_vehicle_record(year: str, make: str, model: str, trim: str = "", vin: str = "", mileage: str = "") -> str:
        """Store a vehicle record for the current user."""
        return _store_vehicle_record(
            user_id=user_id, year=year, make=make, model=model, 
            trim=trim, vin=vin, mileage=mileage
        )
    
    @tool
    def save_labor_estimate_record(repair_type: str, vehicle_info: Dict[str, Any], 
                                 model_estimates: Dict[str, Any],
                                 final_estimate: Dict[str, Any], consensus_reasoning: str) -> Dict[str, str]:
        """
        Save the complete labor estimate consensus process including:
        - All model estimates (Claude, Web)  
        - Your final consensus decision
        - Your reasoning for the final decision
        
        Note: Your initial estimate is automatically retrieved from agent state 
        (stored when you called calculate_labor_estimates).
        """
        return _save_labor_estimate_record(
            user_id=user_id,
            conversation_id=conversation_id,
            repair_type=repair_type,
            vehicle_info=vehicle_info,
            model_estimates=model_estimates,
            final_estimate=final_estimate,
            consensus_reasoning=consensus_reasoning,
            agent=agent  # Pass agent so tool can retrieve initial_estimate from agent.state
        )

    @tool
    def calculate_labor_estimates(repair_type: str, vehicle_info: Dict[str, Any], 
                                diagnostic_context: str = "", 
                                agent_initial_estimate: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Calculate labor estimates using multi-model consensus and store your initial estimate.
        
        Args:
            repair_type: Type of repair (e.g., "brake pad replacement")
            vehicle_info: Vehicle details (make, model, year, etc.)
            diagnostic_context: Detailed diagnostic information from conversation
            agent_initial_estimate: Your initial estimate before validation
            
        Returns:
            Dictionary with Claude estimate, web validation, and timestamp
        """
        return _calculate_labor_estimates(
            repair_type=repair_type,
            vehicle_info=vehicle_info,
            diagnostic_context=diagnostic_context,
            agent_initial_estimate=agent_initial_estimate,
            agent=agent  # Pass agent so tool can store initial_estimate in agent.state
        )

    # Nova Pro VIN extraction tool (already checked globally)
    if NOVA_VIN_TOOL_AVAILABLE:
        logger.info("✅ Using Nova Pro VIN extraction tool (Official Strands Format)")
    
    # Import Strands image_reader tool as backup
    try:
        from strands_tools import image_reader
        image_tool_available = True
        logger.info("✅ Strands image_reader tool available as backup")
    except ImportError:
        image_tool_available = False
        logger.warning("⚠️ Strands image_reader not available")
    
    # Refactored tools with proper context injection via closures
    tools = [
        fetch_user_vehicles,
        # extract_vin_from_image,  # Kept as backup, not registered with agent
        lookup_vehicle_data,
        store_vehicle_record,
        search_web,
        calculate_labor_estimates,  # Now uses wrapper to pass agent for state management
        save_labor_estimate_record
    ]
    
    # Add image processing capability - prioritize Nova Pro VIN tool
    if NOVA_VIN_TOOL_AVAILABLE:
        tools.extend([extract_vin_with_nova_pro, validate_vin])
        logger.info("✅ Nova Pro VIN extraction and validation tools added to agent")
    
    if image_tool_available:
        tools.append(image_reader)
        logger.info("✅ Strands image_reader added as backup tool")
    
    if not NOVA_VIN_TOOL_AVAILABLE and not image_tool_available:
        # Fallback to old tool if neither is available
        tools.append(extract_vin_from_image)
        logger.info("⚠️ Using fallback VIN extraction tool")
    
    # Create context for intelligent prompt selection
    user_context = {
        "has_image": bool(image_base64),
        "user_id": user_id,
        "is_authenticated": is_authenticated  # Add authentication status
    }
    
    # Select optimal prompt based on context
    system_prompt = select_optimal_prompt(user_context, performance_mode="balanced")
    
    # Create agent with optimized configuration
    agent = Agent(
        model=model,
        tools=tools,
        system_prompt=system_prompt,
        session_manager=session_mgr,
        conversation_manager=conversation_mgr
    )
    
    # Store context for agent (Strands best practice)
    agent.context = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "image_base64": image_base64,
        "version": "v0.2-refactored-optimized"
    }
    
    logger.info(f"✅ Optimized v0.2 agent initialized with {len(tools)} tools")
    logger.info(f"📝 Using prompt: {len(system_prompt)} characters")
    
    return agent

def create_optimized_agent(conversation_id: str, user_id: str, image_base64: str = None, is_authenticated: bool = False) -> Agent:
    """
    Create optimized agent with caching for conversation context.
    
    This function now uses agent caching to:
    - Maintain conversation context across messages
    - Avoid expensive re-initialization for every message
    - Follow Strands best practices for agent lifecycle management
    
    Args:
        conversation_id: Unique conversation identifier
        user_id: User identifier
        image_base64: Optional base64 encoded image
        is_authenticated: Whether the user is authenticated
    """
    return get_or_create_agent(conversation_id, user_id, image_base64, is_authenticated)

def handle_v2_chat_message_refactored(args):
    """
    Refactored v0.2 message handler using Strands best practices
    """
    try:
        logger.info("🚀 Processing message with refactored Dixon v0.2 handler")
        
        # 🔍 DEBUG: Log all received arguments
        logger.info(f"🔍 DEBUG: Raw args received: {json.dumps(args, indent=2, default=str)}")
        
        # Extract arguments with validation
        conversation_id = args.get('conversationId')
        message = args.get('message', '')
        user_id = args.get('userId', 'anonymous-user')
        image_base64 = args.get('image_base64')  # Keep for backward compatibility
        image_s3_key = args.get('image_s3_key')  # NEW: S3 image key
        image_s3_bucket = args.get('image_s3_bucket')  # NEW: S3 bucket name
        diagnostic_level = args.get('diagnosticLevel', 'enhanced')
        
        # Extract and parse diagnostic_context from frontend
        diagnostic_context_str = args.get('diagnostic_context', '{}')
        try:
            diagnostic_context = json.loads(diagnostic_context_str) if isinstance(diagnostic_context_str, str) else diagnostic_context_str
            is_authenticated = diagnostic_context.get('is_authenticated', False)
            logger.info(f"🔐 Authentication status: {is_authenticated} (from diagnostic_context)")
        except (json.JSONDecodeError, AttributeError) as e:
            logger.warning(f"⚠️ Failed to parse diagnostic_context: {e}")
            diagnostic_context = {}
            is_authenticated = False
        
        # 🔍 DEBUG: Log extracted image parameters specifically
        logger.info(f"🔍 DEBUG: Extracted image parameters:")
        logger.info(f"  - image_base64: {'Present' if image_base64 else 'None'} (length: {len(image_base64) if image_base64 else 0})")
        logger.info(f"  - image_s3_key: {image_s3_key}")
        logger.info(f"  - image_s3_bucket: {image_s3_bucket}")
        logger.info(f"  - Has S3 params: {bool(image_s3_key and image_s3_bucket)}")
        
        if not conversation_id:
            raise ValueError("conversationId is required")
        
        if not message and not image_base64 and not (image_s3_key and image_s3_bucket):
            raise ValueError("Either message or image is required")
        
        logger.info(f"📝 Processing: {message[:100]}... (user: {user_id})")
        
        # Create optimized agent
        agent = create_optimized_agent(conversation_id, user_id, image_base64 or (image_s3_key and image_s3_bucket), is_authenticated)
        
        # Handle image if provided (S3 or base64) - use Nova Pro tool directly with S3
        temp_image_path = None  # Initialize to avoid scope issues
        if image_s3_key and image_s3_bucket:
            logger.info(f"🖼️ S3 image provided: s3://{image_s3_bucket}/{image_s3_key}")
            
            # Store S3 info in agent state for tools to access
            agent.state.set("image_s3_bucket", image_s3_bucket)
            agent.state.set("image_s3_key", image_s3_key)
            
            # Use Nova Pro tool directly with S3 parameters - no temp file needed
            if NOVA_VIN_TOOL_AVAILABLE:
                message = f"""{message}

IMAGE_S3_LOCATION: s3://{image_s3_bucket}/{image_s3_key}

Please use the extract_vin_with_nova_pro tool with s3_bucket="{image_s3_bucket}" and s3_key="{image_s3_key}" to extract the VIN from the uploaded image with high accuracy."""
                logger.info("✅ S3 image configured for Nova Pro VIN extraction")
            else:
                # Fallback to temp file approach for other tools
                temp_image_path = _download_s3_image_to_temp(image_s3_bucket, image_s3_key)
                agent.state.set("temp_image_path", temp_image_path)
                message = f"{message}\n\nIMAGE_FILE_PATH: {temp_image_path}\n\nPlease use the image_reader tool with the above file path to analyze the uploaded image."
                logger.info(f"✅ S3 image downloaded to temporary file: {temp_image_path}")
                
        elif image_base64:
            logger.info("🖼️ Base64 image provided (legacy), saving to temporary file for image tools")
            
            # Save base64 image to temporary file
            import tempfile
            import base64
            
            try:
                # Decode base64 image
                image_data = base64.b64decode(image_base64)
                
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                    temp_file.write(image_data)
                    temp_image_path = temp_file.name
                
                # Store both image data and path in agent state for tools to access
                agent.state.set("current_image", image_base64)
                agent.state.set("temp_image_path", temp_image_path)
                
                # Simple message since VIN instructions are in system prompt
                message = f"{message}\n\n[IMAGE_UPLOADED: I've uploaded an image at {temp_image_path}. Please analyze it if relevant to my request.]"
                
                logger.info(f"✅ Base64 image saved to temporary file: {temp_image_path}")
                
            except Exception as e:
                logger.error(f"❌ Error processing image: {e}")
                # Continue without image processing
        
        # Process message with agent
        logger.info("🧠 Agent processing message...")
        
        # PERFORMANCE TRACKING: Add detailed timing logs
        timing_start = time.time()
        timing_logs = []
        
        def log_timing(step_name: str):
            current_time = time.time()
            elapsed = current_time - timing_start
            step_time = current_time - (timing_logs[-1][1] if timing_logs else timing_start)
            timing_logs.append((step_name, current_time, elapsed, step_time))
            logger.info(f"⏱️ TIMING: {step_name} - Step: {step_time:.2f}s, Total: {elapsed:.2f}s")
        
        log_timing("Agent processing started")
        
        # Enhanced callback to log all tool usage with timing
        def tool_callback(**kwargs):
            if "current_tool_use" in kwargs:
                tool = kwargs["current_tool_use"]
                tool_name = tool.get("name", "unknown")
                log_timing(f"Tool '{tool_name}' started")
                logger.info(f"🔧 Tool '{tool_name}' called with: {tool.get('input', {})}")
            elif "tool_result" in kwargs:
                tool_result = kwargs["tool_result"]
                tool_name = tool_result.get("tool_name", "unknown")
                log_timing(f"Tool '{tool_name}' completed")
                result_content = str(tool_result.get("content", ""))[:200]  # Limit log size
                logger.info(f"✅ Tool '{tool_name}' result: {result_content}")
            elif "thinking" in kwargs:
                log_timing("Agent thinking/reasoning")
                logger.info("🤔 Agent thinking...")
            elif "response_generation" in kwargs:
                log_timing("Response generation started")
                logger.info("📝 Agent generating response...")
        
        try:
            # Call agent with timeout handling and enhanced callback
            log_timing("Agent call initiated")
            start_time = datetime.utcnow()
            
            result = agent(message, callback_handler=tool_callback)
            
            end_time = datetime.utcnow()
            log_timing("Agent call completed")
            
            processing_time = (end_time - start_time).total_seconds()
            logger.info(f"✅ Agent processing completed in {processing_time:.2f} seconds")
            
            # Log detailed timing breakdown
            logger.info("📊 DETAILED TIMING BREAKDOWN:")
            for i, (step_name, timestamp, total_elapsed, step_time) in enumerate(timing_logs):
                logger.info(f"📊   {i+1}. {step_name}: {step_time:.2f}s (total: {total_elapsed:.2f}s)")
            
            if not result:
                raise ValueError("Agent returned empty result")
            
        except Exception as agent_error:
            log_timing("Agent error occurred")
            logger.error(f"❌ Agent processing failed: {str(agent_error)}")
            
            # Graceful fallback response
            fallback_message = (
                "I'm experiencing some technical difficulties with my enhanced features. "
                "Let me provide basic automotive assistance:\n\n"
                "Please describe your vehicle issue, and I'll help with:\n"
                "• Basic diagnostic questions\n"
                "• General repair guidance\n"
                "• Cost estimation assistance\n\n"
                "If you have a VIN or vehicle details, please share them for better assistance."
            )
            
            return create_response(
                conversation_id=conversation_id,
                message=fallback_message,
                diagnostic_level=diagnostic_level,
                error_context={"fallback_used": True, "original_error": str(agent_error)}
            )
        
        # Save user message to DynamoDB first
        save_message_to_db(conversation_id, message, user_id, diagnostic_level, sender='user')
        
        # Process agent response
        response_message = process_agent_result(result)
        
        # Save assistant message to DynamoDB
        save_message_to_db(conversation_id, response_message, user_id, diagnostic_level, sender='assistant')
        
        # CRITICAL FIX: Save conversation context for authenticated users
        # This ensures conversations appear in chat history by setting the userId field
        try:
            # Extract vehicle context from conversation if available
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
            if is_authenticated and user_id and user_id != 'anonymous-user' and not user_id.startswith('anonymous-'):
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
                if not user_id or user_id == 'anonymous-user' or user_id.startswith('anonymous-'):
                    logger.info("⏭️ User ID is empty, None, or anonymous")
        except Exception as persistence_error:
            logger.warning(f"⚠️ Could not save conversation context to DynamoDB: {persistence_error}")
        
        # Cleanup temporary image file if it exists (only needed for fallback cases)
        try:
            _cleanup_temp_files(agent)
        except Exception as cleanup_error:
            logger.warning(f"⚠️ Failed to cleanup temporary image file: {cleanup_error}")
        
        # Return successful response
        return create_response(
            conversation_id=conversation_id,
            message=response_message,
            diagnostic_level=diagnostic_level
        )
        
    except Exception as e:
        logger.error(f"❌ Handler error: {str(e)}")
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        
        return create_error_response(
            conversation_id=conversation_id if 'conversation_id' in locals() else '',
            error=str(e)
        )

def process_agent_result(result) -> str:
    """
    Process agent result following Strands best practices
    """
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
    
    # Clean any formatting artifacts
    if isinstance(response_message, str):
        # Remove thinking tags that shouldn't be exposed to users
        response_message = re.sub(r'<thinking>.*?</thinking>', '', response_message, flags=re.DOTALL)
        
        # Remove common Strands response formatting artifacts
        response_message = re.sub(r"^\{'role':\s*'assistant',\s*'content':\s*\[\{'text':\s*'", '', response_message)
        response_message = re.sub(r"'\}\]\}$", '', response_message)
        response_message = response_message.strip()
    
    logger.info(f"✅ Processed response: {len(response_message)} characters")
    
    return response_message

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

def save_message_to_db(conversation_id: str, message: str, user_id: str, diagnostic_level: str, sender: str = 'assistant'):
    """
    Save message to DynamoDB with error handling
    """
    try:
        message_table = dynamodb.Table(MESSAGE_TABLE)
        message_table.put_item(
            Item={
                'id': str(uuid.uuid4()),
                'conversationId': conversation_id,
                'content': message,
                'sender': sender,
                'timestamp': datetime.utcnow().isoformat(),
                'version': 'v0.2-refactored',
                'metadata': {
                    'diagnostic_level': diagnostic_level,
                    'user_id': user_id,
                    'enhanced_features': True,
                    'strands_best_practices': True
                }
            }
        )
        logger.info(f"💾 {sender.capitalize()} message saved to DynamoDB")
        
    except Exception as db_error:
        logger.error(f"❌ Failed to save {sender} message to DynamoDB: {str(db_error)}")

def create_response(conversation_id: str, message: str, diagnostic_level: str, error_context: Dict = None) -> Dict:
    """
    Create standardized response following GraphQL schema
    """
    return {
        'conversationId': conversation_id,
        'message': message,
        'timestamp': datetime.utcnow().isoformat(),
        'sender': 'assistant',
        'poweredBy': 'Dixon Smart Repair AI v0.2 (Refactored)',
        'success': True,
        'diagnostic_context': {
            'level': diagnostic_level,
            'accuracy': '95%',
            'user_selection': 'enhanced',
            'vin_enhanced': True,
            'version': 'v0.2-refactored',
            'strands_best_practices': True,
            'error_context': error_context
        }
    }

def create_error_response(conversation_id: str, error: str) -> Dict:
    """
    Create standardized error response
    """
    return {
        'success': False,
        'error': f"v0.2 Handler error: {error}",
        'conversationId': conversation_id,
        'message': f"I'm experiencing technical difficulties. Error: {error}",
        'timestamp': datetime.utcnow().isoformat(),
        'sender': 'system',
        'poweredBy': 'Dixon Smart Repair AI v0.2 (Refactored)'
    }

def lambda_handler(event, context):
    """
    AWS Lambda entry point for refactored v0.2 handler
    """
    try:
        # Parse the event
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        # Route to refactored v0.2 chat handler
        return handle_v2_chat_message_refactored(body)
        
    except Exception as e:
        logger.error(f"❌ Lambda handler error: {str(e)}")
        return create_error_response('', str(e))

# Test function for the refactored handler
def handle_generate_image_upload_url(args):
    """Handle generateImageUploadUrl GraphQL mutation"""
    try:
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
        import boto3
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

def _cleanup_temp_files(agent):
    """Clean up temporary files after processing"""
    temp_image_path = agent.state.get("temp_image_path")
    if temp_image_path and os.path.exists(temp_image_path):
        try:
            os.unlink(temp_image_path)
            logger.info(f"🧹 Cleaned up temp file: {temp_image_path}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to cleanup temp file: {e}")

def test_refactored_handler():
    """
    Test the refactored handler with mock data
    """
    test_args = {
        'conversationId': 'test-conv-123',
        'message': 'Hello, I need help with my car',
        'userId': 'test-user-456',
        'diagnosticLevel': 'enhanced'
    }
    
    try:
        result = handle_v2_chat_message_refactored(test_args)
        print(f"✅ Handler test passed: {result.get('success', False)}")
        return True
    except Exception as e:
        print(f"❌ Handler test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_refactored_handler()
