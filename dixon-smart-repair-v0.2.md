# Dixon Smart Repair v0.2 - Customer Demo Feedback & Implementation Plan

## 📅 Document Information
- **Version**: 0.2
- **Date**: August 5, 2025
- **Status**: Implementation Planning
- **Previous Version**: v0.1 (Initial MVP)

---

## 🎯 Customer Demo Feedback Summary

### **Demo Date**: August 5, 2025
**Overall Reception**: Positive response to probing-based diagnostic approach

### **Customer Feedback Captured**:

#### **✅ Feedback #1: Solid Onboarding Flow (HIGH PRIORITY)**
**Customer Requirement**:
1. Customer opens chat → Greeted by Dixon
2. **If vehicles exist in account** → Ask which vehicle they want to chat about + show vehicle list
3. **If no vehicles exist** → Ask to scan/upload VIN 
4. Retrieve vehicle information from VIN
5. Use retrieved vehicle info for further diagnostics and labor estimates

**Status**: 🔄 Requires Implementation

#### **✅ Feedback #2: Diagnostic Flow Approval**
**Customer Response**: ✅ **APPROVED** - Customers really appreciate the more probing-based diagnostic flow
**Action**: Keep the current investigative approach (ask questions first before suggesting probable causes)

**Status**: ✅ No changes needed - current implementation working well

#### **✅ Feedback #3: Enhanced Labor Estimate with Multi-Model Consensus (HIGH PRIORITY)**
**Customer Requirement**:
1. **Primary agent (Nova Pro) provides its own estimate** based on diagnostic conversation
2. Use **two additional Bedrock models** for independent validation:
   - Claude 3.5 Sonnet (analytical reasoning)
   - Amazon Titan Text Premier (factual accuracy)
3. Agent reviews all estimates **without bias** and makes final decision
4. **Include web search** results for real-world validation
5. Present the final consensus-based labor estimate to customer

**Status**: 🔄 Requires Implementation

#### **✅ Feedback #4: Simple Labor Estimate Presentation in Customer Chat**
**Customer Requirement**:
1. Show **simple labor estimate** directly in customer chat interface
2. Present **low and high end values** with clear explanations
3. Include **probable reasons** for when estimate will be low vs high
4. Keep customer presentation **clean and straightforward**
5. **No technical model details** in chat - just the final estimate with reasoning

**Example Format**: 
- "Labor Estimate: $150 - $300"
- "Low end ($150): Simple brake pad replacement with no complications"
- "High end ($300): If brake rotors need resurfacing or brake fluid replacement is required"
- "Your estimate will be on the low end if: pads are easily accessible and no additional parts need replacement"
- "Your estimate will be on the high end if: brake system shows signs of wear requiring additional work"

**Status**: 🔄 Requires Implementation

#### **✅ Feedback #5: Detailed Labor Estimate Report for UI**
**Customer Requirement**:
1. Create **detailed backend report** with full transparency
2. Include **which model gave what estimate** (Model 1, Model 2, Model 3 results)
3. Include **1-2 key search results with URLs** (keep it simple, not overwhelming)
4. Show **consensus logic** and how final estimate was determined
5. Display this detailed report in **"Labour Estimate" tab in the UI**
6. This is for **internal/admin visibility**, not customer-facing

**Status**: 🔄 Requires Implementation

---

## 🏗️ Technical Implementation Plan

### **Phase 1: Parallel Development Architecture (Zero Downtime)**

#### **1.1 Implementation Strategy - Keeping Existing Code Intact**
**Principle**: Develop v0.2 features in parallel while maintaining existing system operation. Use feature flags for gradual migration.

**Current Project Structure Analysis**:
- **Main Handler**: `strands_best_practices_handler.py` - Current agent orchestration
- **Current Tools**: `automotive_tools_enhanced.py` & `automotive_tools_atomic_fixed.py` 
- **Infrastructure**: CDK stack with DynamoDB, Lambda, AppSync
- **Agent Setup**: Nova Pro agent with existing tools

#### **1.2 New File Structure (Parallel Development)**
```
cdk-infrastructure/lambda/
├── strands_best_practices_handler.py (EXISTING - unchanged)
├── automotive_tools_enhanced.py (EXISTING - unchanged)
├── dixon_v2_handler.py (NEW - v0.2 main handler)
├── simplified_tools_v2.py (NEW - 7 simplified tools)
├── dixon_v2_system_prompt.py (NEW - v0.2 prompts)
└── backup_v1/ (OPTIONAL - backup existing files)
```

#### **1.3 Simplified Tool Architecture (7 New Tools)**
**New File**: `simplified_tools_v2.py` - All 7 tools in one consolidated file
**Principle**: Tools handle only API calls/database operations. All decision-making left to Nova Pro agent.

**New Tool Set**:
1. **`fetch_user_vehicles`** - Query DynamoDB for user's vehicles, return raw JSON
2. **`extract_vin_from_image`** - Process image with Textract, return VIN + confidence
3. **`lookup_vehicle_data`** - Call NHTSA API, return raw vehicle specifications
4. **`store_vehicle_record`** - Save vehicle to DynamoDB, return status
5. **`search_web`** - Call Tavily API for web search, return raw results
6. **`calculate_labor_estimates`** - Call 3 Bedrock models + web search, return all outputs
7. **`save_labor_estimate_record`** - Save estimate to DynamoDB, return confirmation

#### **1.4 Multi-Model Labor Estimation**
**4-Model Setup**:
- **Primary Agent**: Amazon Nova Pro (Diagnostic conversation + final consensus decision)
- **Model 2**: Claude 3.5 Sonnet (Analytical reasoning validation)  
- **Model 3**: Amazon Titan Text Premier (Factual accuracy validation)
- **Validation**: Web search results

**Consensus Logic**: Agent-Driven Decision Making
```
1. Nova Pro agent completes diagnostic and forms initial estimate
2. Tool calls Claude 3.5 Sonnet for independent analytical estimate
3. Tool calls Titan Text Premier for factual validation estimate
4. Tool performs web search for real-world market validation
5. Nova Pro agent reviews all data without bias and makes final decision
6. Agent presents simple estimate to customer in chat
7. Detailed breakdown available in separate "Labour Estimate" tab
```

#### **1.5 Feature Flag Migration Strategy**
```python
# In existing strands_best_practices_handler.py
USE_V2_LABOR_ESTIMATION = os.environ.get('USE_V2_LABOR_ESTIMATION', 'false').lower() == 'true'
USE_V2_ONBOARDING = os.environ.get('USE_V2_ONBOARDING', 'false').lower() == 'true'

if USE_V2_LABOR_ESTIMATION:
    from dixon_v2_handler import handle_labor_estimation_v2
    return handle_labor_estimation_v2(args)
else:
    # Use existing logic
    return existing_labor_estimation(args)
```

#### **1.6 Database Schema Updates (Non-Breaking)**
**New Table**: `LaborEstimateReports` (Added to CDK stack without affecting existing tables)
```
Primary Key: userId (String) - Partition Key
Sort Key: reportId (String) - Sort Key
Attributes:
- modelResults: JSON (all 3 model outputs)
- webSearchResults: JSON (1-2 search results with URLs)
- consensusLogic: String (decision process explanation)
- finalEstimate: JSON (low/high ranges with explanations)
- createdAt: String (ISO timestamp)
- vehicleInfo: JSON (vehicle context)
```

**Existing Tables**: Only additive changes, no modifications to existing fields

### **Phase 2: Implementation Details**

#### **2.1 New v0.2 Handler Creation**
**New File**: `dixon_v2_handler.py`
```python
from strands import Agent
from simplified_tools_v2 import (
    fetch_user_vehicles,
    calculate_labor_estimates,
    save_labor_estimate_record,
    # ... other tools
)

def get_v2_agent(conversation_id: str, user_id: str) -> Agent:
    """Create Nova Pro agent with v0.2 tools"""
    tools = [
        fetch_user_vehicles,
        extract_vin_from_image,
        lookup_vehicle_data,
        store_vehicle_record,
        search_web,
        calculate_labor_estimates,
        save_labor_estimate_record
    ]
    
    agent = Agent(
        model="us.amazon.nova-pro-v1:0",
        tools=tools,
        system_prompt=get_v2_system_prompt(),
        # ... other config
    )
    
    return agent
```

#### **2.2 Multi-Model Labor Estimation Implementation**
**In `simplified_tools_v2.py`**:
```python
@tool
def calculate_labor_estimates(agent, repair_type: str, vehicle_info: dict) -> dict:
    """
    Multi-model labor estimation with Nova Pro + Claude 3.5 + Titan Premier
    """
    # Call Claude 3.5 Sonnet
    claude_estimate = call_bedrock_model("claude-3-5-sonnet", repair_type, vehicle_info)
    
    # Call Titan Text Premier  
    titan_estimate = call_bedrock_model("amazon.titan-text-premier-v1:0", repair_type, vehicle_info)
    
    # Call web search for validation
    web_results = search_web_for_labor_rates(repair_type, vehicle_info)
    
    return {
        "success": True,
        "data": {
            "claude_estimate": claude_estimate,
            "titan_estimate": titan_estimate,
            "web_results": web_results,
            "nova_pro_can_decide": True
        }
    }
```

