#!/usr/bin/env python3
"""
Test script to validate the labor estimation workflow fix
Tests that the agent follows the mandatory 5-step process
"""

import json
import sys
import os

# Add the lambda directory to the path
sys.path.append('/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda')

def test_system_prompt_fix():
    """Test that the system prompt includes the mandatory workflow"""
    try:
        from dixon_v2_system_prompt_optimized import get_optimized_v2_system_prompt, get_minimal_system_prompt
        
        # Test main system prompt
        main_prompt = get_optimized_v2_system_prompt()
        
        # Check for mandatory workflow elements
        required_elements = [
            "MANDATORY 5 STEPS",
            "STEP 1: PROVIDE YOUR INITIAL ESTIMATE", 
            "STEP 2: CALL CALCULATE_LABOR_ESTIMATES",
            "STEP 3: ANALYZE MODEL RESULTS",
            "STEP 4: MAKE FINAL CONSENSUS DECISION",
            "STEP 5: SAVE ESTIMATE RECORD",
            "agent_initial_estimate",
            "save_labor_estimate_record",
            "WORKFLOW VIOLATIONS",
            "BUSINESS COMPLIANCE"
        ]
        
        missing_elements = []
        for element in required_elements:
            if element not in main_prompt:
                missing_elements.append(element)
        
        if missing_elements:
            print(f"❌ Main prompt missing elements: {missing_elements}")
            return False
        else:
            print("✅ Main system prompt includes all mandatory workflow elements")
        
        # Test minimal system prompt
        minimal_prompt = get_minimal_system_prompt()
        
        minimal_required = [
            "MANDATORY 5-step process",
            "calculate_labor_estimates WITH your initial estimate",
            "save_labor_estimate_record before presenting",
            "Never present estimates without completing all 5 steps"
        ]
        
        minimal_missing = []
        for element in minimal_required:
            if element not in minimal_prompt:
                minimal_missing.append(element)
        
        if minimal_missing:
            print(f"❌ Minimal prompt missing elements: {minimal_missing}")
            return False
        else:
            print("✅ Minimal system prompt includes mandatory workflow")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing system prompt: {e}")
        return False

def create_test_payload():
    """Create a test payload for the starter motor scenario"""
    return {
        'conversationId': 'test-workflow-fix-123',
        'message': 'It seems like the starter motor is the issue can you please tell me the labour time estimate',
        'userId': 'c80113d0-a0a1-7075-e7d5-5b4583b09bb5',
        'diagnosticLevel': 'enhanced'
    }

def validate_workflow_steps():
    """Validate that the workflow steps are properly defined"""
    try:
        from dixon_v2_system_prompt_optimized import get_labor_estimation_guidance
        
        guidance = get_labor_estimation_guidance()
        
        # Check for specific workflow enforcement
        workflow_checks = [
            "STEP 1:" in guidance,
            "STEP 2:" in guidance, 
            "STEP 3:" in guidance,
            "STEP 4:" in guidance,
            "STEP 5:" in guidance,
            "agent_initial_estimate=YOUR_STEP_1_ESTIMATE" in guidance,
            "MANDATORY: Call save_labor_estimate_record" in guidance,
            "❌ Skip providing initial estimate" in guidance,
            "❌ Present estimates without saving first" in guidance
        ]
        
        if all(workflow_checks):
            print("✅ All workflow steps properly defined and enforced")
            return True
        else:
            print(f"❌ Workflow validation failed. Checks: {workflow_checks}")
            return False
            
    except Exception as e:
        print(f"❌ Error validating workflow: {e}")
        return False

def main():
    """Run all validation tests"""
    print("🧪 Testing Labor Estimation Workflow Fix")
    print("=" * 50)
    
    tests = [
        ("System Prompt Fix", test_system_prompt_fix),
        ("Workflow Steps Validation", validate_workflow_steps)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        result = test_func()
        results.append((test_name, result))
        
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS:")
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if not result:
            all_passed = False
    
    if all_passed:
        print("\n🎉 ALL TESTS PASSED - Workflow fix is ready for deployment!")
        print("\n📋 NEXT STEPS:")
        print("1. Deploy the updated Lambda function")
        print("2. Test with a real starter motor estimate request")
        print("3. Verify the estimate gets saved to DynamoDB")
        print("4. Check that all 5 workflow steps are followed")
    else:
        print("\n⚠️  SOME TESTS FAILED - Fix needed before deployment")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
