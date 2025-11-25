# PROMPT 12: Atomic Tools Refactoring - Strands Best Practices Implementation

## 🎯 **Objective**
Refactor the existing automotive tools to follow atomic architecture and Strands best practices, eliminating orchestrator tools and enabling true LLM-driven tool orchestration for contextual cost responses and improved agent intelligence.

## 🔍 **Current State Analysis**

### **Existing Tools (Need Refactoring)**
Located in: `/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/automotive_tools_enhanced.py`

**Current Tools:**
1. `vin_processor` - VIN processing (keep as-is, already atomic)
2. `symptom_diagnosis_analyzer` - **REFACTOR**: Contains orchestration logic
3. `interactive_parts_selector` - **REFACTOR**: Orchestrates multiple functions
4. `parts_availability_lookup` - **REFACTOR**: May contain orchestration
5. `labor_estimator` - **REFACTOR**: May contain orchestration  
6. `pricing_calculator` - **REFACTOR**: Major orchestrator tool, needs complete redesign
7. `repair_instructions` - **REFACTOR**: May contain orchestration

### **Core Problem Identified**
The current `pricing_calculator` tool provides **generic cost ranges** instead of **contextual estimates based on established diagnosis** from conversation history. This happens because:

1. **Orchestrator tools** hard-code workflows instead of letting LLM orchestrate
2. **Tools call other tools** instead of LLM making intelligent decisions
3. **Conversation context** is not effectively leveraged by individual tools
4. **Rigid workflows** prevent flexible, contextual responses

## 🎯 **Target Architecture: Atomic Tools + LLM Orchestration**

### **Atomic Tool Principles**
1. **Single Responsibility**: Each tool does exactly one thing
2. **No Tool Orchestration**: Tools never call other tools
3. **LLM Intelligence**: LLM decides which tools to use when
4. **Structured Output**: Tools return data for LLM processing
5. **Maximum Reusability**: Same tools work in multiple scenarios

### **Example: Cost Inquiry Flow** 
```
User: "What would it cost to fix?" (after discussing battery issues)

Current (Broken):
pricing_calculator → Generic ranges for all possible causes

Target (Fixed):
LLM Context Awareness → Previous conversation established battery diagnosis
LLM Decision → "I need current battery pricing for 2024 Honda CRV"
LLM Tool Use → web_search_parts_pricing(part="battery", vehicle="2024 Honda CRV")
LLM Tool Use → extract_price_from_url(url="high_confidence_urls")
LLM Synthesis → "Based on our battery diagnosis, replacement costs $150-200..."
```

## 🛠️ **Implementation Requirements - UPDATED**

### **Phase 1: Create New Atomic Tools with Hybrid Architecture**

#### **🔄 Core Pattern: Atomic Tool + Confidence Scoring + LLM Orchestration**

Each atomic tool must implement:
1. **Single responsibility** - Do exactly one thing
2. **Confidence scoring** - Return confidence levels and refinement suggestions  
3. **Retry logic** - Exponential backoff for API failures
4. **Agent state caching** - Cache results to reduce API costs
5. **Structured error handling** - Return error objects for LLM processing

#### **1. NHTSA Data Tools**
```python
@tool
def nhtsa_vehicle_lookup(agent, vin: str) -> Dict:
    """Get official vehicle data from NHTSA by VIN with caching and retry logic"""
    # Check agent state cache first
    cache_key = f"nhtsa_vehicle_{vin}"
    cached_result = agent.state.get(cache_key)
    
    if cached_result:
        return {"success": True, "vehicle_data": cached_result, "source": "cache"}
    
    # API call with exponential backoff retry
    try:
        result = exponential_backoff_retry(_nhtsa_api_call, max_retries=2)
        agent.state.set(cache_key, result, ttl=86400)  # 24 hour cache
        return {"success": True, "vehicle_data": result, "confidence": 95}
    except Exception as e:
        return {"success": False, "error": str(e), "error_type": "api_failure"}
    
@tool
def nhtsa_parts_lookup(agent, make: str, model: str, year: str, symptoms: List[str], search_refinement: str = "") -> Dict:
    """Get likely parts for symptoms from NHTSA database with confidence scoring"""
    # Implementation with caching, retry logic, and confidence scoring
    return {
        "success": True,
        "likely_parts": [...],
        "confidence": 85,
        "needs_refinement": confidence < 90,
        "refinement_suggestions": ["try more specific symptoms", "include trim level"]
    }
```

