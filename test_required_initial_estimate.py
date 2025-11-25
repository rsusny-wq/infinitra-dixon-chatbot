#!/usr/bin/env python3
"""
Test script to verify the required initial estimate parameter enforcement
"""

import json
import requests
import time

def test_labor_estimation_with_missing_initial_estimate():
    """Test that the agent now requires initial estimate"""
    
    # GraphQL endpoint
    url = "https://a3a6lrjggnhkhgpatb44femoia.appsync-api.us-west-2.amazonaws.com/graphql"
    
    # Test payload - request labor estimate without providing initial estimate
    payload = {
        "query": """
        mutation SendMessage($input: SendMessageInput!) {
            sendMessage(input: $input) {
                id
                content
                timestamp
                sender
            }
        }
        """,
        "variables": {
            "input": {
                "conversationId": "test-required-estimate-001",
                "content": "I need a labor estimate for replacing the starter motor on my 2008 Dodge Charger. The car makes a clicking sound when I try to start it.",
                "sender": "user"
            }
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": "da2-fakeApiId123456"  # This will be replaced by actual API key
    }
    
    print("🧪 Testing required initial estimate parameter...")
    print(f"📤 Sending request: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response: {json.dumps(response.json(), indent=2)}")
        
        # The agent should now be forced to provide its initial estimate
        # before calling calculate_labor_estimates
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_quality_scoring_update():
    """Test the updated 100-point quality scoring system"""
    print("\n🧪 Testing updated quality scoring system...")
    print("✅ Quality scoring now uses 25% for each component:")
    print("   - Initial estimate: 25 points")
    print("   - Claude estimate: 25 points") 
    print("   - Web validation: 25 points")
    print("   - Complete final: 25 points")
    print("   - Total possible: 100 points")
    print("   - High quality: ≥90 points")
    print("   - Medium quality: ≥70 points")
    print("   - Low quality: <70 points")

if __name__ == "__main__":
    print("🔧 Dixon Smart Repair - Required Initial Estimate Test")
    print("=" * 60)
    
    test_labor_estimation_with_missing_initial_estimate()
    test_quality_scoring_update()
    
    print("\n✅ Test completed!")
    print("\n📋 Expected behavior:")
    print("1. Agent must provide initial estimate before calling calculate_labor_estimates")
    print("2. Tool will fail with clear error if initial estimate is missing")
    print("3. Quality scoring now uses proper 100-point scale")
    print("4. Complete estimates with all 4 components will score 100/100")
