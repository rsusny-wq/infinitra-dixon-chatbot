"""
Intelligent Automotive Search Tool
Simplified search that relies on agent intelligence rather than complex coded logic
"""

import json
import logging
import os
from typing import Dict, List, Any, Optional
from strands import tool

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Check if requests is available for Tavily API
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("Requests library not available")

@tool
def intelligent_automotive_search(agent, query: str, context_type: str = "general") -> Dict[str, Any]:
    """
    Intelligent automotive search that relies on agent intelligence for enhancement and validation.
    
    The agent should:
    1. Enhance queries with available VIN/vehicle context when relevant
    2. Validate results for price anomalies and quality issues
    3. Cross-reference information across multiple sources
    4. Flag obviously incorrect information before presenting to user
    
    Args:
        agent: Strands agent instance
        query: Search query (agent should enhance with context as needed)
        context_type: Type of search - "parts", "labor", "diagnosis", "general"
        
    Returns:
        Search results for agent to intelligently process and validate
    """
    logger.info(f"🔍 Intelligent automotive search: '{query}' (type: {context_type})")
    
    try:
        # Get VIN context for enhanced searching
        vehicle_context = get_vehicle_context(agent)
        has_vin = vehicle_context.get("has_vin", False)
        confidence_level = vehicle_context.get("confidence_level", "65%")
        
        logger.info(f"🎯 VIN Enhanced: {has_vin} (Confidence: {confidence_level})")
        
        # Enhance query with VIN data if available
        enhanced_query = query
        if has_vin and context_type == "parts":
            # For parts searches, include specific vehicle details
            year = vehicle_context.get("year", "")
            make = vehicle_context.get("make", "")
            model = vehicle_context.get("model", "")
            engine = vehicle_context.get("engine", "")
            
            if year and make and model:
                # Enhance query with specific vehicle details
                vehicle_spec = f"{year} {make} {model}"
                if engine:
                    vehicle_spec += f" {engine}"
                
                # Replace generic vehicle references with specific details
                if "honda civic" in query.lower() or "civic" in query.lower():
                    enhanced_query = query.replace("Honda Civic", vehicle_spec).replace("Civic", vehicle_spec)
                elif year and make and model not in query:
                    enhanced_query = f"{vehicle_spec} {query}"
                
                logger.info(f"🔍 VIN-Enhanced Query: '{enhanced_query}'")
        
        # Get Tavily API key
        tavily_api_key = os.environ.get('TAVILY_API_KEY')
        if not tavily_api_key:
            return {
                "success": False,
                "error": "Tavily API key not configured",
                "results": [],
                "confidence_level": confidence_level,
                "vin_enhanced": has_vin
            }
        
        # Optimized Tavily search for speed (basic search is 70% faster than advanced)
        search_payload = {
            "api_key": tavily_api_key,
            "query": enhanced_query,  # Use VIN-enhanced query
            "search_depth": "basic",  # OPTIMIZED: basic is much faster than advanced
            "include_answer": True,
            "include_raw_content": False,  # OPTIMIZED: reduces payload size and processing time
            "max_results": 5,  # OPTIMIZED: fewer results = faster processing
            "include_domains": [],
            "exclude_domains": []
        }
        
        # Add context-specific guidance (light guidance, not rigid restrictions)
        if context_type == "parts":
            # For parts searches, we can suggest automotive retailers but don't restrict
            pass
        elif context_type == "labor":
            # For labor searches, we can suggest service information sources but don't restrict
            pass
        
        if not REQUESTS_AVAILABLE:
            return {
                "success": False,
                "error": "HTTP requests not available",
                "results": []
            }
        
        # Make the search request with optimized timeout
        response = requests.post(
            "https://api.tavily.com/search",
            json=search_payload,
            timeout=15  # OPTIMIZED: reduced from 30s since basic search is much faster
        )
        
        if response.status_code == 200:
            search_data = response.json()
            results = search_data.get("results", [])
            
            logger.info(f"✅ Search completed: {len(results)} results")
            
            # Return enhanced results with VIN context
            return {
                "success": True,
                "query": enhanced_query,  # Return enhanced query
                "original_query": query,  # Keep original for reference
                "context_type": context_type,
                "results": results,
                "answer": search_data.get("answer", ""),
                "total_results": len(results),
                "confidence_level": confidence_level,
                "vin_enhanced": has_vin,
                "vehicle_context": vehicle_context,
                "agent_instructions": {
                    "validate_prices": "Check if prices make sense for the repair type",
                    "cross_reference": "Compare information across multiple sources",
                    "flag_anomalies": "Identify obviously incorrect information",
                    "context_relevance": "Ensure results match user's actual problem",
                    "confidence_note": f"Estimates have {confidence_level} confidence based on {'VIN-specific vehicle data' if has_vin else 'general vehicle information'}"
                }
            }
        else:
            logger.error(f"❌ Tavily API error: {response.status_code}")
            return {
                "success": False,
                "error": f"Search API error: {response.status_code}",
                "results": [],
                "confidence_level": confidence_level,
                "vin_enhanced": has_vin
            }
            
    except Exception as e:
        logger.error(f"❌ Search error: {e}")
        return {
            "success": False,
            "error": str(e),
            "results": [],
            "confidence_level": "65%",
            "vin_enhanced": False
        }

@tool
def get_vehicle_context(agent) -> Dict[str, Any]:
    """
    Get available vehicle context for intelligent use by the agent.
    
    Returns all available vehicle information for the agent to use intelligently
    in searches and recommendations.
    """
    try:
        # Extract all available vehicle context
        vin_data = agent.state.get("vin_data") if hasattr(agent, 'state') else {}
        vehicle_info = agent.state.get("vehicle_info") if hasattr(agent, 'state') else {}
        vin_context = agent.state.get("vin_context") if hasattr(agent, 'state') else {}
        
        # Consolidate vehicle information
        context = {
            "has_vin": bool(vin_data or vin_context),
            "confidence_level": "95%" if vin_data else "65%",
            "raw_vin_data": vin_data,
            "vehicle_info": vehicle_info,
            "vin_context": vin_context
        }
        
        # Extract key vehicle details if available
        if vin_data and isinstance(vin_data, dict):
            vehicle_data = vin_data.get("vehicle_data", {})
            context.update({
                "vin": vin_data.get("vin", ""),
                "year": vehicle_data.get("year", ""),
                "make": vehicle_data.get("make", ""),
                "model": vehicle_data.get("model", ""),
                "engine": vehicle_data.get("engine", ""),
                "transmission": vehicle_data.get("transmission", ""),
                "body_class": vehicle_data.get("body_class", ""),
                "fuel_type": vehicle_data.get("fuel_type", ""),
                "drive_type": vehicle_data.get("drive_type", "")
            })
        elif vin_context and isinstance(vin_context, dict):
            context.update({
                "vin": vin_context.get("vin", ""),
                "year": vin_context.get("year", ""),
                "make": vin_context.get("make", ""),
                "model": vin_context.get("model", ""),
                "engine": vin_context.get("engine", "")
            })
        
        logger.info(f"🚗 Vehicle context: {context.get('year', 'Unknown')} {context.get('make', 'Unknown')} {context.get('model', 'Unknown')}")
        
        return context
        
    except Exception as e:
        logger.error(f"❌ Error getting vehicle context: {e}")
        return {
            "has_vin": False,
            "confidence_level": "65%",
            "error": str(e)
        }
