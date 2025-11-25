---
artifact_id: ART-041
title: Low-Level Design - Strands Conversational Chatbot
category: Development Implementation
priority: mandatory
dependencies:
  requires:
    - ART-020: System Architecture (system components and technology stack)
    - ART-023: Component Design (component specifications and interfaces)
    - ART-025: API Specifications (endpoint definitions and data formats)
  enhances:
    - ART-042: Technical Specifications
    - ART-044: Test Cases
validation_criteria:
  - All components have detailed implementation specifications
  - Code structure and organization clearly defined
  - Implementation patterns and conventions established
  - Development environment requirements specified
  - Code quality standards and practices defined
quality_gates:
  - Low-level design supports all component requirements
  - Implementation approach enables effective testing
  - Code organization supports maintainability and scalability
  - Development standards ensure code quality and consistency
  - Design enables efficient development workflow
---

# Low-Level Design - Dixon Smart Repair Conversational Chatbot

## Purpose
Define detailed implementation specifications for Dixon Smart Repair conversational chatbot using **Strands Agents SDK**, focusing on natural conversation flows, memory system, and automotive diagnostic capabilities optimized for Amazon Q Developer CLI execution.

## 1. Simplified Architecture Overview

### **Core Philosophy: Conversational First**
- **Single Strands Agent** handles all automotive queries
- **LLM decides** when to use tools (not rigid workflows)
- **Conversation memory** maintains context across sessions
- **Real-time chat** via AppSync GraphQL subscriptions

## 2. Code Organization Strategy

### **Project Structure**
```
dixon-smart-repair/
├── lambda/
│   ├── strands-chatbot.py          # Main Strands agent Lambda
│   ├── conversation-memory.py      # Memory system implementation
│   ├── automotive-tools.py         # @tool decorated functions
│   └── requirements.txt            # Python dependencies
├── dixon-smart-repair-app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/               # Conversational chat UI
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── ConversationList.tsx
│   │   │   └── automotive/         # Vehicle-specific components
│   │   ├── services/
│   │   │   ├── GraphQLService.ts   # AppSync integration
│   │   │   └── AuthService.ts      # User authentication
│   │   └── types/
│   │       └── conversation.ts     # Chat type definitions
└── cdk-infrastructure/
    ├── lib/
    │   ├── strands-chatbot-stack.ts
    │   └── appsync-chat-stack.ts
    └── lambda/                     # Symlink to ../lambda/
```

## 3. Backend Implementation Specifications

### 3.1 Strands Agent Core Implementation

#### **Primary Agent Configuration**
```python
# strands-chatbot.py
from strands import Agent, tool
import boto3
import json
from datetime import datetime

@tool
def search_automotive_info(query: str, vehicle_info: str = "") -> str:
    """Single tool for all automotive searches via Tavily MCP
    
    Replaces complex 5-tool architecture with simple LLM-driven approach.
    The LLM decides when to use this tool based on conversation context.
    
    Args:
        query: User's automotive query
        vehicle_info: Optional vehicle context (make, model, year)
        
    Returns:
        Formatted automotive information from Tavily API
    """
    # Implementation details in automotive-tools.py
    pass

# Create conversational agent (initialized once per Lambda container)
chatbot = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    tools=[search_automotive_info],
    system_prompt="""You are Dixon, a friendly automotive diagnostic assistant.

Have natural conversations about vehicle issues. Use your search tool when you need 
current information about parts pricing, labor rates, or repair procedures.

Be conversational, ask follow-up questions, and provide helpful automotive advice."""
)

def lambda_handler(event, context):
    """Main Lambda handler for AppSync GraphQL resolvers"""
    # Implementation details in main handler
    pass
```

