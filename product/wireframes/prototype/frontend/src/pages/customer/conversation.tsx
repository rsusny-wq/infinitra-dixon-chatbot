import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VoiceTutorial } from "@/components/voice-tutorial";
import { useDiagnosticStore } from "@/store/diagnostic-store";
import { useSpeech } from "@/hooks/use-speech";
import { useNavigate } from "react-router";
import { 
  Mic, 
  MicOff, 
  Send, 
  Car, 
  Volume2,
  VolumeX,
  ArrowLeft,
  Loader2,
  HelpCircle
} from "lucide-react";

export default function ProgressiveConversation() {
  const navigate = useNavigate();
  const { 
    currentSession,
    startNewSession,
    addChatMessage,
    setAiTyping,
    simulateAiResponse,
    setVehicle,
    setSymptoms,
    updateSessionStatus
  } = useDiagnosticStore();
  
  const { 
    isListening, 
    isSupported, 
    startListening, 
    stopListening,
    speak,
    isSpeaking,
    stopSpeaking
  } = useSpeech({
    onError: (error) => {
      console.error('Voice recognition error:', error);
      addChatMessage({
        type: 'system',
        content: `Voice recognition error: ${error}. You can continue typing your message.`
      });
    },
    continuous: false, // Stop after each phrase for better UX
    interimResults: false // Only final results to avoid confusion
  });

  const [inputText, setInputText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showVoiceTutorial, setShowVoiceTutorial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.chatMessages]);

  useEffect(() => {
    // Initialize session and conversation
    if (!currentSession) {
      startNewSession();
    }
  }, []);

  useEffect(() => {
    // Add welcome message only once when session is created and has no messages
    if (currentSession && currentSession.chatMessages.length === 0) {
      addWelcomeMessage();
    }
  }, [currentSession?.id]); // Only trigger when session ID changes

  const addWelcomeMessage = () => {
    addChatMessage({
      type: 'ai',
      content: "Hi! I'm here to help diagnose your vehicle. To get started, I'll need to identify your car. You can either scan your VIN with your camera or tell me your vehicle's make, model, and year. What would you prefer?"
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Add user message
    addChatMessage({
      type: 'user',
      content: inputText
    });
    
    // Process with AI
    await simulateAiResponse(inputText);
    
    // Speak AI response if voice is enabled
    if (voiceEnabled && currentSession?.chatMessages && currentSession.chatMessages.length > 0) {
      const lastMessage = currentSession.chatMessages[currentSession.chatMessages.length - 1];
      if (lastMessage && lastMessage.type === 'ai') {
        speak(lastMessage.content);
      }
    }
    
    setInputText('');
  };

  const handleVoiceInput = async (transcript: string) => {
    if (transcript.trim()) {
      // Stop any ongoing speech before processing new input
      if (isSpeaking) {
        stopSpeaking();
      }
      
      // Add user message
      addChatMessage({
        type: 'user',
        content: transcript
      });
      
      // Process with AI
      await simulateAiResponse(transcript);
      
      // Speak AI response if voice is enabled and not currently speaking
      if (voiceEnabled && currentSession?.chatMessages && currentSession.chatMessages.length > 0) {
        // Wait a moment for the message to be added to state
        setTimeout(() => {
          if (currentSession && currentSession.chatMessages && currentSession.chatMessages.length > 0) {
            const lastMessage = currentSession.chatMessages[currentSession.chatMessages.length - 1];
            if (lastMessage && lastMessage.type === 'ai') {
              // Clean up the text for better speech synthesis
              const cleanText = lastMessage.content
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
                .replace(/🔧|💰|✅|📷|🚗|📞|🔍|📱|🏪/g, '') // Remove emojis
                .replace(/\n\n/g, '. ') // Replace double newlines with periods
                .replace(/\n/g, ' '); // Replace single newlines with spaces
              
              speak(cleanText);
            }
          }
        }, 100);
      }
    }
  };

  const handleQuickAction = async (action: string) => {
    let message = '';
    
    switch (action) {
      case '🎤 Use Voice Input':
        setVoiceEnabled(true);
        message = "I want to use voice input";
        break;
      case '⌨️ Type My Responses':
        setVoiceEnabled(false);
        message = "I prefer to type my responses";
        break;
      case '📷 Scan VIN Code':
        navigate('/customer/vin-scanner');
        return;
      default:
        message = action;
    }
    
    if (message) {
      // Add user message
      addChatMessage({
        type: 'user',
        content: message
      });
      
      // Process with AI
      await simulateAiResponse(message);
      
      // Speak AI response if voice is enabled
      if (voiceEnabled && currentSession?.chatMessages && currentSession.chatMessages.length > 0) {
        const lastMessage = currentSession.chatMessages[currentSession.chatMessages.length - 1];
        if (lastMessage && lastMessage.type === 'ai') {
          speak(lastMessage.content);
        }
      }
    }
  };

  const getStatusText = () => {
    if (!currentSession) return "Initializing...";
    
    switch (currentSession.status) {
      case 'vehicle-id': return "Vehicle Identification";
      case 'symptoms': return "Symptom Collection";
      case 'clarification': return "Clarifying Details";
      case 'diagnosis': return "AI Diagnosis";
      case 'quote': return "Quote Generation";
      case 'mechanic-review': return "Mechanic Review";
      case 'approved': return "Approved for Service";
      default: return "Diagnostic Session";
    }
  };

  const getProgressPercentage = () => {
    if (!currentSession) return 0;
    
    const statusOrder = ['vehicle-id', 'symptoms', 'clarification', 'diagnosis', 'quote', 'mechanic-review', 'approved'];
    const currentIndex = statusOrder.indexOf(currentSession.status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing diagnostic session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Voice Tutorial */}
      <VoiceTutorial
        isOpen={showVoiceTutorial}
        onClose={() => setShowVoiceTutorial(false)}
        onComplete={() => {
          setShowVoiceTutorial(false);
          setVoiceEnabled(true);
        }}
      />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customer/welcome')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">AI Diagnostic Assistant</h1>
              <p className="text-sm text-gray-500">{getStatusText()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? "Disable Voice" : "Enable Voice"}
              className={voiceEnabled ? "text-blue-600" : "text-gray-400"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            
            {/* Stop Speaking Button */}
            {isSpeaking && (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopSpeaking}
                title="Stop Speaking"
                className="text-red-600"
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
            
            {/* Voice Help Button */}
            {isSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceTutorial(true)}
                title="Voice Help"
                className="text-blue-600"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            )}
            
            {isSupported && (
              <Badge variant={isListening ? "default" : "secondary"} className={isListening ? "animate-pulse" : ""}>
                {isListening ? "🎤 Listening..." : "🎤 Voice Ready"}
              </Badge>
            )}
            
            {!isSupported && (
              <Badge variant="outline" className="text-gray-500">
                Voice Not Supported
              </Badge>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Vehicle Info (if available) */}
      {currentSession.vehicle && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center space-x-2 text-sm">
            <Car className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {currentSession.vehicle.year} {currentSession.vehicle.make} {currentSession.vehicle.model}
            </span>
            {currentSession.vehicle.vin && (
              <span className="text-blue-600">• VIN: {currentSession.vehicle.vin.slice(-6)}</span>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {currentSession.chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Quick Action Buttons */}
              {message.metadata?.suggestions && (
                <div className="mt-3 space-y-2">
                  {message.metadata.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(suggestion)}
                      className="w-full text-left justify-start text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Confidence Score */}
              {message.metadata?.confidence && (
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {message.metadata.confidence}% confidence
                  </Badge>
                </div>
              )}
              
              {/* Timestamp */}
              <div className="mt-2 text-xs opacity-60">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {/* AI Typing Indicator */}
        {currentSession.isAiTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center space-x-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-gray-500">AI is thinking...</span>
            </div>
          </div>
        )}
        
        {/* Voice Status Indicator */}
        {(isListening || isSpeaking) && (
          <div className="flex justify-center">
            <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
              isListening ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isListening ? (
                <>
                  <Mic className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">Listening...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">Speaking...</span>
                </>
              )}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isListening || currentSession.isAiTyping}
              className="pr-12"
            />
          </div>
          
          {isSupported && (
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={isListening ? stopListening : () => startListening(handleVoiceInput)}
              className={`flex-shrink-0 ${isListening ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""}`}
              disabled={currentSession.isAiTyping || isSpeaking}
              title={isListening ? "Stop Listening" : "Start Voice Input"}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span className="ml-1 text-xs">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span className="ml-1 text-xs">Voice</span>
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isListening || currentSession.isAiTyping}
            size="sm"
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {!isSupported && (
          <p className="text-xs text-gray-500 mt-2">
            Voice input not supported in this browser. You can still type your responses.
          </p>
        )}
      </div>
    </div>
  );
}
