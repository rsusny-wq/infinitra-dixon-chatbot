import json
import os
import uuid
import logging
import boto3
from datetime import datetime
from decimal import Decimal
from strands import tool
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def convert_floats_to_decimals(data):
    """
    Convert all float values to Decimal for DynamoDB compatibility.
    Uses the proven json.loads(json.dumps()) with parse_float=Decimal approach.
    """
    try:
        # Convert to JSON string and back with Decimal parsing
        # This is the most reliable method for handling nested float values
        json_str = json.dumps(data, default=str)
        return json.loads(json_str, parse_float=Decimal)
    except Exception as e:
        logger.warning(f"⚠️ Float to Decimal conversion failed: {e}")
        return data

@tool
def save_cost_estimate(agent, filled_estimate_json: str) -> Dict[str, Any]:
    """
    Save cost estimate filled by agent to DynamoDB (authenticated users only)
    
    Converts float values to Decimal types for DynamoDB compatibility using the
    proven json.loads(json.dumps()) with parse_float=Decimal approach.
    
    Args:
        agent: Strands agent instance
        filled_estimate_json: JSON string of filled cost estimate template
    
    Returns:
        Success/failure status with estimate ID
    """
    try:
        # Check if user is authenticated
        is_authenticated = False
        if hasattr(agent, 'state') and agent.state:
            try:
                is_authenticated = agent.state.get("is_authenticated") or False
            except Exception as e:
                logger.warning(f"⚠️ Could not get authentication status: {e}")
                is_authenticated = False
        
        if not is_authenticated:
            logger.info("🔒 Cost estimate save attempted by unauthenticated user")
            return {
                'success': False,
                'error': 'authentication_required',
                'message': 'Please sign in to save cost estimates. You can still view the estimate above for reference.'
            }
        
        # Get user ID from agent state
        user_id = None
        if hasattr(agent, 'state') and agent.state:
            try:
                user_id = agent.state.get("user_id")
            except Exception as e:
                logger.warning(f"⚠️ Could not get user_id from state: {e}")
        
        # Fallback methods if state doesn't work
        if not user_id:
            user_id = getattr(agent, 'user_id', None) or getattr(agent, 'userId', None)
        
        # Final fallback for authenticated users
        if not user_id:
            try:
                conversation_id = getattr(agent, 'conversation_id', '') or (agent.state.get("conversation_id") if hasattr(agent, 'state') and agent.state else '')
            except Exception as e:
                logger.warning(f"⚠️ Could not get conversation_id: {e}")
                conversation_id = ''
            user_id = f"auth-user-{conversation_id}" if conversation_id else "authenticated-user"
            
        logger.info(f"🧾 Saving cost estimate for authenticated user: {user_id}")
        
        # Parse the filled template with enhanced error reporting
        try:
            # Log the JSON for debugging
            logger.info(f"🔍 Attempting to parse JSON (length: {len(filled_estimate_json)})")
            logger.info(f"🔍 JSON preview: {filled_estimate_json[:200]}...")
            
            estimate_data = json.loads(filled_estimate_json)
            logger.info(f"📋 Parsed estimate data keys: {list(estimate_data.keys())}")
            
            # Validate required fields
            required_fields = ['vehicleInfo', 'selectedOption', 'breakdown']
            missing_fields = [field for field in required_fields if field not in estimate_data]
            if missing_fields:
                logger.error(f"❌ Missing required fields: {missing_fields}")
                return {
                    'success': False,
                    'error': f'Missing required fields: {missing_fields}. Please ensure the estimate template is complete.'
                }
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in filled_estimate_json: {e}")
            logger.error(f"❌ JSON content around error: {filled_estimate_json[max(0, e.pos-50):e.pos+50]}")
            return {
                'success': False,
                'error': f'Invalid JSON format at position {e.pos}: {str(e)}. Please check the estimate template syntax.'
            }
        
        # Initialize DynamoDB using environment variable
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('COST_ESTIMATES_TABLE')
        
        if not table_name:
            logger.error("❌ COST_ESTIMATES_TABLE environment variable not set")
            return {
                'success': False,
                'error': 'COST_ESTIMATES_TABLE environment variable not set'
            }
        
        table = dynamodb.Table(table_name)
        logger.info(f"✅ Using table: {table_name}")
        
        # Generate estimate ID and add metadata
        estimate_id = f"EST-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
        
        # Create the final estimate - convert floats to Decimals for DynamoDB
        final_estimate = {
            'estimateId': estimate_id,
            'userId': user_id,
            'conversationId': getattr(agent, 'conversation_id', f"conv-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
            **estimate_data,  # Include all estimate data
            'status': 'draft',
            'createdAt': datetime.now().isoformat()
        }
        
        # Convert all float values to Decimal for DynamoDB compatibility
        # This addresses the "Float types are not supported" error
        final_estimate = convert_floats_to_decimals(final_estimate)
        
        logger.info(f"✅ Prepared estimate for DynamoDB save with Decimal conversion applied")
        
        # Save to DynamoDB - floats have been converted to Decimals
        # This prevents the "Float types are not supported" error
        try:
            table.put_item(Item=final_estimate)
            logger.info(f"✅ Successfully saved cost estimate: {estimate_id}")
            
            return {
                'success': True,
                'estimateId': estimate_id,
                'message': f'Cost estimate saved successfully! You can view it in your Cost Estimates tab.'
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to save to DynamoDB: {e}")
            return {
                'success': False,
                'error': f'Database save failed: {str(e)}'
            }
            
    except Exception as e:
        logger.error(f"❌ Unexpected error in save_cost_estimate: {e}")
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }
