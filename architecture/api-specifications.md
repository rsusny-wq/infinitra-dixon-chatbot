---
artifact_id: ART-039
title: API Specifications - Dixon Smart Repair
category: Architecture & Design
priority: mandatory
dependencies:
  requires:
    - ART-038: Component Design (5-tool interfaces and MCP integration)
    - ART-037: System Architecture (Strands agent and mobile app architecture)
    - ART-030: User Stories (API functionality requirements)
  enhances:
    - ART-022: Integration Architecture
validation_criteria:
  - All API endpoints support 5-tool Strands agent functionality
  - WebSocket API enables real-time automotive diagnostic conversations
  - REST APIs support mobile app automotive service workflows
  - MCP integration APIs provide real-time market intelligence
  - Production readiness APIs support audit, monitoring, caching, rate limiting
quality_gates:
  - API specifications enable all automotive repair workflow integrations
  - API design supports automotive service scalability and performance requirements
  - API error handling provides appropriate automotive service user experience
  - API documentation enables effective automotive service development and testing
  - API security controls protect automotive customer data and service integrity
---

# API Specifications - Dixon Smart Repair

## Purpose
Define comprehensive API specifications for Dixon Smart Repair's AI-powered automotive diagnostic platform, including WebSocket APIs for real-time Strands agent conversations, REST APIs for mobile automotive service workflows, and production readiness APIs for operational excellence.

## 1. API Design Overview

### API Strategy
**Automotive Service-First Design**: All APIs optimized for automotive repair workflow efficiency and mobile usage patterns  
**Real-Time Intelligence**: WebSocket streaming for Strands agent conversations with MCP-enhanced responses  
**Mobile-Optimized**: REST APIs designed for React Native automotive service applications  
**Production-Ready**: Built-in audit logging, rate limiting, and monitoring for automotive service compliance

### API Architectural Style
**Primary Style**: Hybrid WebSocket + REST architecture  
**WebSocket**: Real-time Strands agent conversations with 5-tool orchestration  
**REST**: Transactional operations for automotive service management  
**Authentication**: JWT-based with automotive service-specific claims  
**Versioning**: URL-based versioning with backward compatibility for automotive service continuity

### API Scope
- **Strands Agent WebSocket API**: Real-time automotive diagnostic conversations
- **Mobile App REST APIs**: Customer and mechanic automotive service workflows
- **MCP Integration APIs**: Real-time automotive market intelligence
- **Production Readiness APIs**: Audit, monitoring, caching, and rate limiting
- **Administrative APIs**: System management and automotive service analytics

## 2. Strands Agent WebSocket API

### Connection Establishment

**Endpoint**: `wss://api.dixonsmartrepair.com/v1/agent/chat`  
**Protocol**: WebSocket with Strands agent streaming  
**Authentication**: JWT token with automotive service claims  
**Purpose**: Enable real-time conversations with 5-tool automotive repair agent

```typescript
// WebSocket Connection for Automotive Service
interface AutomotiveWebSocketConnection {
  url: "wss://api.dixonsmartrepair.com/v1/agent/chat";
  protocols: ["dixon-automotive-v1"];
  authentication: {
    method: "query_parameter";
    parameter: "token";
    format: "JWT with automotive service claims";
  };
  automotive_context: {
    user_type: "customer" | "mechanic";
    shop_id?: string;
    vehicle_context?: VehicleProfile;
  };
}

// Connection Example
const websocket = new WebSocket(
  `wss://api.dixonsmartrepair.com/v1/agent/chat?token=${jwtToken}&user_type=customer`,
  ["dixon-automotive-v1"]
);
```

### Message Protocol for 5-Tool Architecture

**Inbound Messages (Client to Agent)**:
```typescript
interface AutomotiveAgentRequest {
  type: "symptom_description" | "follow_up_question" | "approval_request" | "system_command";
  message_id: string;
  session_id: string;
  user_id: string;
  content: string;
  automotive_context: {
    vehicle_profile?: {
      year?: number;
      make?: string;
      model?: string;
      engine?: string;
      mileage?: number;
      vin?: string;
    };
    symptom_category?: "engine" | "brakes" | "transmission" | "electrical" | "suspension" | "other";
    urgency_level?: "emergency" | "urgent" | "standard" | "maintenance";
    location?: {
      zip_code: string;
      city: string;
      state: string;
    };
    preferences?: {
      budget_range?: "budget" | "standard" | "premium";
      parts_preference?: "oem" | "aftermarket" | "performance" | "any";
      shop_type?: "dealership" | "independent" | "chain" | "mobile";
    };
  };
  mcp_preferences?: {
    enable_real_time_search: boolean;
    preferred_providers?: ("tavily" | "serper" | "bing")[];
    cost_limit?: number;
  };
  timestamp: string;
}
```

**Outbound Messages (Agent to Client)**:
```typescript
interface AutomotiveAgentResponse {
  type: "agent_response" | "tool_activity" | "diagnosis_result" | "cost_estimate" | "error" | "system_notification";
  message_id: string;
  session_id: string;
  conversation_id: string;
  data: any;
  automotive_metadata: {
    diagnostic_confidence?: number;
    data_sources: ("real-time" | "llm-knowledge")[];
    tools_used: ("symptom_diagnosis_analyzer" | "parts_availability_lookup" | "labor_estimator" | "pricing_calculator" | "repair_instructions")[];
    cost_estimate?: {
      parts_cost_range: {min: number, max: number};
      labor_cost_range: {min: number, max: number};
      total_cost_range: {min: number, max: number};
    };
    safety_level?: "critical" | "high" | "medium" | "low";
  };
  timestamp: string;
}
```

### 5-Tool Activity Streaming

**Tool Execution Events**:
```typescript
interface ToolActivityEvent {
  type: "tool_start" | "tool_progress" | "tool_complete" | "tool_error";
  tool_name: "symptom_diagnosis_analyzer" | "parts_availability_lookup" | "labor_estimator" | "pricing_calculator" | "repair_instructions";
  tool_id: string;
  session_id: string;
  data?: {
    // Tool-specific progress or result data
    progress_percentage?: number;
    intermediate_results?: any;
    mcp_activity?: {
      provider: "tavily" | "serper" | "bing";
      search_query: string;
      status: "searching" | "complete" | "failed";
      results_count?: number;
    };
    fallback_triggered?: boolean;
    error_message?: string;
  };
  automotive_context: {
    vehicle_info?: VehicleProfile;
    diagnostic_stage: "symptom_analysis" | "parts_lookup" | "cost_calculation" | "instruction_generation";
  };
  timestamp: string;
}
```

### WebSocket Error Handling

**Error Response Format**:
```typescript
interface AutomotiveWebSocketError {
  type: "error";
  error_code: string;
  error_message: string;
  error_category: "authentication" | "rate_limit" | "tool_failure" | "mcp_failure" | "system_error";
  automotive_context?: {
    affected_tools?: string[];
    fallback_available?: boolean;
    user_action_required?: string;
  };
  retry_after?: number;
  timestamp: string;
}

// Common Error Codes
const AUTOMOTIVE_ERROR_CODES = {
  "AUTH_INVALID": "Invalid or expired authentication token",
  "RATE_LIMIT_EXCEEDED": "Too many requests, please wait before retrying",
  "TOOL_UNAVAILABLE": "Automotive diagnostic tool temporarily unavailable",
  "MCP_PROVIDER_DOWN": "Real-time data provider unavailable, using cached data",
  "VEHICLE_DATA_INVALID": "Invalid vehicle information provided",
  "DIAGNOSTIC_TIMEOUT": "Diagnostic analysis timed out, please retry",
  "COST_CALCULATION_FAILED": "Unable to calculate repair costs at this time"
};
```

## 3. Mobile App REST APIs

### Customer Mobile App APIs

**Base URL**: `https://api.dixonsmartrepair.com/v1/customer`

#### Vehicle Profile Management

