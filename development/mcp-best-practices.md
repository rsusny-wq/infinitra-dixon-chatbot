# Model Context Protocol (MCP) Best Practices for Strands Agents

## 📋 Overview

This document captures comprehensive best practices for implementing Model Context Protocol (MCP) tools with Strands Agents, based on official documentation analysis. MCP is an open protocol that standardizes how applications provide context to Large Language Models (LLMs), enabling communication between agents and MCP servers that provide additional tools and services.

## 🔗 What is Model Context Protocol (MCP)?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). Strands Agents integrates with MCP to extend agent capabilities through external tools and services.

### **Key Benefits of MCP Integration:**
- **Standardized Tool Access**: Consistent interface for external tools and services
- **Extensibility**: Add capabilities without modifying core agent code
- **Reusability**: MCP servers can be shared across different applications
- **Protocol Compliance**: Follows open standards for interoperability

## 🏗️ MCP Architecture Fundamentals

### **Core Components:**
1. **MCP Server**: Provides tools and services via MCP protocol
2. **MCP Client**: Connects to MCP servers and manages communication
3. **Transport Layer**: Communication mechanism (stdio, HTTP, SSE)
4. **Tool Discovery**: Automatic detection of available tools
5. **Session Management**: Maintains connection lifecycle

### **Connection Lifecycle:**
```
1. Initialize MCP Client with transport
2. Establish connection to MCP Server
3. Initialize MCP session
4. Discover available tools
5. Agent uses tools through MCP Client
6. Handle tool invocation and results
7. Manage connection cleanup
```

## 🔌 MCP Server Connection Options

### ✅ **1. Standard I/O (stdio) - Recommended for Local Processes**

```python
# CORRECT - stdio connection for command-line tools
from mcp import stdio_client, StdioServerParameters
from strands import Agent
from strands.tools.mcp import MCPClient

# For macOS/Linux
stdio_mcp_client = MCPClient(lambda: stdio_client(
    StdioServerParameters(
        command="uvx", 
        args=["awslabs.aws-documentation-mcp-server@latest"]
    )
))

# For Windows
stdio_mcp_client = MCPClient(lambda: stdio_client(
    StdioServerParameters(
        command="uvx", 
        args=[
            "--from", 
            "awslabs.aws-documentation-mcp-server@latest", 
            "awslabs.aws-documentation-mcp-server.exe"
        ]
    )
))

# CRITICAL: Always use context manager
with stdio_mcp_client:
    tools = stdio_mcp_client.list_tools_sync()
    agent = Agent(tools=tools)
    result = agent("What is AWS Lambda?")
```

### ✅ **2. Streamable HTTP - Recommended for HTTP-based Services**

```python
# CORRECT - Streamable HTTP for HTTP-based MCP servers
from mcp.client.streamable_http import streamablehttp_client
from strands import Agent
from strands.tools.mcp.mcp_client import MCPClient

streamable_http_mcp_client = MCPClient(
    lambda: streamablehttp_client("http://localhost:8000/mcp")
)

with streamable_http_mcp_client:
    tools = streamable_http_mcp_client.list_tools_sync()
    agent = Agent(tools=tools)
    result = agent("Your query here")
```

### ✅ **3. Server-Sent Events (SSE) - Recommended for Real-time Updates**

```python
# CORRECT - SSE for real-time communication
from mcp.client.sse import sse_client
from strands import Agent
from strands.tools.mcp import MCPClient

sse_mcp_client = MCPClient(lambda: sse_client("http://localhost:8000/sse"))

with sse_mcp_client:
    tools = sse_mcp_client.list_tools_sync()
    agent = Agent(tools=tools)
    result = agent("Your query here")
```

### ✅ **4. Custom Transport - Advanced Use Cases**

```python
# CORRECT - Custom transport for specialized needs
from typing import Callable
from strands import Agent
from strands.tools.mcp.mcp_client import MCPClient
from strands.tools.mcp.mcp_types import MCPTransport

def custom_transport_factory() -> MCPTransport:
    """
    Implement custom transport mechanism
    Must return tuple of (read_stream, write_stream)
    Both must implement AsyncIterable and AsyncIterator protocols
    """
    # Your custom implementation here
    return read_stream, write_stream

custom_mcp_client = MCPClient(transport_callable=custom_transport_factory)

with custom_mcp_client:
    tools = custom_mcp_client.list_tools_sync()
    agent = Agent(tools=tools)
```

## 🔄 Context Manager Requirements

### ✅ **DO: Always Use Context Managers**

```python
# CORRECT - Proper context manager usage
with mcp_client:
    # All MCP operations must be within this block
    tools = mcp_client.list_tools_sync()
    agent = Agent(tools=tools)
    result = agent("Your prompt")  # Works correctly
```

### ❌ **DON'T: Use MCP Tools Outside Context Manager**

```python
# WRONG - Will fail with MCPClientInitializationError
with mcp_client:
    tools = mcp_client.list_tools_sync()
    agent = Agent(tools=tools)

# This will fail - MCP session is closed
result = agent("Your prompt")  # MCPClientInitializationError
```

### **Why Context Managers are Required:**
1. **Session Management**: MCP sessions must remain active during tool usage
2. **Resource Cleanup**: Proper connection cleanup when done
3. **Error Prevention**: Prevents MCPClientInitializationError
4. **Connection Lifecycle**: Manages connection establishment and teardown

## 🔧 Multiple MCP Servers Integration

### ✅ **DO: Combine Multiple MCP Servers**

```python
# CORRECT - Using multiple MCP servers together
from mcp import stdio_client, StdioServerParameters
from mcp.client.sse import sse_client
from strands import Agent
from strands.tools.mcp import MCPClient

# Create multiple MCP clients
sse_mcp_client = MCPClient(lambda: sse_client("http://localhost:8000/sse"))
stdio_mcp_client = MCPClient(lambda: stdio_client(
    StdioServerParameters(command="python", args=["path/to/mcp_server.py"])
))

# Use both servers together
with sse_mcp_client, stdio_mcp_client:
    # Combine tools from both servers
    tools = (sse_mcp_client.list_tools_sync() + 
             stdio_mcp_client.list_tools_sync())
    
    # Create agent with all tools
    agent = Agent(tools=tools)
    result = agent("Use tools from both servers")
```

### **Benefits of Multiple MCP Servers:**
- **Specialized Services**: Different servers for different capabilities
- **Load Distribution**: Distribute tool execution across servers
- **Redundancy**: Fallback options if one server fails
- **Modular Architecture**: Separate concerns into different servers

## 📊 MCP Tool Response Format

### **Response Content Types:**
1. **Text Content**: Simple text responses
2. **Image Content**: Binary image data with MIME type

### **Tool Result Structure:**
```python
{
    "status": str,          # "success" or "error"
    "toolUseId": str,       # ID of the tool use request
    "content": List[dict]   # List of content items (text or image)
}
```

### **Content Mapping:**
```python
# Strands automatically maps MCP content types
def _map_mcp_content_to_tool_result_content(content):
    if isinstance(content, MCPTextContent):
        return {"text": content.text}
    elif isinstance(content, MCPImageContent):
        return {
            "image": {
                "format": map_mime_type_to_image_format(content.mimeType),
                "source": {"bytes": base64.b64decode(content.data)},
            }
        }
    else:
        return None  # Unsupported content type
```

## 🛠️ Implementing MCP Servers

### ✅ **DO: Create Well-Structured MCP Servers**

```python
# CORRECT - Simple MCP server implementation
from mcp.server import FastMCP

# Create MCP server
mcp = FastMCP("Calculator Server")

@mcp.tool(description="Calculator tool which performs mathematical calculations")
def calculator(x: int, y: int, operation: str = "add") -> int:
    """
    Perform mathematical calculations.
    
    Args:
        x: First number
        y: Second number
        operation: Operation to perform (add, subtract, multiply, divide)
    
    Returns:
        Result of the calculation
    """
    if operation == "add":
        return x + y
    elif operation == "subtract":
        return x - y
    elif operation == "multiply":
        return x * y
    elif operation == "divide":
        if y == 0:
            raise ValueError("Cannot divide by zero")
        return x / y
    else:
        raise ValueError(f"Unsupported operation: {operation}")

# Run server with appropriate transport
mcp.run(transport="sse")  # or "stdio" for command-line usage
```

### **MCP Server Implementation Details:**
1. **Connection Management**: MCPClient handles connection lifecycle
2. **Session Initialization**: Automatic MCP session setup
3. **Tool Discovery**: Automatic detection of available tools
4. **Background Processing**: Runs in background thread to avoid blocking
5. **Result Conversion**: Automatic conversion of MCP results to Strands format

