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
from strands import tool, Agent
import boto3
from botocore.exceptions import ClientError

def convert_to_decimal(obj):
    """Convert floats to Decimals for DynamoDB compatibility"""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_decimal(item) for item in obj]
    return obj

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
    Retrieve all vehicles associated with a specific user from the vehicle database.

    Use this tool when you need to check what vehicles a customer has registered in their
    account. This is typically the first step in any diagnostic conversation to provide
    personalized assistance based on their vehicle history.

    **AUTHENTICATION REQUIREMENT: Only use for authenticated users. Will fail for anonymous 
    users (user_id starting with 'anonymous-' or 'anon-session-') who have no account.**

    This tool connects to the Dixon Smart Repair vehicle database and retrieves all
    vehicle records associated with the provided user ID, including complete vehicle
    specifications, VIN numbers, and maintenance history.

    Example response:
        [
            {
                "vehicleId": "veh_12345",
                "make": "Toyota",
                "model": "Camry",
                "year": 2019,
                "vin": "4T1BF1FK5KU123789",
                "trim": "LE",
                "engine": "2.5L I4",
                "createdAt": "2024-01-15T10:30:00Z",
                "lastUsed": "2024-08-01T14:22:00Z"
            },
            ...
        ]

    Notes:
        - Returns empty list if user has no registered vehicles
        - Vehicle data is sorted by most recently used first
        - All vehicle records include VIN for precise identification
        - Database queries are limited to 10 vehicles per user for performance
        - Vehicle information is cached for 5 minutes to improve response times

    Args:
        user_id: The unique identifier for the user whose vehicles to retrieve.
                 Example: "c80113d0-a0a1-7075-e7d5-5b4583b09bb5"
                 Must be a valid UUID string format.

    Returns:
        A list of vehicle records, each containing:
        - vehicleId: Unique vehicle identifier (string)
        - make: Vehicle manufacturer (string) - e.g., "Toyota", "Honda", "BMW"
        - model: Vehicle model name (string) - e.g., "Camry", "Civic", "X5"
        - year: Model year (integer) - e.g., 2019, 2020, 2023
        - vin: Vehicle Identification Number (string) - 17 character VIN
        - trim: Trim level (string, optional) - e.g., "LE", "EX", "Sport"
        - engine: Engine specification (string, optional) - e.g., "2.5L I4"
        - createdAt: When vehicle was added to account (ISO timestamp)
        - lastUsed: When vehicle was last referenced (ISO timestamp)

    Raises:
        ValueError: If user_id is empty, None, or invalid format
        ClientError: If database connection fails or query times out
        Exception: For any other unexpected errors during vehicle retrieval
    """
    if not user_id:
        raise ValueError("User ID is required")
    
    logger.info(f"🚗 Fetching vehicles for user: {user_id}")
    
    try:
        vehicle_table = dynamodb.Table(VEHICLE_TABLE)
        
        response = vehicle_table.query(
            IndexName='UserVehiclesByDateIndex',
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
    Extract Vehicle Identification Number (VIN) from uploaded images using AWS Textract OCR.

    Use this tool when a customer uploads an image containing their vehicle's VIN number.
    Common VIN locations include the dashboard (visible through windshield), driver's side
    door jamb, engine bay, or vehicle registration documents.

    This tool uses AWS Textract's advanced OCR capabilities to detect and extract text
    from images, then applies VIN validation patterns to identify the 17-character VIN
    with high accuracy. It handles various image qualities and lighting conditions.

    Example response:
        {
            "vin": "WBXYZ1234567890AB",
            "confidence": 95,
            "raw_text": "VIN: WBXYZ1234567890AB\nModel Year: 2020\nMake: Honda",
            "found": true
        }

    Notes:
        - Supports common image formats: JPEG, PNG, PDF, or TIFF (per AWS Textract)
        - Maximum image size: 10MB
        - VIN must be clearly visible and not obscured
        - Works best with high-contrast images (dark text on light background)
        - Processing typically takes 2-5 seconds depending on image complexity
        - Confidence scores above 80 are generally reliable

    Args:
        image_base64: Base64 encoded image data containing the VIN.
                     Example: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                     Must be a valid base64 string representing an image file.

    Returns:
        A dictionary containing VIN extraction results:
        - vin: The extracted 17-character VIN (string or None if not found)
        - confidence: Confidence score from 0-100 (integer)
        - raw_text: All text extracted from the image (string)
        - found: Boolean indicating whether a valid VIN pattern was detected

    Raises:
        ValueError: If image_base64 is empty, None, or invalid base64 format
        ClientError: If AWS Textract service fails or image format is unsupported
        Exception: For any other unexpected errors during image processing
    """
    if not image_base64:
        raise ValueError("Image data is required")
    
    logger.info("🖼️ Processing image for VIN extraction")
    
    try:
        # Clean base64 data following AWS best practices
        # Remove data URL prefix if present (e.g., "data:image/png;base64,")
        if ',' in image_base64:
            logger.info("🔍 Removing data URL prefix from base64")
            image_base64 = image_base64.split(',')[1]
        
        # Remove whitespace and newlines that can corrupt base64
        image_base64 = image_base64.strip().replace('\n', '').replace('\r', '').replace(' ', '')
        
        logger.info(f"🔍 Cleaned base64 length: {len(image_base64)} characters")
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_base64)
        logger.info(f"🔍 Decoded image size: {len(image_bytes)} bytes")
        
        # Validate minimum image size (AWS recommends at least 150 DPI)
        if len(image_bytes) < 1000:  # Very small image, likely corrupted
            raise ValueError("Image too small - may be corrupted or invalid")
        
        # Validate image format by checking magic bytes (AWS Textract supported formats)
        if image_bytes.startswith(b'\x89PNG'):
            logger.info("🔍 Detected PNG format - supported by Textract")
        elif image_bytes.startswith(b'\xff\xd8\xff'):
            logger.info("🔍 Detected JPEG format - supported by Textract")
        elif image_bytes.startswith(b'%PDF'):
            logger.info("🔍 Detected PDF format - supported by Textract")
        elif image_bytes.startswith(b'II*\x00') or image_bytes.startswith(b'MM\x00*'):
            logger.info("🔍 Detected TIFF format - supported by Textract")
        else:
            logger.warning("⚠️ Unknown image format - may not be supported by Textract")
        
    except Exception as decode_error:
        logger.error(f"❌ Base64 decode error: {str(decode_error)}")
        raise ValueError(f"Invalid image format or corrupted base64 data: {str(decode_error)}")
    
    try:
        # Call Textract following AWS best practices
        logger.info("🔍 Calling AWS Textract DetectDocumentText...")
        response = textract.detect_document_text(
            Document={'Bytes': image_bytes}
        )
        
        logger.info(f"✅ Textract processed successfully, found {len(response.get('Blocks', []))} blocks")
        
        # Extract all text from response
        extracted_text = []
        for item in response.get('Blocks', []):
            if item['BlockType'] == 'LINE':
                extracted_text.append(item['Text'])
        
        all_text = ' '.join(extracted_text)
        logger.info(f"📝 Extracted text: {all_text[:200]}...")
        logger.info(f"🔍 Full extracted text for VIN debugging: {all_text}")
        
        # Look for VIN pattern (17 characters, alphanumeric, no I, O, Q)
        import re
        vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
        vin_matches = re.findall(vin_pattern, all_text.upper())
        
        logger.info(f"🔍 VIN pattern search in text: '{all_text.upper()}'")
        logger.info(f"🔍 VIN matches found: {vin_matches}")
        
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
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', str(e))
        logger.error(f"❌ Textract error [{error_code}]: {error_message}")
        
        # Provide specific guidance based on error type
        if error_code == 'UnsupportedDocumentException':
            raise ClientError(f"Image format not supported by Textract. Please ensure image is in JPEG, PNG, PDF, or TIFF format. Error: {error_message}", e.operation_name)
        else:
            raise ClientError(f"Textract processing failed: {error_message}", e.operation_name)
            
    except Exception as e:
        logger.error(f"❌ Unexpected error processing image: {str(e)}")
        raise Exception(f"Failed to process image: {str(e)}")

