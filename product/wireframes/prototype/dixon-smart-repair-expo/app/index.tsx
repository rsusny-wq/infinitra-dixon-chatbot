import { useState, useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Modal,
} from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import Sidebar from '../components/sidebar'
import { VoiceButton } from '../components/voice-button'
import { HandsFreeToggle } from '../components/hands-free-toggle'
import { PhotoAttachment } from '../components/photo-attachment'
import { VinCaptureCard } from '../components/vin-capture-card'
import { DiagnosticFlow } from '../components/diagnostic-flow'
import { DiagnosticResultCard } from '../components/diagnostic-result-card'
import { InlineVehicleChoice, type GuidanceLevel } from '../components/inline-vehicle-choice'
import { BasicVehicleInfo as BasicVehicleInfoComponent, type BasicVehicleInfo } from '../components/basic-vehicle-info'
import { ServiceRecord, ServiceRecordComponent } from '../components/service-record'
import { CommunicationHub } from '../components/communication-hub'
import { AdvancedPhotoAttachment } from '../components/advanced-photo-attachment'
import { EnhancedVinScanner } from '../components/enhanced-vin-scanner'
import { QRDonglePairing } from '../components/qr-dongle-pairing'
import { OfflineSyncManager } from '../components/offline-sync-manager'
import { useVoice } from '../hooks/use-voice-fixed'
import { useChatStore, type ChatMessage } from '../store/chat-store-simple'

// Suppress React Native Web deprecation warnings on web
if (Platform.OS === 'web') {
  const originalWarn = console.warn
  console.warn = (...args) => {
    const message = args[0]
    if (typeof message === 'string') {
      if (message.includes('shadow*" style props are deprecated') ||
          message.includes('props.pointerEvents is deprecated')) {
        return
      }
    }
    originalWarn.apply(console, args)
  }
}

