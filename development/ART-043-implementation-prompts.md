---
artifact_id: ART-043
title: Implementation Prompts
category: Development Implementation
priority: mandatory
dependencies:
  requires:
    - ART-041: Low-Level Design (implementation specifications and code organization)
    - ART-042: Technical Specifications (technology stack and development requirements)
    - ART-044: Test Cases (comprehensive test scenarios for TDD implementation)
  enhances:
    - ART-045: AWS Development Environment
    - ART-046: Infrastructure Requirements
validation_criteria:
  - All implementation prompts are complete and executable by Amazon Q CLI
  - Prompts follow Test-Driven Development (TDD) approach with Red-Green-Refactor cycle
  - Implementation sequence supports incremental development
  - Quality gates and validation steps included in each prompt
  - Prompts enable consistent code implementation through automated execution
quality_gates:
  - Implementation prompts cover all user story requirements
  - TDD workflow properly implemented in each prompt
  - Code quality standards enforced throughout prompts
  - Integration points clearly defined and tested
  - Progress tracking and validation mechanisms included
---

# Implementation Prompts - Dixon Smart Repair

## 🚨 **IMPLEMENTATION GUIDANCE DIRECTIVE**

**For ALL prompts in this document:**

1. **Consult MCP Servers** when encountering:
   - Any unfamiliar patterns, technologies, or best practices
   - AWS service configuration questions or integration patterns
   - React Native, UI/UX, or mobile development guidance
   - Testing strategies, performance optimization, or debugging approaches
   - Any technical implementation detail that needs expert guidance

2. **Ask for Clarification** whenever:
   - Any requirement, specification, or instruction is unclear or ambiguous
   - Multiple valid implementation approaches exist with different trade-offs
   - Business logic, user experience, or workflow decisions need input
   - Technical choices could significantly impact the system architecture
   - You're uncertain about any aspect of the implementation

3. **Always Proceed Confidently** when:
   - Requirements and specifications are clear and unambiguous
   - Standard patterns and documented best practices clearly apply
   - Implementation details are explicitly provided in ART-041/ART-042

**Key Principle: When in doubt, consult MCP servers for guidance and ask the user for clarification rather than making assumptions.**

**This directive applies to ALL prompts (1-15) in this document.**

---

## Purpose
Provide comprehensive directional prompts for Amazon Q CLI execution to implement Dixon Smart Repair using pure Test-Driven Development (TDD), with specific technical details from ART-041 and ART-042 dependencies, while leveraging MCP server guidance when needed.

## Context Information
- **Project Directory**: `/Users/saidachanda/development/dixon-smart-repair/`
- **Bootstrap Location**: `/Users/saidachanda/development/react-native-expo-app-bootstrap/`
- **Test Cases Reference**: `/Users/saidachanda/development/dixon-smart-repair/development/ART-044-test-cases.md`
- **Low-Level Design**: `/Users/saidachanda/development/dixon-smart-repair/development/ART-041-low-level-design.md`
- **Technical Specifications**: `/Users/saidachanda/development/dixon-smart-repair/development/ART-042-technical-specifications.md`

---

# Essential Pre-Prompts for Development Setup

## Purpose
These essential pre-prompts ensure AWS access and Tavily MCP integration are configured before executing the main Dixon Smart Repair implementation prompts.

---

# PRE-PROMPT A: AWS CLI and Amplify Development Setup

## Objective
Configure local development environment with AWS CLI and Amplify CLI for Dixon Smart Repair development in us-west-2 region.

## Prerequisites to Configure
Set up AWS development tools and access:
- **AWS CLI**: Configure for Dixon Smart Repair AWS account
- **Amplify CLI**: Install and configure for automotive project
- **AWS Credentials**: Set up development and production profiles
- **Service Access**: Verify permissions for required AWS services

## Implementation Guidance
Configure AWS development environment:

**Step 1: Install and Configure AWS CLI**
- Install AWS CLI v2 if not already installed
- Configure AWS credentials for Dixon Smart Repair account
- Set default region to us-west-2
- Create separate profiles for development and production

**Step 2: Install and Configure Amplify CLI**
- Install Amplify CLI: `npm install -g @aws-amplify/cli`
- Configure Amplify for us-west-2 region
- Set up IAM user for Amplify operations
- Verify Amplify can access required AWS services

**Step 3: Verify AWS Service Access**
- Test access to AWS Bedrock (Claude 3.5 Sonnet) in us-west-2
- Verify Cognito user pool creation permissions
- Confirm S3 bucket creation and management access
- Test Lambda function creation and deployment permissions

**Step 4: Configure Development Profiles**
- Create `dixonsmartrepair-dev` AWS profile
- Create `dixonsmartrepair-prod` AWS profile  
- Set appropriate permissions and region settings
- Test profile switching and access

## Validation Steps
- Verify AWS CLI can list services in us-west-2
- Confirm Amplify CLI is properly configured
- Test AWS service access with development credentials
- Validate both development and production profiles work

---

# PRE-PROMPT B: Tavily Web Search MCP Configuration and Validation

## Objective
Configure and validate the existing Tavily web search MCP server integration for Dixon Smart Repair Strands agents to enhance automotive diagnostics with real-time web search capabilities.

## Tavily Web Search MCP Configuration
Use the existing Tavily web search MCP server setup:
```json
"tavily-mcp": {
  "command": "npx",
  "args": ["-y", "tavily-mcp@0.1.3"],
  "env": {
    "TAVILY_API_KEY": "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"
  }
}
```

## Implementation Guidance
Validate and configure Tavily web search MCP for automotive data enhancement:

**Step 1: Verify Tavily Web Search MCP Server Access**
- Confirm the Tavily web search MCP server is accessible with provided configuration
- Test the API key: `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`
- Verify tavily-mcp@0.1.3 package functionality
- Test npx execution with provided arguments

**Step 2: Test Web Search for Automotive Data**
- Test web search queries for automotive parts information
- Verify web search results for labor rate data and repair procedures
- Test search capabilities for vehicle-specific repair information
- Validate search result quality and relevance for automotive diagnostics

**Step 3: Configure for Dixon Smart Repair Integration**
- Set up environment variables for development and production
- Configure MCP client integration with Strands agents for web search
- Set up caching strategy for web search results
- Configure rate limiting and usage monitoring for search API

**Step 4: Integration Testing**
- Test web search MCP connectivity from React Native environment
- Verify Strands agent can access Tavily web search data
- Test automotive-specific web search scenarios
- Validate error handling and fallback mechanisms for search failures

## Environment Configuration
Update environment variables to use Tavily web search MCP:
```bash
# Development Environment
TAVILY_WEB_SEARCH_API_KEY=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
TAVILY_MCP_VERSION=0.1.3
WEB_SEARCH_PROVIDER=tavily
WEB_SEARCH_CACHE_ENABLED=true

# Production Environment (use separate production API key when available)
TAVILY_WEB_SEARCH_API_KEY=your-prod-tavily-key
TAVILY_MCP_VERSION=0.1.3
WEB_SEARCH_PROVIDER=tavily
WEB_SEARCH_CACHE_ENABLED=true
WEB_SEARCH_RATE_LIMIT_ENABLED=true
```

## Validation Steps
- Confirm Tavily web search MCP server responds with provided API key
- Verify automotive web search queries return relevant and current data
- Test web search integration works with Strands agent architecture
- Validate caching and rate limiting function correctly for search requests

---

# PROMPT 1: Enhanced Bootstrap Project Creation and Foundation Setup

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 and ART-042 specifications when clear

## Objective
Create Dixon Smart Repair project using the enhanced React Native Expo bootstrap template with AWS-first development mode, establishing foundation with React Native 0.79.4 + Expo SDK 53 per ART-042, optimized for cloud-first development workflow.

## Test Cases to Implement First (RED Phase)
Reference `/Users/saidachanda/development/dixon-smart-repair/development/ART-044-test-cases.md` under "Bootstrap Project Creation Tests":
1. Test enhanced bootstrap setup completes successfully with AWS-first mode
2. Test project structure matches Dixon Smart Repair requirements from ART-041
3. Test React Native 0.79.4 + Expo SDK 53 dependencies from ART-042 are installed
4. Test AWS Amplify integration is configured for us-west-2 region
5. Test environment variables are set for AWS-first development
6. Test Tavily web search configuration is properly integrated
7. Test project builds and runs successfully with AWS backend

## Implementation Guidance (GREEN Phase)
Execute enhanced bootstrap project creation with AWS-first configuration:

**Step 1: Run Enhanced Bootstrap Setup**
- Navigate to `/Users/saidachanda/development/react-native-expo-app-bootstrap/`
- Execute: `./setup-dev-environment-enhanced.sh`
- Select Option 2: "AWS-First Development"
- Configure AWS Region: us-west-2
- Configure AWS Profile: dixonsmartrepair-dev
- Verify all AWS-first dependencies are installed

**Step 2: Create Dixon Smart Repair Project**
- Execute: `./create-project-enhanced.sh dixon-smart-repair`
- Confirm AWS-first development mode selection
- Verify project structure includes:
  - `src/` directory for React Native code
  - `amplify/` directory for AWS Amplify configuration
  - `aws-lambda/` directory for Lambda functions
  - `aws-config/` directory for AWS service configuration
  - `.env.development` with AWS-first environment variables

**Step 3: Configure AWS-First Environment Variables**
- Update `.env.development` with Dixon Smart Repair specific configuration:
  ```bash
  # Dixon Smart Repair AWS-First Configuration
  NODE_ENV=development
  DEVELOPMENT_MODE=aws
  PROJECT_NAME=dixon-smart-repair
  
  # AWS Configuration
  AWS_REGION=us-west-2
  AWS_PROFILE=dixonsmartrepair-dev
  
  # Tavily Web Search Configuration
  TAVILY_WEB_SEARCH_API_KEY=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
  TAVILY_MCP_VERSION=0.1.3
  WEB_SEARCH_PROVIDER=tavily
  WEB_SEARCH_CACHE_ENABLED=true
  
  # Automotive Application Configuration
  VIN_VALIDATION_STRICT=false
  DIAGNOSTIC_CONFIDENCE_THRESHOLD=65
  MAX_CONVERSATION_HISTORY=100
  ENABLE_DEBUG_LOGGING=true
  ```

**Step 4: Initialize AWS Amplify for Automotive Platform**
- Navigate to dixon-smart-repair project directory
- Execute: `amplify init`
- Configure Amplify project:
  - Project name: dixonsmartrepair
  - Environment: development
  - Default editor: Visual Studio Code
  - App type: javascript
  - Framework: react-native
  - Source directory: src
  - Distribution directory: dist
  - Build command: npm run build
  - Start command: npm start
  - Use AWS profile: dixonsmartrepair-dev

**Step 5: Add AWS Services for Automotive Platform**
- Add Authentication: `amplify add auth`
  - Configure for automotive users (email, name, phone for service location)
- Add API: `amplify add api`
  - Configure GraphQL API for automotive data
- Add Storage: `amplify add storage`
  - Configure S3 for vehicle photos and documents
- Deploy services: `amplify push`

**Step 6: Install Automotive-Specific Dependencies**
- Install web search client libraries:
  ```bash
  npm install axios @tanstack/react-query
  ```
- Install automotive UI components:
  ```bash
  npm install react-native-camera react-native-qrcode-scanner
  ```
- Install AWS SDK for automotive integrations:
  ```bash
  npm install @aws-sdk/client-bedrock @aws-sdk/client-s3
  ```

**Step 7: Configure Project Structure for Automotive Development**
- Create automotive-specific directories per ART-041:
  ```bash
  mkdir -p src/components/automotive
  mkdir -p src/services/automotive
  mkdir -p src/screens/automotive
  mkdir -p src/utils/automotive
  ```
- Set up automotive service structure:
  - `src/services/automotive/WebSearchService.ts`
  - `src/services/automotive/DataParsingService.ts`
  - `src/services/strands/StrandsAgentService.ts`
  - `src/services/amplify/AmplifyService.ts`

**Step 8: Validate AWS-First Development Environment**
- Test AWS CLI access: `aws sts get-caller-identity --profile dixonsmartrepair-dev`
- Test Amplify status: `amplify status`
- Test React Native build: `npm run build`
- Test Expo development server: `npm start`
- Verify all AWS services are accessible from development environment

## Validation Steps
- Enhanced bootstrap setup completes with AWS-first mode selected
- Dixon Smart Repair project created with proper AWS-first structure
- All AWS services (Amplify, Cognito, S3, Lambda) are configured
- Environment variables properly set for automotive development
- Tavily web search integration configured and accessible
- Project builds successfully and Expo development server starts
- AWS CLI and Amplify CLI work with dixonsmartrepair-dev profile
- All automotive-specific directories and service structure created

---

# PROMPT 2: Testing Framework Configuration for TDD

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-042 specifications and established testing patterns when clear

## Objective
Configure comprehensive testing framework using Jest 29.7.0, React Native Testing Library 12.4.0, and Detox 20.13.0 per ART-042, supporting TDD with 80% coverage threshold.

## Test Cases to Implement First (RED Phase)
Reference ART-044 under "Testing Framework Configuration Tests":
1. Test Jest configuration works with React Native 0.79.4 and TypeScript 5.3.0
2. Test React Native Testing Library renders automotive components
3. Test Detox E2E framework launches Dixon Smart Repair app
4. Test coverage reporting enforces 80% threshold from ART-042
5. Test automotive mock data from ART-044 is accessible
6. Test AWS service mocks (Amplify, Strands, MCP) respond correctly

## Implementation Guidance (GREEN Phase)
Configure testing using specifications from ART-041 and ART-042:

**Step 1: Configure Jest with Automotive Support**
- Set up Jest 29.7.0 with React Native preset
- Configure TypeScript 5.3.0 support and path mapping
- Set 80% coverage threshold per ART-042 requirements
- Add automotive test file patterns from ART-041

**Step 2: Set Up React Native Testing Library**
- Install @testing-library/react-native@^12.4.0
- Create automotive test utilities for ChatGPT-style components
- Set up custom render functions for automotive context providers
- Add automotive component testing patterns

