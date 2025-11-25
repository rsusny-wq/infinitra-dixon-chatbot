"""
AI-Powered Conversation Title Generator
Uses Amazon Bedrock Claude 3 Haiku for fast, cost-effective title generation
"""

import json
import boto3
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import re

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Bedrock client - use us-west-2 to match Lambda region
bedrock_client = boto3.client('bedrock-runtime', region_name='us-west-2')

# Model configuration
TITLE_MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0'
MAX_TOKENS = 20
TEMPERATURE = 0.2

def generate_ai_title(content: str) -> Dict[str, Any]:
    """
    Generate conversation title using Claude 3 Haiku
    
    Args:
        content: The user's first message content
        
    Returns:
        Dict with success, title, generatedBy, and processingTime
    """
    start_time = datetime.now()
    
    try:
        # Clean and limit input content
        cleaned_content = clean_input_content(content)
        
        if not cleaned_content or len(cleaned_content.strip()) < 3:
            return {
                'success': True,
                'title': 'New Chat',
                'generatedBy': 'fallback',
                'processingTime': (datetime.now() - start_time).total_seconds() * 1000
            }
        
        # Create optimized prompt
        prompt = create_title_prompt(cleaned_content)
        
        # Call Bedrock
        response = bedrock_client.invoke_model(
            modelId=TITLE_MODEL_ID,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "stop_sequences": ["\n", ".", "!"]
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        ai_title = extract_title_from_response(response_body)
        
        # Validate and clean title
        final_title = validate_and_clean_title(ai_title, cleaned_content)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.info(f"✅ AI title generated: '{final_title}' in {processing_time:.0f}ms")
        
        return {
            'success': True,
            'title': final_title,
            'generatedBy': 'ai',
            'processingTime': processing_time
        }
        
    except Exception as e:
        logger.error(f"❌ AI title generation failed: {str(e)}")
        
        # Return fallback title
        fallback_title = generate_fallback_title(content)
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return {
            'success': True,  # Still successful with fallback
            'title': fallback_title,
            'generatedBy': 'fallback',
            'processingTime': processing_time,
            'error': f"AI generation failed: {str(e)}"
        }

def clean_input_content(content: str) -> str:
    """Clean and prepare input content for AI processing"""
    if not content:
        return ""
    
    # Remove excessive whitespace and newlines
    cleaned = re.sub(r'\s+', ' ', content.strip())
    
    # Limit length to prevent token overflow
    if len(cleaned) > 200:
        cleaned = cleaned[:200] + "..."
    
    return cleaned

def create_title_prompt(content: str) -> str:
    """Create optimized prompt for title generation"""
    return f"""Generate a concise 2-4 word title for this automotive issue. Focus on the main problem and vehicle if mentioned.

Examples:
- "Honda Civic Brake Issue"
- "Engine Won't Start" 
- "AC Not Working"
- "Toyota Oil Change"
- "Transmission Problem"

Issue: {content}

Title:"""

def extract_title_from_response(response_body: Dict) -> str:
    """Extract title from Bedrock response"""
    try:
        if 'content' in response_body and response_body['content']:
            content = response_body['content'][0]
            if 'text' in content:
                return content['text'].strip()
        
        # Fallback extraction
        if 'completion' in response_body:
            return response_body['completion'].strip()
            
        return ""
        
    except Exception as e:
        logger.warning(f"Error extracting title from response: {e}")
        return ""

def validate_and_clean_title(ai_title: str, original_content: str) -> str:
    """Validate and clean the AI-generated title"""
    if not ai_title:
        return generate_fallback_title(original_content)
    
    # Clean the title
    cleaned = ai_title.strip()
    
    # Remove common prefixes
    prefixes_to_remove = ['title:', 'issue:', 'problem:', 'the ', 'a ']
    for prefix in prefixes_to_remove:
        if cleaned.lower().startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
    
    # Remove quotes
    cleaned = cleaned.strip('"\'')
    
    # Capitalize properly
    cleaned = ' '.join(word.capitalize() for word in cleaned.split())
    
    # Length validation
    if len(cleaned) < 3:
        return generate_fallback_title(original_content)
    
    if len(cleaned) > 30:
        cleaned = cleaned[:30].strip() + "..."
    
    # Content validation - avoid generic responses
    generic_responses = [
        'conversation', 'based on', 'automotive', 'car issue', 
        'vehicle problem', 'help', 'assistance', 'new chat'
    ]
    
    if any(generic in cleaned.lower() for generic in generic_responses):
        return generate_fallback_title(original_content)
    
    return cleaned

def generate_fallback_title(content: str) -> str:
    """Generate fallback title using keyword extraction"""
    if not content:
        return "New Chat"
    
    try:
        words = content.lower().split()
        
        # Car brands
        car_brands = {
            'honda': 'Honda', 'toyota': 'Toyota', 'ford': 'Ford', 
            'chevrolet': 'Chevrolet', 'chevy': 'Chevrolet', 'nissan': 'Nissan',
            'bmw': 'BMW', 'mercedes': 'Mercedes', 'audi': 'Audi',
            'volkswagen': 'Volkswagen', 'vw': 'VW', 'subaru': 'Subaru'
        }
        
        # Car models
        car_models = {
            'civic': 'Civic', 'accord': 'Accord', 'camry': 'Camry',
            'corolla': 'Corolla', 'prius': 'Prius', 'rav4': 'RAV4',
            'f150': 'F-150', 'f-150': 'F-150', 'mustang': 'Mustang'
        }
        
        # Problems
        problems = {
            'brake': 'Brake Issue', 'brakes': 'Brake Issue',
            'engine': 'Engine Problem', 'transmission': 'Transmission Issue',
            'battery': 'Battery Problem', 'oil': 'Oil Service',
            'noise': 'Noise Issue', 'sound': 'Sound Issue',
            'leak': 'Leak Problem', 'light': 'Warning Light',
            'ac': 'AC Issue', 'air': 'AC Issue'
        }
        
        # Find matches
        found_brand = None
        found_model = None
        found_problem = None
        
        for word in words:
            if word in car_brands and not found_brand:
                found_brand = car_brands[word]
            elif word in car_models and not found_model:
                found_model = car_models[word]
            elif word in problems and not found_problem:
                found_problem = problems[word]
        
        # Build title
        title_parts = []
        if found_brand:
            title_parts.append(found_brand)
        if found_model:
            title_parts.append(found_model)
        if found_problem:
            title_parts.append(found_problem)
        elif found_brand or found_model:
            title_parts.append("Issue")
        
        if title_parts:
            return " ".join(title_parts)
        
        # Final fallback - first few words
        first_words = " ".join(content.split()[:4])
        if len(first_words) > 3:
            return first_words[:25] + ("..." if len(first_words) > 25 else "")
        
        return "Automotive Issue"
        
    except Exception as e:
        logger.error(f"Error in fallback title generation: {e}")
        return "New Chat"

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for AI title generation
    
    Expected event format:
    {
        "content": "My Honda Civic is making brake noise"
    }
    """
    try:
        logger.info(f"🎯 AI Title Generation request: {json.dumps(event, default=str)}")
        
        # Extract content from event
        content = event.get('content', '')
        
        if not content:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Content is required'
                })
            }
        
        # Generate title
        result = generate_ai_title(content)
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"❌ Lambda handler error: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': f"Internal server error: {str(e)}"
            })
        }

# For testing
if __name__ == "__main__":
    test_cases = [
        "My Honda Civic is making brake noise",
        "Engine won't start on my Toyota Camry",
        "AC not working",
        "Strange sound when turning",
        "Oil change cost for Ford F-150"
    ]
    
    for test_content in test_cases:
        print(f"\nTesting: {test_content}")
        result = generate_ai_title(test_content)
        print(f"Result: {result}")
