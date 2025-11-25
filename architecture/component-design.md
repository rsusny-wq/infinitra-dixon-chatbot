---
artifact_id: ART-038
title: Component Design - Dixon Smart Repair
category: Architecture & Design
priority: mandatory
dependencies:
  requires:
    - ART-037: System Architecture (5-tool Strands architecture and MCP integration)
    - ART-019: Epics (component scope and boundaries)
    - ART-030: User Stories (detailed functional requirements)
  enhances:
    - ART-024: Database Design
    - ART-025: API Specifications
validation_criteria:
  - All 5 Strands agent tools have detailed design specifications
  - MCP integration components clearly defined with fallback strategies
  - Component interfaces support real-time automotive market intelligence
  - Production readiness components integrated for operational excellence
  - Component design supports automotive service workflow scalability
quality_gates:
  - Component design satisfies all 7 epic requirements
  - 5-tool interfaces enable complete automotive repair workflow
  - MCP integration components support graceful degradation
  - Production readiness components ensure audit, monitoring, caching, rate limiting
  - Component design enables effective automotive service testing and deployment
---

# Component Design - Dixon Smart Repair

## Purpose
Define detailed design specifications for all Dixon Smart Repair system components, focusing on the 5-tool Strands agent architecture, MCP integration layer, mobile applications, and production readiness infrastructure components.

## 1. Component Design Overview

### Design Philosophy
**Automotive Service-First Design**: Every component optimized for automotive repair workflow efficiency and reliability  
**Strands-Managed Simplicity**: Leverage Strands agent intelligence to eliminate custom orchestration complexity  
**Real-Time Intelligence**: Integrate live market data through MCP while maintaining graceful degradation  
**Production-Ready Operations**: Built-in audit, monitoring, caching, and cost control from the ground up

### Component Catalog
**Core Components**:
1. **Strands AI Agent** - Central orchestration with 5 specialized automotive tools
2. **MCP Integration Layer** - Real-time market intelligence with provider flexibility
3. **Mobile Applications** - Customer and mechanic React Native apps
4. **Backend Infrastructure** - AWS serverless services and data persistence
5. **Production Readiness Services** - Audit, monitoring, caching, and rate limiting

### Component Dependency Hierarchy
```
Mobile Apps → Strands AI Agent → 5 Core Tools → MCP Integration Layer
                ↓
Backend Infrastructure ← Production Readiness Services
```

## 2. Core Component: Strands AI Agent

### Component Identity
**Component Name**: Dixon Automotive Repair Agent  
**Component ID**: DARA-001  
**Purpose**: Orchestrate complete automotive repair workflow using 5 specialized tools with MCP-enhanced real-time intelligence  
**Owner**: AI/ML Engineering Team  
**Maintenance Responsibility**: Continuous improvement of automotive diagnostic accuracy and user experience

### Functional Design
**Core Functionality**:
- Natural language processing of automotive symptoms and customer descriptions
- Intelligent orchestration of 5 specialized automotive repair tools
- Real-time market intelligence integration through MCP providers
- Graceful degradation when external data sources are unavailable
- Transparent communication of data sources and confidence levels

**Business Logic Implementation**:
- Automotive symptom analysis with pattern recognition
- Vehicle-specific diagnosis based on make, model, year, and symptoms
- Parts identification with multi-tier options (OEM, aftermarket, performance, salvage)
- Regional labor rate calculation with market intelligence
- Complete cost breakdown with transparent pricing methodology

### Agent Configuration
```python
# Dixon Automotive Repair Agent Configuration
from strands import Agent, tool
from mcp import stdio_client, StdioServerParameters
from strands.tools.mcp import MCPClient

# MCP Integration Setup
mcp_client = MCPClient(lambda: stdio_client(
    StdioServerParameters(command="tavily-mcp-server", args=[])
))

agent = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    tools=[
        symptom_diagnosis_analyzer,
        parts_availability_lookup,
        labor_estimator,
        pricing_calculator,
        repair_instructions
    ] + mcp_web_search_tools,
    system_prompt="""You are Dixon, an expert automotive diagnostic assistant.
    
    Your mission is to bridge the communication gap between customers and mechanics
    through intelligent, transparent, and helpful automotive guidance.
    
    Core Capabilities:
    - Analyze symptoms and provide accurate automotive diagnosis
    - Find real-time parts availability and pricing across multiple suppliers
    - Estimate labor time and regional rates with market intelligence
    - Calculate transparent, complete repair cost breakdowns
    - Provide step-by-step repair instructions with safety considerations
    
    Always prioritize:
    - Safety first in all recommendations
    - Transparency about data sources and limitations
    - Clear communication appropriate for customer's technical level
    - Honest assessment of diagnostic confidence levels
    """
)
```