**Create/Update Vehicle Profile**:
```http
POST /vehicles
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "year": 2020,
  "make": "Toyota",
  "model": "Camry",
  "engine": "2.5L 4-Cylinder",
  "mileage": 45000,
  "vin": "1HGBH41JXMN109186",
  "nickname": "My Camry",
  "primary_driver": true
}

Response (201 Created):
{
  "vehicle_id": "uuid",
  "profile": {
    "year": 2020,
    "make": "Toyota",
    "model": "Camry",
    "engine": "2.5L 4-Cylinder",
    "mileage": 45000,
    "vin": "1HGBH41JXMN109186",
    "nickname": "My Camry",
    "primary_driver": true,
    "decoded_vin_data": {
      "manufacturer": "Honda",
      "plant": "Marysville, OH",
      "model_year": 2020,
      "safety_ratings": {...}
    },
    "maintenance_schedule": [...],
    "recall_status": {...}
  },
  "created_at": "2025-01-14T14:00:00Z",
  "updated_at": "2025-01-14T14:00:00Z"
}
```

#### Diagnostic Session Management

**Start Diagnostic Session**:
```http
POST /diagnostic-sessions
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "vehicle_id": "uuid",
  "initial_symptoms": "Car makes grinding noise when braking",
  "urgency_level": "urgent",
  "location": {
    "zip_code": "98101",
    "city": "Seattle",
    "state": "WA"
  },
  "preferences": {
    "budget_range": "standard",
    "parts_preference": "oem",
    "shop_type": "independent"
  }
}

Response (201 Created):
{
  "session_id": "uuid",
  "websocket_url": "wss://api.dixonsmartrepair.com/v1/agent/chat",
  "session_token": "jwt_token_for_websocket",
  "estimated_duration": "5-10 minutes",
  "agent_introduction": "Hi! I'm Dixon, your automotive diagnostic assistant. I'll help you understand what might be causing that grinding noise when braking...",
  "created_at": "2025-01-14T14:00:00Z"
}
```

#### Service History

**Get Service History**:
```http
GET /vehicles/{vehicle_id}/service-history
Authorization: Bearer {jwt_token}

Response (200 OK):
{
  "vehicle_id": "uuid",
  "service_records": [
    {
      "service_id": "uuid",
      "date": "2024-12-15T10:00:00Z",
      "shop_name": "Mike's Auto Repair",
      "service_type": "diagnostic",
      "description": "Brake system diagnosis and pad replacement",
      "parts_used": [
        {
          "part_name": "Brake Pads - Front",
          "part_number": "BP-1234",
          "quantity": 1,
          "cost": 89.99
        }
      ],
      "labor_hours": 2.5,
      "labor_cost": 187.50,
      "total_cost": 277.49,
      "warranty": "12 months / 12,000 miles",
      "diagnostic_accuracy": 0.95,
      "customer_satisfaction": 4.8
    }
  ],
  "maintenance_reminders": [
    {
      "reminder_id": "uuid",
      "service_type": "oil_change",
      "due_date": "2025-02-15",
      "due_mileage": 48000,
      "current_mileage": 45000,
      "priority": "medium",
      "estimated_cost": 45.00
    }
  ]
}
```

### Mechanic Mobile App APIs

**Base URL**: `https://api.dixonsmartrepair.com/v1/mechanic`

#### Diagnostic Review

**Get Pending Diagnostics**:
```http
GET /diagnostics/pending
Authorization: Bearer {jwt_token}
X-Shop-ID: {shop_id}

Response (200 OK):
{
  "pending_diagnostics": [
    {
      "diagnostic_id": "uuid",
      "customer_name": "John Smith",
      "vehicle_info": {
        "year": 2020,
        "make": "Toyota",
        "model": "Camry",
        "vin": "1HGBH41JXMN109186"
      },
      "symptoms": "Grinding noise when braking",
      "agent_diagnosis": {
        "primary_issue": "Worn brake pads",
        "confidence_level": 0.92,
        "likely_parts": [
          {
            "part_name": "Brake Pads - Front",
            "necessity": "required",
            "confidence": 0.95
          }
        ],
        "estimated_cost": {
          "parts": 89.99,
          "labor": 187.50,
          "total": 277.49
        }
      },
      "created_at": "2025-01-14T14:00:00Z",
      "urgency_level": "urgent"
    }
  ]
}
```

