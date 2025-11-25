# Business Requirements Document - Dixon Smart Repair (Updated)

## Document Information
- **Version**: 2.0
- **Date**: January 2025
- **Author**: Product Team
- **Project Name**: Dixon Smart Repair - Agentic Diagnosis & Quote System
- **Business Sponsor**: [TO BE DETERMINED]
- **Document Status**: UPDATED - Enhanced Conversation Flow
- **Key Changes**: Vehicle information collection made optional with user choice

## Business Overview

### Business Objectives
1. **Reduce Initial Diagnostic Time**: Reduce mechanic time spent on initial customer diagnosis from 15+ minutes to under 5 minutes
2. **Improve Customer Experience**: Transform customers from feeling like "passengers" to "partners" in the repair process
3. **Increase Operational Efficiency**: Enable mechanics to focus on actual repair work rather than problem assessment
4. **Enhance Diagnostic Accuracy**: Provide structured diagnostic trail with AI-assisted analysis for better first-time fix rates
5. **Scale Service Delivery**: Create platform foundation for expanding AI-powered automotive services
6. **🆕 Maximize User Adoption**: Provide immediate value without barriers while enabling enhanced accuracy when desired

### Project Scope

#### In Scope
- **Natural Language Symptom Capture**: Voice and text-based problem description with AI clarification
- **🆕 Flexible Vehicle Identification**: Optional vehicle information with multiple collection methods (generic/basic/VIN)**
- **Vehicle Identification System**: VIN scanning and decoding with vehicle profile creation (when user chooses)
- **Physical-Digital Bridge**: Bluetooth dongle integration for live diagnostic data
- **Quote Generation System**: Preliminary repair quotes based on diagnosis, parts, and labor rates
- **Mechanic Integration**: Web dashboard for diagnostic review and quote adjustment
- **Customer Mobile Application**: iOS/Android app for customer interaction
- **AWS Strands Agents Implementation**: AI agent orchestration and conversation management

#### Out of Scope
- **Payment Processing**: Financial transactions (Phase 2)
- **Scheduling System**: Appointment booking and management (Phase 2)
- **Inventory Management**: Parts inventory tracking (Phase 2)
- **Customer Relationship Management**: Full CRM functionality (Phase 2)
- **Advanced Analytics**: Business intelligence and reporting (Phase 2)

## Functional Requirements

### Core Business Functions

#### Function 1: Enhanced Conversational Symptom Capture ⭐ **UPDATED**

1. **REQ-003: Conversational Symptom Input** ⭐ **ENHANCED**
   - **Description**: System must accept customer problem descriptions via voice or text and provide immediate helpful guidance without requiring vehicle identification
   - **Business Rules**: 
     - Provide immediate value with generic automotive guidance
     - Offer choice between guidance levels (generic/basic vehicle info/VIN)
     - Support common automotive terminology and colloquial descriptions
     - Never force vehicle identification as a prerequisite for help
   - **Acceptance Criteria**: 
     - Voice input processed with 90%+ accuracy
     - Text input supports multi-sentence descriptions
     - System responds within 2 seconds with helpful guidance
     - User can choose guidance level based on their preference and situation
     - Generic guidance is actionable and valuable on its own

2. **REQ-025: Vehicle Information Choice System** 🆕 **NEW**
   - **Description**: System must offer users clear choice between different levels of vehicle information sharing to balance convenience with diagnostic accuracy
   - **Business Rules**: 
     - Three distinct options: Generic, Basic Vehicle Info, VIN Scanning
     - Each option clearly explains benefits and trade-offs
     - Users can upgrade information level at any time during conversation
     - Diagnostic quality scales appropriately with information provided
   - **Acceptance Criteria**:
     - Choice interface loads within 2 seconds
     - Each option includes clear value proposition
     - Upgrade path available throughout conversation
     - No penalty for choosing lower information levels initially