#### **Conversation Memory System**
```python
# conversation-memory.py
class ConversationMemory:
    """Multi-layer conversation memory system"""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.messages_table = self.dynamodb.Table('dixon-messages')
        self.conversations_table = self.dynamodb.Table('dixon-conversations')
    
    def get_conversation_context(self, conversation_id: str, max_messages: int = 10) -> str:
        """Retrieve conversation context for Strands agent
        
        Memory Layers:
        - Immediate: Last 10 messages in conversation
        - Session: Current diagnostic session context
        - User: User's vehicles, preferences, history
        - Global: Common automotive knowledge
        """
        # Load recent messages
        response = self.messages_table.query(
            KeyConditionExpression='conversationId = :cid',
            ExpressionAttributeValues={':cid': conversation_id},
            ScanIndexForward=False,  # Most recent first
            Limit=max_messages
        )
        
        messages = response.get('Items', [])
        messages.reverse()  # Chronological order
        
        # Format for LLM context
        context_lines = []
        for msg in messages:
            context_lines.append(f"{msg['sender']}: {msg['content']}")
        
        return "\n".join(context_lines)
    
    def store_message(self, conversation_id: str, sender: str, content: str, metadata: dict = None):
        """Store message with conversation context"""
        self.messages_table.put_item(Item={
            'conversationId': conversation_id,
            'timestamp': datetime.utcnow().isoformat(),
            'sender': sender,
            'content': content,
            'metadata': metadata or {},
            'id': str(uuid.uuid4())
        })
```

#### **Automotive Tools Implementation**
```python
# automotive-tools.py
import requests
import os
from typing import Dict, Any

def search_automotive_info(query: str, vehicle_info: str = "") -> str:
    """Automotive search tool using Tavily MCP integration"""
    
    api_key = os.environ.get('TAVILY_API_KEY')
    if not api_key:
        return "Automotive search temporarily unavailable"
    
    # Enhanced query for automotive context
    automotive_query = f"automotive {query} {vehicle_info} parts pricing labor cost repair"
    
    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": automotive_query,
                "search_depth": "advanced",
                "include_domains": ["autozone.com", "rockauto.com", "repairpal.com"],
                "max_results": 3
            },
            timeout=10
        )
        
        if response.status_code == 200:
            results = response.json()
            answer = results.get('answer', '')
            sources = results.get('results', [])
            
            # Format response with pricing and availability
            formatted_response = f"🔍 **Automotive Search Results:**\n\n"
            if answer:
                formatted_response += f"{answer}\n\n"
            
            if sources:
                formatted_response += "**Sources:**\n"
                for source in sources[:2]:  # Top 2 sources
                    formatted_response += f"• {source.get('title', 'N/A')}\n"
            
            return formatted_response
        else:
            return "Unable to search automotive databases at this time"
            
    except Exception as e:
        print(f"Tavily search error: {e}")
        return "Automotive search temporarily unavailable"

# Additional utility functions
def extract_vehicle_info(message: str) -> Dict[str, Any]:
    """Extract vehicle information from user message"""
    import re
    
    # Extract year/make/model patterns
    vehicle_pattern = r'(\d{4})\s+(\w+)\s+(\w+)'
    matches = re.findall(vehicle_pattern, message)
    
    if matches:
        year, make, model = matches[0]
        return {
            'year': int(year),
            'make': make.title(),
            'model': model.title()
        }
    
    return {}

def format_automotive_response(raw_response: str, context: Dict[str, Any]) -> str:
    """Format automotive response with context"""
    # Add vehicle-specific context if available
    if context.get('vehicle_info'):
        vehicle = context['vehicle_info']
        vehicle_str = f"{vehicle.get('year', '')} {vehicle.get('make', '')} {vehicle.get('model', '')}"
        raw_response = raw_response.replace("your vehicle", f"your {vehicle_str}")
    
    return raw_response
```

### 3.2 GraphQL Schema and Resolvers

#### **AppSync GraphQL Schema**
```graphql
# schema.graphql
type Message {
  id: String!
  conversationId: String!
  content: String!
  sender: String!
  timestamp: String!
  poweredBy: String
  metadata: AWSJSON
}

type Conversation {
  id: String!
  userId: String!
  title: String!
  createdAt: String!
  updatedAt: String!
  messages: [Message!]!
}

type ChatResponse {
  conversationId: String!
  message: String!
  timestamp: String!
  sender: String!
  poweredBy: String!
  processingTime: Float
  toolsUsed: [String!]
  success: Boolean!
  error: String
}

type Query {
  getConversation(conversationId: String!): Conversation
  listUserConversations(userId: String!): [Conversation!]!
}

type Mutation {
  sendMessage(
    message: String!
    conversationId: String
    userId: String
  ): ChatResponse!
  
  createConversation(
    userId: String!
    title: String
  ): Conversation!
}

type Subscription {
  onMessageAdded(conversationId: String!): Message
    @aws_subscribe(mutations: ["sendMessage"])
}
```

