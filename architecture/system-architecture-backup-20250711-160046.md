# ART-037: System Architecture Document - Dixon Smart Repair

## Artifact Information
- **Artifact ID**: ART-037
- **Artifact Name**: System Architecture Document
- **Category**: System Design & Architecture
- **Module**: Architecture & Design
- **Owner**: Technical Architect
- **Contributors**: Tech Lead, Product Owner, Security Architect
- **Priority**: High
- **Last Updated**: January 2025

## Purpose
Define the comprehensive system architecture for Dixon Smart Repair's AI-powered automotive diagnostic platform, including Strands agent integration, mobile applications, cloud infrastructure, and external system integrations.

## Dependencies
- **Input Dependencies**: Product Roadmap, Epics, User Stories, Business Requirements, Release Plan
- **Output Dependencies**: Component Design Specifications, API Specifications, Development Implementation

---

# System Architecture - Dixon Smart Repair

## Architecture Overview

### System Vision
Dixon Smart Repair is an AI-powered automotive diagnostic platform that transforms customer-mechanic communication through intelligent conversation. The system uses Strands Agents for natural language processing and tool orchestration, integrated with React Native mobile applications and AWS cloud infrastructure.

### Architecture Principles
1. **Mobile-First Design**: Optimized for automotive environments and mobile usage patterns
2. **AI-Driven Intelligence**: Strands agents provide intelligent conversation and tool orchestration
3. **Real-Time Communication**: Streaming responses and live diagnostic data integration
4. **Scalable Cloud Architecture**: AWS-native services for reliability and scale
5. **Security by Design**: End-to-end encryption and automotive data protection
6. **Progressive Enhancement**: Graceful degradation and feature enhancement based on available data

## High-Level Architecture

### System Components Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIXON SMART REPAIR PLATFORM                 │
├─────────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Customer      │  │   Mechanic      │  │   Web           │ │
│  │   Mobile App    │  │   Mobile App    │  │   Dashboard     │ │
│  │   (React Native)│  │   (React Native)│  │   (Optional)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  API GATEWAY LAYER                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              AWS API Gateway + WebSocket                    │ │
│  │         (Authentication, Rate Limiting, Routing)            │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Strands       │  │   FastAPI       │  │   Tool          │ │
│  │   Agent         │  │   Service       │  │   Registry      │ │
│  │   (Python)      │  │   (Orchestration)│  │   (15 Tools)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   DynamoDB      │  │   S3 Storage    │  │   ElastiCache   │ │
│  │   (Conversations)│  │   (Files/Images)│  │   (Sessions)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  INTEGRATION LAYER                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Amazon        │  │   External      │  │   OBD2          │ │
│  │   Bedrock       │  │   APIs          │  │   Integration   │ │
│  │   (Claude 3.7)  │  │   (VIN, Parts)  │  │   (Bluetooth)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Architecture Components

### 1. Strands Agent Architecture

#### Agent Configuration
```python
# Core Strands Agent Setup
agent = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",  # Amazon Bedrock
    tools=[
        # Diagnostic Tools
        vin_scanner, photo_analyzer, symptom_classifier,
        # Service Tools  
        quote_generator, service_scheduler, mechanic_communicator,
        # Integration Tools
        obd2_reader, parts_lookup, maintenance_scheduler,
        # User Experience Tools
        achievement_tracker, offline_sync, notification_sender
    ],
    system_prompt="""You are an expert automotive diagnostic assistant.
    Help customers understand their vehicle issues through natural conversation.
    Use available tools to provide accurate diagnosis and service recommendations.
    Always prioritize safety and provide clear, actionable guidance."""
)
```

#### Agent Deployment Architecture
- **Service Type**: FastAPI web service with async streaming
- **Deployment**: AWS ECS Fargate containers for scalability
- **Load Balancing**: Application Load Balancer with health checks
- **Auto Scaling**: Based on CPU/memory utilization and request volume
- **High Availability**: Multi-AZ deployment with automatic failover

