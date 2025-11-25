# Strands Agents Best Practices Guide

## 📋 Overview

This document captures the comprehensive best practices for implementing Strands Agents based on official documentation analysis and lessons learned from the Dixon Smart Repair project. These practices ensure proper Agent Loop, State Management, Session Management, Conversation Management, Tool Usage, and Streaming implementation.

## 🔄 Agent Loop Best Practices

### ✅ **DO: Let the Agent Loop Handle Everything**

```python
# CORRECT - Simple, clean agent invocation
from strands import Agent

agent = Agent(
    model="us.amazon.nova-pro-v1:0",
    tools=[tool1, tool2, tool3],
    system_prompt="Your system prompt..."
)

# Let Strands handle the complete flow
result = agent("My brakes are squealing on my 2020 Honda Civic")
# Agent automatically:
# 1. Processes user input
# 2. Decides which tools to use
# 3. Executes tools automatically
# 4. Integrates results into response
# 5. Returns final response
```

### ❌ **DON'T: Manual Context Building and Response Processing**

```python
# WRONG - Fighting against the framework
def handle_chat_message(args):
    # Manual context building
    context = get_conversation_context(conversation_id)
    contextual_message = f"Previous conversation: {context}\nCurrent: {message}"
    
    # Manual agent call
    response = chatbot(contextual_message)
    
    # Manual response processing
    assistant_message = extract_text_from_response(response.message)
    
    # Manual storage
    store_message(...)
```

### **Key Agent Loop Principles:**

1. **Trust the Framework**: Let Strands handle tool selection, execution, and response integration
2. **Minimal Intervention**: Your code should be a thin wrapper around `agent(message)`
3. **Event Loop Cycle**: The agent automatically handles recursive tool calls and multi-step reasoning
4. **Natural Flow**: Tools are integrated seamlessly into conversation flow

## 🗃️ State Management Best Practices

### ✅ **DO: Use Built-in Agent State**

```python
# CORRECT - Leverage Strands state management
agent = Agent(
    state={"user_preferences": {"theme": "dark"}, "session_count": 0}
)

# Access state values
theme = agent.state.get("user_preferences")

# Set new state values
agent.state.set("last_action", "login")
agent.state.set("session_count", 1)

# Conversation history automatically maintained
print(agent.messages)  # All messages preserved automatically
```

### ❌ **DON'T: Manual Database State Management**

```python
# WRONG - Manual DynamoDB operations
def get_conversation_context(conversation_id):
    response = messages_table.query(...)
    context_lines = []
    for msg in messages:
        context_lines.append(f"{sender}: {content}")
    return "\n".join(context_lines)
```

### **Key State Management Principles:**

1. **Agent State**: Use `agent.state` for persistent key-value storage
2. **Conversation History**: Access via `agent.messages` - automatically maintained
3. **JSON Serializable**: All state values must be JSON serializable
4. **Tool Access**: Tools can access agent state via the `agent` parameter
5. **Automatic Persistence**: State is automatically managed by session managers

## 🔐 Session Management Best Practices

### ✅ **DO: Use Built-in Session Managers**

```python
# CORRECT - S3 Session Manager for production
from strands.session.s3_session_manager import S3SessionManager

session_manager = S3SessionManager(
    session_id=conversation_id,  # Use conversation_id as session_id
    bucket="dixon-smart-repair-sessions",
    prefix="production/",
    region_name="us-west-2"
)

agent = Agent(
    model="us.amazon.nova-pro-v1:0",
    tools=automotive_tools,
    session_manager=session_manager
)

# Sessions automatically persisted to S3
```

### ✅ **DO: Use File Session Manager for Development**

```python
# CORRECT - File Session Manager for local development
from strands.session.file_session_manager import FileSessionManager

session_manager = FileSessionManager(
    session_id="user-123",
    storage_dir="/path/to/sessions"
)

agent = Agent(session_manager=session_manager)
```

### ❌ **DON'T: Manual Session Management**

```python
# WRONG - Manual conversation ID and context management
conversation_id = f"conv-{Date.now()}"  # New ID every time!
# Manual DynamoDB operations for persistence
```

### **Key Session Management Principles:**

1. **Persistent Session IDs**: Use consistent session IDs across requests
2. **Automatic Persistence**: Session managers handle all persistence automatically
3. **S3 for Production**: Use S3SessionManager for distributed/production environments
4. **File for Development**: Use FileSessionManager for local development
5. **Required S3 Permissions**: Ensure proper IAM permissions for S3 operations

