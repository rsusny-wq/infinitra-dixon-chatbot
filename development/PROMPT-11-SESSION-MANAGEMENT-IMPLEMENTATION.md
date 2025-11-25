# PROMPT 11: Comprehensive User Session Management System Implementation

## 🎯 **Objective**
Implement a comprehensive user session management system that provides personalized, context-aware automotive diagnostics with proper data lifecycle management for both anonymous and logged-in users.

## 🔧 **Implementation Guidelines**

### **🎯 MCP Best Practices Requirement**
For each implementation phase, **use MCP best practices where required to understand best practices**:
- Leverage MCP servers for real-time information and current best practices
- Use appropriate MCP tools to validate implementation approaches
- Consult MCP resources for framework-specific guidance (React Native, Strands, GraphQL)
- Apply MCP-sourced patterns for accessibility, performance, and security
- Research current industry standards for session management and data privacy

### **🔍 Code Inspection Requirement**
For each implementation phase, **inspect existing code before making changes and ask any clarifying questions before proceeding or making changes**:
- Examine current codebase structure and patterns
- Identify existing components that can be extended or reused
- Understand current authentication flows and data management
- Analyze existing UI patterns and styling approaches
- Ask clarifying questions about business logic, user flows, and technical constraints
- Validate assumptions about current system behavior before implementing changes

### **🛡️ Functionality Preservation Requirement**
For each implementation phase, **ensure existing working functionality is not broken**:
- Preserve all current user experiences (anonymous and authenticated)
- Maintain existing diagnostic accuracy and tool integration
- Keep current performance levels and response times
- Preserve existing data integrity and security measures
- Maintain existing UI patterns and user workflows

### **🧪 Testing Requirements**
For each implementation phase, **test via AWS CLI for functionality and Lambda changes**:
```bash
# Test existing functionality continues to work
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-existing","message":"Test existing functionality","userId":"test-user"}}' | base64)" --region us-west-2 test-existing.json && cat test-existing.json

# Test new functionality works as expected
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-new","message":"Test new functionality","userId":"test-user"}}' | base64)" --region us-west-2 test-new.json && cat test-new.json

# Test edge cases and error handling
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-edge","message":"","userId":"test-user"}}' | base64)" --region us-west-2 test-edge.json && cat test-edge.json

# Test integration with existing tools
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-tools","message":"My brakes are squealing","userId":"test-user"}}' | base64)" --region us-west-2 test-tools.json && cat test-tools.json
```

### **🌐 User Web Testing Requirements**
After AWS CLI tests pass, **ask user to test via web**:
- Test existing user flows remain functional and responsive
- Verify new features work correctly in web interface at https://d37f64klhjdi5b.cloudfront.net
- Test mobile responsiveness and accessibility compliance
- Validate cross-browser compatibility and performance
- Confirm user experience improvements meet acceptance criteria

### **📝 Documentation Updates Required**
After implementing each phase, **update documentation**:
- **/Users/saidachanda/development/dixon-smart-repair/development/current-state.md**:
  - Add new feature documentation and technical implementation details
  - Component documentation and architectural changes
  - User experience improvements and system capabilities
  - Integration points and dependency updates
- **/Users/saidachanda/development/dixon-smart-repair/session-context.md**:
  - Implementation timeline and technical decisions
  - User story completion status and acceptance criteria met
  - Architectural changes and new dependencies
  - Performance metrics and user experience improvements

### **🎯 Quality Gates**
Every implementation phase must meet:
- **Mobile Responsiveness**: All components work on mobile devices
- **Accessibility Compliance**: WCAG 2.1 AA standards met
- **Performance**: <3 second load times for all operations
- **Error Handling**: Graceful degradation and user-friendly error messages
- **Testing Coverage**: 80%+ code coverage for new functionality
- **Documentation**: Complete API and component documentation

## 📋 **Current System Analysis**

### **Current Issues**
- VIN data persists inappropriately across sessions
- Diagnostic context not respected (Quick Help shows vehicle-specific info)
- No distinction between anonymous and logged-in user data management
- False VIN processing claims when no VIN provided
- No session management UI for conversation history

### **Current Architecture**
```
Frontend: Single chat interface
Backend: VIN data stored globally per user
Data: 24-hour expiry regardless of user type
```

### **Target Architecture**
```
Anonymous Users: Temporary session data → Cleanup on window close/inactivity (1 hour TTL)
Logged-in Users: Persistent vehicle library (max 10 vehicles) → Chat-specific context → Session management UI
```

## 🎯 **Implementation Decisions (Clarified)**

Based on detailed analysis and clarifying questions, the following decisions have been made:

### **1. Data Migration Strategy**
**Decision**: Add new fields while keeping all existing fields intact (Option A)
- **Rationale**: Zero downtime, backward compatibility, production stability
- **Approach**: Enhance existing tables progressively without breaking current functionality
- **Update**: Since minimal existing data, tables will be recreated with optimal schema design

### **2. Anonymous User Session Duration**
**Decision**: 1 hour (3600 seconds) TTL for anonymous users
- **Rationale**: Balances automotive diagnostic session needs with storage costs
- **Implementation**: TTL field in DynamoDB for anonymous user records

### **3. User Vehicle Storage Scope**
**Decision**: Maximum 10 vehicles per authenticated user
- **Rationale**: Covers real-world scenarios while maintaining UI manageability and cost control
- **Implementation**: Validation logic in vehicle addition APIs

### **4. VIN Context Integration**
**Decision**: Fully merge VIN functionality into Strands session management (Option A)
- **Rationale**: Strands already provides agent state persistence via S3SessionManager
- **Elimination**: Remove separate VINContextManager class entirely
- **Implementation**: VIN data stored in `agent.state` and automatically persisted to S3

### **5. Session Title Generation**
**Decision**: Vehicle info + problem type with user editing capability (Option C + A)
- **Format**: "2024 Honda Civic - Brake Issues" (auto-generated)
- **Capability**: Users can rename sessions for better organization
- **Fallback**: "Chat Session - Jan 22, 2025" when vehicle info unavailable

### **6. Table Schema Modifications**
**Decision**: Add new fields while preserving existing structure (Option A)
- **Approach**: Enhance existing tables with session management fields
- **Safety**: Maintain backward compatibility during transition
- **Update**: Clean table recreation since minimal existing data

### **7. Anonymous vs Authenticated Data Separation**
**Decision**: Use separate table partitions/prefixes (Option B)
- **Anonymous**: `userId: 'anon-session-12345-timestamp'`
- **Authenticated**: `userId: 'user-cognitoUserId'`
- **Benefits**: Clean TTL management, efficient queries, clear data boundaries

### **8. Strands Best Practices Integration**
**Key Findings from Analysis**:
- **Agent State**: Use `agent.state.get/set()` for all persistent data including VIN
- **Session Persistence**: S3SessionManager automatically handles state persistence
- **No Custom Context**: Eliminate separate VIN context system - use Strands built-in state
- **Tool Access**: Tools access VIN data directly via `agent.state.get("vin_data")`
- **Automatic Persistence**: All agent state automatically saved to existing S3 bucket

## 🎯 **Key Implementation Changes Summary**

### **Major Architectural Decisions**

#### **1. Strands-Native VIN Management**
- **ELIMINATED**: Separate `VINContextManager` class entirely
- **REPLACED WITH**: Strands built-in `agent.state` management
- **BENEFIT**: VIN data automatically persisted to existing S3 bucket via S3SessionManager
- **TOOLS**: All tools access VIN data via `agent.state.get("vin_data")`

#### **2. Clean Table Recreation**
- **APPROACH**: Recreate tables with optimal schema (minimal existing data)
- **BENEFIT**: Clean design without migration complexity
- **STRUCTURE**: Enhanced existing table names with new session management fields

#### **3. User Type Separation**
- **ANONYMOUS**: `userId: 'anon-session-12345-timestamp'` with 1-hour TTL
- **AUTHENTICATED**: `userId: 'user-cognitoUserId'` with persistent data
- **BENEFIT**: Clean data boundaries and efficient TTL management

#### **4. Vehicle Library Limits**
- **LIMIT**: Maximum 10 vehicles per authenticated user
- **ENFORCEMENT**: Validation in API and UI layers
- **UI**: Clear indication of limit and usage

#### **5. Session Title Intelligence**
- **FORMAT**: "2024 Honda Civic - Brake Issues" (auto-generated)
- **EDITABLE**: Users can rename sessions for organization
- **FALLBACK**: Timestamp-based when vehicle info unavailable

### **Strands Best Practices Integration**

#### **Session Management**
```python
# OLD: Custom context management
vin_context_manager = VINContextManager(...)
stored_vin_data = vin_context_manager.get_vin_context(user_id)

# NEW: Strands-native state management
agent = Agent(
    session_manager=S3SessionManager(...),
    state={"user_id": user_id}  # All context in agent state
)
vin_data = agent.state.get("vin_data")  # Automatically persisted
```

#### **Tool Integration**
```python
# OLD: Manual context passing
def symptom_analyzer(symptoms, vehicle_data=None):
    # Manual VIN context handling

# NEW: Strands agent state access
@tool
def symptom_diagnosis_analyzer(agent, symptoms: str):
    vin_data = agent.state.get("vin_data")  # Direct access
    agent.state.set("diagnosis_results", results)  # Auto-persisted
```

#### **Lambda Handler Simplification**
```python
# OLD: Complex manual processing (1000+ lines)
def handle_chat_message(args):
    # Manual context building
    # Manual tool execution
    # Manual response processing
    # Manual storage

# NEW: Strands-native approach (25 lines)
def handle_chat_message(args):
    agent = get_agent_with_context(conversation_id, user_id)
    result = agent(message)  # Strands handles everything
    return clean_response(result)
```

### **Data Persistence Strategy**

#### **Strands S3 Persistence**
- **LOCATION**: `dixon-smart-repair-sessions-041063310146/production/`
- **STRUCTURE**: 
  ```
  conv-12345/
  ├── state.json          # Agent state (VIN data, preferences)
  ├── messages.json       # Conversation history
  └── metadata.json       # Session metadata
  ```
- **AUTOMATIC**: All agent state changes automatically saved

#### **DynamoDB Session Metadata**
- **PURPOSE**: Session management, vehicle library, user preferences
- **COMPLEMENT**: Works alongside Strands S3 persistence
- **QUERIES**: Efficient session listing, vehicle management, user profiles

### **Privacy & Data Lifecycle**

#### **Anonymous Users (1-hour TTL)**
- **SESSION**: Auto-cleanup after 1 hour of inactivity
- **BROWSER**: Cleanup on window close/navigation
- **DATA**: Temporary VIN data, diagnostic preferences

#### **Authenticated Users (Persistent)**
- **VEHICLES**: Up to 10 vehicles in personal library
- **SESSIONS**: Persistent chat sessions with editable titles
- **PRIVACY**: Granular controls for data export/deletion

### **Phase 1: Data Architecture Redesign (Week 1)**

#### **🎯 MCP Research Focus**
- Database schema design patterns for multi-tenant applications
- DynamoDB best practices for session management
- TTL implementation patterns for data lifecycle management
- Privacy-by-design architecture patterns

#### **🔍 Code Inspection Focus**
- Review existing DynamoDB table structures in CDK infrastructure
- Examine current session management in S3SessionManager
- Understand existing user authentication and role management
- Analyze current data storage patterns and access patterns

#### **1.1 Database Schema Updates**
Create enhanced DynamoDB tables with clean, optimal design:

**Enhanced ConversationTable (Recreated):**
```typescript
{
  // Existing fields (preserved for compatibility)
  id: string (PK) // conversation/session ID
  userId: string // 'anon-session-12345-timestamp' or 'user-cognitoUserId'
  createdAt: string
  
  // New session management fields
  sessionData: {
    title: string // "2024 Honda Civic - Brake Issues" (user-editable)
    vehicleId?: string // Reference to user's vehicle library
    diagnostic_level: 'quick' | 'vehicle' | 'precision'
    preferences: {
      parts_preference: 'oem' | 'equivalent' | 'budget'
      cost_display: 'detailed' | 'summary'
    }
    interaction_summary: {
      diagnosed_issues: string[]
      parts_discussed: string[]
      cost_estimates_provided: boolean
    }
    last_accessed: string
    message_count: number
    is_active: boolean
  }
  
  // TTL for anonymous users only
  ttl?: number // 3600 seconds (1 hour) for anonymous users
}
```

**Enhanced VehicleTable (Recreated):**
```typescript
{
  // Existing fields (preserved)
  id: string (PK) // vehicle ID
  userId: string (GSI PK) // 'user-cognitoUserId' only (no anonymous vehicles)
  
  // Enhanced vehicle data
  vehicleData: {
    basic: { 
      year: string, 
      make: string, 
      model: string, 
      trim?: string,
      nickname?: string // "My Honda", "Work Truck"
    }
    vin?: { 
      vin: string, 
      nhtsa_data: object,
      verified: boolean,
      last_verified: string
    }
    created_at: string
    last_used: string
    usage_count: number // Track which vehicles are used most
  }
  
  // Vehicle limit enforcement
  user_vehicle_count: number // Denormalized for quick validation
}
```

**New SessionContext Table (Anonymous Users Only):**
```typescript
{
  sessionId: string (PK) // 'anon-session-12345-timestamp'
  contextData: {
    temporary_vehicle_data?: {
      year?: string
      make?: string  
      model?: string
      vin?: string // Temporary VIN data for session
    }
    diagnostic_level: 'quick' | 'vehicle' | 'precision'
    preferences: {
      parts_preference?: 'oem' | 'equivalent' | 'budget'
    }
    interaction_state: {
      has_described_problem: boolean
      has_selected_diagnostic_level: boolean
      current_step: string
    }
  }
  created_at: string
  ttl: number // 3600 seconds (1 hour) - automatic cleanup
}
```

**MessageTable (Minimal Changes):**
```typescript
{
  // Existing fields (preserved exactly)
  conversationId: string (PK)
  timestamp: string (SK)
  // ... all existing message fields unchanged
  
  // Optional enhancement for session management
  session_context?: {
    diagnostic_level?: string
    vehicle_context?: boolean
  }
}
```

#### **1.2 CDK Infrastructure Updates**
- Add new DynamoDB tables with appropriate indexes
- Update IAM permissions for new table access
- Add CloudWatch alarms for table metrics
- Configure TTL for anonymous user data cleanup

#### **🧪 Testing Requirements for Phase 1**
```bash
# Test existing DynamoDB operations still work
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-db-existing","message":"Test database functionality","userId":"test-db-user"}}' | base64)" --region us-west-2 test-db-existing.json && cat test-db-existing.json

# Test new table creation and access
aws dynamodb describe-table --table-name UserVehicles --region us-west-2
aws dynamodb describe-table --table-name ChatSessions --region us-west-2
aws dynamodb describe-table --table-name SessionContext --region us-west-2
```

### **Phase 2: Backend Session Management (Week 2)**

#### **🎯 MCP Research Focus**
- Session management patterns for multi-user applications
- Privacy-compliant data handling strategies
- Real-time data synchronization best practices
- GraphQL schema design for session management

#### **🔍 Code Inspection Focus**
- Review existing Lambda handler structure and patterns
- Examine current GraphQL schema and resolver implementations
- Understand existing authentication middleware and user context
- Analyze current error handling and logging patterns

#### **2.1 Enhanced Session Management Service**
Create `SessionManager` class that integrates with Strands best practices:

```python
class SessionManager:
    def __init__(self, user_id: str, is_authenticated: bool):
        self.user_id = user_id
        self.is_authenticated = is_authenticated
        
    # Anonymous user methods (1-hour TTL)
    def create_anonymous_session(self, session_id: str) -> dict
    def get_anonymous_context(self, session_id: str) -> dict
    def cleanup_anonymous_session(self, session_id: str) -> bool
    
    # Authenticated user methods (max 10 vehicles)
    def get_user_vehicles(self) -> List[dict]
    def add_user_vehicle(self, vehicle_data: dict) -> str
    def get_chat_sessions(self) -> List[dict]
    def create_chat_session(self, vehicle_id: str, title: str) -> str
    def get_session_context(self, session_id: str) -> dict
    def update_session_context(self, session_id: str, context: dict) -> bool
    def delete_session(self, session_id: str) -> bool
    def update_session_title(self, session_id: str, title: str) -> bool
    
    # Privacy controls
    def clear_vehicle_data(self, vehicle_id: str) -> bool
    def clear_all_user_data(self) -> bool
    def set_data_retention_preference(self, days: int) -> bool
```

#### **2.2 Strands-Native VIN Integration**
**MAJOR CHANGE**: Eliminate separate VINContextManager and use Strands built-in state management:

```python
# OLD APPROACH (Remove entirely)
# vin_context_manager = VINContextManager(S3_SESSION_BUCKET, AWS_REGION)
# stored_vin_data = vin_context_manager.get_vin_context(user_id)

# NEW APPROACH (Strands-native)
def get_agent_with_context(conversation_id: str, user_id: str) -> Agent:
    # Strands handles ALL persistence automatically
    session_manager = S3SessionManager(
        session_id=conversation_id,
        bucket=S3_SESSION_BUCKET,
        prefix="production/",
        region_name=AWS_REGION
    )
    
    conversation_manager = SlidingWindowConversationManager(
        window_size=20,
        should_truncate_results=True
    )
    
    # Load user context into initial agent state
    initial_state = {
        "user_id": user_id,
        "is_authenticated": not user_id.startswith('anon-'),
        "session_created": datetime.utcnow().isoformat()
    }
    
    # Load vehicle library for authenticated users
    if not user_id.startswith('anon-'):
        try:
            session_mgr = SessionManager(user_id, True)
            user_vehicles = session_mgr.get_user_vehicles()
            if user_vehicles:
                initial_state["user_vehicles"] = user_vehicles
        except Exception as e:
            logger.warning(f"Could not load user vehicles: {e}")
    
    agent = Agent(
        model="us.amazon.nova-pro-v1:0",
        tools=get_enhanced_tools(),
        system_prompt=get_contextual_system_prompt(initial_state),
        session_manager=session_manager,
        conversation_manager=conversation_manager,
        state=initial_state  # All context managed by Strands
    )
    
    return agent

# Enhanced VIN processor tool (Strands-native)
@tool
def vin_processor(agent, vin_input: str, processing_method: str = "manual") -> str:
    """
    Process VIN and store in agent state (Strands-managed persistence)
    
    Args:
        agent: Strands agent instance (provides state access)
        vin_input: VIN string or image data
        processing_method: "manual", "camera", or "image_upload"
    """
    try:
        # Process VIN with existing NHTSA integration
        vin_data = process_vin_with_nhtsa(vin_input)
        
        # Store in Strands agent state (automatically persisted to S3)
        agent.state.set("vin_data", vin_data)
        agent.state.set("diagnostic_accuracy", "95%")
        agent.state.set("vin_processed_at", datetime.utcnow().isoformat())
        
        # For authenticated users, optionally save to vehicle library
        user_id = agent.state.get("user_id")
        if not user_id.startswith('anon-'):
            session_mgr = SessionManager(user_id, True)
            vehicle_count = len(session_mgr.get_user_vehicles())
            if vehicle_count < 10:  # Enforce 10-vehicle limit
                session_mgr.add_user_vehicle(vin_data)
        
        return f"✅ VIN processed successfully: {vin_data['year']} {vin_data['make']} {vin_data['model']}"
        
    except Exception as e:
        logger.error(f"VIN processing failed: {e}")
        return "❌ VIN processing failed. Please try again or use basic vehicle info."

# Enhanced symptom analyzer with Strands state access
@tool
def symptom_diagnosis_analyzer(agent, symptoms: str, customer_description: str) -> dict:
    """
    Analyze symptoms with automatic VIN data access from agent state
    """
    # Access VIN data directly from Strands agent state
    vin_data = agent.state.get("vin_data")
    diagnostic_level = agent.state.get("diagnostic_accuracy", "65%")
    
    if vin_data:
        # VIN-enhanced diagnosis (95% accuracy)
        diagnosis = perform_vin_enhanced_diagnosis(symptoms, vin_data, customer_description)
        confidence_level = "95%"
    else:
        # Generic diagnosis (65% accuracy)  
        diagnosis = perform_generic_diagnosis(symptoms, customer_description)
        confidence_level = "65%"
    
    # Store diagnosis results in agent state for cost inquiries
    agent.state.set("last_diagnosis", diagnosis)
    agent.state.set("probable_parts", diagnosis.get("probable_parts", []))
    
    return {
        "diagnosis": diagnosis,
        "confidence_level": confidence_level,
        "vin_enhanced": bool(vin_data),
        "upgrade_available": not bool(vin_data)
    }
```

#### **2.3 Simplified Lambda Handler (Strands Best Practices)**
Update `strands_best_practices_handler.py` with clean, Strands-native approach:

```python
def handle_chat_message(args):
    """
    Simplified handler following Strands best practices
    All session management handled by Strands framework
    """
    try:
        # Extract parameters
        conversation_id = args.get('conversationId')
        message = args.get('message', '').strip()
        user_id = args.get('userId', 'anonymous-web-user')
        diagnostic_context = args.get('diagnostic_context')
        
        # Generate conversation_id if not provided
        if not conversation_id:
            timestamp = int(time.time() * 1000)
            if user_id.startswith('anonymous'):
                conversation_id = f"anon-session-{timestamp}-{random.randint(1000, 9999)}"
            else:
                conversation_id = f"conv-{timestamp}"
        
        # Validation
        if not conversation_id or not message:
            return error_response(conversation_id, "Missing required parameters")
        
        # Get agent for this session (Strands handles all persistence)
        agent = get_agent_with_context(conversation_id, user_id)
        
        # Handle diagnostic context if provided
        if diagnostic_context:
            if isinstance(diagnostic_context, str):
                diagnostic_context = json.loads(diagnostic_context)
            
            # Store diagnostic preferences in agent state
            agent.state.set("diagnostic_level", diagnostic_context.get("mode", "quick"))
            agent.state.set("diagnostic_accuracy", diagnostic_context.get("accuracy", "65%"))
            agent.state.set("user_selection", diagnostic_context.get("user_selection"))
        
        # Let Strands handle everything (agent loop + tool execution + response)
        result = agent(message)
        
        # Update session metadata for authenticated users
        if not user_id.startswith('anon-'):
            try:
                session_mgr = SessionManager(user_id, True)
                session_mgr.update_session_context(conversation_id, {
                    "last_accessed": datetime.utcnow().isoformat(),
                    "message_count": len(agent.messages),
                    "diagnostic_level": agent.state.get("diagnostic_level", "quick")
                })
            except Exception as e:
                logger.warning(f"Could not update session metadata: {e}")
        
        # Return clean response
        return {
            'conversationId': conversation_id,
            'message': result.message,
            'timestamp': datetime.utcnow().isoformat(),
            'sender': 'ASSISTANT',
            'diagnostic_accuracy': agent.state.get("diagnostic_accuracy", "65%"),
            'vin_enhanced': bool(agent.state.get("vin_data")),
            'success': True
        }
        
    except Exception as e:
        logger.error(f"Error in handle_chat_message: {e}")
        return error_response(conversation_id, str(e))

def get_agent_with_context(conversation_id: str, user_id: str) -> Agent:
    """
    Create agent with Strands session management (replaces all custom context handling)
    """
    # Strands S3 session manager (handles all persistence automatically)
    session_manager = S3SessionManager(
        session_id=conversation_id,
        bucket=S3_SESSION_BUCKET,
        prefix="production/",
        region_name=AWS_REGION
    )
    
    # Strands conversation manager (handles context windows automatically)
    conversation_manager = SlidingWindowConversationManager(
        window_size=20,
        should_truncate_results=True
    )
    
    # Initial state (replaces all manual context building)
    initial_state = {
        "user_id": user_id,
        "is_authenticated": not user_id.startswith('anon-'),
        "session_created": datetime.utcnow().isoformat()
    }
    
    # Load user vehicle library for authenticated users
    if not user_id.startswith('anon-'):
        try:
            session_mgr = SessionManager(user_id, True)
            vehicles = session_mgr.get_user_vehicles()
            if vehicles:
                initial_state["user_vehicles"] = vehicles
                logger.info(f"Loaded {len(vehicles)} vehicles for user: {user_id}")
        except Exception as e:
            logger.warning(f"Could not load user vehicles: {e}")
    
    # Create agent (Strands handles everything else)
    agent = Agent(
        model="us.amazon.nova-pro-v1:0",
        tools=get_enhanced_automotive_tools(),
        system_prompt=get_contextual_system_prompt(initial_state),
        session_manager=session_manager,
        conversation_manager=conversation_manager,
        state=initial_state
    )
    
    logger.info(f"Agent created for session: {conversation_id}")
    return agent

def get_enhanced_automotive_tools():
    """
    Return Strands-native tools that use agent.state for all context
    """
    return [
        vin_processor,  # Stores VIN in agent.state
        symptom_diagnosis_analyzer,  # Accesses VIN from agent.state
        interactive_parts_selector,  # Uses agent.state for context
        parts_availability_lookup,
        labor_estimator,
        pricing_calculator,
        repair_instructions
    ]
```

