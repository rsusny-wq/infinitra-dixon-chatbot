#!/usr/bin/env python3
"""
Test Suite for Dixon Smart Repair v0.2 - Refactored Simplified Tools
Independent testing of all 7 tools following Strands best practices
"""

import pytest
import json
import base64
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from botocore.exceptions import ClientError

# Import the refactored tools
from simplified_tools_v2_refactored import (
    fetch_user_vehicles,
    extract_vin_from_image,
    lookup_vehicle_data,
    store_vehicle_record,
    search_web,
    calculate_labor_estimates,
    save_labor_estimate_record
)

class TestFetchUserVehicles:
    """Test fetch_user_vehicles tool independently"""
    
    def test_fetch_user_vehicles_success(self):
        """Test successful vehicle fetching"""
        with patch('simplified_tools_v2_refactored.dynamodb') as mock_dynamodb:
            # Mock DynamoDB response
            mock_table = Mock()
            mock_table.query.return_value = {
                'Items': [
                    {'id': '1', 'make': 'Honda', 'model': 'Civic', 'year': '2020'},
                    {'id': '2', 'make': 'Toyota', 'model': 'Camry', 'year': '2019'}
                ]
            }
            mock_dynamodb.Table.return_value = mock_table
            
            # Test the tool
            result = fetch_user_vehicles("test-user-123")
            
            # Assertions
            assert isinstance(result, list)
            assert len(result) == 2
            assert result[0]['make'] == 'Honda'
            assert result[1]['make'] == 'Toyota'
            
            # Verify DynamoDB was called correctly
            mock_table.query.assert_called_once()
    
    def test_fetch_user_vehicles_empty_user_id(self):
        """Test error handling for empty user_id"""
        with pytest.raises(ValueError, match="User ID is required"):
            fetch_user_vehicles("")
    
    def test_fetch_user_vehicles_none_user_id(self):
        """Test error handling for None user_id"""
        with pytest.raises(ValueError, match="User ID is required"):
            fetch_user_vehicles(None)
    
    def test_fetch_user_vehicles_dynamodb_error(self):
        """Test DynamoDB error handling"""
        with patch('simplified_tools_v2_refactored.dynamodb') as mock_dynamodb:
            # Mock DynamoDB error
            mock_table = Mock()
            mock_table.query.side_effect = ClientError(
                {'Error': {'Code': 'ResourceNotFoundException'}}, 
                'Query'
            )
            mock_dynamodb.Table.return_value = mock_table
            
            # Test error handling
            with pytest.raises(ClientError):
                fetch_user_vehicles("test-user-123")

class TestExtractVinFromImage:
    """Test extract_vin_from_image tool independently"""
    
    def test_extract_vin_success(self):
        """Test successful VIN extraction"""
        with patch('simplified_tools_v2_refactored.textract') as mock_textract:
            # Mock Textract response with VIN
            mock_textract.detect_document_text.return_value = {
                'Blocks': [
                    {
                        'BlockType': 'LINE',
                        'Text': 'VIN: 1HGBH41JXMN109186'
                    },
                    {
                        'BlockType': 'LINE', 
                        'Text': 'Other text here'
                    }
                ]
            }
            
            # Create test image data
            test_image = base64.b64encode(b"fake image data").decode()
            
            # Test the tool
            result = extract_vin_from_image(test_image)
            
            # Assertions
            assert result['found'] == True
            assert result['vin'] == '1HGBH41JXMN109186'
            assert result['confidence'] == 95
            assert 'raw_text' in result
    
    def test_extract_vin_no_vin_found(self):
        """Test when no VIN is found in image"""
        with patch('simplified_tools_v2_refactored.textract') as mock_textract:
            # Mock Textract response without VIN
            mock_textract.detect_document_text.return_value = {
                'Blocks': [
                    {
                        'BlockType': 'LINE',
                        'Text': 'Just some random text'
                    }
                ]
            }
            
            test_image = base64.b64encode(b"fake image data").decode()
            result = extract_vin_from_image(test_image)
            
            # Assertions
            assert result['found'] == False
            assert result['vin'] is None
            assert result['confidence'] == 0
    
    def test_extract_vin_empty_image(self):
        """Test error handling for empty image"""
        with pytest.raises(ValueError, match="Image data is required"):
            extract_vin_from_image("")
    
    def test_extract_vin_invalid_base64(self):
        """Test error handling for invalid base64"""
        with pytest.raises(ValueError, match="Invalid image format"):
            extract_vin_from_image("invalid-base64-data")