## 💬 Conversation Management Best Practices

### ✅ **DO: Use Built-in Conversation Managers**

```python
# CORRECT - Sliding Window for most use cases
from strands.agent.conversation_manager import SlidingWindowConversationManager

conversation_manager = SlidingWindowConversationManager(
    window_size=20,  # Keep 20 most recent messages
    should_truncate_results=True  # Handle large tool results
)

agent = Agent(
    conversation_manager=conversation_manager
)
```

### ✅ **DO: Use Summarizing Manager for Long Conversations**

```python
# CORRECT - Summarizing for long-term context preservation
from strands.agent.conversation_manager import SummarizingConversationManager

conversation_manager = SummarizingConversationManager(
    summary_ratio=0.3,  # Summarize 30% when reducing context
    preserve_recent_messages=10,  # Always keep 10 recent messages
    summarization_system_prompt="Custom summarization prompt..."
)

agent = Agent(conversation_manager=conversation_manager)
```

### ❌ **DON'T: Manual Conversation Context Parsing**

```python
# WRONG - Manual regex parsing and context extraction
def extract_vehicle_context(conversation_history):
    vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
    vin_match = re.search(vin_pattern, conversation_history.upper())
    # Manual context building...
```

### **Key Conversation Management Principles:**

1. **Automatic Context Management**: Let conversation managers handle context windows
2. **Window Size Configuration**: Choose appropriate window sizes for your use case
3. **Summarization Strategy**: Use summarizing managers for long conversations
4. **Tool Result Handling**: Configure truncation for large tool results
5. **Context Overflow**: Managers automatically handle token limit overflows

## 🛠️ Tool Usage Best Practices

### ✅ **DO: Proper Tool Definition**

```python
# CORRECT - Well-defined tools with comprehensive descriptions
from strands import tool

@tool
def symptom_diagnosis_analyzer(
    vehicle_make: str,
    vehicle_model: str,
    vehicle_year: int,
    symptoms: str,
    customer_description: str
) -> str:
    """
    Analyze vehicle symptoms to provide diagnostic recommendations for Dixon Smart Repair.
    
    Use this tool when customers describe vehicle problems or symptoms.
    This tool connects to automotive diagnostic databases and provides
    comprehensive analysis with potential causes and recommended tests.
    
    Args:
        vehicle_make: Vehicle manufacturer (e.g., "Toyota", "Ford")
        vehicle_model: Specific vehicle model (e.g., "Camry", "F-150")
        vehicle_year: Model year of the vehicle
        symptoms: Reported symptoms (e.g., "engine noise, poor acceleration")
        customer_description: Detailed customer description of the problem
        
    Returns:
        Diagnostic analysis with potential causes and recommended tests
    """
    # Tool implementation with real API calls
    if not TAVILY_API_KEY:
        return "Diagnostic search temporarily unavailable"
    
    # Make actual API calls
    response = requests.post("https://api.tavily.com/search", ...)
    return formatted_results
```

### ✅ **DO: Natural Language Tool Invocation**

```python
# CORRECT - Let agent decide when to use tools
agent = Agent(tools=[symptom_analyzer, parts_lookup, labor_estimator])

# Agent automatically selects and executes appropriate tools
result = agent("My brakes are squealing on my 2020 Honda Civic")
# Agent will automatically:
# 1. Call symptom_diagnosis_analyzer with extracted parameters
# 2. Call parts_availability_lookup for brake parts
# 3. Call labor_estimator for repair time
# 4. Integrate all results into natural response
```

### ❌ **DON'T: Manual Tool Result Simulation**

```python
# WRONG - Generating fake tool responses
assistant_message = """
Here's what we found:
- Parts: Competitive pricing on brake pads
- Labor: Fair hourly rates
- Total: Call for estimate
"""
# No actual tools were called!
```

### **Key Tool Usage Principles:**

1. **Comprehensive Descriptions**: Tools need detailed descriptions for proper LLM selection
2. **Parameter Clarity**: Clearly define all parameters with types and descriptions
3. **Real Implementation**: Tools must make actual API calls, not return fake data
4. **Natural Invocation**: Let the agent decide when and how to use tools
5. **Error Handling**: Provide graceful fallbacks when tools fail
6. **Multiple Tools**: Design tools to work together for comprehensive responses