#### **Lambda Resolver Implementation**
```python
# Main Lambda handler for AppSync resolvers
def lambda_handler(event, context):
    """AppSync resolver with conversation memory"""
    
    field_name = event.get('info', {}).get('fieldName', '')
    arguments = event.get('arguments', {})
    
    try:
        if field_name == 'sendMessage':
            return handle_send_message(arguments)
        elif field_name == 'getConversation':
            return handle_get_conversation(arguments)
        elif field_name == 'createConversation':
            return handle_create_conversation(arguments)
        else:
            return {'error': f'Unknown field: {field_name}'}
            
    except Exception as e:
        logger.error(f"Lambda handler error: {e}")
        return {
            'error': str(e),
            'success': False
        }

def handle_send_message(args):
    """Handle chat message with Strands agent and memory"""
    message = args.get('message', '').strip()
    conversation_id = args.get('conversationId')
    user_id = args.get('userId', 'anonymous')
    
    if not message:
        return {'error': 'Message is required', 'success': False}
    
    # Create conversation if not provided
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        create_conversation_record(conversation_id, user_id, message)
    
    # Get conversation context
    memory = ConversationMemory()
    context = memory.get_conversation_context(conversation_id)
    
    # Build context-aware prompt
    if context:
        contextual_message = f"Previous conversation:\n{context}\n\nCurrent message: {message}"
    else:
        contextual_message = message
    
    # Process with Strands agent
    start_time = time.time()
    response = chatbot(contextual_message)
    processing_time = time.time() - start_time
    
    # Store conversation
    timestamp = datetime.utcnow().isoformat()
    memory.store_message(conversation_id, 'USER', message)
    memory.store_message(conversation_id, 'ASSISTANT', response.message, {
        'processing_time': processing_time,
        'tools_used': getattr(response, 'tools_used', [])
    })
    
    return {
        'conversationId': conversation_id,
        'message': response.message,
        'timestamp': timestamp,
        'sender': 'ASSISTANT',
        'poweredBy': 'Strands AI',
        'processingTime': processing_time,
        'toolsUsed': getattr(response, 'tools_used', []),
        'success': True
    }
```

## 4. Frontend Implementation Specifications

### 4.1 Conversational Chat Interface

#### **Main Chat Component**
```typescript
// src/components/chat/ChatInterface.tsx
import React, { useState, useEffect } from 'react';
import { useSubscription, useMutation } from '@apollo/client';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';

interface ChatInterfaceProps {
  conversationId?: string;
  userId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversationId, userId }) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Real-time message subscription
  const { data: subscriptionData } = useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { conversationId },
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.onMessageAdded) {
        const newMessage = subscriptionData.data.onMessageAdded;
        addMessageToChat(newMessage);
        setIsTyping(false);
      }
    }
  });
  
  const [sendMessageMutation] = useMutation(SEND_MESSAGE_MUTATION);
  
  const handleSendMessage = async (newMessages: IMessage[]) => {
    const message = newMessages[0];
    
    // Add user message immediately (optimistic update)
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    setIsTyping(true);
    
    try {
      await sendMessageMutation({
        variables: { 
          message: message.text, 
          conversationId,
          userId 
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      setIsTyping(false);
    }
  };
  
  const addMessageToChat = (message: any) => {
    const giftedMessage: IMessage = {
      _id: message.id,
      text: message.content,
      createdAt: new Date(message.timestamp),
      user: {
        _id: message.sender === 'USER' ? (userId || 'user') : 'assistant',
        name: message.sender === 'USER' ? 'You' : 'Dixon',
        avatar: message.sender === 'ASSISTANT' ? '🤖' : undefined
      }
    };
    
    setMessages(previousMessages => GiftedChat.append(previousMessages, [giftedMessage]));
  };
  
  return (
    <GiftedChat
      messages={messages}
      onSend={handleSendMessage}
      user={{ _id: userId || 'user' }}
      renderBubble={renderAutomotiveBubble}
      renderInputToolbar={renderAutomotiveInput}
      isTyping={isTyping}
      placeholder="Ask about your vehicle..."
      showUserAvatar={false}
      showAvatarForEveryMessage={true}
    />
  );
};
```

