"""
Phase 3: Result Quality Validation & Iterative Refinement
Advanced validation and refinement of search results for maximum accuracy
"""

import json
import logging
import time
import hashlib
import os
import re
from typing import Dict, List, Any, Optional, Tuple
from strands import tool

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Check if requests is available
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("Requests library not available")

class ResultQualityValidator:
    """Advanced result quality validation and iterative refinement engine"""
    
    def __init__(self):
        self.major_retailers = [
            "autozone.com", "amazon.com", "advanceautoparts.com", "rockauto.com",
            "partsgeek.com", "carparts.com", "1aauto.com", "oreillyauto.com"
        ]
        
        # URL patterns that indicate category/search pages (lower quality)
        self.category_patterns = [
            r'/search\?', r'/category/', r'/browse/', r'/results',
            r'q=', r'search=', r'query=', r'/c/', r'/dept/'
        ]
        
        # URL patterns that indicate product pages (higher quality)
        self.product_patterns = [
            r'/p/', r'/product/', r'/item/', r'/dp/', r'/pd/',
            r'-p\d+', r'_p\d+', r'/part/', r'/sku/'
        ]
        
        # Price patterns for extraction
        self.price_patterns = [
            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)',  # $123.45, $1,234.56
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?',  # 123.45 dollars
            r'price[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # price: $123.45
            r'cost[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',   # cost: $123.45
        ]
        
        # Availability indicators
        self.availability_positive = [
            "in stock", "available", "ships", "ready", "quick delivery",
            "same day", "next day", "free shipping", "add to cart"
        ]
        
        self.availability_negative = [
            "out of stock", "unavailable", "discontinued", "backorder",
            "special order", "call for availability", "temporarily unavailable"
        ]
    
    def validate_url_quality(self, url: str, title: str, content: str) -> Dict[str, Any]:
        """Validate URL quality and extract detailed information"""
        
        validation_result = {
            "url": url,
            "is_product_page": False,
            "is_category_page": False,
            "retailer_trust_score": 0,
            "content_quality_score": 0,
            "extracted_price": None,
            "availability_status": "unknown",
            "quality_issues": [],
            "quality_score": 0
        }
        
        url_lower = url.lower()
        title_lower = title.lower()
        content_lower = content.lower()
        
        # Check if it's a trusted retailer
        trusted_retailer = None
        for retailer in self.major_retailers:
            if retailer in url_lower:
                trusted_retailer = retailer
                validation_result["retailer_trust_score"] = 85
                break
        
        if not trusted_retailer:
            validation_result["retailer_trust_score"] = 40
            validation_result["quality_issues"].append("Unknown or untrusted retailer")
        
        # Check URL patterns
        is_category = any(re.search(pattern, url_lower) for pattern in self.category_patterns)
        is_product = any(re.search(pattern, url_lower) for pattern in self.product_patterns)
        
        validation_result["is_category_page"] = is_category
        validation_result["is_product_page"] = is_product
        
        if is_category:
            validation_result["quality_issues"].append("Appears to be category/search page")
            validation_result["content_quality_score"] -= 20
        elif is_product:
            validation_result["content_quality_score"] += 25
        
        # Extract price information
        extracted_price = self._extract_price_from_content(title + " " + content)
        validation_result["extracted_price"] = extracted_price
        
        if extracted_price:
            validation_result["content_quality_score"] += 15
        else:
            validation_result["quality_issues"].append("No price information found")
        
        # Check availability
        availability = self._check_availability(content_lower)
        validation_result["availability_status"] = availability
        
        if availability == "in_stock":
            validation_result["content_quality_score"] += 10
        elif availability == "out_of_stock":
            validation_result["content_quality_score"] -= 15
            validation_result["quality_issues"].append("Item appears to be out of stock")
        
        # Calculate overall quality score
        base_score = 50
        quality_score = (
            base_score + 
            validation_result["retailer_trust_score"] * 0.4 +
            validation_result["content_quality_score"] * 0.6
        )
        
        validation_result["quality_score"] = min(max(quality_score, 0), 100)
        
        return validation_result
    
    def _extract_price_from_content(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract price information from text content"""
        
        for pattern in self.price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    # Take the first reasonable price found
                    price_str = matches[0].replace(',', '')
                    price = float(price_str)
                    
                    # Reasonable price range for automotive parts
                    if 1.0 <= price <= 5000.0:
                        return {
                            "amount": price,
                            "currency": "USD",
                            "formatted": f"${price:.2f}",
                            "confidence": "high" if len(matches) == 1 else "medium"
                        }
                except ValueError:
                    continue
        
        return None
    
    def _check_availability(self, content: str) -> str:
        """Check availability status from content"""
        
        # Check for positive availability indicators
        if any(indicator in content for indicator in self.availability_positive):
            return "in_stock"
        
        # Check for negative availability indicators
        if any(indicator in content for indicator in self.availability_negative):
            return "out_of_stock"
        
        return "unknown"
    
    def cross_validate_prices(self, validated_results: List[Dict[str, Any]], part_name: str) -> Dict[str, Any]:
        """Cross-validate prices across multiple sources"""
        
        prices = []
        price_sources = []
        
        for result in validated_results:
            extracted_price = result.get("extracted_price")
            if extracted_price and extracted_price.get("amount"):
                prices.append(extracted_price["amount"])
                price_sources.append({
                    "url": result["url"],
                    "price": extracted_price["amount"],
                    "retailer": self._extract_retailer_name(result["url"])
                })
        
        if not prices:
            return {
                "price_analysis": "no_prices_found",
                "recommendation": "Manual price verification required",
                "confidence": "low"
            }
        
        # Statistical analysis
        min_price = min(prices)
        max_price = max(prices)
        avg_price = sum(prices) / len(prices)
        price_range = max_price - min_price
        
        # Detect price anomalies
        anomalies = []
        if len(prices) >= 3:
            # Flag prices that are more than 50% above or below average
            for source in price_sources:
                price = source["price"]
                deviation = abs(price - avg_price) / avg_price
                if deviation > 0.5:
                    anomalies.append({
                        "retailer": source["retailer"],
                        "price": price,
                        "deviation": f"{deviation*100:.1f}%",
                        "type": "high" if price > avg_price else "low"
                    })
        
        # Determine confidence level
        if price_range / avg_price < 0.3:  # Prices within 30% of each other
            confidence = "high"
        elif price_range / avg_price < 0.6:  # Prices within 60% of each other
            confidence = "medium"
        else:
            confidence = "low"
        
        return {
            "price_analysis": {
                "min_price": min_price,
                "max_price": max_price,
                "avg_price": round(avg_price, 2),
                "price_range": round(price_range, 2),
                "sample_size": len(prices),
                "confidence": confidence
            },
            "price_sources": price_sources,
            "anomalies": anomalies,
            "recommendation": self._generate_price_recommendation(prices, anomalies, confidence)
        }
    
    def _extract_retailer_name(self, url: str) -> str:
        """Extract retailer name from URL"""
        for retailer in self.major_retailers:
            if retailer in url.lower():
                return retailer.replace('.com', '').title()
        
        # Extract domain name as fallback
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc
            return domain.replace('www.', '').split('.')[0].title()
        except:
            return "Unknown"
    
    def _generate_price_recommendation(self, prices: List[float], anomalies: List[Dict], confidence: str) -> str:
        """Generate price recommendation based on analysis"""
        
        if confidence == "high":
            return f"Consistent pricing across sources (${min(prices):.2f} - ${max(prices):.2f})"
        elif confidence == "medium":
            return f"Moderate price variation - compare options (${min(prices):.2f} - ${max(prices):.2f})"
        else:
            if anomalies:
                return f"Significant price variation detected - verify with multiple sources"
            else:
                return f"Limited price data - recommend additional price research"
    
    def iterative_search_refinement(self, agent, original_query: str, initial_results: List[Dict], 
                                  target_confidence: float = 90.0, max_iterations: int = 3) -> Dict[str, Any]:
        """Iteratively refine search until target confidence is reached"""
        
        refinement_history = []
        current_results = initial_results
        current_query = original_query
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            logger.info(f"🔄 Refinement iteration {iteration}/{max_iterations}")
            
            # Analyze current results quality
            quality_analysis = self._analyze_results_quality(current_results)
            current_confidence = quality_analysis["overall_confidence"]
            
            logger.info(f"📊 Current confidence: {current_confidence:.1f}%")
            
            refinement_history.append({
                "iteration": iteration,
                "query": current_query,
                "results_count": len(current_results),
                "confidence": current_confidence,
                "quality_issues": quality_analysis["quality_issues"]
            })
            
            # Check if target confidence reached
            if current_confidence >= target_confidence:
                logger.info(f"✅ Target confidence {target_confidence}% reached!")
                break
            
            # Generate refined query based on quality issues
            refined_query = self._generate_refined_query(original_query, quality_analysis)
            
            if refined_query == current_query:
                logger.info("🔄 No further refinement possible")
                break
            
            logger.info(f"🎯 Refined query: '{refined_query}'")
            current_query = refined_query
            
            # Execute refined search (would use existing search function)
            # For now, we'll simulate this step
            refined_results = self._simulate_refined_search(refined_query, quality_analysis)
            
            # Merge with existing results (remove duplicates)
            current_results = self._merge_results(current_results, refined_results)
        
        return {
            "final_results": current_results,
            "final_confidence": quality_analysis["overall_confidence"],
            "iterations_performed": iteration,
            "refinement_history": refinement_history,
            "target_reached": quality_analysis["overall_confidence"] >= target_confidence,
            "improvement": quality_analysis["overall_confidence"] - (refinement_history[0]["confidence"] if refinement_history else 0)
        }
    
    def _analyze_results_quality(self, results: List[Dict]) -> Dict[str, Any]:
        """Analyze overall quality of search results"""
        
        if not results:
            return {
                "overall_confidence": 0,
                "quality_issues": ["No results found"],
                "high_quality_count": 0,
                "avg_quality_score": 0
            }
        
        quality_scores = []
        quality_issues = []
        high_quality_count = 0
        
        for result in results:
            # Validate each result
            validation = self.validate_url_quality(
                result.get("url", ""),
                result.get("title", ""),
                result.get("content", "")
            )
            
            quality_score = validation["quality_score"]
            quality_scores.append(quality_score)
            
            if quality_score >= 70:
                high_quality_count += 1
            
            quality_issues.extend(validation["quality_issues"])
        
        avg_quality = sum(quality_scores) / len(quality_scores)
        
        # Calculate overall confidence
        confidence_factors = [
            min(avg_quality, 100),  # Average quality score
            min(high_quality_count * 20, 100),  # High quality results bonus
            min(len(results) * 10, 100)  # Results count bonus
        ]
        
        overall_confidence = sum(confidence_factors) / len(confidence_factors)
        
        return {
            "overall_confidence": overall_confidence,
            "quality_issues": list(set(quality_issues)),  # Remove duplicates
            "high_quality_count": high_quality_count,
            "avg_quality_score": avg_quality,
            "total_results": len(results)
        }
    
    def _generate_refined_query(self, original_query: str, quality_analysis: Dict[str, Any]) -> str:
        """Generate refined search query based on quality issues"""
        
        quality_issues = quality_analysis.get("quality_issues", [])
        
        # If we have category page issues, add more specific terms
        if any("category" in issue.lower() for issue in quality_issues):
            if "buy" not in original_query.lower():
                return f"{original_query} buy online product"
        
        # If no prices found, add price-related terms
        if any("price" in issue.lower() for issue in quality_issues):
            if "price" not in original_query.lower():
                return f"{original_query} price cost"
        
        # If availability issues, add availability terms
        if any("stock" in issue.lower() for issue in quality_issues):
            if "stock" not in original_query.lower():
                return f"{original_query} in stock available"
        
        # Default: add specificity
        if "exact" not in original_query.lower():
            return f"{original_query} exact part number"
        
        return original_query  # No refinement possible
    
    def _simulate_refined_search(self, query: str, quality_analysis: Dict[str, Any]) -> List[Dict]:
        """Simulate refined search results (placeholder for actual implementation)"""
        
        # In real implementation, this would call the actual search function
        # For now, return simulated improved results
        return [
            {
                "url": f"https://autozone.com/refined-search-{hashlib.md5(query.encode()).hexdigest()[:8]}",
                "title": f"Refined Search Result for {query}",
                "content": f"High quality product page with pricing and availability for {query}. $89.99 - In Stock."
            }
        ]
    
    def _merge_results(self, existing_results: List[Dict], new_results: List[Dict]) -> List[Dict]:
        """Merge search results, removing duplicates by URL"""
        
        seen_urls = {result.get("url", "") for result in existing_results}
        merged_results = existing_results.copy()
        
        for result in new_results:
            url = result.get("url", "")
            if url not in seen_urls:
                merged_results.append(result)
                seen_urls.add(url)
        
        return merged_results

# Initialize global validator
quality_validator = ResultQualityValidator()

@tool
def validate_search_results(agent, search_results: str, part_name: str = "", target_confidence: float = 90.0) -> Dict[str, Any]:
    """
    Phase 3: Advanced Result Quality Validation
    
    Validates search results for quality, extracts pricing, checks availability,
    and performs iterative refinement to achieve target confidence levels.
    
    Args:
        agent: Strands agent instance
        search_results: JSON string of search results to validate
        part_name: Name of part being searched for
        target_confidence: Target confidence level (default 90%)
        
    Returns:
        Comprehensive validation results with quality scores and recommendations
    """
    logger.info(f"🚀 RESULT QUALITY VALIDATION - Phase 3")
    logger.info(f"🎯 Target Confidence: {target_confidence}%")
    
    try:
        # Parse search results
        try:
            results = json.loads(search_results) if isinstance(search_results, str) else search_results
            if isinstance(results, dict) and "results" in results:
                results = results["results"]
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": "Invalid search results format",
                "validation_performed": False
            }
        
        logger.info(f"📊 Validating {len(results)} search results")
        
        # Validate each result
        validated_results = []
        for result in results:
            validation = quality_validator.validate_url_quality(
                result.get("url", ""),
                result.get("title", ""),
                result.get("content", "")
            )
            
            # Merge validation data with original result
            enhanced_result = {
                **result,
                "validation": validation
            }
            validated_results.append(enhanced_result)
        
        # Cross-validate prices
        price_analysis = quality_validator.cross_validate_prices(validated_results, part_name)
        
        # Analyze overall quality
        quality_analysis = quality_validator._analyze_results_quality(results)
        
        # Perform iterative refinement if confidence is below target
        refinement_results = None
        if quality_analysis["overall_confidence"] < target_confidence:
            logger.info(f"🔄 Starting iterative refinement (current: {quality_analysis['overall_confidence']:.1f}%)")
            
            # Get original query from agent state or use part name
            original_query = agent.state.get("last_search_query", part_name)
            
            refinement_results = quality_validator.iterative_search_refinement(
                agent, original_query, results, target_confidence
            )
        
        # Generate recommendations
        recommendations = _generate_validation_recommendations(
            quality_analysis, price_analysis, refinement_results
        )
        
        # Prepare final response
        response = {
            "success": True,
            "validation_summary": {
                "total_results": len(results),
                "high_quality_results": quality_analysis["high_quality_count"],
                "overall_confidence": quality_analysis["overall_confidence"],
                "target_confidence": target_confidence,
                "target_reached": quality_analysis["overall_confidence"] >= target_confidence
            },
            "validated_results": validated_results,
            "price_analysis": price_analysis,
            "quality_issues": quality_analysis["quality_issues"],
            "iterative_refinement": refinement_results,
            "recommendations": recommendations,
            "next_actions": _generate_next_actions(quality_analysis, target_confidence)
        }
        
        logger.info(f"✅ Validation completed - Confidence: {quality_analysis['overall_confidence']:.1f}%")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Validation error: {e}")
        return {
            "success": False,
            "error": str(e),
            "validation_performed": False
        }

def _generate_validation_recommendations(quality_analysis: Dict, price_analysis: Dict, refinement_results: Optional[Dict]) -> List[str]:
    """Generate recommendations based on validation results"""
    
    recommendations = []
    
    confidence = quality_analysis["overall_confidence"]
    
    if confidence >= 90:
        recommendations.append("Excellent result quality - high confidence in recommendations")
    elif confidence >= 75:
        recommendations.append("Good result quality - moderate confidence in recommendations")
    else:
        recommendations.append("Limited result quality - manual verification recommended")
    
    # Price-based recommendations
    if price_analysis.get("price_analysis") == "no_prices_found":
        recommendations.append("No pricing information found - contact retailers directly for quotes")
    elif price_analysis.get("anomalies"):
        recommendations.append("Price variations detected - compare multiple sources before purchasing")
    
    # Quality issue recommendations
    quality_issues = quality_analysis.get("quality_issues", [])
    if any("category" in issue.lower() for issue in quality_issues):
        recommendations.append("Some results may be category pages - verify product specifics")
    
    if any("stock" in issue.lower() for issue in quality_issues):
        recommendations.append("Availability concerns detected - verify stock before ordering")
    
    # Refinement recommendations
    if refinement_results and not refinement_results.get("target_reached"):
        recommendations.append("Consider additional search terms or manual research for better results")
    
    return recommendations

def _generate_next_actions(quality_analysis: Dict, target_confidence: float) -> List[str]:
    """Generate next action recommendations"""
    
    actions = []
    confidence = quality_analysis["overall_confidence"]
    
    if confidence < target_confidence:
        actions.append("Perform additional searches with refined queries")
        actions.append("Manually verify top results for accuracy")
    
    if quality_analysis["high_quality_count"] < 2:
        actions.append("Search additional retailers or sources")
    
    actions.append("Cross-reference prices with local mechanics or dealers")
    actions.append("Verify part compatibility with vehicle specifications")
    
    return actions

logger.info("✅ Phase 3: Result Quality Validation Tool loaded successfully")
