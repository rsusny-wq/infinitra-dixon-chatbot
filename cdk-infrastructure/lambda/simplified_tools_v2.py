#!/usr/bin/env python3
"""
Dixon Smart Repair v0.2 - Simplified Tools
7 focused tools that handle only API calls and data operations
All decision-making is left to the Nova Pro agent
"""

import json
import logging
import os
import uuid
import time
import base64
import requests
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
def fetch_user_vehicles(agent) -> Dict[str, Any]:
    """
    Query DynamoDB for user's vehicles, return raw JSON
    Tool handles only the database query - agent decides what to do with results
    """
    try:
        tool_start_time = datetime.utcnow()
        logger.info(f"🕐 TIMING DEBUG: fetch_user_vehicles ENTRY at {tool_start_time.isoformat()}")
        
        user_id = agent.state.get("user_id")
        if not user_id:
            logger.info(f"🕐 TIMING DEBUG: fetch_user_vehicles EXIT (no user_id) at {datetime.utcnow().isoformat()}")
            return {
                "success": False,
                "error": "No user ID available",
                "data": None
            }
        
        logger.info(f"🚗 Fetching vehicles for user: {user_id}")
        
        vehicle_table = dynamodb.Table(VEHICLE_TABLE)
        
        # Query vehicles for this user
        response = vehicle_table.query(
            IndexName='UserVehiclesIndex',
            KeyConditionExpression='userId = :user_id',
            ExpressionAttributeValues={':user_id': user_id},
            ScanIndexForward=False,  # Latest first
            Limit=10  # Reasonable limit
        )
        
        vehicles = response.get('Items', [])
        
        logger.info(f"✅ Found {len(vehicles)} vehicles for user")
        
        logger.info(f"🕐 TIMING DEBUG: fetch_user_vehicles EXIT at {datetime.utcnow().isoformat()}")
        return {
            "success": True,
            "data": {
                "vehicles": vehicles,
                "count": len(vehicles),
                "user_id": user_id
            },
            "error": None
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching user vehicles: {str(e)}")
        return {
            "success": False,
            "error": f"Database error: {str(e)}",
            "data": None
        }

@tool
def extract_vin_from_image(agent) -> Dict[str, Any]:
    """
    Process image with Textract to extract VIN, return VIN + confidence
    Tool handles only the image processing - agent decides what to do with VIN
    """
    try:
        image_base64 = agent.state.get("current_image")
        if not image_base64:
            return {
                "success": False,
                "error": "No image available in agent state",
                "data": None
            }
        
        logger.info("🖼️ Processing image for VIN extraction")
        
        # Decode base64 image
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as decode_error:
            return {
                "success": False,
                "error": f"Invalid image format: {str(decode_error)}",
                "data": None
            }
        
        # Call Textract to extract text
        response = textract.detect_document_text(
            Document={'Bytes': image_bytes}
        )
        
        # Extract all text blocks
        extracted_text = []
        for block in response.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                extracted_text.append(block['Text'])
        
        # Look for VIN patterns (17 characters, alphanumeric, no I, O, Q)
        import re
        vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
        
        potential_vins = []
        for text in extracted_text:
            matches = re.findall(vin_pattern, text.upper())
            potential_vins.extend(matches)
        
        if potential_vins:
            # Return the first valid VIN found
            vin = potential_vins[0]
            confidence = 0.9 if len(potential_vins) == 1 else 0.7
            
            logger.info(f"✅ VIN extracted: {vin} (confidence: {confidence})")
            
            return {
                "success": True,
                "data": {
                    "vin": vin,
                    "confidence": confidence,
                    "all_potential_vins": potential_vins,
                    "extracted_text": extracted_text
                },
                "error": None
            }
        else:
            logger.info("❌ No VIN found in image")
            return {
                "success": False,
                "error": "No VIN pattern found in image",
                "data": {
                    "extracted_text": extracted_text,
                    "vin": None
                }
            }
            
    except Exception as e:
        logger.error(f"❌ Error extracting VIN from image: {str(e)}")
        return {
            "success": False,
            "error": f"Image processing error: {str(e)}",
            "data": None
        }

@tool
def lookup_vehicle_data(agent, vin: str) -> Dict[str, Any]:
    """
    Call NHTSA API to get vehicle specifications, return raw vehicle data
    Tool handles only the API call - agent decides how to use the data
    """
    try:
        if not vin or len(vin) != 17:
            return {
                "success": False,
                "error": "Invalid VIN format (must be 17 characters)",
                "data": None
            }
        
        logger.info(f"🔍 Looking up vehicle data for VIN: {vin}")
        
        # Call NHTSA VIN decoder API
        nhtsa_url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json"
        
        response = requests.get(nhtsa_url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('Results'):
            # Extract key vehicle information
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
                "success": True,
                "data": {
                    "vin": vin,
                    "make": make,
                    "model": model,
                    "year": year,
                    "engine": engine,
                    "full_data": vehicle_info,
                    "source": "NHTSA"
                },
                "error": None
            }
        else:
            return {
                "success": False,
                "error": "No vehicle data found for this VIN",
                "data": {"vin": vin}
            }
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ NHTSA API error: {str(e)}")
        return {
            "success": False,
            "error": f"Vehicle lookup service unavailable: {str(e)}",
            "data": {"vin": vin}
        }
    except Exception as e:
        logger.error(f"❌ Error looking up vehicle data: {str(e)}")
        return {
            "success": False,
            "error": f"Vehicle lookup error: {str(e)}",
            "data": {"vin": vin}
        }

@tool
def store_vehicle_record(agent, vehicle_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save vehicle to DynamoDB, return status
    Tool handles only the database operation - agent decides when to store
    """
    try:
        tool_start_time = datetime.utcnow()
        logger.info(f"🕐 TIMING DEBUG: store_vehicle_record ENTRY at {tool_start_time.isoformat()}")
        
        user_id = agent.state.get("user_id")
        if not user_id:
            logger.info(f"🕐 TIMING DEBUG: store_vehicle_record EXIT (no user_id) at {datetime.utcnow().isoformat()}")
            return {
                "success": False,
                "error": "No user ID available",
                "data": None
            }
        
        logger.info(f"💾 Storing vehicle record for user: {user_id}")
        
        vehicle_table = dynamodb.Table(VEHICLE_TABLE)
        
        # Create vehicle record
        vehicle_record = {
            'id': str(uuid.uuid4()),
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
        
        logger.info(f"✅ Vehicle record stored with ID: {vehicle_record['id']}")
        logger.info(f"🕐 TIMING DEBUG: store_vehicle_record EXIT at {datetime.utcnow().isoformat()}")
        
        return {
            "success": True,
            "data": {
                "vehicle_id": vehicle_record['id'],
                "stored_data": vehicle_record
            },
            "error": None
        }
        
    except Exception as e:
        logger.error(f"❌ Error storing vehicle record: {str(e)}")
        return {
            "success": False,
            "error": f"Database storage error: {str(e)}",
            "data": None
        }

@tool
def search_web(agent, query: str, domains: List[str] = None) -> Dict[str, Any]:
    """
    Call Tavily API for web search, return raw results
    Tool handles only the search API call - agent decides how to use results
    """
    try:
        if not TAVILY_API_KEY:
            return {
                "success": False,
                "error": "Web search service not configured",
                "data": None
            }
        
        logger.info(f"🔍 Web search query: {query}")
        
        # Prepare Tavily API request
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "include_answer": True,
            "include_raw_content": False,
            "max_results": 5
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
            "success": True,
            "data": {
                "query": query,
                "results": results,
                "answer": answer,
                "result_count": len(results)
            },
            "error": None
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Web search API error: {str(e)}")
        return {
            "success": False,
            "error": f"Web search service unavailable: {str(e)}",
            "data": {"query": query}
        }
    except Exception as e:
        logger.error(f"❌ Error performing web search: {str(e)}")
        return {
            "success": False,
            "error": f"Web search error: {str(e)}",
            "data": {"query": query}
        }

@tool
def calculate_labor_estimates(agent, repair_type: str, vehicle_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Multi-model labor estimation with Nova Pro + Claude 3.5 + Titan Express + web search
    Uses parallel processing to reduce total execution time
    Tool handles only the model calls and data collection - agent makes final decision
    """
    try:
        import concurrent.futures
        import threading
        
        tool_start_time = datetime.utcnow()
        logger.info(f"🕐 TIMING DEBUG: calculate_labor_estimates ENTRY at {tool_start_time.isoformat()}")
        logger.info(f"🔧 Calculating labor estimates for: {repair_type}")
        start_time = time.time()
        
        # Prepare context for models
        context = {
            "repair_type": repair_type,
            "vehicle": vehicle_info,
            "location": "United States",  # Could be made dynamic
            "timestamp": datetime.utcnow().isoformat()
        }
        
        results = {
            "context": context,
            "estimates": {},
            "web_validation": {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Define individual model functions for parallel execution
        def call_claude_3_5():
            """Call Claude 3.5 Sonnet for labor time estimation with template format"""
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
                
                claude_response = bedrock_runtime.invoke_model(
                    modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
                    body=json.dumps({
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 800,
                        "messages": [{"role": "user", "content": claude_prompt}]
                    })
                )
                
                claude_result = json.loads(claude_response['body'].read())
                claude_content = claude_result['content'][0]['text']
                
                try:
                    claude_estimate = json.loads(claude_content)
                    logger.info("✅ Claude 3.5 estimate completed")
                    logger.info(f"🔍 CLAUDE 3.5 TEMPLATE: {json.dumps(claude_estimate, indent=2)}")
                    return ("claude_3_5", claude_estimate)
                except:
                    logger.warning("⚠️ Claude 3.5 JSON parsing failed, using fallback")
                    return ("claude_3_5", {"parsing_error": True, "raw_response": claude_content})
                
            except Exception as e:
                logger.error(f"❌ Claude 3.5 estimation failed: {str(e)}")
                return ("claude_3_5", {"error": str(e)})
        
        def call_titan_express():
            """Call Amazon Titan Text Express for labor time estimation with template format"""
            try:
                titan_prompt = f"""
                You are an automotive labor time expert. Estimate labor TIME (hours) for this repair:
                
                Repair: {repair_type}
                Vehicle: {vehicle_info.get('year', 'Unknown')} {vehicle_info.get('make', 'Unknown')} {vehicle_info.get('model', 'Unknown')}
                
                CRITICAL: Respond with ONLY valid JSON in this exact format (no other text, no markdown, no explanations):
                {{
                    "labor_hours_low": 8.5,
                    "labor_hours_high": 14.0,
                    "labor_hours_average": 11.0,
                    "reason_for_low": "Best case scenario explanation",
                    "reason_for_high": "Worst case scenario explanation",
                    "reason_for_average": "Typical scenario explanation"
                }}
                
                Focus on labor TIME in hours only, not cost. Use realistic automotive repair times.
                """
                
                titan_response = bedrock_runtime.invoke_model(
                    modelId="amazon.titan-text-express-v1",
                    body=json.dumps({
                        "inputText": titan_prompt,
                        "textGenerationConfig": {
                            "maxTokenCount": 800,
                            "temperature": 0.3
                        }
                    })
                )
                
                titan_result = json.loads(titan_response['body'].read())
                titan_content = titan_result['results'][0]['outputText']
                
                try:
                    titan_estimate = json.loads(titan_content)
                    logger.info("✅ Titan Express estimate completed")
                    logger.info(f"🔍 TITAN EXPRESS TEMPLATE: {json.dumps(titan_estimate, indent=2)}")
                    return ("titan_express", titan_estimate)
                except Exception as parse_error:
                    logger.warning(f"⚠️ Titan Express JSON parsing failed: {str(parse_error)}")
                    logger.warning(f"🔍 TITAN RAW RESPONSE: {titan_content}")
                    return ("titan_express", {"parsing_error": True, "raw_response": titan_content})
                
            except Exception as e:
                logger.error(f"❌ Titan Express estimation failed: {str(e)}")
                return ("titan_express", {"error": str(e)})
        
        def call_web_search():
            """Call optimized web search for labor time validation"""
            try:
                search_query = f"{repair_type} labor time hours {vehicle_info.get('make', '')} {vehicle_info.get('model', '')} {vehicle_info.get('year', '')} book time"
                logger.info(f"🔍 Web search query: {search_query}")
                
                # Optimized Tavily call - reduced results, focus on answer
                url = "https://api.tavily.com/search"
                payload = {
                    "api_key": TAVILY_API_KEY,
                    "query": search_query,
                    "search_depth": "basic",
                    "include_answer": True,
                    "include_raw_content": False,
                    "max_results": 3  # Optimized: reduced from 5 to 3
                }
                
                response = requests.post(url, json=payload, timeout=10)  # Reduced timeout
                response.raise_for_status()
                data = response.json()
                
                # Extract template format from Tavily's answer
                web_template = extract_web_template(data.get('answer', ''), data.get('results', []))
                
                logger.info("✅ Web search validation completed")
                logger.info(f"🔍 WEB SEARCH TEMPLATE: {json.dumps(web_template, indent=2)}")
                return ("web_validation", web_template)
                    
            except Exception as e:
                logger.error(f"❌ Web search validation failed: {str(e)}")
                return ("web_validation", {"error": str(e)})
        
        def extract_web_template(answer: str, results: List[Dict]) -> Dict[str, Any]:
            """Extract labor time template from web search results"""
            try:
                import re
                
                # Try to extract hours from Tavily's AI answer first
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
                
                # Filter reasonable hours
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
                        "tavily_answer": answer
                    }
                
                # Fallback: return validation context
                return {
                    "parsing_error": True,
                    "tavily_answer": answer,
                    "results_count": len(results),
                    "source": "web_validation"
                }
                
            except Exception as e:
                return {"error": str(e), "source": "web_validation"}
        
        # Execute all three operations in parallel
        logger.info("🚀 Starting parallel execution of Claude 3.5, Titan Express, and Web Search")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # Submit all tasks
            future_claude = executor.submit(call_claude_3_5)
            future_titan = executor.submit(call_titan_express)
            future_web = executor.submit(call_web_search)
            
            # Collect results as they complete
            futures = [future_claude, future_titan, future_web]
            
            for future in concurrent.futures.as_completed(futures, timeout=60):
                try:
                    result_type, result_data = future.result()
                    if result_type in ["claude_3_5", "titan_express"]:
                        results["estimates"][result_type] = result_data
                    elif result_type == "web_validation":
                        results["web_validation"] = result_data
                except Exception as e:
                    logger.error(f"❌ Parallel execution error: {str(e)}")
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        logger.info(f"✅ Multi-model labor estimation completed in {execution_time:.2f} seconds")
        logger.info(f"🔍 COMPLETE RESULTS STRUCTURE: {json.dumps(results, indent=2, default=str)}")
        
        # Simple template aggregation instead of complex consensus
        logger.info(f"🧠 Starting simple template aggregation at {datetime.utcnow().isoformat()}")
        processed_data = aggregate_templates(agent, results, repair_type, vehicle_info)
        logger.info(f"🧠 Template aggregation completed at {datetime.utcnow().isoformat()}")
        
        tool_end_time = datetime.utcnow()
        tool_duration = (tool_end_time - tool_start_time).total_seconds()
        logger.info(f"🕐 TIMING DEBUG: calculate_labor_estimates EXIT at {tool_end_time.isoformat()}")
        logger.info(f"🕐 TIMING DEBUG: Total tool execution time: {tool_duration:.2f} seconds")
        logger.info(f"🕐 TIMING DEBUG: About to return results to agent at {datetime.utcnow().isoformat()}")
        
        return {
            "success": True,
            "data": processed_data,
            "error": None,
            "execution_time": execution_time
        }
        
    except Exception as e:
        logger.error(f"❌ Error calculating labor estimates: {str(e)}")
        return {
            "success": False,
            "error": f"Labor estimation error: {str(e)}",
            "data": None
        }

def aggregate_templates(agent, raw_results: Dict[str, Any], repair_type: str, vehicle_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Return clean model results for agent-driven consensus decision making
    No bias - just raw template data from each model for agent review
    """
    try:
        logger.info("🧠 Preparing clean model results for agent consensus decision")
        
        # Extract template data from models
        claude_data = raw_results.get("estimates", {}).get("claude_3_5", {})
        titan_data = raw_results.get("estimates", {}).get("titan_express", {})
        web_data = raw_results.get("web_validation", {})
        
        vehicle_desc = f"{vehicle_info.get('year', '')} {vehicle_info.get('make', '')} {vehicle_info.get('model', '')}".strip()
        
        # Prepare clean Claude estimate
        claude_estimate = {}
        if not claude_data.get("parsing_error") and not claude_data.get("error"):
            claude_estimate = {
                "low": claude_data.get("labor_hours_low", 0),
                "high": claude_data.get("labor_hours_high", 0),
                "average": claude_data.get("labor_hours_average", 0),
                "reasoning": claude_data.get("reason_for_average", "Standard repair process")
            }
        else:
            claude_estimate = {
                "parsing_error": True,
                "raw_response": claude_data.get("raw_response", "No response available")
            }
        
        # Prepare clean Titan estimate  
        titan_estimate = {}
        if not titan_data.get("parsing_error") and not titan_data.get("error"):
            titan_estimate = {
                "low": titan_data.get("labor_hours_low", 0),
                "high": titan_data.get("labor_hours_high", 0),
                "average": titan_data.get("labor_hours_average", 0),
                "reasoning": titan_data.get("reason_for_average", "Factory service time estimate")
            }
        else:
            titan_estimate = {
                "parsing_error": True,
                "raw_response": titan_data.get("raw_response", "No response available")
            }
        
        # Prepare clean Web validation
        web_validation = {}
        if not web_data.get("parsing_error") and not web_data.get("error"):
            web_validation = {
                "estimated_hours": web_data.get("labor_hours_average", 0),
                "source_info": web_data.get("tavily_answer", "Web search validation"),
                "results_count": web_data.get("results_count", 0)
            }
        else:
            web_validation = {
                "parsing_error": True,
                "source_info": web_data.get("tavily_answer", "No web validation available"),
                "results_count": web_data.get("results_count", 0)
            }
        
        logger.info(f"🧠 Returning clean model results for agent consensus decision")
        
        # Store results in agent state for cross-tool access
        agent.state.set("model_estimates", {
            "claude_estimate": claude_estimate,
            "titan_estimate": titan_estimate, 
            "web_validation": web_validation
        })
        
        agent.state.set("repair_context", {
            "repair_type": repair_type,
            "vehicle": vehicle_desc,
            "location": "United States",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        logger.info("💾 Model estimates stored in agent memory for consensus decision")
        
        # Return clean model results for agent consensus
        return {
            "success": True,
            "message": "Model estimates completed and stored in memory",
            
            "claude_estimate": claude_estimate,
            "titan_estimate": titan_estimate, 
            "web_validation": web_validation,
            
            "consensus_instructions": {
                "step1": "First, provide your own initial estimate based on the diagnostic conversation",
                "step2": "Review the estimates from Claude, Titan, and web search above", 
                "step3": "Make your final consensus decision with reasoning",
                "note": "You are not bound by any model's estimate - use your automotive expertise"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_labor_estimates: {str(e)}")
        return {
            "success": False,
            "message": f"Error getting labor estimates: {str(e)}"
        }

@tool
def save_labor_estimate_record(
    agent, 
    initial_low: float, 
    initial_high: float, 
    initial_average: float, 
    initial_reasoning: str,
    final_low: float, 
    final_high: float, 
    final_average: float, 
    consensus_reasoning: str
) -> Dict[str, Any]:
    """
    Save complete labor estimate report to DynamoDB with all estimates:
    - Agent's initial independent estimate
    - All model estimates (from agent state) 
    - Agent's final consensus decision
    """
    try:
        logger.info(f"🕐 TIMING DEBUG: save_labor_estimate_record ENTRY at {datetime.utcnow().isoformat()}")
        
        user_id = agent.state.get("user_id")
        conversation_id = agent.state.get("conversation_id")
        
        if not user_id:
            logger.error(f"🕐 TIMING DEBUG: No user_id found at {datetime.utcnow().isoformat()}")
            return {
                "success": False,
                "error": "No user ID available",
                "data": None
            }
        
        logger.info(f"💾 Saving labor estimate record for user: {user_id}")
        
        # Get model estimates from agent state (already working correctly)
        model_estimates = agent.state.get("model_estimates") or {}
        repair_context = agent.state.get("repair_context") or {}
        
        # Build complete estimate data
        estimate_data = {
            "estimates": model_estimates,
            "web_validation": model_estimates.get("web_validation", {}),
            "agent_initial_estimate": {
                "low": initial_low,
                "high": initial_high,
                "average": initial_average,
                "reasoning": initial_reasoning
            },
            "final_estimate": {
                "low": final_low,
                "high": final_high,
                "average": final_average,
                "reasoning": consensus_reasoning
            },
            "consensus_logic": consensus_reasoning,
            "context": repair_context
        }
        
        logger.info(f"🔍 COMPLETE ESTIMATE DATA: {json.dumps(estimate_data, indent=2, default=str)}")
        
        # Helper function to convert floats to Decimals recursively
        def convert_floats_to_decimals(obj):
            if isinstance(obj, dict):
                return {k: convert_floats_to_decimals(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_floats_to_decimals(item) for item in obj]
            elif isinstance(obj, float):
                return Decimal(str(obj))
            else:
                return obj
        
        # Convert all float values to Decimals for DynamoDB compatibility
        estimate_data_converted = convert_floats_to_decimals(estimate_data)
        logger.info(f"🕐 TIMING DEBUG: Decimal conversion completed at {datetime.utcnow().isoformat()}")
        
        # Generate unique report ID
        report_id = str(uuid.uuid4())
        
        # Prepare DynamoDB record
        record = {
            'reportId': report_id,
            'userId': user_id,
            'conversationId': conversation_id,
            'modelResults': estimate_data_converted.get('estimates', {}),
            'webSearchResults': estimate_data_converted.get('web_validation', {}),
            'agentInitialEstimate': estimate_data_converted.get('agent_initial_estimate', {}),
            'consensusLogic': consensus_reasoning,
            'finalEstimate': estimate_data_converted.get('final_estimate', {}),
            'vehicleInfo': estimate_data_converted.get('context', {}).get('vehicle', {}),
            'repairType': estimate_data_converted.get('context', {}).get('repair_type', ''),
            'createdAt': datetime.utcnow().isoformat(),
            'version': 'v0.2'
        }
        
        logger.info(f"🔍 DYNAMODB RECORD: {json.dumps(record, indent=2, default=str)}")
        
        # Save to DynamoDB
        reports_table = dynamodb.Table(LABOR_ESTIMATE_REPORTS_TABLE)
        
        logger.info(f"🕐 TIMING DEBUG: About to save to DynamoDB at {datetime.utcnow().isoformat()}")
        reports_table.put_item(Item=record)
        logger.info(f"🕐 TIMING DEBUG: DynamoDB save completed at {datetime.utcnow().isoformat()}")
        
        logger.info(f"✅ Labor estimate record saved successfully: {report_id}")
        
        return {
            "success": True,
            "message": "Labor estimate record saved successfully",
            "report_id": report_id,
            "data": estimate_data
        }
        
    except Exception as e:
        logger.error(f"❌ Error saving labor estimate record: {str(e)}")
        logger.error(f"🕐 TIMING DEBUG: Error occurred at {datetime.utcnow().isoformat()}")
        return {
            "success": False,
            "error": f"Failed to save labor estimate record: {str(e)}",
            "data": None
        }
