#!/usr/bin/env python3
"""
Dixon Smart Repair v0.2 - Refactored Simplified Tools (Strands Best Practices)
7 focused tools with explicit parameters - no agent state access
All tools are independently testable and follow Strands best practices
"""

import json
import logging
import os
import uuid
import time
import base64
import requests
import concurrent.futures
from datetime import datetime
from typing import Dict, List, Any, Optional
from decimal import Decimal
from strands import tool
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger(__name__)

# AWS clients
dynamodb = boto3.resource('dynamodb')
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-west-2')
textract = boto3.client('textract', region_name='us-west-2')

# Environment variables
VEHICLE_TABLE = os.environ.get('VEHICLE_TABLE', 'dixon-vehicles')
LABOR_ESTIMATE_REPORTS_TABLE = os.environ.get('LABOR_ESTIMATE_REPORTS_TABLE', 'LaborEstimateReports')
TAVILY_API_KEY = os.environ.get('TAVILY_API_KEY')

@tool
def fetch_user_vehicles(user_id: str) -> List[Dict[str, Any]]:
    """
    Query DynamoDB for user's vehicles
    
    Args:
        user_id: The user ID to fetch vehicles for
        
    Returns:
        List of vehicle records for the user
        
    Raises:
        ValueError: If user_id is not provided
        ClientError: If DynamoDB query fails
    """
    if not user_id:
        raise ValueError("User ID is required")
    
    logger.info(f"🚗 Fetching vehicles for user: {user_id}")
    
    try:
        vehicle_table = dynamodb.Table(VEHICLE_TABLE)
        
        response = vehicle_table.query(
            IndexName='UserVehiclesIndex',
            KeyConditionExpression='userId = :user_id',
            ExpressionAttributeValues={':user_id': user_id},
            ScanIndexForward=False,  # Latest first
            Limit=10  # Reasonable limit
        )
        
        vehicles = response.get('Items', [])
        logger.info(f"✅ Found {len(vehicles)} vehicles for user")
        
        return vehicles
        
    except ClientError as e:
        logger.error(f"❌ DynamoDB error fetching vehicles: {str(e)}")
        raise ClientError(f"Database error: {str(e)}", e.operation_name)
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching vehicles: {str(e)}")
        raise Exception(f"Failed to fetch vehicles: {str(e)}")

@tool
def extract_vin_from_image(image_base64: str) -> Dict[str, Any]:
    """
    Process image with Textract to extract VIN
    
    Args:
        image_base64: Base64 encoded image data
        
    Returns:
        Dictionary containing:
        - vin: Extracted VIN (if found)
        - confidence: Confidence score (0-100)
        - raw_text: All extracted text
        - found: Boolean indicating if VIN was found
        
    Raises:
        ValueError: If image_base64 is not provided or invalid
        ClientError: If Textract processing fails
    """
    if not image_base64:
        raise ValueError("Image data is required")
    
    logger.info("🖼️ Processing image for VIN extraction")
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_base64)
    except Exception as decode_error:
        raise ValueError(f"Invalid image format: {str(decode_error)}")
    
    try:
        # Call Textract to extract text
        response = textract.detect_document_text(
            Document={'Bytes': image_bytes}
        )
        
        # Extract all text from response
        extracted_text = []
        for item in response.get('Blocks', []):
            if item['BlockType'] == 'LINE':
                extracted_text.append(item['Text'])
        
        all_text = ' '.join(extracted_text)
        logger.info(f"📝 Extracted text: {all_text[:100]}...")
        
        # Look for VIN pattern (17 characters, alphanumeric, no I, O, Q)
        import re
        vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
        vin_matches = re.findall(vin_pattern, all_text.upper())
        
        if vin_matches:
            vin = vin_matches[0]
            confidence = 95  # High confidence for pattern match
            logger.info(f"✅ VIN found: {vin}")
            
            return {
                "vin": vin,
                "confidence": confidence,
                "raw_text": all_text,
                "found": True
            }
        else:
            logger.info("⚠️ No VIN pattern found in extracted text")
            return {
                "vin": None,
                "confidence": 0,
                "raw_text": all_text,
                "found": False
            }
            
    except ClientError as e:
        logger.error(f"❌ Textract error: {str(e)}")
        raise ClientError(f"Image processing failed: {str(e)}", e.operation_name)
    except Exception as e:
        logger.error(f"❌ Unexpected error processing image: {str(e)}")
        raise Exception(f"Failed to process image: {str(e)}")

