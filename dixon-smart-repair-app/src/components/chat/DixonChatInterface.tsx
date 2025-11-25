import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Dixon components
import DixonChatArea from './components/DixonChatArea/DixonChatArea';
import DixonChatInput from './components/DixonChatInput/DixonChatInput';
import DixonSidebar from './components/DixonSidebar/DixonSidebar';
import DixonMobileMenu from './components/DixonMobileMenu/DixonMobileMenu';
import DixonAuthModal from './components/DixonAuthModal/DixonAuthModal';
import { DixonCostEstimatesList } from './DixonCostEstimatesList';
import { DixonCostEstimateDetails } from './DixonCostEstimateDetails';
import { DixonLabourEstimatesList } from './DixonLabourEstimatesList';
import { DixonLabourEstimateDetails } from './DixonLabourEstimateDetails';
import { DixonShopVisitsList } from './DixonShopVisitsList';
import { DixonShopVisitDetails } from './DixonShopVisitDetails';
import { DixonVehiclesList } from './DixonVehiclesList';
import { DixonChatHistory } from './DixonChatHistory';

// Import hooks
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useDixonAuth } from './hooks/useDixonAuth';

// Import services
import { ChatService } from '../../services/ChatService';

// Import design system
import { DesignSystem } from '../../styles/designSystem';

// Types
interface DixonChatInterfaceProps {
  // Add any props if needed
}

interface DixonMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

// View types for different interface modes
type ViewMode = 'chat' | 'cost-estimates-list' | 'cost-estimate-details' | 'labour-estimates-list' | 'labour-estimate-details' | 'shop-visits-list' | 'shop-visit-details' | 'vehicles-list' | 'chat-history';

// Cost estimate interface (matching existing CostEstimateTab)
interface CostEstimate {
  id: string;
  estimateId: string;
  userId: string;
  conversationId: string;
  vehicleInfo: {
    year: string;
    make: string;
    model: string;
    trim?: string;
  };
  selectedOption: string;
  breakdown: {
    total: number;
    labor: {
      total: number;
      totalHours?: number;
      hourlyRate?: number;
    };
    parts: {
      total: number;
      items?: Array<{
        description: string;
        cost: number;
        warranty: string;
        url?: string;
      }>;
    };
    shopFees?: {
      total: number;
    };
    tax: number;
  };
  status: string;
  createdAt: string;
  validUntil: string;
  confidence: number;
  // NEW: Modified estimate fields
  isModified?: boolean;
  originalEstimate?: any;
  modifiedEstimate?: any;
  mechanicNotes?: string;
  modifiedAt?: string;
  modifiedByMechanicId?: string;
  mechanicRequestId?: string;
}

// Shop visit interface
interface ShopVisit {
  visitId: string;
  userId: string;
  shopId: string;
  customerName: string;
  serviceType: 'diagnostic' | 'repair' | 'pickup' | 'consultation';
  status: 'checked_in' | 'in_service' | 'completed' | 'cancelled';
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  estimatedServiceTime: string;
  actualServiceTime?: string;
  mechanicNotes: string;
  vehicleInfo?: {
    year: number;
    make: string;
    model: string;
    trim?: string;
  };
}

// Labour estimate interface
interface LabourEstimate {
  reportId: string;
  userId: string;
  conversationId: string;
  repairType: string;
  vehicleInfo: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string;
  };
  initialEstimate: {
    labor_hours_low?: number;
    labor_hours_high?: number;
    labor_hours_average?: number;
    reasoning?: string;
  };
  modelResults: {
    claude_estimate?: {
      labor_hours_low?: number;
      labor_hours_high?: number;
      labor_hours_average?: number;
      reason_for_low?: string;
      reason_for_high?: string;
      reason_for_average?: string;
    };
    web_validation?: {
      labor_hours_low?: number;
      labor_hours_high?: number;
      labor_hours_average?: number;
      confidence?: string;
      search_answer?: string;
      source?: string;
    };
  };
  finalEstimate: {
    labor_hours_low?: number;
    labor_hours_high?: number;
    labor_hours_average?: number;
    reasoning?: string;
  };
  consensusReasoning: string;
  dataQuality?: {
    score?: number;
    level?: string;
    factors?: string[];
    model_count?: number;
  };
  createdAt: string;
  version: string;
}