## 🎯 Advanced Usage Patterns

### ✅ **DO: Direct Tool Invocation When Needed**

```python
# CORRECT - Direct tool invocation for specific use cases
with mcp_client:
    # Direct tool call
    result = mcp_client.call_tool_sync(
        tool_use_id="tool-123",
        name="calculator",
        arguments={"x": 10, "y": 20, "operation": "add"}
    )
    
    # Process result
    if result['status'] == 'success':
        print(f"Calculation result: {result['content'][0]['text']}")
    else:
        print(f"Tool execution failed: {result}")
```

### **When to Use Direct Invocation:**
- **Testing**: Verify tool functionality independently
- **Debugging**: Isolate tool execution issues
- **Batch Processing**: Execute multiple tool calls programmatically
- **Custom Workflows**: Implement complex tool orchestration

## 📋 Best Practices Checklist

### **Connection Management**
- [ ] Always use context managers (`with` statements) for MCP clients
- [ ] Handle connection failures gracefully with try/catch blocks
- [ ] Verify MCP server is running and accessible before connecting
- [ ] Use appropriate transport type for your use case (stdio, HTTP, SSE)

### **Tool Implementation**
- [ ] Provide clear, comprehensive tool descriptions
- [ ] Use appropriate parameter types with detailed descriptions
- [ ] Implement proper error handling with informative messages
- [ ] Consider security implications for network-accessible servers
- [ ] Set appropriate timeouts for long-running operations

### **Agent Integration**
- [ ] Combine MCP tools with native Strands tools when beneficial
- [ ] Use multiple MCP servers for specialized capabilities
- [ ] Test tool discovery and execution thoroughly
- [ ] Monitor tool performance and error rates

### **Production Considerations**
- [ ] Implement connection retry logic for network-based servers
- [ ] Set up monitoring for MCP server health
- [ ] Configure appropriate logging for debugging
- [ ] Plan for MCP server scaling and load balancing

## 🚨 Common Anti-Patterns to Avoid

### **1. Context Manager Violations**
- ❌ Using MCP tools outside context managers
- ❌ Creating agents with MCP tools outside context
- ❌ Storing MCP tools for later use outside context
- ✅ Keep all MCP operations within `with` blocks

### **2. Connection Management Issues**
- ❌ Not handling connection failures
- ❌ Ignoring network connectivity issues
- ❌ Using incorrect server URLs or commands
- ✅ Implement robust connection error handling

### **3. Tool Discovery Problems**
- ❌ Assuming tools are available without checking
- ❌ Not implementing proper list_tools method in servers
- ❌ Failing to register tools correctly with servers
- ✅ Verify tool availability before use

### **4. Error Handling Neglect**
- ❌ Not checking tool execution results
- ❌ Ignoring tool argument validation
- ❌ Missing server-side error logging
- ✅ Implement comprehensive error handling

## 🔍 Troubleshooting Guide

### **MCPClientInitializationError**
**Cause**: Using MCP tools outside context manager
**Solution**: Ensure all agent operations are within `with` statement

```python
# Fix this pattern:
with mcp_client:
    agent = Agent(tools=mcp_client.list_tools_sync())
# Move agent usage inside context:
with mcp_client:
    agent = Agent(tools=mcp_client.list_tools_sync())
    result = agent("Your prompt")  # Now works
```

### **Connection Failures**
**Causes**: Server not running, network issues, firewall blocking
**Solutions**:
- Verify MCP server is running and accessible
- Check network connectivity
- Verify firewall settings
- Confirm correct URL/command format

### **Tool Discovery Issues**
**Causes**: Server missing list_tools method, tools not registered
**Solutions**:
- Confirm server implements list_tools method
- Verify tools are properly registered
- Check server logs for registration errors

### **Tool Execution Errors**
**Causes**: Invalid arguments, server-side errors, timeout issues
**Solutions**:
- Verify tool arguments match expected schema
- Check server logs for detailed error information
- Implement appropriate timeout handling
- Add argument validation

## 🎯 Integration with Dixon Smart Repair

### **Current State Analysis**
Based on the Dixon Smart Repair implementation, MCP integration could provide:

1. **External Tool Services**: Replace custom Tavily integration with MCP-based search tools
2. **Modular Architecture**: Separate automotive tools into dedicated MCP servers
3. **Scalability**: Distribute tool execution across multiple MCP servers
4. **Standardization**: Use MCP protocol for consistent tool interfaces

### **Recommended MCP Integration Plan**

#### **Phase 1: MCP Server Creation**
```python
# Create automotive-specific MCP server
from mcp.server import FastMCP

automotive_mcp = FastMCP("Dixon Smart Repair Automotive Tools")

@automotive_mcp.tool(description="Analyze vehicle symptoms for Dixon Smart Repair")
def symptom_diagnosis_analyzer(
    vehicle_make: str,
    vehicle_model: str,
    vehicle_year: int,
    symptoms: str,
    customer_description: str
) -> str:
    """Analyze vehicle symptoms and provide diagnostic recommendations"""
    # Implementation with real API calls
    return diagnostic_results

@automotive_mcp.tool(description="Check parts availability and pricing")
def parts_availability_lookup(
    part_description: str,
    vehicle_make: str,
    vehicle_model: str,
    vehicle_year: int,
    urgent: bool = False
) -> str:
    """Check parts availability, pricing, and delivery information"""
    # Implementation with real API calls
    return parts_info

# Additional tools...
automotive_mcp.run(transport="sse")
```

#### **Phase 2: Agent Integration**
```python
# Integrate MCP server with Strands Agent
from strands import Agent
from strands.tools.mcp import MCPClient
from mcp.client.sse import sse_client

automotive_mcp_client = MCPClient(
    lambda: sse_client("http://localhost:8000/automotive")
)

def get_agent_for_session(conversation_id):
    session_manager = S3SessionManager(
        session_id=conversation_id,
        bucket="dixon-smart-repair-sessions"
    )
    
    conversation_manager = SlidingWindowConversationManager(window_size=20)
    
    with automotive_mcp_client:
        mcp_tools = automotive_mcp_client.list_tools_sync()
        
        return Agent(
            model="us.amazon.nova-pro-v1:0",
            tools=mcp_tools,  # Use MCP tools instead of custom tools
            system_prompt=DIXON_SYSTEM_PROMPT,
            session_manager=session_manager,
            conversation_manager=conversation_manager
        )
```

#### **Phase 3: Production Deployment**
- Deploy MCP server as separate service (Lambda, Fargate, or EC2)
- Configure load balancing for multiple MCP server instances
- Implement monitoring and health checks
- Set up proper error handling and retry logic

## 📚 Key Documentation References

- **MCP Protocol**: https://modelcontextprotocol.io/
- **Strands MCP Tools**: https://strandsagents.com/latest/user-guide/concepts/tools/mcp-tools/
- **MCP Examples**: https://strandsagents.com/latest/examples/python/mcp_calculator/
- **FastMCP Server**: MCP server implementation framework
- **Transport Options**: stdio, HTTP, SSE, custom transports

## 🎉 Success Indicators

When following MCP best practices, you should see:

### **Functional Indicators**
- ✅ MCP tools are automatically discovered and available to agents
- ✅ Tool execution works seamlessly through MCP protocol
- ✅ Multiple MCP servers can be used simultaneously
- ✅ Context managers prevent connection errors
- ✅ Tool results are properly formatted and accessible

### **Performance Indicators**
- ✅ Fast tool discovery and execution
- ✅ Reliable connection management
- ✅ Proper error handling and recovery
- ✅ Scalable architecture with multiple servers
- ✅ Efficient resource usage and cleanup

### **Code Quality Indicators**
- ✅ Clean separation between MCP servers and agent logic
- ✅ Proper context manager usage throughout
- ✅ Comprehensive error handling
- ✅ Well-documented tool interfaces
- ✅ Production-ready connection management

---

## 📝 Summary

MCP integration with Strands Agents provides a powerful way to extend agent capabilities through standardized external tools and services. The key to successful MCP implementation is:

1. **Proper Context Management**: Always use context managers for MCP operations
2. **Robust Connection Handling**: Implement proper error handling and retry logic
3. **Well-Designed Tools**: Create tools with clear descriptions and proper error handling
4. **Scalable Architecture**: Use multiple MCP servers for specialized capabilities
5. **Production Readiness**: Implement monitoring, logging, and health checks

By following these best practices, you can build robust, scalable, and maintainable AI applications that leverage the full power of the Model Context Protocol with Strands Agents.