#### **2.4 Enhanced GraphQL API**
Add new mutations and queries for session management:

```graphql
# Enhanced Queries
type Query {
  # Existing queries (preserved)
  getConversation(conversationId: String!): Conversation
  
  # New session management queries
  getUserVehicles: [UserVehicle]
  getChatSessions(limit: Int = 50): [ChatSession]
  getSessionContext(sessionId: String!): SessionContext
  getUserProfile: UserProfile
}

# Enhanced Mutations
type Mutation {
  # Existing mutations (preserved)
  sendMessage(
    conversationId: String!
    message: String!
    userId: String!
    diagnostic_context: String
  ): ChatResponse
  
  createConversation(userId: String!): Conversation
  
  # New session management mutations
  addUserVehicle(vehicleData: VehicleInput!): UserVehicle
  updateUserVehicle(vehicleId: String!, vehicleData: VehicleInput!): UserVehicle
  deleteUserVehicle(vehicleId: String!): Boolean
  
  createChatSession(vehicleId: String, title: String): ChatSession
  updateSessionTitle(sessionId: String!, title: String!): Boolean
  deleteSession(sessionId: String!): Boolean
  
  # Privacy controls
  clearVehicleData(vehicleId: String!): Boolean
  clearAllUserData: Boolean
  exportUserData: UserDataExport
}

# New Types
type UserVehicle {
  id: String!
  userId: String!
  vehicleData: VehicleData!
  createdAt: String!
  lastUsed: String!
  usageCount: Int!
}

type VehicleData {
  basic: BasicVehicleInfo!
  vin: VINData
  nickname: String
}

type BasicVehicleInfo {
  year: String!
  make: String!
  model: String!
  trim: String
}

type VINData {
  vin: String!
  nhtsa_data: String! # JSON string
  verified: Boolean!
  lastVerified: String!
}

type ChatSession {
  id: String!
  userId: String!
  title: String!
  vehicleId: String
  diagnosticLevel: String!
  lastAccessed: String!
  messageCount: Int!
  isActive: Boolean!
  createdAt: String!
}

type SessionContext {
  sessionId: String!
  diagnosticLevel: String!
  vehicleContext: VehicleData
  preferences: UserPreferences
  interactionSummary: InteractionSummary
}

type UserPreferences {
  partsPreference: String # 'oem' | 'equivalent' | 'budget'
  costDisplay: String # 'detailed' | 'summary'
}

type InteractionSummary {
  diagnosedIssues: [String!]!
  partsDiscussed: [String!]!
  costEstimatesProvided: Boolean!
}

type UserProfile {
  userId: String!
  vehicleCount: Int!
  sessionCount: Int!
  dataRetentionDays: Int
  createdAt: String!
}

type UserDataExport {
  vehicles: [UserVehicle!]!
  sessions: [ChatSession!]!
  conversations: [Conversation!]!
  exportedAt: String!
  format: String! # 'JSON'
}

# Input Types
input VehicleInput {
  basic: BasicVehicleInfoInput!
  vin: VINDataInput
  nickname: String
}

input BasicVehicleInfoInput {
  year: String!
  make: String!
  model: String!
  trim: String
}

input VINDataInput {
  vin: String!
  nhtsa_data: String!
}
```

#### **🧪 Testing Requirements for Phase 2**
```bash
# Test existing Lambda functionality
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-lambda-existing","message":"Test Lambda functionality","userId":"test-lambda-user"}}' | base64)" --region us-west-2 test-lambda-existing.json && cat test-lambda-existing.json

# Test new session management functionality
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"createChatSession"},"arguments":{"vehicleId":"test-vehicle-123","title":"Test Session","userId":"authenticated-user-456"}}' | base64)" --region us-west-2 test-session-new.json && cat test-session-new.json
```

### **Phase 3: Frontend Session Management UI (Week 3)**

#### **🎯 MCP Research Focus**
- Mobile-first sidebar design patterns
- Vehicle selection UI/UX best practices
- Session management interface design
- Accessibility patterns for complex interfaces

#### **🔍 Code Inspection Focus**
- Review existing ChatGPTInterface.tsx structure and patterns
- Examine current navigation and modal implementations
- Understand existing authentication UI components
- Analyze current styling patterns and responsive design

#### **3.1 Sidebar Component Architecture**
Create new components:

```typescript
// Main sidebar component
<SessionSidebar>
  <UserProfile />
  <VehicleSelector />  // For new chats
  <ChatSessionList />  // Existing chats
  <PrivacyControls />  // Data management
</SessionSidebar>

// Vehicle selection for new chats
<VehicleSelector>
  <SavedVehicles />    // Quick selection
  <AddNewVehicle />    // VIN scan or manual entry
  <DiagnosticLevelChoice /> // Quick/Vehicle/Precision
</VehicleSelector>

// Chat session management
<ChatSessionList>
  <SessionItem />      // Individual chat with context preview
  <SessionActions />   // Resume, delete, export
</ChatSessionList>
```

#### **3.2 New Chat Flow for Logged-in Users**
```typescript
const NewChatFlow = () => {
  const [step, setStep] = useState<'vehicle' | 'diagnostic' | 'ready'>('vehicle');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [diagnosticLevel, setDiagnosticLevel] = useState<DiagnosticLevel>('quick');
  
  // Step 1: Vehicle Selection
  if (step === 'vehicle') {
    return <VehicleSelectionStep onSelect={handleVehicleSelect} />;
  }
  
  // Step 2: Diagnostic Level (if vehicle selected)
  if (step === 'diagnostic') {
    return <DiagnosticLevelStep vehicle={selectedVehicle} onSelect={handleDiagnosticSelect} />;
  }
  
  // Step 3: Start chat with context
  return <ChatInterface sessionContext={buildSessionContext()} />;
};
```

#### **3.3 Anonymous User Experience**
```typescript
const AnonymousUserFlow = () => {
  // Generate temporary session ID
  const sessionId = useMemo(() => `anon-${Date.now()}-${Math.random()}`, []);
  
  // Setup cleanup on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Trigger backend cleanup
      cleanupAnonymousSession(sessionId);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]);
  
  // Setup inactivity cleanup
  useInactivityCleanup(sessionId, 30 * 60 * 1000); // 30 minutes
  
  return <ChatInterface sessionId={sessionId} isAnonymous={true} />;
};
```