3. **REQ-004: AI-Powered Clarification** ⭐ **ENHANCED**
   - **Description**: System must ask intelligent follow-up questions tailored to the user's chosen information level
   - **Business Rules**: 
     - Questions should be appropriate for chosen guidance level
     - Generic guidance uses general automotive questions
     - Vehicle-specific guidance uses make/model/year context
     - VIN-based guidance uses detailed vehicle specifications
   - **Acceptance Criteria**:
     - Maximum 5 clarifying questions per diagnostic session
     - Questions tailored to available vehicle information
     - Customer can skip questions or indicate "don't know"
     - Question complexity matches user's chosen information level

#### Function 2: Flexible Vehicle Identification & Profiling ⭐ **UPDATED**

4. **REQ-026: Basic Vehicle Information Collection** 🆕 **NEW**
   - **Description**: System must accept and utilize basic vehicle information (make, model, year) as middle-ground option between generic and VIN-based guidance
   - **Business Rules**: 
     - Simple form interface for make/model/year entry
     - Vehicle database lookup for common specifications
     - Upgrade path to VIN scanning for enhanced accuracy
     - Fallback to generic guidance if vehicle not found
   - **Acceptance Criteria**:
     - Vehicle lookup completes within 3 seconds
     - Covers 95% of common vehicle makes/models from 2000-present
     - Clear explanation of accuracy improvement over generic guidance
     - Option to upgrade to VIN scanning presented

5. **REQ-001: VIN Capture and Validation** ⭐ **UPDATED**
   - **Description**: System must capture VIN through photo scanning or manual entry when user chooses VIN-level guidance, with clear value proposition
   - **Business Rules**: 
     - VIN capture only triggered when user chooses VIN option
     - Must explain why VIN provides better results than basic vehicle info
     - VIN must be 17 characters, validated against check digit algorithm
     - Fallback to basic vehicle info if VIN capture fails
   - **Acceptance Criteria**: 
     - VIN photo scanning achieves 95%+ accuracy
     - Manual entry includes real-time validation
     - Invalid VINs display clear error messages with correction guidance
     - Clear explanation of VIN benefits over basic vehicle info

6. **REQ-002: Vehicle Profile Creation** ⭐ **UPDATED**
   - **Description**: System must create appropriate vehicle profiles based on information level provided (basic info or VIN)
   - **Business Rules**: 
     - Basic info creates general vehicle profile with common specifications
     - VIN decoding provides detailed specifications using NHTSA free API
     - Profile completeness clearly communicated to user
     - Upgrade options presented when applicable
   - **Acceptance Criteria**:
     - Basic vehicle profile created within 2 seconds of make/model/year entry
     - VIN profile created within 3 seconds of VIN validation
     - Profile includes appropriate level of detail for information provided
     - Clear indication of profile completeness and accuracy level

#### Function 3: Adaptive Diagnostic Analysis ⭐ **UPDATED**

7. **REQ-005: Probable Diagnosis Generation** ⭐ **ENHANCED**
   - **Description**: System must generate ranked list of probable issues with confidence percentages that reflect the quality of vehicle information provided
   - **Business Rules**: 
     - Generic guidance: Lower confidence, broader issue categories
     - Basic vehicle info: Medium confidence, vehicle-type specific issues
     - VIN-based: Higher confidence, vehicle-specific known issues
     - Minimum 3 probable causes, maximum 7, ranked by likelihood
   - **Acceptance Criteria**:
     - Diagnosis generated within 10 seconds of symptom capture completion
     - Confidence scores reflect information quality (generic: 40-70%, basic: 60-80%, VIN: 70-95%)
     - Diagnoses include brief explanation in customer-friendly language
     - Clear indication of how more vehicle info could improve accuracy

8. **REQ-006: Diagnostic Data Integration** ⭐ **ENHANCED**
   - **Description**: System must incorporate live OBD2 data when available to improve accuracy regardless of initial vehicle information level
   - **Business Rules**: 
     - OBD2 data enhances any level of initial vehicle information
     - Confidence scores increase significantly when OBD2 data available
     - Works with generic, basic, or VIN-based initial diagnosis
   - **Acceptance Criteria**:
     - OBD2 codes automatically interpreted and integrated into diagnosis
     - Confidence scores increase by minimum 20% when OBD2 data available
     - System handles absence of OBD2 data gracefully
     - Enhancement works regardless of initial vehicle information level