// ChatGPT-style Message Component
const MessageBubble = ({ 
  message, 
  onGuidanceLevelChoice 
}: { 
  message: ChatMessage
  onGuidanceLevelChoice?: (level: GuidanceLevel) => void
}) => {
  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'
  const isChoice = message.type === 'choice'
  
  // Handle choice message type
  if (isChoice && message.content === 'vehicle_info_choice') {
    return (
      <View style={styles.messageContainer}>
        <InlineVehicleChoice
          onChoiceSelected={onGuidanceLevelChoice!}
          symptomType={message.metadata?.symptomType || 'vehicle issue'}
        />
      </View>
    )
  }
  
  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      {!isUser && !isSystem && (
        <View style={styles.aiAvatar}>
          <MaterialIcons name="build" size={20} color="#fff" />
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : isSystem ? styles.systemBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : isSystem ? styles.systemText : styles.aiText
        ]}>
          {message.content}
        </Text>
        
        {message.vinData && (
          <View style={styles.vinCard}>
            <Text style={styles.vinCardTitle}>Vehicle Identified</Text>
            <Text style={styles.vinCardText}>
              {message.vinData.year} {message.vinData.make} {message.vinData.model}
            </Text>
            <Text style={styles.vinCardVin}>VIN: {message.vinData.vin}</Text>
          </View>
        )}
        
        {message.photos && message.photos.length > 0 && (
          <View style={styles.photoContainer}>
            {message.photos.map((photo, index) => (
              <View key={index} style={styles.photoPlaceholder}>
                <MaterialIcons name="photo" size={24} color="#666" />
                <Text style={styles.photoText}>Photo {index + 1}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {isUser && (
        <View style={styles.userAvatar}>
          <MaterialIcons name="person" size={20} color="#fff" />
        </View>
      )}
    </View>
  )
}

// Typing Indicator Component
const TypingIndicator = () => (
  <View style={styles.typingContainer}>
    <View style={styles.aiAvatar}>
      <MaterialIcons name="build" size={20} color="#fff" />
    </View>
    <View style={styles.typingBubble}>
      <View style={styles.typingDots}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </View>
  </View>
)

export default function ChatScreen() {
  // Zustand store integration
  const { 
    currentSession, 
    addMessage, 
    createNewSession,
    getCurrentMessages 
  } = useChatStore()
  
  // Local state
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [showVinCapture, setShowVinCapture] = useState(false)
  const [showDiagnosticFlow, setShowDiagnosticFlow] = useState(false)
  const [showBasicVehicleInfo, setShowBasicVehicleInfo] = useState(false)
  const [currentVehicleInfo, setCurrentVehicleInfo] = useState<any>(null)
  const [currentSymptoms, setCurrentSymptoms] = useState<string[]>([])
  const [currentSymptomType, setCurrentSymptomType] = useState<string>('')
  const [selectedGuidanceLevel, setSelectedGuidanceLevel] = useState<GuidanceLevel | null>(null)
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [showServiceBooking, setShowServiceBooking] = useState(false)
  const [showCommunicationHub, setShowCommunicationHub] = useState(false)
  const [showAdvancedPhotos, setShowAdvancedPhotos] = useState(false)
  const [attachedPhotos, setAttachedPhotos] = useState<any[]>([])
  const [showEnhancedVinScanner, setShowEnhancedVinScanner] = useState(false)
  const [showQRDonglePairing, setShowQRDonglePairing] = useState(false)
  const [showOfflineSync, setShowOfflineSync] = useState(false)
  const [pairedDongle, setPairedDongle] = useState<any>(null)

  // Handler for guidance level choice
  const handleGuidanceLevelChoice = (level: GuidanceLevel) => {
    setSelectedGuidanceLevel(level)
    
    // Add user's choice to chat
    addMessage({
      type: 'user',
      content: `I'd like ${level === 'generic' ? 'general guidance' : level === 'basic' ? 'vehicle-specific guidance' : 'precision guidance with VIN'}`
    })
    
    switch (level) {
      case 'generic':
        // Handle generic guidance inline
        addMessage({
          type: 'system',
          content: 'Providing general automotive guidance'
        })
        
        setTimeout(() => {
          addMessage({
            type: 'ai',
            content: `Perfect! I'll provide general guidance for your ${currentSymptomType}. This advice works for most vehicles and can help you understand what might be happening.

**Next Steps:**
• I'll ask a few general questions to narrow down the issue
• You'll get actionable advice and troubleshooting steps
• You can upgrade to vehicle-specific guidance anytime for more accuracy

Let's start with some questions about your ${currentSymptomType}...`
          })
          
          // Start diagnostic flow with generic level
          setTimeout(() => setShowDiagnosticFlow(true), 1000)
        }, 1000)
        break
      case 'basic':
        setShowBasicVehicleInfo(true)
        break
      case 'vin':
        setShowEnhancedVinScanner(true)
        break
    }
  }
  const scrollViewRef = useRef<ScrollView>(null)
  
  // Get messages from store
  const messages = getCurrentMessages()
  
  // Voice integration
  const voice = useVoice({
    onResult: (transcript: string) => {
      handleSendMessage(transcript, false)
    },
    onError: (error) => {
      console.error('Voice error:', error)
    }
  })

  // Initialize with new session and welcome message
  useEffect(() => {
    if (!currentSession) {
      createNewSession()
      
      // Add welcome message after session is created
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: "Hi! I'm your automotive diagnostic assistant. I can help you identify car problems, understand repair needs, and get cost estimates.\n\nTo get started, you can:\n• Describe what's happening with your vehicle\n• Upload photos of any issues\n• Share your VIN for vehicle-specific help\n\nWhat's going on with your car today?"
        })
      }, 100)
    }
  }, [currentSession, createNewSession, addMessage])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages, isTyping])

  // Reset diagnostic state when session changes
  useEffect(() => {
    if (currentSession) {
      // Reset diagnostic state for new sessions
      setShowVinCapture(false)
      setShowDiagnosticFlow(false)
      setShowBasicVehicleInfo(false)
      setDiagnosticResult(null)
      setShowPhotoOptions(false)
      setShowServiceBooking(false)
      // Reset vehicle info and symptoms for fresh start
      setCurrentVehicleInfo(null)
      setCurrentSymptoms([])
      setCurrentSymptomType('')
      setSelectedGuidanceLevel(null)
    }
  }, [currentSession?.id])

  const handleSendMessage = async (text: string, isVoiceInput: boolean = false) => {
    if (!text.trim()) return

    // Add user message to store
    addMessage({
      type: 'user',
      content: text.trim()
    })

    setInputText('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(text.trim())
      
      // Add AI response to store
      addMessage({
        type: 'ai',
        content: aiResponse
      })
      
      setIsTyping(false)
    }, 2000)
  }

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    // Check if this is a symptom that should trigger guidance choice
    const isSymptomDescription = input.includes('brake') || input.includes('engine') || 
                                input.includes('noise') || input.includes('sound') ||
                                input.includes('problem') || input.includes('issue') ||
                                input.includes('wrong') || input.includes('broken') ||
                                input.includes('leak') || input.includes('smoke') ||
                                input.includes('vibrat') || input.includes('shake') ||
                                input.includes('stall') || input.includes('rough')
    
    if (isSymptomDescription) {
      // Determine symptom type for better guidance
      let symptomType = 'vehicle issue'
      if (input.includes('brake')) symptomType = 'brake issue'
      else if (input.includes('engine')) symptomType = 'engine issue'
      else if (input.includes('noise') || input.includes('sound')) symptomType = 'noise issue'
      else if (input.includes('leak')) symptomType = 'fluid leak'
      else if (input.includes('smoke')) symptomType = 'smoke issue'
      
      setCurrentSymptomType(symptomType)
      setCurrentSymptoms([userInput])
      
      // Add inline choice component to chat after providing immediate help
      setTimeout(() => {
        addMessage({
          type: 'choice',
          content: 'vehicle_info_choice',
          metadata: { symptomType }
        })
      }, 2000)
      
      // Provide immediate helpful response based on symptom type
      if (input.includes('brake')) {
        return `I can help with brake issues! Brake problems are important safety concerns that need attention.

**Immediate Safety Check:**
• Can you still stop the vehicle safely?
• Is the brake pedal firm or does it feel soft/spongy?
• Are you hearing grinding, squealing, or other noises?

**Common Brake Issues:**
• Squealing usually means brake pads need replacement
• Grinding often indicates worn pads damaging rotors
• Soft pedal may indicate brake fluid issues
• Vibration could mean warped rotors

I can provide different levels of guidance to help you further - from general advice to vehicle-specific recommendations.`
      }
      
      if (input.includes('engine')) {
        return `I can help with engine issues! Engine problems can range from simple to complex, so let's figure out what's going on.

**Key Questions:**
• Is the engine running rough or stalling?
• Are there any warning lights on your dashboard?
• Do you notice any unusual sounds, smells, or smoke?
• When does the problem occur (startup, idle, driving)?

**Common Engine Issues:**
• Rough idle often indicates spark plugs or air filter
• Stalling can be fuel system or ignition related
• Strange noises may indicate belt or internal issues
• Check engine light usually stores diagnostic codes

I can provide different levels of guidance - from general troubleshooting to vehicle-specific diagnostics.`
      }
      
      if (input.includes('noise') || input.includes('sound')) {
        return `I can help identify that noise! Vehicle sounds often tell us exactly what's wrong.

**Noise Identification:**
• **Squealing**: Usually belts or brake pads
• **Grinding**: Often brakes or worn components
• **Knocking**: Could be engine or suspension
• **Rattling**: Loose parts or heat shields
• **Humming/Whining**: Often wheel bearings or transmission

**Important Details:**
• When do you hear it? (braking, turning, accelerating)
• Where does it seem to come from?
• Does it happen all the time or only sometimes?

I can provide different levels of help - from general noise diagnosis to vehicle-specific guidance.`
      }
      
      // Generic helpful response for other symptoms
      return `I can help with that ${symptomType}! Let me provide some immediate guidance while we figure out the best way to help you.

**First Steps:**
• Is this a safety concern that requires immediate attention?
• When did you first notice this issue?
• Does it happen all the time or only in certain conditions?

**General Approach:**
• Document when and how the issue occurs
• Note any warning lights or unusual sounds
• Consider recent changes (weather, driving conditions, maintenance)

I can provide different levels of guidance to help you - from general automotive advice to vehicle-specific recommendations.`
    }
    
    // Handle other types of input
    if (input.includes('vin') || input.match(/[A-HJ-NPR-Z0-9]{17}/)) {
      return "Great! Having your VIN helps me provide vehicle-specific guidance.\n\nI can use your VIN to:\n• Identify your exact vehicle specifications\n• Check for known issues or recalls\n• Provide accurate parts and labor estimates\n• Recommend certified mechanics in your area\n\nWhat specific problem are you experiencing with your vehicle?"
    }
    
    return "I understand you're having an issue with your vehicle. To provide the best help, I'd like to know:\n\n• What symptoms are you experiencing?\n• When do these symptoms occur?\n• Is this a safety concern?\n\nFeel free to describe the problem in your own words - I'm here to help translate car troubles into actionable solutions!"
  }

  const handleEnhancedVinScanned = (vin: string, method: 'camera' | 'photo' | 'manual') => {
    // Add message about VIN being scanned
    const methodText = method === 'camera' ? 'camera scanning' : 
                      method === 'photo' ? 'photo analysis' : 'manual entry'
    
    addMessage({
      id: Date.now().toString(),
      text: `✅ VIN captured via ${methodText}: ${vin}`,
      isUser: true,
      timestamp: new Date(),
      type: 'vin_capture'
    })

    // Set VIN and trigger diagnostic flow
    setCurrentVehicleInfo({
      vin: vin,
      year: 2020, // Would be decoded from VIN
      make: 'Honda', // Would be decoded from VIN
      model: 'Civic' // Would be decoded from VIN
    })

    setShowEnhancedVinScanner(false)
    setSelectedGuidanceLevel('vin')
    
    // Simulate AI response
    setTimeout(() => {
      addMessage({
        type: 'ai',
        content: `Perfect! I've decoded your VIN and identified your vehicle as a 2020 Honda Civic. This gives me access to detailed technical specifications for highly accurate diagnostics.

**Enhanced VIN Scanning Results:**
• Vehicle: 2020 Honda Civic
• Scanning Method: ${methodText}
• Diagnostic Confidence: 95%+
• Technical Database: Fully Loaded

What automotive issue are you experiencing?`,
      })
    }, 1000)
  }

  const handleDonglePairing = (dongleInfo: any) => {
    setPairedDongle(dongleInfo)
    addMessage({
      type: 'system',
      content: `🔗 Connected to ${dongleInfo.shopName}'s diagnostic dongle. Enhanced diagnostics now available.`
    })
  }

  const handleOfflineSyncComplete = () => {
    addMessage({
      type: 'system', 
      content: '✅ Offline data synchronized successfully. All your diagnostic data is now up to date.'
    })
  }

  const handlePhotoAttachment = (photoUri: string) => {
    // Add photo message to store
    addMessage({
      type: 'user',
      content: 'I\'ve attached a photo of the issue.',
      photos: [photoUri]
    })
    
    setShowPhotoOptions(false)
    
    // Simulate AI response to photo
    setTimeout(() => {
      addMessage({
        type: 'ai',
        content: "Thanks for the photo! I can see the issue you're referring to.\n\nBased on the image, this looks like it could be related to [specific component]. To provide a more accurate diagnosis, could you also tell me:\n\n• When did you first notice this?\n• Have you heard any unusual sounds?\n• How is the vehicle performing?\n\nThis additional context will help me give you better guidance."
      })
    }, 1500)
  }

  const handleVoiceResult = (transcript: string, isHandsFree?: boolean) => {
    console.log('Voice result received:', transcript, 'Hands-free:', isHandsFree)
    handleSendMessage(transcript, true)
  }

  const handleVinCaptured = (vinData: any) => {
    setCurrentVehicleInfo(vinData)
    setShowVinCapture(false)
    
    // Add system message about vehicle identification
    addMessage({
      type: 'system',
      content: `Vehicle identified via VIN: ${vinData.year} ${vinData.make} ${vinData.model}`,
    })
    
    // Add AI response
    setTimeout(() => {
      addMessage({
        type: 'ai',
        content: `Perfect! I now have complete vehicle information for your ${vinData.year} ${vinData.make} ${vinData.model}.

**Precision Guidance Activated:**
• Exact vehicle specifications loaded
• Highest diagnostic confidence possible
• Precise parts pricing and availability
• Known recalls and technical service bulletins
• Vehicle-specific repair procedures

**Your Vehicle Details:**
• VIN: ${vinData.vin}
• Engine: ${vinData.engine || 'Identified'}
• Transmission: ${vinData.transmission || 'Identified'}

Now I can provide the most accurate analysis of your ${currentSymptomType}. Let me ask some targeted questions specific to your ${vinData.make} ${vinData.model}...`
      })
      
      // Start diagnostic flow with VIN-level information
      setTimeout(() => setShowDiagnosticFlow(true), 1000)
    }, 1000)
  }

  const handleDiagnosisComplete = (diagnosis: any) => {
    setDiagnosticResult(diagnosis)
    setShowDiagnosticFlow(false)
    
    // Add diagnostic result as a system message
    addMessage({
      type: 'system',
      content: `Diagnosis complete: ${diagnosis.primaryDiagnosis.issue} (${diagnosis.primaryDiagnosis.confidence}% confidence)`,
    })

    // Add comprehensive diagnostic result with service booking option
    setTimeout(() => {
      addMessage({
        type: 'ai',
        content: `Based on your ${currentSymptomType} and ${currentVehicleInfo ? 
          `${currentVehicleInfo.year} ${currentVehicleInfo.make} ${currentVehicleInfo.model}` : 
          'vehicle information'}, here's my analysis:

**Primary Diagnosis:** ${diagnosis.primaryDiagnosis.issue}
**Confidence:** ${diagnosis.primaryDiagnosis.confidence}%
**Description:** ${diagnosis.primaryDiagnosis.description}

**Estimated Cost:** $${diagnosis.estimatedCost.min} - $${diagnosis.estimatedCost.max}
**Urgency Level:** ${diagnosis.urgencyLevel}

**Recommended Actions:**
${diagnosis.recommendedActions.map((action: string) => `• ${action}`).join('\n')}

Would you like to schedule a service appointment to address this issue? I can help you book with the right priority level based on the diagnosis.`
      })
    }, 1000)
  }

  const handleGetQuotes = () => {
    addMessage({
      type: 'ai',
      content: "I'll help you get quotes from certified mechanics in your area. Based on your diagnosis, I recommend getting quotes from:\n\n• ASE-certified mechanics\n• Shops specializing in your vehicle make\n• Highly-rated local service centers\n\nWould you like me to find mechanics near you, or do you have preferred shops you'd like me to contact?",
    })
  }

  const handleScheduleService = () => {
    addMessage({
      type: 'ai',
      content: "Let's get your vehicle scheduled for service. Based on the " + (diagnosticResult?.urgencyLevel || 'medium') + " priority of this issue, I recommend:\n\n• Scheduling within the next " + (diagnosticResult?.urgencyLevel === 'high' ? '1-2 days' : '1-2 weeks') + "\n• Bringing your diagnostic results\n• Asking about warranty coverage\n\nWould you like me to help you find available appointments at nearby service centers?",
    })
  }

  const handleNewChat = () => {
    // Reset all diagnostic state
    setShowVinCapture(false)
    setShowDiagnosticFlow(false)
    setShowBasicVehicleInfo(false)
    setCurrentVehicleInfo(null)
    setCurrentSymptoms([])
    setCurrentSymptomType('')
    setSelectedGuidanceLevel(null)
    setDiagnosticResult(null)
    setShowPhotoOptions(false)
    setShowServiceBooking(false)
    setShowCommunicationHub(false)
    setShowAdvancedPhotos(false)
    setAttachedPhotos([])
    setShowEnhancedVinScanner(false)
    setShowQRDonglePairing(false)
    setShowOfflineSync(false)
    
    // Create new chat session
    createNewSession()
  }

  const handleBasicVehicleInfoCollected = (vehicleInfo: BasicVehicleInfo) => {
    setCurrentVehicleInfo(vehicleInfo)
    setShowBasicVehicleInfo(false)
    
    // Add system message about vehicle identification
    addMessage({
      type: 'system',
      content: `Vehicle identified: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.confidence} confidence)`
    })
    
    // Add AI response based on confidence level
    setTimeout(() => {
      let confidenceMessage = ''
      if (vehicleInfo.confidence === 'high') {
        confidenceMessage = `Excellent! I found your ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} in my database.`
      } else if (vehicleInfo.confidence === 'medium') {
        confidenceMessage = `Good! I found a similar match for your ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}.`
      } else {
        confidenceMessage = `I'll work with the information you provided: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}.`
      }
      
      addMessage({
        type: 'ai',
        content: `${confidenceMessage}

**Vehicle-Specific Guidance:**
• I can now provide advice tailored to your vehicle type
• Cost estimates will be more accurate for your ${vehicleInfo.make} ${vehicleInfo.model}
• I'll consider common issues for your vehicle

${vehicleInfo.specifications ? `**Vehicle Specs:**
• Engine: ${vehicleInfo.specifications.engine || 'Standard'}
• Transmission: ${vehicleInfo.specifications.transmission || 'Automatic'}` : ''}

Now let me ask some specific questions about your ${currentSymptomType} for your ${vehicleInfo.make} ${vehicleInfo.model}...

*Want even more accuracy? You can upgrade to VIN scanning anytime for the most precise guidance.*`
      })
      
      // Start diagnostic flow with basic vehicle info
      setTimeout(() => setShowDiagnosticFlow(true), 1000)
    }, 1000)
  }

  const handleServiceBooking = (serviceDetails: any) => {
    // Create service record
    const newServiceRecord: ServiceRecord = {
      id: `service_${Date.now()}`,
      diagnosticSessionId: serviceDetails.diagnosticSessionId,
      conversationId: currentSession?.id || '',
      guidanceLevel: serviceDetails.guidanceLevel,
      diagnosticConfidence: serviceDetails.diagnosticConfidence,
      serviceDate: new Date(Date.now() + getServiceDelay(serviceDetails.urgency)),
      status: 'scheduled',
      urgency: serviceDetails.urgency,
      estimatedTime: serviceDetails.estimatedTime,
      recommendedServices: serviceDetails.recommendedServices,
      vehicleInfo: currentVehicleInfo ? {
        year: currentVehicleInfo.year,
        make: currentVehicleInfo.make,
        model: currentVehicleInfo.model,
        vin: currentVehicleInfo.vin
      } : undefined,
      diagnosis: diagnosticResult ? {
        issue: diagnosticResult.primaryDiagnosis.issue,
        confidence: diagnosticResult.primaryDiagnosis.confidence,
        description: diagnosticResult.primaryDiagnosis.description
      } : undefined,
      cost: diagnosticResult ? {
        estimated: (diagnosticResult.estimatedCost.min + diagnosticResult.estimatedCost.max) / 2
      } : undefined
    }

    // Add to service records
    setServiceRecords(prev => [...prev, newServiceRecord])

    // Add confirmation message to chat
    addMessage({
      type: 'system',
      content: `Service appointment scheduled for ${newServiceRecord.serviceDate.toLocaleDateString()} - ${serviceDetails.urgency} priority`
    })

    setTimeout(() => {
      addMessage({
        type: 'ai',
        content: `Perfect! I've scheduled your service appointment for **${newServiceRecord.serviceDate.toLocaleDateString()}**.

**Appointment Details:**
• **Priority**: ${serviceDetails.urgency.charAt(0).toUpperCase() + serviceDetails.urgency.slice(1)}
• **Estimated Time**: ${serviceDetails.estimatedTime}
• **Services**: ${serviceDetails.recommendedServices.join(', ')}

**What happens next:**
• A mechanic will review your diagnostic information
• You'll receive confirmation and any additional questions
• The shop will prepare for your specific ${currentVehicleInfo?.make || 'vehicle'} service

You can view this appointment in your **Service History** section. Is there anything else I can help you with?`
      })
    }, 1000)
  }

  const getServiceDelay = (urgency: 'immediate' | 'soon' | 'routine'): number => {
    switch (urgency) {
      case 'immediate': return 4 * 60 * 60 * 1000 // 4 hours
      case 'soon': return 24 * 60 * 60 * 1000 // 1 day
      case 'routine': return 5 * 24 * 60 * 60 * 1000 // 5 days
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header - ChatGPT Style */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.titleText}>Dixon Smart Repair</Text>
          <Text style={styles.subtitleText}>Automotive AI Assistant</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={handleNewChat}
          >
            <Ionicons name="add" size={18} color="#007AFF" />
            <Text style={styles.newChatText}>New</Text>
          </TouchableOpacity>
          
          <HandsFreeToggle 
            onVoiceResult={handleVoiceResult}
          />
        </View>
      </View>

      {/* Chat Messages - ChatGPT Style */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              onGuidanceLevelChoice={handleGuidanceLevelChoice}
            />
          ))}
          
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Input Area - ChatGPT Style */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setShowPhotoOptions(!showPhotoOptions)}
            >
              <Ionicons name="add" size={24} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.advancedPhotoButton}
              onPress={() => setShowAdvancedPhotos(true)}
            >
              <Ionicons name="camera" size={20} color="#3b82f6" />
              {attachedPhotos.length > 0 && (
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeText}>{attachedPhotos.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.vinScannerButton}
              onPress={() => setShowEnhancedVinScanner(true)}
            >
              <Ionicons name="scan" size={20} color="#7c3aed" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qrDongleButton}
              onPress={() => setShowQRDonglePairing(true)}
            >
              <Ionicons name="qr-code" size={20} color="#16a34a" />
              {pairedDongle && (
                <View style={styles.pairedIndicator}>
                  <View style={styles.pairedDot} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.offlineSyncButton}
              onPress={() => setShowOfflineSync(true)}
            >
              <Ionicons name="cloud-upload" size={20} color="#ea580c" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Describe your car issue..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            
            <VoiceButton
              onVoiceResult={handleVoiceResult}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? "#007AFF" : "#ccc"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Photo Options */}
          {showPhotoOptions && (
            <PhotoAttachment
              visible={showPhotoOptions}
              onPhotosSelected={(photos) => handlePhotoAttachment(photos[0])}
              onClose={() => setShowPhotoOptions(false)}
            />
          )}

          {/* Advanced Photo Attachment */}
          {showAdvancedPhotos && (
            <Modal visible={showAdvancedPhotos} animationType="slide" presentationStyle="fullScreen">
              <AdvancedPhotoAttachment
                onPhotosUpdated={(photos) => {
                  setAttachedPhotos(photos)
                  // Add message about photos being attached
                  if (photos.length > 0) {
                    const photoMessage = `📸 ${photos.length} photo${photos.length > 1 ? 's' : ''} attached with AI analysis`
                    addMessage({
                      id: Date.now().toString(),
                      text: photoMessage,
                      isUser: true,
                      timestamp: new Date(),
                      type: 'photo_attachment'
                    })
                  }
                }}
                maxPhotos={6}
                allowedTypes={['damage', 'part', 'symptom', 'general']}
              />
              
              <View style={styles.advancedPhotoActions}>
                <TouchableOpacity 
                  style={styles.advancedPhotoCancel}
                  onPress={() => setShowAdvancedPhotos(false)}
                >
                  <Text style={styles.advancedPhotoCancelText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          )}

          {/* Basic Vehicle Information Collection */}
          {showBasicVehicleInfo && (
            <BasicVehicleInfoComponent
              visible={showBasicVehicleInfo}
              onClose={() => setShowBasicVehicleInfo(false)}
              onVehicleInfoCollected={handleBasicVehicleInfoCollected}
            />
          )}

          {/* VIN Capture */}
          {showVinCapture && (
            <VinCaptureCard
              onVinCaptured={handleVinCaptured}
              onClose={() => setShowVinCapture(false)}
            />
          )}

          {/* Enhanced VIN Scanner */}
          <EnhancedVinScanner
            visible={showEnhancedVinScanner}
            onVinScanned={handleEnhancedVinScanned}
            onClose={() => setShowEnhancedVinScanner(false)}
          />

          {/* QR Dongle Pairing */}
          <QRDonglePairing
            visible={showQRDonglePairing}
            onPairingComplete={handleDonglePairing}
            onClose={() => setShowQRDonglePairing(false)}
          />

          {/* Offline Sync Manager */}
          <OfflineSyncManager
            visible={showOfflineSync}
            onClose={() => setShowOfflineSync(false)}
            onSyncComplete={handleOfflineSyncComplete}
          />

          {/* Diagnostic Flow */}
          {showDiagnosticFlow && (
            <DiagnosticFlow
              symptoms={currentSymptoms}
              vehicleInfo={currentVehicleInfo}
              onDiagnosisComplete={handleDiagnosisComplete}
            />
          )}

          {/* Diagnostic Result - Only show if we have a result and current session */}
          {diagnosticResult && currentSession && currentSession.messages.length > 0 && (
            <DiagnosticResultCard
              diagnosis={diagnosticResult}
              vehicleInfo={currentVehicleInfo}
              onGetQuotes={handleGetQuotes}
              onScheduleService={handleScheduleService}
              onBookService={handleServiceBooking}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onOpenCommunicationHub={() => setShowCommunicationHub(true)}
      />

      {/* Communication Hub */}
      {showCommunicationHub && (
        <View style={styles.fullScreenModal}>
          <CommunicationHub
            customerId="customer_123"
            onClose={() => setShowCommunicationHub(false)}
          />
        </View>
      )}
    </SafeAreaView>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header Styles - ChatGPT Style
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtitleText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  newChatText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  handsFreeToggle: {
    transform: [{ scale: 0.8 }],
  },
  
  // Chat Container
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  
  // Message Styles - ChatGPT Style
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  
  // Avatar Styles
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  
  // Message Bubble Styles
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    marginLeft: 'auto',
  },
  aiBubble: {
    backgroundColor: '#f1f1f1',
  },
  systemBubble: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  
  // Message Text Styles
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#333',
  },
  systemText: {
    color: '#856404',
  },
  
  // VIN Card Styles
  vinCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6c3',
  },
  vinCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d5a2d',
    marginBottom: 4,
  },
  vinCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d5a2d',
  },
  vinCardVin: {
    fontSize: 12,
    color: '#5a7a5a',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Photo Styles
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  
  // Typing Indicator Styles
  typingContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  typingBubble: {
    backgroundColor: '#f1f1f1',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 12,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  
  // Input Area Styles - ChatGPT Style
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  voiceButton: {
    marginLeft: 4,
    marginRight: 4,
  },
  sendButton: {
    padding: 8,
    marginLeft: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
  advancedPhotoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  photoBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  vinScannerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  qrDongleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
    position: 'relative',
  },
  pairedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  offlineSyncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ea580c',
  },
  advancedPhotoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  advancedPhotoCancel: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  advancedPhotoCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})

