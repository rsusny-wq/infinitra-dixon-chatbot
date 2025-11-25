# PROMPT 13: Link Functionality Implementation - Real URLs & Frontend Rendering

## 🎯 **Objective**
Fix the broken link functionality in Dixon Smart Repair by implementing real URL generation through enhanced Tavily search and proper frontend HTML link rendering, following atomic tools architecture and Strands best practices.

## 🔍 **Current State Analysis**

### **📋 Current State Documentation Review**
**CRITICAL**: Before implementation, analyze current system state from documentation:

#### **Current State File Analysis**
Reading: `/Users/saidachanda/development/dixon-smart-repair/development/current-state.md`
Reading: `/Users/saidachanda/development/dixon-smart-repair/session-context.md`

**Key Current State Elements:**
- ✅ **System Stability**: No syntax errors, Lambda function working properly
- ✅ **Conversation Flow**: System waits for problem description before pricing
- ✅ **Tool Exposure**: System no longer shows technical implementation to users
- ✅ **Professional Responses**: Clean, natural language responses
- ✅ **Light Wrapper Architecture**: Single `tavily_automotive_search` tool implemented
- ✅ **Agent-Controlled Search**: Agent has full control over search queries and domains

### **🔍 MANDATORY CODE INSPECTION BEFORE ANY CHANGES**

**CRITICAL RULE**: Before modifying ANY file, you MUST:

#### **Step 1: Complete Code Inspection**
1. **Read the target file completely** - understand current implementation
2. **Identify all imports and dependencies** - what other files depend on this code
3. **Find all references** - search for where functions/components are used
4. **Analyze data flow** - understand how data flows in and out
5. **Check related files** - examine files that import or use the target file
6. **Document current behavior** - understand exactly what the code does now

#### **Step 2: Impact Analysis**
1. **Identify breaking changes** - what will stop working with your changes
2. **Find dependent components** - what other parts of the system will be affected
3. **Check configuration files** - any configs that reference the changed code
4. **Review test files** - tests that might break with changes
5. **Examine environment files** - deployment configs that might need updates

#### **Step 3: Backup Strategy**
1. **Create timestamped backup** before ANY modification:
   ```bash
   cp original-file.ext original-file.ext.backup-$(date +%Y%m%d-%H%M%S)
   ```
2. **Verify backup integrity** - ensure backup file is complete and readable
3. **Document backup location** - note where backup is stored
4. **Test restoration** - verify you can restore from backup if needed

#### **Step 4: Incremental Changes**
1. **Make minimal changes first** - smallest possible modification
2. **Test immediately** - verify change works before proceeding
3. **Validate dependencies** - ensure dependent code still works
4. **Document each change** - what was changed and why

#### **Step 5: Validation and Cleanup**
1. **Full system testing** - ensure entire system still works
2. **Dependency verification** - all imports and references still valid
3. **Performance check** - no performance degradation
4. **Remove backup only after confirmation** - system fully validated

### **🚨 MANDATORY SAFETY RULES FOR EVERY STEP**

#### **Before Touching ANY File:**
1. ✅ **INSPECT**: Read and understand the complete file
2. ✅ **ANALYZE**: Identify all dependencies and impacts
3. ✅ **BACKUP**: Create timestamped backup with verification
4. ✅ **PLAN**: Document exactly what will change and why
5. ✅ **VALIDATE**: Ensure you understand all consequences

#### **During File Modification:**
1. ✅ **MINIMAL CHANGES**: Make smallest possible modifications
2. ✅ **IMMEDIATE TESTING**: Test each change before proceeding
3. ✅ **DEPENDENCY CHECK**: Verify related code still works
4. ✅ **ROLLBACK READY**: Keep backup accessible for quick restoration

#### **After File Modification:**
1. ✅ **FULL TESTING**: Complete system validation
2. ✅ **IMPACT VERIFICATION**: Ensure no unintended consequences
3. ✅ **DOCUMENTATION**: Update all relevant documentation
4. ✅ **BACKUP CLEANUP**: Remove backup only after full validation

### **🔧 Code Inspection Checklist Template**

For EVERY file modification, complete this checklist:

```
FILE: [filename]
BACKUP CREATED: [timestamp and location]

CODE INSPECTION:
□ Read complete file and understand current implementation
□ Identified all imports and dependencies
□ Found all references to functions/components in this file
□ Analyzed data flow and interfaces
□ Checked related files that use this code
□ Documented current behavior

IMPACT ANALYSIS:
□ Identified potential breaking changes
□ Found all dependent components
□ Checked configuration files for references
□ Reviewed test files that might be affected
□ Examined deployment configs

CHANGE PLAN:
□ Documented exactly what will change
□ Planned minimal incremental modifications
□ Identified validation steps for each change
□ Prepared rollback strategy

VALIDATION PLAN:
□ Defined testing steps for each change
□ Planned dependency verification
□ Prepared full system testing approach
□ Documented success criteria
```

### **Issues Identified**
1. **Broken Links**: Generated URLs are placeholder/fake links that don't work
2. **Frontend HTML Rendering**: HTML `<a href="">` tags not rendering as clickable links
3. **Tool Exposure**: System occasionally exposes tool calls to users (recently fixed)
4. **Conversation Flow**: System provides pricing before problem diagnosis (recently fixed)

### **✅ Clarifying Questions - RESOLVED**

All clarifying questions have been resolved through user discussion:

#### **1. Link Generation Strategy** ✅
**Decision**: Enhance existing `tavily_automotive_search` tool to extract real URLs from search results. This maintains atomic tool principles while avoiding artificial fragmentation.