#### Streaming Integration Pattern
```python
# Real-time streaming to mobile apps
async def handle_user_message(websocket, message):
    agent_stream = agent.stream_async(message)
    
    async for event in agent_stream:
        if "data" in event:
            # Stream text response to mobile app
            await websocket.send_json({
                "type": "response_chunk",
                "data": event["data"]
            })
        elif "current_tool_use" in event:
            # Show tool activity in mobile app
            await websocket.send_json({
                "type": "tool_activity", 
                "tool": event["current_tool_use"]["name"]
            })
```

### 2. Mobile Application Architecture

#### React Native Architecture
- **Framework**: React Native Expo for cross-platform development
- **State Management**: Zustand for lightweight state management
- **Navigation**: React Navigation v6 for mobile-optimized navigation
- **Real-time Communication**: WebSocket client for Strands agent streaming
- **Offline Support**: AsyncStorage with sync queue for offline capabilities

#### Mobile App Components
```typescript
// Core Mobile Architecture
interface MobileAppArchitecture {
  // Presentation Layer
  screens: {
    ChatScreen: "Main diagnostic conversation interface",
    VehicleScreen: "Vehicle information and garage management", 
    ServiceScreen: "Service history and scheduling",
    SettingsScreen: "User preferences and privacy controls"
  },
  
  // Communication Layer
  services: {
    StrandsService: "WebSocket connection to Strands agent",
    OfflineService: "Queue management for offline operations",
    NotificationService: "Push notifications and alerts"
  },
  
  // Data Layer
  storage: {
    ConversationStore: "Local conversation history",
    VehicleStore: "Vehicle information and preferences",
    CacheStore: "Temporary data and media files"
  }
}
```

#### Mobile-Specific Optimizations
- **Voice Integration**: Web Speech API for hands-free operation
- **Camera Integration**: Expo Camera for VIN scanning and photo capture
- **Bluetooth Integration**: React Native Bluetooth for OBD2 dongles
- **Push Notifications**: Expo Notifications for service updates
- **Offline Capabilities**: Local storage with background sync

### 3. Cloud Infrastructure Architecture

#### AWS Services Architecture
```yaml
# Core AWS Services
Compute:
  - ECS Fargate: Strands agent service containers
  - Lambda: Serverless functions for integrations
  - API Gateway: REST API and WebSocket management

Storage:
  - DynamoDB: Conversation history, user profiles, vehicle data
  - S3: Photo storage, diagnostic images, file attachments
  - ElastiCache: Session management, temporary data

Security:
  - Cognito: User authentication and authorization
  - WAF: Web application firewall protection
  - KMS: Encryption key management
  - Secrets Manager: API keys and sensitive configuration

Monitoring:
  - CloudWatch: Logging, metrics, and alerting
  - X-Ray: Distributed tracing for performance monitoring
  - CloudTrail: Audit logging for compliance
```

#### Infrastructure as Code
- **CDK (TypeScript)**: Infrastructure definition and deployment
- **Multi-Environment**: Development, staging, and production environments
- **Auto Scaling**: Dynamic scaling based on demand
- **Disaster Recovery**: Multi-region backup and failover capabilities

### 4. Data Architecture

#### Database Design
```sql
-- Core Data Entities (DynamoDB Schema)

-- Conversations Table
ConversationId (PK) | UserId | VehicleId | Status | CreatedAt | UpdatedAt
Messages (GSI)      | MessageId | ConversationId | Content | Timestamp | Type

-- Users Table  
UserId (PK) | Email | Profile | Preferences | CreatedAt | LastActive
Vehicles (GSI) | VehicleId | UserId | VIN | Make | Model | Year

-- Diagnostics Table
DiagnosticId (PK) | ConversationId | Symptoms | Confidence | Results | Status
Tools (GSI) | ToolId | DiagnosticId | ToolName | Input | Output | Timestamp

-- Services Table
ServiceId (PK) | DiagnosticId | MechanicId | Quote | Status | ScheduledDate
History (GSI) | ServiceId | UserId | VehicleId | CompletedDate | Cost
```

#### Data Flow Architecture
1. **User Input**: Mobile app → API Gateway → FastAPI service
2. **Agent Processing**: FastAPI → Strands agent → Tool execution
3. **Data Storage**: Tool results → DynamoDB/S3 → Response streaming
4. **Real-time Updates**: WebSocket → Mobile app → UI updates

