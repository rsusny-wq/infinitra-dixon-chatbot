import { Bot, Send, Minimize2, Maximize2, User, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useDiagnosticStore } from "@/store/diagnostic-store"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export function ChatSidebar() {
  const { 
    currentSession, 
    addChatMessage, 
    toggleChat, 
    minimizeChat, 
    maximizeChat, 
    simulateAiResponse,
    startNewSession 
  } = useDiagnosticStore()
  
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Initialize session if none exists
  useEffect(() => {
    if (!currentSession) {
      startNewSession()
    }
  }, [currentSession, startNewSession])
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.chatMessages])
  
  // Send initial AI greeting when chat opens
  useEffect(() => {
    if (currentSession?.isChatOpen && currentSession.chatMessages.length === 0) {
      addChatMessage({
        type: 'ai',
        content: "Hi! I'm your AI diagnostic assistant. I'll help you identify what's wrong with your vehicle and get you a repair quote. Let's start by identifying your car - do you have your VIN ready, or would you prefer to tell me your vehicle details?"
      })
    }
  }, [currentSession?.isChatOpen, currentSession?.chatMessages.length, addChatMessage])
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return
    
    // Add user message
    addChatMessage({
      type: 'user',
      content: inputMessage.trim()
    })
    
    // Simulate AI response
    await simulateAiResponse(inputMessage.trim())
    
    setInputMessage('')
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  // Chat bubble when minimized
  if (currentSession?.isChatMinimized) {
    return (
      <Button
        onClick={maximizeChat}
        variant="default"
        size="default"
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
      >
        <MessageCircle className="h-6 w-6" />
        {currentSession.chatMessages.length > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500">
            {currentSession.chatMessages.filter(m => m.type === 'ai').length}
          </Badge>
        )}
      </Button>
    )
  }
  
  return (
    <Sheet open={currentSession?.isChatOpen} onOpenChange={toggleChat}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="default"
          className="fixed bottom-4 right-4 h-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white px-4 gap-2"
        >
          <Bot className="h-5 w-5" />
          <span className="hidden sm:inline">AI Diagnostic Assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col h-screen">
        <SheetHeader className="px-6 py-4 border-b bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-blue-600">
                <AvatarFallback className="bg-blue-600 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-left">Dixon AI Assistant</SheetTitle>
                <SheetDescription className="text-left">
                  Vehicle diagnostic and repair quotes
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={minimizeChat}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
          {currentSession?.status && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {currentSession.status.replace('-', ' ').toUpperCase()}
              </Badge>
              {currentSession.vehicle && (
                <Badge variant="outline" className="text-xs">
                  {currentSession.vehicle.year} {currentSession.vehicle.make} {currentSession.vehicle.model}
                </Badge>
              )}
            </div>
          )}
        </SheetHeader>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {currentSession?.chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.type === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <Avatar className={cn(
                  "h-8 w-8",
                  message.type === 'user' ? "bg-gray-600" : "bg-blue-600"
                )}>
                  <AvatarFallback className={cn(
                    "text-white text-sm",
                    message.type === 'user' ? "bg-gray-600" : "bg-blue-600"
                  )}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.type === 'user' 
                    ? "bg-blue-600 text-white ml-auto" 
                    : "bg-gray-100 text-gray-900"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.metadata?.confidence && (
                    <div className="mt-2 text-xs opacity-70">
                      Confidence: {message.metadata.confidence}%
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {currentSession?.isAiTyping && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 bg-blue-600">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your car problem or ask a question..."
                className="min-h-[60px] resize-none"
                disabled={currentSession?.isAiTyping}
              />
              <Button 
                size="icon" 
                className="h-[60px] w-[60px] bg-blue-600 hover:bg-blue-700"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || currentSession?.isAiTyping}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 