#### **2.3 Updated System Prompt**
**New File**: `dixon_v2_system_prompt.py`
```python
def get_v2_system_prompt():
    return """
    You are Dixon, an AI automotive assistant using Amazon Nova Pro.
    
    ONBOARDING FLOW:
    1. Greet user and check if they have vehicles (use fetch_user_vehicles)
    2. If vehicles exist: Show list and ask which to discuss
    3. If no vehicles: Ask for VIN scan/upload
    
    LABOR ESTIMATION:
    1. Complete diagnostic conversation using probing questions
    2. When repair is identified, use calculate_labor_estimates tool
    3. Review Claude 3.5 and Titan Premier estimates without bias
    4. Consider web search validation
    5. Present simple estimate to customer with low/high ranges
    6. Save detailed report using save_labor_estimate_record
    
    CUSTOMER PRESENTATION FORMAT:
    "Labor Estimate: $150-$300
    Low end ($150): Simple brake pad replacement with no complications
    High end ($300): If brake rotors need resurfacing or additional work
    Your estimate will be low if: [conditions]
    Your estimate will be high if: [conditions]"
    """
```

#### **2.4 Onboarding Flow Implementation**
```
1. User opens chat → Dixon greeting
2. Call fetch_user_vehicles(agent)
3. If vehicles exist:
   - Present formatted list: "Latest vehicle on top, limit to 5 vehicles"
   - Format: "1. [Year Make Model] - [Last used date]"
   - Ask: "Which vehicle would you like to chat about?"
4. If no vehicles:
   - Ask: "Please scan or upload your VIN"
   - Call extract_vin_from_image(agent) 
   - Call lookup_vehicle_data(agent, vin)
   - Call store_vehicle_record(agent, vehicle_data)
5. Proceed with diagnostics using vehicle context
```

#### **2.5 Labor Estimation Flow**
```
1. Nova Pro agent completes diagnostic questioning (probing approach)
2. Nova Pro agent identifies repair needed and forms initial estimate
3. Call calculate_labor_estimates(agent, repair_type, vehicle_info)
   - Tool calls Claude 3.5 Sonnet for analytical estimate
   - Tool calls Titan Text Premier for factual validation
   - Tool calls search_web for labor rate validation
   - Tool returns all raw data to agent
4. Nova Pro agent reviews all estimates without bias and makes final decision
5. Agent presents simple estimate to customer in chat:
   - "Labor Estimate: $X - $Y"
   - "Low end: [scenario explanation]"
   - "High end: [scenario explanation]"
   - "Your estimate will be low/high if: [conditions]"
6. Call save_labor_estimate_record(agent, estimate_data)
   - Saves detailed report for "Labour Estimate" tab
```

#### **2.6 Error Handling Strategy**
**Scenario A**: VIN lookup fails during onboarding
- Inform user about processing issue
- Ask user to manually enter vehicle details

**Scenario B**: No vehicles exist and VIN upload fails  
- Force user to manually enter vehicle info

**Scenario C**: All 3 labor estimation models fail
- Show "unable to estimate" message

### **Phase 3: Infrastructure Integration**

#### **3.1 CDK Stack Updates (Non-Breaking)**
```typescript
// Add new Lambda function for v0.2
const dixonV2Handler = new lambda.Function(this, 'DixonV2Handler', {
  runtime: lambda.Runtime.PYTHON_3_11,
  handler: 'dixon_v2_handler.lambda_handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
  // ... other config
});

// Add new DynamoDB table
const laborEstimateReportsTable = new dynamodb.Table(this, 'LaborEstimateReports', {
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'reportId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// Add environment variables to control which version to use
existingHandler.addEnvironment('USE_V2_LABOR_ESTIMATION', 'true');
existingHandler.addEnvironment('USE_V2_ONBOARDING', 'true');
```

#### **3.2 Frontend Integration**
- **Customer View**: Clean labor estimates with ranges and explanations (in chat)
- **Admin UI**: New "Labour Estimate" tab showing detailed reports
- **Onboarding**: Vehicle selection interface for existing vehicles