**Review and Modify Diagnostic**:
```http
PUT /diagnostics/{diagnostic_id}/review
Authorization: Bearer {jwt_token}
X-Shop-ID: {shop_id}
Content-Type: application/json

{
  "mechanic_review": {
    "diagnosis_approved": true,
    "modifications": [
      {
        "field": "parts_list",
        "original_value": "Brake Pads - Front",
        "modified_value": "Brake Pads - Front (Premium)",
        "reason": "Customer requested premium parts for better longevity"
      }
    ],
    "additional_recommendations": [
      "Brake fluid flush recommended due to dark color"
    ],
    "final_cost_estimate": {
      "parts": 129.99,
      "labor": 187.50,
      "additional_services": 45.00,
      "total": 362.49
    },
    "estimated_completion_time": "2 hours",
    "warranty_offered": "12 months / 12,000 miles"
  },
  "mechanic_notes": "Confirmed diagnosis through visual inspection. Brake pads at 2mm thickness. Rotors in good condition.",
  "photos": [
    {
      "photo_id": "uuid",
      "description": "Worn brake pad thickness measurement",
      "url": "https://storage.dixonsmartrepair.com/photos/brake-pad-measurement.jpg"
    }
  ]
}

Response (200 OK):
{
  "diagnostic_id": "uuid",
  "review_status": "approved_with_modifications",
  "customer_notification_sent": true,
  "updated_at": "2025-01-14T14:30:00Z"
}
```

## 4. MCP Integration APIs

### MCP Provider Management

**Base URL**: `https://api.dixonsmartrepair.com/v1/mcp`

#### Provider Status and Health

**Get MCP Provider Status**:
```http
GET /providers/status
Authorization: Bearer {jwt_token}
X-Admin-Role: required

Response (200 OK):
{
  "providers": [
    {
      "provider_name": "tavily",
      "status": "healthy",
      "response_time_avg": 1.2,
      "success_rate": 0.98,
      "requests_today": 1247,
      "cost_today": 12.47,
      "quota_remaining": 8753,
      "last_health_check": "2025-01-14T14:00:00Z"
    },
    {
      "provider_name": "serper",
      "status": "degraded",
      "response_time_avg": 3.1,
      "success_rate": 0.85,
      "requests_today": 234,
      "cost_today": 2.34,
      "quota_remaining": 9766,
      "last_health_check": "2025-01-14T14:00:00Z",
      "issues": ["High response times detected"]
    }
  ],
  "overall_health": "healthy",
  "fallback_active": false
}
```

#### Search Query Analytics

**Get Search Analytics**:
```http
GET /analytics/searches
Authorization: Bearer {jwt_token}
X-Admin-Role: required
Query Parameters:
  - start_date: 2025-01-01
  - end_date: 2025-01-14
  - tool_filter: parts_availability_lookup

Response (200 OK):
{
  "analytics_period": {
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-01-14T23:59:59Z"
  },
  "search_metrics": {
    "total_searches": 5432,
    "successful_searches": 5201,
    "failed_searches": 231,
    "fallback_triggered": 187,
    "average_response_time": 1.8,
    "total_cost": 54.32
  },
  "tool_breakdown": [
    {
      "tool_name": "parts_availability_lookup",
      "searches": 2156,
      "success_rate": 0.96,
      "avg_response_time": 2.1,
      "cost": 21.56
    },
    {
      "tool_name": "symptom_diagnosis_analyzer",
      "searches": 1876,
      "success_rate": 0.98,
      "avg_response_time": 1.4,
      "cost": 18.76
    }
  ],
  "provider_performance": [
    {
      "provider": "tavily",
      "usage_percentage": 65,
      "success_rate": 0.98,
      "avg_cost_per_query": 0.01
    }
  ]
}
```

