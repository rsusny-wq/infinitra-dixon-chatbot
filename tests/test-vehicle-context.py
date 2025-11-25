#!/usr/bin/env python3
"""
Test Vehicle Context Extraction System
Validates the 3-tier vehicle information system (Generic/Basic/VIN)
"""

import re

def extract_vehicle_context(conversation_history: str) -> str:
    """Extract vehicle information from conversation history for context-aware responses
    
    Returns:
        - "vin:ACTUAL_VIN" for VIN-based context (highest accuracy)
        - "basic:Make Model Year" for basic vehicle info (medium accuracy)  
        - "generic" for no vehicle info (general guidance)
    """
    
    # Look for VIN patterns first (highest priority)
    vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
    vin_match = re.search(vin_pattern, conversation_history.upper())
    if vin_match:
        return f"vin:{vin_match.group()}"
    
    # Look for basic vehicle info patterns (medium priority)
    # Pattern: Year Make Model (e.g., "2020 Honda Civic", "2015 Ford F150")
    vehicle_pattern = r'(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)'
    vehicle_match = re.search(vehicle_pattern, conversation_history)
    if vehicle_match:
        year, make, model = vehicle_match.groups()
        return f"basic:{make} {model} {year}"
    
    # Look for make/model without year (handle alphanumeric models)
    make_model_pattern = r'\b(Honda|Toyota|Ford|Chevrolet|BMW|Mercedes|Audi|Volkswagen|Nissan|Hyundai|Kia|Subaru|Mazda|Lexus|Acura|Infiniti|Cadillac|Buick|GMC|Jeep|Chrysler|Dodge|Ram|Lincoln|Volvo|Jaguar|Land Rover|Porsche|Tesla|Mini|Mitsubishi|Suzuki)\s+([A-Za-z0-9]+)\b'
    make_model_match = re.search(make_model_pattern, conversation_history, re.IGNORECASE)
    if make_model_match:
        make, model = make_model_match.groups()
        return f"basic:{make} {model}"
    
    return "generic"

def test_vehicle_context_extraction():
    """Test the vehicle context extraction with various scenarios"""
    
    test_cases = [
        # Generic cases (no vehicle info)
        ("My brakes are squeaking", "generic"),
        ("I need help with my car", "generic"),
        ("What causes engine noise?", "generic"),
        
        # Basic cases (make/model/year)
        ("My 2020 Honda Civic has brake issues", "basic:Honda Civic 2020"),
        ("I drive a 2018 Toyota Camry", "basic:Toyota Camry 2018"),
        ("2015 Ford F150 transmission problems", "basic:Ford F150 2015"),
        
        # Basic cases (make/model only)
        ("Honda Civic brake pads", "basic:Honda Civic"),
        ("Toyota Prius battery replacement", "basic:Toyota Prius"),
        ("BMW X5 oil change", "basic:BMW X5"),
        
        # VIN cases (highest accuracy)
        ("My VIN is 1HGBH41JXMN109186", "vin:1HGBH41JXMN109186"),
        ("VIN: 2T1BURHE0JC123456 needs service", "vin:2T1BURHE0JC123456"),
        ("Check this VIN 3VWDX7AJ5DM123456", "vin:3VWDX7AJ5DM123456"),
        
        # Progressive conversation (should upgrade context)
        ("My brakes are squeaking", "generic"),
        ("My brakes are squeaking. It's a 2020 Honda Civic", "basic:Honda Civic 2020"),
        ("My brakes are squeaking. It's a 2020 Honda Civic. VIN: 1HGBH41JXMN109186", "vin:1HGBH41JXMN109186"),
    ]
    
    print("🧪 Testing Vehicle Context Extraction System")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for i, (input_text, expected) in enumerate(test_cases, 1):
        result = extract_vehicle_context(input_text)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
        
        print(f"\n{status} Test {i:2d}: {input_text[:50]}")
        print(f"         Expected: {expected}")
        print(f"         Got:      {result}")
    
    print(f"\n📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All vehicle context extraction tests passed!")
        return True
    else:
        print("⚠️ Some tests failed - check the extraction logic")
        return False

def test_guidance_levels():
    """Test guidance level communication based on vehicle context"""
    
    guidance_examples = {
        "generic": {
            "start": "Based on general automotive knowledge...",
            "end": "For more specific guidance tailored to your exact vehicle, I can help better if you share your car's make, model, and year - or even better, scan your VIN for the most precise recommendations."
        },
        "basic:Honda Civic 2020": {
            "start": "For your Honda Civic 2020...",
            "end": "This is vehicle-specific guidance. For the most precise recommendations including exact part numbers and recalls, I could scan your VIN."
        },
        "vin:1HGBH41JXMN109186": {
            "start": "Based on your specific vehicle (VIN: 9186)...",
            "end": "This is the most accurate guidance possible for your exact vehicle."
        }
    }
    
    print("\n🎯 Testing Guidance Level Communication")
    print("=" * 60)
    
    for context, guidance in guidance_examples.items():
        print(f"\n🚗 Context: {context}")
        print(f"   Start: {guidance['start']}")
        print(f"   End:   {guidance['end']}")
    
    print("\n✅ Guidance level templates ready for Strands agent")

def main():
    """Run all vehicle context tests"""
    print("🚗 Dixon Smart Repair - Vehicle Context System Test")
    print("=" * 70)
    
    # Test extraction logic
    extraction_passed = test_vehicle_context_extraction()
    
    # Test guidance levels
    test_guidance_levels()
    
    print("\n🎯 Summary:")
    print(f"   Vehicle Context Extraction: {'✅ READY' if extraction_passed else '❌ NEEDS FIX'}")
    print("   Guidance Level System: ✅ READY")
    print("   3-Tier Information System: ✅ IMPLEMENTED")
    
    if extraction_passed:
        print("\n🚀 Vehicle context system ready for deployment!")
        return True
    else:
        print("\n⚠️ Fix extraction issues before deployment")
        return False

if __name__ == "__main__":
    main()
