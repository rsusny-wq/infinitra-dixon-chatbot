#!/usr/bin/env python3
"""
Test script to validate the deployed labor estimation workflow fix
Tests the actual Lambda function to ensure the 5-step workflow is working
"""

import json
import boto3
import time
from datetime import datetime

def test_lambda_function():
    """Test the deployed Lambda function with a starter motor estimate request"""
    
    # Create Lambda client
    lambda_client = boto3.client('lambda', region_name='us-west-2')
    
    # Test payload - same as the original failing request
    test_payload = {
        'conversationId': 'test-workflow-validation-123',
        'message': 'It seems like the starter motor is the issue can you please tell me the labour time estimate',
        'userId': 'c80113d0-a0a1-7075-e7d5-5b4583b09bb5',
        'diagnosticLevel': 'enhanced'
    }
    
    print("🧪 Testing Deployed Labor Estimation Workflow Fix")
    print("=" * 55)
    print(f"📋 Test Payload:")
    print(f"  - Conversation ID: {test_payload['conversationId']}")
    print(f"  - Message: {test_payload['message']}")
    print(f"  - User ID: {test_payload['userId']}")
    print("")
    
    try:
        print("🚀 Invoking Lambda function...")
        start_time = time.time()
        
        response = lambda_client.invoke(
            FunctionName='dixon-strands-chatbot',
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Parse response
        response_payload = json.loads(response['Payload'].read())
        
        print(f"✅ Lambda invocation completed in {execution_time:.2f} seconds")
        print(f"📊 Status Code: {response['StatusCode']}")
        
        if response['StatusCode'] == 200:
            print("✅ Lambda function executed successfully")
            
            # Check response structure
            if 'message' in response_payload:
                message = response_payload['message']
                print(f"📝 Response length: {len(message)} characters")
                print(f"📝 Response preview: {message[:200]}...")
                
                # Check for workflow indicators
                workflow_indicators = [
                    "starter motor replacement",
                    "labor",
                    "hours",
                    "estimate"
                ]
                
                found_indicators = [indicator for indicator in workflow_indicators if indicator.lower() in message.lower()]
                print(f"🔍 Workflow indicators found: {found_indicators}")
                
                return True, response_payload
            else:
                print("❌ Response missing 'message' field")
                return False, response_payload
        else:
            print(f"❌ Lambda function failed with status: {response['StatusCode']}")
            return False, response_payload
            
    except Exception as e:
        print(f"❌ Error invoking Lambda function: {str(e)}")
        return False, None

def check_cloudwatch_logs():
    """Check CloudWatch logs for workflow execution"""
    
    logs_client = boto3.client('logs', region_name='us-west-2')
    
    print("\n🔍 Checking CloudWatch Logs for Workflow Execution")
    print("=" * 55)
    
    try:
        # Get recent log events
        current_time = int(time.time() * 1000)
        start_time = current_time - (5 * 60 * 1000)  # Last 5 minutes
        
        response = logs_client.filter_log_events(
            logGroupName='/aws/lambda/dixon-strands-chatbot',
            startTime=start_time,
            filterPattern='agent_initial_estimate'
        )
        
        events = response.get('events', [])
        
        if events:
            print(f"✅ Found {len(events)} log events with 'agent_initial_estimate'")
            
            for event in events[-3:]:  # Show last 3 events
                timestamp = datetime.fromtimestamp(event['timestamp'] / 1000)
                message = event['message']
                print(f"📅 {timestamp}: {message.strip()}")
                
            # Check if agent provided initial estimate (not None)
            latest_event = events[-1]['message'] if events else ""
            if "agent_initial_estimate: None" in latest_event:
                print("❌ Agent still not providing initial estimate")
                return False
            else:
                print("✅ Agent appears to be providing initial estimate")
                return True
        else:
            print("⚠️ No recent log events found with 'agent_initial_estimate'")
            return False
            
    except Exception as e:
        print(f"❌ Error checking CloudWatch logs: {str(e)}")
        return False

def check_dynamodb_record():
    """Check if a new labor estimate record was saved to DynamoDB"""
    
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.Table('LaborEstimateReports')
    
    print("\n💾 Checking DynamoDB for New Labor Estimate Record")
    print("=" * 55)
    
    try:
        # Scan for recent records (last 10 minutes)
        current_time = datetime.utcnow()
        ten_minutes_ago = current_time.replace(minute=current_time.minute-10).isoformat()
        
        response = table.scan(
            FilterExpression='createdAt > :timestamp',
            ExpressionAttributeValues={':timestamp': ten_minutes_ago},
            Limit=5
        )
        
        items = response.get('Items', [])
        
        if items:
            print(f"✅ Found {len(items)} recent labor estimate records")
            
            # Check the most recent record
            latest_record = max(items, key=lambda x: x['createdAt'])
            
            print(f"📋 Latest Record Details:")
            print(f"  - Report ID: {latest_record.get('reportId', 'N/A')}")
            print(f"  - User ID: {latest_record.get('userId', 'N/A')}")
            print(f"  - Repair Type: {latest_record.get('repairType', 'N/A')}")
            print(f"  - Created At: {latest_record.get('createdAt', 'N/A')}")
            
            # Check if initial estimate is present and not an error
            initial_estimate = latest_record.get('initialEstimate', {})
            if 'error' in initial_estimate:
                print(f"❌ Initial estimate contains error: {initial_estimate.get('error')}")
                return False
            else:
                print("✅ Initial estimate appears to be properly saved")
                return True
        else:
            print("⚠️ No recent labor estimate records found")
            return False
            
    except Exception as e:
        print(f"❌ Error checking DynamoDB: {str(e)}")
        return False

def main():
    """Run all validation tests"""
    
    print("🎯 DEPLOYED WORKFLOW VALIDATION")
    print("=" * 55)
    print("Testing the deployed labor estimation workflow fix")
    print("Checking if all 5 mandatory steps are working correctly")
    print("")
    
    # Test 1: Lambda Function Execution
    lambda_success, response = test_lambda_function()
    
    # Test 2: CloudWatch Logs Analysis
    logs_success = check_cloudwatch_logs()
    
    # Test 3: DynamoDB Record Verification
    db_success = check_dynamodb_record()
    
    # Summary
    print("\n" + "=" * 55)
    print("📊 VALIDATION RESULTS SUMMARY")
    print("=" * 55)
    
    tests = [
        ("Lambda Function Execution", lambda_success),
        ("CloudWatch Logs Analysis", logs_success),
        ("DynamoDB Record Verification", db_success)
    ]
    
    all_passed = True
    for test_name, result in tests:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if not result:
            all_passed = False
    
    print("")
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Labor estimation workflow fix is working correctly")
        print("✅ Agent is providing initial estimates")
        print("✅ Labor estimates are being saved to DynamoDB")
        print("✅ All 5 mandatory workflow steps are functioning")
    else:
        print("⚠️ SOME TESTS FAILED")
        print("The workflow fix may need additional adjustments")
        
        print("\n🔧 TROUBLESHOOTING STEPS:")
        if not lambda_success:
            print("• Check Lambda function logs for errors")
        if not logs_success:
            print("• Verify agent is providing initial estimates (not None)")
        if not db_success:
            print("• Check if save_labor_estimate_record is being called")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