**Step 3: Configure Detox for E2E Testing**
- Set up Detox 20.13.0 for iOS and Android
- Configure build scripts for automotive app testing
- Add device configurations for automotive UI scenarios
- Set up 120-second timeout for diagnostic workflows

**Step 4: Create Automotive Mock Data**
- Implement mock vehicle data from ART-044:
  - Honda Civic 2020 (VIN: 1HGBH41JXMN109186)
  - Toyota Camry 2019 (VIN: 4T1B11HK1KU123456)
- Add diagnostic scenarios (starter motor failure, brake pad wear)
- Create VIN validation test cases

**Step 5: Configure AWS Service Mocks**
- Mock AWS Amplify (Auth, API, Storage) per ART-042 configuration
- Mock Strands agent responses for 5-tool architecture
- Mock MCP server responses for Tavily integration
- Set up fallback scenarios for service unavailability

## Validation Steps
- Test framework detects and runs all automotive test files
- Verify 80% coverage threshold is enforced
- Confirm E2E testing can launch automotive app
- Test automotive mock data is accessible in all test files
- Validate AWS service mocks respond with correct interfaces

---

# PROMPT 3: ChatGPT-Style UI Component Tests and Implementation

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 specifications for ChatGPT-style interface requirements when clear

## Objective
Implement ChatGPT-style conversational interface using React Navigation 7.x, Zustand state management, and automotive ColorScheme from ART-041, with 44pt touch targets per ART-042.

## Test Cases to Implement First (RED Phase)
Reference ART-044 under "ChatGPT-Style UI Components Tests":
1. Test ConversationScreen uses ConversationScreenProps interface from ART-041
2. Test HamburgerMenu displays MenuSection enum values:
   - CHAT_HISTORY, PAST_INVOICES, SERVICE_HISTORY, MY_VEHICLES, PREFERRED_MECHANICS, MAINTENANCE_REMINDERS, SETTINGS
3. Test MessageBubble displays AutomotiveContext with diagnostic confidence
4. Test typing indicators respond within 50ms per ART-042
5. Test timestamps display within 100ms per ART-042
6. Test theme switching uses automotive ColorScheme from ART-041
7. Test + button opens PhotoAttachment and FileAttachment options
8. Test navigation preserves ConversationState across sections

## Implementation Guidance (GREEN Phase)
Create ChatGPT-style UI using technical specifications:

**Step 1: Implement ConversationScreen**
- Use ConversationScreenProps interface from ART-041
- Apply automotive ColorScheme with 60pt touch targets per ART-042
- Integrate React Navigation 7.x from ART-042
- Add vehicle context display using VehicleInfo interface

**Step 2: Build HamburgerMenu with MenuSection Enum**
- Implement MenuSection enum from ART-041
- Apply 300ms screen transition requirement from ART-042
- Use floating menu with 150ms animation per ART-042
- Add automotive navigation sections with proper spacing

**Step 3: Create MessageBubble with Automotive Context**
- Use Message and AutomotiveContext interfaces from ART-041
- Display diagnostic confidence, vehicle info, and tools used
- Implement react-native-markdown-display@^7.0.2 for AI responses
- Add 44pt minimum touch targets per ART-042

**Step 4: Implement Theme System**
- Use ThemeContextValue interface from ART-041
- Apply automotive display settings from ART-042
- Support auto brightness and high contrast for automotive use
- Implement system theme detection with persistence

**Step 5: Build Attachment System**
- Use PhotoAttachment and FileAttachment interfaces from ART-041
- Integrate expo-camera and expo-image-picker per ART-042
- Meet 1000ms camera launch requirement from ART-042
- Add automotive photo categorization

## Validation Steps
- Test components meet 44pt touch target requirement
- Verify 300ms screen transition performance
- Confirm automotive ColorScheme applied correctly
- Test camera launches within 1000ms
- Validate conversation state persists across navigation

---

# PROMPT 4: CDK Infrastructure + Amplify Libraries Integration Tests and Setup

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-042 backend-config.json structure when clear

## Objective
Configure hybrid architecture using CDK for infrastructure deployment and Amplify libraries for client-side integration, supporting branch-based deployment with dixonsmartrepair configuration and automotive user profiles. This approach follows AWS best practices for using Amplify libraries without the Amplify service.

## Test Cases to Implement First (RED Phase)
Reference ART-044 under "CDK Infrastructure + Amplify Libraries Integration Tests":
1. Test CDK infrastructure deploys Cognito, AppSync, S3, and Lambda successfully
2. Test Amplify libraries connect to CDK-deployed infrastructure
3. Test aws-config.ts provides proper configuration for Amplify libraries
4. Test Cognito authentication works with EMAIL username and automotive user attributes
5. Test AppSync API integration supports automotive GraphQL operations
6. Test S3 storage handles vehicle photos with proper OAC security
7. Test develop branch → development environment deployment
8. Test environment variables from ART-042 are accessible
9. Test hybrid architecture maintains security best practices

## Implementation Guidance (GREEN Phase)
Configure hybrid CDK + Amplify libraries architecture using ART-042 specifications:

**Step 1: Verify CDK Infrastructure Deployment**
- Confirm CDK stack is deployed with all required services:
  - Cognito User Pool: `us-west-2_KzSQ4KRWO`
  - Cognito User Pool Client: `d99c0vsi4agvatvjiouv7pcgq`
  - Identity Pool: `us-west-2:45fc6f68-250a-47d8-bb75-aef556c0c81e`
  - AppSync API: `https://ar2pbqk5fjelrkcvwi26fgck4m.appsync-api.us-west-2.amazonaws.com/graphql`
  - API Key: `da2-dqtdq7bvgfdcpdfwbv4u54xgr4`
  - S3 Bucket: `dixon-vehicle-photos-041063310146-us-west-2`
  - CloudFront Distribution: `https://d3atyhyv8oqgqj.cloudfront.net`

**Step 2: Configure Amplify Libraries with CDK Infrastructure**
- Update `src/aws-config.ts` with CDK-deployed resource identifiers
- Configure Amplify Auth to use CDK-deployed Cognito User Pool
- Set up Amplify API to connect to CDK-deployed AppSync endpoint
- Configure Amplify Storage to use CDK-deployed S3 bucket
- Ensure proper authentication flow between services

**Step 3: Implement Automotive User Profile Configuration**
- Configure Cognito User Pool attributes for automotive users:
  - EMAIL as username (required)
  - GIVEN_NAME, FAMILY_NAME for user identification
  - PHONE_NUMBER for service location and notifications
  - Custom attributes for automotive preferences
- Set up optional MFA with SMS per ART-042
- Configure user registration and sign-in flows

**Step 4: Set Up AppSync API Integration**
- Configure GraphQL API connection using Amplify API
- Set up authentication modes (API Key for public, Cognito for private)
- Add automotive data type schemas and resolvers
- Configure real-time subscriptions for diagnostic updates
- Test GraphQL operations with proper authentication

**Step 5: Configure S3 Storage with Security Best Practices**
- Set up Amplify Storage to use CDK-deployed S3 bucket
- Configure Origin Access Control (OAC) for CloudFront security
- Ensure S3 bucket has all public access blocked (security best practice)
- Set proper IAM permissions for vehicle photo uploads
- Configure file upload limits and supported formats
- Enable encryption at rest using AWS KMS

**Step 6: Implement Branch-Based Deployment Strategy**
- Configure develop branch → development environment
- Set main branch → production environment
- Add environment-specific configuration management
- Set up automated deployment triggers
- Configure environment variable management

**Step 7: Environment Variable Configuration**
- Set development variables from ART-042:
  ```typescript
  // Development Environment
  const AWS_CONFIG = {
    Auth: {
      Cognito: {
        userPoolId: 'us-west-2_KzSQ4KRWO',
        userPoolClientId: 'd99c0vsi4agvatvjiouv7pcgq',
        identityPoolId: 'us-west-2:45fc6f68-250a-47d8-bb75-aef556c0c81e',
        loginWith: {
          username: true,
          email: true,
        },
      },
    },
    API: {
      GraphQL: {
        endpoint: 'https://ar2pbqk5fjelrkcvwi26fgck4m.appsync-api.us-west-2.amazonaws.com/graphql',
        region: 'us-west-2',
        defaultAuthMode: 'apiKey',
        apiKey: 'da2-dqtdq7bvgfdcpdfwbv4u54xgr4',
      },
    },
    Storage: {
      S3: {
        bucket: 'dixon-vehicle-photos-041063310146-us-west-2',
        region: 'us-west-2',
      },
    },
  };
  ```

**Step 8: Test Hybrid Architecture Integration**
- Test Amplify Auth with CDK-deployed Cognito
- Verify AppSync API calls work with proper authentication
- Test S3 file uploads through Amplify Storage
- Confirm CloudFront serves web application securely
- Validate all services work together seamlessly

**Step 9: Implement Automotive-Specific Features**
- Add VIN validation service integration
- Configure diagnostic workflow API endpoints
- Set up vehicle photo categorization and storage
- Implement service history and maintenance tracking
- Add Strands agent integration endpoints

**Step 10: Security and Performance Validation**
- Verify S3 bucket security (all public access blocked)
- Test CloudFront Origin Access Control (OAC) functionality
- Confirm proper authentication flows
- Validate API rate limiting and security
- Test performance meets automotive requirements

## Validation Steps
- Test CDK infrastructure provides all required AWS services
- Verify Amplify libraries successfully connect to CDK-deployed resources
- Confirm automotive user authentication works with Cognito
- Test AppSync API integration supports GraphQL operations
- Validate S3 storage handles vehicle photos securely with OAC
- Test branch deployment triggers work correctly
- Verify environment variables match ART-042 specifications
- Confirm hybrid architecture maintains AWS security best practices
- Test end-to-end automotive workflow functionality

---

# PROMPT 5: Lambda Backend Enhancement Tests and Implementation

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 StrandsAgentService and MCPService classes when clear

## Objective
Enhance existing Lambda backend with automotive endpoints using StrandsAgentService and MCPService patterns from ART-041, leveraging current AWS infrastructure (DynamoDB, Bedrock, Cognito) with automotive dependencies from ART-042.

## Test Cases to Implement First (RED Phase)
Reference ART-044 under "Lambda Backend Integration Tests":
1. Test automotive endpoints use DiagnosticRequest/DiagnosticResult interfaces
2. Test VIN validation uses VINValidationResult from ART-041
3. Test Strands integration uses Result<T, E> pattern from ART-041
4. Test MCP connectivity uses MCPConfiguration from ART-042
5. Test error handling provides graceful degradation
6. Test authentication middleware protects automotive endpoints
7. Test performance meets 15-second workflow requirement

## Implementation Guidance (GREEN Phase)
Enhance existing Lambda functions using ART-041 and ART-042 specifications:

**Step 1: Enhance Lambda Dependencies**
- Update package.json with automotive dependencies:
  - @aws-sdk/client-bedrock-runtime for AWS Strands integration
  - axios for MCP HTTP calls
  - ioredis for Redis caching
  - automotive validation libraries

**Step 2: Expand Automotive Endpoints**
- Enhance existing `/diagnose` endpoint with DiagnosticRequest interface
- Add `/validate-vin` endpoint using VINValidationResult from ART-041
- Expand `/conversation` endpoint with VehicleInfo interface
- Implement Result<T, E> pattern for consistent error handling

**Step 3: Integrate AWS Strands Agent Service**
- Enhance existing Bedrock integration with StrandsAgentService patterns
- Configure AWS Bedrock client with region and credentials (already implemented)
- Add 5-tool methods with timeouts from ART-042:
  - symptom_diagnosis_analyzer (10s timeout)
  - parts_availability_lookup (15s timeout, MCP enabled)
  - labor_estimator (10s timeout, MCP enabled)
  - pricing_calculator (5s timeout)
  - repair_instructions (10s timeout, MCP enabled)

**Step 4: Add MCP Service Integration**
- Implement MCPService patterns within Lambda functions
- Configure Tavily primary provider from ART-042
- Add ElastiCache Redis integration with TTL settings:
  - Parts: 14400s (4 hours)
  - Labor: 86400s (24 hours)
  - Procedures: 604800s (7 days)
- Implement fallback providers and error handling

**Step 5: Enhance Authentication and Rate Limiting**
- Expand existing Cognito JWT validation
- Add rate limiting per ART-042 (10 diagnostic requests/minute)
- Enhance existing CORS configuration
- Add request validation and sanitization

## Validation Steps
- Test enhanced automotive endpoints respond with correct interfaces
- Verify Strands integration works with 5-tool architecture
- Confirm MCP integration provides real-time data with caching
- Test error handling provides graceful degradation
- Validate performance meets 15-second workflow requirement

---

# PROMPT 6: Strands Conversational Agent Implementation

## Context Essentials
- **Project**: Dixon Smart Repair - Conversational automotive diagnostic chatbot
- **Previous**: Infrastructure deployed, frontend operational, architecture simplified (PROMPT 1-5)
- **Goal**: Replace placeholder responses with Python Strands Agent + context-aware automotive search
- **Build On**: Existing AppSync GraphQL schema, DynamoDB tables, Lambda placeholder

## Quick Validation
**Check**: Open https://d3atyhyv8oqgqj.cloudfront.net and test login
**Expected**: React Native chat app loads with placeholder responses
**If Fails**: Verify AWS SSO session: `aws sso login --profile dixonsmartrepair-dev`

## Context Sources
- **current-state.md**: Complete project status and technical readiness
- **session-context.md**: Full session context and architectural decisions
- **ART-041 Section 3.2**: Vehicle context handling patterns and conversation memory
- **acceptance-criteria.md US-003, US-025, US-026**: Vehicle information choice requirements

## Implementation