#### **🧪 Testing Requirements for Phase 3**
```bash
# Test existing frontend functionality
# (Web testing required - AWS CLI not applicable for frontend components)
```

#### **🌐 User Web Testing for Phase 3**
- Test existing chat interface continues to work without issues
- Verify new sidebar appears for logged-in users
- Test vehicle selection flow for new chats
- Confirm anonymous user experience remains unchanged
- Test session management (create, resume, delete)
- Validate mobile responsiveness of new components

### **Phase 4: Context-Aware Diagnostics (Week 4)**

#### **🎯 MCP Research Focus**
- Context-aware AI system design patterns
- Diagnostic accuracy optimization strategies
- Tool selection based on user context
- System prompt engineering best practices

#### **🔍 Code Inspection Focus**
- Review existing agent initialization in strands_best_practices_handler.py
- Examine current tool integration and selection logic
- Understand existing system prompt generation
- Analyze current diagnostic context handling

#### **4.1 Enhanced Agent Context Management**
Update agent initialization to respect session context:

```python
def get_agent_with_context(conversation_id: str, session_context: dict) -> Agent:
    # Determine diagnostic level from session context
    diagnostic_level = session_context.get('diagnostic_level', 'quick')
    
    # Load appropriate vehicle data based on diagnostic level
    vehicle_data = None
    if diagnostic_level == 'precision' and session_context.get('vehicle_vin'):
        vehicle_data = session_context['vehicle_vin']
    elif diagnostic_level == 'vehicle' and session_context.get('vehicle_basic'):
        vehicle_data = session_context['vehicle_basic']
    # For 'quick' level, no vehicle data loaded
    
    # Create system prompt based on context
    system_prompt = get_contextual_system_prompt(diagnostic_level, vehicle_data)
    
    # Initialize agent state with session context
    initial_state = {
        "diagnostic_level": diagnostic_level,
        "session_context": session_context
    }
    
    if vehicle_data:
        initial_state["vehicle_data"] = vehicle_data
    
    return Agent(
        model="us.amazon.nova-pro-v1:0",
        tools=get_tools_for_diagnostic_level(diagnostic_level),
        system_prompt=system_prompt,
        session_manager=S3SessionManager(...),
        conversation_manager=SlidingWindowConversationManager(...),
        initial_state=initial_state
    )
```

#### **4.2 Diagnostic Level Enforcement**
```python
def get_tools_for_diagnostic_level(level: str) -> List:
    base_tools = [symptom_diagnosis_analyzer, repair_instructions]
    
    if level == 'quick':
        return base_tools  # Generic tools only
    elif level == 'vehicle':
        return base_tools + [parts_availability_lookup, labor_estimator]
    elif level == 'precision':
        return base_tools + [parts_availability_lookup, labor_estimator, 
                           pricing_calculator, vin_processor]
    
    return base_tools
```

#### **🧪 Testing Requirements for Phase 4**
```bash
# Test existing diagnostic functionality
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-diag-existing","message":"My car won'\''t start","userId":"test-diag-user"}}' | base64)" --region us-west-2 test-diag-existing.json && cat test-diag-existing.json

# Test context-aware diagnostics
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-context-diag","message":"My car won'\''t start","userId":"test-context-user","diagnostic_context":"{\"diagnostic_level\":\"quick\"}"}}' | base64)" --region us-west-2 test-context-diag.json && cat test-context-diag.json
```

### **Phase 5: Privacy & Data Management (Week 5)**

#### **🎯 MCP Research Focus**
- GDPR/CCPA compliance implementation patterns
- Privacy-by-design architecture principles
- Data retention and deletion best practices
- User consent management strategies

#### **🔍 Code Inspection Focus**
- Review existing user data handling and storage patterns
- Examine current privacy policy integration
- Understand existing data export capabilities
- Analyze current user preference management

#### **5.1 Privacy Controls UI**
```typescript
const PrivacyControls = () => {
  return (
    <div className="privacy-controls">
      <h3>Data Management</h3>
      
      {/* Per-chat controls */}
      <section>
        <h4>Chat Sessions</h4>
        {chatSessions.map(session => (
          <div key={session.id} className="session-privacy">
            <span>{session.title}</span>
            <button onClick={() => clearSessionData(session.id)}>
              Clear VIN Data
            </button>
            <button onClick={() => deleteSession(session.id)}>
              Delete Chat
            </button>
          </div>
        ))}
      </section>
      
      {/* Account-level controls */}
      <section>
        <h4>Account Data</h4>
        <button onClick={clearAllVehicleData}>Clear All Vehicle Data</button>
        <button onClick={exportUserData}>Export My Data</button>
        
        <div className="retention-settings">
          <label>Data Retention:</label>
          <select value={retentionDays} onChange={handleRetentionChange}>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={-1}>Indefinitely</option>
          </select>
        </div>
      </section>
    </div>
  );
};
```

#### **5.2 Automated Data Cleanup**
Create Lambda function for scheduled cleanup:

```python
def cleanup_expired_data(event, context):
    """
    Scheduled Lambda to clean up expired data based on user preferences
    """
    # Clean up anonymous sessions past TTL
    cleanup_anonymous_sessions()
    
    # Clean up user data based on retention preferences
    cleanup_user_data_by_retention_policy()
    
    # Clean up orphaned vehicle data
    cleanup_orphaned_vehicles()
    
    return {"statusCode": 200, "body": "Cleanup completed"}
```

#### **🧪 Testing Requirements for Phase 5**
```bash
# Test existing user data handling
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-privacy-existing","message":"Test privacy functionality","userId":"test-privacy-user"}}' | base64)" --region us-west-2 test-privacy-existing.json && cat test-privacy-existing.json

# Test new privacy controls
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"updatePrivacySettings"},"arguments":{"userId":"test-privacy-user","settings":"{\"dataRetention\":\"30_days\"}"}}' | base64)" --region us-west-2 test-privacy-new.json && cat test-privacy-new.json
```

### **Phase 6: Testing & Validation (Week 6)**

#### **🎯 MCP Research Focus**
- Comprehensive testing strategies for session management systems
- Performance testing patterns for multi-user applications
- Security testing approaches for privacy-compliant systems
- User acceptance testing methodologies

#### **🔍 Code Inspection Focus**
- Review all implemented components for consistency and integration
- Examine error handling and edge case coverage
- Understand performance implications of new architecture
- Analyze security and privacy compliance implementation

#### **6.1 Test Scenarios**