#### **2. Web Search Tools with Confidence-Based Iteration**
```python
@tool  
def web_search_parts_pricing(agent, part_name: str, vehicle_info: str, search_refinement: str = "") -> Dict:
    """Search web for parts pricing with confidence scoring and retry logic"""
    # Check agent state cache
    cache_key = f"pricing_{part_name}_{vehicle_info}_{search_refinement}".replace(" ", "_")
    cached_result = agent.state.get(cache_key)
    
    if cached_result:
        return {"success": True, **cached_result, "source": "cache"}
    
    # Tavily search with exponential backoff
    try:
        results = exponential_backoff_retry(_tavily_search, max_retries=3)
        confidence = calculate_confidence_score(results)
        
        response_data = {
            "pricing_sources": results,
            "confidence": confidence,
            "needs_refinement": confidence < 90,
            "refinement_suggestions": ["try specific part numbers", "include trim level"]
        }
        
        # Cache for 15 minutes (pricing changes frequently)
        agent.state.set(cache_key, response_data, ttl=900)
        
        return {"success": True, **response_data}
    except Exception as e:
        return {"success": False, "error": str(e), "error_type": "api_failure"}
```

#### **3. Data Extraction Tools**
```python
@tool
def extract_price_from_url(agent, url: str, part_context: str = "") -> Dict:
    """Extract specific price from retailer page with confidence scoring"""
    # Check cache first
    cache_key = f"price_extract_{hashlib.md5(url.encode()).hexdigest()}"
    cached_result = agent.state.get(cache_key)
    
    if cached_result:
        return {"success": True, **cached_result, "source": "cache"}
    
    try:
        price_data = exponential_backoff_retry(_extract_price, max_retries=2)
        confidence = calculate_price_confidence(price_data, part_context)
        
        response_data = {
            "price_found": price_data["price"],
            "confidence": confidence,
            "needs_verification": confidence < 90,
            "alternative_urls": price_data.get("alternatives", [])
        }
        
        # Cache extracted prices for 30 minutes
        agent.state.set(cache_key, response_data, ttl=1800)
        
        return {"success": True, **response_data}
    except Exception as e:
        return {"success": False, "error": str(e), "error_type": "extraction_failure"}
```

#### **4. Diagnostic Tools**
```python
@tool
def automotive_symptom_analyzer(agent, symptoms: str, vehicle_info: str, search_refinement: str = "") -> Dict:
    """Analyze symptoms and return likely causes with confidence scoring"""
    # Implementation with Tavily search, caching, retry logic, confidence scoring
    return {
        "success": True,
        "likely_causes": [...],
        "confidence": 88,
        "needs_refinement": True,
        "refinement_suggestions": ["provide more specific symptoms", "include when problem occurs"]
    }
```

### **Phase 2: Remove Orchestrator Tools**

#### **Tools to Remove/Refactor:**
1. **`pricing_calculator`** - DELETE (replace with atomic tools)
2. **`symptom_diagnosis_analyzer`** - REFACTOR to atomic `automotive_symptom_analyzer`
3. **`interactive_parts_selector`** - REFACTOR to atomic parts tools
4. **`labor_estimator`** - REFACTOR to atomic `extract_labor_time_estimate`
5. **`parts_availability_lookup`** - REFACTOR to atomic `web_search_parts_availability`
6. **`repair_instructions`** - REFACTOR to atomic `repair_procedure_lookup`