## 3. Individual Tool Specifications

### Tool 1: Symptom Diagnosis Analyzer

**Component Identity**:
- **Tool Name**: Symptom Diagnosis Analyzer
- **Tool ID**: SDA-001
- **Purpose**: Analyze customer-reported symptoms and provide comprehensive automotive diagnosis with likely parts identification
- **MCP Integration**: Yes - searches for recalls, TSBs, and known vehicle issues

**Functional Responsibilities**:
- Parse natural language symptom descriptions from customers
- Correlate symptoms with potential automotive system failures
- Search real-time databases for vehicle-specific recalls and technical service bulletins
- Generate diagnosis with confidence levels and supporting evidence
- Identify likely parts needed for repair with necessity rankings

**Interface Specification**:
```python
@tool
def symptom_diagnosis_analyzer(
    customer_description: str,
    vehicle_info: dict,
    symptoms: list[str]
) -> dict:
    """
    Analyze automotive symptoms and provide comprehensive diagnosis.
    
    Args:
        customer_description: Natural language problem description
        vehicle_info: {year, make, model, engine, mileage, vin?}
        symptoms: Categorized symptom list
        
    Returns:
        {
            "diagnosis": {
                "primary_issue": str,
                "confidence_level": float,  # 0.0-1.0
                "likely_causes": [
                    {
                        "cause": str,
                        "probability": float,
                        "evidence": [str]
                    }
                ],
                "data_source": "real-time" | "llm-knowledge",
                "search_results": [str] if real-time
            },
            "likely_parts": [
                {
                    "part_name": str,
                    "part_category": str,
                    "necessity": "required" | "likely" | "possible",
                    "confidence": float,
                    "rationale": str
                }
            ],
            "safety_concerns": [
                {
                    "concern": str,
                    "severity": "critical" | "high" | "medium" | "low",
                    "immediate_action": str
                }
            ],
            "next_steps": [str],
            "limitations": str if fallback_used
        }
    """
```

**MCP Integration Pattern**:
- **Primary Search**: Recent recalls and TSBs for specific vehicle
- **Secondary Search**: Common issues and solutions for symptoms
- **Fallback Strategy**: Use LLM automotive knowledge base
- **Error Handling**: Clear indication when real-time data unavailable

### Tool 2: Parts Availability Lookup

**Component Identity**:
- **Tool Name**: Parts Availability Lookup
- **Tool ID**: PAL-002
- **Purpose**: Comprehensive parts discovery with real-time availability, pricing, and supplier information across multiple tiers
- **MCP Integration**: Yes - searches multiple parts suppliers and pricing databases

**Functional Responsibilities**:
- Search real-time parts databases across multiple suppliers
- Provide multi-tier parts options (OEM, aftermarket, performance, salvage)
- Calculate shipping times and delivery options based on customer location
- Compare pricing across suppliers with quality and warranty information
- Track parts availability with stock level indicators

**Interface Specification**:
```python
@tool
def parts_availability_lookup(
    parts_list: list[dict],
    customer_location: str,
    preferences: dict
) -> dict:
    """
    Find comprehensive parts availability with real-time pricing.
    
    Args:
        parts_list: [{"part_name": str, "part_number": str?, "necessity": str}]
        customer_location: ZIP code or city/state for regional pricing
        preferences: {"budget": str, "quality": str, "urgency": str}
        
    Returns:
        {
            "parts_analysis": [
                {
                    "part_name": str,
                    "part_categories": {
                        "oem": {
                            "suppliers": [
                                {
                                    "supplier_name": str,
                                    "price": float,
                                    "availability": "in-stock" | "2-3 days" | "1-2 weeks",
                                    "shipping_cost": float,
                                    "warranty": str,
                                    "quality_rating": float
                                }
                            ],
                            "price_range": {"min": float, "max": float}
                        },
                        "aftermarket": {...},
                        "performance": {...},
                        "salvage": {...}
                    },
                    "recommendation": {
                        "tier": str,
                        "supplier": str,
                        "rationale": str
                    }
                }
            ],
            "total_cost_estimates": {
                "budget": float,
                "standard": float,
                "premium": float
            },
            "data_freshness": str,  # timestamp
            "data_source": "real-time" | "llm-knowledge",
            "limitations": str if fallback_used
        }
    """
```

### Tool 3: Labor Estimator