class TestLookupVehicleData:
    """Test lookup_vehicle_data tool independently"""
    
    def test_lookup_vehicle_success(self):
        """Test successful vehicle data lookup"""
        with patch('simplified_tools_v2_refactored.requests') as mock_requests:
            # Mock NHTSA API response
            mock_response = Mock()
            mock_response.json.return_value = {
                'Results': [
                    {'Variable': 'Make', 'Value': 'Honda'},
                    {'Variable': 'Model', 'Value': 'Civic'},
                    {'Variable': 'Model Year', 'Value': '1991'},
                    {'Variable': 'Engine Configuration', 'Value': '1.5L I4'}
                ]
            }
            mock_requests.get.return_value = mock_response
            
            # Test the tool
            result = lookup_vehicle_data("1HGBH41JXMN109186")
            
            # Assertions
            assert result['vin'] == "1HGBH41JXMN109186"
            assert result['make'] == 'Honda'
            assert result['model'] == 'Civic'
            assert result['year'] == '1991'
            assert result['source'] == 'NHTSA'
    
    def test_lookup_vehicle_empty_vin(self):
        """Test error handling for empty VIN"""
        with pytest.raises(ValueError, match="VIN is required"):
            lookup_vehicle_data("")
    
    def test_lookup_vehicle_invalid_vin_length(self):
        """Test error handling for invalid VIN length"""
        with pytest.raises(ValueError, match="VIN must be exactly 17 characters"):
            lookup_vehicle_data("TOOSHORT")
    
    def test_lookup_vehicle_api_error(self):
        """Test NHTSA API error handling"""
        with patch('simplified_tools_v2_refactored.requests') as mock_requests:
            mock_requests.get.side_effect = Exception("API Error")
            
            with pytest.raises(Exception, match="Vehicle lookup failed"):
                lookup_vehicle_data("1HGBH41JXMN109186")

class TestStoreVehicleRecord:
    """Test store_vehicle_record tool independently"""
    
    def test_store_vehicle_success(self):
        """Test successful vehicle storage"""
        with patch('simplified_tools_v2_refactored.dynamodb') as mock_dynamodb:
            mock_table = Mock()
            mock_dynamodb.Table.return_value = mock_table
            
            vehicle_data = {
                'vin': '1HGBH41JXMN109186',
                'make': 'Honda',
                'model': 'Civic',
                'year': '1991'
            }
            
            # Test the tool
            result = store_vehicle_record("test-user-123", vehicle_data)
            
            # Assertions
            assert 'vehicle_id' in result
            assert result['status'] == 'stored'
            
            # Verify DynamoDB was called
            mock_table.put_item.assert_called_once()
    
    def test_store_vehicle_empty_user_id(self):
        """Test error handling for empty user_id"""
        with pytest.raises(ValueError, match="User ID is required"):
            store_vehicle_record("", {"make": "Honda"})
    
    def test_store_vehicle_empty_data(self):
        """Test error handling for empty vehicle data"""
        with pytest.raises(ValueError, match="Vehicle data is required"):
            store_vehicle_record("test-user-123", {})

class TestSearchWeb:
    """Test search_web tool independently"""
    
    def test_search_web_success(self):
        """Test successful web search"""
        with patch('simplified_tools_v2_refactored.requests') as mock_requests:
            with patch('simplified_tools_v2_refactored.TAVILY_API_KEY', 'test-key'):
                # Mock Tavily API response
                mock_response = Mock()
                mock_response.json.return_value = {
                    'results': [
                        {'title': 'Test Result', 'url': 'http://example.com', 'content': 'Test content'}
                    ],
                    'answer': 'Test answer'
                }
                mock_requests.post.return_value = mock_response
                
                # Test the tool
                result = search_web("brake pad replacement")
                
                # Assertions
                assert 'results' in result
                assert 'answer' in result
                assert result['query'] == "brake pad replacement"
                assert len(result['results']) == 1
    
    def test_search_web_empty_query(self):
        """Test error handling for empty query"""
        with pytest.raises(ValueError, match="Search query is required"):
            search_web("")
    
    def test_search_web_no_api_key(self):
        """Test error handling when API key is missing"""
        with patch('simplified_tools_v2_refactored.TAVILY_API_KEY', None):
            with pytest.raises(ValueError, match="Tavily API key not configured"):
                search_web("test query")

