"""
Cost Estimation Agent Tool
This tool allows the AI agent to populate cost estimation data during conversations
"""

import json
import boto3
from typing import Dict, Any, List, Optional
from datetime import datetime
from decimal import Decimal
import uuid
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

class CostEstimationAgentTool:
    """
    Agent tool for collecting and structuring cost estimation data during AI conversations
    """
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        # Use environment variables for table names
        import os
        self.estimation_data_table = self.dynamodb.Table(os.environ.get('COST_ESTIMATION_DATA_TABLE', 'CostEstimationData'))
        self.conversation_table = self.dynamodb.Table(os.environ.get('CONVERSATION_TABLE', 'ConversationTable'))
    
    def capture_diagnostic_findings(self, 
                                  conversation_id: str,
                                  vehicle_info: Dict[str, Any],
                                  diagnostic_findings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Capture diagnostic findings from AI agent analysis
        
        Args:
            conversation_id: Current conversation ID
            vehicle_info: Vehicle details (year, make, model, etc.)
            diagnostic_findings: AI agent's diagnostic analysis
                {
                    "primary_issue": "Brake pads worn",
                    "severity": "medium",
                    "urgency": "moderate", 
                    "symptoms": ["squealing noise", "reduced braking"],
                    "root_cause": "Normal wear and tear",
                    "confidence_level": 85
                }
        """
        try:
            data_id = f"DIAG-{conversation_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            diagnostic_data = {
                'dataId': data_id,
                'conversationId': conversation_id,
                'dataType': 'diagnostic_findings',
                'vehicleInfo': vehicle_info,
                'diagnosticFindings': diagnostic_findings,
                'timestamp': datetime.now().isoformat(),
                'ttl': int((datetime.now().timestamp() + 86400 * 30))  # 30 days TTL
            }
            
            self.estimation_data_table.put_item(Item=diagnostic_data)
            
            return {
                'success': True,
                'dataId': data_id,
                'message': 'Diagnostic findings captured successfully'
            }
            
        except Exception as e:
            logger.error(f"Error capturing diagnostic findings: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def capture_repair_recommendations(self,
                                     conversation_id: str,
                                     repair_recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Capture specific repair recommendations from AI agent
        
        Args:
            conversation_id: Current conversation ID
            repair_recommendations: List of specific repair recommendations
                [
                    {
                        "component": "brake pads",
                        "action": "replace",
                        "priority": "high",
                        "description": "Replace front brake pads due to wear",
                        "estimated_labor_hours": 1.5,
                        "difficulty": "moderate",
                        "tools_required": ["jack", "lug wrench", "brake tool"],
                        "safety_notes": ["Use proper jack stands"]
                    }
                ]
        """
        try:
            data_id = f"REPAIR-{conversation_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            repair_data = {
                'dataId': data_id,
                'conversationId': conversation_id,
                'dataType': 'repair_recommendations',
                'repairRecommendations': repair_recommendations,
                'timestamp': datetime.now().isoformat(),
                'ttl': int((datetime.now().timestamp() + 86400 * 30))  # 30 days TTL
            }
            
            self.estimation_data_table.put_item(Item=repair_data)
            
            return {
                'success': True,
                'dataId': data_id,
                'message': f'Captured {len(repair_recommendations)} repair recommendations'
            }
            
        except Exception as e:
            logger.error(f"Error capturing repair recommendations: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def capture_parts_information(self,
                                conversation_id: str,
                                parts_information: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Capture specific parts information from AI agent research
        
        Args:
            conversation_id: Current conversation ID
            parts_information: Detailed parts information from AI research
                [
                    {
                        "part_name": "Front Brake Pads",
                        "part_number": "D1092",
                        "vehicle_compatibility": "2014 Honda Civic LX",
                        "estimated_price": 45.99,
                        "retailer": "AutoZone",
                        "retailer_url": "https://autozone.com/...",
                        "quality_tier": "OEM Equivalent",
                        "warranty": "1 year/12,000 miles",
                        "brand": "Wagner",
                        "specifications": {
                            "material": "ceramic",
                            "noise_level": "low"
                        }
                    }
                ]
        """
        try:
            data_id = f"PARTS-{conversation_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Convert prices to Decimal for DynamoDB
            processed_parts = []
            for part in parts_information:
                processed_part = part.copy()
                if 'estimated_price' in processed_part:
                    processed_part['estimated_price'] = Decimal(str(processed_part['estimated_price']))
                processed_parts.append(processed_part)
            
            parts_data = {
                'dataId': data_id,
                'conversationId': conversation_id,
                'dataType': 'parts_information',
                'partsInformation': processed_parts,
                'timestamp': datetime.now().isoformat(),
                'ttl': int((datetime.now().timestamp() + 86400 * 30))  # 30 days TTL
            }
            
            self.estimation_data_table.put_item(Item=parts_data)
            
            return {
                'success': True,
                'dataId': data_id,
                'message': f'Captured {len(parts_information)} parts information entries'
            }
            
        except Exception as e:
            logger.error(f"Error capturing parts information: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def capture_labor_estimates(self,
                              conversation_id: str,
                              labor_estimates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Capture labor time estimates from AI agent analysis
        
        Args:
            conversation_id: Current conversation ID
            labor_estimates: Labor time estimates for each repair task
                [
                    {
                        "task": "Replace front brake pads",
                        "estimated_hours": 1.5,
                        "difficulty_level": "moderate",
                        "skill_required": "intermediate",
                        "special_tools": ["brake caliper tool"],
                        "shop_rate_category": "standard"
                    }
                ]
        """
        try:
            data_id = f"LABOR-{conversation_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Convert hours to Decimal for DynamoDB
            processed_labor = []
            for labor in labor_estimates:
                processed_labor_item = labor.copy()
                if 'estimated_hours' in processed_labor_item:
                    processed_labor_item['estimated_hours'] = Decimal(str(processed_labor_item['estimated_hours']))
                processed_labor.append(processed_labor_item)
            
            labor_data = {
                'dataId': data_id,
                'conversationId': conversation_id,
                'dataType': 'labor_estimates',
                'laborEstimates': processed_labor,
                'timestamp': datetime.now().isoformat(),
                'ttl': int((datetime.now().timestamp() + 86400 * 30))  # 30 days TTL
            }
            
            self.estimation_data_table.put_item(Item=labor_data)
            
            return {
                'success': True,
                'dataId': data_id,
                'message': f'Captured {len(labor_estimates)} labor estimates'
            }
            
        except Exception as e:
            logger.error(f"Error capturing labor estimates: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_conversation_estimation_data(self, conversation_id: str) -> Dict[str, Any]:
        """
        Retrieve all cost estimation data for a conversation
        
        Args:
            conversation_id: Conversation ID to retrieve data for
            
        Returns:
            Structured data for cost estimation generation
        """
        try:
            # Query all data for this conversation
            response = self.estimation_data_table.query(
                IndexName='ConversationIndex',  # Assuming we have a GSI
                KeyConditionExpression='conversationId = :conv_id',
                ExpressionAttributeValues={':conv_id': conversation_id}
            )
            
            # Organize data by type
            organized_data = {
                'diagnostic_findings': [],
                'repair_recommendations': [],
                'parts_information': [],
                'labor_estimates': []
            }
            
            for item in response.get('Items', []):
                data_type = item.get('dataType')
                if data_type in organized_data:
                    organized_data[data_type].append(item)
            
            return {
                'success': True,
                'conversationId': conversation_id,
                'data': organized_data,
                'total_entries': len(response.get('Items', []))
            }
            
        except Exception as e:
            logger.error(f"Error retrieving conversation estimation data: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

def lambda_handler(event, context):
    """Lambda handler for cost estimation agent tool"""
    
    tool = CostEstimationAgentTool()
    
    try:
        # Parse request
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        operation = body.get('operation')
        
        if operation == 'capture_diagnostic_findings':
            result = tool.capture_diagnostic_findings(
                conversation_id=body['conversationId'],
                vehicle_info=body['vehicleInfo'],
                diagnostic_findings=body['diagnosticFindings']
            )
        elif operation == 'capture_repair_recommendations':
            result = tool.capture_repair_recommendations(
                conversation_id=body['conversationId'],
                repair_recommendations=body['repairRecommendations']
            )
        elif operation == 'capture_parts_information':
            result = tool.capture_parts_information(
                conversation_id=body['conversationId'],
                parts_information=body['partsInformation']
            )
        elif operation == 'capture_labor_estimates':
            result = tool.capture_labor_estimates(
                conversation_id=body['conversationId'],
                labor_estimates=body['laborEstimates']
            )
        elif operation == 'get_conversation_data':
            result = tool.get_conversation_estimation_data(
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
            'body': json.dumps(result, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error in cost estimation agent tool: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