### **Phase 3: Update System Prompt for Iterative Tool Usage**

Update `/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/dixon_system_prompt.py` to:

#### **🔄 Add Iterative Tool Usage Strategy:**
```python
ITERATIVE TOOL USAGE STRATEGY - CRITICAL:
For ANY tool that returns confidence < 90%:
1. Use the tool's refinement_suggestions for a second attempt
2. Try up to 3 iterations with different refinements  
3. If still < 90%, inform user and suggest alternatives
4. Always explain your search strategy to the user

This applies to ALL atomic tools:
- Parts searching (web_search_parts_pricing)
- NHTSA lookups (nhtsa_parts_lookup, nhtsa_vehicle_lookup) 
- Price extraction (extract_price_from_url)
- Availability checking (web_search_parts_availability)
- Symptom analysis (automotive_symptom_analyzer)
- All other atomic tools

EXAMPLE ITERATIVE FLOW:
User: "What would brake pads cost for my 2024 Honda CRV?"
1st attempt: web_search_parts_pricing("brake pads", "2024 Honda CRV") → confidence=65%
2nd attempt: web_search_parts_pricing("brake pads", "2024 Honda CRV", "EX-L front ceramic") → confidence=92%
Response: "I found exact brake pads for your 2024 Honda CRV: $89-$120..."
```

#### **🎯 Add Contextual Cost Response Guidance:**
```python
CONTEXTUAL COST RESPONSES - CRITICAL:
When users ask about costs/pricing, you MUST:
1. Reference the established diagnosis from previous conversation
2. Focus cost estimates on the MOST LIKELY causes already identified
3. Use probability weighting based on diagnostic confidence
4. Mention what was already ruled out or confirmed
5. Provide targeted pricing, not generic ranges for all possibilities

EXAMPLE CONTEXTUAL COST RESPONSE:
Previous context: User's car won't start, jumpstart worked temporarily, lights were dim
User asks: "what would be the cost"

GOOD RESPONSE:
"Based on our diagnosis of your car not starting issue, since the jumpstart worked temporarily but the problem returned, you're most likely looking at:

**Most Likely (90% probability):**
- Battery replacement: $100-200 (if battery won't hold charge)
- Alternator replacement: $400-700 (if it's not charging the battery)

Since your jumpstart worked initially, we can rule out starter and fuel delivery issues. The fact that it died again after driving points to either a bad battery that won't hold charge or an alternator that's not charging properly."

BAD RESPONSE (avoid this):
"The cost of diagnosing and fixing a car that won't start can vary:
- Battery replacement: $100-200
- Starter replacement: $300-600  
- Fuel delivery issues: $200-800"
```

#### **🛠️ Remove Tool Orchestration Instructions:**
- Remove any instructions about tools calling other tools
- Remove hard-coded workflow guidance
- Remove orchestrator tool usage patterns
- Add guidance for atomic tool selection and usage

## 🎯 **Specific Implementation Tasks**

### **Task 1: Analyze Current Tools**
**CRITICAL**: Before making any changes, thoroughly analyze each existing tool to understand:
- What API calls it makes
- What orchestration logic it contains
- What data it returns
- How it's currently used
- What can be broken into atomic pieces

### **Task 2: Create Atomic NHTSA Tools**
Create focused tools that interact with NHTSA database:
- Vehicle data lookup by VIN
- Parts identification by symptoms
- Recall information lookup
- Safety data retrieval

### **Task 3: Create Atomic Web Search Tools**
Create focused tools for web research:
- Parts pricing search (Tavily API)
- Parts availability search
- Repair procedure search
- Labor time research

### **Task 4: Create Atomic Data Extraction Tools**
Create focused tools for data extraction:
- Price extraction from retailer pages
- Labor time extraction
- Parts specification extraction
- Availability status extraction