class TestCalculateLaborEstimates:
    """Test calculate_labor_estimates tool independently"""
    
    def test_calculate_labor_estimates_success(self):
        """Test successful labor estimation"""
        with patch('simplified_tools_v2_refactored.bedrock_runtime') as mock_bedrock:
            with patch('simplified_tools_v2_refactored.search_web') as mock_search:
                # Mock Bedrock responses
                claude_response = Mock()
                claude_response.__getitem__.return_value.read.return_value = json.dumps({
                    'content': [{'text': '{"labor_hours_low": 1.5, "labor_hours_high": 2.0, "labor_hours_average": 1.75}'}]
                }).encode()
                
                titan_response = Mock()
                titan_response.__getitem__.return_value.read.return_value = json.dumps({
                    'results': [{'outputText': '{"labor_hours_low": 1.4, "labor_hours_high": 2.1, "labor_hours_average": 1.8}'}]
                }).encode()
                
                mock_bedrock.invoke_model.side_effect = [claude_response, titan_response]
                
                # Mock web search
                mock_search.return_value = {
                    'answer': 'Brake pad replacement takes 1.5 to 2 hours',
                    'results': []
                }
                
                vehicle_info = {'make': 'Honda', 'model': 'Civic', 'year': '2020'}
                
                # Test the tool
                result = calculate_labor_estimates("brake pad replacement", vehicle_info)
                
                # Assertions
                assert 'claude_estimate' in result
                assert 'titan_estimate' in result
                assert 'web_validation' in result
                assert 'timestamp' in result
    
    def test_calculate_labor_estimates_empty_repair_type(self):
        """Test error handling for empty repair type"""
        with pytest.raises(ValueError, match="Repair type is required"):
            calculate_labor_estimates("", {"make": "Honda"})
    
    def test_calculate_labor_estimates_empty_vehicle_info(self):
        """Test error handling for empty vehicle info"""
        with pytest.raises(ValueError, match="Vehicle information is required"):
            calculate_labor_estimates("brake pad replacement", {})

class TestSaveLaborEstimateRecord:
    """Test save_labor_estimate_record tool independently"""
    
    def test_save_labor_estimate_success(self):
        """Test successful labor estimate record saving"""
        with patch('simplified_tools_v2_refactored.dynamodb') as mock_dynamodb:
            mock_table = Mock()
            mock_dynamodb.Table.return_value = mock_table
            
            # Test the tool
            result = save_labor_estimate_record(
                user_id="test-user-123",
                conversation_id="test-conv-456",
                repair_type="brake pad replacement",
                vehicle_info={"make": "Honda"},
                initial_estimate={"low": 1.5, "high": 2.0},
                model_estimates={"claude": {}, "titan": {}},
                final_estimate={"low": 1.6, "high": 1.9},
                consensus_reasoning="Based on model consensus"
            )
            
            # Assertions
            assert 'report_id' in result
            assert result['status'] == 'saved'
            
            # Verify DynamoDB was called
            mock_table.put_item.assert_called_once()
    
    def test_save_labor_estimate_empty_user_id(self):
        """Test error handling for empty user_id"""
        with pytest.raises(ValueError, match="User ID is required"):
            save_labor_estimate_record(
                user_id="",
                conversation_id="test-conv",
                repair_type="brake pad replacement",
                vehicle_info={},
                initial_estimate={},
                model_estimates={},
                final_estimate={},
                consensus_reasoning=""
            )