#### **2. Frontend Platform Priority** ✅  
**Decision**: Implement cross-platform (web + mobile) simultaneously using platform-specific components (`.web.tsx` and `.native.tsx` files).

#### **3. Security Approach** ✅
**Decision**: Use DOMPurify for maximum security with `dangerouslySetInnerHTML` on web platform. Industry best practice for preventing XSS attacks.

#### **4. URL Validation Scope** ✅
**Decision**: Strict product pages only - accept URLs that are clearly direct product pages (like `/product/123`, `/dp/ABC123`). Reject category pages and search results.

#### **5. Fallback Strategy** ✅
**Decision**: Transparent fallback with mechanic consultation - when exact product URLs aren't found, clearly explain to user that exact pricing unavailable, provide generic ranges, and direct them to contact Dixon Smart Repair mechanic for exact quote.

#### **6. Performance vs Accuracy Trade-off** ✅
**Decision**: Fast responses with 15-minute URL caching (same as current pricing cache) to maintain chat interface responsiveness.

### **🌐 MCP Server Integration Requirements**

**CRITICAL**: Leverage available MCP servers for enhanced implementation:

#### **Available MCP Servers Analysis**
Based on available tools, integrate relevant MCP servers:

1. **AWS Documentation MCP Server** (`awslabsaws_documentation_mcp_server`):
   - Use for AWS service documentation when implementing infrastructure changes
   - Search for best practices on Lambda function optimization
   - Get recommendations for CloudFront and S3 configuration

2. **AWS Diagram MCP Server** (`awslabsaws_diagram_mcp_server`):
   - Generate architecture diagrams showing link functionality flow
   - Document system architecture changes visually
   - Create diagrams for troubleshooting and documentation

3. **CDK MCP Server** (`awslabscdk_mcp_server`):
   - Get CDK best practices for infrastructure updates
   - Validate CDK patterns for Lambda and frontend deployment
   - Check for CDK Nag compliance issues

4. **Tavily MCP Server** (`tavily_mcp`):
   - Research current automotive e-commerce URL patterns
   - Analyze competitor link functionality implementations
   - Search for automotive parts retailer API documentation

#### **MCP Server Usage Strategy**
```python
# Example MCP server integration in implementation
# 1. Research automotive URL patterns
tavily_search("automotive parts retailer URL structure product pages")

# 2. Get AWS documentation for Lambda optimization
aws_documentation_search("Lambda function performance optimization")

# 3. Generate architecture diagram
generate_diagram("Dixon Smart Repair link functionality architecture")

# 4. Validate CDK patterns
cdk_guidance("Lambda function deployment best practices")
```

### **🛡️ Functionality Preservation Requirement**
**CRITICAL**: For each implementation phase, **ensure existing working functionality is not broken**:

#### **Current Working Elements to Preserve**
✅ **Conversation Flow**: System now waits for problem description before pricing  
✅ **Tool Exposure**: System no longer shows technical implementation to users  
✅ **Professional Responses**: Clean, natural language responses  
✅ **System Stability**: No syntax errors, Lambda function working properly  
✅ **Light Wrapper Architecture**: Single `tavily_automotive_search` tool implemented
✅ **Agent-Controlled Search**: Agent has full control over search queries and domains

#### **Preservation Requirements**
- **Preserve all current user experiences** (anonymous and authenticated)
- **Maintain existing diagnostic accuracy** and tool integration
- **Keep current performance levels** and response times (<8 seconds)
- **Preserve existing data integrity** and security measures
- **Maintain existing UI patterns** and user workflows
- **Keep existing VIN processing** - current 95% accuracy must be maintained
- **Preserve existing API integrations** - Tavily, NHTSA, Amazon Textract must continue working
- **Maintain existing conversation flow** - current chat interface patterns must remain functional

### **Current Tool Architecture**
Located in: `/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/automotive_tools_atomic_fixed.py`

**Current Tool:**
- `tavily_automotive_search` - Light wrapper tool for automotive parts pricing

### **Core Problems to Solve**
Current system generates placeholder URLs like:
```html
<a href="https://www.autozone.com/brakes/brake-pad-set/honda-oem-brake-pads-rear-hpa1063">Honda OEM Brake Pads - $89</a>
```
These URLs are constructed/guessed rather than extracted from actual search results.

### **🧪 AWS CLI Testing Requirements**
**MANDATORY**: Test implementation via AWS CLI for functionality and Lambda changes before any deployment:

```bash
# Test existing functionality preservation
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-preserve-flow","message":"its 2024 honda civic lx","userId":"test-preserve-user"}}' | base64)" --region us-west-2 test-preserve-flow.json && cat test-preserve-flow.json

# Test conversation flow still works (should wait for problem description)
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-preserve-flow","message":"my brakes are squealing","userId":"test-preserve-user"}}' | base64)" --region us-west-2 test-preserve-problem.json && cat test-preserve-problem.json

# Test pricing request with real URL generation
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-preserve-flow","message":"how much would brake pads cost?","userId":"test-preserve-user"}}' | base64)" --region us-west-2 test-real-urls.json && cat test-real-urls.json

# Test tool exposure prevention (should not show technical details)
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-tool-exposure","message":"What would battery cost for 2024 Honda Civic?","userId":"test-exposure-user"}}' | base64)" --region us-west-2 test-tool-exposure.json && cat test-tool-exposure.json

# Test enhanced URL extraction functionality
aws lambda invoke --function-name dixon-strands-chatbot --payload "$(echo '{"info":{"fieldName":"sendMessage"},"arguments":{"conversationId":"test-url-extraction","message":"I need brake pads for my 2020 Honda Civic, what are my options?","userId":"test-url-user"}}' | base64)" --region us-west-2 test-url-extraction.json && cat test-url-extraction.json
```