## 5. Production Readiness APIs

### Audit Trail APIs

**Base URL**: `https://api.dixonsmartrepair.com/v1/audit`

#### Retrieve Audit Logs

**Get Diagnostic Audit Trail**:
```http
GET /diagnostics/{diagnostic_id}/audit-trail
Authorization: Bearer {jwt_token}
X-Admin-Role: required

Response (200 OK):
{
  "diagnostic_id": "uuid",
  "audit_trail": [
    {
      "audit_id": "uuid",
      "timestamp": "2025-01-14T14:00:00Z",
      "event_type": "diagnosis_generated",
      "user_id": "customer_uuid",
      "session_id": "session_uuid",
      "tool_used": "symptom_diagnosis_analyzer",
      "inputs": {
        "customer_description": "Grinding noise when braking",
        "vehicle_info": {...}
      },
      "outputs": {
        "diagnosis": "Worn brake pads",
        "confidence_level": 0.92
      },
      "data_sources": ["real-time", "llm-knowledge"],
      "mcp_providers_used": ["tavily"],
      "liability_classification": "standard_diagnostic"
    },
    {
      "audit_id": "uuid",
      "timestamp": "2025-01-14T14:30:00Z",
      "event_type": "mechanic_review",
      "user_id": "mechanic_uuid",
      "mechanic_modifications": {
        "diagnosis_approved": true,
        "cost_adjustments": {...}
      },
      "liability_classification": "mechanic_approved"
    }
  ],
  "retention_period": "7_years",
  "compliance_status": "compliant"
}
```

### Performance Monitoring APIs

**Base URL**: `https://api.dixonsmartrepair.com/v1/monitoring`

#### System Health Dashboard

**Get System Health Metrics**:
```http
GET /health/dashboard
Authorization: Bearer {jwt_token}
X-Admin-Role: required

Response (200 OK):
{
  "system_health": {
    "overall_status": "healthy",
    "last_updated": "2025-01-14T14:00:00Z"
  },
  "tool_performance": [
    {
      "tool_name": "symptom_diagnosis_analyzer",
      "avg_execution_time": 2.1,
      "success_rate": 0.98,
      "requests_last_hour": 156,
      "error_rate": 0.02
    }
  ],
  "mcp_performance": {
    "tavily": {
      "status": "healthy",
      "avg_response_time": 1.2,
      "success_rate": 0.98
    }
  },
  "mobile_app_metrics": {
    "customer_app": {
      "active_sessions": 234,
      "crash_rate": 0.001,
      "avg_session_duration": "8.5 minutes"
    },
    "mechanic_app": {
      "active_sessions": 45,
      "crash_rate": 0.002,
      "avg_session_duration": "12.3 minutes"
    }
  },
  "business_metrics": {
    "diagnostics_completed_today": 187,
    "customer_satisfaction_avg": 4.6,
    "diagnostic_accuracy_rate": 0.94
  }
}
```

### Caching Management APIs

**Base URL**: `https://api.dixonsmartrepair.com/v1/cache`

#### Cache Status and Management

**Get Cache Performance**:
```http
GET /performance
Authorization: Bearer {jwt_token}
X-Admin-Role: required

Response (200 OK):
{
  "cache_layers": [
    {
      "layer": "parts_pricing",
      "hit_rate": 0.78,
      "miss_rate": 0.22,
      "avg_ttl": "2.5 hours",
      "entries_count": 15432,
      "memory_usage": "245 MB",
      "cost_savings": "$127.45 today"
    },
    {
      "layer": "labor_rates",
      "hit_rate": 0.85,
      "miss_rate": 0.15,
      "avg_ttl": "36 hours",
      "entries_count": 8765,
      "memory_usage": "89 MB",
      "cost_savings": "$89.23 today"
    }
  ],
  "total_cost_savings": "$216.68 today",
  "cache_efficiency": 0.81
}
```

### Rate Limiting APIs