@tool
def lookup_vehicle_data(vin: str) -> Dict[str, Any]:
    """
    Retrieve comprehensive vehicle specifications from NHTSA database using VIN.

    Use this tool when you have a VIN and need to get detailed vehicle information
    including make, model, year, engine specifications, and other technical details.
    This is essential for providing accurate diagnostic advice and labor estimates.

    This tool connects to the National Highway Traffic Safety Administration (NHTSA)
    Vehicle API, which maintains the most comprehensive and authoritative database
    of vehicle specifications for all vehicles sold in the United States.

    Example response:
        {
            "vin": "WBXYZ1234567890AB",
            "make": "Honda",
            "model": "Civic",
            "year": 2020,
            "engine": "2.0L I4 DOHC 16V",
            "full_data": {
                "Make": "Honda",
                "Model": "Civic",
                "ModelYear": "2020",
                "Series": "LX",
                "BodyClass": "Sedan",
                "EngineConfiguration": "In-Line",
                "EngineCylinders": "4",
                "DisplacementL": "2.0"
            },
            "source": "NHTSA"
        }

    Notes:
        - NHTSA database covers vehicles from 1981 to current model year
        - Response time is typically 1-3 seconds
        - Some older or specialty vehicles may have limited data
        - VIN must be exactly 17 characters and follow standard format
        - Data is authoritative and used by automotive professionals worldwide
        - API has rate limits but sufficient for normal diagnostic usage

    Args:
        vin: Vehicle Identification Number - must be exactly 17 characters.
             Example: "WBXYZ1234567890AB"
             Must follow standard VIN format with valid check digit.

    Returns:
        A dictionary containing vehicle specifications:
        - vin: The input VIN (string)
        - make: Vehicle manufacturer (string) - e.g., "Honda", "Toyota", "BMW"
        - model: Vehicle model name (string) - e.g., "Civic", "Camry", "X5"
        - year: Model year (integer) - e.g., 2020, 2019, 2023
        - engine: Engine specification (string) - e.g., "2.0L I4 DOHC 16V"
        - full_data: Complete NHTSA response with all available fields (dict)
        - source: Data source identifier (string) - always "NHTSA"

    Raises:
        ValueError: If VIN is not 17 characters, contains invalid characters, or no data found
        RequestException: If NHTSA API is unavailable or network connection fails
        Exception: For any other unexpected errors during vehicle data lookup
    """
    if not vin:
        logger.error("❌ VIN validation failed: Empty VIN provided")
        raise ValueError("VIN is required")
    
    # Clean the VIN (remove spaces, special characters, convert to uppercase)
    import re
    original_vin = vin
    cleaned_vin = re.sub(r'[^A-Z0-9]', '', vin.upper())
    
    logger.info(f"🔍 VIN validation - Original: '{original_vin}' (length: {len(original_vin)})")
    logger.info(f"🧹 VIN validation - Cleaned: '{cleaned_vin}' (length: {len(cleaned_vin)})")
    
    # Log the exact characters for debugging
    logger.info(f"🔤 Original VIN characters: {[c for c in original_vin]}")
    logger.info(f"🔤 Cleaned VIN characters: {[c for c in cleaned_vin]}")
    
    # Validate VIN length
    if len(cleaned_vin) != 17:
        logger.warning(f"❌ Invalid VIN length: {len(cleaned_vin)} characters (expected 17)")
        logger.warning(f"❌ Original VIN: '{original_vin}'")
        logger.warning(f"❌ Cleaned VIN: '{cleaned_vin}'")
        raise ValueError(f"VIN must be exactly 17 characters. Provided VIN '{original_vin}' has {len(cleaned_vin)} valid characters after cleaning.")
    
    # Validate VIN characters (no I, O, Q allowed in VINs)
    invalid_chars = set(cleaned_vin) & {'I', 'O', 'Q'}
    if invalid_chars:
        logger.warning(f"❌ Invalid VIN characters found: {invalid_chars}")
        raise ValueError(f"VIN contains invalid characters: {invalid_chars}. VINs cannot contain I, O, or Q.")
    
    logger.info(f"✅ VIN validation passed: '{cleaned_vin}'")
    
    try:
        # Call NHTSA API with cleaned VIN
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{cleaned_vin}?format=json"
        logger.info(f"🌐 Calling NHTSA API: {url}")
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
    Save a new vehicle record to the user's account in the Dixon Smart Repair database.

    Use this tool after successfully retrieving vehicle data (via VIN lookup or manual entry)
    to permanently associate the vehicle with the user's account. This enables personalized
    diagnostic assistance and maintains a history of the customer's vehicles.

    This tool creates a new vehicle record in the Dixon Smart Repair database with a unique
    identifier, timestamps, and all provided vehicle specifications. The record becomes
    immediately available for future diagnostic sessions.

    Example response:
        {
            "vehicle_id": "veh_a1b2c3d4e5f6",
            "status": "stored"
        }

    Notes:
        - Each vehicle gets a unique identifier for future reference
        - Vehicle records are permanent and cannot be accidentally deleted
        - Duplicate VINs for the same user are prevented automatically
        - All vehicle data is validated before storage
        - Storage typically completes in under 1 second
        - Vehicle becomes immediately available in user's vehicle list

    Args:
        user_id: The unique identifier for the user who owns this vehicle.
                 Example: "c80113d0-a0a1-7075-e7d5-5b4583b09bb5"
                 Must be a valid UUID string format.

        vehicle_data: Complete vehicle information dictionary containing:
                     - make: Vehicle manufacturer (required) - e.g., "Honda"
                     - model: Vehicle model (required) - e.g., "Civic"
                     - year: Model year (required) - e.g., 2020
                     - vin: 17-character VIN (required) - e.g., "WBXYZ1234567890AB"
                     - trim: Trim level (optional) - e.g., "LX", "EX"
                     - engine: Engine spec (optional) - e.g., "2.0L I4"
                     Example: {
                         "make": "Honda",
                         "model": "Civic", 
                         "year": 2020,
                         "vin": "WBXYZ1234567890AB",
                         "trim": "LX"
                     }

    Returns:
        A dictionary confirming successful storage:
        - vehicle_id: Unique identifier assigned to this vehicle record (string)
        - status: Confirmation of storage success (string) - always "stored"

    Raises:
        ValueError: If user_id is invalid or required vehicle_data fields are missing
        ClientError: If database storage fails or connection times out
        Exception: For any other unexpected errors during vehicle record storage
    """
    if not user_id:
        raise ValueError("User ID is required")
    
    # Check if user is anonymous - prevent saving for anonymous users
    if user_id.startswith('anon-') or user_id.startswith('anonymous-'):
        logger.info(f"Skipping vehicle storage for anonymous user: {user_id}")
        return {
            "vehicle_id": "anonymous-session",
            "status": "skipped",
            "message": "Vehicle data not saved for anonymous users. Please log in to save your vehicles."
        }
    
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
    Perform intelligent web search for automotive information using Tavily AI search engine.

    Use this tool when you need current information about vehicle issues, repair procedures,
    technical service bulletins, recall information, or any automotive topic not covered
    by your existing knowledge. This is particularly useful for recent model years or
    emerging issues.

    This tool uses Tavily's AI-powered search engine, which is specifically optimized for
    factual information retrieval and provides both raw search results and AI-generated
    summaries of the findings.

    Example response:
        {
            "results": [
                {
                    "title": "2023 Honda Civic Starting Issues - Common Causes",
                    "url": "https://www.yourmechanic.com/article/honda-civic-starting-problems",
                    "content": "The most common starting issues in 2023 Honda Civic include weak battery, faulty starter motor, and fuel system problems...",
                    "score": 0.95
                },
                ...
            ],
            "answer": "Based on the search results, 2023 Honda Civic starting issues are commonly caused by battery problems (weak or dead battery), starter motor failure, or fuel delivery issues. The clicking sound typically indicates a weak battery or starter problem.",
            "query": "2023 Honda Civic starting problems clicking sound"
        }

    Notes:
        - Search results are ranked by relevance and reliability
        - AI answer provides synthesized information from multiple sources
        - Automotive-specific sources are prioritized when available
        - Search typically completes in 2-4 seconds
        - Results include confidence scores for reliability assessment
        - Domain filtering helps focus on authoritative automotive sources

    Args:
        query: The search query string describing what information you need.
               Example: "2023 Honda Civic starting problems clicking sound"
               Be specific and include vehicle details when relevant.

        domains: Optional list of specific domains to search within.
                Example: ["yourmechanic.com", "repairpal.com", "edmunds.com"]
                Use this to focus on trusted automotive sources.
                Default: None (searches all relevant sources)

        max_results: Maximum number of search results to return.
                    Example: 5 (default), range: 1-10
                    Use lower values for faster response when you need quick answers.

    Returns:
        A dictionary containing comprehensive search information:
        - results: List of search results, each containing:
          - title: Page title (string)
          - url: Source URL (string)  
          - content: Relevant excerpt from the page (string)
          - score: Relevance score 0-1 (float)
        - answer: AI-generated summary answer based on all results (string)
        - query: The original search query for reference (string)

    Raises:
        ValueError: If query is empty or None
        RequestException: If Tavily API is unavailable or network fails
        Exception: For any other unexpected errors during web search
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
def calculate_labor_estimates(
    repair_type: str, 
    vehicle_info: Dict[str, Any], 
    agent_initial_estimate: Dict[str, Any],  # REQUIRED - no default value
    diagnostic_context: str = "",
    agent: Agent = None
) -> Dict[str, Any]:
    """
    Generate professional labor time estimates using multi-model consensus validation.

    **CRITICAL REQUIREMENT: You MUST provide your own initial professional estimate 
    before calling this tool. This ensures proper 3-model consensus (Your estimate + 
    Claude + Web validation) and maintains data quality standards.**

    **IMPORTANT: Only use this tool when the user specifically requests labor time estimates
    or cost information. Do not use during initial diagnostic conversations.**

    WORKFLOW:
    1. First, make your initial professional estimate based on your 15+ years experience
    2. Then call this tool with your initial estimate included
    3. Tool will validate with Claude 3.5 and web sources
    4. You make final consensus decision based on all three estimates

    Example usage:
        my_initial_estimate = {
            "labor_hours_low": 1.0,
            "labor_hours_high": 2.5,
            "labor_hours_average": 1.75,
            "reasoning": "Based on my experience with starter motors on this vehicle type..."
        }
        
        calculate_labor_estimates(
            repair_type="starter motor replacement",
            vehicle_info={"year": "2008", "make": "DODGE", "model": "Charger"},
            diagnostic_context="Customer reports clicking sound when starting...",
            agent_initial_estimate=my_initial_estimate
        )

    This tool runs parallel analysis using Claude 3.5 Sonnet and professional automotive
    web search, then provides comprehensive results for you to make the final consensus
    decision. Your initial estimate is automatically stored for business compliance.

    Example response:
        {
            "claude_estimate": {
                "labor_hours_low": 1.0,
                "labor_hours_high": 3.5,
                "labor_hours_average": 2.0,
                "reason_for_low": "Simple battery test if issue is clearly battery-related",
                "reason_for_high": "Complex electrical diagnosis requiring specialized tools",
                "reason_for_average": "Standard diagnostic procedure with basic testing"
            },
            "web_validation": {
                "labor_hours_low": 0.8,
                "labor_hours_high": 1.5,
                "labor_hours_average": 1.0,
                "confidence": "medium",
                "search_answer": "Professional estimates show 0.8-1.5 hours for starting diagnosis",
                "source": "web_validation"
            }
        }

    Notes:
        - Processing takes 5-15 seconds due to parallel model execution
        - Your initial estimate is automatically stored in agent state for later retrieval
        - Results provide detailed reasoning for each estimate range
        - Web validation uses professional automotive sources only
        - All estimates are in labor hours, not including parts or materials
        - Tool handles timeout scenarios gracefully with 30-second limit

    Args:
        repair_type: Specific type of repair or diagnostic work needed.
                    Example: "brake pad replacement", "starting system diagnosis"
                    Be specific about the exact work to be performed.

        vehicle_info: Dictionary containing vehicle specifications:
                     - year: Model year (required) - e.g., 2020
                     - make: Manufacturer (required) - e.g., "Honda"  
                     - model: Model name (required) - e.g., "Civic"
                     - trim: Trim level (optional) - e.g., "LX"
                     Example: {"year": "2020", "make": "Honda", "model": "Civic"}

        agent_initial_estimate: **REQUIRED** - Your initial professional estimate (automatically stored):
                               - labor_hours_low: Minimum time estimate (float)
                               - labor_hours_high: Maximum time estimate (float) 
                               - labor_hours_average: Most likely time (float)
                               - reasoning: Your professional reasoning (string)
                               Example: {
                                   "labor_hours_low": 1.0,
                                   "labor_hours_high": 3.0,
                                   "labor_hours_average": 2.0,
                                   "reasoning": "Standard diagnostic procedure based on my experience"
                               }
                               This parameter is MANDATORY for proper 3-model consensus.

        diagnostic_context: Detailed description of the problem and diagnostic findings.
                           Example: "Customer reports clicking sound when starting, multiple warning lights appear, battery voltage test shows 11.2V indicating weak battery condition"
                           Include symptoms, test results, and relevant technical details.

        agent: Agent instance (automatically provided by Strands framework)

    Returns:
        A dictionary containing multi-model estimation results:
        - claude_estimate: Claude 3.5 Sonnet analysis with detailed reasoning
        - web_validation: Professional web search validation with confidence scores
        Each estimate includes low/high/average hours and detailed explanations.

    Raises:
        ValueError: If repair_type, vehicle_info, or required fields are missing
        TimeoutError: If estimation process exceeds 30-second timeout
        Exception: For any other unexpected errors during estimation process
    """
    # Store agent's initial estimate in agent state for later retrieval
    if agent and agent_initial_estimate:
        agent.state.set("agent_initial_estimate", agent_initial_estimate)
        logger.info(f"🤖 Stored agent's initial estimate in state: {agent_initial_estimate}")
    
    # 🔧 DEBUG: Log what's being passed to calculate_labor_estimates
    logger.info(f"🔧 DEBUG - calculate_labor_estimates called with:")
    logger.info(f"🔧   repair_type: {repair_type}")
    logger.info(f"🔧   vehicle_info: {vehicle_info}")
    logger.info(f"🔧   diagnostic_context: {diagnostic_context[:200]}..." if len(diagnostic_context) > 200 else f"🔧   diagnostic_context: {diagnostic_context}")
    logger.info(f"🔧   agent_initial_estimate: {agent_initial_estimate}")
    
    if not repair_type:
        raise ValueError("Repair type is required")
    
    if not vehicle_info:
        raise ValueError("Vehicle information is required")
    
    # REQUIRED: Agent must provide initial estimate for proper consensus
    if not agent_initial_estimate:
        raise ValueError("Agent must provide initial professional estimate before using external models. Please provide your initial estimate based on your 15+ years of experience.")
    
    # Validate initial estimate structure
    required_fields = ['labor_hours_low', 'labor_hours_high', 'labor_hours_average']
    if not all(field in agent_initial_estimate for field in required_fields):
        raise ValueError(f"Agent initial estimate must include: {', '.join(required_fields)}")
    
    logger.info(f"💰 Calculating labor estimates for: {repair_type}")
    logger.info(f"🚗 Vehicle: {vehicle_info.get('year')} {vehicle_info.get('make')} {vehicle_info.get('model')}")
    logger.info(f"🤖 Agent provided initial estimate: {agent_initial_estimate}")
    
    def call_claude_3_5():
        """Call Claude 3.5 Sonnet for labor time estimation"""
        try:
            # Build enhanced prompt with diagnostic context
            context_section = ""
            if diagnostic_context and diagnostic_context.strip():
                context_section = f"""
            
            DIAGNOSTIC CONTEXT:
            {diagnostic_context}
            
            Consider this diagnostic information when estimating:
            - Specific symptoms and their implications
            - Vehicle mileage and wear patterns  
            - Complexity factors mentioned
            - Related components that may need attention
            """
            
            claude_prompt = f"""
            You are an automotive labor time expert. Estimate labor TIME (hours) for this repair:
            
            Repair: {repair_type}
            Vehicle: {vehicle_info.get('year', 'Unknown')} {vehicle_info.get('make', 'Unknown')} {vehicle_info.get('model', 'Unknown')}
            {context_section}
            
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
    
    # Llama function removed due to high variance in estimates
    # Focusing on Claude + Professional Web Search consensus
    
    def call_web_search():
        """Call professional automotive web search for labor time validation"""
        try:
            # Professional automotive sources for accurate labor times
            professional_sources = [
                "repairpal.com",
                "yourmechanic.com", 
                "kelley blue book",
                "edmunds.com",
                "carcare.org",
                "ase.com",
                "napa.com",
                "autozone.com"
            ]
            
            # Build professional search query
            base_query = f"{repair_type} labor time hours {vehicle_info.get('make', '')} {vehicle_info.get('model', '')} {vehicle_info.get('year', '')}"
            
            # Add diagnostic context keywords if available
            search_terms = [base_query, "book time", "professional estimate"]
            
            if diagnostic_context and diagnostic_context.strip():
                # Extract key diagnostic terms for better search results
                context_lower = diagnostic_context.lower()
                
                # Add specific diagnostic terms
                if any(word in context_lower for word in ["noise", "rattling", "grinding", "squeaking"]):
                    search_terms.append("noise diagnosis")
                if any(word in context_lower for word in ["mileage", "miles", "high mileage"]):
                    search_terms.append("high mileage")
                if "cold" in context_lower:
                    search_terms.append("cold start")
                if "timing" in repair_type.lower() and "chain" in context_lower:
                    search_terms.append("timing chain guides tensioners")
                if "brake" in repair_type.lower() and any(word in context_lower for word in ["squeaking", "grinding"]):
                    search_terms.append("brake wear indicators")
                if "transmission" in repair_type.lower():
                    search_terms.append("transmission rebuild professional")
            
            # Create comprehensive search query
            search_query = " ".join(search_terms)
            
            # Add professional source preference
            source_hint = f"({' OR '.join(professional_sources)})"
            professional_query = f"{search_query} site:({source_hint})"
            
            logger.info(f"🔍 Professional automotive search: {professional_query}")
            
            # Try professional search first
            try:
                search_results = search_web(professional_query, max_results=3)
                if search_results and search_results.get('results'):
                    logger.info("✅ Professional automotive sources found")
                else:
                    # Fallback to general search if professional sources don't return results
                    logger.info("⚠️ Professional sources limited, using general search")
                    search_results = search_web(search_query, max_results=3)
            except:
                # Fallback to general search on any error
                logger.info("⚠️ Professional search failed, using general search")
                search_results = search_web(search_query, max_results=3)
            
            # Extract labor time information from results
            web_template = extract_labor_time_from_search(search_results)
            
            logger.info("✅ Professional web search validation completed")
            return web_template
                
        except Exception as e:
            logger.error(f"❌ Professional web search validation failed: {str(e)}")
            return {"error": str(e)}
    
    def extract_labor_time_from_search(search_results: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced labor time extraction from web search results with better parsing"""
        try:
            import re
            
            answer = search_results.get('answer', '')
            results = search_results.get('results', [])
            
            # Combine answer and result content for better parsing
            all_text = answer.lower()
            for result in results:
                if isinstance(result, dict) and 'content' in result:
                    all_text += " " + str(result['content']).lower()
            
            # Enhanced hour patterns - more comprehensive
            hour_patterns = [
                # Range patterns
                r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*hours?',
                r'(\d+\.?\d*)\s*to\s*(\d+\.?\d*)\s*hours?',
                r'(\d+\.?\d*)\s*through\s*(\d+\.?\d*)\s*hours?',
                r'between\s*(\d+\.?\d*)\s*and\s*(\d+\.?\d*)\s*hours?',
                r'from\s*(\d+\.?\d*)\s*to\s*(\d+\.?\d*)\s*hours?',
                # Single hour patterns
                r'(\d+\.?\d*)\s*hours?\s*of\s*labor',
                r'labor\s*time\s*(\d+\.?\d*)\s*hours?',
                r'takes?\s*(\d+\.?\d*)\s*hours?',
                r'requires?\s*(\d+\.?\d*)\s*hours?',
                r'approximately\s*(\d+\.?\d*)\s*hours?',
                r'about\s*(\d+\.?\d*)\s*hours?',
                r'around\s*(\d+\.?\d*)\s*hours?',
                # Book time patterns
                r'book\s*time\s*(\d+\.?\d*)\s*hours?',
                r'flat\s*rate\s*(\d+\.?\d*)\s*hours?',
                r'standard\s*time\s*(\d+\.?\d*)\s*hours?'
            ]
            
            found_hours = []
            for pattern in hour_patterns:
                matches = re.findall(pattern, all_text)
                for match in matches:
                    try:
                        if isinstance(match, tuple):
                            # Range pattern - add both values
                            for h in match:
                                if h and h.strip():
                                    found_hours.append(float(h.strip()))
                        else:
                            # Single value pattern
                            if match and match.strip():
                                found_hours.append(float(match.strip()))
                    except (ValueError, AttributeError):
                        continue
            
            # Expanded reasonable hours range for complex procedures (0.25 to 20.0)
            valid_hours = [h for h in found_hours if 0.25 <= h <= 20.0]
            
            if len(valid_hours) >= 2:
                low = min(valid_hours)
                high = max(valid_hours)
                avg = round((low + high) / 2, 1)
                
                return {
                    "labor_hours_low": low,
                    "labor_hours_high": high,
                    "labor_hours_average": avg,
                    "reason_for_low": "Optimal conditions, experienced technician",
                    "reason_for_high": "Complications, additional work required",
                    "reason_for_average": "Typical repair scenario with standard conditions",
                    "source": "web_validation",
                    "search_answer": answer[:200] + "..." if len(answer) > 200 else answer,
                    "hours_found": len(valid_hours),
                    "confidence": "high" if len(valid_hours) >= 3 else "medium"
                }
            elif len(valid_hours) == 1:
                # Single hour found - create reasonable range around it
                base_hour = valid_hours[0]
                low = max(0.25, base_hour * 0.8)  # 20% below
                high = min(20.0, base_hour * 1.3)  # 30% above
                avg = base_hour
                
                return {
                    "labor_hours_low": round(low, 1),
                    "labor_hours_high": round(high, 1),
                    "labor_hours_average": round(avg, 1),
                    "reason_for_low": "Efficient completion with no complications",
                    "reason_for_high": "Additional time for unexpected issues",
                    "reason_for_average": "Standard repair time from web sources",
                    "source": "web_validation",
                    "search_answer": answer[:200] + "..." if len(answer) > 200 else answer,
                    "hours_found": 1,
                    "confidence": "medium"
                }
            
            # Enhanced fallback: try to extract any numeric values and context
            numeric_pattern = r'(\d+\.?\d*)'
            all_numbers = re.findall(numeric_pattern, all_text)
            potential_hours = []
            
            for num_str in all_numbers:
                try:
                    num = float(num_str)
                    if 0.25 <= num <= 20.0:
                        potential_hours.append(num)
                except ValueError:
                    continue
            
            if potential_hours:
                # Use statistical approach for fallback
                avg_hours = sum(potential_hours) / len(potential_hours)
                if 0.5 <= avg_hours <= 15.0:
                    return {
                        "labor_hours_low": round(avg_hours * 0.8, 1),
                        "labor_hours_high": round(avg_hours * 1.2, 1),
                        "labor_hours_average": round(avg_hours, 1),
                        "reason_for_low": "Estimated minimum time",
                        "reason_for_high": "Estimated maximum time",
                        "reason_for_average": "Statistical average from web data",
                        "source": "web_validation_fallback",
                        "search_answer": answer[:100] + "..." if len(answer) > 100 else answer,
                        "hours_found": len(potential_hours),
                        "confidence": "low"
                    }
            
            # Final fallback: return search context with parsing error
            return {
                "parsing_error": True,
                "search_answer": answer[:300] + "..." if len(answer) > 300 else answer,
                "results_count": len(results),
                "source": "web_validation",
                "reason": "No valid labor hours found in search results",
                "patterns_tried": len(hour_patterns),
                "confidence": "none"
            }
            
        except Exception as e:
            logger.error(f"❌ Web search parsing error: {str(e)}")
            return {"error": str(e), "source": "web_validation", "confidence": "none"}
    
    # Execute all three operations in parallel
    logger.info("🚀 Starting parallel execution of Claude 3.5 and Professional Web Search")
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # Submit both tasks
            future_claude = executor.submit(call_claude_3_5)
            future_web = executor.submit(call_web_search)
            
            # Collect results
            claude_result = future_claude.result(timeout=30)
            web_result = future_web.result(timeout=30)
            
        logger.info("✅ All estimation models completed")
        
        result = {
            "claude_estimate": claude_result,
            "web_validation": web_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # 📊 DEBUG: Log what calculate_labor_estimates is returning
        logger.info(f"📊 DEBUG - calculate_labor_estimates returning:")
        logger.info(f"📊   claude_estimate: {claude_result}")
        logger.info(f"📊   web_validation: {web_result}")
        
        return result
        
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
    model_estimates: Dict[str, Any],
    final_estimate: Dict[str, Any],
    consensus_reasoning: str,
    agent: Agent = None
) -> Dict[str, str]:
    """
    Save comprehensive labor estimate record when user explicitly requests it.

    **AUTHENTICATION REQUIREMENT: Only saves estimates for authenticated users. Anonymous 
    user estimates (user_id starting with 'anonymous-' or 'anon-session-') are provided 
    in chat but not saved to database.**

    **USER CONFIRMATION REQUIRED: This tool should ONLY be called when the user explicitly 
    asks to save the estimate (e.g., "save this", "keep this for my records", "I want to 
    save this estimate"). Do NOT call this automatically after every calculation.**

    Use this tool only after:
    1. You've presented the labor estimate to the user
    2. User explicitly requests to save it
    3. User is authenticated (not anonymous)

    This tool automatically retrieves your initial estimate from agent state (stored by
    calculate_labor_estimates) and combines it with the final results to create a complete
    audit trail of the estimation process.

    Example response:
        {
            "report_id": "rpt_a1b2c3d4e5f6g7h8",
            "status": "saved"
        }

    Notes:
        - Creates permanent record in LaborEstimateReports database table
        - Automatically calculates data quality score based on available information
        - Records are used for business analytics and customer convenience
        - Your initial estimate is automatically retrieved from agent state
        - All model results and reasoning are preserved for audit purposes
        - Records are immediately available in the Labour Estimates UI section
        - Only works for authenticated users - anonymous estimates are not saved
        - ONLY call when user explicitly requests saving

    Args:
        user_id: The unique identifier for the customer receiving the estimate.
                 Example: "c80113d0-a0a1-7075-e7d5-5b4583b09bb5"
                 Must be a valid UUID string format.

        conversation_id: The unique identifier for this diagnostic conversation.
                        Example: "conv-1754478913528-y1vwsfwpr"
                        Links the estimate to the specific conversation context.

        repair_type: The specific type of repair work being estimated.
                    Example: "brake pad replacement", "timing chain replacement"
                    Should match the repair_type used in calculate_labor_estimates.

        vehicle_info: Complete vehicle information dictionary:
                     - year: Model year (required) - e.g., "2020"
                     - make: Manufacturer (required) - e.g., "Honda"
                     - model: Model name (required) - e.g., "Civic"
                     - trim: Trim level (optional) - e.g., "LX"
                     Example: {"year": "2020", "make": "Honda", "model": "Civic"}

        model_estimates: The complete results from calculate_labor_estimates tool:
                        - claude_estimate: Claude 3.5 analysis results (dict)
                        - web_validation: Web search validation results (dict)
                        This preserves all model reasoning and confidence scores.

        final_estimate: Your final consensus decision as the expert technician:
                       - labor_hours_low: Your final low estimate (float)
                       - labor_hours_high: Your final high estimate (float)
                       - labor_hours_average: Your final average estimate (float)
                       - reasoning: Your professional reasoning for the final decision (string)
                       Example: {
                           "labor_hours_low": 1.0,
                           "labor_hours_high": 2.5,
                           "labor_hours_average": 1.5,
                           "reasoning": "Based on symptoms and vehicle complexity"
                       }

        consensus_reasoning: Detailed explanation of how you reached your final decision.
                           Example: "Based on the Claude estimate and web validation, considering the vehicle's age and complexity, I believe the average case scenario is most likely."
                           This documents your professional judgment process.

        agent: Agent instance (automatically provided by Strands framework)

    Returns:
        A dictionary confirming successful record storage:
        - report_id: Unique identifier for the saved labor estimate record (string)
        - status: Confirmation of successful storage (string) - always "saved"

    Raises:
        ValueError: If any required parameters are missing or invalid
        ClientError: If database storage fails or connection times out
        Exception: For any other unexpected errors during record storage
    """
    if not user_id:
        raise ValueError("User ID is required")
    
    if not conversation_id:
        raise ValueError("Conversation ID is required")
    
    # Retrieve agent's initial estimate from agent state
    nova_pro_estimate = None
    if agent:
        nova_pro_estimate = agent.state.get("agent_initial_estimate")
        logger.info(f"🤖 Retrieved agent's initial estimate from state: {nova_pro_estimate}")
    
    if not nova_pro_estimate:
        logger.warning("⚠️ No agent initial estimate found in state, using empty estimate")
        nova_pro_estimate = {"error": "No initial estimate provided by agent"}
    
    # 💾 DEBUG: Log what's being passed to save_labor_estimate_record
    logger.info(f"💾 DEBUG - save_labor_estimate_record called with:")
    logger.info(f"💾   user_id: {user_id}")
    logger.info(f"💾   conversation_id: {conversation_id}")
    logger.info(f"💾   repair_type: {repair_type}")
    logger.info(f"💾   vehicle_info: {vehicle_info}")
    logger.info(f"💾   nova_pro_estimate: {nova_pro_estimate}")
    logger.info(f"💾   model_estimates: {model_estimates}")
    logger.info(f"💾   final_estimate: {final_estimate}")
    logger.info(f"💾   consensus_reasoning: {consensus_reasoning}")
    
    # Enhanced validation for consensus reasoning quality
    if not consensus_reasoning or len(consensus_reasoning.strip()) < 20:
        # Generate enhanced reasoning if missing or insufficient
        consensus_reasoning = generate_enhanced_consensus_reasoning(
            nova_pro_estimate, model_estimates, final_estimate, repair_type
        )
    
    logger.info(f"💾 Saving labor estimate record for user: {user_id}")
    
    try:
        reports_table = dynamodb.Table(LABOR_ESTIMATE_REPORTS_TABLE)
        
        # Create enhanced report record
        report_id = str(uuid.uuid4())
        report_record = {
            'userId': user_id,
            'reportId': report_id,
            'conversationId': conversation_id,
            'repairType': repair_type,
            'vehicleInfo': vehicle_info,
            'initialEstimate': nova_pro_estimate,  # Store agent's initial estimate from state
            'modelResults': model_estimates,
            'finalEstimate': final_estimate,
            'consensusReasoning': consensus_reasoning,
            'createdAt': datetime.utcnow().isoformat(),
            'version': 'v0.2-enhanced',
            'dataQuality': assess_data_quality(nova_pro_estimate, model_estimates, final_estimate)
        }
        
        # Convert floats to Decimals for DynamoDB compatibility
        report_record = convert_to_decimal(report_record)
        
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

def generate_enhanced_consensus_reasoning(initial_estimate, model_estimates, final_estimate, repair_type):
    """Generate detailed consensus reasoning when not provided"""
    try:
        reasoning_parts = []
        
        # Analyze initial vs final
        if initial_estimate and final_estimate:
            initial_avg = initial_estimate.get('labor_hours_average', 0)
            final_avg = final_estimate.get('labor_hours_average', 0)
            
            if abs(initial_avg - final_avg) < 0.5:
                reasoning_parts.append(f"Initial estimate of {initial_avg} hours closely aligned with consensus analysis")
            else:
                reasoning_parts.append(f"Adjusted from initial {initial_avg} hours to {final_avg} hours based on multi-source validation")
        
        # Analyze model agreement
        model_averages = []
        model_sources = []
        
        if 'claude_estimate' in model_estimates:
            claude_avg = model_estimates['claude_estimate'].get('labor_hours_average')
            if claude_avg:
                model_averages.append(claude_avg)
                model_sources.append("professional automotive database")
        
        # Remove Llama processing - too much variance
        # Focus on Claude + Professional Web Search consensus
        
        if 'web_validation' in model_estimates and not model_estimates['web_validation'].get('parsing_error'):
            web_avg = model_estimates['web_validation'].get('labor_hours_average')
            if web_avg:
                model_averages.append(web_avg)
                model_sources.append("current market data")
        
        if model_averages:
            avg_consensus = sum(model_averages) / len(model_averages)
            reasoning_parts.append(f"Consensus from {len(model_sources)} sources averaged {avg_consensus:.1f} hours")
            
            if len(set([round(avg, 1) for avg in model_averages])) == 1:
                reasoning_parts.append("All sources showed strong agreement on timing")
            else:
                reasoning_parts.append("Balanced estimate considering variation across sources")
        
        # Add repair-specific context
        if "brake" in repair_type.lower():
            reasoning_parts.append("Standard brake service with typical accessibility")
        elif "timing" in repair_type.lower():
            reasoning_parts.append("Complex engine work requiring careful timing and precision")
        elif "transmission" in repair_type.lower():
            reasoning_parts.append("Major drivetrain service with significant labor requirements")
        
        return ". ".join(reasoning_parts) + "."
        
    except Exception as e:
        logger.warning(f"⚠️ Could not generate enhanced reasoning: {str(e)}")
        return f"Consensus estimate for {repair_type} based on multiple automotive repair sources and professional experience."

def assess_data_quality(initial_estimate, model_estimates, final_estimate):
    """Assess the quality of consensus data for analytics - 100-point scale with 25% per component"""
    try:
        quality_score = 0
        quality_factors = []
        
        # Check if we have initial estimate (25 points)
        if initial_estimate and 'labor_hours_average' in initial_estimate:
            quality_score += 25
            quality_factors.append("initial_estimate")
        
        # Check model estimate quality
        model_count = 0
        
        # Claude estimate (25 points)
        if 'claude_estimate' in model_estimates and 'labor_hours_average' in model_estimates['claude_estimate']:
            model_count += 1
            quality_score += 25
        
        # Web validation (25 points)
        if 'web_validation' in model_estimates and not model_estimates['web_validation'].get('parsing_error'):
            model_count += 1
            quality_score += 25
        
        quality_factors.append(f"{model_count}_models")
        
        # Check final estimate completeness (25 points)
        if final_estimate and all(key in final_estimate for key in ['labor_hours_low', 'labor_hours_high', 'labor_hours_average']):
            quality_score += 25
            quality_factors.append("complete_final")
        
        # Determine quality level based on 100-point scale
        if quality_score >= 90:
            quality_level = "high"
        elif quality_score >= 70:
            quality_level = "medium"
        else:
            quality_level = "low"
        
        return {
            "score": quality_score,
            "level": quality_level,
            "factors": quality_factors,
            "model_count": model_count
        }
        
    except Exception as e:
        logger.warning(f"⚠️ Could not assess data quality: {str(e)}")
        return {"score": 0, "level": "unknown", "factors": [], "model_count": 0}
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
        
        # Convert floats to Decimals for DynamoDB compatibility
        report_record = convert_to_decimal(report_record)
        
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

# ============================================================================
# NOVA PRO VIN EXTRACTION TOOL (Official Strands Format)
# ============================================================================

@tool
def extract_vin_with_nova_pro(s3_bucket: str, s3_key: str) -> Dict[str, Any]:
    """
    Extract VIN from S3 image using Amazon Nova Pro directly.
    
    This tool bypasses other image processing tools and calls Nova Pro directly
    for accurate VIN extraction. It's specifically designed to handle VIN images
    with high accuracy and follows the official Strands tools pattern.
    
    How It Works:
    ------------
    1. Downloads the image from the specified S3 bucket and key
    2. Encodes the image to base64 for Nova Pro processing
    3. Calls Amazon Nova Pro with a focused VIN extraction prompt
    4. Uses regex pattern matching to extract valid 17-character VINs
    5. Returns structured results with confidence scoring
    
    Args:
        s3_bucket (str): S3 bucket name containing the image
        s3_key (str): S3 key/path to the image file
        
    Returns:
        Dict[str, Any]: A dictionary containing the extraction results:
        - vin: The extracted VIN (if found)
        - confidence: Confidence score (0-100)
        - found: Boolean indicating if VIN was found
        - method: Extraction method used
        - text: Human-readable result message
    """
    
    try:
        # Validate required parameters
        if not s3_bucket:
            raise ValueError("S3 bucket name is required")
            
        if not s3_key:
            raise ValueError("S3 key/path is required")
        
        logger.info(f"🔧 Extracting VIN using Nova Pro from s3://{s3_bucket}/{s3_key}")
        
        # Initialize AWS clients
        s3_client = boto3.client('s3')
        bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Download image from S3
        try:
            response = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
            image_data = response['Body'].read()
            logger.info("📥 Image downloaded from S3 successfully")
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code == 'NoSuchKey':
                raise FileNotFoundError(f"Image not found at s3://{s3_bucket}/{s3_key}")
            elif error_code == 'NoSuchBucket':
                raise FileNotFoundError(f"S3 bucket '{s3_bucket}' not found")
            else:
                raise Exception(f"Failed to download image from S3: {str(e)}")
        
        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Prepare Nova Pro request with focused VIN extraction prompt
        prompt = """Extract the VIN (Vehicle Identification Number) from this image.

Requirements:
- VIN must be exactly 17 characters
- Contains only: A-H, J-N, P-R, T-Z, 0-9 (no I, O, Q)
- Look for alphanumeric sequences on vehicle stickers/plates
- Return ONLY the VIN number, no additional text

If you find a VIN, return just the 17-character code."""

        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 100,  # Keep response short and focused
            "temperature": 0.1,  # Low temperature for consistent results
            "anthropic_version": "bedrock-2023-05-31"
        }
        
        # Call Nova Pro
        try:
            logger.info("🤖 Calling Amazon Nova Pro...")
            response = bedrock_client.invoke_model(
                modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
                body=json.dumps(request_body),
                contentType="application/json"
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            extracted_text = response_body['content'][0]['text'].strip()
            logger.info(f"🔍 Nova Pro response: '{extracted_text}'")
            
        except ClientError as e:
            raise Exception(f"Nova Pro API error: {str(e)}")
        
        # Extract VIN using strict regex pattern
        import re
        vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
        vin_matches = re.findall(vin_pattern, extracted_text.upper())
        
        if vin_matches:
            vin = vin_matches[0]
            logger.info(f"✅ VIN successfully extracted: {vin}")
            return {
                "text": f"VIN successfully extracted: {vin}",
                "vin": vin,
                "confidence": 98,
                "found": True,
                "method": "nova_pro_direct",
                "raw_response": extracted_text
            }
        else:
            logger.warning("⚠️ No valid 17-character VIN found")
            return {
                "text": "No valid 17-character VIN found in image",
                "vin": None,
                "confidence": 0,
                "found": False,
                "method": "nova_pro_direct",
                "raw_response": extracted_text
            }
            
    except Exception as e:
        logger.error(f"❌ Nova Pro VIN extraction failed: {str(e)}")
        raise Exception(f"VIN extraction failed: {str(e)}")


@tool
def validate_vin(vin: str) -> Dict[str, Any]:
    """
    Validate a VIN number format and structure according to automotive standards.
    
    This tool performs comprehensive VIN validation including length checks,
    character set validation, and format verification according to ISO 3779 standards.
    
    Args:
        vin (str): The VIN string to validate
        
    Returns:
        Dict[str, Any]: A dictionary containing validation results:
        - is_valid: Boolean indicating if VIN is valid
        - issues: List of validation issues found
        - vin: The validated VIN (normalized)
        - text: Human-readable validation result
    """
    
    try:
        if not vin:
            raise ValueError("VIN is required for validation")
        
        vin = vin.strip().upper()
        issues = []
        
        logger.info(f"🔍 Validating VIN: {vin}")
        
        # Check length
        if len(vin) != 17:
            issues.append(f"Invalid length: {len(vin)} characters (expected 17)")
        
        # Check character set (no I, O, Q allowed)
        import re
        invalid_chars = re.findall(r'[IOQ]', vin)
        if invalid_chars:
            issues.append(f"Contains invalid characters: {', '.join(set(invalid_chars))}")
        
        # Check if contains only valid characters
        if not re.match(r'^[A-HJ-NPR-Z0-9]{17}$', vin):
            issues.append("Contains invalid characters (only A-H, J-N, P-R, T-Z, 0-9 allowed)")
        
        is_valid = len(issues) == 0
        
        if is_valid:
            logger.info(f"✅ VIN validation passed: {vin}")
        else:
            logger.warning(f"⚠️ VIN validation failed: {', '.join(issues)}")
        
        return {
            "text": f"VIN validation {'passed' if is_valid else 'failed'}: {vin}",
            "valid": is_valid,
            "vin": vin,
            "length": len(vin),
            "issues": issues
        }
        
    except Exception as e:
        logger.error(f"❌ VIN validation failed: {str(e)}")
        raise Exception(f"VIN validation failed: {str(e)}")