**Anonymous User Tests:**
- [ ] Data cleanup on window close
- [ ] Data cleanup after inactivity timeout
- [ ] No data persistence across browser sessions
- [ ] Proper diagnostic level enforcement

**Logged-in User Tests:**
- [ ] Vehicle library management (add/edit/delete)
- [ ] Chat session creation with vehicle context
- [ ] Session resumption with full context restoration
- [ ] Privacy controls functionality
- [ ] Data retention policy enforcement

**Integration Tests:**
- [ ] Diagnostic level enforcement across all tools
- [ ] VIN data loading only when appropriate
- [ ] Session context preservation during chat
- [ ] Cross-browser compatibility

#### **6.2 Performance Testing**
- [ ] Database query performance with new schema
- [ ] Frontend rendering with large session lists
- [ ] Memory usage with session context management
- [ ] Lambda cold start times with new dependencies

## 🚀 **Deployment Strategy**

### **Phase 1: Infrastructure (Week 1)**
1. Deploy new DynamoDB tables
2. Update IAM permissions
3. Test database connectivity

### **Phase 2: Backend (Week 2)**
1. Deploy updated Lambda functions
2. Test GraphQL API endpoints
3. Validate session management logic

### **Phase 3: Frontend (Week 3)**
1. Deploy sidebar components
2. Test new chat flow
3. Validate anonymous user experience

### **Phase 4: Integration (Week 4)**
1. End-to-end testing
2. Performance optimization
3. Bug fixes and refinements

### **Phase 5: Privacy Features (Week 5)**
1. Deploy privacy controls
2. Test data cleanup mechanisms
3. Validate compliance requirements

### **Phase 6: Production Release (Week 6)**
1. Final testing and validation
2. Documentation updates
3. Production deployment
4. User acceptance testing

## 📊 **Success Metrics**

### **User Experience Metrics**
- Diagnostic accuracy matches selected level (Quick: 65%, Vehicle: 80%, Precision: 95%)
- Session resumption works 100% of the time
- Anonymous user data cleanup success rate > 99%
- Chat session creation time < 2 seconds

### **Technical Metrics**
- Database query response time < 100ms
- Lambda function execution time < 5 seconds
- Frontend rendering time < 1 second
- Data cleanup job success rate > 99%

### **Privacy Compliance Metrics**
- Anonymous data retention < configured timeout
- User data deletion success rate 100%
- Privacy control response time < 1 second
- Data export completion rate 100%

## 🔧 **Implementation Notes**

### **Key Considerations**
1. **Backward Compatibility**: Ensure existing anonymous users aren't disrupted during rollout
2. **Data Migration**: Plan for migrating existing VIN data to new schema
3. **Error Handling**: Robust fallbacks for session management failures
4. **Performance**: Optimize for large numbers of chat sessions per user
5. **Security**: Ensure proper data isolation between users and sessions

### **Risk Mitigation**
1. **Gradual Rollout**: Feature flags for new session management
2. **Fallback Mechanisms**: Revert to current system if issues arise
3. **Data Backup**: Comprehensive backup before schema changes
4. **Monitoring**: Enhanced CloudWatch metrics for new components
5. **Testing**: Extensive testing in staging environment

## 📚 **Documentation Requirements**

1. **User Guide**: How to use new session management features
2. **API Documentation**: Updated GraphQL schema and endpoints
3. **Privacy Policy**: Updated data handling and retention policies
4. **Developer Guide**: Session management architecture and patterns
5. **Troubleshooting**: Common issues and resolution steps

## 🎯 **Acceptance Criteria**

### **📋 Universal Requirements for All Phases**
Every phase implementation must include:

**🎯 MCP Best Practices Compliance**:
- Research and apply current industry best practices using MCP tools
- Validate implementation approaches against established patterns
- Ensure accessibility and performance standards are met
- Follow framework-specific best practices (React Native, Strands, GraphQL)

**🔍 Code Inspection and Integration**:
- Thoroughly examine existing codebase before making changes
- Ask clarifying questions about business logic and technical constraints
- Ensure seamless integration with existing components and patterns
- Maintain consistency with current styling and architectural approaches
- Validate assumptions through code analysis and stakeholder confirmation

**🛡️ Functionality Preservation**:
- Ensure existing working functionality is not broken during implementation
- Preserve current user experiences (anonymous and authenticated)
- Maintain existing diagnostic accuracy and tool integration
- Keep current performance levels and response times
- Preserve existing data integrity and security measures

**🧪 AWS CLI Testing Requirements**:
- Test existing functionality continues to work after changes
- Validate new functionality works as expected via Lambda invocation
- Test edge cases and error handling scenarios
- Verify integration with existing tools and services
- Confirm data persistence and session management

**🌐 User Web Testing Requirements**:
- Test existing user flows remain functional and responsive
- Verify new features work correctly in web interface
- Test mobile responsiveness and accessibility compliance
- Validate cross-browser compatibility and performance
- Confirm user experience improvements meet acceptance criteria

**📝 Documentation Updates**:
- Update **/Users/saidachanda/development/dixon-smart-repair/development/current-state.md** with:
  - New feature documentation and technical implementation details
  - Component documentation and architectural changes
  - User experience improvements and system capabilities
  - Integration points and dependency updates
- Update **/Users/saidachanda/development/dixon-smart-repair/session-context.md** with:
  - Implementation timeline and technical decisions
  - User story completion status and acceptance criteria met
  - Architectural changes and new dependencies
  - Performance metrics and user experience improvements

### **Definition of Done for Each Phase**:
1. **Phase 1 - Data Architecture**: New DynamoDB tables deployed + MCP-validated schema design + seamless integration with existing data handling + **AWS CLI testing passed** + **infrastructure validation completed** + **complete documentation updates**

2. **Phase 2 - Backend Session Management**: SessionManager class implemented + MCP-researched session patterns + integration with existing Lambda handler + **AWS CLI testing passed** + **GraphQL API validation completed** + **complete documentation updates**

3. **Phase 3 - Frontend Session Management UI**: Sidebar and session components implemented + MCP-validated UI patterns + integration with existing chat interface + **AWS CLI testing passed** + **user web testing completed** + **complete documentation updates**

4. **Phase 4 - Context-Aware Diagnostics**: Agent context management implemented + MCP-researched diagnostic patterns + integration with existing tools + **AWS CLI testing passed** + **user web testing completed** + **complete documentation updates**