@tool
def lookup_vehicle_data(vin: str) -> Dict[str, Any]:
    """
    Look up vehicle data from NHTSA API using VIN
    
    Args:
        vin: Vehicle Identification Number (17 characters)
        
    Returns:
        Dictionary containing:
        - vin: The input VIN
        - make: Vehicle make
        - model: Vehicle model  
        - year: Model year
        - engine: Engine configuration
        - full_data: Complete NHTSA response data
        - source: Data source ("NHTSA")
        
    Raises:
        ValueError: If VIN is not provided or invalid format
        requests.RequestException: If NHTSA API call fails
    """
    if not vin:
        raise ValueError("VIN is required")
    
    if len(vin) != 17:
        raise ValueError("VIN must be exactly 17 characters")
    
    logger.info(f"🔍 Looking up vehicle data for VIN: {vin}")
    
    try:
        # Call NHTSA API
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('Results'):
            # Parse NHTSA response
            vehicle_info = {}
            for result in data['Results']:
                variable = result.get('Variable', '')
                value = result.get('Value', '')
                
                if value and value != 'Not Applicable':
                    vehicle_info[variable] = value
            
            # Extract commonly used fields
            make = vehicle_info.get('Make', '')
            model = vehicle_info.get('Model', '')
            year = vehicle_info.get('Model Year', '')
            engine = vehicle_info.get('Engine Configuration', '')
            
            logger.info(f"✅ Vehicle data retrieved: {year} {make} {model}")
            
            return {
                "vin": vin,
                "make": make,
                "model": model,
                "year": year,
                "engine": engine,
                "full_data": vehicle_info,
                "source": "NHTSA"
            }
        else:
            raise ValueError("No vehicle data found for this VIN")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ NHTSA API error: {str(e)}")
        raise requests.RequestException(f"Vehicle lookup service unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error looking up vehicle: {str(e)}")
        raise Exception(f"Vehicle lookup failed: {str(e)}")

