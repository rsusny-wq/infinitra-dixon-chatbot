#!/usr/bin/env python3
"""
Test Suite for Dixon Smart Repair v0.2 - Phases 1 & 2 Integration Testing
Tests the refactored tools and optimized prompts working together
"""

import sys
import os
import json
import time
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

# Add the lambda directory to the path
sys.path.append('/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda')

def test_phase_1_tools():
    """Test Phase 1: Refactored tools with explicit parameters"""
    print("🔧 TESTING PHASE 1: REFACTORED TOOLS")
    print("=" * 50)
    
    try:
        # Import refactored tools
        from simplified_tools_v2_refactored import (
            fetch_user_vehicles,
            extract_vin_from_image,
            lookup_vehicle_data,
            store_vehicle_record,
            search_web,
            calculate_labor_estimates,
            save_labor_estimate_record
        )
        
        print("✅ All refactored tools imported successfully")
        
        # Test 1: Tool signatures (explicit parameters)
        import inspect
        
        # Check fetch_user_vehicles signature
        sig = inspect.signature(fetch_user_vehicles)
        params = list(sig.parameters.keys())
        assert 'user_id' in params, "fetch_user_vehicles should have user_id parameter"
        assert 'agent' not in params, "fetch_user_vehicles should not have agent parameter"
        print("✅ fetch_user_vehicles has correct signature")
        
        # Check extract_vin_from_image signature
        sig = inspect.signature(extract_vin_from_image)
        params = list(sig.parameters.keys())
        assert 'image_base64' in params, "extract_vin_from_image should have image_base64 parameter"
        assert 'agent' not in params, "extract_vin_from_image should not have agent parameter"
        print("✅ extract_vin_from_image has correct signature")
        
        # Check calculate_labor_estimates signature
        sig = inspect.signature(calculate_labor_estimates)
        params = list(sig.parameters.keys())
        assert 'repair_type' in params, "calculate_labor_estimates should have repair_type parameter"
        assert 'vehicle_info' in params, "calculate_labor_estimates should have vehicle_info parameter"
        assert 'agent' not in params, "calculate_labor_estimates should not have agent parameter"
        print("✅ calculate_labor_estimates has correct signature")
        
        print("✅ Phase 1 tools: All signatures correct (explicit parameters)")
        
        # Test 2: Exception handling
        try:
            fetch_user_vehicles("")  # Should raise ValueError
            assert False, "Should have raised ValueError for empty user_id"
        except ValueError as e:
            assert "User ID is required" in str(e)
            print("✅ fetch_user_vehicles raises proper ValueError")
        
        try:
            extract_vin_from_image("")  # Should raise ValueError
            assert False, "Should have raised ValueError for empty image"
        except ValueError as e:
            assert "Image data is required" in str(e)
            print("✅ extract_vin_from_image raises proper ValueError")
        
        print("✅ Phase 1 tools: Exception handling working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Phase 1 tools test failed: {str(e)}")
        return False

def test_phase_2_prompts():
    """Test Phase 2: Optimized system prompts"""
    print("\n📝 TESTING PHASE 2: OPTIMIZED PROMPTS")
    print("=" * 50)
    
    try:
        # Import optimized prompts
        from dixon_v2_system_prompt_optimized import (
            get_optimized_v2_system_prompt,
            get_minimal_system_prompt,
            select_optimal_prompt
        )
        
        print("✅ All optimized prompt functions imported successfully")
        
        # Test 1: Prompt sizes
        optimized = get_optimized_v2_system_prompt()
        minimal = get_minimal_system_prompt()
        
        print(f"📊 Optimized prompt: {len(optimized)} characters")
        print(f"📊 Minimal prompt: {len(minimal)} characters")
        
        # Verify size reduction
        assert len(optimized) < 2000, f"Optimized prompt too large: {len(optimized)} chars"
        assert len(minimal) < 1000, f"Minimal prompt too large: {len(minimal)} chars"
        print("✅ Prompt sizes within expected ranges")
        
        # Test 2: Prompt content quality
        assert "Dixon" in optimized, "Optimized prompt should contain Dixon identity"
        assert "automotive technician" in optimized, "Should contain role description"
        assert "fetch_user_vehicles" in optimized, "Should list available tools"
        print("✅ Optimized prompt contains essential content")
        
        # Test 3: Context-aware prompt selection
        context = {"has_image": True, "user_id": "test-123"}
        selected = select_optimal_prompt(context, "balanced")
        assert isinstance(selected, str), "Should return string prompt"
        assert len(selected) > 0, "Should return non-empty prompt"
        print("✅ Context-aware prompt selection working")
        
        # Test 4: Performance mode selection
        fast_prompt = select_optimal_prompt(None, "fast")
        balanced_prompt = select_optimal_prompt(None, "balanced")
        comprehensive_prompt = select_optimal_prompt(None, "comprehensive")
        
        assert len(fast_prompt) <= len(balanced_prompt), "Fast should be smaller than balanced"
        print("✅ Performance mode selection working")
        
        print("✅ Phase 2 prompts: All optimizations working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Phase 2 prompts test failed: {str(e)}")
        return False

