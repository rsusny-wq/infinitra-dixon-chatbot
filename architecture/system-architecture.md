---
artifact_id: ART-037
title: System Architecture - Dixon Smart Repair
category: Architecture & Design
priority: mandatory
dependencies:
  requires:
    - ART-018: Product Roadmap (feature priorities and timeline)
    - ART-019: Epics (system scope and component boundaries)
    - ART-030: User Stories (functional requirements and data flows)
  enhances:
    - ART-021: Security Architecture
    - ART-022: Integration Architecture
    - ART-023: Component Design
validation_criteria:
  - System components clearly defined with responsibilities
  - 5-tool Strands architecture documented with rationale
  - MCP integration strategy defined for real-time intelligence
  - Scalability approach defined for automotive repair workflow
  - Production readiness features integrated throughout
quality_gates:
  - Architecture supports all 7 epic requirements
  - 5-tool design enables streamlined automotive repair workflow
  - MCP integration provides real-time market intelligence
  - System can scale to meet automotive service performance targets
  - Production readiness features ensure operational excellence
---

# System Architecture - Dixon Smart Repair

## Purpose
Define the high-level system architecture for Dixon Smart Repair's AI-powered automotive diagnostic platform, featuring a streamlined 5-tool Strands agent architecture with MCP integration for real-time market intelligence and comprehensive production readiness capabilities.

## 1. Architecture Overview

### System Vision
Dixon Smart Repair transforms automotive repair communication through an intelligent, streamlined AI platform that bridges the gap between customers and mechanics. The system uses a **5-tool Strands agent architecture** with **MCP integration** for real-time market intelligence, eliminating complex orchestration in favor of intelligent, model-driven decision making.

### Key Architectural Principles
1. **Strands-Managed Simplicity**: Let Strands agent handle tool orchestration automatically
2. **Real-Time Intelligence**: Combine LLM knowledge with live market data via MCP
3. **Graceful Degradation**: System works reliably with any level of data availability
4. **Transparent Limitations**: Always communicate data source and confidence levels
5. **Production-Ready Operations**: Built-in audit, monitoring, caching, and rate limiting

### Architecture Patterns
**Primary Pattern**: Serverless Microservices with AI Agent Orchestration
- **Strands Agent Core**: Central AI orchestration with 5 specialized tools
- **MCP Integration Layer**: Provider-agnostic real-time data access
- **React Native Mobile**: Cross-platform customer and mechanic applications
- **AWS Serverless Backend**: Scalable, cost-effective infrastructure

**Rationale**: This pattern provides maximum flexibility for automotive workflows while minimizing operational complexity through managed services and intelligent agent coordination.

## 2. System Components

### Core Component: Strands AI Agent
**Component Name**: Dixon Automotive Repair Agent  
**Responsibility**: Orchestrate complete automotive repair workflow using 5 specialized tools  
**Technology Choice**: AWS Strands Agents SDK with Amazon Bedrock (Claude 3.5 Sonnet)  
**Rationale**: Strands provides intelligent tool orchestration, eliminating need for custom workflow logic  
**Scalability**: Auto-scales with conversation volume through AWS Fargate containers  
**Dependencies**: MCP servers, AWS Bedrock, tool-specific APIs

#### 5 Core Agent Tools

**Tool 1: Symptom Diagnosis Analyzer**
- **Responsibility**: Analyze customer symptoms and provide diagnosis with likely parts
- **Technology**: Python function with MCP web search integration
- **MCP Usage**: Search for recalls, TSBs, and known vehicle issues
- **Fallback**: LLM knowledge base when MCP unavailable

**Tool 2: Parts Availability Lookup**
- **Responsibility**: Comprehensive parts discovery with real-time pricing and availability
- **Technology**: Python function with MCP web search integration
- **MCP Usage**: Real-time parts pricing across multiple suppliers
- **Fallback**: Generic parts information from LLM knowledge

**Tool 3: Labor Estimator**
- **Responsibility**: Time estimates and regional labor rates
- **Technology**: Python function with MCP web search integration
- **MCP Usage**: Current regional labor rates and market conditions
- **Fallback**: National average rates from LLM knowledge

**Tool 4: Pricing Calculator**
- **Responsibility**: Complete cost breakdown using data from other tools
- **Technology**: Python function (no MCP - orchestrates data)
- **Data Sources**: Combines labor estimates, parts costs, and overhead
- **Fallback**: Not applicable (orchestrates already-available data)

**Tool 5: Repair Instructions**
- **Responsibility**: Step-by-step repair procedures with quality checks
- **Technology**: Python function with MCP web search integration
- **MCP Usage**: Latest repair procedures and manufacturer updates
- **Fallback**: Standard procedures from LLM knowledge