#### **Custom Message Bubbles**
```typescript
// src/components/chat/MessageBubble.tsx
const renderAutomotiveBubble = (props: BubbleProps<IMessage>) => {
  const { currentMessage } = props;
  
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: '#007AFF' },
        left: { backgroundColor: '#f0f0f0' }
      }}
      textStyle={{
        right: { color: 'white' },
        left: { color: '#333' }
      }}
      renderCustomView={() => {
        // Show Strands AI indicator for assistant messages
        if (currentMessage?.user._id === 'assistant') {
          return (
            <View style={styles.strandsIndicator}>
              <Text style={styles.strandsText}>🤖 Powered by Strands AI</Text>
            </View>
          );
        }
        return null;
      }}
    />
  );
};

const renderAutomotiveInput = (props: InputToolbarProps<IMessage>) => {
  return (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      renderActions={() => (
        <View style={styles.inputActions}>
          <TouchableOpacity onPress={handleVoiceInput}>
            <Icon name="mic" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePhotoInput}>
            <Icon name="camera" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    />
  );
};
```

### 4.2 GraphQL Integration

#### **GraphQL Queries and Mutations**
```typescript
// src/services/GraphQLService.ts
import { gql } from '@apollo/client';

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($message: String!, $conversationId: String, $userId: String) {
    sendMessage(message: $message, conversationId: $conversationId, userId: $userId) {
      conversationId
      message
      timestamp
      sender
      poweredBy
      processingTime
      toolsUsed
      success
      error
    }
  }
`;

export const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded($conversationId: String!) {
    onMessageAdded(conversationId: $conversationId) {
      id
      conversationId
      content
      sender
      timestamp
      poweredBy
      metadata
    }
  }
`;

export const GET_CONVERSATION_QUERY = gql`
  query GetConversation($conversationId: String!) {
    getConversation(conversationId: $conversationId) {
      id
      userId
      title
      createdAt
      updatedAt
      messages {
        id
        content
        sender
        timestamp
        poweredBy
      }
    }
  }
`;
```

## 5. Data Models and Interfaces

### 5.1 TypeScript Type Definitions

#### **Conversation Types**
```typescript
// src/types/conversation.ts
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: 'USER' | 'ASSISTANT';
  timestamp: string;
  poweredBy?: string;
  metadata?: {
    processing_time?: number;
    tools_used?: string[];
    vehicle_info?: VehicleInfo;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  timestamp: string;
  sender: string;
  poweredBy: string;
  processingTime?: number;
  toolsUsed?: string[];
  success: boolean;
  error?: string;
}

export interface VehicleInfo {
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
}

export interface ConversationContext {
  recent_messages: Message[];
  user_vehicles: VehicleInfo[];
  diagnostic_history: any[];
  user_preferences: any;
}
```

### 5.2 Python Data Models

#### **Pydantic Models**
```python
# lambda/models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class VehicleInfo(BaseModel):
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    vin: Optional[str] = None

class Message(BaseModel):
    id: str
    conversation_id: str
    content: str
    sender: str  # 'USER' or 'ASSISTANT'
    timestamp: datetime
    powered_by: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class Conversation(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    timestamp: datetime
    sender: str
    powered_by: str
    processing_time: Optional[float] = None
    tools_used: Optional[List[str]] = None
    success: bool
    error: Optional[str] = None
```

## 6. Error Handling and Logging

### 6.1 Comprehensive Error Handling

#### **Python Error Handling**
```python
# lambda/error_handling.py
import logging
from typing import Dict, Any
from aws_lambda_powertools import Logger

logger = Logger()

class ChatbotError(Exception):
    """Base exception for chatbot errors"""
    pass

class StrandsAgentError(ChatbotError):
    """Strands agent processing errors"""
    pass

class ConversationMemoryError(ChatbotError):
    """Conversation memory system errors"""
    pass

class AutomotiveSearchError(ChatbotError):
    """Automotive search tool errors"""
    pass

def handle_chatbot_error(error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
    """Centralized error handling for chatbot operations"""
    
    error_response = {
        'success': False,
        'error': str(error),
        'conversation_id': context.get('conversation_id'),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if isinstance(error, StrandsAgentError):
        logger.error("Strands agent error", extra={
            'error': str(error),
            'conversation_id': context.get('conversation_id'),
            'user_message': context.get('message')
        })
        error_response['message'] = "I'm having trouble processing your request. Please try rephrasing your question."
        
    elif isinstance(error, AutomotiveSearchError):
        logger.warning("Automotive search error", extra={
            'error': str(error),
            'fallback_used': True
        })
        error_response['message'] = "I'm having trouble accessing current automotive data, but I can still help with general automotive advice."
        
    elif isinstance(error, ConversationMemoryError):
        logger.error("Memory system error", extra={
            'error': str(error),
            'conversation_id': context.get('conversation_id')
        })
        error_response['message'] = "I'm having trouble accessing our conversation history, but I can still help you."
        
    else:
        logger.error("Unexpected error", extra={
            'error': str(error),
            'error_type': type(error).__name__,
            'context': context
        })
        error_response['message'] = "I encountered an unexpected error. Please try again in a moment."
    
    return error_response
```