#### Function 4: Adaptive Quote Generation ⭐ **UPDATED**

9. **REQ-007: Preliminary Quote Calculation** ⭐ **ENHANCED**
   - **Description**: System must generate repair cost estimates with accuracy levels that reflect available vehicle information
   - **Business Rules**: 
     - Generic guidance: Broad cost ranges with disclaimers
     - Basic vehicle info: Vehicle-type specific pricing
     - VIN-based: Precise parts pricing and labor estimates
     - Quotes are preliminary and subject to mechanic review
   - **Acceptance Criteria**:
     - Quote includes parts cost, labor hours, and total estimate
     - Multiple options presented (OEM vs aftermarket parts) when vehicle info available
     - Cost range width reflects information quality (generic: ±50%, basic: ±30%, VIN: ±15%)
     - Clear disclaimer that quotes are estimates pending mechanic review

10. **REQ-008: Parts and Labor Rate Integration** ⭐ **ENHANCED**
    - **Description**: System must access appropriate pricing data based on vehicle information level provided
    - **Business Rules**: 
      - Generic: Average market pricing for common repairs
      - Basic vehicle info: Vehicle-category specific pricing
      - VIN-based: Exact parts pricing and vehicle-specific labor rates
      - Use real-time pricing APIs, fallback to cached data if APIs unavailable
    - **Acceptance Criteria**:
      - Pricing accuracy improves with better vehicle information
      - Parts pricing updated within 24 hours
      - Labor rates reflect local market conditions when possible
      - System handles API failures gracefully with cached data

#### Function 5: Enhanced Mechanic Integration ⭐ **UPDATED**

11. **REQ-011: Diagnostic Review Dashboard** ⭐ **ENHANCED**
    - **Description**: Mechanics must be able to review AI diagnosis and customer information, including the level of vehicle information provided
    - **Business Rules**: 
      - Dashboard clearly shows customer's information level (generic/basic/VIN)
      - Mechanics can request additional vehicle information from customer
      - Mechanics can modify diagnosis and add notes
      - All customer interactions and available data accessible in single view
    - **Acceptance Criteria**:
      - Complete diagnostic trail visible to mechanic
      - Vehicle information level clearly indicated
      - Mechanic can add/remove probable causes
      - Option to request more vehicle info from customer
      - All customer interactions and data accessible in single view

12. **REQ-012: Quote Review and Adjustment** ⭐ **ENHANCED**
    - **Description**: Mechanics must be able to review and modify preliminary quotes with understanding of underlying vehicle information quality
    - **Business Rules**: 
      - Quote accuracy level clearly indicated based on vehicle information
      - Mechanic can recommend customer provide more vehicle info for better accuracy
      - Mechanic approval required before final quote presentation to customer
      - Quote modification history tracked for audit purposes
    - **Acceptance Criteria**:
      - Mechanic can adjust labor hours, parts selection, and pricing
      - Information quality level clearly displayed
      - Option to request additional vehicle information from customer
      - Customer notified of quote changes with explanation

## Non-Functional Requirements

### Performance Requirements ⭐ **UPDATED**
- **Response Time**: 
  - API calls: <2 seconds for 95% of requests (AWS API Gateway standard)
  - Mobile app interactions: <3 seconds for user interface responses
  - AI diagnosis generation: <10 seconds for complex multi-symptom analysis
  - Vehicle information choice interface: <2 seconds to load options
  - Basic vehicle info lookup: <2 seconds for common vehicles
  - VIN validation and lookup: <3 seconds for complete process

### Scalability Requirements
- **Concurrent Users**: Support 1,000 simultaneous diagnostic sessions
- **Data Storage**: Handle 100,000 diagnostic sessions per month
- **API Rate Limits**: Respect NHTSA API limits (5,000 requests per hour)
- **Mobile Performance**: Maintain <3 second response times on 3G networks