### Step 1: Create Python Strands Agent Lambda
Replace `lambda/strands-chatbot.py` with context-aware implementation:
```python
from strands import Agent, tool
import os
import requests
import boto3
import json
import uuid
from datetime import datetime

@tool
def search_automotive_info(query: str, vehicle_context: str = "generic") -> str:
    """Context-aware automotive search via Tavily MCP"""
    api_key = os.environ['TAVILY_API_KEY']
    
    # Adapt search based on vehicle context
    if vehicle_context.startswith("vin:"):
        # Most specific search with VIN-based queries
        search_query = f"automotive {query} {vehicle_context} specific parts TSB recalls"
    elif vehicle_context.startswith("basic:"):
        # Vehicle-type specific search
        search_query = f"automotive {query} {vehicle_context} common issues"
    else:
        # Generic automotive search
        search_query = f"automotive {query} general common causes"
    
    try:
        response = requests.post("https://api.tavily.com/search", json={
            "api_key": api_key,
            "query": search_query,
            "search_depth": "advanced",
            "include_domains": ["autozone.com", "rockauto.com", "repairpal.com"],
            "max_results": 3
        })
        
        if response.status_code == 200:
            results = response.json()
            return f"Automotive search results: {results.get('answer', 'No specific answer')}"
    except Exception as e:
        print(f"Tavily search error: {e}")
    
    return "Automotive search temporarily unavailable, using general knowledge"

# Create conversational Strands agent
chatbot = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    tools=[search_automotive_info],
    system_prompt="""You are Dixon, a conversational automotive diagnostic assistant.

IMPORTANT: Always be transparent about guidance accuracy levels:

**When providing GENERAL guidance (no vehicle info):**
- Start responses with: "Based on general automotive knowledge..."
- End with: "For more specific guidance tailored to your exact vehicle, I can help better if you share your car's make, model, and year - or even better, scan your VIN for the most precise recommendations."

**When providing BASIC vehicle guidance (make/model/year):**
- Start responses with: "For your [Make Model Year]..."
- End with: "This is vehicle-specific guidance. For the most precise recommendations including exact part numbers and recalls, I could scan your VIN."

**When providing VIN-BASED guidance:**
- Start responses with: "Based on your specific vehicle (VIN: [last 4 digits])..."
- Emphasize: "This is the most accurate guidance possible for your exact vehicle."

Always explain WHY more information helps: "More vehicle details help me give you precise part numbers, known issues for your specific model, and accurate pricing."

Be conversational and helpful, but always make the accuracy level crystal clear."""
)

def lambda_handler(event, context):
    """Context-aware conversational handler"""
    message = event['arguments']['message']
    conversation_id = event['arguments']['conversationId']
    
    # Get conversation context with vehicle information
    context = get_conversation_context(conversation_id)
    vehicle_context = extract_vehicle_context(context)
    
    # Build context-aware prompt
    if context:
        contextual_message = f"Previous conversation:\n{context}\n\nCurrent message: {message}"
    else:
        contextual_message = message
    
    # Strands agent processes with context and decides tool usage
    response = chatbot(contextual_message)
    
    # Store conversation with vehicle context tracking
    store_message(conversation_id, 'USER', message)
    store_message(conversation_id, 'ASSISTANT', response.message)
    update_vehicle_context(conversation_id, message)
    
    return {
        'conversationId': conversation_id,
        'message': response.message,
        'poweredBy': 'Strands AI'
    }
```

### Step 2: Add Conversation Memory System
Add conversation context management:
```python
# DynamoDB setup
dynamodb = boto3.resource('dynamodb')
messages_table = dynamodb.Table(os.environ['MESSAGE_TABLE'])
conversations_table = dynamodb.Table(os.environ['CONVERSATION_TABLE'])

def get_conversation_context(conversation_id: str, last_n_messages: int = 10) -> str:
    """Retrieve recent conversation context with vehicle information"""
    
    # Get conversation metadata including vehicle context
    try:
        conversation_response = conversations_table.get_item(
            Key={'conversationId': conversation_id}
        )
        vehicle_context = conversation_response.get('Item', {}).get('vehicleContext', 'generic')
    except:
        vehicle_context = 'generic'
    
    # Get recent messages
    response = messages_table.query(
        KeyConditionExpression='conversationId = :cid',
        ExpressionAttributeValues={':cid': conversation_id},
        ScanIndexForward=False,  # Most recent first
        Limit=last_n_messages
    )
    
    messages = response.get('Items', [])
    messages.reverse()  # Chronological order
    
    # Format for LLM context with vehicle information
    context_lines = []
    if vehicle_context != 'generic':
        context_lines.append(f"Vehicle Context: {vehicle_context}")
    
    for msg in messages:
        context_lines.append(f"{msg['sender']}: {msg['content']}")
    
    return "\n".join(context_lines)

def extract_vehicle_context(conversation_history: str) -> str:
    """Extract vehicle information from conversation history"""
    import re
    
    # Look for VIN patterns first (highest priority)
    vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
    vin_match = re.search(vin_pattern, conversation_history)
    if vin_match:
        return f"vin:{vin_match.group()}"
    
    # Look for basic vehicle info (medium priority)
    vehicle_pattern = r'(\d{4})\s+([A-Za-z]+)\s+([A-Za-z]+)'
    vehicle_match = re.search(vehicle_pattern, conversation_history)
    if vehicle_match:
        year, make, model = vehicle_match.groups()
        return f"basic:{make} {model} {year}"
    
    return "generic"

def store_message(conversation_id: str, sender: str, content: str):
    """Store message with conversation context"""
    messages_table.put_item(Item={
        'conversationId': conversation_id,
        'timestamp': datetime.utcnow().isoformat(),
        'sender': sender,
        'content': content,
        'id': str(uuid.uuid4())
    })

def update_vehicle_context(conversation_id: str, message: str):
    """Update conversation metadata with vehicle information"""
    vehicle_info = extract_vehicle_context(message)
    if vehicle_info != "generic":
        try:
            conversations_table.update_item(
                Key={'conversationId': conversation_id},
                UpdateExpression='SET vehicleContext = :vc',
                ExpressionAttributeValues={':vc': vehicle_info}
            )
        except:
            # Create conversation record if it doesn't exist
            conversations_table.put_item(Item={
                'conversationId': conversation_id,
                'vehicleContext': vehicle_info,
                'createdAt': datetime.utcnow().isoformat()
            })
```

### Step 3: Deploy and Test
Deploy the updated Lambda and test conversational flow:
```bash
# Deploy updated Lambda
cd /Users/saidachanda/development/dixon-smart-repair
cdk deploy --profile dixonsmartrepair-dev

# Test conversational flow
# 1. Open https://d3atyhyv8oqgqj.cloudfront.net
# 2. Login: viveksaichanda@gmail.com / TempPass123!
# 3. Test: "My brakes are squeaking"
# 4. Test: "It's a 2020 Honda Civic"
# 5. Verify: Agent provides vehicle-specific guidance with clear accuracy levels
```

## Completion Checklist
- [ ] Python Strands Agent responds to automotive queries with appropriate guidance levels
- [ ] Vehicle context extraction working (generic/basic/VIN) with clear user communication
- [ ] Conversation memory maintains context across messages and sessions
- [ ] Real-time chat integration functional via AppSync GraphQL subscriptions
- [ ] Update current-state.md with "Strands Agent - Complete"

## Validation
**Test**: Open chat app, send "My car makes noise" → should get conversational response with guidance level
**Expected**: Natural automotive guidance with clear accuracy communication ("Based on general automotive knowledge...")

## Next Prompt Ready
- **Enables**: Real-time chat testing and performance optimization
- **Provides**: Functional conversational automotive assistant with 3-tier vehicle information system
- **Ready For**: PROMPT 7 - Real-time Chat Integration and Testing

```python
# dixon-strands-chatbot.py
from strands import Agent, tool
import json
import boto3
import requests
from datetime import datetime

@tool
def search_automotive_info(query: str, vehicle_context: str = "generic") -> str:
    """Search automotive information with context-aware accuracy
    
    Args:
        query: User's automotive query
        vehicle_context: "generic" | "basic:Make Model Year" | "vin:ACTUAL_VIN"
    """
    api_key = os.environ['TAVILY_API_KEY']
    
    # Adjust search strategy based on vehicle context
    if vehicle_context.startswith("vin:"):
        # Most specific search with VIN-based queries
        automotive_query = f"automotive {query} {vehicle_context} specific parts TSB recalls"
    elif vehicle_context.startswith("basic:"):
        # Vehicle-type specific search
        automotive_query = f"automotive {query} {vehicle_context} common issues"
    else:
        # Generic automotive search
        automotive_query = f"automotive {query} general common causes"
    
    response = requests.post("https://api.tavily.com/search", json={
        "api_key": api_key,
        "query": automotive_query,
        "search_depth": "advanced",
        "include_domains": ["autozone.com", "rockauto.com", "repairpal.com"],
        "max_results": 3
    })
    
    if response.status_code == 200:
        results = response.json()
        return f"Automotive search results: {results.get('answer', 'No specific answer')}"
    return "Automotive search temporarily unavailable"

# Create conversational Strands agent (created once, reused across invocations)
chatbot = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    tools=[search_automotive_info],
    system_prompt="""You are Dixon, a conversational automotive diagnostic assistant.

IMPORTANT: Always be transparent about guidance accuracy levels:

**When providing GENERAL guidance (no vehicle info):**
- Start responses with: "Based on general automotive knowledge..."
- End with: "For more specific guidance tailored to your exact vehicle, I can help better if you share your car's make, model, and year - or even better, scan your VIN for the most precise recommendations."

**When providing BASIC vehicle guidance (make/model/year):**
- Start responses with: "For your [Make Model Year]..."
- End with: "This is vehicle-specific guidance. For the most precise recommendations including exact part numbers and recalls, I could scan your VIN."

**When providing VIN-BASED guidance:**
- Start responses with: "Based on your specific vehicle (VIN: [last 4 digits])..."
- Emphasize: "This is the most accurate guidance possible for your exact vehicle."

Always explain WHY more information helps: "More vehicle details help me give you precise part numbers, known issues for your specific model, and accurate pricing."

Be conversational and helpful, but always make the accuracy level crystal clear."""
)

def lambda_handler(event, context):
    """Context-aware conversational handler"""
    message = event['arguments']['message']
    conversation_id = event['arguments']['conversationId']
    
    # Get conversation context with vehicle information
    context = get_conversation_context(conversation_id)
    vehicle_context = extract_vehicle_context(context)
    
    # Build context-aware prompt
    if context:
        contextual_message = f"Previous conversation:\n{context}\n\nCurrent message: {message}"
    else:
        contextual_message = message
    
    # Strands agent processes with context and decides tool usage
    # Vehicle context is automatically available to the search tool
    response = chatbot(contextual_message)
    
    # Store conversation with vehicle context tracking
    store_message(conversation_id, 'USER', message)
    store_message(conversation_id, 'ASSISTANT', response.message)
    update_vehicle_context(conversation_id, message)
    
    return {
        'conversationId': conversation_id,
        'message': response.message,
        'poweredBy': 'Strands AI'
    }

def extract_vehicle_context(conversation_history: str) -> str:
    """Extract vehicle information from conversation history"""
    # Look for VIN patterns
    import re
    vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
    vin_match = re.search(vin_pattern, conversation_history)
    if vin_match:
        return f"vin:{vin_match.group()}"
    
    # Look for make/model/year patterns
    vehicle_pattern = r'(\d{4})\s+([A-Za-z]+)\s+([A-Za-z]+)'
    vehicle_match = re.search(vehicle_pattern, conversation_history)
    if vehicle_match:
        year, make, model = vehicle_match.groups()
        return f"basic:{make} {model} {year}"
    
    return "generic"

def update_vehicle_context(conversation_id: str, message: str):
    """Update conversation metadata with vehicle information"""
    vehicle_info = extract_vehicle_context(message)
    if vehicle_info != "generic":
        conversations_table.update_item(
            Key={'conversationId': conversation_id},
            UpdateExpression='SET vehicleContext = :vc',
            ExpressionAttributeValues={':vc': vehicle_info}
        )
```

### **Step 2: Update AppSync GraphQL Schema**

```graphql
# Conversational chat schema
type Message {
  id: String!
  conversationId: String!
  content: String!
  sender: String!
  timestamp: String!
}

type Mutation {
  sendMessage(message: String!, conversationId: String): Message
}

type Subscription {
  onMessageAdded(conversationId: String!): Message
    @aws_subscribe(mutations: ["sendMessage"])
}
```

### **Step 3: Implement Conversation Memory System**

```python
# Conversation context management with vehicle information
def get_conversation_context(conversation_id: str, last_n_messages: int = 10) -> str:
    """Retrieve recent conversation context with vehicle information for Strands agent"""
    
    # Get conversation metadata including vehicle context
    conversation_response = conversations_table.get_item(
        Key={'conversationId': conversation_id}
    )
    vehicle_context = conversation_response.get('Item', {}).get('vehicleContext', 'generic')
    
    # Get recent messages
    response = messages_table.query(
        KeyConditionExpression='conversationId = :cid',
        ExpressionAttributeValues={':cid': conversation_id},
        ScanIndexForward=False,  # Most recent first
        Limit=last_n_messages
    )
    
    messages = response.get('Items', [])
    messages.reverse()  # Chronological order
    
    # Format for LLM context with vehicle information
    context_lines = []
    if vehicle_context != 'generic':
        context_lines.append(f"Vehicle Context: {vehicle_context}")
    
    for msg in messages:
        context_lines.append(f"{msg['sender']}: {msg['content']}")
    
    return "\n".join(context_lines)

def store_message(conversation_id: str, sender: str, content: str):
    """Store message with conversation context"""
    messages_table.put_item(Item={
        'conversationId': conversation_id,
        'timestamp': datetime.utcnow().isoformat(),
        'sender': sender,
        'content': content,
        'id': str(uuid.uuid4())
    })
    
    # Ensure conversation record exists
    conversations_table.put_item(
        Item={
            'conversationId': conversation_id,
            'createdAt': datetime.utcnow().isoformat(),
            'lastActivity': datetime.utcnow().isoformat(),
            'vehicleContext': extract_vehicle_context(content) if sender == 'USER' else 'generic'
        },
        ConditionExpression='attribute_not_exists(conversationId)'
    )
```

### **Step 4: Update Frontend to Conversational Chat**