### 5. Integration Architecture

#### External System Integrations
```python
# Integration Tools for Strands Agent
@tool
def lookup_vin(vin: str) -> dict:
    """Decode VIN using NHTSA API"""
    # Integration with free NHTSA VIN database
    
@tool  
def get_parts_pricing(part_number: str, vehicle_info: dict) -> dict:
    """Get parts pricing from automotive APIs"""
    # Integration with parts pricing services
    
@tool
def read_obd2_data(device_id: str) -> dict:
    """Read live diagnostic data from OBD2 dongle"""
    # Bluetooth integration with diagnostic hardware
```

#### API Integration Patterns
- **NHTSA VIN API**: Free VIN decoding with rate limiting (5,000/hour)
- **Parts Pricing APIs**: Third-party automotive parts databases
- **OBD2 Integration**: Bluetooth Low Energy for diagnostic dongles
- **Payment Processing**: Stripe integration for service payments
- **Notification Services**: AWS SNS for push notifications

## Performance Architecture

### Performance Requirements
- **API Response Time**: <2 seconds for 95% of requests
- **Mobile Interactions**: <3 seconds for UI responses  
- **AI Diagnosis**: <10 seconds for complex analysis
- **Concurrent Users**: 1,000 simultaneous diagnostic sessions
- **Throughput**: 100,000 diagnostic sessions per month

### Performance Optimization Strategies

#### Caching Architecture
```python
# Multi-layer caching strategy
class CachingStrategy:
    levels = {
        "L1_Mobile": "Local mobile app cache (AsyncStorage)",
        "L2_CDN": "CloudFront CDN for static assets",
        "L3_Application": "ElastiCache for session data",
        "L4_Database": "DynamoDB DAX for hot data"
    }
    
    patterns = {
        "VIN_Lookups": "Cache for 24 hours (vehicle data rarely changes)",
        "Parts_Pricing": "Cache for 1 hour (pricing updates frequently)", 
        "Diagnostic_Results": "Cache for session duration",
        "User_Preferences": "Cache until explicitly updated"
    }
```

#### Scaling Architecture
- **Horizontal Scaling**: ECS auto-scaling based on CPU/memory metrics
- **Database Scaling**: DynamoDB on-demand scaling with burst capacity
- **CDN Distribution**: CloudFront global edge locations
- **Load Balancing**: Application Load Balancer with health checks

## Security Architecture

### Security Framework
- **Authentication**: AWS Cognito with MFA support
- **Authorization**: Role-based access control (Customer, Mechanic, Admin)
- **Data Encryption**: TLS 1.3 in transit, AES-256 at rest
- **API Security**: Rate limiting, input validation, OWASP compliance
- **Privacy Protection**: GDPR/CCPA compliance with data export/deletion

### Security Implementation
```python
# Security middleware for FastAPI
class SecurityMiddleware:
    def __init__(self):
        self.rate_limiter = RateLimiter(requests_per_minute=60)
        self.input_validator = InputValidator()
        self.auth_handler = CognitoAuthHandler()
    
    async def process_request(self, request):
        # Rate limiting
        await self.rate_limiter.check(request.client.host)
        
        # Authentication
        user = await self.auth_handler.verify_token(request.headers.get("Authorization"))
        
        # Input validation
        validated_data = self.input_validator.validate(request.json())
        
        return validated_data, user
```

## Monitoring and Observability

### Monitoring Architecture
- **Application Metrics**: Custom CloudWatch metrics for business KPIs
- **Performance Monitoring**: X-Ray distributed tracing
- **Log Aggregation**: CloudWatch Logs with structured logging
- **Alerting**: CloudWatch Alarms with SNS notifications
- **Health Checks**: Application and infrastructure health monitoring

### Key Metrics
```python
# Business and Technical Metrics
metrics = {
    "business": {
        "diagnostic_sessions_per_hour": "Rate of new diagnostic sessions",
        "average_session_duration": "Time from start to completion",
        "customer_satisfaction_score": "Post-session feedback ratings",
        "mechanic_efficiency_gain": "Time saved per diagnostic session"
    },
    
    "technical": {
        "api_response_time_p95": "95th percentile API response time",
        "strands_agent_latency": "Agent processing time per message",
        "websocket_connection_stability": "Connection drop rate",
        "mobile_app_crash_rate": "Application stability metrics"
    }
}
```