## 7. Performance Optimization

### 7.1 Lambda Optimization

#### **Container Reuse and Caching**
```python
# lambda/performance.py
from functools import lru_cache
import time
from typing import Dict, Any

class PerformanceOptimizer:
    """Performance optimization utilities"""
    
    def __init__(self):
        self.context_cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    @lru_cache(maxsize=100)
    def get_cached_context(self, conversation_id: str) -> str:
        """LRU cached context retrieval"""
        return self._load_context_from_db(conversation_id)
    
    def warm_cache(self, conversation_ids: List[str]):
        """Pre-warm cache for active conversations"""
        for conv_id in conversation_ids:
            self.get_cached_context(conv_id)
    
    def measure_performance(self, operation_name: str):
        """Performance measurement decorator"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                start_time = time.time()
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                logger.info(f"Performance metric", extra={
                    'operation': operation_name,
                    'duration': duration,
                    'success': True
                })
                
                return result
            return wrapper
        return decorator

# Usage
optimizer = PerformanceOptimizer()

@optimizer.measure_performance("strands_agent_processing")
def process_with_strands_agent(message: str, context: str) -> str:
    return chatbot(f"{context}\n\nCurrent message: {message}")
```

## Success Criteria

### **Implementation Quality:**
- ✅ **Simple Architecture**: Single Strands agent replaces complex workflows
- ✅ **Conversational Flow**: Natural chat experience with automotive context
- ✅ **Memory System**: Multi-layer context management working efficiently
- ✅ **Real-time Updates**: AppSync subscriptions delivering messages instantly
- ✅ **Error Handling**: Graceful degradation for all failure scenarios

### **Performance Targets:**
- ✅ **Response Times**: Greetings <2s, Tool queries <10s, Context loading <200ms
- ✅ **Scalability**: 50+ concurrent conversations, 1000+ messages/day
- ✅ **Memory Efficiency**: <10KB context per conversation
- ✅ **Reliability**: >99% uptime, <5% error rate

This low-level design provides a **complete blueprint** for implementing the Dixon Smart Repair conversational chatbot using **Strands Agents** with **production-ready architecture** and **comprehensive error handling**.
│   │   ├── mcp/                     # MCP server integration
│   │   ├── amplify/                 # AWS Amplify services
│   │   └── automotive/              # Automotive business logic
│   ├── utils/
│   │   ├── automotive/              # VIN validation, vehicle utilities
│   │   ├── validation/              # Input validation utilities
│   │   └── formatting/              # Data formatting utilities
│   ├── types/                       # TypeScript type definitions
│   ├── hooks/                       # Custom React hooks
│   ├── context/                     # React context providers
│   └── constants/                   # Application constants
```

## 1. Core Component Interfaces

### 1.1 ChatGPT-Style UI Components

#### ConversationScreen Interface
```typescript
interface ConversationScreenProps {
  conversationId?: string;
  vehicleContext?: VehicleInfo;
  onVehicleSelect?: (vehicle: VehicleInfo) => void;
}

interface ConversationState {
  messages: Message[];
  isTyping: boolean;
  attachments: Attachment[];
  currentVehicle?: VehicleInfo;
  diagnosticContext?: DiagnosticContext;
}

// Core Functionality:
// - Display ChatGPT-style conversation interface
// - Handle automotive branding and theming
// - Manage conversation state and context
// - Integrate with Strands agent responses
```

#### HamburgerMenu Interface
```typescript
interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: MenuSection;
  onSectionChange: (section: MenuSection) => void;
}