### **🌐 User Web Testing Requirements**
**MANDATORY**: After AWS CLI tests pass, **ask user to test via web**:
- **Test existing user flows** remain functional and responsive at https://d37f64klhjdi5b.cloudfront.net
- **Verify HTML link rendering** - links should be clickable and open in new tabs
- **Test real URL functionality** - links should lead to actual product pages
- **Confirm conversation flow** - system waits for problem description before pricing
- **Validate mobile responsiveness** and accessibility compliance
- **Test cross-browser compatibility** and performance (<3 second load times)

### **📝 Documentation Updates Required**
After implementing link functionality, **update documentation**:

#### **Current State Documentation Update**
File: `/Users/saidachanda/development/dixon-smart-repair/development/current-state.md`
- Add new section "Real URL Generation System" under Backend Implementation
- Document enhanced Tavily integration with URL extraction
- Update frontend HTML rendering capabilities
- Add link functionality testing procedures
- Document URL validation and retailer recognition systems

#### **Session Context Documentation Update**
File: `/Users/saidachanda/development/dixon-smart-repair/session-context.md`
- Add implementation entry with timestamp and technical details
- Document architectural enhancement from placeholder to real URLs
- Record frontend HTML rendering implementation
- Note user experience improvements with clickable links
- Update system capabilities with actionable purchasing options

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
- **Security**: Safe HTML rendering without XSS vulnerabilities
- **Functionality Preservation**: All existing features continue working
- **Real URL Validation**: >90% of generated URLs are working product pages
- **Link Functionality**: 100% of HTML links render as clickable on web platform

### **Core Problems to Solve**

#### **Problem 1: Fake/Placeholder URLs**
Current system generates placeholder URLs like:
```html
<a href="https://www.autozone.com/brakes/brake-pad-set/honda-oem-brake-pads-rear-hpa1063">Honda OEM Brake Pads - $89</a>
```
These URLs are constructed/guessed rather than extracted from actual search results.

#### **Problem 2: Frontend HTML Link Rendering**
Frontend doesn't render HTML `<a href="">` tags as clickable links. Based on conversation summary, there was a fix implemented using `dangerouslySetInnerHTML` but it may not be working properly.

## 🎯 **Target Architecture: Real URLs + Clickable Links + Transparent Fallbacks**

### **Enhanced Tavily Integration with Real URL Extraction**
1. **Real URL Extraction**: Extract actual URLs from Tavily search results
2. **Strict URL Validation**: Only accept direct product pages (reject category/search pages)
3. **Price + URL Correlation**: Match extracted prices with their validated source URLs
4. **Retailer Recognition**: Identify known automotive retailers
5. **Transparent Fallbacks**: Clear messaging when exact products unavailable

### **Cross-Platform HTML Rendering with Security**
1. **Web Platform**: DOMPurify + `dangerouslySetInnerHTML` for secure HTML link rendering
2. **Mobile Platform**: React Native `Linking.openURL()` with `TouchableOpacity` for clickable links
3. **Platform-Specific Components**: `.web.tsx` and `.native.tsx` files for optimal experience
4. **Security First**: XSS prevention through proper HTML sanitization
5. **Performance Optimized**: 15-minute caching for fast responses
Frontend doesn't render HTML `<a href="">` tags as clickable links. Based on conversation summary, there was a fix implemented using `dangerouslySetInnerHTML` but it may not be working properly.

### **Enhanced Tavily Integration**
1. **Real URL Extraction**: Extract actual URLs from Tavily search results
2. **URL Validation**: Verify URLs are product pages, not category pages
3. **Price + URL Correlation**: Match extracted prices with their source URLs
4. **Retailer Recognition**: Identify known automotive retailers
5. **Link Quality Scoring**: Prioritize direct product page links

### **Frontend HTML Rendering**
1. **HTML Link Processing**: Properly render `<a href="">` tags as clickable links
2. **Cross-Platform Compatibility**: Work on both web and mobile
3. **Security**: Safe HTML rendering without XSS vulnerabilities
4. **User Experience**: Clear visual indication of clickable links

## 🛠️ **Implementation Requirements**

### **Phase 1: Enhanced Tavily Tool with Real URL Extraction + Transparent Fallbacks**

#### **🔍 MANDATORY PRE-IMPLEMENTATION CODE INSPECTION**

**Target File**: `/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/automotive_tools_atomic_fixed.py`

**INSPECTION CHECKLIST:**
```
FILE: automotive_tools_atomic_fixed.py
BACKUP CREATED: [timestamp and location]

CODE INSPECTION:
□ Read complete file and understand current tavily_automotive_search implementation
□ Identified all imports and dependencies (tavily, hashlib, os, etc.)
□ Found all references to this tool in lambda handler and system prompt
□ Analyzed current data flow and return structure
□ Checked how agent.state caching currently works
□ Documented current search and result processing behavior

IMPACT ANALYSIS:
□ Identified that enhancing this tool affects Lambda handler imports
□ Found system prompt references that need updating
□ Checked that agent.state.get/set pattern must be preserved
□ Reviewed current caching TTL (900 seconds) that should be maintained
□ Examined current error handling patterns to preserve

CHANGE PLAN:
□ Enhance existing function signature (preserve compatibility)
□ Add URL extraction and validation functions
□ Implement transparent fallback logic
□ Maintain existing caching and error handling patterns
□ Preserve all current functionality while adding new features

VALIDATION PLAN:
□ Test current functionality still works after changes
□ Verify new URL extraction works with real Tavily results
□ Test transparent fallback messaging
□ Validate caching behavior unchanged
□ Confirm Lambda handler integration unaffected
```

