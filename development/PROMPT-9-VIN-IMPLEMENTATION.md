# PROMPT 9: Enhanced Parts Selection & Cost Estimation Implementation

## 🎯 **Objective**
Implement an enhanced parts selection and cost estimation system that provides users with detailed part type options, trade-offs, and tailored pricing based on their preferences - triggered only when users specifically ask about repair costs.

## 📋 **Current System Analysis**

### **Existing Tools (Working)**
- `symptom_diagnosis_analyzer` - Diagnoses issues and identifies probable parts
- `parts_availability_lookup` - Basic parts availability checking
- `pricing_calculator` - Basic cost estimation
- VIN integration - 95% accuracy when VIN available

### **Current User Flow**
```
User: "car won't start" → Diagnosis → User: "how much to fix?" → Basic cost estimate
```

### **Target Enhanced Flow**
```
User: "car won't start" → Diagnosis → User: "how much to fix?" → 
Parts Selection Interface → User Preferences → Tailored Cost Estimate
```

## 🔧 **Implementation Requirements**

### **1. Enhanced Parts Selection Tool**
Create a new tool `interactive_parts_selector` that:

**Input Parameters:**
- `probable_parts` - List of parts from diagnosis with replacement likelihood %
- `vehicle_data` - VIN data if available for precise part matching
- `user_budget_preference` - Optional budget range

**Output Structure:**
```python
{
    "parts_analysis": [
        {
            "part_name": "Brake Pads",
            "replacement_likelihood": "85%",
            "criticality": "high", # high/medium/low
            "part_type_options": [
                {
                    "type": "OEM",
                    "description": "Original factory parts",
                    "quality_rating": "excellent",
                    "warranty": "2-3 years",
                    "cost_range": "$80-120",
                    "pros": ["Perfect fit", "Best warranty"],
                    "cons": ["Most expensive"]
                },
                {
                    "type": "OEM Equivalent",
                    "description": "High-quality aftermarket",
                    "quality_rating": "very good",
                    "warranty": "1-2 years", 
                    "cost_range": "$45-75",
                    "pros": ["Good quality", "30-40% savings"],
                    "cons": ["Slightly shorter warranty"]
                },
                {
                    "type": "Budget Aftermarket",
                    "description": "Economy replacement parts",
                    "quality_rating": "adequate",
                    "warranty": "6-12 months",
                    "cost_range": "$25-45",
                    "pros": ["Lowest cost", "Basic functionality"],
                    "cons": ["Shorter lifespan", "Limited warranty"]
                }
            ],
            "recommendation": {
                "suggested_type": "OEM Equivalent",
                "reason": "Best balance of quality and cost for 2019 Honda Civic"
            }
        }
    ],
    "selection_prompt": "Which part types would you prefer? I can show you detailed options for each."
}
```

### **2. Enhanced Pricing Calculator**
Modify `pricing_calculator` to accept:

**New Input Parameters:**
- `selected_part_preferences` - User's part type choices
- `specific_parts_list` - Detailed parts with user selections

**Enhanced Output:**
```python
{
    "cost_breakdown": {
        "parts_cost": {
            "brake_pads_oem_equivalent": "$60",
            "brake_rotors_oem": "$85",
            "total_parts": "$145"
        },
        "labor_cost": {
            "brake_service": "$120",
            "total_labor": "$120"
        },
        "additional_costs": {
            "shop_supplies": "$15",
            "tax": "$22",
            "total_additional": "$37"
        },
        "total_estimate": "$302"
    },
    "cost_comparison": {
        "if_all_oem": "$385",
        "if_all_budget": "$220",
        "your_selection": "$302",
        "savings_vs_oem": "$83 (22% savings)"
    },
    "options_summary": [
        {
            "option": "Option 1: Your Selection",
            "total": "$302",
            "parts": "Mix of OEM Equivalent & OEM",
            "value_rating": "excellent"
        },
        {
            "option": "Option 2: All OEM",
            "total": "$385", 
            "parts": "All Original Equipment",
            "value_rating": "premium"
        },
        {
            "option": "Option 3: Budget Mix",
            "total": "$220",
            "parts": "Economy aftermarket",
            "value_rating": "basic"
        }
    ]
}
```

### **3. Conversational Flow Integration**

**Trigger Logic:**
- Enhanced parts selection ONLY triggers when user asks about:
  - "How much will this cost?"
  - "What's the repair estimate?"
  - "How much to fix this?"
  - "What will parts cost?"

**Flow Implementation:**
```python
# In symptom_diagnosis_analyzer - do NOT automatically trigger parts selection
def symptom_diagnosis_analyzer(symptoms, vehicle_data=None):
    # ... existing diagnosis logic ...
    
    return {
        "diagnosis": diagnosis_results,
        "probable_parts": parts_list,  # Store for later use
        "recommendations": recommendations,
        # Do NOT trigger parts selection here
    }

# New trigger in main chat handler
def handle_cost_inquiry(message, conversation_context):
    if is_cost_related_query(message):
        # Get probable parts from previous diagnosis
        probable_parts = get_probable_parts_from_context()
        
        # Trigger enhanced parts selection
        parts_options = interactive_parts_selector(
            probable_parts=probable_parts,
            vehicle_data=get_vin_data_from_context()
        )
        
        return parts_selection_response(parts_options)
```

