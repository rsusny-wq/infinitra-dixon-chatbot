/**
 * Conversation Store
 * Zustand store for managing ChatGPT-style conversation state with automotive context
 * Updated to use real GraphQL service instead of mock responses
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import { chatService } from '../services/ChatService';

// Types
export interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
  attachments?: Attachment[];
  automotiveContext?: AutomotiveContext;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'audio';
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface AutomotiveContext {
  vehicleInfo?: VehicleInfo;
  diagnosticConfidence?: number;
  toolsUsed?: string[];
  repairRecommendations?: RepairOption[];
  vehicleContext?: string;
}

export interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  mileage?: number;
}

export interface RepairOption {
  name: string;
  estimatedCost: number;
  urgency: 'low' | 'medium' | 'high';
  description: string;
}

export interface DiagnosticContext {
  id: string;
  symptoms: string[];
  diagnosis: string;
  confidence: number;
  estimatedCost: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface ConversationState {
  // State
  messages: Message[];
  isTyping: boolean;
  attachments: Attachment[];
  currentVehicle?: VehicleInfo;
  diagnosticContext?: DiagnosticContext;
  conversationId?: string;
  
  // Actions
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (attachmentId: string) => void;
  setCurrentVehicle: (vehicle: VehicleInfo | undefined) => void;
  setDiagnosticContext: (context: DiagnosticContext | undefined) => void;
  setTyping: (isTyping: boolean) => void;
  clearConversation: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  saveConversation: () => Promise<void>;
}

export const useConversationStore = create<ConversationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        messages: [],
        isTyping: false,
        attachments: [],
        currentVehicle: undefined,
        diagnosticContext: undefined,
        conversationId: undefined,

        // Actions
        sendMessage: async (content: string, attachments?: Attachment[]) => {
          const state = get();
          
          // Add user message
          const userMessage: Message = {
            id: `user-${Date.now()}`,
            content,
            type: 'user',
            timestamp: new Date(),
            attachments: attachments || state.attachments,
          };

          set((state) => ({
            messages: [...state.messages, userMessage],
            attachments: [], // Clear attachments after sending
            isTyping: true,
          }));

          try {
            // Send message to real Strands Lambda function via GraphQL
            const response = await chatService.sendMessage({
              message: content,
              conversationId: state.conversationId || `conv-${Date.now()}`,
              userId: 'user-web-app', // Could be from auth context
            });

            // Extract and format the AI response content
            const aiContent = chatService.formatMessageForUI(response);
            
            // Create AI message
            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              content: aiContent,
              type: 'ai',
              timestamp: new Date(response.timestamp),
              automotiveContext: {
                vehicleContext: response.vehicleContext,
                vehicleInfo: state.currentVehicle,
              },
            };
            
            set((state) => ({
              messages: [...state.messages, aiMessage],
              isTyping: false,
              conversationId: response.conversationId,
            }));

            // Update diagnostic context based on vehicle context
            if (response.vehicleContext && response.vehicleContext !== 'generic') {
              const diagnosticContext: DiagnosticContext = {
                id: `diag-${Date.now()}`,
                symptoms: [content],
                diagnosis: aiContent,
                confidence: response.vehicleContext === 'vin:' ? 0.95 : 
                          response.vehicleContext.startsWith('basic:') ? 0.80 : 0.60,
                estimatedCost: 0, // Would be extracted from response if available
                urgency: 'medium', // Would be determined from response content
              };

              set({ diagnosticContext });
            }
          } catch (error) {
            console.error('Error sending message:', error);
            
            // Add error message
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              content: 'Sorry, I encountered an error processing your message. Please try again.',
              type: 'system',
              timestamp: new Date(),
            };

            set((state) => ({
              messages: [...state.messages, errorMessage],
              isTyping: false,
            }));

            throw error;
          }
        },

        addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
          const newMessage: Message = {
            ...message,
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
          };

          set((state) => ({
            messages: [...state.messages, newMessage],
          }));
        },

        addAttachment: (attachment: Attachment) => {
          set((state) => ({
            attachments: [...state.attachments, attachment],
          }));
        },

        removeAttachment: (attachmentId: string) => {
          set((state) => ({
            attachments: state.attachments.filter(att => att.id !== attachmentId),
          }));
        },

        setCurrentVehicle: (vehicle: VehicleInfo | undefined) => {
          set({ currentVehicle: vehicle });
          
          // Add system message about vehicle change
          if (vehicle) {
            const systemMessage: Message = {
              id: `system-${Date.now()}`,
              content: `Vehicle context updated: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              type: 'system',
              timestamp: new Date(),
            };

            set((state) => ({
              messages: [...state.messages, systemMessage],
            }));
          }
        },

        setDiagnosticContext: (context: DiagnosticContext | undefined) => {
          set({ diagnosticContext: context });
        },

        setTyping: (isTyping: boolean) => {
          set({ isTyping });
        },

        clearConversation: () => {
          set({
            messages: [],
            isTyping: false,
            attachments: [],
            diagnosticContext: undefined,
            conversationId: undefined,
          });
        },

        loadConversation: async (conversationId: string) => {
          // Mock implementation - would load from backend
          console.log(`Loading conversation: ${conversationId}`);
          
          // For now, just set the conversation ID
          set({ conversationId });
        },

        saveConversation: async () => {
          const state = get();
          
          // Mock implementation - would save to backend
          console.log('Saving conversation:', {
            conversationId: state.conversationId,
            messageCount: state.messages.length,
            vehicle: state.currentVehicle,
            diagnostic: state.diagnosticContext,
          });
        },
      }),
      {
        name: 'dixon-conversation-store',
        partialize: (state) => ({
          messages: state.messages,
          currentVehicle: state.currentVehicle,
          diagnosticContext: state.diagnosticContext,
          conversationId: state.conversationId,
        }),
        // Web-safe storage configuration
        ...(Platform.OS === 'web' ? {
          storage: {
            getItem: (name: string) => {
              try {
                return localStorage.getItem(name);
              } catch {
                return null;
              }
            },
            setItem: (name: string, value: string) => {
              try {
                localStorage.setItem(name, value);
              } catch {
                // Silently fail on web if localStorage is not available
              }
            },
            removeItem: (name: string) => {
              try {
                localStorage.removeItem(name);
              } catch {
                // Silently fail on web if localStorage is not available
              }
            },
          }
        } : {}),
      }
    ),
    {
      name: 'conversation-store',
    }
  )
);