# Integration test to verify all tools work together
class TestToolIntegration:
    """Test that all tools can work together in a workflow"""
    
    def test_complete_workflow_simulation(self):
        """Simulate a complete workflow using all tools"""
        with patch('simplified_tools_v2_refactored.dynamodb') as mock_dynamodb:
            with patch('simplified_tools_v2_refactored.textract') as mock_textract:
                with patch('simplified_tools_v2_refactored.requests') as mock_requests:
                    with patch('simplified_tools_v2_refactored.bedrock_runtime') as mock_bedrock:
                        with patch('simplified_tools_v2_refactored.TAVILY_API_KEY', 'test-key'):
                            
                            # Setup mocks for complete workflow
                            # 1. fetch_user_vehicles - returns empty
                            mock_table = Mock()
                            mock_table.query.return_value = {'Items': []}
                            mock_dynamodb.Table.return_value = mock_table
                            
                            # 2. extract_vin_from_image - finds VIN
                            mock_textract.detect_document_text.return_value = {
                                'Blocks': [{'BlockType': 'LINE', 'Text': 'VIN: 1HGBH41JXMN109186'}]
                            }
                            
                            # 3. lookup_vehicle_data - gets vehicle info
                            mock_nhtsa_response = Mock()
                            mock_nhtsa_response.json.return_value = {
                                'Results': [
                                    {'Variable': 'Make', 'Value': 'Honda'},
                                    {'Variable': 'Model', 'Value': 'Civic'},
                                    {'Variable': 'Model Year', 'Value': '2020'}
                                ]
                            }
                            
                            # 4. Tavily search response
                            mock_tavily_response = Mock()
                            mock_tavily_response.json.return_value = {
                                'results': [],
                                'answer': 'Brake pad replacement takes 1.5 hours'
                            }
                            
                            mock_requests.get.return_value = mock_nhtsa_response
                            mock_requests.post.return_value = mock_tavily_response
                            
                            # 5. Bedrock responses
                            claude_response = Mock()
                            claude_response.__getitem__.return_value.read.return_value = json.dumps({
                                'content': [{'text': '{"labor_hours_low": 1.5, "labor_hours_high": 2.0}'}]
                            }).encode()
                            mock_bedrock.invoke_model.return_value = claude_response
                            
                            # Execute workflow
                            user_id = "test-user-123"
                            
                            # Step 1: Check existing vehicles
                            vehicles = fetch_user_vehicles(user_id)
                            assert len(vehicles) == 0
                            
                            # Step 2: Extract VIN from image
                            test_image = base64.b64encode(b"fake image").decode()
                            vin_result = extract_vin_from_image(test_image)
                            assert vin_result['found'] == True
                            
                            # Step 3: Lookup vehicle data
                            vehicle_data = lookup_vehicle_data(vin_result['vin'])
                            assert vehicle_data['make'] == 'Honda'
                            
                            # Step 4: Store vehicle
                            store_result = store_vehicle_record(user_id, vehicle_data)
                            assert store_result['status'] == 'stored'
                            
                            # Step 5: Calculate labor estimates
                            estimates = calculate_labor_estimates("brake pad replacement", vehicle_data)
                            assert 'claude_estimate' in estimates
                            
                            print("✅ Complete workflow simulation passed")

def run_all_tests():
    """Run all tests manually (for environments without pytest)"""
    test_classes = [
        TestFetchUserVehicles,
        TestExtractVinFromImage,
        TestLookupVehicleData,
        TestStoreVehicleRecord,
        TestSearchWeb,
        TestCalculateLaborEstimates,
        TestSaveLaborEstimateRecord,
        TestToolIntegration
    ]
    
    total_tests = 0
    passed_tests = 0
    
    for test_class in test_classes:
        print(f"\n🧪 Running {test_class.__name__}")
        test_instance = test_class()
        
        for method_name in dir(test_instance):
            if method_name.startswith('test_'):
                total_tests += 1
                try:
                    method = getattr(test_instance, method_name)
                    method()
                    print(f"  ✅ {method_name}")
                    passed_tests += 1
                except Exception as e:
                    print(f"  ❌ {method_name}: {str(e)}")
    
    print(f"\n📊 Test Results: {passed_tests}/{total_tests} passed")
    return passed_tests == total_tests

if __name__ == "__main__":
    # Try to use pytest if available, otherwise run manual tests
    try:
        import pytest
        pytest.main([__file__, "-v"])
    except ImportError:
        print("pytest not available, running manual tests...")
        run_all_tests()