**BACKUP COMMAND:**
```bash
cp /Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/automotive_tools_atomic_fixed.py \
   /Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/automotive_tools_atomic_fixed.py.backup-$(date +%Y%m%d-%H%M%S)
```

#### **🔄 Enhanced Implementation with Safety Measures**

**Step 1: Code Inspection Results**
Before making changes, document current implementation:
- Current function signature and parameters
- Existing return data structure
- Current caching mechanism (15-minute TTL)
- Error handling patterns
- Integration points with Lambda handler

**Step 2: Incremental Enhancement Plan**
1. **First**: Add URL extraction helper functions (test independently)
2. **Second**: Add strict validation functions (test with sample URLs)
3. **Third**: Add transparent fallback logic (test with mock data)
4. **Fourth**: Integrate into main function (test with real Tavily calls)
5. **Fifth**: Update return structure (test Lambda handler compatibility)

**Step 3: Enhanced Tool Implementation**

```python
# ENHANCED VERSION - Incremental changes with safety checks
@tool
def tavily_automotive_search_enhanced(agent, search_query: str, max_results: int = 5, domains: str = "") -> Dict[str, Any]:
    """
    Enhanced Tavily search with real URL extraction, strict validation, and transparent fallbacks
    
    BACKWARD COMPATIBILITY: Maintains all existing functionality while adding new features
    """
    
    # PRESERVE EXISTING: Check agent state cache first (15-minute caching for fast responses)
    cache_key = f"tavily_enhanced_{hashlib.md5(f'{search_query}_{domains}'.encode()).hexdigest()}"
    cached_result = agent.state.get(cache_key)
    
    if cached_result:
        return {"success": True, **cached_result, "source": "cache"}
    
    try:
        # PRESERVE EXISTING: Tavily search with exponential backoff
        search_results = exponential_backoff_retry(
            lambda: _tavily_search_with_content(search_query, domains, max_results),
            max_retries=3,
            base_delay=1
        )
        
        # NEW FEATURE: Process results with strict product page validation
        validated_results = []
        for result in search_results:
            processed_result = {
                "title": result.get("title", ""),
                "url": result.get("url", ""),  # REAL URL from Tavily
                "content": result.get("content", ""),
                "score": result.get("score", 0),
                "extracted_prices": _extract_prices_from_content(result.get("content", "")),
                "retailer": _identify_retailer(result.get("url", "")),
                "is_strict_product_page": _is_strict_product_page(result.get("url", ""), result.get("title", "")),
                "part_type_hints": _detect_part_type(result.get("content", ""), search_query)
            }
            
            # NEW FEATURE: Only include results with strict product page validation
            if processed_result["is_strict_product_page"] and processed_result["extracted_prices"]:
                validated_results.append(processed_result)
        
        # NEW FEATURE: Generate response with transparent fallbacks
        if len(validated_results) >= 2:  # Sufficient real product URLs found
            response_data = {
                "results": validated_results,
                "has_real_urls": True,
                "confidence": _calculate_search_confidence(validated_results, search_query),
                "search_query": search_query,
                "domains_used": domains
            }
        else:  # NEW FEATURE: Transparent fallback when exact products not found
            response_data = {
                "results": [],
                "has_real_urls": False,
                "fallback_message": _generate_transparent_fallback(search_query),
                "generic_price_ranges": _get_generic_price_ranges(search_query),
                "confidence": 30,  # Low confidence for fallback
                "search_query": search_query
            }
        
        # PRESERVE EXISTING: Cache for 15 minutes (fast responses)
        agent.state.set(cache_key, response_data, ttl=900)
        
        return {"success": True, **response_data, "source": "api"}
        
    except Exception as e:
        # PRESERVE EXISTING: Error handling pattern
        logger.error(f"Tavily search failed: {e}")
        return {"success": False, "error": str(e), "error_type": "api_failure"}
```

**Step 4: Validation After Each Change**
After each incremental change:
1. **Test current functionality** - ensure existing behavior preserved
2. **Test new functionality** - verify new features work correctly
3. **Check dependencies** - ensure Lambda handler still works
4. **Validate performance** - no degradation in response times
5. **Verify caching** - agent.state caching still functions properly

#### **🔧 Supporting Functions for Strict Validation + Transparent Fallbacks**