**Component Identity**:
- **Tool Name**: Labor Estimator
- **Tool ID**: LE-003
- **Purpose**: Estimate labor time and regional rates with real-time market intelligence
- **MCP Integration**: Yes - searches current regional labor rates and market conditions

**Functional Responsibilities**:
- Calculate labor time estimates based on repair complexity and vehicle type
- Search real-time regional labor rate databases
- Factor in seasonal variations and market demand
- Provide specialty repair premiums and complexity adjustments
- Compare dealership vs independent shop rates

**Interface Specification**:
```python
@tool
def labor_estimator(
    repair_tasks: list[dict],
    vehicle_info: dict,
    location: str,
    shop_type: str
) -> dict:
    """
    Estimate labor time and regional rates with market intelligence.
    
    Args:
        repair_tasks: [{"task": str, "complexity": str, "estimated_hours": float?}]
        vehicle_info: Vehicle specifications affecting labor time
        location: Geographic location for regional rate lookup
        shop_type: "dealership" | "independent" | "chain" | "mobile"
        
    Returns:
        {
            "labor_analysis": [
                {
                    "task": str,
                    "estimated_hours": float,
                    "complexity_factors": [str],
                    "hourly_rate": {
                        "base_rate": float,
                        "regional_adjustment": float,
                        "specialty_premium": float,
                        "final_rate": float
                    },
                    "total_labor_cost": float
                }
            ],
            "regional_data": {
                "location": str,
                "market_conditions": str,
                "rate_comparison": {
                    "dealership_avg": float,
                    "independent_avg": float,
                    "market_range": {"min": float, "max": float}
                },
                "data_source": "real-time" | "llm-knowledge",
                "last_updated": str
            },
            "total_labor_cost": float,
            "confidence_level": float,
            "factors_affecting_cost": [str],
            "limitations": str if fallback_used
        }
    """
```

### Tool 4: Pricing Calculator

**Component Identity**:
- **Tool Name**: Pricing Calculator
- **Tool ID**: PC-004
- **Purpose**: Calculate complete repair cost breakdown by orchestrating data from other tools
- **MCP Integration**: No - orchestrates data from other tools that use MCP

**Functional Responsibilities**:
- Combine parts costs from Parts Availability Lookup
- Integrate labor costs from Labor Estimator
- Apply shop overhead, markup, and tax calculations
- Generate multiple pricing options (budget, standard, premium)
- Provide transparent cost breakdown with line-item details

**Interface Specification**:
```python
@tool
def pricing_calculator(
    parts_data: dict,
    labor_data: dict,
    shop_parameters: dict
) -> dict:
    """
    Calculate complete repair cost breakdown.
    
    Args:
        parts_data: Output from parts_availability_lookup
        labor_data: Output from labor_estimator
        shop_parameters: {"overhead_rate": float, "markup": float, "tax_rate": float}
        
    Returns:
        {
            "cost_breakdown": {
                "parts_subtotal": float,
                "labor_subtotal": float,
                "shop_overhead": float,
                "markup": float,
                "subtotal": float,
                "tax": float,
                "total_cost": float
            },
            "pricing_options": [
                {
                    "option_name": "Budget" | "Standard" | "Premium",
                    "parts_tier": str,
                    "total_cost": float,
                    "parts_warranty": str,
                    "labor_warranty": str,
                    "estimated_timeline": str,
                    "value_proposition": str
                }
            ],
            "line_item_details": [
                {
                    "category": "parts" | "labor" | "overhead" | "tax",
                    "description": str,
                    "quantity": float,
                    "unit_cost": float,
                    "total_cost": float
                }
            ],
            "confidence_level": float,
            "data_sources": [str],
            "cost_comparison": {
                "market_average": float,
                "savings_vs_dealership": float,
                "value_rating": str
            }
        }
    """
```

### Tool 5: Repair Instructions

**Component Identity**:
- **Tool Name**: Repair Instructions
- **Tool ID**: RI-005
- **Purpose**: Provide step-by-step repair procedures with quality validation and safety checks
- **MCP Integration**: Yes - searches for latest repair procedures and manufacturer updates

**Functional Responsibilities**:
- Search for latest manufacturer repair procedures and updates
- Provide step-by-step repair instructions with safety considerations
- Include quality validation checkpoints and testing procedures
- Reference technical videos and troubleshooting guides
- Highlight special tools and safety equipment requirements