### MCP Integration Layer
**Component Name**: Real-Time Market Intelligence Layer  
**Responsibility**: Provide real-time automotive market data to agent tools  
**Technology Choice**: Model Context Protocol (MCP) with configurable providers  
**Rationale**: Provider-agnostic design allows switching between Tavily, Serper, Bing without code changes  
**Scalability**: Scales with tool usage, includes intelligent rate limiting  
**Dependencies**: External search providers, caching layer, rate limiting service

### Mobile Applications
**Component Name**: React Native Mobile Apps  
**Responsibility**: Customer and mechanic mobile interfaces  
**Technology Choice**: React Native Expo with TypeScript  
**Rationale**: Single codebase for iOS/Android, optimized for automotive environments  
**Scalability**: Client-side scaling, WebSocket connections for real-time agent communication  
**Dependencies**: Strands agent API, authentication service, offline sync

### Backend Infrastructure
**Component Name**: AWS Serverless Backend  
**Responsibility**: API gateway, authentication, data persistence, and infrastructure services  
**Technology Choice**: AWS Lambda, API Gateway, DynamoDB, S3  
**Rationale**: Serverless provides automatic scaling and cost optimization for variable automotive service loads  
**Scalability**: Auto-scales from zero to thousands of concurrent users  
**Dependencies**: AWS managed services, monitoring and logging systems

## 3. Technology Stack

### AI and Agent Technology
- **Strands Agents SDK**: Latest version with tool orchestration capabilities
- **Amazon Bedrock**: Claude 3.5 Sonnet for natural language processing
- **MCP Integration**: Provider-agnostic real-time data access
- **Tool Framework**: Python-based tool implementations with error handling

### Frontend Technology
- **Framework**: React Native Expo for cross-platform mobile development
- **State Management**: Zustand for lightweight, automotive-optimized state management
- **Real-Time Communication**: WebSocket integration with Strands agent
- **Offline Capability**: Local storage with sync queue for automotive environments

### Backend Technology
- **Runtime Environment**: Python 3.11 for Strands agent and tools
- **API Framework**: FastAPI for high-performance API endpoints
- **Authentication**: AWS Cognito for user management and JWT tokens
- **Real-Time Communication**: WebSocket support through AWS API Gateway

### Infrastructure Technology
- **Cloud Provider**: AWS with multi-region deployment capability
- **Container Strategy**: AWS Fargate for Strands agent deployment
- **Serverless Functions**: AWS Lambda for API endpoints and background processing
- **Database**: DynamoDB for scalable NoSQL data storage with automotive-specific schemas

### Production Readiness Technology
- **Monitoring**: AWS CloudWatch with custom automotive service metrics
- **Logging**: Structured logging with audit trail capabilities
- **Caching**: Redis for intelligent caching of parts pricing and labor rates
- **Rate Limiting**: AWS API Gateway throttling with MCP quota management

## 4. Data Architecture

### Data Storage Strategy
**Primary Database**: Amazon DynamoDB  
**Rationale**: NoSQL flexibility for varied automotive data, automatic scaling, managed service reduces operational overhead  
**Data Modeling**: Single-table design with GSIs for automotive-specific access patterns  
**Backup Strategy**: Point-in-time recovery with cross-region replication

### Data Flow Design
1. **Customer Input**: Natural language symptoms via mobile app
2. **Agent Processing**: Strands agent orchestrates 5 tools with MCP integration
3. **Real-Time Enhancement**: MCP provides current market data for 4 tools
4. **Data Synthesis**: Agent combines LLM knowledge with real-time intelligence
5. **Response Generation**: Complete automotive repair guidance with transparency
6. **Audit Logging**: All interactions logged for liability protection and quality assurance

### Caching Strategy
- **Parts Pricing**: 1-4 hour TTL based on market volatility
- **Labor Rates**: 24-48 hour TTL for regional accuracy
- **Repair Procedures**: 7-day TTL for consistency
- **Vehicle Data**: 30-day TTL for VIN decoding and specifications

## 5. Integration Architecture

### External Integrations
**MCP Search Providers**:
- **Tavily**: Primary real-time search provider
- **Serper**: Secondary search provider for redundancy
- **Bing**: Tertiary search provider option
- **Integration Pattern**: Provider-agnostic MCP client with automatic failover

**Automotive Data APIs**:
- **NHTSA VIN API**: Free vehicle identification and recall data
- **Parts Pricing APIs**: Real-time parts pricing from multiple suppliers
- **Labor Rate APIs**: Regional automotive labor rate data

