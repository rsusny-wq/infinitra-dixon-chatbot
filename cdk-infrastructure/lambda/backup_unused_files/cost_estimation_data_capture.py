"""
Cost Estimation Data Capture Enhancement
This module enhances existing tools to capture cost estimation data without conflicts
"""

import json
import boto3
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from decimal import Decimal
import os

logger = logging.getLogger(__name__)

class CostEstimationDataCapture:
    """
    Non-intrusive data capture for cost estimation
    Works alongside existing tools without conflicts
    """
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        # Use existing ConversationTable instead of creating new table
        self.table_name = os.environ.get('CONVERSATION_TABLE', 'DixonSmartRepairStack-ConversationTable75C14D21-BX3AEQ2Y54YM')
        
    def capture_search_results(self, conversation_id: str, search_query: str, 
                             search_results: Dict[str, Any], agent_state: Dict = None):
        """
        Capture search results from tavily_automotive_search for later cost estimation
        This runs in the background without affecting the tool's normal operation
        """
        try:
            # Only capture if this looks like a pricing/parts search
            if not self._is_pricing_search(search_query):
                return
                
            # Convert any float values to Decimal for DynamoDB compatibility
            processed_results = self._convert_floats_to_decimals(search_results)
            processed_agent_state = self._convert_floats_to_decimals(agent_state) if agent_state else None
                
            data_entry = {
                'conversationId': conversation_id,
                'timestamp': datetime.now().isoformat(),
                'dataType': 'search_results',
                'searchQuery': search_query,
                'searchResults': processed_results,
                'ttl': int(datetime.now().timestamp() + 86400 * 7)  # 7 days TTL
            }
            
            # Add agent state context if available
            if processed_agent_state:
                data_entry['agentContext'] = {
                    'vehicleInfo': processed_agent_state.get('vehicle_info', {}),
                    'diagnosticLevel': processed_agent_state.get('diagnostic_level', 'unknown')
                }
            
            # Store in DynamoDB (non-blocking)
            table = self.dynamodb.Table(self.table_name)
            table.put_item(Item=data_entry)
            
            logger.info(f"📊 Captured pricing search data for conversation: {conversation_id}")
            
        except Exception as e:
            # Don't let data capture errors affect the main tool
            logger.warning(f"⚠️ Failed to capture search data: {e}")
    
    def _convert_floats_to_decimals(self, obj):
        """Recursively convert float values to Decimal for DynamoDB compatibility"""
        if isinstance(obj, dict):
            return {key: self._convert_floats_to_decimals(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_floats_to_decimals(item) for item in obj]
        elif isinstance(obj, float):
            return Decimal(str(obj))
        else:
            return obj
    
    def _is_pricing_search(self, search_query: str) -> bool:
        """Check if search query is related to pricing/parts"""
        pricing_keywords = [
            'price', 'cost', 'estimate', 'parts', 'brake', 'oil', 'filter',
            'labor', 'repair', 'replacement', 'service', '$', 'dollar',
            'autozone', 'advance auto', 'napa', 'rockauto'
        ]
        
        query_lower = search_query.lower()
        return any(keyword in query_lower for keyword in pricing_keywords)
    
    def get_conversation_pricing_data(self, conversation_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve all pricing-related search data for a conversation
        Used by cost estimation service to get real AI research data
        """
        try:
            table = self.dynamodb.Table(self.table_name)
            
            response = table.query(
                KeyConditionExpression='conversationId = :conv_id',
                FilterExpression='dataType = :data_type',
                ExpressionAttributeValues={
                    ':conv_id': conversation_id,
                    ':data_type': 'search_results'
                }
            )
            
            return response.get('Items', [])
            
        except Exception as e:
            logger.error(f"❌ Failed to retrieve pricing data: {e}")
            return []
    
    def extract_parts_from_search_data(self, search_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract structured parts information from search results
        This is what the cost estimation service will use instead of hard-coded prices
        """
        extracted_parts = []
        
        for search_entry in search_data:
            search_results = search_entry.get('searchResults', {})
            search_query = search_entry.get('searchQuery', '')
            
            # Extract parts information from search results
            if 'results' in search_results:
                for result in search_results['results']:
                    part_info = self._extract_part_from_result(result, search_query)
                    if part_info:
                        extracted_parts.append(part_info)
        
        return extracted_parts
    
    def _extract_part_from_result(self, result: Dict[str, Any], search_query: str) -> Optional[Dict[str, Any]]:
        """
        Extract part information from a single search result
        This uses simple heuristics - the AI agent does the real intelligence
        """
        try:
            content = result.get('content', '').lower()
            title = result.get('title', '').lower()
            url = result.get('url', '')
            
            # Look for price patterns
            import re
            price_patterns = [
                r'\$(\d+\.?\d*)',
                r'(\d+\.?\d*)\s*dollars?',
                r'price:?\s*\$?(\d+\.?\d*)'
            ]
            
            prices = []
            for pattern in price_patterns:
                matches = re.findall(pattern, content + ' ' + title)
                for match in matches:
                    try:
                        price = float(match)
                        if 10 <= price <= 2000:  # Reasonable automotive part price range
                            prices.append(price)
                    except ValueError:
                        continue
            
            if not prices:
                return None
            
            # Determine part type from search query and content
            part_type = self._determine_part_type(search_query, content, title)
            
            # Determine retailer from URL
            retailer = self._determine_retailer(url)
            
            return {
                'partType': part_type,
                'estimatedPrice': Decimal(str(min(prices))),  # Use lowest price found
                'priceRange': {
                    'min': Decimal(str(min(prices))),
                    'max': Decimal(str(max(prices)))
                },
                'retailer': retailer,
                'url': url,
                'title': result.get('title', ''),
                'searchQuery': search_query,
                'extractedAt': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to extract part from result: {e}")
            return None
    
    def _determine_part_type(self, search_query: str, content: str, title: str) -> str:
        """Determine what type of part this is"""
        text = (search_query + ' ' + content + ' ' + title).lower()
        
        if any(word in text for word in ['brake', 'pad', 'rotor', 'caliper']):
            return 'brake_pads'
        elif any(word in text for word in ['oil', 'filter', 'change']):
            return 'oil_change'
        elif any(word in text for word in ['air filter', 'cabin filter']):
            return 'air_filter'
        elif any(word in text for word in ['spark plug', 'ignition']):
            return 'spark_plugs'
        elif any(word in text for word in ['battery', 'starter']):
            return 'battery_replacement'
        else:
            return 'general_repair'
    
    def _determine_retailer(self, url: str) -> str:
        """Determine retailer from URL"""
        url_lower = url.lower()
        
        if 'autozone' in url_lower:
            return 'AutoZone'
        elif 'advanceautoparts' in url_lower:
            return 'Advance Auto Parts'
        elif 'napaonline' in url_lower:
            return 'NAPA Auto Parts'
        elif 'rockauto' in url_lower:
            return 'RockAuto'
        elif 'amazon' in url_lower:
            return 'Amazon'
        else:
            return 'Unknown Retailer'

# Global instance for use by existing tools
cost_data_capture = CostEstimationDataCapture()
