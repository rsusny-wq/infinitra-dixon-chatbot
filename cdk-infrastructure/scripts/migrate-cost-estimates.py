#!/usr/bin/env python3
"""
Data Migration Script: Convert Cost Estimates from snake_case to camelCase
Fixes Issue #11: Cost Estimates GraphQL null constraint violations
"""

import boto3
import json
from decimal import Decimal
from typing import Dict, Any

def convert_decimals(obj):
    """Convert Decimal objects to float for JSON serialization"""
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    else:
        return obj

def migrate_cost_estimates():
    """Migrate cost estimates from snake_case to camelCase format"""
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
    table_name = 'DixonSmartRepairStack-CostEstimatesTableE84F3AD1-3F3EOF9NOKV3'
    table = dynamodb.Table(table_name)
    
    print(f"🔄 Starting migration for table: {table_name}")
    
    # Scan all items
    response = table.scan()
    items = response['Items']
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])
    
    print(f"📊 Found {len(items)} cost estimates to migrate")
    
    migrated_count = 0
    skipped_count = 0
    
    for item in items:
        estimate_id = item.get('estimateId', 'unknown')
        needs_migration = False
        updates = {}
        
        # Check if item has snake_case fields that need migration
        if 'vehicle_info' in item and 'vehicleInfo' not in item:
            updates['vehicleInfo'] = item['vehicle_info']
            needs_migration = True
            print(f"  📝 {estimate_id}: vehicle_info -> vehicleInfo")
        
        if 'selected_option' in item and 'selectedOption' not in item:
            updates['selectedOption'] = item['selected_option']
            needs_migration = True
            print(f"  📝 {estimate_id}: selected_option -> selectedOption")
        
        # Check for other snake_case fields
        snake_to_camel_mappings = {
            'conversation_id': 'conversationId',
            'parts_found': 'partsFound',
            'labor_estimate': 'laborEstimate',
            'repair_context': 'repairContext',
            'diagnostic_level': 'diagnosticLevel',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
        }
        
        for snake_key, camel_key in snake_to_camel_mappings.items():
            if snake_key in item and camel_key not in item:
                updates[camel_key] = item[snake_key]
                needs_migration = True
                print(f"  📝 {estimate_id}: {snake_key} -> {camel_key}")
        
        if needs_migration:
            try:
                # Convert Decimals before updating
                converted_updates = convert_decimals(updates)
                
                # Update the item
                update_expression = "SET " + ", ".join([f"#{k} = :{k}" for k in converted_updates.keys()])
                expression_attribute_names = {f"#{k}": k for k in converted_updates.keys()}
                expression_attribute_values = {f":{k}": v for k, v in converted_updates.items()}
                
                table.update_item(
                    Key={'estimateId': estimate_id},
                    UpdateExpression=update_expression,
                    ExpressionAttributeNames=expression_attribute_names,
                    ExpressionAttributeValues=expression_attribute_values
                )
                
                migrated_count += 1
                print(f"  ✅ {estimate_id}: Migration successful")
                
            except Exception as e:
                print(f"  ❌ {estimate_id}: Migration failed - {e}")
        else:
            skipped_count += 1
            print(f"  ⏭️ {estimate_id}: Already in correct format")
    
    print(f"\n🎯 Migration Summary:")
    print(f"  📊 Total items: {len(items)}")
    print(f"  ✅ Migrated: {migrated_count}")
    print(f"  ⏭️ Skipped: {skipped_count}")
    print(f"  ❌ Failed: {len(items) - migrated_count - skipped_count}")

if __name__ == "__main__":
    migrate_cost_estimates()
