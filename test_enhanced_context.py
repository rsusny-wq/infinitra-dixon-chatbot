#!/usr/bin/env python3

import requests
import json

def test_enhanced_diagnostic_context():
    """Test the enhanced diagnostic context system with a complex repair scenario"""
    
    # Test case: BMW timing chain with comprehensive diagnostic context
    test_payload = {
        "repair_description": "BMW timing chain replacement",
        "vehicle_year": 2015,
        "vehicle_make": "BMW",
        "vehicle_model": "328i",
        "diagnostic_context": "Customer reports rattling noise on cold start, especially noticeable first 30 seconds after startup. Vehicle has 95,000 miles. Noise occurs primarily when engine is cold, diminishes as engine warms up. Previous inspection revealed timing chain guides showing wear patterns. Engine runs smoothly once warmed up but exhibits slight rough idle when cold. No check engine light currently, but customer mentions intermittent P0016 code in past. High mileage vehicle with timing chain tensioner likely requiring replacement along with guides and chain."
    }
    
    print("Testing Enhanced Diagnostic Context System")
    print("=" * 50)
    print(f"Repair: {test_payload['repair_description']}")
    print(f"Vehicle: {test_payload['vehicle_year']} {test_payload['vehicle_make']} {test_payload['vehicle_model']}")
    print(f"Diagnostic Context: {test_payload['diagnostic_context'][:100]}...")
    print("\nSending request to Lambda...")
    
    try:
        # Replace with your actual Lambda function URL
        lambda_url = "https://your-lambda-url.amazonaws.com/calculate-labor"
        
        response = requests.post(
            lambda_url,
            json=test_payload,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n" + "="*50)
            print("RESULTS:")
            print("="*50)
            
            # Display individual model estimates
            estimates = result.get('estimates', {})
            for model_name, estimate in estimates.items():
                print(f"\n{model_name.upper()}:")
                print(f"  Estimate: {estimate.get('hours', 'N/A')} hours")
                print(f"  Reasoning: {estimate.get('reasoning', 'N/A')[:150]}...")
            
            # Display consensus
            consensus = result.get('consensus', {})
            print(f"\nCONSENSUS:")
            print(f"  Final Estimate: {consensus.get('hours', 'N/A')} hours")
            print(f"  Confidence: {consensus.get('confidence', 'N/A')}")
            print(f"  Agreement Level: {consensus.get('agreement_level', 'N/A')}")
            
            # Calculate spread
            if estimates:
                hours_list = [est.get('hours', 0) for est in estimates.values() if est.get('hours')]
                if hours_list:
                    spread = max(hours_list) - min(hours_list)
                    print(f"  Model Spread: {spread:.1f} hours")
            
        else:
            print(f"Error: HTTP {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Request failed: {str(e)}")

if __name__ == "__main__":
    test_enhanced_diagnostic_context()
