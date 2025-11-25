# Dixon Smart Repair - Test Suite

Comprehensive test suite for the Dixon Smart Repair automotive diagnostic system.

## Overview

This test suite validates the complete system implementation including:

- **Chat Functionality** - Basic conversational AI responses
- **VIN Processing** - Image OCR, manual entry, and NHTSA integration  
- **Tool Integration** - All 5 automotive diagnostic tools
- **Session Management** - Context retention and conversation continuity
- **Error Handling** - Graceful error recovery and validation
- **Performance** - Response times and system efficiency

## Quick Start

```bash
# Run all tests (comprehensive)
npm test

# Run quick essential tests only
npm run test:quick

# Run specific test suite
npm run test:basic     # Basic chat functionality
npm run test:vin       # VIN processing tests
npm run test:tools     # Tool integration tests
npm run test:performance # Performance tests

# Check system health
npm run health
```

## Test Suites

### 1. Basic Chat Functionality
- Simple greetings and responses
- Automotive problem descriptions
- General car maintenance questions
- **Parallel execution** for faster testing

### 2. VIN Processing & Enhancement
- VIN scanning requests and instructions
- Manual VIN entry and validation
- VIN-enhanced diagnostic accuracy (95% vs 65%)
- Image-based VIN extraction with Textract
- **Sequential execution** to build VIN context

### 3. Tool Integration
Tests all 5 automotive diagnostic tools:
- `symptom_diagnosis_analyzer` - Diagnose car problems
- `parts_availability_lookup` - Find parts and pricing
- `labor_estimator` - Estimate repair time and complexity
- `pricing_calculator` - Calculate total repair costs
- `repair_instructions` - Provide repair guidance
- **Parallel execution** for efficiency

### 4. Session & Context Management
- Conversation continuity across messages
- Context retention and awareness
- Multi-turn conversation handling
- **Sequential execution** to test context flow

### 5. Error Handling & Recovery
- Invalid input validation
- Graceful error responses
- System resilience testing
- **Parallel execution** for comprehensive coverage

### 6. Performance & Response Times
- Quick response validation (<5s for simple queries)
- Complex query performance (<30s for multi-tool execution)
- Lambda processing time analysis
- **Parallel execution** for load testing

## Test Configuration

The test suite is configured to test against:

- **GraphQL Endpoint**: `https://ar2pbqk5fjelrkcvwi26fgck4m.appsync-api.us-west-2.amazonaws.com/graphql`
- **Web App**: `https://d37f64klhjdi5b.cloudfront.net`
- **Lambda Function**: `dixon-strands-chatbot`
- **Session Storage**: `dixon-smart-repair-sessions-041063310146`

## Test Results

The test suite provides detailed analysis including:

- ✅ **Pass/Fail Status** for each test
- ⏱️ **Response Times** (total and Lambda processing)
- 🎯 **Diagnostic Accuracy** validation
- 🔧 **Tool Execution** detection
- 📊 **Performance Metrics** and warnings
- 🏥 **System Health** checks

## Example Output

```
🧪 Running Test Suite: Basic Chat Functionality
============================================================
🚀 Running tests in parallel...

📊 Suite Results: 3/3 passed (100%)
⏱️  Average Response Time: 3247ms (Lambda: 2156ms)

✅ Simple Greeting (2341ms)
   ✅ Success: true
   ✅ Message content present
   ✅ Sender: DIXON

✅ Automotive Problem Description (4521ms)
   ✅ Success: true
   ✅ Message content present
   ✅ Tools likely executed (processing time > 10s)

✅ General Car Question (2879ms)
   ✅ Success: true
   ✅ Message content present
   ✅ Sender: DIXON
```

## System Health Check

The test suite includes a comprehensive system health check that validates:

- ✅ GraphQL API connectivity and response times
- ✅ Lambda function deployment status
- ✅ VIN processing components (Textract + NHTSA)
- ✅ Session management configuration
- ✅ Automotive tools integration

## Parallel vs Sequential Testing

- **Parallel Tests**: Independent tests that can run simultaneously for faster execution
- **Sequential Tests**: Tests that depend on previous context or state (VIN processing, conversation continuity)

## Customization

You can customize the test configuration by modifying `TEST_CONFIG` in `comprehensive-system-test.js`:

```javascript
const TEST_CONFIG = {
  graphqlEndpoint: 'your-graphql-endpoint',
  apiKey: 'your-api-key',
  testVin: 'your-test-vin',
  // ... other config
};
```

## Troubleshooting

### Common Issues

1. **GraphQL Connection Errors**
   - Verify API key is correct
   - Check GraphQL endpoint URL
   - Ensure network connectivity

2. **Test Timeouts**
   - VIN processing can take 10-20 seconds
   - Tool execution may take 20-30 seconds
   - Adjust timeout expectations if needed

3. **VIN Processing Failures**
   - Verify Textract permissions
   - Check NHTSA API availability
   - Validate test VIN format

### Debug Mode

Add debug logging by setting environment variable:
```bash
DEBUG=true npm test
```

## Contributing

When adding new tests:

1. Add test cases to appropriate suite in `TEST_SUITES`
2. Update expected response validation in `analyzeResponse()`
3. Consider whether tests should run in parallel or sequential
4. Update this README with new test descriptions

## Architecture

The test suite uses:
- **Node.js** with native HTTPS for GraphQL requests
- **Worker Threads** for true parallel test execution
- **Promise-based** async/await patterns
- **Comprehensive response analysis** with detailed reporting
- **Modular design** for easy extension and maintenance
