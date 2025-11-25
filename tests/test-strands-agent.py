#!/usr/bin/env python3
"""
Test version of Dixon Smart Repair Strands Agent
Simulates Strands agent behavior for local testing
"""

import json
import time
from datetime import datetime
from typing import Dict, Any

# Mock Strands Agent for testing
class MockStrandsAgent:
    def __init__(self, system_prompt: str):
        self.system_prompt = system_prompt
        print(f"✅ Mock Strands Agent initialized with system prompt")
    
    def __call__(self, message: str):
        """Simulate Strands agent processing"""
        print(f"🤖 Processing message: {message}")
        
        # Simulate processing time
        time.sleep(1)
        
        # Generate contextual response based on message
        response_message = self.generate_response(message)
        
        # Return mock response object
        class MockResponse:
            def __init__(self, message):
                self.message = message
        
        return MockResponse(response_message)
    
    def generate_response(self, message: str) -> str:
        """Generate contextual automotive responses"""
        lower_message = message.lower()
        
        if any(word in lower_message for word in ['hi', 'hello', 'hey']):
            return """👋 Hello! I'm Dixon, your automotive diagnostic assistant powered by Strands AI.

I can help you with:
🔧 Vehicle diagnostics and troubleshooting
🔍 Parts pricing and availability
💰 Repair cost estimates
📋 Step-by-step repair guidance

What's going on with your vehicle today?"""
        
        elif 'brake' in lower_message:
            return """🛑 **Brake System Analysis**

I can help diagnose brake issues! Common brake problems include:

• **Squeaking/Grinding**: Usually worn brake pads
• **Soft Pedal**: Possible brake fluid or hydraulic issues
• **Pulling**: Uneven brake wear or caliper problems

To provide the best diagnosis:
1. What specific brake symptoms are you experiencing?
2. What's your vehicle's year, make, and model?
3. When did you first notice this issue?

*Powered by Strands AI with real-time automotive data*"""
        
        elif any(word in lower_message for word in ['cost', 'price', 'how much']):
            return """💰 **Automotive Cost Estimation**

I can help estimate repair costs! I have access to:

🔍 **Real-time parts pricing** from major suppliers
💼 **Regional labor rates** for your area
📊 **Complete repair estimates** with parts + labor

To provide accurate pricing:
1. What repair or part do you need?
2. What's your vehicle's year, make, and model?
3. What's your general location (for labor rates)?

*Powered by Strands AI with live pricing data*"""
        
        else:
            return f"""🤖 **Strands Automotive Assistant**

I understand you're asking about: "{message}"

I can assist with:
🔧 **Diagnostics**: Analyze symptoms and identify problems
🔍 **Parts & Pricing**: Search current parts availability and costs
💰 **Cost Estimates**: Calculate repair costs with parts and labor
📋 **Repair Guidance**: Provide step-by-step instructions

Could you provide more details about your specific automotive question?

*Powered by Strands AI - Your intelligent automotive assistant*"""

def mock_search_automotive_info(query: str, vehicle_info: str = "") -> str:
    """Mock automotive search tool"""
    print(f"🔧 Mock automotive search: query='{query}', vehicle='{vehicle_info}'")
    
    # Simulate API call delay
    time.sleep(0.5)
    
    return f"""🔍 **Mock Automotive Search Results:**

Based on your query: "{query}" {f"for {vehicle_info}" if vehicle_info else ""}

• Found relevant automotive information
• Parts pricing: $25-85 (estimated range)
• Labor rates: $100-150/hour (regional average)
• Availability: Most parts in stock or 2-3 day delivery

**Sources:**
• AutoZone - Parts and pricing
• RepairPal - Labor estimates

*This is a mock response for testing purposes*"""

def test_lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """Test Lambda handler function"""
    
    try:
        # Parse the request
        field_name = event.get('info', {}).get('fieldName', '')
        arguments = event.get('arguments', {})
        
        print(f"🔧 Test processing field: {field_name}")
        print(f"📝 Arguments: {json.dumps(arguments, default=str)}")
        
        if field_name == 'sendMessage':
            message = arguments.get('message', '').strip()
            conversation_id = arguments.get('conversationId', f'test-conv-{int(time.time())}')
            user_id = arguments.get('userId', 'test-user')
            
            if not message:
                return {
                    'error': 'Message is required',
                    'success': False
                }
            
            # Create mock Strands agent
            agent = MockStrandsAgent("You are Dixon, a friendly automotive diagnostic assistant.")
            
            # Process message
            start_time = time.time()
            response = agent(message)
            processing_time = time.time() - start_time
            
            return {
                'conversationId': conversation_id,
                'message': response.message,
                'timestamp': datetime.utcnow().isoformat(),
                'sender': 'ASSISTANT',
                'poweredBy': 'Strands AI (Test Mode)',
                'processingTime': processing_time,
                'success': True
            }
        
        else:
            return {
                'error': f'Unknown field: {field_name}',
                'success': False
            }
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return {
            'error': str(e),
            'success': False
        }

def main():
    """Test the Strands agent locally"""
    print("🧪 Testing Dixon Smart Repair Strands Agent")
    print("=" * 60)
    
    # Test messages
    test_messages = [
        "Hi there!",
        "My 2020 Honda Civic is making squeaking noises when I brake",
        "How much would brake pads cost?",
        "What about labor costs for brake pad replacement?"
    ]
    
    # Create mock agent
    agent = MockStrandsAgent("You are Dixon, a friendly automotive diagnostic assistant.")
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n🚗 Test {i}: {message}")
        print("-" * 40)
        
        try:
            response = agent(message)
            print(f"🤖 Dixon: {response.message}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print()
    
    # Test Lambda handler
    print("\n🔧 Testing Lambda Handler")
    print("-" * 40)
    
    test_event = {
        'info': {'fieldName': 'sendMessage'},
        'arguments': {
            'message': 'Test Lambda integration',
            'conversationId': 'test-conversation',
            'userId': 'test-user'
        }
    }
    
    result = test_lambda_handler(test_event)
    print(f"📤 Lambda Response: {json.dumps(result, indent=2, default=str)}")
    
    print("\n✅ Local testing complete!")
    print("🚀 Ready for deployment to AWS Lambda with real Strands SDK")

if __name__ == "__main__":
    main()