enum MenuSection {
  CHAT_HISTORY = 'chat_history',
  PAST_INVOICES = 'past_invoices', 
  SERVICE_HISTORY = 'service_history',
  MY_VEHICLES = 'my_vehicles',
  PREFERRED_MECHANICS = 'preferred_mechanics',
  MAINTENANCE_REMINDERS = 'maintenance_reminders',
  SETTINGS = 'settings'
}

// Core Functionality:
// - Provide automotive-specific navigation
// - Maintain conversation context during navigation
// - Support ChatGPT-style floating menu behavior
```

#### MessageBubble Interface
```typescript
interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
  onTimestampToggle?: () => void;
}

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
  attachments?: Attachment[];
  automotiveContext?: AutomotiveContext;
}

interface AutomotiveContext {
  vehicleInfo?: VehicleInfo;
  diagnosticConfidence?: number;
  toolsUsed?: string[];
  repairRecommendations?: RepairOption[];
}

// Core Functionality:
// - Display user/AI messages with automotive context
// - Show diagnostic confidence and tool information
// - Handle attachment display (photos, documents)
// - Support timestamp interaction
```

### 1.2 Automotive Component Interfaces

#### VINScanner Interface
```typescript
interface VINScannerProps {
  onVINDetected: (vin: string, confidence: number) => void;
  onManualEntry: (vin: string) => void;
  onError: (error: VINScanError) => void;
}

interface VINScanResult {
  vin: string;
  confidence: number;
  validationResult: VINValidationResult;
}

interface VINScanError {
  type: 'camera_permission' | 'ocr_failure' | 'validation_error';
  message: string;
  recoveryAction?: string;
}

// Core Functionality:
// - Camera-based VIN scanning with OCR
// - Real-time VIN validation during scanning
// - Manual VIN entry with format validation
// - Error handling for camera and OCR failures
```

#### VehicleInfoCollector Interface
```typescript
interface VehicleInfoCollectorProps {
  onVehicleInfoComplete: (info: VehicleInfo, confidence: number) => void;
  initialInfo?: Partial<VehicleInfo>;
  mode: 'generic' | 'basic' | 'vin';
  onError: (error: ValidationError) => void;
}

interface VehicleInfo {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
  mileage?: number;
}

// Confidence Levels:
// - Generic: 65% (no specific vehicle info)
// - Basic: 80% (year, make, model)
// - VIN: 95% (complete VIN decoding)

// Core Functionality:
// - Progressive information collection
// - Confidence level calculation and display
// - Auto-completion for make/model selection
// - Integration with VIN decoding service
```

#### DiagnosticConfidence Interface
```typescript
interface DiagnosticConfidenceProps {
  confidence: number;
  factors: ConfidenceFactor[];
  onFactorExplain?: (factor: ConfidenceFactor) => void;
}

interface ConfidenceFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

// Core Functionality:
// - Visual confidence indicator with color coding
// - Confidence factor breakdown and explanation
// - Recommendations for improving diagnostic confidence
// - Integration with Strands agent confidence scoring
```

## 2. Service Layer Error Handling Patterns

### 2.1 Strands Agent Service Error Handling
```typescript
interface StrandsAgentService {
  runDiagnosticWorkflow(request: DiagnosticRequest): Promise<DiagnosticResult>;
  // Error handling is critical for automotive safety
}

interface StrandsError {
  code: 'AGENT_UNAVAILABLE' | 'TOOL_FAILURE' | 'TIMEOUT' | 'INVALID_INPUT';
  message: string;
  toolName?: string;
  fallbackAvailable: boolean;
  retryable: boolean;
}

// Error Handling Patterns:
// 1. Graceful Degradation: Continue conversation with reduced functionality
// 2. Fallback Mechanisms: Use LLM knowledge when tools fail
// 3. User Communication: Clearly explain limitations and confidence impact
// 4. Retry Logic: Intelligent retry for transient failures
// 5. Safety First: Never provide unsafe diagnostic recommendations
```

### 2.2 Web Search Integration Error Handling
```typescript
interface WebSearchService {
  searchAutomotiveParts(query: string): Promise<WebSearchResult[]>;
  // Web search failures should not break diagnostic workflow
}