```typescript
// Replace complex diagnostic workflow with simple chat
const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    
    // Real-time subscription to new messages
    useSubscription(MESSAGE_SUBSCRIPTION, {
        variables: { conversationId },
        onSubscriptionData: ({ subscriptionData }) => {
            const newMessage = subscriptionData.data.onMessageAdded;
            setMessages(prev => [...prev, newMessage]);
        }
    });
    
    const sendMessage = async () => {
        if (!inputMessage.trim()) return;
        
        // Send via GraphQL mutation
        await sendMessageMutation({
            variables: { 
                message: inputMessage, 
                conversationId: currentConversationId 
            }
        });
        
        setInputMessage('');
        // AppSync subscription automatically updates UI
    };
    
    return (
        <View style={styles.chatContainer}>
            <FlatList
                data={messages}
                renderItem={({ item }) => (
                    <MessageBubble 
                        message={item.content}
                        sender={item.sender}
                        timestamp={item.timestamp}
                    />
                )}
            />
            <ChatInput 
                value={inputMessage}
                onChangeText={setInputMessage}
                onSend={sendMessage}
            />
        </View>
    );
};
```

### **Step 5: Deploy Simplified Architecture**

```typescript
// Update CDK to use Python Strands Lambda
const strandsLambda = new lambda.Function(this, 'StrandsChatbot', {
    runtime: lambda.Runtime.PYTHON_3_11,
    handler: 'dixon-strands-chatbot.lambda_handler',
    code: lambda.Code.fromAsset('lambda'),
    timeout: Duration.seconds(30),
    environment: {
        CONVERSATION_TABLE: conversationTable.tableName,
        MESSAGE_TABLE: messageTable.tableName,
        TAVILY_API_KEY: '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'
    },
    layers: [strandsAgentsLayer] // Strands dependencies
});

// AppSync resolver for chat
new appsync.Resolver(this, 'ChatResolver', {
    api: graphqlApi,
    typeName: 'Mutation',
    fieldName: 'sendMessage',
    dataSource: new appsync.LambdaDataSource(this, 'ChatDataSource', {
        lambda: strandsLambda,
        api: graphqlApi
    })
});
```

## Validation Steps

### **Test Conversational Flow with Vehicle Information Levels:**
1. **Generic guidance flow**: 
   - User: "My brakes are squeaking" 
   - Agent: "Based on general automotive knowledge..." + offers vehicle info options
2. **Basic vehicle info flow**: 
   - User: "It's a 2020 Honda Civic" 
   - Agent: "For your 2020 Honda Civic..." + offers VIN option for precision
3. **VIN-based flow**: 
   - User provides VIN 
   - Agent: "Based on your specific vehicle (VIN: [last 4])..." + most accurate guidance
4. **Information level upgrades**: User can upgrade from generic → basic → VIN seamlessly
5. **Context continuity**: Vehicle information persists and improves responses throughout conversation

### **Verify Vehicle Context System:**
1. **Context extraction**: System correctly identifies vehicle info from conversation
2. **Context persistence**: Vehicle information stored and retrieved across sessions  
3. **Search tool adaptation**: Tool uses appropriate search strategy based on vehicle context
4. **Confidence communication**: Agent clearly communicates accuracy level to user

### **Test Memory System:**
1. **Context retrieval**: Previous messages and vehicle info loaded correctly
2. **Real-time updates**: New messages appear immediately via AppSync subscriptions
3. **Conversation persistence**: Chat history maintained across app sessions
4. **Vehicle context tracking**: System remembers user's chosen information level

### **Validate Tool Usage:**
1. **LLM decision-making**: Agent naturally decides when to use automotive search tool
2. **Context-aware searches**: Tool queries adapt based on available vehicle information
3. **Graceful fallback**: System handles Tavily API failures with LLM knowledge
4. **Response integration**: Tool results naturally integrated into conversational responses
2. **Conversation continuity**: Agent references earlier discussion
3. **User vehicle memory**: Remembers vehicle details across sessions
4. **Real-time updates**: Messages appear instantly via subscriptions

### **Performance Validation:**
1. **Response time**: < 5 seconds for tool-assisted queries
2. **Context loading**: < 200ms for conversation history
3. **Real-time delivery**: < 500ms for message subscriptions
4. **Memory efficiency**: Context size < 10KB per conversation

## Success Criteria

✅ **Conversational Experience**: Natural chat flow with automotive context  
✅ **Tool Usage**: LLM decides when to search automotive information  
✅ **Memory System**: Maintains context across conversation turns  
✅ **Real-time Chat**: Instant message delivery via AppSync subscriptions  
✅ **Simplified Architecture**: Single Strands agent replaces complex workflows  

This approach transforms Dixon Smart Repair from a rigid diagnostic tool into a **conversational automotive assistant** that users can chat with naturally about their vehicle issues.

---

# PROMPT 7: Real-time Chat Integration and Testing

## Context Essentials
- **Project**: Dixon Smart Repair - Conversational automotive diagnostic chatbot
- **Previous**: Python Strands Agent operational with automotive search tool (PROMPT 6)
- **Goal**: Optimize real-time chat experience and validate conversational flows
- **Build On**: Existing AppSync GraphQL subscriptions, conversation memory system

## Quick Validation
**Check**: Open https://d3atyhyv8oqgqj.cloudfront.net and send test message
**Expected**: Strands Agent responds with conversational automotive guidance
**If Fails**: Check current-state.md for Strands Agent completion status

## Context Sources
- **current-state.md**: Strands Agent section - Current implementation status
- **ART-044 Section 7**: Real-time chat integration test cases
- **acceptance-criteria.md US-003**: Natural language conversation requirements

## Implementation

### Step 1: Enhance Real-time Chat Performance
Optimize AppSync GraphQL subscriptions:
```typescript
// Update ChatInterface.tsx for better real-time experience
const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    
    // Enhanced subscription with typing indicators
    useSubscription(MESSAGE_SUBSCRIPTION, {
        variables: { conversationId },
        onSubscriptionData: ({ subscriptionData }) => {
            const newMessage = subscriptionData.data.onMessageAdded;
            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
        }
    });
    
    const sendMessage = async (text: string) => {
        setIsTyping(true);
        await sendMessageMutation({
            variables: { message: text, conversationId }
        });
    };
    
    return (
        <View style={styles.chatContainer}>
            <MessageList messages={messages} />
            {isTyping && <TypingIndicator />}
            <ChatInput onSend={sendMessage} />
        </View>
    );
};
```

### Step 2: Add Comprehensive Chat Testing
Create test suite for conversational flows:
```javascript
// tests/integration/conversational-flow.test.js
describe('Conversational Automotive Assistant', () => {
    test('Vehicle information choice flow', async () => {
        // Test 3-tier vehicle information system
        const responses = await testConversationFlow([
            { input: "My brakes are squeaking", expectedPattern: /general automotive knowledge/ },
            { input: "It's a 2020 Honda Civic", expectedPattern: /For your 2020 Honda Civic/ },
            { input: "VIN: 1HGBH41JXMN109186", expectedPattern: /specific vehicle.*VIN/ }
        ]);
        
        expect(responses).toHaveLength(3);
        expect(responses[2].confidence).toBeGreaterThan(responses[1].confidence);
    });
    
    test('Context memory across conversation', async () => {
        await sendMessage("My car is making noise");
        await sendMessage("What could cause this?");
        
        const lastResponse = await getLastMessage();
        expect(lastResponse.content).toMatch(/noise.*car/i);
    });
});
```

### Step 3: Performance Optimization
Implement caching and optimization:
```python
# Add to strands-chatbot.py
from functools import lru_cache
import time

class OptimizedMemorySystem:
    def __init__(self):
        self.context_cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    @lru_cache(maxsize=100)
    def get_conversation_context(self, conversation_id: str) -> str:
        # Cached context retrieval for performance
        cache_key = f"context:{conversation_id}"
        if cache_key in self.context_cache:
            cached_data, timestamp = self.context_cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return cached_data
        
        # Load from DynamoDB and cache
        context = self._load_context_from_db(conversation_id)
        self.context_cache[cache_key] = (context, time.time())
        return context
```

## Completion Checklist
- [ ] Real-time chat performance optimized (<2 second response times)
- [ ] Conversational flow testing comprehensive (all vehicle info levels)
- [ ] Context memory system validated across sessions
- [ ] Performance benchmarks met (conversation context <200ms)
- [ ] Update current-state.md with "Real-time Chat - Optimized"

## Validation
**Test**: Complete conversation flow from generic → basic → VIN guidance
**Expected**: Smooth real-time experience with appropriate confidence scaling

## Next Prompt Ready
- **Enables**: VIN scanning and vehicle identification features
- **Provides**: Optimized real-time conversational experience
- **Ready For**: PROMPT 8 - VIN and Vehicle Information System
            {...props}
            wrapperStyle={{
                right: { backgroundColor: '#007AFF' },
                left: { backgroundColor: '#f0f0f0' }
            }}
            textStyle={{
                right: { color: 'white' },
                left: { color: '#333' }
            }}
            renderCustomView={() => {
                // Render automotive-specific content
                if (currentMessage.poweredBy === 'Strands AI') {
                    return (
                        <View style={styles.strandsIndicator}>
                            <Text style={styles.strandsText}>🤖 Powered by Strands AI</Text>
                        </View>
                    );
                }
                return null;
            }}
        />
    );
};

// Automotive input with voice and photo capabilities
const renderAutomotiveInput = (props) => {
    return (
        <InputToolbar
            {...props}
            containerStyle={styles.inputToolbar}
            renderActions={() => (
                <View style={styles.inputActions}>
                    <TouchableOpacity onPress={handleVoiceInput}>
                        <Icon name="mic" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePhotoInput}>
                        <Icon name="camera" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            )}
        />
    );
};
```

### **Step 3: Conversation Testing Framework**

```typescript
// Comprehensive chat testing
describe('Conversational Chat Integration', () => {
    
    test('Basic conversation flow', async () => {
        // Test natural conversation progression
        const responses = await testConversationFlow([
            { input: "Hi there!", expectedPattern: /hello|hi|automotive/i },
            { input: "My car is making noise", expectedPattern: /what.*kind.*noise|describe/i },
            { input: "Squeaking when I brake", expectedPattern: /brake.*pad|brake.*wear/i },
            { input: "2020 Honda Civic", expectedPattern: /honda.*civic.*brake/i }
        ]);
        
        expect(responses).toHaveLength(4);
        responses.forEach(response => {
            expect(response.poweredBy).toBe('Strands AI');
        });
    });
    
    test('Context memory across messages', async () => {
        // Test conversation memory
        await sendMessage("My car is a 2020 Honda Civic");
        await sendMessage("What do brake pads cost?");
        
        const lastResponse = await getLastMessage();
        expect(lastResponse.content).toMatch(/honda.*civic.*brake.*pad/i);
    });
    
    test('Real-time message delivery', async () => {
        const messagePromise = waitForSubscriptionMessage();
        await sendMessage("Test real-time delivery");
        
        const receivedMessage = await messagePromise;
        expect(receivedMessage).toBeDefined();
        expect(receivedMessage.sender).toBe('ASSISTANT');
    });
    
    test('Tool usage detection', async () => {
        const response = await sendMessage("How much do brake pads cost for Honda Civic?");
        
        // Should trigger automotive search tool
        expect(response.content).toMatch(/\$\d+|\$\d+\.\d+/); // Price pattern
        expect(response.toolsUsed).toContain('search_automotive_info');
    });
});
```

### **Step 4: Performance and Load Testing**

```typescript
// Chat performance testing
describe('Chat Performance', () => {
    
    test('Response time under load', async () => {
        const startTime = Date.now();
        
        // Simulate concurrent conversations
        const promises = Array.from({ length: 10 }, (_, i) => 
            sendMessage(`Test message ${i}`, `conversation-${i}`)
        );
        
        const responses = await Promise.all(promises);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
        responses.forEach(response => {
            expect(response).toBeDefined();
            expect(response.message).toBeTruthy();
        });
    });
    
    test('Memory system performance', async () => {
        // Test context retrieval performance
        const conversationId = 'test-memory-conversation';
        
        // Create conversation history
        for (let i = 0; i < 20; i++) {
            await sendMessage(`Message ${i}`, conversationId);
        }
        
        const startTime = Date.now();
        const context = await getConversationContext(conversationId);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(200); // 200ms max
        expect(context.messages).toHaveLength(10); // Last 10 messages
    });
});
```

## Validation Criteria

### **Conversational Quality:**
- ✅ Natural conversation flow with automotive context
- ✅ Appropriate tool usage based on user queries  
- ✅ Context maintained across conversation turns
- ✅ Helpful and relevant automotive responses

### **Real-time Performance:**
- ✅ Message delivery < 500ms via subscriptions
- ✅ Chat response time < 5 seconds with tools
- ✅ Context retrieval < 200ms
- ✅ UI updates smoothly without lag

### **Memory System:**
- ✅ Conversation history preserved correctly
- ✅ User vehicle information remembered
- ✅ Context used appropriately in responses
- ✅ Memory efficient (< 10KB per conversation)

This implementation creates a **production-ready conversational automotive chatbot** using Strands Agents with real-time capabilities and comprehensive conversation memory.

---

# PROMPT 8: Production Deployment and Monitoring

## Objective
Deploy the Strands conversational chatbot to production with comprehensive monitoring, alerting, and performance optimization.

## Implementation Steps

### **Step 1: Production Lambda Configuration**

```python
# Production-optimized Strands Lambda
import logging
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

logger = Logger()
tracer = Tracer()
metrics = Metrics()

@tracer.capture_lambda_handler
@logger.inject_lambda_context
@metrics.log_metrics
def lambda_handler(event, context):
    """Production Lambda handler with observability"""
    
    try:
        # Track conversation metrics
        metrics.add_metric(name="ConversationStarted", unit=MetricUnit.Count, value=1)
        
        message = event['arguments']['message']
        conversation_id = event['arguments']['conversationId']
        
        # Process with Strands agent
        start_time = time.time()
        response = chatbot(message)
        processing_time = time.time() - start_time
        
        # Track performance metrics
        metrics.add_metric(name="ResponseTime", unit=MetricUnit.Seconds, value=processing_time)
        metrics.add_metric(name="MessageProcessed", unit=MetricUnit.Count, value=1)
        
        logger.info("Message processed successfully", extra={
            "conversation_id": conversation_id,
            "processing_time": processing_time,
            "message_length": len(message)
        })
        
        return {
            'conversationId': conversation_id,
            'message': response.message,
            'processingTime': processing_time,
            'poweredBy': 'Strands AI'
        }
        
    except Exception as e:
        metrics.add_metric(name="ProcessingError", unit=MetricUnit.Count, value=1)
        logger.error("Message processing failed", extra={
            "error": str(e),
            "conversation_id": conversation_id
        })
        raise