### Reliability Requirements
- **System Availability**: 99.5% uptime during business hours (6 AM - 10 PM local time)
- **Data Integrity**: Zero data loss for completed diagnostic sessions
- **Graceful Degradation**: System continues to function with generic guidance if vehicle APIs fail
- **Error Recovery**: Automatic retry for failed API calls with exponential backoff

### Security Requirements
- **Data Encryption**: All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Privacy Protection**: Customer vehicle information stored securely with opt-out options
- **Access Control**: Role-based access for customers, mechanics, and administrators
- **Audit Trail**: Complete audit log of all diagnostic sessions and mechanic modifications

### Production Readiness Requirements ⭐ **NEW SECTION**
- **Audit Trails & Compliance**: 
  - Complete logging of all repair recommendations for liability protection
  - Immutable audit logs with timestamp, user, and decision rationale
  - Compliance with automotive service industry standards
  - Data retention policies for legal and quality assurance purposes
- **Rate Limiting & API Management**:
  - Intelligent throttling for MCP servers (Tavily, Serper) to prevent quota overages
  - Queue management for high-volume periods
  - Cost optimization through smart API usage patterns
  - Fallback strategies when API limits are reached
- **Caching Strategies**:
  - Parts pricing cache: 1-4 hour TTL for cost optimization
  - Labor rates cache: 24-48 hour TTL for regional accuracy
  - Repair procedures cache: 7-day TTL for consistency
  - Cache invalidation strategies for critical updates
- **Performance Monitoring**:
  - Real-time tracking of tool execution times and success rates
  - Error pattern analysis and alerting
  - User satisfaction metrics and feedback loops
  - System health dashboards for operational teams

### Usability Requirements ⭐ **ENHANCED**
- **Mobile-First Design**: Optimized for mobile devices with touch-friendly interfaces
- **Accessibility**: WCAG 2.1 AA compliance for users with disabilities
- **User Choice**: Clear options for different levels of information sharing
- **Progressive Enhancement**: Ability to upgrade information level without starting over
- **Immediate Value**: Helpful guidance available without any vehicle information
- **Clear Value Proposition**: Users understand benefits of providing more vehicle information

### Integration Requirements
- **NHTSA API**: Integration with free VIN decoding service
- **OBD2 Dongles**: Bluetooth integration for live diagnostic data
- **AWS Services**: Lambda, API Gateway, DynamoDB, S3 for core functionality
- **Mobile Platforms**: React Native for iOS and Android compatibility
- **Third-Party APIs**: Parts pricing and labor rate services (when available)

## Business Rules

### Vehicle Information Collection ⭐ **NEW SECTION**
1. **User Choice Priority**: Users must never be forced to provide vehicle information to receive help
2. **Progressive Enhancement**: Users can upgrade information level at any time during conversation
3. **Value Transparency**: Clear explanation of benefits for each information level
4. **Fallback Options**: System must work gracefully with any level of vehicle information
5. **Privacy Respect**: Users control what vehicle information they share and when

### Diagnostic Accuracy Scaling ⭐ **NEW SECTION**
1. **Information-Based Confidence**: Diagnostic confidence scales with vehicle information quality
2. **Honest Limitations**: System clearly communicates accuracy limitations of each guidance level
3. **Upgrade Recommendations**: Suggest more vehicle info when it would significantly improve accuracy
4. **No False Precision**: Don't claim higher accuracy than information level supports

### Quote Accuracy Standards ⭐ **NEW SECTION**
1. **Accuracy Ranges**: Quote accuracy ranges must reflect vehicle information quality
2. **Transparent Limitations**: Clear communication of quote accuracy based on available information
3. **Improvement Pathways**: Show how additional vehicle info would improve quote accuracy
4. **Mechanic Override**: Mechanics can always adjust quotes regardless of initial information level

## Success Metrics ⭐ **UPDATED**

### User Experience Metrics
- **Immediate Engagement**: >90% of users receive helpful guidance within 30 seconds
- **Information Level Distribution**: Track usage of generic vs basic vs VIN guidance
- **Upgrade Rate**: % of users who upgrade from generic to basic or VIN guidance
- **Completion Rate**: >85% of users complete diagnostic flow regardless of information level
- **User Satisfaction**: >4.0/5.0 rating across all guidance levels