interface WebSearchError {
  code: 'CONNECTION_FAILED' | 'RATE_LIMITED' | 'INVALID_RESPONSE' | 'TIMEOUT' | 'NO_RESULTS';
  message: string;
  provider: 'tavily';
  fallbackStrategy: 'llm_knowledge' | 'cached_data' | 'user_notification';
}

// Error Handling Patterns:
// 1. LLM Fallback: Use base LLM knowledge when web search fails
// 2. Cache Utilization: Use cached search results when real-time unavailable
// 3. Quality Filtering: Filter web search results for automotive relevance
// 4. Transparent Communication: Inform users about data source and limitations
// 5. Rate Limit Management: Intelligent request throttling for search API
```
```

### 2.3 Automotive Validation Error Handling
```typescript
interface ValidationService {
  validateVIN(vin: string): VINValidationResult;
  // Validation errors must provide clear user guidance
}

interface ValidationError {
  field: string;
  code: 'INVALID_FORMAT' | 'INVALID_CHECK_DIGIT' | 'UNSUPPORTED_VEHICLE';
  message: string;
  userGuidance: string;
  correctionSuggestions?: string[];
}

// Error Handling Patterns:
// 1. User-Friendly Messages: Convert technical errors to user guidance
// 2. Correction Suggestions: Provide specific steps to fix issues
// 3. Progressive Validation: Validate as user types for immediate feedback
// 4. Confidence Impact: Explain how validation errors affect diagnostic confidence
```

## 3. Service Method Signatures

### 3.1 Strands Agent Service Methods
```typescript
class StrandsAgentService {
  // Primary diagnostic workflow orchestration
  async runDiagnosticWorkflow(
    request: DiagnosticRequest
  ): Promise<Result<DiagnosticResult, StrandsError>>;

  // Individual tool methods for granular control
  async analyzeSymptoms(
    symptoms: string, 
    vehicleInfo?: VehicleInfo
  ): Promise<Result<SymptomAnalysis, StrandsError>>;

  async lookupParts(
    partRequest: PartLookupRequest
  ): Promise<Result<PartLookupResult, StrandsError>>;

  async estimateLabor(
    laborRequest: LaborEstimateRequest
  ): Promise<Result<LaborEstimate, StrandsError>>;

  async calculatePricing(
    pricingRequest: PricingRequest
  ): Promise<Result<PricingResult, StrandsError>>;

  async getRepairInstructions(
    repairRequest: RepairInstructionRequest
  ): Promise<Result<RepairInstructions, StrandsError>>;
}

// Result Type for Consistent Error Handling
type Result<T, E> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
  fallbackData?: Partial<T>;
};
```

### 3.2 Web Search Integration Service Methods
```typescript
class WebSearchService {
  // Real-time web search for automotive information
  async searchAutomotiveParts(
    query: string, 
    vehicleInfo?: VehicleInfo
  ): Promise<Result<WebSearchResult[], WebSearchError>>;

  async searchLaborRates(
    location: string, 
    repairType: string
  ): Promise<Result<WebSearchResult[], WebSearchError>>;

  async searchRepairProcedures(
    vehicleInfo: VehicleInfo, 
    repairType: string
  ): Promise<Result<WebSearchResult[], WebSearchError>>;

  async searchVINInformation(
    vin: string
  ): Promise<Result<WebSearchResult[], WebSearchError>>;

  // Configuration and health methods
  async testConnection(): Promise<boolean>;
  async validateSearchQuality(results: WebSearchResult[]): Promise<QualityScore>;
}

// Automotive Data Parsing Service
class AutomotiveDataParser {
  parsePartsFromSearch(results: WebSearchResult[]): PartInfo[];
  parseLaborRatesFromSearch(results: WebSearchResult[]): LaborRateInfo[];
  parseRepairProceduresFromSearch(results: WebSearchResult[]): RepairProcedure[];
  validateAutomotiveRelevance(result: WebSearchResult): RelevanceScore;
}
```
```

### 3.3 Automotive Validation Service Methods
```typescript
class ValidationService {
  // VIN validation and decoding
  validateVIN(vin: string): VINValidationResult;
  decodeVIN(vin: string): Result<VehicleInfo, ValidationError>;
  
  // Vehicle information validation
  validateVehicleInfo(info: Partial<VehicleInfo>): ValidationResult;
  calculateConfidence(info: VehicleInfo): ConfidenceCalculation;
  
