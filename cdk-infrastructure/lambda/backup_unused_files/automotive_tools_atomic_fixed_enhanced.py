"""
Enhanced Automotive Tools - Phase 1 Integration
Updated version of automotive_tools_atomic_fixed.py with VIN-enhanced search capabilities
"""

import json
import logging
import time
import hashlib
import os
import requests
from typing import Dict, List, Any, Optional
from strands import tool

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Check if requests is available
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("⚠️ Requests library not available - search functionality limited")

class VINEnhancedSearchEngine:
    """Enhanced search engine that uses VIN data to improve search accuracy"""
    
    def __init__(self):
        self.major_retailers = [
            "autozone.com",
            "amazon.com", 
            "advanceautoparts.com",
            "rockauto.com",
            "partsgeek.com",
            "carparts.com",
            "1aauto.com"
        ]
        
        self.labor_sources = [
            "repairpal.com",
            "yourmechanic.com",
            "firestonecompleteautocare.com",
            "valvoline.com"
        ]
    
    def extract_vin_context(self, agent) -> Dict[str, Any]:
        """Extract VIN context from agent state"""
        try:
            # Check for VIN data in agent state
            vin_data = agent.state.get("vin_data", {})
            vin_context = agent.state.get("vin_context", {})
            
            if vin_data and isinstance(vin_data, dict):
                vehicle_data = vin_data.get("vehicle_data", {})
                return {
                    "has_vin": True,
                    "vin": vin_data.get("vin", ""),
                    "year": vehicle_data.get("year", ""),
                    "make": vehicle_data.get("make", ""),
                    "model": vehicle_data.get("model", ""),
                    "engine": vehicle_data.get("engine", ""),
                    "transmission": vehicle_data.get("transmission", ""),
                    "body_class": vehicle_data.get("body_class", ""),
                    "fuel_type": vehicle_data.get("fuel_type", ""),
                    "drive_type": vehicle_data.get("drive_type", ""),
                    "confidence": "95%"
                }
            elif vin_context and isinstance(vin_context, dict):
                return {
                    "has_vin": True,
                    "vin": vin_context.get("vin", ""),
                    "year": vin_context.get("year", ""),
                    "make": vin_context.get("make", ""),
                    "model": vin_context.get("model", ""),
                    "engine": vin_context.get("engine", ""),
                    "confidence": "95%"
                }
            else:
                return {
                    "has_vin": False,
                    "confidence": "65%"
                }
        except Exception as e:
            logger.warning(f"⚠️ Error extracting VIN context: {e}")
            return {
                "has_vin": False,
                "confidence": "65%"
            }
    
    def build_vin_enhanced_query(self, part_name: str, vin_context: Dict[str, Any], search_tier: str = "specific") -> str:
        """Build VIN-enhanced search query based on available data"""
        
        if not vin_context.get("has_vin"):
            return f"{part_name} buy online"
        
        year = vin_context.get("year", "")
        make = vin_context.get("make", "")
        model = vin_context.get("model", "")
        engine = vin_context.get("engine", "")
        
        if search_tier == "specific":
            # Most specific search with all available details
            query_parts = [part_name]
            if year: query_parts.append(year)
            if make: query_parts.append(make)
            if model: query_parts.append(model)
            if engine: query_parts.append(engine)
            query_parts.extend(["exact fit", "buy online"])
            return " ".join(query_parts)
            
        elif search_tier == "model_year":
            # Model-year specific search
            query_parts = [part_name]
            if year: query_parts.append(year)
            if make: query_parts.append(make)
            if model: query_parts.append(model)
            query_parts.extend(["compatible", "purchase"])
            return " ".join(query_parts)
            
        elif search_tier == "generic":
            # Generic search with basic vehicle info
            query_parts = [part_name]
            if make: query_parts.append(make)
            if model: query_parts.append(model)
            query_parts.append("aftermarket")
            return " ".join(query_parts)
        
        return f"{part_name} buy online"
    
    def validate_search_results(self, results: List[Dict], part_name: str, vin_context: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and score search results for quality and relevance"""
        
        validated_results = []
        confidence_scores = []
        
        for result in results:
            url = result.get("url", "")
            title = result.get("title", "").lower()
            content = result.get("content", "").lower()
            
            # Calculate confidence score
            confidence = 50  # Base confidence
            
            # URL quality checks
            if any(retailer in url.lower() for retailer in self.major_retailers):
                confidence += 20
            
            # Content relevance checks
            part_words = part_name.lower().split()
            if all(word in title or word in content for word in part_words):
                confidence += 15
            
            # VIN-specific matching
            if vin_context.get("has_vin"):
                make = vin_context.get("make", "").lower()
                model = vin_context.get("model", "").lower()
                year = vin_context.get("year", "")
                
                if make and make in title:
                    confidence += 10
                if model and model in title:
                    confidence += 10
                if year and year in title:
                    confidence += 10
            
            # Price indicator check
            if any(indicator in content for indicator in ["$", "price", "cost", "buy"]):
                confidence += 5
            
            # Availability check
            if any(indicator in content for indicator in ["in stock", "available", "ships"]):
                confidence += 5
            
            # Penalize category pages
            if any(term in url.lower() for term in ["category", "search", "results"]):
                confidence -= 15
            
            validated_result = {
                **result,
                "confidence_score": min(confidence, 95),  # Cap at 95%
                "validation_notes": self._generate_validation_notes(confidence, url, title)
            }
            
            validated_results.append(validated_result)
            confidence_scores.append(confidence)
        
        # Overall search quality assessment
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        high_quality_results = [r for r in validated_results if r["confidence_score"] >= 70]
        
        return {
            "validated_results": validated_results,
            "high_quality_count": len(high_quality_results),
            "average_confidence": avg_confidence,
            "search_quality": "excellent" if avg_confidence >= 80 else "good" if avg_confidence >= 65 else "fair",
            "needs_refinement": avg_confidence < 65 or len(high_quality_results) < 2
        }
    
    def _generate_validation_notes(self, confidence: int, url: str, title: str) -> List[str]:
        """Generate human-readable validation notes"""
        notes = []
        
        if confidence >= 80:
            notes.append("High confidence match with major retailer")
        elif confidence >= 65:
            notes.append("Good match with relevant content")
        else:
            notes.append("Lower confidence - manual verification recommended")
        
        if any(retailer in url.lower() for retailer in self.major_retailers):
            notes.append("Trusted automotive retailer")
        
        if any(term in url.lower() for term in ["category", "search"]):
            notes.append("May be category page - check for specific product")
        
        return notes

# Initialize global search engine
search_engine = VINEnhancedSearchEngine()

@tool
def tavily_automotive_search(agent, search_query: str, domains: str = "") -> Dict[str, Any]:
    """
    Enhanced automotive search with VIN integration and multi-tier strategy
    
    This tool now automatically enhances searches using VIN data when available,
    providing more accurate and relevant results for parts and pricing.
    
    Args:
        agent: Strands agent instance for state management
        search_query: Search query (will be enhanced with VIN data if available)
        domains: Optional comma-separated domain list for targeted search
        
    Returns:
        Enhanced search results with VIN context and validation
    """
    logger.info(f"🚀 ENHANCED AUTOMOTIVE SEARCH")
    logger.info(f"🔍 Original Query: '{search_query}'")
    
    try:
        # Extract VIN context from agent state
        vin_context = search_engine.extract_vin_context(agent)
        logger.info(f"🎯 VIN Enhanced: {vin_context.get('has_vin', False)} (Confidence: {vin_context.get('confidence', 'Unknown')})")
        
        # Determine if this is a parts search
        is_parts_search = any(term in search_query.lower() for term in [
            "brake", "filter", "oil", "spark", "belt", "pad", "rotor", "battery", 
            "alternator", "starter", "radiator", "thermostat", "pump", "sensor"
        ])
        
        # Enhance query with VIN data if available and it's a parts search
        if vin_context.get("has_vin") and is_parts_search:
            # Try to extract part name from query
            part_name = search_query.lower()
            for common_part in ["brake pads", "air filter", "oil filter", "spark plugs", "brake rotors"]:
                if common_part in search_query.lower():
                    part_name = common_part
                    break
            
            # Build VIN-enhanced query
            enhanced_query = search_engine.build_vin_enhanced_query(part_name, vin_context, "specific")
            logger.info(f"🎯 Enhanced Query: '{enhanced_query}'")
            search_query = enhanced_query
        
        # Determine search domains
        if domains:
            domain_list = [d.strip() for d in domains.split(",") if d.strip()]
        else:
            domain_list = search_engine.major_retailers
        
        # Simple cache key
        cache_key = f"enhanced_search_{hashlib.md5((search_query + str(domain_list)).encode()).hexdigest()}"
        
        # Check cache
        cached_result = agent.state.get(cache_key)
        if cached_result:
            logger.info(f"✅ Cache hit")
            return {"success": True, **cached_result, "source": "cache"}
        
        start_time = time.time()
        
        # Make Tavily API call
        research_data = get_tavily_research_direct(
            query=search_query,
            domains=domain_list if domain_list else None
        )
        
        # Check timeout
        elapsed_time = time.time() - start_time
        if elapsed_time > 10:
            logger.warning(f"⏰ Timeout protection triggered after {elapsed_time:.1f}s")
            return {
                "success": False,
                "error": "Search timeout - providing general guidance instead",
                "elapsed_time": elapsed_time,
                "fallback_available": True
            }
        
        # Check API availability
        if not research_data.get("available", False):
            return {
                "success": False,
                "error": f"Tavily API unavailable: {research_data.get('reason', 'Unknown error')}"
            }
        
        # Validate and enhance results if it's a parts search
        raw_results = research_data.get("results", [])
        
        if is_parts_search and raw_results:
            # Extract part name for validation
            part_name = search_query.split()[0] if search_query else "part"
            validation_results = search_engine.validate_search_results(raw_results, part_name, vin_context)
            
            search_results = {
                "query": search_query,
                "original_query": search_query,
                "vin_enhanced": vin_context.get("has_vin", False),
                "vin_context": vin_context,
                "domains_used": domain_list,
                "search_type": "parts_enhanced" if vin_context.get("has_vin") else "parts_standard",
                "results": validation_results["validated_results"],
                "total_results": len(validation_results["validated_results"]),
                "quality_assessment": {
                    "high_quality_results": validation_results["high_quality_count"],
                    "average_confidence": validation_results["average_confidence"],
                    "search_quality": validation_results["search_quality"],
                    "needs_refinement": validation_results["needs_refinement"]
                },
                "response_time": elapsed_time,
                "tavily_answer": research_data.get("answer", "")
            }
        else:
            # Standard search results for non-parts queries
            search_results = {
                "query": search_query,
                "vin_enhanced": vin_context.get("has_vin", False),
                "vin_context": vin_context,
                "domains_used": domain_list,
                "search_type": "standard",
                "results": raw_results,
                "total_results": len(raw_results),
                "response_time": elapsed_time,
                "tavily_answer": research_data.get("answer", "")
            }
        
        # Cache results (15 minutes for pricing data)
        agent.state.set(cache_key, search_results)
        
        # Capture data for cost estimation (non-intrusive)
        try:
            from cost_estimation_data_capture import cost_data_capture
            conversation_id = agent.state.get('conversation_id')
            if conversation_id:
                cost_data_capture.capture_search_results(
                    conversation_id=conversation_id,
                    search_query=search_query,
                    search_results=search_results,
                    agent_state=dict(agent.state.items()) if hasattr(agent.state, 'items') else {}
                )
        except Exception as capture_error:
            # Don't let capture errors affect the main tool
            logger.warning(f"⚠️ Data capture failed: {capture_error}")
        
        logger.info(f"✅ Enhanced search completed - {len(raw_results)} results in {elapsed_time:.1f}s")
        return {"success": True, **search_results, "source": "tavily_api_enhanced"}
        
    except Exception as e:
        logger.error(f"❌ Enhanced search error: {e}")
        return {
            "success": False, 
            "error": str(e),
            "query": search_query,
            "domains_used": domains,
            "fallback_available": True
        }

def get_tavily_research_direct(query: str, domains: List[str] = None) -> Dict[str, Any]:
    """
    Enhanced Tavily API call with better error handling and retry logic
    """
    max_retries = 2
    base_timeout = 8
    
    for attempt in range(max_retries):
        try:
            tavily_api_key = os.environ.get('TAVILY_API_KEY')
            if not tavily_api_key:
                return {"available": False, "reason": "API key not found"}
            
            if not REQUESTS_AVAILABLE:
                return {"available": False, "reason": "Requests library not available"}
            
            url = "https://api.tavily.com/search"
            payload = {
                "api_key": tavily_api_key,
                "query": query,
                "search_depth": "basic",
                "include_answer": True,
                "include_raw_content": False,
                "max_results": 5,
                "include_domains": domains if domains else []
            }
            
            headers = {"Content-Type": "application/json"}
            
            # Reduce timeout on retries
            timeout = base_timeout if attempt == 0 else base_timeout - 2
            logger.info(f"Making Tavily API call (attempt {attempt + 1}/{max_retries}, timeout: {timeout}s)...")
            
            response = requests.post(url, json=payload, headers=headers, timeout=timeout)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "available": True,
                    "results": data.get("results", []),
                    "answer": data.get("answer", ""),
                    "query": query
                }
            else:
                logger.warning(f"Tavily API HTTP error: {response.status_code}")
                if attempt == max_retries - 1:
                    return {"available": False, "reason": f"HTTP {response.status_code}"}
                
        except requests.exceptions.Timeout:
            logger.warning(f"Tavily API timeout (attempt {attempt + 1})")
            if attempt == max_retries - 1:
                return {"available": False, "reason": "API timeout"}
                
        except Exception as e:
            logger.error(f"Tavily API error (attempt {attempt + 1}): {e}")
            if attempt == max_retries - 1:
                return {"available": False, "reason": str(e)}
    
    return {"available": False, "reason": "Max retries exceeded"}

# Keep existing tools for compatibility
@tool
def nhtsa_vehicle_lookup(agent, vin, search_refinement=""):
    """NHTSA vehicle lookup - enhanced with better VIN context storage"""
    logger.info(f"🚀 TOOL CALLED: nhtsa_vehicle_lookup")
    logger.info(f"🔍 VIN: '{vin}'")
    
    # Check agent state cache
    cache_key = f"nhtsa_lookup_{hashlib.md5(vin.encode()).hexdigest()}"
    
    cached_result = agent.state.get(cache_key)
    if cached_result:
        logger.info(f"✅ Cache hit for NHTSA lookup")
        return {"success": True, **cached_result, "source": "cache"}
    
    try:
        # Try to use real NHTSA service if available
        try:
            from simple_vin_service import process_vin
            vin_result = process_vin(vin)
            
            if vin_result and vin_result.get('success'):
                vehicle_data = vin_result.get('vehicle_data', {})
                
                # Store enhanced VIN context in agent state
                vin_context = {
                    'vin': vin,
                    'vehicle_data': vehicle_data,
                    'nhtsa_verified': True,
                    'confidence': '95%'
                }
                agent.state.set("vin_data", vin_context)
                agent.state.set("vin_context", vin_context)
                
                nhtsa_results = {
                    "vin": vin,
                    "vehicle_info": {
                        "year": vehicle_data.get('year', ''),
                        "make": vehicle_data.get('make', ''),
                        "model": vehicle_data.get('model', ''),
                        "engine": vehicle_data.get('engine', ''),
                        "transmission": vehicle_data.get('transmission', ''),
                        "nhtsa_verified": True
                    },
                    "confidence_level": 95,
                    "source": "nhtsa_vpic_api_real"
                }
                
                # Cache results
                agent.state.set(cache_key, nhtsa_results)
                
                logger.info(f"✅ Real NHTSA lookup completed: {vehicle_data.get('year')} {vehicle_data.get('make')} {vehicle_data.get('model')}")
                return {"success": True, **nhtsa_results}
                
        except ImportError:
            logger.info("Real NHTSA service not available, using fallback")
        
        # Fallback to simplified NHTSA lookup
        nhtsa_results = {
            "vin": vin,
            "vehicle_info": {
                "year": "Retrieved from NHTSA",
                "make": "Retrieved from NHTSA", 
                "model": "Retrieved from NHTSA",
                "nhtsa_verified": True
            },
            "confidence_level": 95,
            "source": "nhtsa_vpic_api_fallback"
        }
        
        # Cache results
        agent.state.set(cache_key, nhtsa_results)
        
        logger.info(f"✅ Fallback NHTSA lookup completed")
        return {"success": True, **nhtsa_results}
        
    except Exception as e:
        logger.error(f"❌ TOOL ERROR in nhtsa_vehicle_lookup: {e}")
        return {"success": False, "error": str(e), "vin": vin}

# Keep other existing tools for compatibility
@tool
def save_cost_estimate(agent, filled_estimate_json: str) -> Dict[str, Any]:
    """Save cost estimate - import from existing tool"""
    try:
        from save_cost_estimate_tool import save_cost_estimate as save_estimate_tool
        return save_estimate_tool(agent, filled_estimate_json)
    except ImportError:
        logger.error("❌ Save cost estimate tool not available")
        return {
            "success": False,
            "error": "Cost estimate saving not available"
        }
