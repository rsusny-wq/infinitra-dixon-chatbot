"""
Enhanced Automotive Search Tool - Phase 1 Implementation
VIN-integrated search with multi-tier strategy and result validation
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

@tool
def enhanced_automotive_search(agent, part_name: str, search_type: str = "parts", domains: str = "") -> Dict[str, Any]:
    """
    Enhanced automotive search with VIN integration and multi-tier strategy
    
    Args:
        agent: Strands agent instance
        part_name: Name of part to search for (e.g., "brake pads", "air filter")
        search_type: Type of search - "parts" or "labor" 
        domains: Optional comma-separated domain list
        
    Returns:
        Enhanced search results with VIN context and validation
    """
    logger.info(f"🚀 ENHANCED AUTOMOTIVE SEARCH")
    logger.info(f"🔍 Part: '{part_name}', Type: '{search_type}'")
    
    search_engine = VINEnhancedSearchEngine()
    
    try:
        # Extract VIN context
        vin_context = search_engine.extract_vin_context(agent)
        logger.info(f"🎯 VIN Context: {vin_context.get('has_vin', False)} (Confidence: {vin_context.get('confidence', 'Unknown')})")
        
        # Determine search domains
        if search_type == "labor":
            target_domains = search_engine.labor_sources
        else:
            target_domains = search_engine.major_retailers
        
        if domains:
            # Use provided domains
            domain_list = [d.strip() for d in domains.split(",") if d.strip()]
        else:
            # Use default domains based on search type
            domain_list = target_domains
        
        # Multi-tier search strategy
        search_results = []
        search_attempts = []
        
        if vin_context.get("has_vin"):
            # Tier 1: VIN-specific search
            specific_query = search_engine.build_vin_enhanced_query(part_name, vin_context, "specific")
            logger.info(f"🎯 Tier 1 Query: '{specific_query}'")
            
            tier1_results = _execute_tavily_search(specific_query, domain_list)
            if tier1_results.get("success"):
                search_attempts.append({
                    "tier": "specific",
                    "query": specific_query,
                    "results_count": len(tier1_results.get("results", [])),
                    "success": True
                })
                search_results.extend(tier1_results.get("results", []))
            
            # Tier 2: Model-year search (if Tier 1 insufficient)
            if len(search_results) < 3:
                model_query = search_engine.build_vin_enhanced_query(part_name, vin_context, "model_year")
                logger.info(f"🎯 Tier 2 Query: '{model_query}'")
                
                tier2_results = _execute_tavily_search(model_query, domain_list)
                if tier2_results.get("success"):
                    search_attempts.append({
                        "tier": "model_year", 
                        "query": model_query,
                        "results_count": len(tier2_results.get("results", [])),
                        "success": True
                    })
                    # Add new results (avoid duplicates)
                    existing_urls = {r.get("url") for r in search_results}
                    new_results = [r for r in tier2_results.get("results", []) if r.get("url") not in existing_urls]
                    search_results.extend(new_results)
        
        # Tier 3: Generic search (fallback or no VIN)
        if len(search_results) < 2:
            generic_query = search_engine.build_vin_enhanced_query(part_name, vin_context, "generic")
            logger.info(f"🎯 Tier 3 Query: '{generic_query}'")
            
            tier3_results = _execute_tavily_search(generic_query, domain_list)
            if tier3_results.get("success"):
                search_attempts.append({
                    "tier": "generic",
                    "query": generic_query, 
                    "results_count": len(tier3_results.get("results", [])),
                    "success": True
                })
                existing_urls = {r.get("url") for r in search_results}
                new_results = [r for r in tier3_results.get("results", []) if r.get("url") not in existing_urls]
                search_results.extend(new_results)
        
        # Validate and score results
        validation_results = search_engine.validate_search_results(search_results, part_name, vin_context)
        
        # Prepare final response
        response = {
            "success": True,
            "part_name": part_name,
            "search_type": search_type,
            "vin_enhanced": vin_context.get("has_vin", False),
            "vin_context": vin_context,
            "search_strategy": {
                "attempts": search_attempts,
                "total_results": len(search_results),
                "domains_used": domain_list
            },
            "results": validation_results["validated_results"],
            "quality_assessment": {
                "high_quality_results": validation_results["high_quality_count"],
                "average_confidence": validation_results["average_confidence"],
                "search_quality": validation_results["search_quality"],
                "needs_refinement": validation_results["needs_refinement"]
            },
            "recommendations": _generate_search_recommendations(validation_results, vin_context)
        }
        
        logger.info(f"✅ Enhanced search completed: {len(search_results)} results, {validation_results['high_quality_count']} high quality")
        return response
        
    except Exception as e:
        logger.error(f"❌ Enhanced search error: {e}")
        return {
            "success": False,
            "error": str(e),
            "part_name": part_name,
            "search_type": search_type,
            "fallback_available": True
        }

def _execute_tavily_search(query: str, domains: List[str]) -> Dict[str, Any]:
    """Execute Tavily search with timeout protection"""
    try:
        tavily_api_key = os.environ.get('TAVILY_API_KEY')
        if not tavily_api_key:
            return {"success": False, "error": "API key not found"}
        
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": tavily_api_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": True,
            "include_raw_content": False,
            "max_results": 5,
            "include_domains": domains
        }
        
        response = requests.post(url, json=payload, timeout=8)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "results": data.get("results", []),
                "answer": data.get("answer", "")
            }
        else:
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        logger.error(f"Tavily search error: {e}")
        return {"success": False, "error": str(e)}

def _generate_search_recommendations(validation_results: Dict[str, Any], vin_context: Dict[str, Any]) -> List[str]:
    """Generate recommendations for improving search results"""
    recommendations = []
    
    if validation_results["needs_refinement"]:
        recommendations.append("Consider refining search with more specific part details")
    
    if not vin_context.get("has_vin"):
        recommendations.append("Providing VIN would improve search accuracy to 95%")
    
    if validation_results["high_quality_count"] < 2:
        recommendations.append("Manual verification recommended for part compatibility")
    
    if validation_results["average_confidence"] < 70:
        recommendations.append("Consider searching additional retailers or part numbers")
    
    return recommendations