  // Input sanitization for safety
  sanitizeUserInput(input: string): string;
  validateSymptomDescription(symptoms: string): ValidationResult;
}
```

## 4. Configuration Requirements

### 4.1 AWS Service Configuration
```typescript
interface AWSConfiguration {
  // Amplify Configuration
  amplify: {
    region: string;
    userPoolId: string;
    userPoolWebClientId: string;
    apiEndpoint: string;
    storageConfig: {
      bucket: string;
      region: string;
    };
  };

  // Strands Agent Configuration
  strands: {
    agentId: string;
    region: string;
    timeout: number;
    retryAttempts: number;
    fallbackEnabled: boolean;
  };

  // Environment-specific settings
  environment: 'development' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

### 4.2 Web Search Service Configuration
```typescript
interface WebSearchConfiguration {
  // Primary Web Search Provider
  primaryProvider: {
    name: 'tavily';
    apiKey: string;
    baseUrl: string;
    timeout: number;
    rateLimit: {
      requestsPerMinute: number;
      requestsPerDay: number;
    };
  };

  // Caching Configuration for Search Results
  cache: {
    enabled: boolean;
    ttl: {
      partsSearch: number;        // 1-4 hours
      laborSearch: number;        // 24-48 hours
      procedureSearch: number;    // 7 days
    };
  };

  // Search Quality Configuration
  qualityFilters: {
    minRelevanceScore: number;
    maxResultsPerQuery: number;
    automotiveKeywords: string[];
  };
}
```

### 4.3 Automotive Domain Configuration
```typescript
interface AutomotiveConfiguration {
  // VIN Validation Settings
  vinValidation: {
    strictMode: boolean;
    allowTestVINs: boolean;
    supportedRegions: string[];
  };

  // Confidence Thresholds
  confidenceThresholds: {
    minimum: number;      // 65% - Generic info
    good: number;         // 80% - Basic info
    excellent: number;    // 95% - VIN-based
  };

  // Diagnostic Settings
  diagnostic: {
    maxSymptomLength: number;
    maxAttachments: number;
    supportedImageFormats: string[];
    maxImageSize: number;
  };
}
```

## 5. Implementation Patterns

### 5.1 Error Boundary Pattern
```typescript
interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Usage for automotive safety:
// - Wrap diagnostic components to prevent crashes
// - Provide meaningful fallback UI for automotive workflows
// - Log errors for debugging while maintaining user experience
```

### 5.2 Retry Pattern with Exponential Backoff
```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

// Usage for service reliability:
// - Retry failed Strands agent calls
// - Retry MCP service requests
// - Implement circuit breaker for repeated failures
```

### 5.3 Cache-First Pattern
```typescript
interface CacheStrategy {
  key: string;
  ttl: number;
  fallbackToNetwork: boolean;
  updateInBackground: boolean;
}

// Usage for performance:
// - Cache MCP responses for parts and labor data
// - Cache vehicle information and VIN decoding results
// - Cache conversation history for offline access
```

## 6. Quality Standards

### 6.1 TypeScript Configuration
- Enable strict mode for type safety
- Use automotive-specific type definitions
- Implement proper error types for all services
- Ensure null safety for all automotive data

### 6.2 Performance Requirements
- App launch time: < 3 seconds
- Screen transitions: < 300ms
- Diagnostic workflow: < 5 seconds end-to-end
- Memory usage: Efficient cleanup of resources

### 6.3 Security Requirements
- Input sanitization for all user data
- Secure storage for API keys and tokens
- Data encryption for sensitive automotive information
- Privacy compliance for user vehicle data

## Validation Checklist

### Component Interfaces
- [ ] All ChatGPT-style UI components have clear interfaces
- [ ] Automotive components support safety-critical error handling
- [ ] Service layer methods use Result type for consistent error handling
- [ ] Configuration interfaces support all required AWS and MCP settings

### Error Handling
- [ ] Graceful degradation patterns implemented for all services
- [ ] User-friendly error messages for automotive domain
- [ ] Fallback mechanisms ensure diagnostic workflow continuity
- [ ] Safety-first approach prevents unsafe recommendations

### Implementation Readiness
- [ ] All interfaces support TDD implementation approach
- [ ] Error handling patterns enable reliable automotive diagnostics
- [ ] Configuration requirements support AWS deployment
- [ ] Quality standards ensure production-ready implementation