## Deployment Architecture

### Environment Strategy
- **Development**: Local development with Docker Compose
- **Staging**: AWS environment mirroring production
- **Production**: Multi-AZ deployment with auto-scaling

### CI/CD Pipeline
```yaml
# Deployment Pipeline
stages:
  - source: GitHub repository with branch protection
  - build: Docker image building and testing
  - test: Automated testing (unit, integration, e2e)
  - security: Security scanning and vulnerability assessment
  - deploy: Blue-green deployment with health checks
  - monitor: Post-deployment monitoring and alerting
```

### Disaster Recovery
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Backup Strategy**: Automated daily backups with point-in-time recovery
- **Failover**: Automated failover to secondary AWS region

## Architecture Decision Records

### ADR-001: Strands Agent Integration
- **Decision**: Use FastAPI service with Strands Python SDK
- **Rationale**: Enables streaming responses and tool orchestration
- **Alternatives Considered**: Direct Bedrock integration, custom agent framework
- **Trade-offs**: Additional service complexity vs. enhanced AI capabilities

### ADR-002: Mobile-First Architecture  
- **Decision**: React Native Expo for cross-platform development
- **Rationale**: Single codebase, automotive environment optimization
- **Alternatives Considered**: Native iOS/Android, Progressive Web App
- **Trade-offs**: Platform limitations vs. development efficiency

### ADR-003: Real-time Communication
- **Decision**: WebSocket streaming for agent responses
- **Rationale**: Real-time user experience with tool activity visibility
- **Alternatives Considered**: HTTP polling, Server-Sent Events
- **Trade-offs**: Connection complexity vs. user experience quality

## Future Architecture Considerations

### Scalability Roadmap
- **Phase 1**: Support 1,000 concurrent users (current architecture)
- **Phase 2**: Scale to 10,000 concurrent users (microservices architecture)
- **Phase 3**: Multi-region deployment for global expansion

### Technology Evolution
- **AI Model Upgrades**: Support for newer Claude models and multi-modal capabilities
- **Edge Computing**: Local AI processing for improved latency
- **IoT Integration**: Direct vehicle integration beyond OBD2 dongles

## Architecture Validation

### Quality Attributes
- **Performance**: Meets <2s API response time requirements
- **Scalability**: Supports 1,000 concurrent users with auto-scaling
- **Reliability**: 99.5% uptime with automated failover
- **Security**: End-to-end encryption with GDPR/CCPA compliance
- **Maintainability**: Modular architecture with clear separation of concerns

### Architecture Testing Strategy
- **Load Testing**: Simulate 1,000 concurrent diagnostic sessions
- **Failover Testing**: Validate disaster recovery procedures
- **Security Testing**: Penetration testing and vulnerability assessment
- **Performance Testing**: Validate response time requirements under load

---

## Conclusion

This system architecture provides a comprehensive foundation for Dixon Smart Repair's AI-powered automotive diagnostic platform. The architecture leverages Strands Agents for intelligent conversation, React Native for mobile-first user experience, and AWS cloud services for scalable, secure infrastructure.

**Key Architecture Strengths**:
1. **AI-Driven Intelligence**: Strands agents provide natural conversation with tool orchestration
2. **Mobile Optimization**: React Native architecture optimized for automotive environments  
3. **Real-time Experience**: WebSocket streaming for immediate user feedback
4. **Scalable Infrastructure**: AWS-native services with auto-scaling capabilities
5. **Security Focus**: Comprehensive security framework with compliance support

**Next Steps**:
1. Component Design Specifications for detailed implementation guidance
2. API Specifications for mobile app integration
3. Security Architecture for comprehensive security framework
4. Integration Architecture for external system connectivity

---

**Architecture Status**: Complete and ready for component design
**Dependencies**: Ready for Development Implementation module
**Quality Level**: Production-ready with comprehensive coverage
