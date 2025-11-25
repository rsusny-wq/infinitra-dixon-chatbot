"""
Phase 3.1: Enhanced Cost Estimation Service
CONFIRMED IMPLEMENTATION based on user decisions:
- Non-binding estimates with clear disclaimers
- AI estimates shown immediately to customers
- Subject to mechanic review and approval
- Full two-stage authorization system
- Uses existing AI agent retailer links
"""

import json
import boto3
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle Decimal objects from DynamoDB"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

class CostEstimationService:
    """
    Enhanced Cost Estimation Service for Phase 3.1
    Implements confirmed user requirements with two-stage authorization
    """
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        # Use environment variables for actual table names
        import os
        self.cost_estimates_table = self.dynamodb.Table(os.environ.get('COST_ESTIMATES_TABLE', 'CostEstimates'))
        self.mechanic_reviews_table = self.dynamodb.Table(os.environ.get('MECHANIC_REVIEWS_TABLE', 'MechanicReviews'))
        self.authorization_table = self.dynamodb.Table(os.environ.get('WORK_AUTHORIZATIONS_TABLE', 'WorkAuthorizations'))
    
    def generate_immediate_estimate_for_customer(self, 
                                               user_id: str,
                                               conversation_id: str,
                                               vehicle_info: Dict[str, Any],
                                               repair_items: List[Dict[str, Any]],
                                               selected_option: str,
                                               diagnostic_level: str,
                                               ai_retailer_links: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Generate AI estimate shown immediately to customer
        - Customer sees estimate right away
        - Estimate is non-binding with clear disclaimers
        - Uses retailer links already provided by AI agent
        - Creates mechanic approval task for work authorization
        """
        
        try:
            logger.info(f"Generating immediate estimate for conversation: {conversation_id}")
            
            # Generate unique estimate ID
            estimate_id = f"EST-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
            
            # Generate immediate customer-visible estimate
            customer_estimate = {
                'estimateId': estimate_id,
                'userId': user_id,  # Primary field for user-centric lookup
                'conversationId': conversation_id,  # Keep for reference/context
                'vehicleInfo': vehicle_info,
                'diagnosticLevel': diagnostic_level,
                'selectedOption': selected_option,
                'createdAt': datetime.utcnow().isoformat(),
                'status': 'shown_to_customer_pending_mechanic_approval',
                'customerVisible': True,  # Customer sees immediately
                'mechanicApprovalRequired': True,  # Requires approval before work
                'breakdown': {
                    'labor': self._calculate_labor_costs(repair_items, vehicle_info),
                    'parts': self._get_parts_with_ai_retailer_links(repair_items, selected_option, vehicle_info, ai_retailer_links or []),
                    'shopFees': self._calculate_shop_fees(repair_items),
                    'tax': 0,
                    'total': 0
                },
                'disclaimer': self._get_non_binding_disclaimer(diagnostic_level),
                'validUntil': (datetime.utcnow() + timedelta(days=7)).isoformat(),
                'confidence': self._calculate_estimate_confidence(diagnostic_level, repair_items),
                'authorizationStatus': {
                    'digitalApproval': False,
                    'inPersonAuthorization': False,
                    'partsCanBeOrdered': False,
                    'workCanBegin': False
                }
            }
            
            # Calculate totals
            subtotal = (customer_estimate['breakdown']['labor']['total'] + 
                       customer_estimate['breakdown']['parts']['total'] + 
                       customer_estimate['breakdown']['shopFees']['total'])
            
            customer_estimate['breakdown']['tax'] = Decimal(str(subtotal * Decimal('0.0875'))).quantize(Decimal('0.01'))  # 8.75% tax
            customer_estimate['breakdown']['total'] = Decimal(str(subtotal + customer_estimate['breakdown']['tax'])).quantize(Decimal('0.01'))
            
            # Store customer estimate
            self.cost_estimates_table.put_item(Item=customer_estimate)
            logger.info(f"Stored estimate: {estimate_id}")
            
            # Create mechanic approval task
            self._create_mechanic_approval_task(customer_estimate)
            
            return {
                'success': True,
                'customerEstimate': customer_estimate,
                'status': 'estimate_shown_to_customer',
                'message': 'Cost estimate provided to customer. Mechanic approval required before work authorization.',
                'nextStep': 'awaiting_mechanic_approval'
            }
            
        except Exception as e:
            logger.error(f"Error generating estimate: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_labor_costs(self, repair_items: List[Dict[str, Any]], vehicle_info: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate labor costs with hourly breakdown"""
        
        labor_rate = Decimal('120.00')  # $120/hour standard rate
        total_hours = 0
        labor_breakdown = []
        
        for item in repair_items:
            # Get labor time based on repair type and vehicle
            labor_time = self._get_labor_time(item.get('repairType', 'general_repair'), vehicle_info)
            labor_cost = labor_time * labor_rate
            
            labor_breakdown.append({
                'description': f"{item.get('repairType', 'General Repair')} - {vehicle_info.get('year', '')} {vehicle_info.get('make', '')} {vehicle_info.get('model', '')}".strip(),
                'hours': labor_time,
                'rate': labor_rate,
                'cost': Decimal(str(labor_cost)).quantize(Decimal('0.01')),
                'partNumber': f"LABOR-{item.get('repairType', 'GENERAL').upper().replace(' ', '-')}"
            })
            
            total_hours += labor_time
        
        return {
            'items': labor_breakdown,
            'totalHours': total_hours,
            'hourlyRate': labor_rate,
            'total': Decimal(str(total_hours * labor_rate)).quantize(Decimal('0.01'))
        }
    
    def _get_labor_time(self, repair_type: str, vehicle_info: Dict[str, Any]) -> float:
        """Get estimated labor time based on repair type and vehicle"""
        
        # Base labor times (in hours)
        base_times = {
            'brake_pads': Decimal('1.5'),
            'oil_change': Decimal('0.5'),
            'brake_service': Decimal('2.0'),
            'engine_diagnostic': Decimal('1.0'),
            'transmission_service': Decimal('3.0'),
            'air_filter': Decimal('0.25'),
            'spark_plugs': Decimal('1.0'),
            'battery_replacement': Decimal('0.5'),
            'general_repair': Decimal('1.0')
        }
        
        base_time = base_times.get(repair_type.lower().replace(' ', '_'), Decimal('1.0'))
        
        # Adjust for vehicle complexity
        year = int(vehicle_info.get('year', 2020))
        if year < 2000:
            base_time *= Decimal('1.2')  # Older vehicles take longer
        elif year > 2020:
            base_time *= Decimal('1.1')  # Newer vehicles may have more complex systems
        
        return base_time.quantize(Decimal('0.01'))
    
    def _get_parts_with_ai_retailer_links(self, repair_items: List[Dict[str, Any]], 
                                        selected_option: str, vehicle_info: Dict[str, Any],
                                        ai_retailer_links: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        ENHANCED: Use real AI research data instead of hard-coded prices
        - Gets actual parts data from AI agent's Tavily searches
        - Falls back to database if no research data available
        - Uses existing AI agent retailer links
        """
        
        parts_breakdown = []
        total_parts_cost = Decimal('0')
        
        # NEW: Try to get real AI research data first
        try:
            from cost_estimation_data_capture import cost_data_capture
            # Try to get conversation ID from repair items or vehicle info
            conversation_id = None
            for item in repair_items:
                if 'conversationId' in item:
                    conversation_id = item['conversationId']
                    break
            
            if not conversation_id and 'conversationId' in vehicle_info:
                conversation_id = vehicle_info['conversationId']
            
            if conversation_id:
                # Get actual AI research data
                search_data = cost_data_capture.get_conversation_pricing_data(conversation_id)
                extracted_parts = cost_data_capture.extract_parts_from_search_data(search_data)
                
                if extracted_parts:
                    logger.info(f"✅ Using real AI research data: {len(extracted_parts)} parts found")
                    return self._build_parts_from_ai_research(extracted_parts, selected_option, ai_retailer_links)
                else:
                    logger.info("ℹ️ No AI research data found, using fallback database")
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to get AI research data: {e}")
        
        # FALLBACK: Use existing hard-coded database (original logic)
        for i, item in enumerate(repair_items):
            # Use AI-provided retailer links if available
            retailer_link = ai_retailer_links[i] if i < len(ai_retailer_links) else None
            
            part_info = self._generate_part_info_with_ai_links(
                item.get('repairType', 'general_repair'), 
                vehicle_info, 
                selected_option, 
                retailer_link
            )
            
            if part_info:
                parts_breakdown.append(part_info)
                total_parts_cost += part_info['cost']
        
        return {
            'items': parts_breakdown,
            'selectedOption': selected_option,
            'total': Decimal(str(total_parts_cost)).quantize(Decimal('0.01')),
            'retailerLinksSource': 'ai_agent'  # Source tracking
        }
    
    def _build_parts_from_ai_research(self, extracted_parts: List[Dict[str, Any]], 
                                    selected_option: str, 
                                    ai_retailer_links: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Build parts breakdown from real AI research data
        """
        parts_breakdown = []
        total_parts_cost = Decimal('0')
        
        for i, part_data in enumerate(extracted_parts):
            # Use AI-provided retailer links if available, otherwise use extracted data
            retailer_link = ai_retailer_links[i] if i < len(ai_retailer_links) else None
            
            part_info = {
                'description': f"{selected_option.replace('_', ' ').title()} {part_data['partType'].replace('_', ' ').title()} Parts",
                'partNumber': f"AI-RESEARCH-{part_data['partType'].upper()}",
                'cost': part_data['estimatedPrice'],
                'priceRange': part_data.get('priceRange', {}),
                'warranty': self._estimate_warranty_from_price(part_data['estimatedPrice']),
                'retailerUrl': retailer_link.get('url') if retailer_link else part_data.get('url', ''),
                'retailerName': retailer_link.get('name') if retailer_link else part_data.get('retailer', 'Research Result'),
                'option': selected_option.replace('_', ' ').title(),
                'dataSource': 'ai_research',  # Track that this came from real AI research
                'searchQuery': part_data.get('searchQuery', ''),
                'extractedAt': part_data.get('extractedAt', '')
            }
            
            parts_breakdown.append(part_info)
            total_parts_cost += part_data['estimatedPrice']
        
        return {
            'items': parts_breakdown,
            'selectedOption': selected_option,
            'total': total_parts_cost.quantize(Decimal('0.01')),
            'retailerLinksSource': 'ai_research',  # Source tracking
            'dataQuality': 'high_confidence'  # Real AI research data
        }
    
    def _estimate_warranty_from_price(self, price: Decimal) -> str:
        """Estimate warranty based on price range (simple heuristic)"""
        if price >= Decimal('100'):
            return '2 years/24,000 miles'
        elif price >= Decimal('50'):
            return '1 year/12,000 miles'
        else:
            return '6 months/6,000 miles'
    
    def _generate_part_info_with_ai_links(self, repair_type: str, vehicle_info: Dict[str, Any], 
                                        option: str, retailer_link: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate specific part information with AI-provided links"""
        
        # Base part pricing database
        part_database = {
            'brake_pads': {
                'oem': {'price': Decimal('89.99'), 'warranty': '2 years/24,000 miles'},
                'oem_equivalent': {'price': Decimal('64.99'), 'warranty': '1 year/12,000 miles'},
                'budget': {'price': Decimal('39.99'), 'warranty': '6 months/6,000 miles'}
            },
            'oil_change': {
                'oem': {'price': Decimal('34.99'), 'warranty': 'Manufacturer warranty'},
                'oem_equivalent': {'price': Decimal('24.99'), 'warranty': '1 year'},
                'budget': {'price': Decimal('19.99'), 'warranty': '6 months'}
            },
            'brake_service': {
                'oem': {'price': Decimal('159.99'), 'warranty': '2 years/24,000 miles'},
                'oem_equivalent': {'price': Decimal('119.99'), 'warranty': '1 year/12,000 miles'},
                'budget': {'price': Decimal('79.99'), 'warranty': '6 months/6,000 miles'}
            },
            'general_repair': {
                'oem': {'price': Decimal('99.99'), 'warranty': '1 year'},
                'oem_equivalent': {'price': Decimal('74.99'), 'warranty': '1 year'},
                'budget': {'price': Decimal('49.99'), 'warranty': '6 months'}
            }
        }
        
        # Get part info based on repair type and option
        part_key = repair_type.lower().replace(' ', '_')
        if part_key in part_database and option in part_database[part_key]:
            part_data = part_database[part_key][option]
            
            # Use AI-provided retailer link if available, otherwise generate generic
            retailer_url = retailer_link.get('url', 'https://www.autozone.com') if retailer_link else 'https://www.autozone.com'
            retailer_name = retailer_link.get('name', 'AutoZone') if retailer_link else 'AutoZone'
            
            return {
                'description': f"{option.replace('_', ' ').title()} {repair_type.replace('_', ' ').title()} Parts",
                'partNumber': f"{part_key.upper()}-{option.upper()}-{vehicle_info.get('make', 'GEN')[:3]}",
                'cost': part_data['price'],
                'warranty': part_data['warranty'],
                'retailerUrl': retailer_url,
                'retailerName': retailer_name,
                'option': option.replace('_', ' ').title()
            }
        
        return None
    
    def _calculate_shop_fees(self, repair_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate shop supplies and fees"""
        
        base_fee = Decimal('15.00')  # Base shop supplies fee
        
        return {
            'items': [
                {
                    'description': 'Shop Supplies & Disposal Fees',
                    'cost': base_fee
                }
            ],
            'total': base_fee
        }
    
    def _get_non_binding_disclaimer(self, diagnostic_level: str) -> str:
        """Non-binding disclaimer based on user decision"""
        
        base_disclaimer = """
⚠️ **NON-BINDING COST ESTIMATE**

This estimate is provided for informational purposes only and is NOT a binding quote.

**Important Notes:**
• Final pricing subject to vehicle inspection and mechanic approval
• Parts pricing may vary based on availability and market conditions
• Labor time may vary based on actual vehicle condition
• Additional work may be discovered during service
• Estimate valid for 7 days from generation date

**Next Steps:**
1. Mechanic will review and approve this estimate
2. You can provide digital approval to allow parts ordering
3. Visit shop for final work authorization

Dixon Smart Repair reserves the right to adjust pricing based on actual service requirements.
        """.strip()
        
        confidence_note = {
            'generic': "\n\n**Accuracy Note:** Based on general vehicle information - actual costs may vary significantly.",
            'basic': "\n\n**Accuracy Note:** Based on your vehicle's make/model/year - good accuracy expected.",
            'vin': "\n\n**Accuracy Note:** Based on your specific VIN - high accuracy expected."
        }
        
        return base_disclaimer + confidence_note.get(diagnostic_level, confidence_note['generic'])
    
    def _calculate_estimate_confidence(self, diagnostic_level: str, repair_items: List[Dict[str, Any]]) -> int:
        """Calculate confidence percentage based on available information"""
        
        base_confidence = {
            'generic': 65,
            'basic': 80,
            'vin': 95
        }
        
        return base_confidence.get(diagnostic_level, 65)
    
    def _create_mechanic_approval_task(self, customer_estimate: Dict[str, Any]):
        """Create mechanic approval task (not review task)"""
        
        approval_task = {
            'approvalId': f"APPR-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}",
            'estimateId': customer_estimate['estimateId'],
            'conversationId': customer_estimate['conversationId'],
            'vehicleInfo': customer_estimate['vehicleInfo'],
            'customerEstimate': customer_estimate['breakdown'],
            'status': 'pending_mechanic_approval',
            'priority': 'normal',
            'createdAt': datetime.utcnow().isoformat(),
            'assignedMechanic': None,
            'approvalInstructions': [
                'Review AI-generated cost estimate for accuracy',
                'Verify labor time estimates are realistic',
                'Confirm parts pricing and availability',
                'Check for any additional work that may be needed',
                'Approve or adjust estimate before customer work authorization'
            ]
        }
        
        self.mechanic_reviews_table.put_item(Item=approval_task)
        logger.info(f"Created mechanic approval task: {approval_task['approvalId']}")
    
    def get_user_cost_estimates(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Get all cost estimates for a user (user-centric approach)"""
        
        try:
            # Query estimates by user ID using GSI
            response = self.cost_estimates_table.query(
                IndexName='UserIndex',  # GSI on userId
                KeyConditionExpression='userId = :user_id',
                ExpressionAttributeValues={':user_id': user_id},
                ScanIndexForward=False,  # Get most recent first
                Limit=limit
            )
            
            estimates = response.get('Items', [])
            
            return {
                'success': True,
                'estimates': estimates,
                'count': len(estimates)
            }
                
        except Exception as e:
            logger.error(f"Error getting user estimates: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'estimates': [],
                'count': 0
            }
    
    def get_estimate_by_id(self, estimate_id: str) -> Dict[str, Any]:
        """Get a specific estimate by its ID"""
        
        try:
            response = self.cost_estimates_table.get_item(
                Key={'estimateId': estimate_id}
            )
            
            if 'Item' in response:
                return {
                    'success': True,
                    'estimate': response['Item']
                }
            else:
                return {
                    'success': False,
                    'error': 'Estimate not found'
                }
                
        except Exception as e:
            logger.error(f"Error getting estimate by ID: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_estimate_by_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """Get estimate by conversation ID (legacy method for backward compatibility)"""
        
        try:
            # Query estimates by conversation ID
            response = self.cost_estimates_table.query(
                IndexName='ConversationIndex',  # Assumes GSI exists
                KeyConditionExpression='conversationId = :conv_id',
                ExpressionAttributeValues={':conv_id': conversation_id},
                ScanIndexForward=False,  # Get most recent first
                Limit=1
            )
            
            if response['Items']:
                return {
                    'success': True,
                    'estimate': response['Items'][0]
                }
            else:
                return {
                    'success': False,
                    'error': 'No estimate found for conversation'
                }
                
        except Exception as e:
            logger.error(f"Error getting estimate: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


def lambda_handler(event, context):
    """Lambda handler for cost estimation service"""
    
    service = CostEstimationService()
    
    try:
        # Parse request
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        operation = body.get('operation')
        
        if operation == 'generate_estimate':
            result = service.generate_immediate_estimate_for_customer(
                user_id=body['userId'],
                conversation_id=body['conversationId'],
                vehicle_info=body['vehicleInfo'],
                repair_items=body['repairItems'],
                selected_option=body['selectedOption'],
                diagnostic_level=body['diagnosticLevel'],
                ai_retailer_links=body.get('aiRetailerLinks', [])
            )
        elif operation == 'get_user_estimates':
            result = service.get_user_cost_estimates(
                user_id=body['userId'],
                limit=body.get('limit', 10)
            )
        elif operation == 'get_estimate_by_id':
            result = service.get_estimate_by_id(
                estimate_id=body['estimateId']
            )
        elif operation == 'get_estimate':
            # Legacy operation for backward compatibility
            result = service.get_estimate_by_conversation(
                conversation_id=body['conversationId']
            )
        else:
            result = {
                'success': False,
                'error': f'Unknown operation: {operation}'
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps(result, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }, cls=DecimalEncoder)
        }