### **Task 5: Update System Prompt for Contextual Responses**
Add specific guidance for contextual cost responses:
```
CONTEXTUAL COST RESPONSES - CRITICAL:
When users ask about costs/pricing, you MUST:
1. Reference the established diagnosis from previous conversation
2. Focus cost estimates on the MOST LIKELY causes already identified
3. Use probability weighting based on diagnostic confidence
4. Mention what was already ruled out or confirmed
5. Provide targeted pricing, not generic ranges for all possibilities
```

### **Task 6: Remove Orchestrator Tools**
Systematically remove or refactor tools that orchestrate other tools:
- Delete `pricing_calculator` entirely
- Refactor other orchestrator tools to atomic versions
- Ensure no tool calls another tool

### **Task 7: Test LLM Orchestration**
Verify that LLM can intelligently orchestrate atomic tools:
- Test cost inquiries with established diagnosis
- Test new diagnostic inquiries
- Test complex multi-step scenarios
- Verify contextual responses

## 🔧 **Implementation Guidelines - UPDATED**

### **🔄 Exponential Backoff Retry Pattern**

Implement this pattern for ALL atomic tools to handle API limits and failures:

```python
import time
import random
from typing import Dict, Any

def exponential_backoff_retry(func, max_retries=3, base_delay=1):
    """Generic retry wrapper with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:  # Last attempt
                raise e
            
            # Exponential backoff with jitter
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay:.2f}s")
            time.sleep(delay)

# Usage in atomic tools:
try:
    results = exponential_backoff_retry(_api_call, max_retries=3, base_delay=2)
except Exception as e:
    return {"success": False, "error": str(e), "error_type": "api_failure"}
```

### **💾 Agent State Caching Pattern**

Implement this caching pattern for ALL atomic tools to reduce API costs:

```python
@tool
def example_atomic_tool(agent, param1: str, param2: str) -> Dict:
    """Example atomic tool with caching pattern"""
    
    # Create cache key
    cache_key = f"tool_name_{param1}_{param2}".replace(" ", "_")
    
    # Check agent state cache first
    cached_result = agent.state.get(cache_key)
    if cached_result:
        logger.info(f"Cache hit for: {cache_key}")
        return {"success": True, **cached_result, "source": "cache"}
    
    # Make API call with retry logic
    try:
        result = exponential_backoff_retry(_api_call)
        confidence = calculate_confidence(result)
        
        response_data = {
            "data": result,
            "confidence": confidence,
            "needs_refinement": confidence < 90,
            "refinement_suggestions": ["suggestion1", "suggestion2"]
        }
        
        # Cache with appropriate TTL
        ttl = get_cache_ttl_for_data_type(data_type)  # 15min-24hrs based on data type
        agent.state.set(cache_key, response_data, ttl=ttl)
        
        return {"success": True, **response_data, "source": "api"}
        
    except Exception as e:
        return {"success": False, "error": str(e), "error_type": "api_failure"}
```

### **📊 Cache TTL Recommendations**

```python
CACHE_TTL_SETTINGS = {
    "vin_data": 86400,      # 24 hours (rarely changes)
    "parts_pricing": 900,    # 15 minutes (prices change frequently)  
    "nhtsa_parts": 7200,    # 2 hours (relatively stable)
    "labor_estimates": 3600, # 1 hour (fairly stable)
    "availability": 1800,    # 30 minutes (changes moderately)
    "repair_procedures": 14400  # 4 hours (very stable)
}
```

### **🎯 Confidence Scoring Implementation**

Each atomic tool must implement confidence scoring:

```python
def calculate_confidence_score(results: Dict, context: str = "") -> int:
    """Calculate confidence score for tool results"""
    confidence = 50  # Base confidence
    
    # Scoring factors (customize per tool):
    if results.get("exact_match"):
        confidence += 30
    if results.get("multiple_sources"):
        confidence += 20
    if results.get("recent_data"):
        confidence += 15
    if context and context.lower() in str(results).lower():
        confidence += 10
    
    return min(confidence, 95)  # Cap at 95%

def get_refinement_suggestions(tool_type: str, current_params: Dict, confidence: int) -> List[str]:
    """Generate refinement suggestions based on tool type and confidence"""
    suggestions = []
    
    if tool_type == "parts_pricing":
        if confidence < 70:
            suggestions.extend(["include specific part numbers", "add trim level"])
        if confidence < 50:
            suggestions.extend(["try manufacturer part numbers", "include model year"])
    
    elif tool_type == "nhtsa_lookup":
        if confidence < 80:
            suggestions.extend(["be more specific with symptoms", "include when problem occurs"])
    
    return suggestions
```

### **🛡️ Functionality Preservation Requirement**
**CRITICAL**: For each implementation phase, **ensure existing working functionality is not broken**:
- **Preserve all current user experiences** (anonymous and authenticated)
- **Maintain existing diagnostic accuracy** and tool integration (all 7 automotive tools)
- **Keep current performance levels** and response times
- **Preserve existing data integrity** and security measures
- **Maintain existing UI patterns** and user workflows
- **Keep existing VIN processing** - current 95% accuracy must be maintained
- **Preserve existing API integrations** - Tavily, NHTSA, Amazon Textract must continue working
- **Maintain existing conversation flow** - current chat interface patterns must remain functional

### **🧪 AWS CLI Testing Requirements**
**MANDATORY**: Test implementation via AWS CLI for functionality and Lambda changes before any deployment:

```bash
# Test existing VIN processing still works
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-vin-preserve","message":"Can you process VIN: 1HGBH41JXMN109186?","userId":"test-preserve-user"}}' | base64)" --region us-west-2 test-vin-preserve.json && cat test-vin-preserve.json

# Test existing diagnostic flow still works
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-diag-preserve","message":"My car won'\''t start","userId":"test-preserve-user"}}' | base64)" --region us-west-2 test-diag-preserve.json && cat test-diag-preserve.json

# Test existing cost estimation still works
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-cost-preserve","message":"How much would brake pads cost?","userId":"test-preserve-user"}}' | base64)" --region us-west-2 test-cost-preserve.json && cat test-cost-preserve.json

# Test new atomic tools work correctly
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-atomic-new","message":"My 2024 Honda CRV won'\''t start, what would it cost?","userId":"test-atomic-user"}}' | base64)" --region us-west-2 test-atomic-new.json && cat test-atomic-new.json

# Test contextual cost responses work
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-context-new","message":"what would be the cost","userId":"test-context-user"}}' | base64)" --region us-west-2 test-context-new.json && cat test-context-new.json
```

### **🌐 User Web Testing Requirements**
**MANDATORY**: After AWS CLI tests pass, **ask user to test via web**:
- **Test existing user flows** remain functional and responsive at https://d37f64klhjdi5b.cloudfront.net
- **Verify contextual cost responses** reference established diagnosis instead of generic ranges
- **Test atomic tool orchestration** - LLM intelligently combines tools for complex queries
- **Confirm iterative refinement** - tools achieve >90% confidence through multiple attempts
- **Validate mobile responsiveness** and accessibility compliance
- **Test cross-browser compatibility** and performance (<3 second load times)

### **🎯 Quality Gates**
Every implementation phase must meet:
- **Mobile Responsiveness**: All components work on mobile devices
- **Accessibility Compliance**: WCAG 2.1 AA standards met
- **Performance**: <3 second load times for all operations
- **Error Handling**: Graceful degradation and user-friendly error messages
- **API Resilience**: Exponential backoff handles rate limits and failures
- **Cost Efficiency**: Agent state caching reduces API costs significantly
- **Testing Coverage**: AWS CLI + User Web Testing for every change
- **Documentation**: Complete API and component documentation