### Diagnostic Accuracy Metrics
- **Generic Guidance**: >70% user satisfaction with generic automotive advice
- **Basic Vehicle Info**: >80% diagnostic accuracy for common vehicle types
- **VIN-Based Diagnosis**: >90% diagnostic accuracy for specific vehicles
- **Mechanic Agreement**: >85% mechanic agreement with AI diagnosis across all information levels

### Business Impact Metrics
- **Time Reduction**: Reduce initial diagnostic time by 60% (from 15 minutes to 6 minutes average)
- **Customer Satisfaction**: >4.2/5.0 rating for overall experience
- **Mechanic Efficiency**: 40% reduction in time spent on initial problem assessment
- **Conversion Rate**: >75% of diagnostic sessions result in service booking

### Technical Performance Metrics
- **Response Time**: <2 seconds for 95% of user interactions
- **System Availability**: >99.5% uptime during business hours
- **API Success Rate**: >99% success rate for vehicle information lookups
- **Mobile Performance**: <3 second load times on 3G networks

## Risk Assessment ⭐ **UPDATED**

### Technical Risks
- **NHTSA API Limitations**: Mitigated by fallback to basic vehicle info and cached data
- **Mobile Performance**: Mitigated by progressive loading and offline capabilities
- **VIN Scanning Accuracy**: Mitigated by manual entry options and basic vehicle info fallback

### Business Risks
- **User Adoption**: Mitigated by providing immediate value without barriers
- **Diagnostic Accuracy**: Mitigated by clear communication of limitations and mechanic oversight
- **Customer Expectations**: Mitigated by transparent communication of accuracy levels

### Operational Risks
- **Mechanic Training**: Mitigated by clear indication of customer information level
- **Quote Accuracy**: Mitigated by mechanic review and adjustment capabilities
- **System Complexity**: Mitigated by clear user flows and fallback options

## Compliance Requirements

### Privacy Regulations
- **GDPR Compliance**: Right to deletion, data portability, consent management
- **CCPA Compliance**: California privacy rights for vehicle information
- **Industry Standards**: Automotive data privacy best practices

### Accessibility Standards
- **WCAG 2.1 AA**: Web Content Accessibility Guidelines compliance
- **Mobile Accessibility**: Touch-friendly interfaces for users with disabilities
- **Voice Interface**: Support for users who prefer voice interaction

### Automotive Industry Standards
- **OBD2 Protocols**: Standard diagnostic port communication
- **VIN Standards**: ISO 3779 vehicle identification number format
- **Parts Identification**: Standard parts numbering and classification

---

## Key Changes Summary

### 🆕 **New Requirements (3)**
- **REQ-025**: Vehicle Information Choice System
- **REQ-026**: Basic Vehicle Information Collection  
- **New Business Rules**: Vehicle information collection, diagnostic accuracy scaling, quote accuracy standards

### ⭐ **Enhanced Requirements (8)**
- **REQ-003**: Conversational input without forced vehicle ID
- **REQ-001**: VIN capture as user choice with value proposition
- **REQ-002**: Adaptive vehicle profile creation
- **REQ-004**: Information-level appropriate clarification questions
- **REQ-005**: Confidence scaling with information quality
- **REQ-006**: OBD2 enhancement regardless of initial info level
- **REQ-007**: Adaptive quote accuracy
- **REQ-008**: Information-appropriate pricing data
- **REQ-011**: Mechanic dashboard with information level awareness
- **REQ-012**: Quote adjustment with information quality context

### 📈 **Business Impact**
- **Improved User Adoption**: No barriers to initial engagement
- **Maintained Accuracy**: High accuracy still available when users choose it
- **Enhanced Flexibility**: Works for all user preferences and situations
- **Better User Experience**: Respects user choice and provides immediate value
- **Scalable Approach**: Accommodates different user needs and technical capabilities

This updated requirements document reflects a more user-centric approach that provides immediate value while enabling enhanced accuracy when users choose to provide more information.