```

### **Step 2: CloudWatch Monitoring and Alerting**

```typescript
// CDK monitoring configuration
const chatbotAlarms = new cloudwatch.Alarm(this, 'ChatbotResponseTimeAlarm', {
    metric: strandsLambda.metricDuration(),
    threshold: 10000, // 10 seconds
    evaluationPeriods: 2,
    alarmDescription: 'Chatbot response time too high'
});

const errorRateAlarm = new cloudwatch.Alarm(this, 'ChatbotErrorRateAlarm', {
    metric: strandsLambda.metricErrors(),
    threshold: 5, // 5% error rate
    evaluationPeriods: 3,
    alarmDescription: 'Chatbot error rate too high'
});

// SNS notifications for alerts
const alertTopic = new sns.Topic(this, 'ChatbotAlerts');
chatbotAlarms.addAlarmAction(new snsActions.SnsAction(alertTopic));
errorRateAlarm.addAlarmAction(new snsActions.SnsAction(alertTopic));
```

### **Step 3: Performance Optimization**

```python
# Optimized conversation context loading
class OptimizedMemorySystem:
    def __init__(self):
        self.context_cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    @lru_cache(maxsize=100)
    def get_conversation_context(self, conversation_id: str) -> str:
        """Cached context retrieval for performance"""
        
        # Check cache first
        cache_key = f"context:{conversation_id}"
        if cache_key in self.context_cache:
            cached_data, timestamp = self.context_cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return cached_data
        
        # Load from DynamoDB
        context = self._load_context_from_db(conversation_id)
        
        # Cache for future requests
        self.context_cache[cache_key] = (context, time.time())
        
        return context
    
    def _load_context_from_db(self, conversation_id: str) -> str:
        """Optimized database query"""
        response = messages_table.query(
            KeyConditionExpression='conversationId = :cid',
            ExpressionAttributeValues={':cid': conversation_id},
            ScanIndexForward=False,
            Limit=10,
            ProjectionExpression='sender, content, timestamp'  # Only needed fields
        )
        
        return self._format_context(response.get('Items', []))
```

## Success Criteria

✅ **Production Deployment**: Strands chatbot deployed with monitoring  
✅ **Performance Optimization**: Response times < 5 seconds consistently  
✅ **Monitoring Coverage**: Comprehensive metrics and alerting  
✅ **Error Handling**: Graceful degradation and recovery  
✅ **Scalability**: Handles concurrent conversations effectively  

The Dixon Smart Repair conversational chatbot is now **production-ready** with Strands Agents providing intelligent, context-aware automotive assistance through natural conversation.

---

# PROMPT 7: Web Search Integration Configuration Tests and Setup

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 and ART-042 specifications when requirements are clear

## Objective
Configure web search integration using Tavily web search API for real-time automotive information enhancement, supporting parts pricing, labor rates, and diagnostic information through web search results.

## Test Cases to Implement First (RED Phase)
Reference ART-044 under "Web Search Integration Tests":
1. Test web search client connects to Tavily using configuration from ART-042
2. Test automotive searches return WebSearchResult interface
3. Test web search result parsing for automotive information
4. Test caching reduces API calls per TTL settings
5. Test rate limiting prevents quota exceeded (60/min, 1000/day)
6. Test graceful degradation to LLM knowledge when web search fails
7. Test automotive relevance filtering of search results

## Implementation Guidance (GREEN Phase)
Configure web search integration using ART-041 and ART-042 specifications:

**Step 1: Configure Web Search Client**
- Use WebSearchConfiguration from ART-042
- Set Tavily as web search provider with API key from environment
- Configure 10-second timeout and rate limiting
- Set up automotive relevance filtering

**Step 2: Implement Redis Caching Layer**
- Configure aioredis==2.0.1 per ART-042
- Set TTL per ART-042 specifications:
  - Parts searches: 14400s (4 hours)
  - Labor searches: 86400s (24 hours)
  - Repair procedures: 604800s (7 days)
- Add cache key management and invalidation

**Step 3: Add Automotive Search Methods**
- Implement searchAutomotiveParts with VehicleInfo context
- Add searchLaborRates with location and repair type
- Create searchRepairProcedures with vehicle-specific data
- Add searchVINInformation for enhanced validation

**Step 4: Configure Error Handling and Fallbacks**
- Use WebSearchError interface from ART-041
- Implement LLM knowledge fallback when web search fails
- Add transparent user communication about data sources
- Configure graceful degradation patterns

**Step 5: Add Rate Limit Management**
- Implement intelligent request throttling
- Add request queuing for rate limit compliance
- Configure exponential backoff for rate limit errors
- Add monitoring for API quota usage

**Step 6: Implement Automotive Data Parsing**
- Create AutomotiveDataParser service from ART-041
- Parse web search results for automotive information
- Filter results for automotive relevance and quality
- Validate parsed data accuracy and completeness

## Validation Steps
- Test web search connection establishes with proper credentials
- Verify automotive searches return relevant, cached results
- Confirm rate limiting prevents API quota exceeded
- Test automotive data parsing extracts useful information
- Validate graceful degradation maintains user experience
- Test relevance filtering improves result quality

---

# PROMPT 8: VIN and Vehicle Information System Tests and Implementation

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 and ART-042 specifications when requirements are clear

## Objective
Implement VIN validation and vehicle information collection using VINScanner and VehicleInfoCollector interfaces from ART-041, with expo-camera integration and confidence levels per ART-042.

## Test Cases to Implement First (RED Phase)
Reference ART-044 under "VIN and Vehicle Information Tests":
1. Test VINScanner uses VINScannerProps interface from ART-041
2. Test VIN validation follows VINValidationResult interface
3. Test confidence levels: Generic (65%), Basic (80%), VIN (95%)
4. Test camera launches within 1000ms per ART-042
5. Test VIN OCR processing completes within 3000ms
6. Test manual VIN entry with real-time validation
7. Test vehicle information storage with user association

## Implementation Guidance (GREEN Phase)
Implement VIN system using ART-041 and ART-042:

**Step 1: Build VINScanner Component**
- Use VINScannerProps interface from ART-041
- Integrate expo-camera per ART-042 configuration
- Meet 1000ms camera launch requirement
- Add VIN location guidance (dashboard, door, engine bay)

**Step 2: Implement VIN Validation Service**
- Use ValidationService class from ART-041
- Add 17-character format validation (no I/O/Q characters)
- Implement check digit validation algorithm
- Return VINValidationResult with detailed error information

**Step 3: Add VIN Decoding with MCP Enhancement**
- Integrate with MCPService for enhanced VIN decoding
- Use VehicleInfo interface from ART-041
- Extract make, model, year, engine from VIN
- Add confidence scoring for decoded information

**Step 4: Build VehicleInfoCollector Component**
- Use VehicleInfoCollectorProps interface from ART-041
- Implement progressive collection (Year → Make → Model)
- Calculate confidence levels per ART-042:
  - Generic: 65% (no specific vehicle info)
  - Basic: 80% (year, make, model provided)
  - VIN: 95% (complete VIN decoding)
- Add auto-completion for make/model selection

**Step 5: Add Camera Integration and OCR**
- Use expo-camera and expo-image-picker from ART-042
- Implement OCR processing within 3000ms requirement
- Add photo categorization using PhotoAttachment interface
- Support manual VIN entry as fallback option

## Validation Steps
- Test VIN validation correctly identifies valid/invalid formats
- Verify camera launches within 1000ms performance requirement
- Confirm OCR processing completes within 3000ms
- Test confidence levels accurately reflect information quality
- Validate vehicle information persists correctly for users

---

# PROMPT 9: Complete Diagnostic Workflow Tests and Implementation

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 and ART-042 specifications when requirements are clear

## Objective
Implement end-to-end diagnostic workflow meeting 15-second total performance requirement from ART-042, using ConversationState management from ART-041 and integrating all 5 Strands tools.

## Test Cases to Implement First (RED Phase)
Reference ART-044 under "Complete Diagnostic Workflow Tests":
1. Test complete workflow meets 15-second total requirement
2. Test ConversationState maintains context throughout process
3. Test DiagnosticResult includes all components from ART-041
# PROMPT 11: Production Deployment and Monitoring

## Context Essentials
- **Project**: Dixon Smart Repair - Conversational automotive diagnostic chatbot
- **Previous**: Mechanic mobile workflow with override system operational (PROMPT 10)
- **Goal**: Deploy to production with comprehensive monitoring (EPIC 7 - Production Readiness)
- **Build On**: Complete diagnostic system, mechanic workflow, real-time chat

## Quick Validation
**Check**: Mechanic can review diagnostic and submit override with audit trail
**Expected**: Complete mechanic workflow operational with customer notifications
**If Fails**: Complete PROMPT 10 mechanic mobile workflow implementation

## Context Sources
- **current-state.md**: Mechanic Workflow section - Override system status
- **epics.md EPIC-007**: Production Readiness & Operational Excellence
- **product-roadmap.md Phase 2**: Production deployment requirements

## Implementation

### Step 1: Production Infrastructure Setup
Deploy production-ready infrastructure:
```bash
# Deploy production CDK stack
cd /Users/saidachanda/development/dixon-smart-repair
export AWS_PROFILE=dixonsmartrepair-dev

# Production deployment
cdk deploy --profile dixonsmartrepair-dev --context environment=production

# Verify production endpoints
curl -X POST <production-appsync-endpoint> -H "Authorization: Bearer <token>"
```

### Step 2: Implement Comprehensive Monitoring
Add CloudWatch monitoring and alerting:
```python
# Add to Lambda for production monitoring
import boto3
import json
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

def log_performance_metrics(conversation_id: str, processing_time: float, tool_used: bool):
    """Log performance metrics to CloudWatch"""
    
    # Response time metric
    cloudwatch.put_metric_data(
        Namespace='DixonSmartRepair/Chat',
        MetricData=[
            {
                'MetricName': 'ResponseTime',
                'Value': processing_time,
                'Unit': 'Milliseconds',
                'Dimensions': [
                    {'Name': 'ToolUsed', 'Value': str(tool_used)}
                ]
            }
        ]
    )
    
    # Conversation volume metric
    cloudwatch.put_metric_data(
        Namespace='DixonSmartRepair/Usage',
        MetricData=[
            {
                'MetricName': 'ConversationCount',
                'Value': 1,
                'Unit': 'Count'
            }
        ]
    )

def create_cloudwatch_alarms():
    """Create production monitoring alarms"""
    
    # High response time alarm
    cloudwatch.put_metric_alarm(
        AlarmName='DixonSmartRepair-HighResponseTime',
        ComparisonOperator='GreaterThanThreshold',
        EvaluationPeriods=2,
        MetricName='ResponseTime',
        Namespace='DixonSmartRepair/Chat',
        Period=300,
        Statistic='Average',
        Threshold=5000.0,  # 5 seconds
        ActionsEnabled=True,
        AlarmActions=['arn:aws:sns:us-west-2:123456789012:dixon-alerts'],
        AlarmDescription='Alert when response time exceeds 5 seconds'
    )
```

### Step 3: Add Production Audit Logging
Implement comprehensive audit trails:
```python
# Enhanced audit logging for production
def log_diagnostic_session(session_data):
    """Log complete diagnostic session for audit"""
    
    audit_record = {
        'timestamp': datetime.utcnow().isoformat(),
        'session_id': session_data['conversation_id'],
        'customer_id': session_data['customer_id'],
        'vehicle_context': session_data['vehicle_context'],
        'symptoms': session_data['symptoms'],
        'ai_diagnosis': session_data['ai_diagnosis'],
        'confidence_level': session_data['confidence_level'],
        'mechanic_review': session_data.get('mechanic_review'),
        'final_recommendation': session_data['final_recommendation'],
        'tools_used': session_data['tools_used']
    }
    
    # Store in DynamoDB audit table
    audit_table.put_item(Item=audit_record)
    
    # Also log to CloudWatch for monitoring
    print(f"AUDIT: {json.dumps(audit_record)}")
```

## Completion Checklist
- [ ] Production infrastructure deployed and operational
- [ ] CloudWatch monitoring with custom metrics and alarms
- [ ] Comprehensive audit logging for all diagnostic sessions
- [ ] Performance benchmarks met in production environment
- [ ] Update current-state.md with "Production Deployment - Complete"

## Validation
**Test**: Complete diagnostic session in production with monitoring
**Expected**: All metrics logged, alarms configured, audit trail complete

## Next Prompt Ready
- **Enables**: Advanced features like dongle integration and gamification
- **Provides**: Production-ready automotive diagnostic system
- **Ready For**: PROMPT 12 - Dongle Integration (EPIC 3)

---

# PROMPT 12: Dongle Integration and QR Code Pairing

## Context Essentials
- **Project**: Dixon Smart Repair - Conversational automotive diagnostic chatbot
- **Previous**: Production deployment with monitoring operational (PROMPT 11)
- **Goal**: Implement physical-digital bridge with OBD2 dongles (EPIC 3)
- **Build On**: Production system, mobile app, diagnostic workflow

## Quick Validation
**Check**: Production system operational with monitoring and audit logging
**Expected**: Complete diagnostic system deployed with performance tracking
**If Fails**: Complete PROMPT 11 production deployment and monitoring

## Context Sources
- **current-state.md**: Production Deployment section - System operational status
- **epics.md EPIC-003**: Physical-Digital Bridge (Dongle Integration)
- **acceptance-criteria.md US-017**: Shop Visit Recognition requirements

## Implementation

### Step 1: Add Bluetooth OBD2 Integration
Implement dongle pairing and data collection:
```typescript
// BluetoothOBD2.tsx - Dongle integration
import { BluetoothSerial } from 'react-native-bluetooth-serial-next';