### **📝 Documentation Updates Required**
After implementing atomic tools refactoring, **update documentation**:
- **/Users/saidachanda/development/dixon-smart-repair/development/current-state.md**:
  - Add new section "Atomic Tools Architecture" under Backend Implementation
  - Document confidence scoring system and iterative refinement patterns
  - Update tool integration documentation with new atomic tools
  - Add caching strategy and API resilience documentation
  - Update diagnostic accuracy improvements and contextual response capabilities
- **/Users/saidachanda/development/dixon-smart-repair/session-context.md**:
  - Add implementation entry with timestamp and technical details
  - Document architectural refactoring from orchestrator to atomic tools
  - Record LLM orchestration patterns and confidence-based iteration
  - Note API cost optimization through caching and retry logic
  - Update system capabilities with contextual cost response improvements

### **📋 Quality Requirements**
1. **Atomic Design**: Each tool must do exactly one thing
2. **Real API Calls**: No fake data or simulated responses
3. **Structured Output**: Return data that LLM can process intelligently
4. **Error Handling**: Graceful fallbacks when APIs fail
5. **Documentation**: Comprehensive docstrings for LLM tool selection
6. **Testing**: Verify tools work independently and in combination

## 🎯 **Success Criteria - UPDATED**

### **Functional Success**
- ✅ LLM automatically selects appropriate atomic tools
- ✅ Contextual cost responses reference established diagnosis
- ✅ No hard-coded workflows in tools
- ✅ Tools can be combined flexibly for different scenarios
- ✅ Real-time data from NHTSA and web sources
- ✅ **Confidence-based iteration**: Tools achieve >90% confidence through refinement
- ✅ **API cost optimization**: Caching reduces redundant API calls
- ✅ **Retry resilience**: Exponential backoff handles API failures gracefully

### **Architectural Success**
- ✅ No tool orchestrates other tools
- ✅ Each tool has single, clear responsibility
- ✅ LLM provides all orchestration intelligence
- ✅ Maximum tool reusability across scenarios
- ✅ Clean separation of concerns
- ✅ **Consistent hybrid pattern**: All tools follow atomic + confidence scoring pattern
- ✅ **Agent state integration**: Proper caching with appropriate TTLs
- ✅ **Error handling consistency**: All tools return structured error objects

### **User Experience Success**
- ✅ Cost responses reference conversation context
- ✅ Established diagnoses are leveraged for targeted pricing
- ✅ Ruled-out causes are mentioned appropriately
- ✅ Natural conversation flow maintained
- ✅ Accurate, current pricing information
- ✅ **Transparent refinement**: User understands when tools are refining searches
- ✅ **High accuracy results**: >90% confidence in final recommendations
- ✅ **Fast responses**: Caching provides quick responses for repeated queries

### **Technical Success**
- ✅ **API resilience**: Exponential backoff handles rate limits and failures
- ✅ **Cost efficiency**: Agent state caching reduces API costs significantly
- ✅ **Performance optimization**: Appropriate cache TTLs balance freshness and efficiency
- ✅ **Scalable architecture**: Easy to add new atomic tools following established patterns

## 🎯 **Expected Conversation Flow Examples**

### **Example 1: Contextual Cost Response**
```
User: "My 2024 Honda CRV won't start after jumpstart worked temporarily"
LLM: Uses automotive_symptom_analyzer → confidence=85%, needs refinement
LLM: Uses automotive_symptom_analyzer with refinement → confidence=92%
LLM: "Based on symptoms, likely battery or alternator issue..."

User: "What would it cost to fix?"
LLM: Uses web_search_parts_pricing("battery", "2024 Honda CRV") → confidence=88%
LLM: Uses web_search_parts_pricing("battery", "2024 Honda CRV", "EX-L") → confidence=93%
LLM: Uses web_search_parts_pricing("alternator", "2024 Honda CRV") → confidence=91%

Response: "Based on our diagnosis where the jumpstart worked temporarily, you're most likely looking at:
- Battery replacement: $150-200 (won't hold charge after jumpstart)
- Alternator replacement: $400-700 (not charging battery while driving)
Since jumpstart worked initially, we can rule out starter issues."
```

