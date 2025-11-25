#!/usr/bin/env python3
"""
Dixon Smart Repair - Vehicle Management Service
Handles vehicle CRUD operations for authenticated users
"""

import json
import logging
import time
import os
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Any, Optional
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger(__name__)

# AWS clients
dynamodb = boto3.resource('dynamodb')

# Table names from environment
VEHICLE_TABLE = os.environ.get('VEHICLE_TABLE')

class VehicleService:
    """
    Service class for handling vehicle management operations
    """
    
    def __init__(self):
        self.vehicle_table = dynamodb.Table(VEHICLE_TABLE)
    
    def convert_floats_to_decimal(self, obj):
        """Convert float values to Decimal for DynamoDB compatibility"""
        if isinstance(obj, float):
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {key: self.convert_floats_to_decimal(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_floats_to_decimal(item) for item in obj]
        else:
            return obj
    
    def convert_decimals_to_float(self, obj):
        """Convert Decimal values to float for JSON serialization"""
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {key: self.convert_decimals_to_float(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_decimals_to_float(item) for item in obj]
        else:
            return obj
    
    def add_user_vehicle(self, vehicle_input: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Add a new vehicle for the user
        """
        try:
            # Generate unique vehicle ID
            vehicle_id = f"vehicle-{int(time.time())}-{str(uuid.uuid4())[:8]}"
            
            # Create vehicle item
            now = datetime.utcnow().isoformat()
            vehicle_item = {
                'id': vehicle_id,  # Use 'id' as primary key to match existing table
                'vehicleId': vehicle_id,  # Keep vehicleId for GraphQL compatibility
                'userId': user_id,
                'make': vehicle_input['make'],
                'model': vehicle_input['model'],
                'year': vehicle_input['year'],
                'trim': vehicle_input.get('trim', ''),
                'vin': vehicle_input.get('vin', ''),
                'color': vehicle_input.get('color', ''),
                'mileage': vehicle_input.get('mileage', 0),
                'createdAt': now,
                'updatedAt': now,
                'lastUsed': now
            }
            
            # Convert floats to decimals for DynamoDB
            vehicle_item = self.convert_floats_to_decimal(vehicle_item)
            
            # Save to DynamoDB
            self.vehicle_table.put_item(Item=vehicle_item)
            
            logger.info(f"✅ Added vehicle {vehicle_id} for user {user_id}")
            
            return {
                'success': True,
                'vehicle': self.convert_decimals_to_float(vehicle_item)
            }
            
        except Exception as e:
            logger.error(f"❌ Error adding vehicle: {e}")
            return {
                'success': False,
                'error': f"Failed to add vehicle: {str(e)}"
            }
    
    def get_user_vehicles(self, user_id: str) -> Dict[str, Any]:
        """
        Get all vehicles for a user
        """
        try:
            # Query vehicles by user ID using existing GSI
            response = self.vehicle_table.query(
                IndexName='UserVehiclesIndex',  # Use existing GSI name
                KeyConditionExpression='userId = :userId',
                ExpressionAttributeValues={
                    ':userId': user_id
                }
            )
            
            vehicles = response.get('Items', [])
            
            # Sort by lastUsed (most recent first)
            vehicles.sort(key=lambda x: x.get('lastUsed', ''), reverse=True)
            
            logger.info(f"✅ Retrieved {len(vehicles)} vehicles for user {user_id}")
            
            return {
                'success': True,
                'vehicles': [self.convert_decimals_to_float(vehicle) for vehicle in vehicles]
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting user vehicles: {e}")
            return {
                'success': False,
                'error': f"Failed to get vehicles: {str(e)}"
            }
    
    def get_vehicle_by_id(self, vehicle_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get a specific vehicle by ID (with user verification)
        """
        try:
            # Get vehicle by ID using 'id' as primary key
            response = self.vehicle_table.get_item(
                Key={'id': vehicle_id}
            )
            
            if 'Item' not in response:
                return {
                    'success': False,
                    'error': 'Vehicle not found'
                }
            
            vehicle = response['Item']
            
            # Verify ownership
            if vehicle.get('userId') != user_id:
                return {
                    'success': False,
                    'error': 'Unauthorized access to vehicle'
                }
            
            logger.info(f"✅ Retrieved vehicle {vehicle_id} for user {user_id}")
            
            return {
                'success': True,
                'vehicle': self.convert_decimals_to_float(vehicle)
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting vehicle by ID: {e}")
            return {
                'success': False,
                'error': f"Failed to get vehicle: {str(e)}"
            }
    
    def update_user_vehicle(self, vehicle_id: str, vehicle_input: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Update an existing vehicle
        """
        try:
            # First verify the vehicle exists and belongs to the user
            existing_result = self.get_vehicle_by_id(vehicle_id, user_id)
            if not existing_result['success']:
                return existing_result
            
            # Update the vehicle
            now = datetime.utcnow().isoformat()
            update_expression = "SET #make = :make, #model = :model, #year = :year, updatedAt = :updatedAt, lastUsed = :lastUsed"
            expression_attribute_names = {
                '#make': 'make',
                '#model': 'model',
                '#year': 'year'
            }
            expression_attribute_values = {
                ':make': vehicle_input['make'],
                ':model': vehicle_input['model'],
                ':year': vehicle_input['year'],
                ':updatedAt': now,
                ':lastUsed': now
            }
            
            # Add optional fields if provided
            if 'trim' in vehicle_input:
                update_expression += ", trim = :trim"
                expression_attribute_values[':trim'] = vehicle_input['trim']
            
            if 'vin' in vehicle_input:
                update_expression += ", vin = :vin"
                expression_attribute_values[':vin'] = vehicle_input['vin']
            
            if 'color' in vehicle_input:
                update_expression += ", color = :color"
                expression_attribute_values[':color'] = vehicle_input['color']
            
            if 'mileage' in vehicle_input:
                update_expression += ", mileage = :mileage"
                expression_attribute_values[':mileage'] = vehicle_input['mileage']
            
            # Convert floats to decimals
            expression_attribute_values = self.convert_floats_to_decimal(expression_attribute_values)
            
            # Update the item using 'id' as primary key
            response = self.vehicle_table.update_item(
                Key={'id': vehicle_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues='ALL_NEW'
            )
            
            updated_vehicle = response['Attributes']
            
            logger.info(f"✅ Updated vehicle {vehicle_id} for user {user_id}")
            
            return {
                'success': True,
                'vehicle': self.convert_decimals_to_float(updated_vehicle)
            }
            
        except Exception as e:
            logger.error(f"❌ Error updating vehicle: {e}")
            return {
                'success': False,
                'error': f"Failed to update vehicle: {str(e)}"
            }
    
    def delete_user_vehicle(self, vehicle_id: str, user_id: str) -> Dict[str, Any]:
        """
        Delete a vehicle (with user verification)
        """
        try:
            # First verify the vehicle exists and belongs to the user
            existing_result = self.get_vehicle_by_id(vehicle_id, user_id)
            if not existing_result['success']:
                return existing_result
            
            # Delete the vehicle using 'id' as primary key
            self.vehicle_table.delete_item(
                Key={'id': vehicle_id}
            )
            
            logger.info(f"✅ Deleted vehicle {vehicle_id} for user {user_id}")
            
            return {
                'success': True
            }
            
        except Exception as e:
            logger.error(f"❌ Error deleting vehicle: {e}")
            return {
                'success': False,
                'error': f"Failed to delete vehicle: {str(e)}"
            }

# Initialize service
vehicle_service = VehicleService()

# Handler functions for GraphQL resolvers
def handle_add_user_vehicle(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle adding a new vehicle"""
    try:
        arguments = event.get('arguments', {})
        vehicle_input = arguments.get('vehicle', {})
        
        # Get user info from context
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            raise Exception('User not authenticated')
        
        result = vehicle_service.add_user_vehicle(vehicle_input, user_id)
        
        if result['success']:
            return result['vehicle']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"❌ Error in handle_add_user_vehicle: {e}")
        raise e

def handle_get_user_vehicles(event: Dict[str, Any], context: Any) -> List[Dict[str, Any]]:
    """Handle getting user vehicles"""
    try:
        arguments = event.get('arguments', {})
        user_id = arguments.get('userId') or event.get('identity', {}).get('sub')
        
        if not user_id:
            raise Exception('User not authenticated')
        
        result = vehicle_service.get_user_vehicles(user_id)
        
        if result['success']:
            return result['vehicles']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"❌ Error in handle_get_user_vehicles: {e}")
        raise e

def handle_get_vehicle_by_id(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle getting vehicle by ID"""
    try:
        arguments = event.get('arguments', {})
        vehicle_id = arguments.get('vehicleId')
        
        # Get user info from context
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            raise Exception('User not authenticated')
        
        result = vehicle_service.get_vehicle_by_id(vehicle_id, user_id)
        
        if result['success']:
            return result['vehicle']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"❌ Error in handle_get_vehicle_by_id: {e}")
        raise e

def handle_update_user_vehicle(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle updating a vehicle"""
    try:
        arguments = event.get('arguments', {})
        vehicle_id = arguments.get('vehicleId')
        vehicle_input = arguments.get('vehicle', {})
        
        # Get user info from context
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            raise Exception('User not authenticated')
        
        result = vehicle_service.update_user_vehicle(vehicle_id, vehicle_input, user_id)
        
        if result['success']:
            return result['vehicle']
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"❌ Error in handle_update_user_vehicle: {e}")
        raise e

def handle_delete_user_vehicle(event: Dict[str, Any], context: Any) -> bool:
    """Handle deleting a vehicle"""
    try:
        arguments = event.get('arguments', {})
        vehicle_id = arguments.get('vehicleId')
        
        # Get user info from context
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            raise Exception('User not authenticated')
        
        result = vehicle_service.delete_user_vehicle(vehicle_id, user_id)
        
        if result['success']:
            return True
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        logger.error(f"❌ Error in handle_delete_user_vehicle: {e}")
        raise e