### Internal Communication
**Agent-to-Tool Communication**: Direct Python function calls within Strands framework  
**Mobile-to-Backend**: WebSocket for real-time agent conversations, REST for transactional operations  
**Service-to-Service**: AWS EventBridge for asynchronous processing and audit logging  
**Error Handling**: Graceful degradation with transparent limitation communication

## 6. Scalability and Performance

### Scalability Strategy
**Agent Scaling**: AWS Fargate auto-scaling based on conversation volume  
**API Scaling**: AWS Lambda automatic scaling for REST endpoints  
**Database Scaling**: DynamoDB on-demand scaling for variable automotive service loads  
**MCP Scaling**: Intelligent rate limiting and caching to optimize external API usage

### Performance Optimization
**Response Time Targets**:
- Agent responses: <3 seconds for complete automotive diagnosis
- Parts lookup: <2 seconds with caching, <5 seconds with real-time search
- Mobile app interactions: <2 seconds for all UI operations

**Caching Strategy**: Multi-layer caching with automotive-specific TTL policies  
**CDN Usage**: CloudFront for mobile app assets and static automotive reference data  
**Database Optimization**: DynamoDB single-table design with optimized GSIs for automotive queries

## 7. Security Architecture Integration

### Authentication and Authorization
- **Customer Authentication**: AWS Cognito with social login options
- **Mechanic Authentication**: Enhanced Cognito with shop-based role management
- **API Security**: JWT tokens with automotive-specific claims and scopes
- **MCP Security**: Secure API key management with rotation policies

### Data Protection
- **Encryption at Rest**: AES-256 encryption for all stored automotive and customer data
- **Encryption in Transit**: TLS 1.3 for all API communications and WebSocket connections
- **PII Protection**: Automotive customer data classified and protected according to privacy regulations
- **Audit Logging**: Immutable audit trails for all repair recommendations and decisions

## 8. Production Readiness Features

### Audit and Compliance
**Audit Trail System**:
- **Purpose**: Complete logging of all repair recommendations for liability protection
- **Implementation**: Immutable DynamoDB audit log with timestamp, user, inputs, outputs, rationale
- **Retention**: 7-year retention for automotive service compliance
- **Access**: Role-based access with audit trail for audit log access

### Performance Monitoring
**Real-Time Monitoring**:
- **Tool Performance**: Execution time and success rate for each of the 5 tools
- **MCP Usage**: API call volume, success rates, and cost tracking per provider
- **User Experience**: Response times, error rates, and satisfaction metrics
- **Business Metrics**: Diagnostic accuracy, customer satisfaction, mechanic efficiency

### Intelligent Caching
**Multi-Layer Caching Strategy**:
- **L1 Cache**: In-memory caching within Strands agent for session data
- **L2 Cache**: Redis cluster for shared automotive data (parts, labor rates)
- **L3 Cache**: DynamoDB with TTL for long-term automotive reference data
- **Cache Invalidation**: Event-driven invalidation for critical automotive data updates

### Rate Limiting and Cost Control
**MCP Rate Limiting**:
- **Intelligent Throttling**: Queue non-urgent requests during high usage periods
- **Provider Balancing**: Distribute load across multiple MCP providers
- **Cost Monitoring**: Real-time cost tracking with budget alerts
- **Graceful Degradation**: Fallback to LLM knowledge when rate limits approached

## 9. Deployment and Operations

### Deployment Model
**Multi-Environment Strategy**:
- **Development**: Single-region deployment with reduced capacity
- **Staging**: Production-like environment for automotive workflow testing
- **Production**: Multi-region deployment with disaster recovery capabilities

**Deployment Automation**:
- **Infrastructure as Code**: AWS CDK for complete infrastructure definition
- **CI/CD Pipeline**: GitHub Actions with automotive-specific testing stages
- **Blue-Green Deployment**: Zero-downtime deployments for Strands agent updates
- **Rollback Strategy**: Automated rollback triggers based on automotive service metrics

### Operational Considerations
**Health Monitoring**:
- **Agent Health**: Strands agent responsiveness and tool availability
- **MCP Health**: Search provider availability and response times
- **Mobile App Health**: App crash rates and performance metrics
- **Business Health**: Automotive service quality and customer satisfaction

**Maintenance Procedures**:
- **Agent Updates**: Rolling updates with automotive workflow validation
- **Tool Updates**: Individual tool deployment with backward compatibility
- **MCP Provider Updates**: Provider switching with zero service interruption
- **Database Maintenance**: Automated backup verification and performance tuning