## 🌊 Streaming Best Practices

### ✅ **DO: Use Async Streaming for Real-time Responses**

```python
# CORRECT - Async streaming with event handling
import asyncio
from strands import Agent

async def handle_streaming_chat(message, conversation_id):
    agent = get_agent_for_session(conversation_id)
    
    async for event in agent.stream_async(message):
        if "data" in event:
            # Stream text chunks as they're generated
            yield {
                "type": "text_chunk",
                "data": event["data"],
                "timestamp": datetime.utcnow().isoformat()
            }
        elif "current_tool_use" in event:
            # Stream tool execution updates
            tool_info = event["current_tool_use"]
            yield {
                "type": "tool_execution",
                "tool_name": tool_info["name"],
                "status": "executing",
                "input": tool_info.get("input", {})
            }
        elif "result" in event:
            # Final result
            yield {
                "type": "complete",
                "result": event["result"].message,
                "processing_time": event["result"].processing_time
            }
```

### ✅ **DO: GraphQL Subscriptions for Real-time Updates**

```python
# CORRECT - GraphQL subscription integration
async def graphql_chat_subscription(message, conversation_id):
    async for event in handle_streaming_chat(message, conversation_id):
        # Send real-time updates via GraphQL subscription
        await send_subscription_update(conversation_id, event)
```

### ❌ **DON'T: Synchronous, Non-streaming Responses**

```python
# WRONG - Long wait times with no feedback
def handle_chat_message(args):
    # User waits 13+ seconds with no feedback
    response = chatbot(contextual_message)
    # Return complete response all at once
    return {'message': assistant_message}
```

### **Key Streaming Principles:**

1. **Async Architecture**: Use `stream_async()` for real-time responses
2. **Event-Driven**: Process different event types appropriately
3. **Tool Visibility**: Show users when tools are executing
4. **Progressive Updates**: Stream text chunks as they're generated
5. **User Experience**: Provide immediate feedback, not long waits
6. **GraphQL Integration**: Use subscriptions for real-time web updates

## 🏗️ Architecture Best Practices

### ✅ **DO: Simple Lambda Handler with Strands**

```python
# CORRECT - Clean, simple Lambda handler
from strands import Agent
from strands.session.s3_session_manager import S3SessionManager
from strands.agent.conversation_manager import SlidingWindowConversationManager

def lambda_handler(event, context):
    try:
        # Extract parameters
        message = event['arguments']['message']
        conversation_id = event['arguments']['conversationId']
        
        # Get agent for this session
        agent = get_agent_for_session(conversation_id)
        
        # Let Strands handle everything
        result = agent(message)
        
        # Return clean response
        return {
            'conversationId': conversation_id,
            'message': result.message,
            'timestamp': datetime.utcnow().isoformat(),
            'success': True
        }
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return {
            'conversationId': conversation_id,
            'message': 'Sorry, I encountered an error. Please try again.',
            'success': False,
            'error': str(e)
        }

def get_agent_for_session(conversation_id):
    """Get or create agent for session with proper configuration"""
    session_manager = S3SessionManager(
        session_id=conversation_id,
        bucket="dixon-smart-repair-sessions"
    )
    
    conversation_manager = SlidingWindowConversationManager(window_size=20)
    
    return Agent(
        model="us.amazon.nova-pro-v1:0",
        tools=automotive_tools,
        system_prompt=DIXON_SYSTEM_PROMPT,
        session_manager=session_manager,
        conversation_manager=conversation_manager
    )
```

### ❌ **DON'T: Complex Manual Processing**

```python
# WRONG - Fighting against the framework
def handle_chat_message(args):
    # Manual context building
    context = get_conversation_context(conversation_id)
    vehicle_context = extract_vehicle_context(context + " " + message)
    contextual_message = f"Previous: {context}\nCurrent: {message}\nVehicle: {vehicle_context}"
    
    # Manual agent processing
    response = chatbot(contextual_message)
    assistant_message = extract_text_from_response(response.message)
    
    # Manual storage
    store_message(conversation_id, 'USER', message, timestamp, metadata)
    store_message(conversation_id, 'ASSISTANT', assistant_message, timestamp, metadata)
    
    # Manual response formatting
    return format_response(assistant_message, conversation_id, processing_time)
```

