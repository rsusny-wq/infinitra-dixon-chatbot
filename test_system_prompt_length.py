#!/usr/bin/env python3
"""
Test script to check the actual system prompt length being used
"""

import sys
import os

# Add the lambda directory to the path
sys.path.append('/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda')

def test_system_prompt_length():
    """Test the actual system prompt length and content"""
    try:
        from dixon_v2_system_prompt_optimized import get_optimized_v2_system_prompt, get_labor_estimation_guidance
        
        # Get the full system prompt
        full_prompt = get_optimized_v2_system_prompt()
        labor_guidance = get_labor_estimation_guidance()
        
        print("🔍 SYSTEM PROMPT ANALYSIS")
        print("=" * 50)
        print(f"📏 Full system prompt length: {len(full_prompt)} characters")
        print(f"📏 Labor estimation guidance length: {len(labor_guidance)} characters")
        print("")
        
        # Check for key workflow elements
        workflow_elements = [
            "MANDATORY 5 STEPS",
            "STEP 1: PROVIDE YOUR INITIAL ESTIMATE",
            "STEP 2: CALL CALCULATE_LABOR_ESTIMATES", 
            "STEP 3: ANALYZE MODEL RESULTS",
            "STEP 4: MAKE FINAL CONSENSUS DECISION",
            "STEP 5: SAVE ESTIMATE RECORD",
            "agent_initial_estimate",
            "save_labor_estimate_record",
            "WORKFLOW VIOLATIONS"
        ]
        
        print("🔍 WORKFLOW ELEMENTS CHECK:")
        print("-" * 30)
        
        found_elements = []
        missing_elements = []
        
        for element in workflow_elements:
            if element in full_prompt:
                found_elements.append(element)
                print(f"✅ Found: {element}")
            else:
                missing_elements.append(element)
                print(f"❌ Missing: {element}")
        
        print("")
        print("📊 SUMMARY:")
        print(f"✅ Found elements: {len(found_elements)}/{len(workflow_elements)}")
        print(f"❌ Missing elements: {len(missing_elements)}/{len(workflow_elements)}")
        
        if len(found_elements) == len(workflow_elements):
            print("🎉 ALL WORKFLOW ELEMENTS PRESENT - System prompt is updated!")
            return True
        else:
            print("⚠️ MISSING WORKFLOW ELEMENTS - System prompt needs updating!")
            
            print("\n📝 LABOR ESTIMATION GUIDANCE PREVIEW:")
            print("-" * 40)
            print(labor_guidance[:500] + "..." if len(labor_guidance) > 500 else labor_guidance)
            
            return False
            
    except Exception as e:
        print(f"❌ Error testing system prompt: {e}")
        return False

def compare_with_expected():
    """Compare with what we expect the prompt to contain"""
    expected_length_min = 8000  # Our updated prompt should be much longer
    
    try:
        from dixon_v2_system_prompt_optimized import get_optimized_v2_system_prompt
        
        actual_prompt = get_optimized_v2_system_prompt()
        actual_length = len(actual_prompt)
        
        print(f"\n🔍 LENGTH COMPARISON:")
        print(f"Expected minimum length: {expected_length_min} characters")
        print(f"Actual length: {actual_length} characters")
        
        if actual_length >= expected_length_min:
            print("✅ Prompt length indicates our updates are present")
            return True
        else:
            print("❌ Prompt length suggests old version is still being used")
            print("🔍 This explains why the deployed Lambda shows 5656 characters")
            return False
            
    except Exception as e:
        print(f"❌ Error comparing prompt length: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing System Prompt in Local Files")
    print("=" * 50)
    
    # Test the system prompt
    prompt_updated = test_system_prompt_length()
    length_correct = compare_with_expected()
    
    print("\n" + "=" * 50)
    print("📊 FINAL ANALYSIS:")
    
    if prompt_updated and length_correct:
        print("✅ Local files contain the updated system prompt")
        print("❌ But deployed Lambda is still using old version (5656 chars)")
        print("\n💡 SOLUTION NEEDED:")
        print("1. The deployment succeeded but Lambda may be using cached imports")
        print("2. We need to force a clean deployment or restart the Lambda")
        print("3. Check if there are multiple system prompt files")
    else:
        print("❌ Local files do not contain the expected updates")
        print("💡 Need to verify our changes were saved correctly")