5. **Phase 5 - Privacy & Data Management**: Privacy controls implemented + MCP-researched compliance patterns + integration with existing user data handling + **AWS CLI testing passed** + **user web testing completed** + **complete documentation updates**

6. **Phase 6 - Testing & Validation**: Comprehensive testing completed + MCP-validated testing strategies + all integration points verified + **AWS CLI testing passed** + **user web testing completed** + **complete documentation updates**

### **Quality Gates**:
- All components must be mobile-responsive
- Accessibility compliance (WCAG 2.1 AA)
- Performance: <3 second load times
- Error handling: Graceful degradation
- Testing: 80%+ code coverage
- Documentation: Complete API and component docs

## 🎯 **Acceptance Criteria**

### **📋 Universal Requirements for All Phases**
Every phase implementation must include:

**🎯 MCP Best Practices Compliance**:
- Research and apply current industry best practices using MCP tools
- Validate implementation approaches against established patterns
- Ensure accessibility and performance standards are met
- Follow framework-specific best practices (React Native, Strands, GraphQL)

**🔍 Code Inspection and Integration**:
- Thoroughly examine existing codebase before making changes
- Ask clarifying questions about business logic and technical constraints
- Ensure seamless integration with existing components and patterns
- Maintain consistency with current styling and architectural approaches
- Validate assumptions through code analysis and stakeholder confirmation

**🛡️ Functionality Preservation**:
- Ensure existing working functionality is not broken during implementation
- Preserve current user experiences (anonymous and authenticated)
- Maintain existing diagnostic accuracy and tool integration
- Keep current performance levels and response times
- Preserve existing data integrity and security measures

**🧪 AWS CLI Testing Requirements**:
- Test existing functionality continues to work after changes
- Validate new functionality works as expected via Lambda invocation
- Test edge cases and error handling scenarios
- Verify integration with existing tools and services
- Confirm data persistence and session management

**🌐 User Web Testing Requirements**:
- Test existing user flows remain functional and responsive
- Verify new features work correctly in web interface
- Test mobile responsiveness and accessibility compliance
- Validate cross-browser compatibility and performance
- Confirm user experience improvements meet acceptance criteria

**📝 Documentation Updates**:
- Update **/Users/saidachanda/development/dixon-smart-repair/development/current-state.md** with:
  - New feature documentation and technical implementation details
  - Component documentation and architectural changes
  - User experience improvements and system capabilities
  - Integration points and dependency updates
- Update **/Users/saidachanda/development/dixon-smart-repair/session-context.md** with:
  - Implementation timeline and technical decisions
  - User story completion status and acceptance criteria met
  - Architectural changes and new dependencies
  - Performance metrics and user experience improvements

### **Definition of Done for Each Phase**:

1. **Phase 1 - Data Architecture**: Enhanced DynamoDB tables deployed + MCP-validated schema design + Strands-native VIN integration + seamless integration with existing data handling + **AWS CLI testing passed** + **infrastructure validation completed** + **complete documentation updates**

2. **Phase 2 - Backend Session Management**: SessionManager class implemented + Strands-native approach + MCP-researched session patterns + integration with existing Lambda handler + **AWS CLI testing passed** + **GraphQL API validation completed** + **complete documentation updates**

3. **Phase 3 - Frontend Session Management UI**: Sidebar and session components implemented + MCP-validated UI patterns + integration with existing chat interface + **AWS CLI testing passed** + **user web testing completed** + **complete documentation updates**

4. **Phase 4 - Context-Aware Diagnostics**: Agent context management implemented + MCP-researched diagnostic patterns + integration with existing tools + **AWS CLI testing passed** + **user web testing completed** + **complete documentation updates**

5. **Phase 5 - Privacy & Data Management**: Privacy controls implemented + MCP-researched compliance patterns + integration with existing user data handling + **AWS CLI testing passed** + **user web testing completed** + **complete documentation updates**

6. **Phase 6 - Testing & Validation**: Comprehensive testing completed + MCP-validated testing strategies + all integration points verified + **AWS CLI testing passed** + **user web testing completed** + **complete documentation updates**

### **Quality Gates**:
- All components must be mobile-responsive
- Accessibility compliance (WCAG 2.1 AA)
- Performance: <3 second load times
- Error handling: Graceful degradation
- Testing: 80%+ code coverage
- Documentation: Complete API and component docs

### **Success Metrics**

#### **User Experience Metrics**
- Diagnostic accuracy matches selected level (Quick: 65%, Vehicle: 80%, Precision: 95%)
- Session resumption works 100% of the time
- Anonymous user data cleanup success rate > 99%
- Chat session creation time < 2 seconds

#### **Technical Metrics**
- Database query response time < 100ms
- Lambda function execution time < 5 seconds
- Frontend rendering time < 1 second
- Data cleanup job success rate > 99%

#### **Privacy Compliance Metrics**
- Anonymous data retention < configured timeout (1 hour)
- User data deletion success rate 100%
- Privacy control response time < 1 second
- Data export completion rate 100%

### **Risk Mitigation**
1. **Gradual Rollout**: Feature flags for new session management
2. **Fallback Mechanisms**: Revert to current system if issues arise
3. **Data Backup**: Comprehensive backup before schema changes
4. **Monitoring**: Enhanced CloudWatch metrics for new components
5. **Testing**: Extensive testing in staging environment
---

## 🎯 **Ready for Implementation**

This comprehensive plan provides a roadmap for implementing a sophisticated user session management system that addresses all the identified issues while providing a superior user experience for both anonymous and logged-in users.

### **Implementation Approach**
- **Strands-Native**: Full integration with Strands best practices and built-in session management
- **Clean Architecture**: Table recreation with optimal schema design
- **Progressive Enhancement**: Maintain existing functionality while adding new capabilities
- **Quality-First**: Comprehensive testing and validation at each phase

### **Key Success Factors**
1. **Trust the Framework**: Leverage Strands built-in capabilities instead of custom solutions
2. **MCP Best Practices**: Research and apply industry standards for each implementation
3. **Code Inspection**: Thoroughly understand existing code before making changes
4. **Functionality Preservation**: Never break existing working features
5. **Comprehensive Testing**: AWS CLI + User Web Testing for every change
6. **Complete Documentation**: Update all documentation with implementation details

**Next Step**: Begin with Phase 1 (Data Architecture Redesign) and proceed through each phase systematically, following all MCP best practices, code inspection requirements, and testing protocols.