## 🚨 Common Anti-Patterns to Avoid

### **1. Manual Context Management**
- ❌ Building conversation context manually
- ❌ Parsing conversation history with regex
- ❌ Manual vehicle information extraction
- ✅ Use agent.messages and conversation managers

### **2. Response Interception**
- ❌ Manual response processing and text extraction
- ❌ Intercepting agent responses before completion
- ❌ Manual JSON parsing of agent outputs
- ✅ Let the agent loop complete naturally

### **3. State Management Bypass**
- ❌ Manual DynamoDB operations for conversation storage
- ❌ Custom session management implementations
- ❌ Manual conversation ID generation per message
- ✅ Use session managers and agent state

### **4. Tool Execution Simulation**
- ❌ Generating fake tool responses
- ❌ Manual tool result formatting
- ❌ Simulating tool execution without actual API calls
- ✅ Let agent automatically select and execute real tools

### **5. Synchronous Processing**
- ❌ Long processing times without user feedback
- ❌ Blocking operations without streaming
- ❌ No visibility into tool execution
- ✅ Use async streaming for real-time updates

## 🎯 Implementation Checklist

### **Agent Setup**
- [ ] Use proper model configuration (Nova Pro for cost optimization)
- [ ] Define tools with comprehensive descriptions
- [ ] Implement session manager (S3 for production, File for development)
- [ ] Configure conversation manager (Sliding Window or Summarizing)
- [ ] Set up proper system prompt

### **Tool Implementation**
- [ ] Use `@tool` decorator with detailed docstrings
- [ ] Implement real API calls, not fake responses
- [ ] Handle errors gracefully with fallback messages
- [ ] Design tools to work together for comprehensive responses
- [ ] Include business branding and contact information

### **Lambda Handler**
- [ ] Keep handler simple - just call `agent(message)`
- [ ] Use session IDs consistently (don't generate new ones per message)
- [ ] Implement proper error handling
- [ ] Return clean, structured responses
- [ ] Avoid manual context building or response processing

### **Streaming (Optional but Recommended)**
- [ ] Implement async streaming with `stream_async()`
- [ ] Handle different event types appropriately
- [ ] Provide real-time tool execution feedback
- [ ] Integrate with GraphQL subscriptions for web updates
- [ ] Stream text chunks for better user experience

### **Production Considerations**
- [ ] Use S3 session manager for distributed environments
- [ ] Implement proper IAM permissions for S3 access
- [ ] Set up monitoring and logging
- [ ] Configure appropriate conversation window sizes
- [ ] Test tool execution and streaming functionality

## 📚 Key Documentation References

- **Agent Loop**: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/agents/agent-loop/
- **State Management**: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/agents/state/
- **Session Management**: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/agents/session-management/
- **Conversation Management**: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/agents/conversation-management/
- **Tools Overview**: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/tools/tools_overview/
- **Async Iterators**: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/streaming/async-iterators/

## 🎉 Success Indicators

When following these best practices, you should see:

### **Functional Indicators**
- ✅ Tools are automatically selected and executed by the agent
- ✅ Real-time tool execution with actual API calls and data
- ✅ Conversation context preserved across messages
- ✅ Session persistence working across application restarts
- ✅ Clean, natural responses with integrated tool results

### **Performance Indicators**
- ✅ Streaming responses with real-time feedback
- ✅ Tool execution visibility for users
- ✅ Reasonable response times with progressive updates
- ✅ Cost optimization through proper model selection
- ✅ Efficient conversation management without context overflow

### **Code Quality Indicators**
- ✅ Simple, clean Lambda handlers
- ✅ Minimal manual processing and intervention
- ✅ Proper separation of concerns
- ✅ Comprehensive error handling
- ✅ Production-ready architecture

---

## 📝 Summary

The key to successful Strands implementation is **trusting the framework** and **letting it handle what it's designed to do**. Avoid the temptation to manually manage context, intercept responses, or simulate tool execution. Instead, focus on:

1. **Proper agent configuration** with session and conversation managers
2. **Well-defined tools** with real implementations
3. **Simple handlers** that let Strands do the work
4. **Streaming architecture** for better user experience
5. **Production-ready patterns** with proper persistence and error handling

By following these practices, you'll build robust, scalable, and maintainable AI applications that leverage the full power of the Strands Agents framework.