def test_integration():
    """Test integration of Phase 1 tools + Phase 2 prompts"""
    print("\n🔗 TESTING INTEGRATION: TOOLS + PROMPTS")
    print("=" * 50)
    
    try:
        # Import refactored handler
        from dixon_v2_handler_refactored import (
            create_optimized_agent,
            handle_v2_chat_message_refactored
        )
        
        print("✅ Refactored handler imported successfully")
        
        # Test 1: Agent creation with optimized prompts
        with patch('dixon_v2_handler_refactored.S3SessionManager'):
            with patch('dixon_v2_handler_refactored.SlidingWindowConversationManager'):
                with patch('dixon_v2_handler_refactored.BedrockModel'):
                    with patch('dixon_v2_handler_refactored.Agent') as mock_agent:
                        
                        # Mock agent creation
                        mock_agent_instance = Mock()
                        mock_agent.return_value = mock_agent_instance
                        
                        # Test agent creation
                        agent = create_optimized_agent("test-conv", "test-user", "test-image")
                        
                        # Verify agent was created with correct parameters
                        mock_agent.assert_called_once()
                        call_args = mock_agent.call_args
                        
                        # Check that system_prompt was passed
                        assert 'system_prompt' in call_args.kwargs
                        prompt = call_args.kwargs['system_prompt']
                        assert isinstance(prompt, str)
                        assert len(prompt) < 3000  # Should be optimized prompt
                        
                        print("✅ Agent created with optimized prompt")
                        print(f"📊 Prompt size used: {len(prompt)} characters")
        
        # Test 2: Handler integration
        test_args = {
            'conversationId': 'test-conv-123',
            'message': 'Hello, I need help with my car',
            'userId': 'test-user-456',
            'diagnosticLevel': 'enhanced'
        }
        
        # Mock all external dependencies
        with patch('dixon_v2_handler_refactored.create_optimized_agent') as mock_create_agent:
            with patch('dixon_v2_handler_refactored.save_message_to_db'):
                
                # Mock agent response
                mock_agent = Mock()
                mock_agent.return_value = "Hello! I'm Dixon, your automotive assistant. Let me pull up your garage history..."
                mock_create_agent.return_value = mock_agent
                
                # Test handler
                result = handle_v2_chat_message_refactored(test_args)
                
                # Verify response structure
                assert result['success'] == True
                assert 'conversationId' in result
                assert 'message' in result
                assert 'v0.2-refactored-optimized' in result['diagnostic_context']['version']
                
                print("✅ Handler integration working correctly")
                print(f"📊 Response version: {result['diagnostic_context']['version']}")
        
        print("✅ Integration test: Tools + Prompts working together")
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False

def test_performance_comparison():
    """Test performance improvements from optimizations"""
    print("\n⚡ TESTING PERFORMANCE IMPROVEMENTS")
    print("=" * 50)
    
    try:
        from dixon_v2_system_prompt import get_v2_system_prompt  # Original
        from dixon_v2_system_prompt_optimized import get_optimized_v2_system_prompt  # Optimized
        
        # Get both prompts
        original = get_v2_system_prompt()
        optimized = get_optimized_v2_system_prompt()
        
        # Calculate improvements
        original_size = len(original)
        optimized_size = len(optimized)
        size_reduction = ((original_size - optimized_size) / original_size) * 100
        
        # Estimate token savings (rough estimate: 4 chars per token)
        original_tokens = original_size // 4
        optimized_tokens = optimized_size // 4
        token_savings = original_tokens - optimized_tokens
        
        print(f"📊 PERFORMANCE COMPARISON:")
        print(f"   Original prompt: {original_size:,} characters ({original_tokens:,} tokens)")
        print(f"   Optimized prompt: {optimized_size:,} characters ({optimized_tokens:,} tokens)")
        print(f"   Size reduction: {size_reduction:.1f}%")
        print(f"   Token savings: {token_savings:,} tokens per request")
        print(f"   Memory savings: {(original_size - optimized_size):,} bytes per request")
        
        # Verify significant improvement
        assert size_reduction > 80, f"Expected >80% reduction, got {size_reduction:.1f}%"
        assert token_savings > 2000, f"Expected >2000 token savings, got {token_savings}"
        
        print("✅ Performance improvements verified")
        return True
        
    except Exception as e:
        print(f"❌ Performance comparison failed: {str(e)}")
        return False

def run_comprehensive_test():
    """Run all tests and provide summary"""
    print("🧪 COMPREHENSIVE TEST: PHASES 1 & 2")
    print("=" * 60)
    print(f"Test started at: {datetime.now().isoformat()}")
    print()
    
    # Run all tests
    tests = [
        ("Phase 1: Refactored Tools", test_phase_1_tools),
        ("Phase 2: Optimized Prompts", test_phase_2_prompts),
        ("Integration: Tools + Prompts", test_integration),
        ("Performance Improvements", test_performance_comparison)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            start_time = time.time()
            result = test_func()
            end_time = time.time()
            duration = end_time - start_time
            
            results.append({
                "name": test_name,
                "passed": result,
                "duration": duration
            })
        except Exception as e:
            results.append({
                "name": test_name,
                "passed": False,
                "duration": 0,
                "error": str(e)
            })
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    
    for result in results:
        status = "✅ PASS" if result["passed"] else "❌ FAIL"
        duration = f"({result['duration']:.2f}s)"
        print(f"{status} {result['name']} {duration}")
        if not result["passed"] and "error" in result:
            print(f"      Error: {result['error']}")
    
    print()
    print(f"🎯 OVERALL RESULT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Phases 1 & 2 are ready for deployment.")
        print()
        print("📋 NEXT STEPS:")
        print("1. Deploy the refactored tools and optimized prompts")
        print("2. Update feature flags to use the new implementations")
        print("3. Monitor performance improvements in production")
        print("4. Proceed with Phase 3 (Enhanced Model Configuration)")
    else:
        print("⚠️  Some tests failed. Please review and fix issues before deployment.")
    
    return passed == total

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)