#### **3.3 Existing System Integration**
- **Keep**: Current probing-based diagnostic flow (customer approved)
- **Enhance**: VIN processing with better vehicle association
- **Replace**: Single labor estimation with 3-model consensus
- **Add**: Detailed reporting for transparency

### **Phase 4: Migration Benefits**

#### **4.1 Risk Mitigation**
- ✅ **Zero downtime** - existing system continues working
- ✅ **Gradual rollout** - feature flags control adoption
- ✅ **Easy rollback** - can disable v0.2 instantly
- ✅ **Parallel testing** - test v0.2 without affecting production

#### **4.2 Development Benefits**
- ✅ **Clean separation** - v0.2 code is isolated
- ✅ **Reuse existing infrastructure** - DynamoDB, AppSync, etc.
- ✅ **Leverage existing tools** - can import and use current tools as needed
- ✅ **Incremental deployment** - deploy piece by piece

---

## 🎯 Success Metrics

### **Customer Experience Improvements**:
- ✅ Smooth onboarding with vehicle context
- ✅ Accurate labor estimates (95% target accuracy)
- ✅ Clear, understandable estimate presentations
- ✅ Maintained probing diagnostic approach

### **Technical Improvements**:
- ✅ Simplified, maintainable tool architecture
- ✅ Multi-model consensus for reliability
- ✅ Comprehensive audit trail for estimates
- ✅ Better error handling and user guidance

### **Business Value**:
- ✅ Higher customer confidence in estimates
- ✅ Transparent pricing methodology
- ✅ Reduced support queries through better UX
- ✅ Data-driven estimate accuracy improvements

---

## 📋 Implementation Checklist

### **Phase 1: Parallel Development Setup**
- [ ] Create `dixon_v2_handler.py` - New main handler for v0.2
- [ ] Create `simplified_tools_v2.py` with 7 simplified tools
- [ ] Create `dixon_v2_system_prompt.py` - New system prompts
- [ ] Implement feature flags in existing handler
- [ ] Add new `LaborEstimateReports` DynamoDB table to CDK stack
- [ ] Test individual v0.2 tools in isolation

### **Phase 2: Core v0.2 Tools Implementation**
- [ ] Implement `fetch_user_vehicles` tool
- [ ] Implement `extract_vin_from_image` tool  
- [ ] Implement `lookup_vehicle_data` tool
- [ ] Implement `store_vehicle_record` tool
- [ ] Implement `search_web` tool
- [ ] Test basic onboarding flow with new tools

### **Phase 3: Multi-Model Labor Estimation**
- [ ] Implement `calculate_labor_estimates` tool
- [ ] Set up Claude 3.5 Sonnet model calls
- [ ] Set up Titan Text Premier model calls
- [ ] Integrate web search validation
- [ ] Implement `save_labor_estimate_record` tool
- [ ] Test multi-model estimation consensus logic

### **Phase 4: Integration & Testing**
- [ ] Update CDK stack with new Lambda function
- [ ] Deploy v0.2 handler alongside existing system
- [ ] Enable feature flags for gradual rollout
- [ ] Test complete customer journey with v0.2
- [ ] Validate onboarding flow with vehicle selection
- [ ] Test labor estimation with all 3 models + web search

### **Phase 5: Frontend Integration**
- [ ] Frontend: Vehicle selection interface for onboarding
- [ ] Customer UI: Simple labor estimate presentation in chat
- [ ] Admin UI: New "Labour Estimate" tab with detailed reports
- [ ] End-to-end testing across all interfaces
- [ ] Performance testing and optimization

### **Phase 6: Production Deployment**
- [ ] Gradual user migration using feature flags
- [ ] Monitor system performance and accuracy
- [ ] Customer feedback collection and analysis
- [ ] Full production rollout
- [ ] Decommission v0.1 components (if desired)

---

## 🚀 Next Steps

1. **Immediate**: Begin Phase 1 implementation with `simplified_tools.py`
2. **Core Development**: Complete core tools and labor estimation logic
3. **Integration**: Integration testing and UI updates
4. **Validation**: Customer demo of v0.2

---

## 📝 Notes

- **Customer Satisfaction**: High approval of probing diagnostic approach
- **Key Focus**: Labor estimation accuracy and transparency
- **Architecture**: Simplified tools with agent-driven decision making
- **Implementation Strategy**: Phased approach with continuous testing

---

*Document prepared by: Development Team*  
*Next Review: TBD*  
*Implementation Start: August 5, 2025*