const OBD2Manager = () => {
    const [connectedDongle, setConnectedDongle] = useState(null);
    const [vehicleData, setVehicleData] = useState({});
    
    const scanForDongles = async () => {
        try {
            const devices = await BluetoothSerial.discoverUnpairedDevices();
            const obd2Devices = devices.filter(device => 
                device.name.toLowerCase().includes('obd') ||
                device.name.toLowerCase().includes('elm327')
            );
            return obd2Devices;
        } catch (error) {
            console.error('Bluetooth scan error:', error);
            return [];
        }
    };
    
    const connectToDongle = async (device) => {
        try {
            await BluetoothSerial.connect(device.id);
            setConnectedDongle(device);
            
            // Start reading OBD2 data
            startDataCollection();
        } catch (error) {
            console.error('Connection error:', error);
        }
    };
    
    const startDataCollection = () => {
        // Read common OBD2 PIDs
        const pids = [
            '010C', // Engine RPM
            '010D', // Vehicle Speed
            '0105', // Engine Coolant Temperature
            '010F', // Intake Air Temperature
        ];
        
        pids.forEach(pid => {
            BluetoothSerial.write(`${pid}\r`);
        });
    };
    
    return (
        <View style={styles.obd2Container}>
            <Text style={styles.title}>Connect OBD2 Dongle</Text>
            {connectedDongle ? (
                <ConnectedDongleView 
                    dongle={connectedDongle}
                    vehicleData={vehicleData}
                />
            ) : (
                <DongleScanView onConnect={connectToDongle} />
            )}
        </View>
    );
};
```

### Step 2: Implement QR Code Shop Pairing
Add QR code scanning for shop visits:
```typescript
// QRCodeScanner.tsx - Shop visit recognition
import { BarCodeScanner } from 'expo-barcode-scanner';

