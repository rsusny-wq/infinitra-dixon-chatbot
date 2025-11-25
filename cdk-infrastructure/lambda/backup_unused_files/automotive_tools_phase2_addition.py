"""
Phase 2 Addition: Labor Time Web Search Tool
This code should be added to the existing automotive_tools_atomic_fixed.py file
"""

import re

class LaborTimeSearchEngine:
    """Specialized search engine for labor time estimates"""
    
    def __init__(self):
        # Automotive service websites that provide labor time information
        self.labor_sources = [
            "repairpal.com",
            "yourmechanic.com", 
            "firestonecompleteautocare.com",
            "valvoline.com",
            "jiffy.com",
            "pep-boys.com",
            "midas.com",
            "monro.com"
        ]
        
        # Labor time keywords for search refinement
        self.labor_keywords = [
            "labor time", "book time", "flat rate", "repair time",
            "installation time", "how long", "mechanic time",
            "service time", "work hours", "labor hours"
        ]
    
    def build_labor_search_queries(self, repair_task: str, vin_context: Dict[str, Any]) -> List[str]:
        """Build multiple search queries for labor time research"""
        
        queries = []
        base_task = repair_task.lower()
        
        if vin_context.get("has_vin"):
            year = vin_context.get("year", "")
            make = vin_context.get("make", "")
            model = vin_context.get("model", "")
            engine = vin_context.get("engine", "")
            
            # VIN-specific queries
            if year and make and model:
                queries.append(f"{base_task} labor time {year} {make} {model} book time hours")
                queries.append(f"how long {base_task} {year} {make} {model} repair time cost")
                queries.append(f"{base_task} {year} {make} {model} flat rate time mechanic")
                
                if engine and len(engine) < 15:
                    queries.append(f"{base_task} {year} {make} {model} {engine} labor hours")
        
        # Generic queries (fallback or no VIN)
        queries.extend([
            f"{base_task} labor time estimate hours",
            f"how long does {base_task} take mechanic",
            f"{base_task} repair time automotive service",
            f"{base_task} book time flat rate labor"
        ])
        
        return queries[:4]  # Limit to 4 queries to avoid timeout
    
    def extract_time_estimates(self, content: str, title: str) -> Dict[str, Any]:
        """Extract time estimates from content using pattern matching"""
        
        text = f"{title} {content}".lower()
        
        # Patterns for time extraction
        patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:to|\-)\s*(\d+(?:\.\d+)?)\s*hour',  # "2 to 3 hours"
            r'(\d+(?:\.\d+)?)\s*hour',  # "2 hours"
            r'(\d+(?:\.\d+)?)\s*hr',    # "2 hr"
            r'(\d+(?:\.\d+)?)\s*h\b',   # "2 h"
            r'book\s*time[:\s]*(\d+(?:\.\d+)?)',  # "book time: 2.5"
            r'labor[:\s]*(\d+(?:\.\d+)?)\s*hour',  # "labor: 2 hours"
            r'takes?\s*(?:about\s*)?(\d+(?:\.\d+)?)\s*hour',  # "takes about 2 hours"
        ]
        
        extracted_hours = []
        ranges = []
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if isinstance(match, tuple):
                    # Range pattern (e.g., "2 to 3 hours")
                    try:
                        start = float(match[0])
                        end = float(match[1]) if len(match) > 1 and match[1] else start
                        if 0.1 <= start <= 20 and 0.1 <= end <= 20:  # Reasonable range
                            ranges.append((start, end))
                            extracted_hours.extend([start, end])
                    except ValueError:
                        continue
                else:
                    # Single value pattern
                    try:
                        hours = float(match)
                        if 0.1 <= hours <= 20:  # Reasonable range
                            extracted_hours.append(hours)
                    except ValueError:
                        continue
        
        return {
            "hours": list(set(extracted_hours)),  # Remove duplicates
            "ranges": ranges,
            "found_estimates": len(extracted_hours) > 0
        }
    
    def validate_labor_time_results(self, results: List[Dict], repair_task: str, vin_context: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and extract labor time information from search results"""
        
        validated_results = []
        time_estimates = []
        confidence_scores = []
        
        for result in results:
            url = result.get("url", "")
            title = result.get("title", "").lower()
            content = result.get("content", "").lower()
            
            # Calculate confidence score
            confidence = 40  # Base confidence for labor time
            
            # Source quality checks
            if any(source in url.lower() for source in self.labor_sources):
                confidence += 25  # Trusted automotive service source
            
            # Content relevance checks
            task_words = repair_task.lower().split()
            if all(word in title or word in content for word in task_words[:2]):
                confidence += 15
            
            # Labor time keyword presence
            labor_keyword_count = sum(1 for keyword in self.labor_keywords if keyword in content)
            confidence += min(labor_keyword_count * 5, 15)  # Up to 15 points for labor keywords
            
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
            
            # Time estimate extraction
            extracted_time = self.extract_time_estimates(content, title)
            
            validated_result = {
                **result,
                "confidence_score": min(confidence, 95),
                "extracted_time": extracted_time,
                "source_type": self._classify_source(url),
                "labor_keywords_found": labor_keyword_count,
                "vin_enhanced": vin_context.get("has_vin", False)
            }
            
            validated_results.append(validated_result)
            confidence_scores.append(confidence)
            
            if extracted_time.get("hours"):
                time_estimates.extend(extracted_time["hours"])
        
        # Calculate overall metrics
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        high_quality_count = len([r for r in validated_results if r["confidence_score"] >= 70])
        
        # Analyze time estimates
        time_analysis = self._analyze_time_estimates(time_estimates, repair_task)
        
        return {
            "validated_results": validated_results,
            "high_quality_count": high_quality_count,
            "average_confidence": avg_confidence,
            "search_quality": "excellent" if avg_confidence >= 75 else "good" if avg_confidence >= 60 else "fair",
            "time_estimates": time_analysis,
            "needs_refinement": avg_confidence < 60 or high_quality_count < 2
        }
    
    def _classify_source(self, url: str) -> str:
        """Classify the source type"""
        url_lower = url.lower()
        
        if any(source in url_lower for source in self.labor_sources):
            return "automotive_service"
        elif "forum" in url_lower or "reddit" in url_lower:
            return "community_forum"
        else:
            return "general_web"
    
    def _analyze_time_estimates(self, time_estimates: List[float], repair_task: str) -> Dict[str, Any]:
        """Analyze collected time estimates"""
        
        if not time_estimates:
            return {
                "estimated_hours": None,
                "confidence": "low",
                "range": None,
                "note": "No specific time estimates found in search results"
            }
        
        # Remove outliers if we have enough data
        if len(time_estimates) > 3:
            mean = sum(time_estimates) / len(time_estimates)
            std_dev = (sum((x - mean) ** 2 for x in time_estimates) / len(time_estimates)) ** 0.5
            filtered_estimates = [x for x in time_estimates if abs(x - mean) <= 2 * std_dev]
            if filtered_estimates:
                time_estimates = filtered_estimates
        
        # Calculate statistics
        min_time = min(time_estimates)
        max_time = max(time_estimates)
        avg_time = sum(time_estimates) / len(time_estimates)
        
        # Determine confidence based on number of estimates and consistency
        if len(time_estimates) >= 3:
            variance = max_time - min_time
            if variance <= 1.0:  # Very consistent estimates
                confidence = "high"
            elif variance <= 2.0:  # Moderately consistent
                confidence = "medium"
            else:
                confidence = "low"
        else:
            confidence = "medium" if len(time_estimates) == 2 else "low"
        
        return {
            "estimated_hours": round(avg_time, 1),
            "range": f"{min_time:.1f} - {max_time:.1f}" if min_time != max_time else f"{avg_time:.1f}",
            "confidence": confidence,
            "sample_size": len(time_estimates),
            "note": f"Based on {len(time_estimates)} estimates from web sources"
        }

# Initialize global labor search engine
labor_search_engine = LaborTimeSearchEngine()

@tool
def labor_time_web_search(agent, repair_task: str, vehicle_info: str = "") -> Dict[str, Any]:
    """
    Phase 2: Labor Time Web Search Tool
    
    Searches multiple automotive sources for labor time estimates using VIN-enhanced queries.
    Provides cross-validated labor time estimates from professional automotive sources.
    
    Args:
        agent: Strands agent instance
        repair_task: Description of repair task (e.g., "brake pad replacement", "oil change")
        vehicle_info: Optional additional vehicle information
        
    Returns:
        Labor time estimates with confidence levels and source validation
    """
    logger.info(f"🚀 LABOR TIME WEB SEARCH - Phase 2")
    logger.info(f"🔧 Repair Task: '{repair_task}'")
    
    try:
        # Extract VIN context using existing search engine
        vin_context = search_engine.extract_vin_context(agent)
        logger.info(f"🎯 VIN Enhanced: {vin_context.get('has_vin', False)} (Confidence: {vin_context.get('confidence', 'Unknown')})")
        
        # Build search queries
        search_queries = labor_search_engine.build_labor_search_queries(repair_task, vin_context)
        logger.info(f"🔍 Generated {len(search_queries)} search queries")
        
        # Cache key for results
        cache_key = f"labor_search_{hashlib.md5((repair_task + str(vin_context)).encode()).hexdigest()}"
        
        # Check cache
        cached_result = agent.state.get(cache_key)
        if cached_result:
            logger.info(f"✅ Cache hit for labor search")
            return {"success": True, **cached_result, "source": "cache"}
        
        # Execute searches using existing Tavily function
        all_results = []
        search_attempts = []
        
        for i, query in enumerate(search_queries):
            logger.info(f"🔍 Query {i+1}: '{query}'")
            
            # Use labor-specific domains
            domains = labor_search_engine.labor_sources
            
            search_result = get_tavily_research_direct(query, domains)
            
            if search_result.get("available"):
                results = search_result.get("results", [])
                all_results.extend(results)
                
                search_attempts.append({
                    "query": query,
                    "results_count": len(results),
                    "success": True
                })
                
                logger.info(f"✅ Query {i+1} returned {len(results)} results")
            else:
                search_attempts.append({
                    "query": query,
                    "results_count": 0,
                    "success": False,
                    "error": search_result.get("reason", "Unknown error")
                })
                logger.warning(f"⚠️ Query {i+1} failed: {search_result.get('reason', 'Unknown error')}")
        
        # Remove duplicate results by URL
        unique_results = []
        seen_urls = set()
        for result in all_results:
            url = result.get("url", "")
            if url not in seen_urls:
                unique_results.append(result)
                seen_urls.add(url)
        
        logger.info(f"📊 Total unique results: {len(unique_results)}")
        
        # Validate and analyze results
        validation_results = labor_search_engine.validate_labor_time_results(unique_results, repair_task, vin_context)
        
        # Prepare final response
        response = {
            "success": True,
            "repair_task": repair_task,
            "vin_enhanced": vin_context.get("has_vin", False),
            "vin_context": vin_context,
            "search_strategy": {
                "queries_executed": search_attempts,
                "total_results": len(unique_results),
                "domains_used": domains
            },
            "results": validation_results["validated_results"],
            "labor_time_analysis": validation_results["time_estimates"],
            "quality_assessment": {
                "high_quality_results": validation_results["high_quality_count"],
                "average_confidence": validation_results["average_confidence"],
                "search_quality": validation_results["search_quality"],
                "needs_refinement": validation_results["needs_refinement"]
            },
            "recommendations": _generate_labor_recommendations(validation_results, vin_context)
        }
        
        # Cache results (30 minutes for labor data)
        agent.state.set(cache_key, response)
        
        logger.info(f"✅ Labor time search completed")
        logger.info(f"🎯 Estimated Time: {validation_results['time_estimates'].get('estimated_hours', 'N/A')} hours")
        logger.info(f"📊 Quality: {validation_results['search_quality']}, High Quality Results: {validation_results['high_quality_count']}")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Labor time search error: {e}")
        return {
            "success": False,
            "error": str(e),
            "repair_task": repair_task,
            "fallback_available": True
        }

def _generate_labor_recommendations(validation_results: Dict[str, Any], vin_context: Dict[str, Any]) -> List[str]:
    """Generate recommendations for labor time estimates"""
    recommendations = []
    
    time_analysis = validation_results.get("time_estimates", {})
    confidence = time_analysis.get("confidence", "low")
    
    if confidence == "high":
        recommendations.append("High confidence labor time estimate based on multiple sources")
    elif confidence == "medium":
        recommendations.append("Moderate confidence estimate - consider getting additional quotes")
    else:
        recommendations.append("Limited data available - recommend professional assessment")
    
    if not vin_context.get("has_vin"):
        recommendations.append("Providing VIN would improve labor time accuracy for your specific vehicle")
    
    if validation_results.get("needs_refinement"):
        recommendations.append("Consider searching for more specific repair procedures")
    
    if validation_results.get("high_quality_count", 0) < 2:
        recommendations.append("Recommend getting quotes from local mechanics for verification")
    
    return recommendations

logger.info("✅ Phase 2: Labor Time Web Search Tool added successfully")