const DixonChatInterface: React.FC<DixonChatInterfaceProps> = () => {
  // Responsive layout
  const { isDesktop, isMobile } = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  // Authentication
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    signIn,
    signUp,
    signOut,
    clearError,
    forgotPassword,
    resetPassword,
  } = useDixonAuth();

  // Initialize ChatService
  const chatService = React.useMemo(() => new ChatService(), []);

  // Generate intelligent diagnostic context based on authentication
  const getDiagnosticContext = React.useCallback(() => {
    return {
      mode: 'intelligent', // Let agent decide the flow
      accuracy: 'adaptive', // Agent adapts based on available information
      user_selection: 'Smart Help', // Intelligent assistance
      vehicle_details_required: false, // Agent decides when to ask
      is_authenticated: isAuthenticated,
      user_id: user?.userId || null
    };
  }, [isAuthenticated, user?.userId]);

  // State management
  const [messages, setMessages] = useState<DixonMessage[]>([
    {
      id: '1',
      content: isAuthenticated
        ? `Hello ${user?.givenName || 'there'}! I'm your Dixon Smart Repair assistant. How can I help you with your vehicle today?`
        : 'Hi! I\'m Dixon. Since you\'re not logged in, I can\'t see your saved vehicles. Please log in if you have an account, or share your VIN so I can help with your vehicle.',
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Communication mode state
  const [communicationMode, setCommunicationMode] = useState<'ai' | 'mechanic'>('ai');
  const [mechanicRequestStatus, setMechanicRequestStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [activeMechanicRequest, setActiveMechanicRequest] = useState<any>(null);

  // View mode state for different interface modes
  const [currentView, setCurrentView] = useState<ViewMode>('chat');
  const [selectedEstimate, setSelectedEstimate] = useState<CostEstimate | null>(null);
  const [selectedLabourEstimate, setSelectedLabourEstimate] = useState<LabourEstimate | null>(null);
  const [selectedShopVisit, setSelectedShopVisit] = useState<ShopVisit | null>(null);

  // Conversation management with AI title generation
  const [conversationId, setConversationId] = useState<string>(() => {
    // Generate a unique conversation ID for this session
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });
  const [conversationTitle, setConversationTitle] = useState<string>('New Chat');
  const [titleGenerated, setTitleGenerated] = useState<boolean>(false);

  // Update welcome message when auth status changes
  React.useEffect(() => {
    setMessages([{
      id: '1',
      content: isAuthenticated
        ? `Hello ${user?.givenName || 'there'}! I'm your Dixon Smart Repair assistant. How can I help you with your vehicle today?`
        : 'Hello! I\'m your Dixon Smart Repair assistant. How can I help you with your vehicle today?',
      role: 'assistant',
      timestamp: new Date(),
    }]);
  }, [isAuthenticated, user?.givenName]);

  // Memoized styles
  const containerStyle = useMemo(() => ({
    flex: 1,
    backgroundColor: DesignSystem.colors.white,
    paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0,
  }), [insets.top]);

  const mainContentStyle = useMemo(() => ({
    flex: 1,
    flexDirection: 'row' as const,
    marginLeft: isDesktop ? 280 : 0, // Desktop sidebar width
  }), [isDesktop]);

  // Chat layout styles for proper scrolling and input visibility
  const styles = useMemo(() => ({
    chatContainer: {
      flex: 1,
      flexDirection: 'column' as const,
      height: '100%' as any,
      // Critical: Prevent any overflow that could push input down
      overflow: 'hidden' as any,
      // For web: ensure proper viewport constraints
      ...(Platform.OS === 'web' && {
        maxHeight: '100vh' as any,
        position: 'relative' as any,
      }),
    },
    chatAreaContainer: {
      flex: 1,
      minHeight: 0, // Critical for scrolling - allows flex child to shrink
      // Ensure chat area doesn't push input off screen
      overflow: 'hidden' as any,
      // For web: additional constraints to prevent expansion
      ...(Platform.OS === 'web' && {
        maxHeight: '100%' as any,
        position: 'relative' as any,
      }),
    },
    chatInputContainer: {
      flexShrink: 0, // Prevent input from shrinking
      // Ensure input stays at bottom and visible
      position: 'relative' as const,
      zIndex: 10,
      backgroundColor: DesignSystem.colors.white,
      // For web: ensure it stays at the bottom
      ...(Platform.OS === 'web' && {
        position: 'sticky' as any,
        bottom: 0,
      }),
    },
  }), []);

  // Handle ensuring input visibility - Enhanced for web platform
  const handleEnsureInputVisible = useCallback(() => {
    if (Platform.OS === 'web') {
      // Method 1: Try to scroll the input container into view
      const inputContainer = document.querySelector('[data-testid="chat-input-container"]');
      if (inputContainer) {
        inputContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });

        // Method 2: Also try to focus the input after scrolling
        const inputElement = inputContainer.querySelector('input, textarea');
        if (inputElement) {
          setTimeout(() => {
            (inputElement as HTMLElement).focus();
          }, 300);
        }
      } else {
        // Fallback: Scroll to bottom of the page
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }

      // Method 3: Additional fallback - ensure the main container is properly sized
      setTimeout(() => {
        const mainContainer = document.querySelector('[data-testid="chat-container"]');
        if (mainContainer) {
          const rect = mainContainer.getBoundingClientRect();
          if (rect.height > window.innerHeight) {
            // Container is taller than viewport, scroll to show input
            const inputContainer = document.querySelector('[data-testid="chat-input-container"]');
            if (inputContainer) {
              const inputRect = inputContainer.getBoundingClientRect();
              if (inputRect.bottom > window.innerHeight) {
                window.scrollBy({
                  top: inputRect.bottom - window.innerHeight + 20,
                  behavior: 'smooth'
                });
              }
            }
          }
        }
      }, 100);
    }
    // For native platforms, the layout should handle this automatically
  }, []);

  // Handlers
  const handleSendMechanicMessage = useCallback(async (content: string, messageId: string) => {
    try {
      console.log('🔧 Sending message to mechanic:', content);

      // If no active mechanic request, create one automatically
      if (mechanicRequestStatus === 'none') {
        console.log('🔧 Auto-creating mechanic request...');

        // Create mechanic request automatically
        const requestData = {
          conversationId: conversationId,
          requestMessage: content,
          urgency: 'medium' as 'medium' | 'low' | 'high',
          shopId: 'dixon-repair-main',
          conversationHistory: messages,
          userType: (isAuthenticated ? 'authenticated' : 'anonymous') as 'authenticated' | 'anonymous',
          userId: user?.userId || 'anonymous'
        };

        const response = await chatService.requestMechanic(requestData);

        if (!response.success) {
          throw new Error(response.error || 'Failed to create mechanic request');
        }

        const mechanicRequest = response.mechanicRequest;

        // Update state to reflect new request
        setMechanicRequestStatus('pending');
        setActiveMechanicRequest(mechanicRequest);

        // Add system message about request creation
        const systemMessage: DixonMessage = {
          id: `mechanic-created-${Date.now()}`,
          content: `✅ **Mechanic Request Created**\n\nYour message has been sent to Dixon Smart Repair. A mechanic will respond when available.\n\n**Request ID**: ${mechanicRequest.id}\n\n💡 You can switch back to AI mode anytime while waiting.`,
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, systemMessage]);

        console.log('✅ Mechanic request created:', mechanicRequest.id);
        return; // Exit after creating request
      }

      // Send message to existing mechanic request
      const response = await chatService.sendMechanicMessage({
        mechanicRequestId: activeMechanicRequest?.id,
        message: content,
        senderId: user?.userId || 'anonymous',
        senderName: user?.givenName || 'Customer',
        senderType: 'customer'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send message to mechanic');
      }

      // Add system message indicating message was sent to mechanic
      const systemMessage: DixonMessage = {
        id: `mechanic-sent-${Date.now()}`,
        content: `📤 **Message sent to Dixon mechanic**\n\nYour message has been delivered. The mechanic will respond when available.\n\n💡 You can continue chatting with the AI while waiting, or stay in mechanic mode to see responses.`,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, systemMessage]);

      console.log('✅ Message sent to mechanic');

    } catch (error) {
      console.error('❌ Error in handleSendMechanicMessage:', error);

      // Add error message to chat
      const errorMessage: DixonMessage = {
        id: `mechanic-error-${Date.now()}`,
        content: `❌ **Unable to reach mechanic**\n\nSorry, we couldn't connect to our mechanic service right now. Please try again later or switch to AI mode for immediate assistance.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [conversationId, messages, isAuthenticated, user?.userId, user?.givenName, mechanicRequestStatus, activeMechanicRequest, chatService]);

  const handleSendMessage = useCallback(async (content: string, imageFile?: File) => {
    if (!content.trim()) return;

    console.log('🚀 DixonChatInterface: Sending message:', content);
    console.log('🔧 Communication mode:', communicationMode);

    // 🔍 DEBUG: Log image file details
    // if (imageFile) {
    //   console.log('🔍 DEBUG: DixonChatInterface image file details:', {
    //     name: imageFile.name,
    //     size: imageFile.size,
    //     type: imageFile.type,
    //     lastModified: imageFile.lastModified
    //   });
    // } else {
    //   console.log('🔍 DEBUG: DixonChatInterface - No image file provided');
    // }

    // 1. Add user message immediately for fast UX
    const userMessage: DixonMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // 2. Generate AI title after 3 user messages (non-blocking)
    const userMessageCount = messages.filter(msg => msg.role === 'user').length + 1; // +1 for current message
    if (!titleGenerated && userMessageCount >= 3) {
      setTitleGenerated(true); // Prevent duplicate generation

      console.log('🎯 Generating AI title after 3 user messages. Current message:', content.slice(0, 50));

      // Generate title in background (non-blocking)
      chatService.generateConversationTitle(content)
        .then(titleResult => {
          if (titleResult.success && titleResult.title) {
            console.log('✅ AI title generated:', titleResult.title, `(${titleResult.generatedBy})`);
            setConversationTitle(titleResult.title);

            // Background sync to backend if authenticated
            if (isAuthenticated && user?.userId) {
              chatService.updateConversationTitle(conversationId, titleResult.title)
                .catch(error => console.warn('Failed to sync title to backend:', error));
            }
          } else {
            console.warn('❌ Title generation failed, keeping default title');
          }
        })
        .catch(error => {
          console.warn('💥 Title generation failed:', error);
          // Keep default title on error
        });
    }

    try {
      // 3. Route message based on communication mode
      if (communicationMode === 'mechanic') {
        // Route to mechanic service
        console.log('🔧 Routing to mechanic service');
        setIsLoading(false); // Don't show typing for mechanic messages
        await handleSendMechanicMessage(content.trim(), userMessage.id);
        return; // Exit early for mechanic messages
      }

      // 4. Continue with AI routing for 'ai' mode
      console.log('🤖 Routing to AI service');
      // console.log('🔗 Using conversation ID:', conversationId);
      // console.log('👤 User ID:', user?.userId || 'anonymous');

      const response = await chatService.sendMessage({
        message: content.trim(),
        conversationId: conversationId,
        userId: user?.userId || `anonymous-${Date.now()}`,
        diagnostic_context: getDiagnosticContext(),
        imageFile: imageFile  // Changed from image_base64 to imageFile
      });

      console.log('✅ ChatService response:', response);

      // 5. Process and format the AI response
      let formattedContent: string;

      if (response.success) {
        // Extract the actual message content from the response
        formattedContent = chatService.extractMessageContent(response.message);
        console.log('📝 Formatted message content:', formattedContent);
      } else {
        // Handle error response
        formattedContent = response.error || 'Sorry, I encountered an error processing your message. Please try again.';
        console.error('❌ ChatService error:', response.error);
      }

      // 6. Add assistant response to chat
      const assistantMessage: DixonMessage = {
        id: (Date.now() + 1).toString(),
        content: formattedContent,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 7. TODO: Optional session management for authenticated users
      // This will be implemented in Phase 2
      if (isAuthenticated && user?.userId) {
        console.log('💾 TODO: Save conversation to session store for user:', user.userId);
        // await syncConversationToStore(conversationId, userMessage, assistantMessage);
      }

    } catch (error) {
      console.error('💥 Error in handleSendMessage:', error);

      // Add error message to chat
      const errorMessage: DixonMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error connecting to the service. Please check your connection and try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);

      // Ensure input remains visible after response
      setTimeout(() => {
        handleEnsureInputVisible();
      }, 500);
    }
  }, [conversationId, user?.userId, isAuthenticated, chatService, handleEnsureInputVisible, getDiagnosticContext, communicationMode, handleSendMechanicMessage, messages.length, titleGenerated]);

  // Communication mode change handler
  const handleCommunicationModeChange = useCallback((mode: 'ai' | 'mechanic') => {
    console.log('🔄 DixonChatInterface: Communication mode changed to:', mode);
    setCommunicationMode(mode);

    // Add a system message to indicate mode change
    const modeMessage: DixonMessage = {
      id: `mode-change-${Date.now()}`,
      content: mode === 'ai'
        ? '🤖 **Switched to AI Assistant**\n\nI\'m ready to help with automotive diagnostics and guidance.'
        : '👨‍🔧 **Switched to Mechanic Mode**\n\nYour messages will be sent to a Dixon Smart Repair mechanic. They\'ll respond when available.',
      role: 'assistant',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, modeMessage]);
  }, []);

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleMenuItemSelect = useCallback((item: string) => {
    console.log('Menu item selected:', item);

    // Handle authentication-related menu items
    if (item === 'signin' && !isAuthenticated) {
      setIsAuthModalOpen(true);
    } else if (item === 'signout' && isAuthenticated) {
      signOut();
    } else if (item === 'cost-estimates') {
      // Switch to cost estimates list view
      if (isAuthenticated) {
        setCurrentView('cost-estimates-list');
        setSelectedEstimate(null);
        setSelectedLabourEstimate(null);
        setSelectedShopVisit(null);
      } else {
        setIsAuthModalOpen(true);
      }
    } else if (item === 'labour-estimates') {
      // Switch to labour estimates list view
      if (isAuthenticated) {
        setCurrentView('labour-estimates-list');
        setSelectedEstimate(null);
        setSelectedLabourEstimate(null);
        setSelectedShopVisit(null);
      } else {
        setIsAuthModalOpen(true);
      }
    } else if (item === 'shop-visits') {
      // Switch to shop visits list view
      if (isAuthenticated) {
        setCurrentView('shop-visits-list');
        setSelectedEstimate(null);
        setSelectedLabourEstimate(null);
        setSelectedShopVisit(null);
      } else {
        setIsAuthModalOpen(true);
      }
    } else if (item === 'vehicles') {
      // Switch to vehicles list view
      if (isAuthenticated) {
        setCurrentView('vehicles-list');
        setSelectedEstimate(null);
        setSelectedLabourEstimate(null);
        setSelectedShopVisit(null);
      } else {
        setIsAuthModalOpen(true);
      }
    } else if (item === 'chat-history') {
      // Switch to chat history view
      if (isAuthenticated) {
        setCurrentView('chat-history');
        setSelectedEstimate(null);
        setSelectedLabourEstimate(null);
        setSelectedShopVisit(null);
      } else {
        setIsAuthModalOpen(true);
      }
    }

    if (isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile, isAuthenticated, signOut]);

  const handleNewChat = useCallback(() => {
    // Generate new conversation ID for new chat
    const newConversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(newConversationId);

    console.log('🆕 Starting new chat with conversation ID:', newConversationId);

    // Reset messages with welcome message
    setMessages([{
      id: '1',
      content: isAuthenticated
        ? `Hello ${user?.givenName || 'there'}! I'm your Dixon Smart Repair assistant. How can I help you with your vehicle today?`
        : 'Hello! I\'m your Dixon Smart Repair assistant. How can I help you with your vehicle today?',
      role: 'assistant',
      timestamp: new Date(),
    }]);

    // Reset title generation state
    setConversationTitle('New Chat');
    setTitleGenerated(false);

    // Reset to chat view when starting new chat
    setCurrentView('chat');
    setSelectedEstimate(null);
    setSelectedLabourEstimate(null);
    setSelectedShopVisit(null);
  }, [isAuthenticated, user?.givenName]);

  // View navigation handlers
  const handleBackToChat = useCallback(() => {
    setCurrentView('chat');
    setSelectedEstimate(null);
    setSelectedLabourEstimate(null);
    setSelectedShopVisit(null);
  }, []);

  const handleBackToEstimatesList = useCallback(() => {
    setCurrentView('cost-estimates-list');
    setSelectedEstimate(null);
  }, []);

  const handleEstimateSelect = useCallback((estimate: CostEstimate) => {
    setSelectedEstimate(estimate);
    setCurrentView('cost-estimate-details');
  }, []);

  const handleEstimateClose = useCallback(() => {
    setCurrentView('cost-estimates-list');
    setSelectedEstimate(null);
  }, []);

  const handleBackToLabourEstimatesList = useCallback(() => {
    setCurrentView('labour-estimates-list');
    setSelectedLabourEstimate(null);
  }, []);

  const handleLabourEstimateSelect = useCallback((estimate: LabourEstimate) => {
    setSelectedLabourEstimate(estimate);
    setCurrentView('labour-estimate-details');
  }, []);

  const handleBackToShopVisitsList = useCallback(() => {
    setCurrentView('shop-visits-list');
    setSelectedShopVisit(null);
  }, []);

  const handleShopVisitSelect = useCallback((visit: any) => {
    setSelectedShopVisit(visit);
    setCurrentView('shop-visit-details');
  }, []);

  const handleVehicleSelect = useCallback((vehicle: any) => {
    console.log('Vehicle selected:', vehicle);
    // For now, just log the selection
    // Could navigate to vehicle details or use for chat context
  }, []);

  const handleSessionSelect = useCallback(async (sessionId: string) => {
    console.log('Session selected:', sessionId);

    try {
      // Set the conversation ID to the selected session
      setConversationId(sessionId);
      console.log('🔄 Loading messages for conversation:', sessionId);

      // Load messages for this conversation from DynamoDB
      const messagesResponse = await chatService.getConversationMessages(sessionId);

      if (messagesResponse.success && messagesResponse.messages) {
        // Convert DynamoDB messages to UI format
        const loadedMessages = messagesResponse.messages.map((msg: any): DixonMessage => ({
          id: msg.id || `${msg.role}-${Date.now()}`,
          content: msg.content || msg.message,
          role: msg.role === 'USER' ? 'user' : 'assistant',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }));

        console.log('✅ Loaded', loadedMessages.length, 'messages for conversation:', sessionId);
        setMessages(loadedMessages);
      } else {
        console.warn('⚠️ No messages found for conversation:', sessionId);
        setMessages([]); // Start with empty conversation if no messages
      }

      // Switch to chat view
      setCurrentView('chat');
      console.log('✅ Switched to chat view for conversation:', sessionId);

    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      // Still switch to chat view but with empty messages
      setConversationId(sessionId);
      setMessages([]);
      setCurrentView('chat');
    }
  }, [chatService]);

  // Auth modal handlers
  const handleAuthModalClose = useCallback(() => {
    setIsAuthModalOpen(false);
    clearError();
  }, [clearError]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const success = await signIn(email, password);
    return success;
  }, [signIn]);

  const handleSignUp = useCallback(async (userData: any) => {
    const success = await signUp(userData);
    return success;
  }, [signUp]);

  const handleForgotPassword = useCallback(async (email: string) => {
    const success = await forgotPassword(email);
    return success;
  }, [forgotPassword]);

  const handleResetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    const success = await resetPassword(email, code, newPassword);
    return success;
  }, [resetPassword]);

  return (
    <SafeAreaView style={containerStyle}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={DesignSystem.colors.white}
        translucent={false}
      />

      {/* Desktop Sidebar - Always visible on desktop */}
      {isDesktop && (
        <DixonSidebar
          onItemSelect={handleMenuItemSelect}
          onNewChat={handleNewChat}
          user={user}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && (
        <DixonMobileMenu
          isOpen={isMenuOpen}
          onClose={handleMenuClose}
          onItemSelect={handleMenuItemSelect}
          onNewChat={handleNewChat}
          user={user}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Main Content Area - Conditional based on current view */}
      <View style={mainContentStyle}>
        <View
          style={styles.chatContainer}
          {...(Platform.OS === 'web' && { 'data-testid': 'chat-container' })}
        >
          {currentView === 'chat' && (
            <>
              {/* Chat Messages Area - Takes remaining space */}
              <View style={styles.chatAreaContainer}>
                <DixonChatArea
                  messages={messages}
                  isLoading={isLoading}
                  onMenuToggle={isMobile ? handleMenuToggle : undefined}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  onEnsureInputVisible={handleEnsureInputVisible}
                  communicationMode={communicationMode}
                />
              </View>

              {/* Chat Input - Fixed height at bottom */}
              <View
                style={styles.chatInputContainer}
                data-testid="chat-input-container"
              >
                <DixonChatInput
                  onSendMessage={handleSendMessage}
                  disabled={isLoading}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  autoFocus={true}
                  onCommunicationModeChange={handleCommunicationModeChange}
                  initialCommunicationMode={communicationMode}
                  placeholder={
                    communicationMode === 'ai'
                      ? "Ask Dixon about your vehicle..."
                      : "Message Dixon mechanic..."
                  }
                />
              </View>
            </>
          )}

          {currentView === 'cost-estimates-list' && (
            <DixonCostEstimatesList
              currentUser={user}
              onBackToChat={handleBackToChat}
              onEstimateSelect={handleEstimateSelect}
            />
          )}

          {currentView === 'cost-estimate-details' && selectedEstimate && (
            <DixonCostEstimateDetails
              estimate={selectedEstimate}
              onBackToList={handleBackToEstimatesList}
              onEstimateShared={(estimateId, comment) => {
                console.log('Estimate shared:', estimateId, comment);
                // Optionally refresh the estimates list or show success message
              }}
            />
          )}

          {currentView === 'labour-estimates-list' && (
            <DixonLabourEstimatesList
              currentUser={user}
              onBackToChat={handleBackToChat}
              onEstimateSelect={handleLabourEstimateSelect}
            />
          )}

          {currentView === 'labour-estimate-details' && selectedLabourEstimate && (
            <DixonLabourEstimateDetails
              estimate={selectedLabourEstimate}
              onBackToList={handleBackToLabourEstimatesList}
            />
          )}

          {currentView === 'shop-visits-list' && (
            <DixonShopVisitsList
              currentUser={user}
              onBackToChat={handleBackToChat}
              onVisitSelect={handleShopVisitSelect}
            />
          )}

          {currentView === 'shop-visit-details' && selectedShopVisit && (
            <DixonShopVisitDetails
              visit={selectedShopVisit}
              onBackToList={handleBackToShopVisitsList}
            />
          )}

          {currentView === 'vehicles-list' && (
            <DixonVehiclesList
              currentUser={user}
              onBackToChat={handleBackToChat}
              onVehicleSelect={handleVehicleSelect}
            />
          )}

          {currentView === 'chat-history' && (
            <DixonChatHistory
              currentUser={user}
              onBackToChat={handleBackToChat}
              onSessionSelect={handleSessionSelect}
              currentSessionId={null} // TODO: Get from session store
            />
          )}
        </View>
      </View>

      {/* Authentication Modal */}
      <DixonAuthModal
        isVisible={isAuthModalOpen}
        onClose={handleAuthModalClose}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onForgotPassword={handleForgotPassword}
        onResetPassword={handleResetPassword}
        isLoading={authLoading}
        error={authError}
        onClearError={clearError}
      />
    </SafeAreaView>
  );
};

export default React.memo(DixonChatInterface);