const ShopQRScanner = ({ onShopDetected }) => {
    const [hasPermission, setHasPermission] = useState(null);
    
    const handleBarCodeScanned = ({ data }) => {
        try {
            const shopData = JSON.parse(data);
            if (shopData.type === 'dixon_smart_repair_shop') {
                onShopDetected({
                    shopId: shopData.shop_id,
                    shopName: shopData.shop_name,
                    location: shopData.location,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            Alert.alert('Invalid QR Code', 'This is not a Dixon Smart Repair shop code');
        }
    };
    
    return (
        <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={styles.scanner}
        >
            <View style={styles.overlay}>
                <Text style={styles.instructions}>
                    Scan the QR code at your repair shop
                </Text>
            </View>
        </BarCodeScanner>
    );
};
```

### Step 3: Enhance Diagnostics with Live Data
Integrate OBD2 data with diagnostic workflow:
```python
# Add to strands-chatbot.py
@tool
def analyze_obd2_data(symptoms: str, obd2_data: dict, vehicle_context: str = "generic") -> str:
    """Analyze symptoms with live OBD2 data for enhanced diagnostics"""
    
    analysis = {
        'symptoms': symptoms,
        'live_data': obd2_data,
        'vehicle_context': vehicle_context,
        'enhanced_confidence': True
    }
    
    # Analyze live data for diagnostic clues
    diagnostic_insights = []
    
    if 'engine_rpm' in obd2_data:
        rpm = obd2_data['engine_rpm']
        if rpm > 3000 and 'noise' in symptoms.lower():
            diagnostic_insights.append("High RPM detected - may indicate engine strain")
    
    if 'coolant_temp' in obd2_data:
        temp = obd2_data['coolant_temp']
        if temp > 220 and 'overheating' in symptoms.lower():
            diagnostic_insights.append("Coolant temperature elevated - confirms overheating issue")
    
    # Combine with regular automotive search
    search_results = search_automotive_info(symptoms, vehicle_context)
    
    enhanced_analysis = f"""
    Live Vehicle Data Analysis:
    {chr(10).join(diagnostic_insights)}
    
    Combined with automotive knowledge:
    {search_results}
    
    Confidence Level: Enhanced (Live data available)
    """
    
    return enhanced_analysis
```

## Completion Checklist
- [ ] Bluetooth OBD2 dongle pairing and data collection working
- [ ] QR code shop visit recognition implemented
- [ ] Live OBD2 data integrated with diagnostic workflow
- [ ] Enhanced diagnostic confidence with physical data
- [ ] Update current-state.md with "Dongle Integration - Complete"

## Validation
**Test**: Pair OBD2 dongle → collect live data → enhanced diagnostic accuracy
**Expected**: Physical vehicle data improves diagnostic confidence and accuracy

## Next Prompt Ready
- **Enables**: Gamification and customer engagement features
- **Provides**: Physical-digital bridge with live vehicle data
- **Ready For**: PROMPT 13 - Gamification and Engagement (EPIC 6)

---

# PROMPT 13: Gamification and Customer Engagement

## Context Essentials
- **Project**: Dixon Smart Repair - Conversational automotive diagnostic chatbot
- **Previous**: Dongle integration with live OBD2 data operational (PROMPT 12)
- **Goal**: Implement gamification and customer engagement features (EPIC 6)
- **Build On**: Complete diagnostic system, dongle integration, shop QR codes

## Quick Validation
**Check**: OBD2 dongle pairing and live data collection working
**Expected**: Enhanced diagnostics with physical vehicle data integration
**If Fails**: Complete PROMPT 12 dongle integration implementation

## Context Sources
- **current-state.md**: Dongle Integration section - Physical-digital bridge status
- **epics.md EPIC-006**: Gamified Experience & Customer Engagement
- **acceptance-criteria.md US-018**: Achievement and Progress Tracking

## Implementation

### Step 1: Implement Achievement System
Create gamified user engagement:
```typescript
// AchievementSystem.tsx - Gamification features
const AchievementSystem = () => {
    const [userAchievements, setUserAchievements] = useState([]);
    const [availableBadges, setAvailableBadges] = useState([]);
    
    const achievements = [
        {
            id: 'first_diagnostic',
            title: 'First Diagnosis',
            description: 'Complete your first vehicle diagnostic',
            icon: '🔧',
            points: 100
        },
        {
            id: 'vin_scanner',
            title: 'VIN Master',
            description: 'Successfully scan a VIN for precise diagnostics',
            icon: '📱',
            points: 200
        },
        {
            id: 'dongle_connector',
            title: 'Tech Savvy',
            description: 'Connect an OBD2 dongle for live data',
            icon: '🔌',
            points: 300
        },
        {
            id: 'shop_visitor',
            title: 'Shop Explorer',
            description: 'Visit a Dixon Smart Repair partner shop',
            icon: '🏪',
            points: 150
        }
    ];
    
    const checkAchievements = (userAction) => {
        const newAchievements = [];
        
        switch (userAction.type) {
            case 'DIAGNOSTIC_COMPLETE':
                if (!userAchievements.includes('first_diagnostic')) {
                    newAchievements.push('first_diagnostic');
                }
                break;
            case 'VIN_SCANNED':
                if (!userAchievements.includes('vin_scanner')) {
                    newAchievements.push('vin_scanner');
                }
                break;
            case 'DONGLE_CONNECTED':
                if (!userAchievements.includes('dongle_connector')) {
                    newAchievements.push('dongle_connector');
                }
                break;
            case 'SHOP_VISITED':
                if (!userAchievements.includes('shop_visitor')) {
                    newAchievements.push('shop_visitor');
                }
                break;
        }
        
        if (newAchievements.length > 0) {
            showAchievementNotification(newAchievements);
            setUserAchievements(prev => [...prev, ...newAchievements]);
        }
    };
    
    return (
        <View style={styles.achievementContainer}>
            <Text style={styles.title}>Your Achievements</Text>
            <ScrollView horizontal>
                {achievements.map(achievement => (
                    <AchievementBadge
                        key={achievement.id}
                        achievement={achievement}
                        earned={userAchievements.includes(achievement.id)}
                    />
                ))}
            </ScrollView>
        </View>
    );
};
```

### Step 2: Add Progress Tracking and Personalization
Implement user progress and customization:
```typescript
// UserProgress.tsx - Progress tracking and personalization
const UserProgress = () => {
    const [userStats, setUserStats] = useState({
        diagnosticsCompleted: 0,
        vinsScanned: 0,
        shopsVisited: 0,
        totalPoints: 0,
        level: 1
    });
    
    const [personalizedTheme, setPersonalizedTheme] = useState('default');
    
    const themes = [
        { id: 'default', name: 'Classic', unlockLevel: 1 },
        { id: 'dark', name: 'Dark Mode', unlockLevel: 2 },
        { id: 'automotive', name: 'Automotive', unlockLevel: 3 },
        { id: 'premium', name: 'Premium', unlockLevel: 5 }
    ];
    
    const calculateLevel = (points) => {
        return Math.floor(points / 500) + 1;
    };
    
    const getUnlockedThemes = () => {
        return themes.filter(theme => theme.unlockLevel <= userStats.level);
    };
    
    return (
        <View style={styles.progressContainer}>
            <View style={styles.levelCard}>
                <Text style={styles.levelText}>Level {userStats.level}</Text>
                <Text style={styles.pointsText}>{userStats.totalPoints} points</Text>
                <ProgressBar 
                    progress={(userStats.totalPoints % 500) / 500}
                    color="#4CAF50"
                />
            </View>
            
            <View style={styles.statsGrid}>
                <StatCard 
                    title="Diagnostics"
                    value={userStats.diagnosticsCompleted}
                    icon="🔧"
                />
                <StatCard 
                    title="VINs Scanned"
                    value={userStats.vinsScanned}
                    icon="📱"
                />
                <StatCard 
                    title="Shops Visited"
                    value={userStats.shopsVisited}
                    icon="🏪"
                />
            </View>
            
            <View style={styles.themesSection}>
                <Text style={styles.sectionTitle}>Personalization</Text>
                <ScrollView horizontal>
                    {getUnlockedThemes().map(theme => (
                        <ThemeCard
                            key={theme.id}
                            theme={theme}
                            selected={personalizedTheme === theme.id}
                            onSelect={() => setPersonalizedTheme(theme.id)}
                        />
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};
```

### Step 3: Add Social Features and Referrals
Implement social engagement:
```typescript
// SocialFeatures.tsx - Social sharing and referrals
const SocialFeatures = () => {
    const [referralCode, setReferralCode] = useState('');
    const [referralStats, setReferralStats] = useState({ count: 0, rewards: 0 });
    
    const shareAchievement = async (achievement) => {
        const shareContent = {
            title: `I just earned the "${achievement.title}" badge!`,
            message: `Check out Dixon Smart Repair - the AI automotive assistant that helped me diagnose my car issue!`,
            url: 'https://dixonsmartrepair.com'
        };
        
        try {
            await Share.share(shareContent);
            
            // Award points for sharing
            awardPoints(50, 'ACHIEVEMENT_SHARED');
        } catch (error) {
            console.error('Share error:', error);
        }
    };
    
    const generateReferralCode = () => {
        const code = `DSR${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        setReferralCode(code);
        return code;
    };
    
    const shareReferralCode = async () => {
        const shareContent = {
            title: 'Try Dixon Smart Repair!',
            message: `Use my referral code ${referralCode} to get started with AI automotive diagnostics!`,
            url: `https://dixonsmartrepair.com/ref/${referralCode}`
        };
        
        await Share.share(shareContent);
    };
    
    return (
        <View style={styles.socialContainer}>
            <View style={styles.referralSection}>
                <Text style={styles.sectionTitle}>Refer Friends</Text>
                <Text style={styles.referralCode}>{referralCode}</Text>
                <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={shareReferralCode}
                >
                    <Text style={styles.shareText}>Share Referral Code</Text>
                </TouchableOpacity>
                <Text style={styles.referralStats}>
                    {referralStats.count} friends referred • {referralStats.rewards} points earned
                </Text>
            </View>
        </View>
    );
};
```

## Completion Checklist
- [ ] Achievement system with badges and points operational
- [ ] Progress tracking with levels and personalization unlocks
- [ ] Social sharing for achievements and referrals
- [ ] Gamified user engagement increasing retention
- [ ] Update current-state.md with "Gamification - Complete"

## Validation
**Test**: Complete diagnostic → earn achievement → unlock personalization → share
**Expected**: Engaging gamified experience encouraging continued platform use

## Next Prompt Ready
- **Enables**: Final production readiness and operational excellence
- **Provides**: Complete customer engagement and retention system
- **Ready For**: PROMPT 14 - Advanced Production Readiness (EPIC 7)
- Store mechanic specializations and certifications
- Implement location-based recommendations
- Add communication and appointment scheduling

**Step 6: Build Mobile Diagnostic Review Interface (US-011)**
- Create mechanic-specific mobile interface for diagnostic review
- Display AI diagnostic results with confidence scores
- Show customer symptom description and vehicle information
- Add diagnostic validation and approval workflow
- Implement real-time diagnostic result updates

**Step 7: Implement Diagnosis Override and Notes (US-012)**
- Add mechanic override functionality for AI diagnoses
- Implement notes system for mechanic observations
- Create diagnostic modification workflow
- Add override reason tracking and documentation
- Implement mechanic signature and timestamp for overrides

**Step 8: Create Repair Order Status Management (US-015)**
- Implement repair order lifecycle management
- Add status tracking (Pending, In Progress, Completed, On Hold)
- Create status update notifications for customers
- Add estimated completion time tracking
- Implement repair progress photo documentation

**Step 9: Build Work Authorization Tracking (US-016)**
- Create work authorization request system
- Implement customer approval workflow for repairs
- Add authorization status tracking and notifications
- Create digital signature capture for work authorization
- Implement authorization history and audit trail

## Validation Steps
- Test service history accurately tracks automotive services
- Verify maintenance reminders trigger at appropriate intervals
- Confirm invoices include diagnostic information
- Test mechanic management provides meaningful recommendations
- Validate service analytics provide actionable insights
- **Test mechanic diagnostic review interface works on mobile devices**
- **Verify diagnosis override functionality maintains audit trail**
- **Confirm repair order status updates notify customers in real-time**
- **Test work authorization workflow captures proper approvals**

---

# PROMPT 11: Production Deployment and Monitoring Setup

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 and ART-042 specifications when requirements are clear

## Objective
Configure production deployment using main branch → production environment from ART-042, with automotive-specific monitoring and AWS X-Ray tracing.

## Test Cases to Implement First (RED Phase)
Reference ART-044 under "Production Deployment Tests":
1. Test main branch → production environment deployment
2. Test production environment variables from ART-042
3. Test monitoring captures automotive-specific metrics
4. Test error tracking provides actionable debugging
5. Test performance monitoring validates 15-second workflow
6. Test security scanning detects vulnerabilities
7. Test backup and disaster recovery procedures

## Implementation Guidance (GREEN Phase)
Configure production using ART-042 specifications:

**Step 1: Configure Production Deployment**
- Set main branch → production environment deployment
- Use production environment variables from ART-042:
  - AWS_AMPLIFY_PROJECT_ID=dixonsmartrepair-prod
  - VIN_VALIDATION_STRICT=true
  - ANALYTICS_ENABLED=true
- Configure production Strands agent and MCP settings

**Step 2: Set Up Monitoring and Observability**
- Configure AWS X-Ray for diagnostic workflow tracing
- Add CloudWatch monitoring for automotive metrics
- Implement error tracking for Strands and MCP failures
- Add performance monitoring for 15-second workflow requirement

**Step 3: Configure Automotive-Specific Monitoring**
- Track diagnostic accuracy and confidence scores
- Monitor VIN scan success rates and OCR performance
- Add conversation completion rates and user satisfaction
- Implement real-time alerting for critical failures

**Step 4: Add Security and Compliance**
- Configure security scanning per ART-042
- Implement 2-year data retention policy
- Add privacy compliance for user vehicle data
- Configure backup strategies for conversation history

**Step 5: Set Up Performance Monitoring**
- Monitor app launch time (< 3 seconds requirement)
- Track diagnostic workflow performance (< 15 seconds)
- Add API response time monitoring
- Configure alerting for performance degradation

## Validation Steps
- Test production deployment completes successfully
- Verify monitoring captures all automotive metrics
- Confirm error tracking provides actionable information
- Test performance monitoring meets all requirements
- Validate security scanning detects issues correctly

---

# PROMPT 12: Dongle Integration and QR Code Pairing Implementation

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 and ART-042 specifications when requirements are clear

## Objective
Implement Physical-Digital Bridge functionality covering US-007 (Dongle QR Code Pairing) and US-008 (Personalized App Experience) with Bluetooth OBD2 integration and enhanced diagnostic capabilities.

## Test Cases to Implement First (RED Phase)
Reference ART-044 and create new test cases for EPIC 3 requirements:
1. Test QR code scanning launches camera and detects dongle QR codes
2. Test Bluetooth pairing workflow connects to OBD2 dongles
3. Test dongle detection and capability identification
4. Test live OBD2 data retrieval and processing
5. Test enhanced diagnostic confidence with dongle data
6. Test dongle battery monitoring and status alerts
7. Test personalized app experience based on dongle capabilities
8. Test graceful degradation when dongle unavailable
9. Test dongle data integration with Strands agent tools

## Implementation Guidance (GREEN Phase)
Implement dongle integration using React Native Bluetooth and camera capabilities:

**Step 1: Implement QR Code Scanning for Dongle Pairing**
- Use expo-camera for QR code detection
- Create QR code scanning interface with automotive branding
- Add QR code validation for dongle identification
- Implement dongle information extraction from QR codes
- Add visual feedback for successful QR code detection

**Step 2: Build Bluetooth OBD2 Pairing System**
- Integrate React Native Bluetooth libraries
- Implement Bluetooth device discovery and pairing
- Add OBD2 protocol communication layer
- Create dongle capability detection and validation
- Implement secure pairing with authentication

**Step 3: Create Live OBD2 Data Integration**
- Implement real-time OBD2 data retrieval
- Add diagnostic trouble code (DTC) reading
- Create live sensor data monitoring (RPM, temperature, etc.)
- Implement data validation and error handling
- Add OBD2 data caching and offline storage

**Step 4: Enhance Diagnostic Confidence with Dongle Data**
- Integrate OBD2 data with symptom analysis
- Add dongle data to Strands agent tool inputs
- Implement enhanced confidence scoring with live data
- Create diagnostic correlation between symptoms and OBD2 codes
- Add dongle-enhanced diagnostic reporting

**Step 5: Implement Dongle Status Monitoring**
- Add dongle battery level monitoring
- Create connection status tracking and alerts
- Implement dongle health diagnostics
- Add automatic reconnection for dropped connections
- Create dongle maintenance reminders

**Step 6: Build Personalized App Experience**
- Customize app interface based on dongle capabilities
- Add dongle-specific diagnostic features
- Implement enhanced user profiles with dongle history
- Create personalized diagnostic recommendations
- Add dongle usage analytics and insights

## Validation Steps
- Test QR code scanning accurately identifies dongle information
- Verify Bluetooth pairing works with various OBD2 dongles
- Confirm live OBD2 data enhances diagnostic accuracy
- Test dongle status monitoring provides timely alerts
- Validate personalized experience improves user engagement
- Test graceful degradation maintains functionality without dongle

---

# PROMPT 13: Gamification and Customer Engagement Implementation

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 and ART-042 specifications when requirements are clear

## Objective
Implement gamified experience and customer engagement features covering US-017 (Shop Visit Recognition) and US-018 (Achievement and Progress Tracking) to enhance customer loyalty and retention.

## Test Cases to Implement First (RED Phase)
Reference ART-044 and create new test cases for EPIC 6 requirements:
1. Test shop visit recognition via location services and QR codes
2. Test achievement system tracks user diagnostic activities
3. Test progress tracking displays user engagement metrics
4. Test reward system provides meaningful incentives
5. Test social sharing capabilities for achievements
6. Test gamification elements enhance user experience
7. Test achievement notifications and celebrations
8. Test progress persistence across app sessions
9. Test leaderboard and community features

## Implementation Guidance (GREEN Phase)
Implement gamification system with achievement tracking and rewards:

**Step 1: Implement Shop Visit Recognition**
- Use expo-location for geofencing around partner shops
- Add QR code scanning for shop check-ins
- Create shop visit validation and verification
- Implement visit history tracking and analytics
- Add shop-specific rewards and promotions

**Step 2: Build Achievement System**
- Create comprehensive achievement categories:
  - Diagnostic milestones (first diagnosis, 10th diagnosis, etc.)
  - Vehicle maintenance achievements (regular service, preventive care)
  - Learning achievements (VIN scanning, dongle pairing)
  - Community achievements (reviews, referrals)
- Implement achievement progress tracking
- Add achievement unlock notifications and celebrations

**Step 3: Create Progress Tracking System**
- Implement user engagement metrics tracking
- Add diagnostic accuracy improvement tracking
- Create maintenance compliance scoring
- Implement cost savings tracking from preventive care
- Add personal automotive knowledge growth metrics

**Step 4: Build Reward and Incentive System**
- Create point-based reward system
- Implement tier-based user levels (Bronze, Silver, Gold, Platinum)
- Add reward redemption for service discounts
- Create partner shop reward integration
- Implement referral bonus system

**Step 5: Add Social and Community Features**
- Implement achievement sharing to social media
- Create community leaderboards for engagement
- Add user review and rating system for shops
- Implement friend referral and comparison features
- Create automotive knowledge sharing community

**Step 6: Implement Gamification UI Elements**
- Add progress bars and visual achievement displays
- Create celebration animations for milestones
- Implement badge and trophy collection interface
- Add gamified onboarding and tutorial system
- Create engaging notification system for achievements

## Validation Steps
- Test shop visit recognition accurately detects location and QR codes
- Verify achievement system properly tracks and rewards user activities
- Confirm progress tracking provides meaningful insights
- Test reward system motivates continued engagement
- Validate social features enhance community building
- Test gamification elements improve user retention

---

# PROMPT 14: Advanced Production Readiness and Operational Excellence

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Use Available Resources** from ART-041 and ART-042 specifications when requirements are clear

## Objective
Implement comprehensive production readiness features covering EPIC 7 requirements including audit trails, rate limiting, cost optimization, and business intelligence for operational excellence.

## Test Cases to Implement First (RED Phase)
Reference ART-044 and create new test cases for EPIC 7 requirements:
1. Test comprehensive audit logging captures all repair recommendations
2. Test rate limiting prevents API abuse and manages costs
3. Test intelligent caching optimizes performance and reduces costs
4. Test business intelligence provides actionable insights
5. Test automated cost monitoring and alerting
6. Test compliance reporting and data retention
7. Test performance optimization and scaling
8. Test security monitoring and threat detection
9. Test disaster recovery and backup procedures

## Implementation Guidance (GREEN Phase)
Implement production-grade operational features using AWS services:

**Step 1: Implement Comprehensive Audit Logging**
- Create detailed audit trail for all diagnostic recommendations
- Log mechanic decisions and override reasons
- Implement customer interaction and consent tracking
- Add financial transaction and pricing audit logs
- Create compliance reporting for automotive service regulations

**Step 2: Build Intelligent Rate Limiting System**
- Implement API rate limiting per user and endpoint
- Add intelligent throttling based on usage patterns
- Create rate limit monitoring and alerting
- Implement graceful degradation for rate-limited requests
- Add cost-based rate limiting for expensive operations

**Step 3: Create Advanced Caching and Performance Optimization**
- Implement multi-layer caching strategy:
  - Parts data: 1-4 hours based on volatility
  - Labor rates: 24-48 hours with regional variations
  - Repair procedures: 7 days with vehicle-specific caching
  - Diagnostic patterns: 1 hour with confidence-based TTL
- Add cache warming and preloading strategies
- Implement cache invalidation and update mechanisms

**Step 4: Build Business Intelligence and Analytics**
- Create diagnostic accuracy tracking and improvement analytics
- Implement cost optimization recommendations
- Add revenue and profitability analytics per shop
- Create customer satisfaction and retention metrics
- Implement predictive analytics for maintenance recommendations

**Step 5: Implement Cost Monitoring and Optimization**
- Add real-time AWS cost monitoring and alerting
- Implement automated scaling based on usage patterns
- Create cost allocation tracking per customer and shop
- Add budget alerts and spending optimization recommendations
- Implement resource utilization monitoring and optimization

**Step 6: Create Advanced Security and Compliance**
- Implement comprehensive security monitoring
- Add threat detection and automated response
- Create data privacy compliance reporting (GDPR, CCPA)
- Implement automotive industry compliance (ISO 26262 considerations)
- Add penetration testing and vulnerability management

**Step 7: Build Disaster Recovery and Business Continuity**
- Implement automated backup and recovery procedures
- Create cross-region disaster recovery capabilities
- Add business continuity planning and testing
- Implement data replication and failover mechanisms
- Create recovery time and point objectives monitoring

## Validation Steps
- Test audit logging captures all required compliance information
- Verify rate limiting effectively manages costs and prevents abuse
- Confirm caching optimization improves performance and reduces costs
- Test business intelligence provides actionable operational insights
- Validate cost monitoring prevents budget overruns
- Test security monitoring detects and responds to threats
- Verify disaster recovery procedures work within defined objectives

---

# PROMPT 15: Integration Testing and End-to-End Validation

## 🔧 **Implementation Guidance**
- **Consult MCP Servers** for any technical questions, implementation patterns, or best practices needed
- **Ask for Clarification** if any requirements, implementation approaches, or technical decisions are unclear
- **Proceed with Implementation** covering all user stories and epics for complete system validation

## Objective
Implement comprehensive integration testing covering all user stories and epics, ensuring complete system functionality and user story acceptance criteria validation.

## Test Cases to Implement First (RED Phase)
Create comprehensive integration test suite covering all 7 epics:
1. Test complete diagnostic workflow with all user story paths
2. Test cross-epic integration points and data flow
3. Test mobile app performance under realistic usage scenarios
4. Test mechanic workflow integration with customer experience
5. Test dongle integration enhances diagnostic accuracy
6. Test gamification system motivates user engagement
7. Test production readiness handles scale and operational requirements
8. Test error handling and graceful degradation across all features
9. Test accessibility and usability across all user stories

## Implementation Guidance (GREEN Phase)
Create comprehensive integration testing framework:

**Step 1: Build End-to-End User Journey Tests**
- Test complete customer diagnostic journey (EPIC 1, 2, 4)
- Test mechanic review and approval workflow (EPIC 5)
- Test dongle pairing and enhanced diagnostics (EPIC 3)
- Test gamification and engagement features (EPIC 6)
- Test production operational scenarios (EPIC 7)

**Step 2: Implement Cross-Epic Integration Testing**
- Test data flow between all epic components
- Validate user story acceptance criteria across epics
- Test system performance under combined epic usage
- Validate error handling across epic boundaries

**Step 3: Create Performance and Scale Testing**
- Test system performance with realistic user loads
- Validate 15-second diagnostic workflow under load
- Test mobile app performance across device types
- Validate AWS infrastructure scaling capabilities

**Step 4: Implement User Acceptance Testing Framework**
- Create test scenarios for all 29+ user stories
- Implement automated acceptance criteria validation
- Add user experience testing and feedback collection
- Create accessibility testing for automotive environments

**Step 5: Build Production Readiness Validation**
- Test all production operational requirements
- Validate monitoring and alerting systems
- Test disaster recovery and business continuity
- Validate security and compliance requirements

## Validation Steps
- All 29+ user stories pass acceptance criteria
- All 7 epics demonstrate complete functionality
- System performance meets all specified requirements
- Production readiness validated for operational deployment
- User experience testing confirms automotive usability
- Integration testing validates cross-epic functionality

---

# Updated Implementation Execution Guidelines

## For Amazon Q Developer CLI

### Sequential Execution Order
Execute prompts in order 1-15, ensuring each prompt's validation steps pass before proceeding:

1. **Foundation Setup** (Prompts 1-2): Project creation and testing framework
2. **UI Implementation** (Prompts 3-4): ChatGPT-style interface and AWS Amplify
3. **Backend Integration** (Prompts 5-7): FastAPI, Strands agents, and MCP
4. **Automotive Features** (Prompts 8-9): VIN system and diagnostic workflow
5. **Service Management** (Prompt 10): Service history and mechanic workflow
6. **Production Deployment** (Prompt 11): Deployment and monitoring
7. **Advanced Features** (Prompts 12-14): Dongle integration, gamification, production readiness
8. **Integration Validation** (Prompt 15): End-to-end testing and validation

### Complete User Story Coverage
Following all 15 prompts will implement:

#### **EPIC 1: Natural Language Symptom Capture** ✅
- US-003: Natural Language Problem Description (Prompts 3, 9)
- US-025: Vehicle Information Choice (Prompt 8)
- US-004: AI Clarification Questions (Prompts 6, 9)

#### **EPIC 2: Vehicle Identification & VIN Anchoring** ✅
- US-001: VIN Scanning (Prompt 8)
- US-002: VIN Location Guidance (Prompt 8)
- US-026: Basic Vehicle Information Collection (Prompt 8)

#### **EPIC 3: Physical-Digital Bridge** ✅
- US-007: Dongle QR Code Pairing (Prompt 12)
- US-008: Personalized App Experience (Prompt 12)

#### **EPIC 4: Quote Generation & Transparency** ✅
- US-005: Probable Diagnosis Display (Prompts 6, 9)
- US-006: Enhanced Diagnosis with Dongle (Prompts 9, 12)
- US-009: Detailed Repair Cost Breakdown (Prompts 6, 9)
- US-010: Multiple Repair Options (Prompt 9)
- US-013: Mobile Quote Modification (Prompt 10)

#### **EPIC 5: Mechanic Review & Mobile Workflow** ✅
- US-011: Mobile Diagnostic Review (Prompt 10)
- US-012: Diagnosis Override and Notes (Prompt 10)
- US-015: Repair Order Status Management (Prompt 10)
- US-016: Work Authorization Tracking (Prompt 10)

#### **EPIC 6: Gamified Experience & Customer Engagement** ✅
- US-017: Shop Visit Recognition (Prompt 13)
- US-018: Achievement and Progress Tracking (Prompt 13)

#### **EPIC 7: Production Readiness & Operational Excellence** ✅
- Comprehensive operational features (Prompt 14)
- Audit trails, rate limiting, cost optimization
- Business intelligence and compliance

---

# POST-PROMPT 16: AWS Account Security and Compliance Setup

## Objective
Configure AWS account security, compliance, and cost management for Dixon Smart Repair in us-west-2 region after core development is complete.

## Implementation Guidance (Post-Development)
Set up foundational AWS security and monitoring:

**Step 1: Enable Security Services**
- Enable CloudTrail for audit logging
- Enable AWS Config for compliance monitoring  
- Enable GuardDuty for threat detection
- Configure CloudWatch for automotive monitoring

**Step 2: Set Up Cost Management**
- Create development budget: $100/month
- Create production budget: $500/month
- Configure cost allocation tags for automotive project

**Step 3: Configure Resource Tagging**
- Apply consistent tags: Project, Environment, Component, CostCenter
- Enable cost tracking and resource organization

## Validation Steps
- Verify security services are active and monitoring
- Confirm budgets and alerts are configured
- Test cost allocation and tagging strategy

---

# POST-PROMPT 17: IAM Roles and Security Hardening

## Objective
Create production-ready IAM roles and security configurations with least privilege access for Dixon Smart Repair.

## Implementation Guidance (Post-Development)
Configure secure IAM access for automotive platform:

**Step 1: Create Environment-Specific IAM Roles**
- Development role: Full access to dev resources in us-west-2
- Production role: Restricted access to prod resources only
- Service roles: Amplify, Lambda, Cognito permissions

**Step 2: Configure Secrets Management**
- Store MCP API keys in AWS Secrets Manager
- Configure automatic rotation policies
- Set up cross-service access permissions

**Step 3: Implement Security Best Practices**
- Enable MFA requirements where appropriate
- Configure resource-based policies
- Set up cross-account access if needed

## Validation Steps
- Test role permissions work correctly
- Verify secrets are accessible by services
- Confirm security policies are enforced

---

# POST-PROMPT 18: Production Monitoring and Alerting

## Objective
Implement comprehensive monitoring, alerting, and observability for Dixon Smart Repair automotive diagnostics in production.

## Implementation Guidance (Post-Development)
Set up production-grade monitoring:

**Step 1: Configure CloudWatch Monitoring**
- Custom metrics for diagnostic accuracy and performance
- Alarms for error rates >5% and latency >15 seconds
- Automotive-specific dashboards

**Step 2: Set Up X-Ray Tracing**
- Enable distributed tracing for diagnostic workflows
- Configure sampling rules for performance analysis
- Create service maps for automotive dependencies

**Step 3: Implement Log Aggregation**
- Centralized logging for all automotive services
- Log retention policies (30 days dev, 90 days prod)
- Structured logging for diagnostic workflows

## Validation Steps
- Test monitoring captures automotive metrics correctly
- Verify alerts trigger for performance issues
- Confirm tracing provides diagnostic insights

---

# POST-PROMPT 19: Web Search Integration Optimization

## Objective
Optimize Tavily web search integration with caching, rate limiting, and cost controls for production automotive data retrieval and parsing.

## Implementation Guidance (Post-Development)
Optimize real-time automotive web search integration:

**Step 1: Implement Advanced Caching Strategy**
- ElastiCache Redis for web search response caching
- TTL settings optimized for automotive data freshness:
  - Parts searches: 4 hours (prices change frequently)
  - Labor rates: 24 hours (regional rates stable daily)
  - Repair procedures: 7 days (procedures rarely change)
- Cache warming for common automotive queries
- Intelligent cache invalidation based on data age and relevance

**Step 2: Configure Production Rate Limiting**
- API quota management: 60 requests/minute, 1000/day for development
- Production scaling: 200 requests/minute, 5000/day
- Intelligent throttling based on usage patterns
- Cost-based rate limiting for expensive automotive searches
- Queue management for burst automotive diagnostic requests

**Step 3: Enhance Automotive Data Parsing**
- Advanced AutomotiveDataParser with machine learning relevance scoring
- Quality filtering for automotive search results (minimum 70% relevance)
- Price validation and outlier detection for parts and labor
- Structured data extraction from unstructured web search results
- Confidence scoring for parsed automotive information

**Step 4: Set Up Production Fallback Mechanisms**
- Graceful degradation when Tavily web search unavailable
- LLM knowledge fallback for automotive data when search fails
- Cached data serving during search service outages
- User communication about data source limitations and freshness
- Automatic retry logic with exponential backoff

**Step 5: Implement Cost Optimization**
- Search query optimization to reduce API calls
- Duplicate query detection and result sharing
- Batch processing for multiple automotive searches
- Cost monitoring and alerting for search API usage
- Usage analytics for search pattern optimization

**Step 6: Add Production Monitoring**
- Search result quality monitoring and alerting
- API response time and availability tracking
- Cost tracking and budget alerts for search usage
- Automotive data accuracy validation and reporting
- User satisfaction metrics for search-enhanced diagnostics

## Validation Steps
- Test advanced caching reduces search API calls and improves performance
- Verify production rate limiting prevents cost overruns and service abuse
- Confirm automotive data parsing extracts high-quality information
- Validate fallback mechanisms maintain user experience during outages
- Test cost optimization reduces search API expenses
- Verify monitoring provides visibility into search integration health

---

# POST-PROMPT 20: Production Deployment and Final Validation

## Objective
Complete production deployment setup, perform comprehensive system validation, and ensure Dixon Smart Repair is ready for automotive service operations.

## Implementation Guidance (Post-Development)
Finalize production deployment and validation:

**Step 1: Production Environment Hardening**
- Configure production Amplify environment
- Set up production database and storage
- Enable production monitoring and alerting

**Step 2: Security and Compliance Validation**
- Perform security scanning and penetration testing
- Validate data encryption at rest and in transit
- Confirm automotive data privacy compliance

**Step 3: Performance and Scale Testing**
- Load testing for automotive diagnostic workflows
- Validate 15-second diagnostic performance requirement
- Test system behavior under peak automotive service loads

**Step 4: Disaster Recovery Setup**
- Configure automated backups for automotive data
- Set up cross-region replication for critical data
- Test disaster recovery procedures

## Validation Steps
- Complete end-to-end production validation
- Verify all automotive workflows perform correctly
- Confirm system is ready for automotive service deployment
- Test disaster recovery and business continuity

---

# Updated Implementation Execution Guidelines

## For Amazon Q Developer CLI

### Sequential Execution Order
Execute prompts in order 1-20, ensuring each prompt's validation steps pass before proceeding:

1. **Foundation Setup** (Prompts 1-2): Project creation and testing framework
2. **UI Implementation** (Prompts 3-4): ChatGPT-style interface and AWS Amplify
3. **Backend Integration** (Prompts 5-7): FastAPI, Strands agents, and MCP
4. **Automotive Features** (Prompts 8-9): VIN system and diagnostic workflow
5. **Service Management** (Prompt 10): Service history and mechanic workflow
6. **Production Deployment** (Prompt 11): Basic deployment and monitoring
7. **Advanced Features** (Prompts 12-14): Dongle integration, gamification, production readiness
8. **Integration Validation** (Prompt 15): End-to-end testing and validation
9. **Infrastructure Hardening** (Prompts 16-20): AWS security, monitoring, and production optimization

### Development-First Approach Benefits
- **Faster Development Start**: Begin coding immediately without waiting for complete AWS setup
- **Iterative Infrastructure**: Add infrastructure complexity as application matures
- **Cost Optimization**: Avoid infrastructure costs during development phase
- **Flexibility**: Adjust infrastructure based on actual application requirements

### Post-Prompt Infrastructure Benefits
- **Production-Ready**: Infrastructure setup based on actual application needs
- **Security Hardening**: Apply security best practices after understanding application flow
- **Performance Optimization**: Optimize based on real application performance data
- **Cost Control**: Implement cost controls after understanding actual usage patterns

# PROMPT 14: Advanced Production Readiness and Operational Excellence

## Context Essentials
- **Project**: Dixon Smart Repair - Conversational automotive diagnostic chatbot
- **Previous**: Gamification and customer engagement features operational (PROMPT 13)
- **Goal**: Implement advanced production readiness and operational excellence (EPIC 7)
- **Build On**: Complete system with all features, monitoring, and engagement

## Quick Validation
**Check**: Gamification system working with achievements and social features
**Expected**: Complete customer engagement system with progress tracking
**If Fails**: Complete PROMPT 13 gamification and engagement implementation

## Context Sources
- **current-state.md**: Gamification section - Customer engagement status
- **epics.md EPIC-007**: Production Readiness & Operational Excellence
- **product-roadmap.md Phase 3**: Advanced production features

## Implementation

### Step 1: Advanced Audit and Compliance
Implement comprehensive audit system:
```python
# Enhanced audit system for production
class ComprehensiveAuditSystem:
    def __init__(self):
        self.audit_table = boto3.resource('dynamodb').Table('dixon-audit-logs')
        self.compliance_requirements = [
            'diagnostic_recommendation_logged',
            'mechanic_override_documented',
            'customer_consent_recorded',
            'pricing_transparency_maintained'
        ]
    
    def log_complete_session(self, session_data):
        """Log complete diagnostic session with all compliance data"""
        
        audit_record = {
            'audit_id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat(),
            'session_type': 'diagnostic_complete',
            'customer_data': {
                'customer_id': session_data['customer_id'],
                'consent_given': session_data['consent_given'],
                'privacy_acknowledged': session_data['privacy_acknowledged']
            },
            'diagnostic_data': {
                'symptoms': session_data['symptoms'],
                'vehicle_context': session_data['vehicle_context'],
                'ai_diagnosis': session_data['ai_diagnosis'],
                'confidence_level': session_data['confidence_level'],
                'tools_used': session_data['tools_used'],
                'processing_time': session_data['processing_time']
            },
            'mechanic_data': session_data.get('mechanic_review', {}),
            'financial_data': {
                'quote_provided': session_data.get('quote_provided'),
                'pricing_breakdown': session_data.get('pricing_breakdown'),
                'transparency_level': session_data.get('transparency_level')
            },
            'compliance_status': self.check_compliance(session_data)
        }
        
        # Store audit record
        self.audit_table.put_item(Item=audit_record)
```

### Step 2: Intelligent Cost Optimization
Implement advanced cost management with 40-60% API cost reduction through intelligent caching and rate limiting.

### Step 3: Business Intelligence Dashboard
Create comprehensive analytics dashboard with actionable insights for operational excellence.

## Completion Checklist
- [ ] Comprehensive audit system with compliance tracking
- [ ] Intelligent cost optimization with 40-60% API cost reduction
- [ ] Business intelligence dashboard with actionable insights
- [ ] Advanced monitoring and alerting for all system components
- [ ] Update current-state.md with "Advanced Production - Complete"

## Validation
**Test**: Complete system audit → cost optimization report → business intelligence
**Expected**: Production-ready system with operational excellence and compliance

## Next Prompt Ready
- **Enables**: System is production-ready for automotive service deployment
- **Provides**: Complete operational excellence and business intelligence
- **Ready For**: Production deployment and customer onboarding

---

# 🎉 Implementation Complete: Dixon Smart Repair Production Ready

## **System Status: PRODUCTION READY**

### ✅ **All 7 EPICs Implemented:**
1. **EPIC 1**: Natural Language Symptom Capture ✅
2. **EPIC 2**: Vehicle Identification & VIN Anchoring ✅  
3. **EPIC 3**: Physical-Digital Bridge (Dongle Integration) ✅
4. **EPIC 4**: Quote Generation & Transparency ✅
5. **EPIC 5**: Mechanic Review & Mobile Workflow ✅
6. **EPIC 6**: Gamified Experience & Customer Engagement ✅
7. **EPIC 7**: Production Readiness & Operational Excellence ✅

### 🚀 **Ready for Production Deployment:**
- Complete conversational automotive diagnostic system
- Real-time chat with vehicle information choice system
- VIN scanning and vehicle identification
- Complete diagnostic workflow with multiple repair options
- Mechanic mobile workflow with override capabilities
- Production monitoring and audit compliance
- Dongle integration for enhanced diagnostics
- Gamification and customer engagement
- Advanced operational excellence and business intelligence

**Dixon Smart Repair is now ready to transform automotive diagnostics through conversational AI!** 🔧🤖