### **Example 2: Iterative Refinement**
```
User: "What do brake pads cost for my Honda?"
LLM: Uses web_search_parts_pricing("brake pads", "Honda") → confidence=45%
LLM: "I need more specific information. What year and model Honda?"

User: "2024 CRV"
LLM: Uses web_search_parts_pricing("brake pads", "2024 Honda CRV") → confidence=78%
LLM: Uses web_search_parts_pricing("brake pads", "2024 Honda CRV", "front ceramic") → confidence=94%

Response: "For your 2024 Honda CRV, front brake pads cost $89-$120 from AutoZone and RockAuto..."
```

## 🚨 **Critical Implementation Notes**

### **1. Preserve Existing Functionality**
- Don't break current VIN processing
- Maintain all existing API integrations
- Preserve business logic and contact information
- Keep error handling and fallback mechanisms

### **2. Gradual Refactoring Approach**
- Create new atomic tools first
- Test each atomic tool independently
- Update system prompt for new tool usage
- Remove orchestrator tools last
- Verify end-to-end functionality

### **3. Conversation Context Handling**
- LLM handles all conversation context analysis
- Tools receive specific parameters, not conversation history
- System prompt guides contextual response generation
- No hard-coded context logic in tools

## 📚 **Reference Materials**

### **Key Files to Modify**
- `/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/automotive_tools_enhanced.py`
- `/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/dixon_system_prompt.py`
- `/Users/saidachanda/development/dixon-smart-repair/development/strands-best-practices.md`

### **Strands Best Practices**
- Atomic tool design principles
- LLM orchestration patterns
- Tool composition through agent intelligence
- Single responsibility principle for tools

## ✅ **Clarifying Questions - RESOLVED**

All clarifying questions have been resolved through discussion:

### **1. API Integration Scope** ✅
**Decision**: Maintain existing API integrations (Tavily + NHTSA + Amazon Textract) in atomic tools

### **2. NHTSA Integration Details** ✅  
**Decision**: Use direct NHTSA API endpoints for atomic tools

### **3. Business Logic Preservation** ✅
**Decision**: Atomic tools return generic data without Dixon Smart Repair branding. LLM handles branding through system prompt guidance.

### **4. Implementation Strategy** ✅
**Decision**: Incremental approach - Add atomic tools first, test individually, then remove orchestrator tools gradually

### **5. Error Handling & Fallbacks** ✅
**Decision**: Tools return error objects with structured data for LLM to handle contextually

### **6. Data Sources Priority** ✅
**Decision**: Use Tavily general search (not domain-restricted) with hybrid approach and confidence scoring for all tools

### **7. Testing & Validation** ✅
**Decision**: Both individual tool testing AND end-to-end conversation testing

### **8. Performance & Limits** ✅
**Decision**: Implement exponential backoff retry logic for API limits and Agent State Caching for cost optimization

## 🎉 **Expected Outcomes**

After successful implementation:

### **Immediate Benefits**
- Contextual cost responses that reference established diagnosis
- Flexible tool usage adapted to conversation context
- No more generic "all possible causes" responses
- True agent intelligence in tool orchestration

### **Long-term Benefits**
- Easy addition of new atomic tools
- Reusable tools across different scenarios
- Maintainable, testable tool architecture
- Natural conversation flow with intelligent responses

### **User Experience Improvements**
- "Based on our battery diagnosis, replacement costs..." instead of generic ranges
- References to ruled-out causes and established symptoms
- Contextual pricing that builds on conversation history
- Intelligent tool usage that adapts to user needs

---

**This prompt represents a fundamental architectural improvement that will enable true agent intelligence and contextual responses while following Strands best practices for atomic tool design and LLM orchestration.**