**Interface Specification**:
```python
@tool
def repair_instructions(
    diagnosis: dict,
    parts_selected: dict,
    vehicle_info: dict,
    mechanic_skill_level: str
) -> dict:
    """
    Provide comprehensive repair instructions with quality validation.
    
    Args:
        diagnosis: Output from symptom_diagnosis_analyzer
        parts_selected: Selected parts from parts_availability_lookup
        vehicle_info: Vehicle specifications for procedure customization
        mechanic_skill_level: "novice" | "intermediate" | "expert"
        
    Returns:
        {
            "repair_procedure": {
                "overview": str,
                "estimated_time": str,
                "difficulty_level": str,
                "special_considerations": [str]
            },
            "step_by_step_instructions": [
                {
                    "step_number": int,
                    "category": "preparation" | "removal" | "installation" | "testing",
                    "instruction": str,
                    "safety_notes": [str],
                    "tools_required": [str],
                    "estimated_time": str,
                    "quality_checkpoints": [str],
                    "common_mistakes": [str],
                    "reference_images": [str]?
                }
            ],
            "quality_validation": [
                {
                    "checkpoint": str,
                    "validation_method": str,
                    "expected_result": str,
                    "troubleshooting": [str]
                }
            ],
            "safety_requirements": {
                "ppe_required": [str],
                "environmental_hazards": [str],
                "emergency_procedures": [str]
            },
            "reference_materials": [
                {
                    "type": "video" | "manual" | "diagram" | "tsb",
                    "title": str,
                    "url": str?,
                    "relevance": str
                }
            ],
            "procedure_source": str,
            "last_updated": str,
            "data_source": "real-time" | "llm-knowledge",
            "limitations": str if fallback_used
        }
    """
```

## 4. MCP Integration Layer Components

### MCP Client Manager

**Component Identity**:
- **Component Name**: MCP Client Manager
- **Component ID**: MCM-001
- **Purpose**: Manage connections to multiple MCP providers with intelligent routing and fallback
- **Owner**: Integration Engineering Team

**Functional Design**:
- Maintain connections to multiple MCP providers (Tavily, Serper, Bing)
- Implement intelligent routing based on query type and provider capabilities
- Handle provider failover and load balancing
- Monitor provider performance and cost metrics
- Implement rate limiting and quota management

**Provider Configuration**:
```python
class MCPClientManager:
    def __init__(self):
        self.providers = {
            "tavily": MCPClient(lambda: stdio_client(
                StdioServerParameters(command="tavily-mcp-server", args=[])
            )),
            "serper": MCPClient(lambda: stdio_client(
                StdioServerParameters(command="serper-mcp-server", args=[])
            )),
            "bing": MCPClient(lambda: stdio_client(
                StdioServerParameters(command="bing-mcp-server", args=[])
            ))
        }
        self.primary_provider = "tavily"
        self.fallback_order = ["serper", "bing"]
```

### Search Query Router

**Component Identity**:
- **Component Name**: Search Query Router
- **Component ID**: SQR-002
- **Purpose**: Route automotive search queries to optimal MCP providers based on query type and provider capabilities
- **Owner**: Integration Engineering Team

**Routing Logic**:
- **Parts Pricing Queries**: Route to providers with best parts database coverage
- **Labor Rate Queries**: Route to providers with regional employment data
- **Technical Procedure Queries**: Route to providers with automotive technical content
- **Recall/TSB Queries**: Route to providers with government database access

## 5. Mobile Application Components

### Customer Mobile App

**Component Identity**:
- **Component Name**: Dixon Customer Mobile App
- **Component ID**: DCMA-001
- **Purpose**: Provide customers with intuitive automotive diagnostic interface and repair guidance
- **Technology**: React Native Expo with TypeScript
- **Owner**: Mobile Engineering Team

**Core Features**:
- Natural language symptom input with voice recognition
- Real-time chat interface with Strands agent
- Photo capture for visual symptom documentation
- VIN scanning with camera integration
- Repair cost estimates and approval workflow
- Service history and maintenance reminders

### Mechanic Mobile App

**Component Identity**:
- **Component Name**: Dixon Mechanic Mobile App
- **Component ID**: DMMA-002
- **Purpose**: Provide mechanics with diagnostic review, quote modification, and customer communication tools
- **Technology**: React Native Expo with TypeScript
- **Owner**: Mobile Engineering Team

**Core Features**:
- Diagnostic review dashboard with agent recommendations
- Quote modification and approval interface
- Customer communication and status updates
- Work order management and progress tracking
- Parts ordering integration with supplier systems

## 6. Production Readiness Components

### Audit Trail Service