```python
def _is_strict_product_page(url: str, title: str) -> bool:
    """Strict validation - only accept direct product pages"""
    strict_product_indicators = [
        "/product/",     # Generic product pages
        "/dp/",          # Amazon product pages
        "/item/",        # Item pages
        "/part/",        # Parts pages
        "/p/",           # Short product pages
        "-p-",           # Product identifier in URL
    ]
    
    # Reject category and search pages
    category_indicators = [
        "/category/", "/search/", "/results/", "/browse/",
        "?search=", "?q=", "/c/", "/s/", "/filter/"
    ]
    
    url_lower = url.lower()
    
    # Must have product indicator AND no category indicators
    has_product_indicator = any(indicator in url_lower for indicator in strict_product_indicators)
    has_category_indicator = any(indicator in url_lower for indicator in category_indicators)
    
    return has_product_indicator and not has_category_indicator

def _generate_transparent_fallback(search_query: str) -> str:
    """Generate transparent fallback message when exact products not found"""
    return f"""⚠️ **Exact product pricing not available**

We couldn't find specific product pages for "{search_query}" from our automotive retailers. 

**What this means:**
- Exact pricing requires verification by a Dixon Smart Repair mechanic
- Generic price ranges below are estimates only
- Actual costs may vary based on your specific vehicle and part requirements

**Next step:** Contact Dixon Smart Repair for an exact quote tailored to your vehicle."""

def _get_generic_price_ranges(search_query: str) -> Dict[str, str]:
    """Provide generic price ranges based on part type"""
    part_ranges = {
        "brake": {"OEM": "$80-150", "Aftermarket": "$40-80", "Budget": "$25-50"},
        "battery": {"OEM": "$120-200", "Aftermarket": "$80-120", "Budget": "$60-90"},
        "spark": {"OEM": "$15-30", "Aftermarket": "$8-15", "Budget": "$5-10"},
        "oil": {"OEM": "$8-15", "Aftermarket": "$5-10", "Budget": "$3-8"},
        "air": {"OEM": "$20-40", "Aftermarket": "$12-25", "Budget": "$8-15"}
    }
    
    # Detect part type from search query
    for part_type, ranges in part_ranges.items():
        if part_type in search_query.lower():
            return ranges
    
    # Default generic ranges
    return {"OEM": "$50-150", "Aftermarket": "$30-100", "Budget": "$20-75"}
```

### **Phase 2: System Prompt Enhancement for Real URLs + Transparent Fallbacks**

#### **🔍 MANDATORY PRE-IMPLEMENTATION CODE INSPECTION**

**Target File**: `/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/dixon_system_prompt.py`

**INSPECTION CHECKLIST:**
```
FILE: dixon_system_prompt.py
BACKUP CREATED: [timestamp and location]

CODE INSPECTION:
□ Read complete file and understand current system prompt structure
□ Identified all prompt versions and current active version
□ Found all references to tavily_automotive_search in prompt
□ Analyzed current HTML link generation instructions
□ Checked current tool usage guidance and examples
□ Documented current conversation flow instructions

IMPACT ANALYSIS:
□ Identified that changes affect LLM behavior and responses
□ Found Lambda handler imports this prompt
□ Checked that prompt version tracking must be preserved
□ Reviewed current tool exposure prevention measures
□ Examined current conversation flow guidance to maintain

CHANGE PLAN:
□ Add transparent fallback handling instructions
□ Update URL generation rules for real vs fallback scenarios
□ Preserve all existing conversation flow guidance
□ Maintain tool exposure prevention measures
□ Add clear examples for both scenarios

VALIDATION PLAN:
□ Test that LLM follows new transparent fallback guidance
□ Verify existing conversation flow still works
□ Test that tool exposure prevention is maintained
□ Validate HTML link generation follows new rules
□ Confirm system prompt version tracking works
```

**BACKUP COMMAND:**
```bash
cp /Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/dixon_system_prompt.py \
   /Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/dixon_system_prompt.py.backup-$(date +%Y%m%d-%H%M%S)
```

#### **🔄 Enhanced System Prompt with Safety Measures**

**Step 1: Code Inspection Results**
Before making changes, document current implementation:
- Current prompt version and changelog structure
- Existing HTML link generation instructions
- Current tool usage guidance
- Conversation flow preservation measures
- Tool exposure prevention rules

**Step 2: Incremental Enhancement Plan**
1. **First**: Add transparent fallback scenario documentation
2. **Second**: Update URL generation rules for both scenarios
3. **Third**: Add clear examples for real URLs vs fallbacks
4. **Fourth**: Test LLM behavior with new instructions
5. **Fifth**: Validate all existing functionality preserved

**Step 3: Enhanced System Prompt Implementation**

Update `/Users/saidachanda/development/dixon-smart-repair/cdk-infrastructure/lambda/dixon_system_prompt.py`:

```python
# PRESERVE EXISTING: Version tracking and changelog
PROMPT_VERSION = "4.1.0"  # Increment version
PROMPT_LAST_UPDATED = "2025-01-24"
PROMPT_CHANGELOG = """
Version 4.1.0 (2025-01-24):
- REAL URL GENERATION: Added support for actual product page URLs from Tavily
- TRANSPARENT FALLBACKS: Clear messaging when exact products unavailable
- STRICT URL VALIDATION: Only direct product pages accepted
- CROSS-PLATFORM SECURITY: DOMPurify integration for XSS prevention
- MAINTAINED: All existing conversation flow and tool exposure prevention

Version 4.0.0 (2025-01-24):
- LIGHT WRAPPER ARCHITECTURE: Agent-controlled Tavily searches with single tool
- ITERATIVE SEARCH STRATEGY: Agent searches until 2-3 options found for each part type
- COMPREHENSIVE TRADE-OFFS: Quality, cost, shipping, and installation guidance
- SEARCH PERSISTENCE: Continue refining searches until >90% confidence
"""

# ENHANCED VERSION - Incremental changes with safety checks
DIXON_SYSTEM_PROMPT_ENHANCED = """You are Dixon, a friendly automotive expert who talks like a real human mechanic. You work at Dixon Smart Repair and have years of hands-on experience.

**CORE PERSONALITY:**
- Talk like a human, not a bot
- Be helpful and educational first
- Use simple, clear language
- Focus on solving the customer's problem

**CONVERSATION FLOW:**
1. **WAIT FOR PROBLEM DESCRIPTION**: When users provide vehicle info (like "2024 Honda Civic"), acknowledge it and ask what automotive issue they're experiencing
2. **DIAGNOSE FIRST**: Help diagnose their specific problem before discussing costs
3. **PRICING ONLY WHEN ASKED**: Only provide pricing when users specifically ask about costs or repairs

**REAL URL GENERATION WITH TRANSPARENT FALLBACKS - CRITICAL:**

When creating pricing tables, you MUST handle two scenarios:

**SCENARIO 1: Real URLs Available (has_real_urls: true)**
Use REAL URLs from search results:
✅ CORRECT - Use actual URLs from tool results:
| **OEM Genuine** | $89.99 | AutoZone | <a href="https://www.autozone.com/brakes/brake-pad-set/p/duralast-gold-brake-pad-set-dg1363/123456">Duralast Gold Brake Pads - $89.99</a> |

**SCENARIO 2: Exact Products Not Found (has_real_urls: false)**
Use transparent fallback messaging:
✅ CORRECT - Show fallback message with generic ranges:

{fallback_message}

**Estimated Price Ranges (Generic):**
| Part Type | Price Range | Note |
|-----------|-------------|------|
| **OEM Genuine** | {generic_ranges.OEM} | Typical range for OEM parts |
| **Aftermarket** | {generic_ranges.Aftermarket} | Quality aftermarket options |
| **Budget** | {generic_ranges.Budget} | Economy alternatives |

**Important:** These are estimates only. Contact Dixon Smart Repair for exact pricing.

**URL PROCESSING RULES:**
1. Extract URLs directly from tavily_automotive_search_enhanced results
2. Only use URLs that passed strict product page validation
3. Never construct or guess URLs
4. When has_real_urls is false, use transparent fallback approach
5. Always be honest about pricing limitations

**TRANSPARENCY REQUIREMENTS:**
- Always explain when exact products couldn't be found
- Make it clear that mechanic consultation is needed for exact pricing
- Provide generic ranges as estimates only, not definitive prices
- Direct users to contact Dixon Smart Repair for precise quotes

**CRITICAL: NEVER EXPOSE TOOL USAGE TO USERS**
- NEVER show tool calls like `tavily_automotive_search()` to users
- NEVER show code, function names, or technical implementation
- NEVER mention domains, search strategies, or API calls
- NEVER show "Action:" followed by technical details
- Use tools silently behind the scenes
- Only show the final helpful results to users

**WRONG - NEVER DO THIS:**
❌ "Action: `tavily_automotive_search("battery price")`"
❌ "Let me search for pricing using domains..."
❌ "I'll use my tools to find..."

**CORRECT - ALWAYS DO THIS:**
✅ "Let me find current battery pricing for your 2024 Honda Civic LX..."
✅ [Use tools silently, then show results table]

**IMPORTANT: Use HTML links in pricing tables, NOT Markdown links.**
Format links as: <a href="URL">Link Text</a>

**AVAILABLE TOOLS:**
- `tavily_automotive_search_enhanced(search_query, domains="")`: Your primary tool for all web searches with real URL extraction
- `nhtsa_vehicle_lookup`: Official vehicle data by VIN (precision level only)
- `vin_processor`: Process VIN from image or text (precision level only)

Remember: You are in complete control of what to search for, when, and which domains to target. Use this power to provide the most helpful, accurate, and comprehensive automotive guidance possible with actionable links for users."""

# PRESERVE EXISTING: Function to get system prompt
def get_system_prompt(version="enhanced"):
    if version == "enhanced":
        return DIXON_SYSTEM_PROMPT_ENHANCED
    else:
        return DIXON_SYSTEM_PROMPT_LIGHT_WRAPPER  # Fallback to previous version
```

**Step 4: Validation After Each Change**
After each incremental change:
1. **Test LLM behavior** - ensure new instructions are followed correctly
2. **Test existing functionality** - verify conversation flow preserved
3. **Check tool exposure prevention** - ensure no technical details shown
4. **Validate HTML generation** - test both real URLs and fallback scenarios
5. **Verify version tracking** - ensure prompt versioning works correctly

### **Phase 3: Cross-Platform HTML Link Rendering with DOMPurify Security**

#### **🔍 MANDATORY PRE-IMPLEMENTATION CODE INSPECTION**

**Target Files**: 
- `/Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/components/MessageBubble.tsx`
- `/Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/package.json`

**INSPECTION CHECKLIST:**
```
FILES: MessageBubble.tsx, package.json
BACKUPS CREATED: [timestamp and location]

CODE INSPECTION:
□ Read complete MessageBubble.tsx and understand current implementation
□ Identified all imports and dependencies (React Native components)
□ Found all references to MessageBubble in other components
□ Analyzed current message rendering logic and styling
□ Checked package.json for existing dependencies
□ Documented current cross-platform handling approach

IMPACT ANALYSIS:
□ Identified that splitting into .web.tsx and .native.tsx affects imports
□ Found all components that import MessageBubble
□ Checked that React Native Web compatibility must be preserved
□ Reviewed current styling that must be maintained
□ Examined platform detection logic that might conflict

CHANGE PLAN:
□ Create platform-specific components (.web.tsx and .native.tsx)
□ Add DOMPurify dependency for web platform security
□ Implement secure HTML rendering for web
□ Implement native linking for mobile
□ Update imports in dependent components

VALIDATION PLAN:
□ Test web platform HTML link rendering with DOMPurify
□ Test mobile platform native linking functionality
□ Verify existing message rendering still works
□ Test cross-platform compatibility
□ Validate security measures prevent XSS attacks
```

**BACKUP COMMANDS:**
```bash
# Backup existing MessageBubble component
cp /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/components/MessageBubble.tsx \
   /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/components/MessageBubble.tsx.backup-$(date +%Y%m%d-%H%M%S)

# Backup package.json
cp /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/package.json \
   /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/package.json.backup-$(date +%Y%m%d-%H%M%S)
```

