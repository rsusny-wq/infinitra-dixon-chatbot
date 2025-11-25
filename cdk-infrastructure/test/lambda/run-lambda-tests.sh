#!/bin/bash

# Enhanced Lambda Function Test Suite (Fixed)
# Tests all endpoints of the dixon-enhanced-strands-agent Lambda function

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_NAME="dixon-enhanced-strands-agent"
REGION="us-west-2"
TEST_DIR="$(dirname "$0")"
RESULTS_DIR="$TEST_DIR/results"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}🧪 Enhanced Lambda Function Test Suite${NC}"
echo -e "${BLUE}======================================${NC}"
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo ""

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local payload_json="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}🔍 Running: $test_name${NC}"
    
    # Create temporary payload file
    local temp_payload="$RESULTS_DIR/${test_name}-payload.json"
    echo "$payload_json" > "$temp_payload"
    
    # Run the Lambda function
    if aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --cli-binary-format raw-in-base64-out \
        --payload "file://$temp_payload" \
        --region "$REGION" \
        "$RESULTS_DIR/${test_name}-response.json" > "$RESULTS_DIR/${test_name}-invoke.log" 2>&1; then
        
        # Check if response file exists and has content
        if [ -f "$RESULTS_DIR/${test_name}-response.json" ] && [ -s "$RESULTS_DIR/${test_name}-response.json" ]; then
            # Parse the response
            STATUS_CODE=$(jq -r '.statusCode' "$RESULTS_DIR/${test_name}-response.json" 2>/dev/null || echo "unknown")
            
            if [ "$STATUS_CODE" = "$expected_status" ]; then
                echo -e "${GREEN}✅ $test_name: PASSED (Status: $STATUS_CODE)${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
                
                # Show response body preview
                BODY=$(jq -r '.body' "$RESULTS_DIR/${test_name}-response.json" 2>/dev/null | jq . 2>/dev/null || echo "Invalid JSON")
                echo -e "${GREEN}   Preview: $(echo "$BODY" | head -c 100)...${NC}"
            else
                echo -e "${RED}❌ $test_name: FAILED (Expected: $expected_status, Got: $STATUS_CODE)${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            echo -e "${RED}❌ $test_name: FAILED (No response)${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ $test_name: FAILED (Lambda invoke error)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        cat "$RESULTS_DIR/${test_name}-invoke.log"
    fi
    
    echo ""
}

# Test payloads
HEALTH_PAYLOAD='{"httpMethod":"GET","path":"/health","headers":{},"body":null,"isBase64Encoded":false}'
TOOLS_PAYLOAD='{"httpMethod":"GET","path":"/tools","headers":{},"body":null,"isBase64Encoded":false}'
VIN_PAYLOAD='{"httpMethod":"POST","path":"/validate-vin","headers":{"Content-Type":"application/json"},"body":"{\"vin\":\"1HGBH41JXMN109186\"}","isBase64Encoded":false}'
CORS_PAYLOAD='{"httpMethod":"OPTIONS","path":"/health","headers":{},"body":null,"isBase64Encoded":false}'
NOT_FOUND_PAYLOAD='{"httpMethod":"GET","path":"/invalid-endpoint","headers":{},"body":null,"isBase64Encoded":false}'

# Run tests
echo -e "${BLUE}🚀 Starting Test Execution${NC}"
echo ""

run_test "health-check" "$HEALTH_PAYLOAD" "200"
run_test "tools-status" "$TOOLS_PAYLOAD" "200"
run_test "vin-validation" "$VIN_PAYLOAD" "200"
run_test "cors-preflight" "$CORS_PAYLOAD" "200"
run_test "invalid-endpoint" "$NOT_FOUND_PAYLOAD" "404"

# Summary
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}======================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Enhanced Lambda function is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check results in $RESULTS_DIR${NC}"
    exit 1
fi
