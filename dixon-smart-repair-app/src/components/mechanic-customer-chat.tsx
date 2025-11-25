import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ChatMessage {
  id: string
  senderId: string
  senderType: 'customer' | 'mechanic'
  senderName: string
  content: string
  timestamp: Date
  messageType: 'text' | 'info_request' | 'service_update' | 'system'
  metadata?: {
    serviceRecordId?: string
    diagnosticSessionId?: string
    requestType?: 'vehicle_info' | 'symptoms' | 'photos' | 'diagnostic_data'
    urgency?: 'low' | 'medium' | 'high'
  }
}

interface ServiceContext {
  serviceRecordId: string
  vehicleInfo: {
    year: number
    make: string
    model: string
    vin?: string
  }
  diagnosis: {
    issue: string
    confidence: number
    description: string
  }
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  mechanic: {
    name: string
    shop: string
    phone: string
  }
}

interface MechanicCustomerChatProps {
  serviceContext: ServiceContext
  customerId: string
  mechanicId: string
  onSendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  onClose: () => void
}

export function MechanicCustomerChat({
  serviceContext,
  customerId,
  mechanicId,
  onSendMessage,
  onClose
}: MechanicCustomerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    // Mock conversation history
    {
      id: 'msg_001',
      senderId: 'system',
      senderType: 'customer',
      senderName: 'System',
      content: `Service appointment created for ${serviceContext.diagnosis.issue}`,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      messageType: 'system'
    },
    {
      id: 'msg_002',
      senderId: mechanicId,
      senderType: 'mechanic',
      senderName: serviceContext.mechanic.name,
      content: `Hi! I've reviewed your AI diagnostic results for the ${serviceContext.diagnosis.issue}. The AI confidence was ${serviceContext.diagnosis.confidence}%, which is quite good. I'd like to ask a few questions before we start the service.`,
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      messageType: 'text'
    },
    {
      id: 'msg_003',
      senderId: mechanicId,
      senderType: 'mechanic',
      senderName: serviceContext.mechanic.name,
      content: `Could you tell me if the noise happens every time you brake, or only under certain conditions (like hard braking, wet weather, etc.)?`,
      timestamp: new Date(Date.now() - 85 * 60 * 1000),
      messageType: 'info_request',
      metadata: {
        serviceRecordId: serviceContext.serviceRecordId,
        requestType: 'symptoms',
        urgency: 'medium'
      }
    },
    {
      id: 'msg_004',
      senderId: customerId,
      senderType: 'customer',
      senderName: 'You',
      content: `It happens every time I brake, but it's louder when I brake harder. Also, I noticed the brake pedal feels a bit softer than usual.`,
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      messageType: 'text'
    },
    {
      id: 'msg_005',
      senderId: mechanicId,
      senderType: 'mechanic',
      senderName: serviceContext.mechanic.name,
      content: `Perfect, that confirms the AI diagnosis. The soft pedal definitely indicates a brake fluid issue along with the worn pads. We'll check both when you come in. Your appointment is confirmed for tomorrow at 10 AM.`,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      messageType: 'service_update'
    }
  ])
  
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
      senderId: customerId,
      senderType: 'customer',
      senderName: 'You',
      content: newMessage.trim(),
      messageType: 'text'
    }

    // Add message locally
    const fullMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, fullMessage])
    onSendMessage(message)
    setNewMessage('')

    // Simulate mechanic typing response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const mechanicResponse: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        senderId: mechanicId,
        senderType: 'mechanic',
        senderName: serviceContext.mechanic.name,
        content: generateMechanicResponse(newMessage.trim()),
        timestamp: new Date(),
        messageType: 'text'
      }
      setMessages(prev => [...prev, mechanicResponse])
    }, 2000)
  }

  const generateMechanicResponse = (customerMessage: string): string => {
    const message = customerMessage.toLowerCase()
    
    if (message.includes('when') || message.includes('time')) {
      return "Your appointment is scheduled for tomorrow at 10 AM. We'll send you a reminder text 30 minutes before. Please bring your keys and any service records you have."
    }
    
    if (message.includes('cost') || message.includes('price') || message.includes('how much')) {
      return "Based on the AI diagnostic and your additional symptoms, we're looking at $250-450 for brake pads and fluid service. I'll give you an exact quote after the inspection."
    }
    
    if (message.includes('how long') || message.includes('duration')) {
      return "The brake service should take about 2-3 hours. We'll call you as soon as it's ready for pickup."
    }
    
    return "Thanks for the additional information! This helps me prepare for your service. Is there anything else you'd like to know about the repair?"
  }

  const formatTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const getMessageIcon = (messageType: ChatMessage['messageType']) => {
    switch (messageType) {
      case 'info_request': return 'help-circle'
      case 'service_update': return 'calendar'
      case 'system': return 'information-circle'
      default: return null
    }
  }

  const getMessageColor = (messageType: ChatMessage['messageType']) => {
    switch (messageType) {
      case 'info_request': return '#f59e0b'
      case 'service_update': return '#3b82f6'
      case 'system': return '#6b7280'
      default: return null
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{serviceContext.mechanic.name}</Text>
          <Text style={styles.headerSubtitle}>
            {serviceContext.mechanic.shop} • {serviceContext.vehicleInfo.year} {serviceContext.vehicleInfo.make} {serviceContext.vehicleInfo.model}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.phoneButton}>
          <Ionicons name="call" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Service Context Banner */}
      <View style={styles.contextBanner}>
        <View style={styles.contextInfo}>
          <Ionicons name="medical" size={16} color="#3b82f6" />
          <Text style={styles.contextText}>
            Service: {serviceContext.diagnosis.issue} • Status: {serviceContext.status}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.senderType === 'customer' ? styles.customerMessage : styles.mechanicMessage
            ]}
          >
            {message.senderType === 'mechanic' && (
              <View style={styles.mechanicAvatar}>
                <Ionicons name="person" size={16} color="#ffffff" />
              </View>
            )}
            
            <View
              style={[
                styles.messageBubble,
                message.senderType === 'customer' ? styles.customerBubble : styles.mechanicBubble,
                message.messageType === 'system' && styles.systemBubble
              ]}
            >
              {getMessageIcon(message.messageType) && (
                <View style={styles.messageHeader}>
                  <Ionicons 
                    name={getMessageIcon(message.messageType) as any} 
                    size={14} 
                    color={getMessageColor(message.messageType)} 
                  />
                  <Text style={[styles.messageTypeLabel, { color: getMessageColor(message.messageType) }]}>
                    {message.messageType === 'info_request' ? 'Information Request' :
                     message.messageType === 'service_update' ? 'Service Update' :
                     'System Message'}
                  </Text>
                </View>
              )}
              
              <Text
                style={[
                  styles.messageText,
                  message.senderType === 'customer' ? styles.customerText : styles.mechanicText,
                  message.messageType === 'system' && styles.systemText
                ]}
              >
                {message.content}
              </Text>
              
              <Text
                style={[
                  styles.messageTime,
                  message.senderType === 'customer' ? styles.customerTime : styles.mechanicTime
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
            
            {message.senderType === 'customer' && (
              <View style={styles.customerAvatar}>
                <Ionicons name="person" size={16} color="#ffffff" />
              </View>
            )}
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.mechanicMessage]}>
            <View style={styles.mechanicAvatar}>
              <Ionicons name="person" size={16} color="#ffffff" />
            </View>
            <View style={[styles.messageBubble, styles.mechanicBubble]}>
              <Text style={styles.typingText}>
                {serviceContext.mechanic.name} is typing...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  phoneButton: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
  },
  contextBanner: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  contextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  customerMessage: {
    justifyContent: 'flex-end',
  },
  mechanicMessage: {
    justifyContent: 'flex-start',
  },
  mechanicAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  customerBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  mechanicBubble: {
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  systemBubble: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  customerText: {
    color: '#ffffff',
  },
  mechanicText: {
    color: '#0f172a',
  },
  systemText: {
    color: '#92400e',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  customerTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  mechanicTime: {
    color: '#64748b',
  },
  typingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
})