**Component Identity**:
- **Component Name**: Automotive Repair Audit Trail Service
- **Component ID**: ARATS-001
- **Purpose**: Provide immutable audit logging for all repair recommendations and decisions
- **Technology**: DynamoDB with event sourcing pattern
- **Owner**: Platform Engineering Team

**Audit Data Structure**:
```python
{
    "audit_id": str,  # UUID
    "timestamp": str,  # ISO 8601
    "event_type": "diagnosis" | "parts_recommendation" | "cost_estimate" | "repair_instruction",
    "user_id": str,
    "session_id": str,
    "vehicle_info": dict,
    "inputs": dict,
    "outputs": dict,
    "agent_reasoning": str,
    "data_sources": [str],
    "confidence_levels": dict,
    "mechanic_review": dict?,
    "customer_approval": dict?,
    "liability_classification": str,
    "retention_period": str
}
```

### Performance Monitoring Service

**Component Identity**:
- **Component Name**: Automotive Service Performance Monitor
- **Component ID**: ASPM-002
- **Purpose**: Monitor system performance, tool execution times, and automotive service quality metrics
- **Technology**: AWS CloudWatch with custom metrics
- **Owner**: Platform Engineering Team

**Monitoring Metrics**:
- Tool execution times and success rates for each of the 5 tools
- MCP provider response times and error rates
- Customer satisfaction scores and diagnostic accuracy
- Mobile app performance and crash rates
- Business metrics: conversion rates, average repair values, customer retention

### Intelligent Caching Service

**Component Identity**:
- **Component Name**: Automotive Data Caching Service
- **Component ID**: ADCS-003
- **Purpose**: Implement multi-layer caching with automotive-specific TTL policies
- **Technology**: Redis Cluster with DynamoDB TTL
- **Owner**: Platform Engineering Team

**Caching Strategy**:
- **Parts Pricing Cache**: 1-4 hour TTL based on market volatility
- **Labor Rates Cache**: 24-48 hour TTL for regional accuracy
- **Repair Procedures Cache**: 7-day TTL for consistency
- **Vehicle Specifications Cache**: 30-day TTL for VIN decoding
- **Cache Invalidation**: Event-driven invalidation for critical updates

### Rate Limiting Service

**Component Identity**:
- **Component Name**: MCP Rate Limiting and Cost Control Service
- **Component ID**: MRLCCS-004
- **Purpose**: Manage MCP provider usage, implement intelligent throttling, and control API costs
- **Technology**: AWS API Gateway throttling with custom logic
- **Owner**: Platform Engineering Team

**Rate Limiting Logic**:
- **Provider-Specific Limits**: Different limits for Tavily, Serper, Bing based on pricing
- **Intelligent Queuing**: Queue non-urgent requests during high usage periods
- **Cost Monitoring**: Real-time cost tracking with budget alerts
- **Graceful Degradation**: Automatic fallback to LLM knowledge when limits approached

## Component Integration Patterns

### Error Handling Pattern
All MCP-integrated components follow consistent error handling:
```python
def mcp_with_fallback(search_function, fallback_function, inputs):
    try:
        result = search_function(inputs)
        result["data_source"] = "real-time"
        result["confidence"] = "high"
        return result
    except MCPException as e:
        logger.warning(f"MCP search failed: {e}, falling back to LLM knowledge")
        result = fallback_function(inputs)
        result["data_source"] = "llm-knowledge"
        result["confidence"] = "medium"
        result["limitation"] = "Based on training data, may not reflect current conditions"
        return result
```

### Transparency Pattern
All components provide clear data source indication:
```python
def add_transparency_metadata(result, data_source, confidence_level, limitations=None):
    result["metadata"] = {
        "data_source": data_source,
        "confidence_level": confidence_level,
        "timestamp": datetime.utcnow().isoformat(),
        "limitations": limitations
    }
    return result
```

## Quality Validation

### Component Testing Strategy
- **Unit Testing**: Individual tool testing with mocked MCP responses
- **Integration Testing**: End-to-end automotive workflow testing
- **Performance Testing**: Load testing with realistic automotive service patterns
- **Fallback Testing**: MCP failure scenario testing with graceful degradation validation

### Component Monitoring
- **Health Checks**: Continuous monitoring of all component availability
- **Performance Metrics**: Response time and success rate tracking
- **Business Metrics**: Automotive service quality and customer satisfaction
- **Cost Metrics**: MCP usage and cost tracking per component

This component design provides a comprehensive, production-ready foundation for the Dixon Smart Repair platform, with clear separation of concerns, robust error handling, and automotive service-optimized functionality.