## 🎨 **User Experience Design**

### **Conversational Flow Example**
```
User: "My brakes are squealing"
Dixon: [Provides diagnosis] "Your brake pads likely need replacement (85% probability)..."

User: "How much will this cost to fix?"
Dixon: "Let me show you your options! Based on your 2019 Honda Civic, here are the parts that likely need replacement:

**Brake Pads (85% likely to replace)**
• Option 1: OEM Parts - $80-120 (Best warranty, perfect fit)
• Option 2: OEM Equivalent - $45-75 (Great quality, 30% savings) ⭐ Recommended
• Option 3: Budget Parts - $25-45 (Basic quality, lowest cost)

**Brake Rotors (60% likely to replace)**
• Option 1: OEM Parts - $85-110
• Option 2: OEM Equivalent - $55-80 ⭐ Recommended  
• Option 3: Budget Parts - $35-55

Which quality level would you prefer for each part? I can show you detailed cost breakdowns based on your choices."

User: "Show me OEM equivalent for both"
Dixon: [Provides detailed cost breakdown with labor, taxes, total, and comparison options]
```

### **VIN Enhancement**
When VIN available:
- Show exact part numbers
- Include vehicle-specific compatibility notes
- Reference known issues for that VIN
- Provide more accurate pricing

## 🔧 **Technical Implementation Steps**

### **Step 1: Create Interactive Parts Selector Tool**
```python
# File: /cdk-infrastructure/lambda/automotive_tools_enhanced.py

@tool
def interactive_parts_selector(
    probable_parts: List[Dict],
    vehicle_data: Optional[Dict] = None,
    user_budget_preference: Optional[str] = None
) -> Dict[str, Any]:
    """
    Present part type options with trade-offs for user selection
    """
    # Implementation details...
```

### **Step 2: Enhance Pricing Calculator**
```python
@tool  
def enhanced_pricing_calculator(
    selected_part_preferences: Dict[str, str],
    labor_requirements: Dict[str, Any],
    vehicle_data: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Calculate detailed costs based on user part preferences
    """
    # Implementation details...
```

### **Step 3: Update Main Chat Handler**
```python
# Add cost inquiry detection
def is_cost_related_query(message: str) -> bool:
    cost_keywords = [
        "cost", "price", "estimate", "how much", "expensive", 
        "repair cost", "fix cost", "parts cost"
    ]
    return any(keyword in message.lower() for keyword in cost_keywords)

# Integrate into main handler
def handle_chat_message(message, context):
    if is_cost_related_query(message) and has_previous_diagnosis(context):
        return trigger_enhanced_parts_selection(context)
    # ... existing logic
```

### **Step 4: Frontend Integration**
- No UI changes needed - works through existing chat interface
- Enhanced responses display naturally in chat
- Maintains conversational flow

## 📊 **Success Metrics**

### **User Experience Metrics**
- Users understand part options before seeing costs
- Reduced sticker shock from transparent pricing
- Increased engagement with cost-related queries

### **Business Metrics**
- Higher conversion to Dixon Smart Repair services
- More informed customers making repair decisions
- Competitive advantage through transparency

### **Technical Metrics**
- Accurate part identification with VIN data
- Proper cost calculations based on selections
- Seamless integration with existing tools

## 🚀 **Deployment Plan**

### **Phase 1: Backend Implementation**
1. Create `interactive_parts_selector` tool
2. Enhance `pricing_calculator` tool  
3. Update main chat handler with cost detection
4. Test with VIN and non-VIN scenarios

### **Phase 2: Integration & Testing**
1. Deploy to Lambda function
2. Test conversational flows
3. Verify VIN-enhanced accuracy
4. Validate cost calculations

### **Phase 3: Production Validation**
1. Deploy to production
2. Monitor user interactions
3. Gather feedback on parts selection experience
4. Optimize based on usage patterns

## 🎯 **Expected Outcome**

After implementation, users will experience:

1. **Educational Diagnosis** - Understanding their car's issues
2. **Informed Cost Discussion** - Only when they ask about pricing
3. **Transparent Options** - Clear part type choices with trade-offs
4. **Tailored Estimates** - Costs based on their preferences
5. **Professional Experience** - Like visiting a quality repair shop

This transforms Dixon Smart Repair from a basic diagnostic tool into a comprehensive automotive consultation platform that builds trust through transparency and education.

## 🔧 **Implementation Priority**
**HIGH PRIORITY** - This enhancement significantly improves user value and competitive positioning while maintaining the educational "help first" philosophy.

Ready to implement this enhanced parts selection and cost estimation system!