@tool
def store_vehicle_record(user_id: str, vehicle_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Save vehicle record to DynamoDB
    
    Args:
        user_id: User ID to associate the vehicle with
        vehicle_data: Dictionary containing vehicle information
        
    Returns:
        Dictionary containing:
        - vehicle_id: Generated unique ID for the vehicle record
        - status: "stored" to confirm successful storage
        
    Raises:
        ValueError: If user_id or required vehicle_data is missing
        ClientError: If DynamoDB operation fails
    """
    if not user_id:
        raise ValueError("User ID is required")
    
    if not vehicle_data:
        raise ValueError("Vehicle data is required")
    
    logger.info(f"💾 Storing vehicle record for user: {user_id}")
    
    try:
        vehicle_table = dynamodb.Table(VEHICLE_TABLE)
        
        # Create vehicle record
        vehicle_id = str(uuid.uuid4())
        vehicle_record = {
            'id': vehicle_id,
            'userId': user_id,
            'vin': vehicle_data.get('vin', ''),
            'make': vehicle_data.get('make', ''),
            'model': vehicle_data.get('model', ''),
            'year': vehicle_data.get('year', ''),
            'engine': vehicle_data.get('engine', ''),
            'createdAt': datetime.utcnow().isoformat(),
            'lastUsed': datetime.utcnow().isoformat(),
            'source': vehicle_data.get('source', 'manual'),
            'fullData': vehicle_data.get('full_data', {})
        }
        
        # Store in DynamoDB
        vehicle_table.put_item(Item=vehicle_record)
        
        logger.info(f"✅ Vehicle record stored with ID: {vehicle_id}")
        
        return {
            "vehicle_id": vehicle_id,
            "status": "stored"
        }
        
    except ClientError as e:
        logger.error(f"❌ DynamoDB error storing vehicle: {str(e)}")
        raise ClientError(f"Database storage failed: {str(e)}", e.operation_name)
    except Exception as e:
        logger.error(f"❌ Unexpected error storing vehicle: {str(e)}")
        raise Exception(f"Failed to store vehicle: {str(e)}")

@tool
def search_web(query: str, domains: Optional[List[str]] = None, max_results: int = 5) -> Dict[str, Any]:
    """
    Perform web search using Tavily API
    
    Args:
        query: Search query string
        domains: Optional list of specific domains to search
        max_results: Maximum number of results to return (default: 5)
        
    Returns:
        Dictionary containing:
        - results: List of search results with title, url, content
        - answer: AI-generated answer from search results
        - query: The original search query
        
    Raises:
        ValueError: If query is not provided or Tavily API key is missing
        requests.RequestException: If Tavily API call fails
    """
    if not query:
        raise ValueError("Search query is required")
    
    if not TAVILY_API_KEY:
        raise ValueError("Tavily API key not configured")
    
    logger.info(f"🔍 Web search query: {query}")
    
    try:
        # Prepare Tavily API request
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "include_answer": True,
            "include_raw_content": False,
            "max_results": max_results
        }
        
        if domains:
            payload["include_domains"] = domains
        
        # Make API call
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        
        results = data.get('results', [])
        answer = data.get('answer', '')
        
        logger.info(f"✅ Web search completed: {len(results)} results")
        
        return {
            "results": results,
            "answer": answer,
            "query": query
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Tavily API error: {str(e)}")
        raise requests.RequestException(f"Web search failed: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error in web search: {str(e)}")
        raise Exception(f"Search operation failed: {str(e)}")

@tool
def calculate_labor_estimates(repair_type: str, vehicle_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate labor estimates using multi-model consensus
    
    Args:
        repair_type: Type of repair (e.g., "brake pad replacement")
        vehicle_info: Dictionary containing vehicle details (make, model, year, etc.)
        
    Returns:
        Dictionary containing:
        - claude_estimate: Claude 3.5 Sonnet estimate
        - titan_estimate: Titan Express estimate  
        - web_validation: Web search validation results
        - timestamp: When estimates were generated
        
    Raises:
        ValueError: If repair_type or vehicle_info is missing
        Exception: If all estimation methods fail
    """
    if not repair_type:
        raise ValueError("Repair type is required")
    
    if not vehicle_info:
        raise ValueError("Vehicle information is required")
    
    logger.info(f"💰 Calculating labor estimates for: {repair_type}")
    logger.info(f"🚗 Vehicle: {vehicle_info.get('year')} {vehicle_info.get('make')} {vehicle_info.get('model')}")
    
    def call_claude_3_5():
        """Call Claude 3.5 Sonnet for labor time estimation"""
        try:
            claude_prompt = f"""
            You are an automotive labor time expert. Estimate labor TIME (hours) for this repair:
            
            Repair: {repair_type}
            Vehicle: {vehicle_info.get('year', 'Unknown')} {vehicle_info.get('make', 'Unknown')} {vehicle_info.get('model', 'Unknown')}
            
            Respond in this EXACT JSON format:
            {{
                "labor_hours_low": <number>,
                "labor_hours_high": <number>,
                "labor_hours_average": <number>,
                "reason_for_low": "<why minimum time>",
                "reason_for_high": "<why maximum time>",
                "reason_for_average": "<typical scenario>"
            }}
            
            Focus on TIME, not cost. Consider accessibility, complexity, potential issues.
            """
            
            response = bedrock_runtime.invoke_model(
                modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 800,
                    "messages": [{"role": "user", "content": claude_prompt}]
                })
            )
            
            result = json.loads(response['body'].read())
            content = result['content'][0]['text']
            
            try:
                estimate = json.loads(content)
                logger.info("✅ Claude 3.5 estimate completed")
                return estimate
            except json.JSONDecodeError:
                logger.warning("⚠️ Claude 3.5 JSON parsing failed")
                return {"parsing_error": True, "raw_response": content}
                
        except Exception as e:
            logger.error(f"❌ Claude 3.5 estimation failed: {str(e)}")
            return {"error": str(e)}
    
    def call_titan_express():
        """Call Amazon Titan Text Express for labor time estimation"""
        try:
            titan_prompt = f"""
            You are an automotive labor time expert. Estimate labor TIME (hours) for this repair:
            
            Repair: {repair_type}
            Vehicle: {vehicle_info.get('year', 'Unknown')} {vehicle_info.get('make', 'Unknown')} {vehicle_info.get('model', 'Unknown')}
            
            CRITICAL: Respond with ONLY valid JSON in this exact format:
            {{
                "labor_hours_low": 1.5,
                "labor_hours_high": 2.0,
                "labor_hours_average": 1.75,
                "reason_for_low": "Best case scenario explanation",
                "reason_for_high": "Worst case scenario explanation", 
                "reason_for_average": "Typical scenario explanation"
            }}
            
            Focus on labor TIME in hours only, not cost.
            """
            
            response = bedrock_runtime.invoke_model(
                modelId="amazon.titan-text-express-v1",
                body=json.dumps({
                    "inputText": titan_prompt,
                    "textGenerationConfig": {
                        "maxTokenCount": 800,
                        "temperature": 0.3
                    }
                })
            )
            
            result = json.loads(response['body'].read())
            content = result['results'][0]['outputText']
            
            try:
                estimate = json.loads(content)
                logger.info("✅ Titan Express estimate completed")
                return estimate
            except json.JSONDecodeError:
                logger.warning("⚠️ Titan Express JSON parsing failed")
                return {"parsing_error": True, "raw_response": content}
                
        except Exception as e:
            logger.error(f"❌ Titan Express estimation failed: {str(e)}")
            return {"error": str(e)}
    
    def call_web_search():
        """Call web search for labor time validation"""
        try:
            search_query = f"{repair_type} labor time hours {vehicle_info.get('make', '')} {vehicle_info.get('model', '')} {vehicle_info.get('year', '')} book time"
            
            # Use the search_web tool
            search_results = search_web(search_query, max_results=3)
            
            # Extract labor time information from results
            web_template = extract_labor_time_from_search(search_results)
            
            logger.info("✅ Web search validation completed")
            return web_template
                
        except Exception as e:
            logger.error(f"❌ Web search validation failed: {str(e)}")
            return {"error": str(e)}
    
    def extract_labor_time_from_search(search_results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract labor time template from web search results"""
        try:
            import re
            
            answer = search_results.get('answer', '')
            results = search_results.get('results', [])
            
            # Try to extract hours from search answer
            answer_lower = answer.lower()
            hour_patterns = [
                r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*hour',
                r'(\d+\.?\d*)\s*to\s*(\d+\.?\d*)\s*hour',
                r'(\d+\.?\d*)\s*hour'
            ]
            
            found_hours = []
            for pattern in hour_patterns:
                matches = re.findall(pattern, answer_lower)
                for match in matches:
                    if isinstance(match, tuple):
                        found_hours.extend([float(h) for h in match if h])
                    else:
                        found_hours.append(float(match))
            
            # Filter reasonable hours (0.5 to 8.0)
            valid_hours = [h for h in found_hours if 0.5 <= h <= 8.0]
            
            if len(valid_hours) >= 2:
                low = min(valid_hours)
                high = max(valid_hours)
                avg = round((low + high) / 2, 1)
                
                return {
                    "labor_hours_low": low,
                    "labor_hours_high": high,
                    "labor_hours_average": avg,
                    "reason_for_low": "Straightforward repair, no complications",
                    "reason_for_high": "Additional work or complications needed",
                    "reason_for_average": "Typical repair scenario",
                    "source": "web_validation",
                    "search_answer": answer
                }
            
            # Fallback: return search context
            return {
                "parsing_error": True,
                "search_answer": answer,
                "results_count": len(results),
                "source": "web_validation"
            }
            
        except Exception as e:
            return {"error": str(e), "source": "web_validation"}
    
    # Execute all three operations in parallel
    logger.info("🚀 Starting parallel execution of Claude 3.5, Titan Express, and Web Search")
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # Submit all tasks
            future_claude = executor.submit(call_claude_3_5)
            future_titan = executor.submit(call_titan_express)
            future_web = executor.submit(call_web_search)
            
            # Collect results
            claude_result = future_claude.result(timeout=30)
            titan_result = future_titan.result(timeout=30)
            web_result = future_web.result(timeout=30)
            
        logger.info("✅ All estimation models completed")
        
        return {
            "claude_estimate": claude_result,
            "titan_estimate": titan_result,
            "web_validation": web_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except concurrent.futures.TimeoutError:
        logger.error("❌ Labor estimation timed out")
        raise Exception("Labor estimation timed out after 30 seconds")
    except Exception as e:
        logger.error(f"❌ Labor estimation failed: {str(e)}")
        raise Exception(f"Failed to calculate labor estimates: {str(e)}")

@tool
def save_labor_estimate_record(
    user_id: str,
    conversation_id: str,
    repair_type: str,
    vehicle_info: Dict[str, Any],
    initial_estimate: Dict[str, Any],
    model_estimates: Dict[str, Any],
    final_estimate: Dict[str, Any],
    consensus_reasoning: str
) -> Dict[str, str]:
    """
    Save detailed labor estimate record to DynamoDB
    
    Args:
        user_id: User ID
        conversation_id: Conversation ID
        repair_type: Type of repair
        vehicle_info: Vehicle information
        initial_estimate: Agent's initial estimate
        model_estimates: All model estimates (Claude, Titan, Web)
        final_estimate: Final consensus estimate
        consensus_reasoning: Explanation of final decision
        
    Returns:
        Dictionary containing:
        - report_id: Generated unique ID for the report
        - status: "saved" to confirm successful storage
        
    Raises:
        ValueError: If required parameters are missing
        ClientError: If DynamoDB operation fails
    """
    if not user_id:
        raise ValueError("User ID is required")
    
    if not conversation_id:
        raise ValueError("Conversation ID is required")
    
    logger.info(f"💾 Saving labor estimate record for user: {user_id}")
    
    try:
        reports_table = dynamodb.Table(LABOR_ESTIMATE_REPORTS_TABLE)
        
        # Create report record
        report_id = str(uuid.uuid4())
        report_record = {
            'userId': user_id,
            'reportId': report_id,
            'conversationId': conversation_id,
            'repairType': repair_type,
            'vehicleInfo': vehicle_info,
            'initialEstimate': initial_estimate,
            'modelResults': model_estimates,
            'finalEstimate': final_estimate,
            'consensusReasoning': consensus_reasoning,
            'createdAt': datetime.utcnow().isoformat(),
            'version': 'v0.2'
        }
        
        # Store in DynamoDB
        reports_table.put_item(Item=report_record)
        
        logger.info(f"✅ Labor estimate record saved with ID: {report_id}")
        
        return {
            "report_id": report_id,
            "status": "saved"
        }
        
    except ClientError as e:
        logger.error(f"❌ DynamoDB error saving report: {str(e)}")
        raise ClientError(f"Report storage failed: {str(e)}", e.operation_name)
    except Exception as e:
        logger.error(f"❌ Unexpected error saving report: {str(e)}")
        raise Exception(f"Failed to save report: {str(e)}")

# Test functions for independent tool testing
def test_fetch_user_vehicles():
    """Test fetch_user_vehicles independently"""
    try:
        vehicles = fetch_user_vehicles("test-user-123")
        assert isinstance(vehicles, list)
        print("✅ fetch_user_vehicles test passed")
        return True
    except Exception as e:
        print(f"❌ fetch_user_vehicles test failed: {e}")
        return False

def test_extract_vin_from_image():
    """Test extract_vin_from_image independently"""
    try:
        # Test with invalid input
        try:
            extract_vin_from_image("")
            assert False, "Should have raised ValueError"
        except ValueError:
            pass  # Expected
        
        print("✅ extract_vin_from_image test passed")
        return True
    except Exception as e:
        print(f"❌ extract_vin_from_image test failed: {e}")
        return False

def test_lookup_vehicle_data():
    """Test lookup_vehicle_data independently"""
    try:
        # Test with invalid VIN
        try:
            lookup_vehicle_data("INVALID")
            assert False, "Should have raised ValueError"
        except ValueError:
            pass  # Expected
        
        print("✅ lookup_vehicle_data test passed")
        return True
    except Exception as e:
        print(f"❌ lookup_vehicle_data test failed: {e}")
        return False

def run_all_tool_tests():
    """Run all independent tool tests"""
    tests = [
        test_fetch_user_vehicles,
        test_extract_vin_from_image,
        test_lookup_vehicle_data
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    passed = sum(results)
    total = len(results)
    
    print(f"\n🧪 Tool Tests: {passed}/{total} passed")
    return passed == total

if __name__ == "__main__":
    run_all_tool_tests()