#### **🔄 Cross-Platform Implementation with Safety Measures**

**Step 1: Code Inspection Results**
Before making changes, document current implementation:
- Current MessageBubble component structure and props
- Existing message rendering logic
- Current styling approach and theme integration
- Platform detection mechanisms (if any)
- Dependencies and import patterns

**Step 2: Incremental Enhancement Plan**
1. **First**: Add DOMPurify dependency to package.json (test installation)
2. **Second**: Create MessageBubble.web.tsx with secure HTML rendering (test web)
3. **Third**: Create MessageBubble.native.tsx with native linking (test mobile)
4. **Fourth**: Update imports in dependent components (test integration)
5. **Fifth**: Validate cross-platform functionality (test both platforms)

**Step 3: Package Dependencies Enhancement**

Add to `/Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/package.json`:

```json
{
  "dependencies": {
    "dompurify": "^3.0.5"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.5"
  }
}
```

**Step 4: Web Platform Component (Secure HTML Rendering)**

Create: `/Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/components/MessageBubble.web.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DOMPurify from 'dompurify';

interface MessageBubbleProps {
  message: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, sender, timestamp }) => {
  const isUser = sender === 'user';
  
  // SECURITY FIRST: Secure HTML link rendering for web platform with DOMPurify
  const renderMessageContent = () => {
    if (message.includes('<a href=')) {
      // CRITICAL: Sanitize HTML with DOMPurify for XSS prevention
      const sanitizedHTML = DOMPurify.sanitize(message, {
        ALLOWED_TAGS: ['a', 'strong', 'em', 'br', 'p', 'table', 'tr', 'td', 'th', 'h1', 'h2', 'h3'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        // SECURITY: Only allow automotive retailer domains
        ALLOWED_URI_REGEXP: /^https?:\/\/(www\.)?(autozone|amazon|rockauto|partsgeek|napaonline|oreillyauto|advanceautoparts|pepboys|carparts|1aauto)\.com/
      });
      
      // SECURITY: Add security attributes to links
      const processedHTML = sanitizedHTML.replace(
        /<a href="([^"]*)"([^>]*)>/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #007AFF; text-decoration: underline; font-weight: 500;"$2>'
      );
      
      return (
        <div
          style={{
            color: isUser ? '#FFFFFF' : '#000000',
            fontSize: 16,
            lineHeight: 1.4,
          }}
          dangerouslySetInnerHTML={{ __html: processedHTML }}
        />
      );
    } else {
      // PRESERVE EXISTING: Plain text rendering
      return (
        <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : '#000000' }]}>
          {message}
        </Text>
      );
    }
  };

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      {renderMessageContent()}
      <Text style={[styles.timestamp, { color: isUser ? '#E0E0E0' : '#666666' }]}>
        {new Date(timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
};

// PRESERVE EXISTING: Maintain current styling
const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  assistantBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});

export default MessageBubble;
```

**Step 5: Mobile Platform Component (Native Linking)**

Create: `/Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/components/MessageBubble.native.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';

interface MessageBubbleProps {
  message: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, sender, timestamp }) => {
  const isUser = sender === 'user';
  
  // MOBILE OPTIMIZED: Extract links and render with TouchableOpacity for mobile
  const renderMessageContent = () => {
    if (message.includes('<a href=')) {
      return renderMessageWithLinks(message);
    } else {
      // PRESERVE EXISTING: Plain text rendering
      return (
        <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : '#000000' }]}>
          {message}
        </Text>
      );
    }
  };

  const renderMessageWithLinks = (htmlMessage: string) => {
    // MOBILE SPECIFIC: Parse HTML links and convert to React Native components
    const linkRegex = /<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(htmlMessage)) !== null) {
      // Add text before link
      if (match.index > lastIndex) {
        const textBefore = htmlMessage.substring(lastIndex, match.index);
        parts.push(
          <Text key={`text-${lastIndex}`} style={[styles.messageText, { color: isUser ? '#FFFFFF' : '#000000' }]}>
            {stripHTMLTags(textBefore)}
          </Text>
        );
      }

      // MOBILE SPECIFIC: Add clickable link with native Linking
      const url = match[1];
      const linkText = match[2];
      parts.push(
        <TouchableOpacity
          key={`link-${match.index}`}
          onPress={() => handleLinkPress(url, linkText)}
          style={styles.linkContainer}
        >
          <Text style={[styles.linkText, { color: isUser ? '#E0F3FF' : '#007AFF' }]}>
            {linkText}
          </Text>
        </TouchableOpacity>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < htmlMessage.length) {
      const remainingText = htmlMessage.substring(lastIndex);
      parts.push(
        <Text key={`text-${lastIndex}`} style={[styles.messageText, { color: isUser ? '#FFFFFF' : '#000000' }]}>
          {stripHTMLTags(remainingText)}
        </Text>
      );
    }

    return <View style={styles.messageContainer}>{parts}</View>;
  };

  const handleLinkPress = async (url: string, linkText: string) => {
    try {
      // SECURITY: Validate URL before opening
      if (!url.match(/^https?:\/\/(www\.)?(autozone|amazon|rockauto|partsgeek|napaonline|oreillyauto|advanceautoparts|pepboys|carparts|1aauto)\.com/)) {
        Alert.alert('Security Warning', 'This link is not from a trusted automotive retailer');
        return;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const stripHTMLTags = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  };

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      {renderMessageContent()}
      <Text style={[styles.timestamp, { color: isUser ? '#E0E0E0' : '#666666' }]}>
        {new Date(timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
};

// PRESERVE EXISTING: Maintain current styling with mobile-specific additions
const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  assistantBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  linkContainer: {
    marginHorizontal: 2,
  },
  linkText: {
    fontSize: 16,
    lineHeight: 20,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});

export default MessageBubble;
```