**Base URL**: `https://api.dixonsmartrepair.com/v1/rate-limiting`

#### Rate Limit Status

**Get Current Rate Limit Status**:
```http
GET /status
Authorization: Bearer {jwt_token}
X-Admin-Role: required

Response (200 OK):
{
  "rate_limits": [
    {
      "provider": "tavily",
      "current_usage": 1247,
      "daily_limit": 10000,
      "usage_percentage": 12.47,
      "reset_time": "2025-01-15T00:00:00Z",
      "status": "healthy"
    },
    {
      "provider": "serper",
      "current_usage": 234,
      "daily_limit": 5000,
      "usage_percentage": 4.68,
      "reset_time": "2025-01-15T00:00:00Z",
      "status": "healthy"
    }
  ],
  "intelligent_throttling": {
    "active": false,
    "queue_length": 0,
    "estimated_wait_time": "0 seconds"
  },
  "cost_controls": {
    "daily_budget": 100.00,
    "current_spend": 14.81,
    "budget_remaining": 85.19,
    "projected_daily_spend": 18.50
  }
}
```

## 6. API Security and Authentication

### JWT Token Structure

**Automotive Service JWT Claims**:
```json
{
  "sub": "user_uuid",
  "iat": 1705244400,
  "exp": 1705330800,
  "iss": "dixon-smart-repair",
  "aud": "dixon-api",
  "user_type": "customer" | "mechanic" | "admin",
  "shop_id": "shop_uuid",
  "permissions": [
    "diagnostic:create",
    "vehicle:manage",
    "service:view"
  ],
  "automotive_context": {
    "primary_vehicle_id": "vehicle_uuid",
    "preferred_shop_type": "independent",
    "service_history_access": true
  }
}
```

### API Rate Limiting

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705244400
X-RateLimit-Retry-After: 60
```

**Rate Limit Tiers**:
- **Customer APIs**: 100 requests per minute
- **Mechanic APIs**: 200 requests per minute
- **Admin APIs**: 500 requests per minute
- **WebSocket Connections**: 10 concurrent per user

## 7. API Error Handling

### Standard Error Response Format

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    automotive_context?: {
      affected_services?: string[];
      user_action?: string;
      fallback_available?: boolean;
    };
    timestamp: string;
    request_id: string;
  };
}
```

### Common Error Codes

```typescript
const AUTOMOTIVE_API_ERRORS = {
  // Authentication & Authorization
  "AUTH_TOKEN_INVALID": "Authentication token is invalid or expired",
  "AUTH_INSUFFICIENT_PERMISSIONS": "Insufficient permissions for this automotive service operation",
  
  // Vehicle & Diagnostic Errors
  "VEHICLE_NOT_FOUND": "Vehicle profile not found",
  "VIN_INVALID": "Invalid VIN format or checksum",
  "DIAGNOSTIC_SESSION_EXPIRED": "Diagnostic session has expired, please start a new session",
  
  // Tool & MCP Errors
  "TOOL_EXECUTION_FAILED": "Automotive diagnostic tool execution failed",
  "MCP_PROVIDER_UNAVAILABLE": "Real-time data provider unavailable, using cached data",
  "PARTS_LOOKUP_FAILED": "Unable to retrieve current parts pricing",
  
  // Rate Limiting & Quota
  "RATE_LIMIT_EXCEEDED": "API rate limit exceeded for automotive service requests",
  "MCP_QUOTA_EXCEEDED": "Real-time search quota exceeded, using cached data",
  
  // Business Logic Errors
  "COST_CALCULATION_FAILED": "Unable to calculate repair costs",
  "SHOP_NOT_AVAILABLE": "Selected automotive shop is not available",
  "SERVICE_APPOINTMENT_CONFLICT": "Requested service time conflicts with existing appointment"
};
```

This comprehensive API specification provides a complete foundation for the Dixon Smart Repair platform, enabling seamless integration between the 5-tool Strands agent, mobile applications, MCP providers, and production readiness services while maintaining automotive service-specific optimizations and error handling.