## Decision Documentation

### Architecture Decisions Made

**DECISION-001: 5-Tool Strands Architecture**
- **Decision**: Implement 5 focused tools instead of 25+ complex tools
- **Context**: Need to simplify automotive repair workflow while maintaining comprehensive functionality
- **Options Considered**: Complex multi-tool system, simple single-tool system, 5-tool focused system
- **Rationale**: 5 tools provide complete automotive workflow coverage with clear boundaries and reduced complexity
- **Consequences**: 80% reduction in complexity, clearer testing boundaries, easier maintenance

**DECISION-002: MCP Integration for Real-Time Intelligence**
- **Decision**: Use MCP for 4 out of 5 tools to provide real-time market data
- **Context**: Need current automotive market data for accurate parts pricing and labor rates
- **Options Considered**: Static data only, direct API integration, MCP provider-agnostic integration
- **Rationale**: MCP provides provider flexibility and graceful degradation capabilities
- **Consequences**: Enhanced accuracy with real-time data, increased API costs, dependency on external providers

**DECISION-003: Strands-Managed Orchestration**
- **Decision**: Let Strands agent handle all tool orchestration automatically
- **Context**: Complex custom orchestration logic was difficult to maintain and test
- **Options Considered**: Custom orchestration, simple sequential execution, Strands-managed orchestration
- **Rationale**: Strands provides intelligent orchestration with better error handling and edge case management
- **Consequences**: Reduced custom code by 90%, improved reliability, dependency on Strands framework

**DECISION-004: Production Readiness in Phase 2**
- **Decision**: Implement audit trails, rate limiting, caching, and monitoring as Phase 2 features
- **Context**: Need production-ready operational capabilities for automotive service liability and cost control
- **Options Considered**: Phase 1 implementation, Phase 2 implementation, Phase 3 implementation
- **Rationale**: Phase 2 timing allows MVP validation while ensuring production readiness before scale
- **Consequences**: Delayed operational features but faster MVP delivery, clear production readiness roadmap

### Technology Selection Rationale

**Strands Agents SDK**:
- **Selection Criteria**: Intelligent tool orchestration, AWS integration, automotive workflow support
- **Alternatives Considered**: Custom agent framework, LangChain, direct LLM integration
- **Risk Assessment**: Framework dependency risk mitigated by AWS backing and active development

**React Native Expo**:
- **Selection Criteria**: Cross-platform development, automotive environment optimization, rapid development
- **Alternatives Considered**: Native iOS/Android, Flutter, Progressive Web App
- **Risk Assessment**: Platform dependency risk mitigated by large community and Facebook backing

**AWS Serverless Stack**:
- **Selection Criteria**: Auto-scaling, cost optimization, managed services, automotive service load patterns
- **Alternatives Considered**: Traditional server deployment, Kubernetes, other cloud providers
- **Risk Assessment**: Vendor lock-in risk mitigated by industry-standard services and migration capabilities

## Usage Notes

### For Development Module
This architecture will guide:
- Strands agent implementation with 5-tool architecture
- MCP integration development and testing
- Mobile app development with WebSocket integration
- Production readiness feature implementation in Phase 2

### For Infrastructure Module
This architecture will inform:
- AWS CDK infrastructure deployment
- Multi-environment setup and CI/CD pipeline configuration
- Monitoring and observability system implementation
- Production readiness operational procedures

## Quality Checklist

### Completeness
- [x] All 5 agent tools are clearly defined with responsibilities
- [x] MCP integration strategy is comprehensive with fallback plans
- [x] Technology stack is fully specified with automotive-specific considerations
- [x] Production readiness features are integrated throughout architecture
- [x] Scalability approach addresses automotive service load patterns

### Clarity
- [x] 5-tool architecture is clearly explained with rationale
- [x] MCP integration patterns are well-documented
- [x] Component responsibilities are unambiguous and focused
- [x] Technology choices include clear automotive-specific rationale
- [x] Production readiness features are clearly specified

### Feasibility
- [x] 5-tool architecture can be implemented within timeline constraints
- [x] MCP integration is realistic with available providers and budgets
- [x] Technology choices are appropriate for automotive service requirements
- [x] Production readiness features are achievable with available resources
- [x] Operational requirements are manageable for automotive service context

### Alignment
- [x] Architecture supports all 7 epic requirements including production readiness
- [x] 5-tool design aligns with streamlined automotive repair workflow
- [x] MCP integration supports real-time automotive market intelligence needs
- [x] Production readiness features enable operational excellence and liability protection
- [x] Technology choices support long-term automotive service platform vision