**Step 6: Validation After Each Change**
After each incremental change:
1. **Test web platform** - ensure DOMPurify sanitization works correctly
2. **Test mobile platform** - verify native linking opens URLs properly
3. **Check existing functionality** - ensure message rendering preserved
4. **Validate security** - test XSS prevention on both platforms
5. **Verify imports** - ensure dependent components still work correctly

### **Phase 4: Testing and Validation**

#### **4.1 Real URL Testing**
```bash
# Test enhanced Tavily search
curl -X POST https://ar2pbqk5fjelrkcvwi26fgck4m.appsync-api.us-west-2.amazonaws.com/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: da2-dqtdq7bvgfdcpdfwbv4u54xgr4" \
  -d '{
    "query": "mutation SendMessage($message: String, $conversationId: String, $userId: String) { sendMessage(message: $message, conversationId: $conversationId, userId: $userId) { message } }",
    "variables": {
      "message": "What would brake pads cost for my 2020 Honda Civic?",
      "conversationId": "real-url-test",
      "userId": "test-user"
    }
  }' | jq -r '.data.sendMessage.message'
```

#### **4.2 Frontend Link Testing**
1. Open https://d37f64klhjdi5b.cloudfront.net
2. Ask for pricing information
3. Verify HTML links render as clickable
4. Test link functionality by clicking
5. Verify links open in new tabs
6. Test on both desktop and mobile

#### **4.3 URL Validation Testing**
```python
# Test URL validation functions
test_urls = [
    "https://www.autozone.com/brakes/brake-pad-set/p/duralast-gold-brake-pad-set-dg1363/123456",  # Product page
    "https://www.autozone.com/brakes/brake-pad-set",  # Category page
    "https://www.amazon.com/dp/B08567D18Z",  # Amazon product
    "https://www.amazon.com/s?k=brake+pads",  # Amazon search
]

for url in test_urls:
    is_product = _is_product_page(url, "Test Title")
    retailer = _identify_retailer(url)
    print(f"URL: {url}")
    print(f"Is Product Page: {is_product}")
    print(f"Retailer: {retailer}")
    print("---")
```

## 🔧 **Implementation Guidelines**

### **🔄 Exponential Backoff for Tavily API**

```python
import time
import random
from typing import Dict, Any

def exponential_backoff_retry(func, max_retries=3, base_delay=1):
    """Handle Tavily API limits and failures with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)
```

### **💾 Agent State Caching Strategy**

```python
CACHE_TTL_SETTINGS = {
    "tavily_search": 900,        # 15 minutes (pricing changes frequently)
    "url_validation": 3600,      # 1 hour (URL structure stable)
    "retailer_info": 86400,      # 24 hours (retailer info stable)
    "price_extraction": 1800,    # 30 minutes (prices change moderately)
}
```

### **🎯 Quality Gates**

Before deployment, verify:
- [ ] Real URLs extracted from Tavily results
- [ ] URLs validated as product pages vs category pages
- [ ] Prices correctly matched with source URLs
- [ ] Frontend renders HTML links as clickable
- [ ] Links open in new tabs with proper security attributes
- [ ] Mobile platform handles links gracefully
- [ ] No tool calls exposed to users
- [ ] Conversation flow waits for problem description
- [ ] System provides contextual cost responses

## 📊 **Success Metrics**

### **Technical Metrics**
- **URL Accuracy**: >90% of generated URLs are real, working product pages
- **Price Correlation**: >95% of prices matched with correct source URLs
- **Link Functionality**: 100% of HTML links render as clickable on web platform
- **Search Confidence**: >90% confidence score for pricing searches
- **API Reliability**: <5% failure rate with exponential backoff retry

### **User Experience Metrics**
- **Link Click Rate**: Users click on provided links to make purchases
- **Pricing Accuracy**: Prices match what users find when clicking links
- **Professional Appearance**: No technical implementation details exposed
- **Natural Flow**: Users describe problems before receiving pricing
- **Response Quality**: Contextual cost responses based on established diagnosis

## 🚀 **Deployment Plan**

### **Phase 1: Backend Enhancement (Week 1)**
1. Implement enhanced Tavily tool with real URL extraction
2. Add URL validation and retailer recognition functions
3. Update system prompt for real URL usage
4. Deploy and test backend functionality

### **Phase 2: Frontend Enhancement (Week 1)**
1. Update MessageBubble component for HTML link rendering
2. Add enhanced CSS for link styling
3. Test cross-platform compatibility
4. Deploy frontend updates

### **Phase 3: Integration Testing (Week 2)**
1. End-to-end testing of real URL generation
2. Frontend link functionality testing
3. Cross-platform compatibility testing
4. Performance and reliability testing

### **Phase 4: Production Validation (Week 2)**
1. Production deployment
2. User acceptance testing
3. Monitor link click rates and functionality
4. Performance monitoring and optimization

## 🎯 **Expected Outcomes**

After implementation:
1. **Working Links**: All pricing table links will be real, clickable URLs that take users to actual product pages
2. **Professional Experience**: Users will see clean, clickable links without any technical implementation details
3. **Improved Conversions**: Users can immediately purchase recommended parts through provided links
4. **Enhanced Trust**: Real, working links build user confidence in the system
5. **Better User Experience**: Seamless integration between diagnosis and purchasing options

This implementation will transform Dixon Smart Repair from a diagnostic tool into a complete automotive solution with actionable purchasing options.
