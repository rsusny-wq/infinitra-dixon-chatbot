import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from './storage'

// Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  photos?: string[];
  vinData?: {
    vin: string;
    year: number;
    make: string;
    model: string;
  };
}

export interface ChatSession {
  id: string;
  title: string; // Auto-generated from first message
  messages: ChatMessage[];
  vehicleContext?: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
  };
  diagnosticContext?: {
    symptoms: string[];
    diagnoses: string[];
    quotes: any[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ChatStore {
  // Current session state
  currentSession: ChatSession | null;
  sessionHistory: ChatSession[];
  
  // Actions
  createNewSession: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  clearAllSessions: () => void;
  
  // Utilities
  generateSessionTitle: (firstMessage: string) => string;
  getCurrentMessages: () => ChatMessage[];
}

// Auto-generate session titles from first user message
const generateSessionTitle = (firstMessage: string): string => {
  const message = firstMessage.toLowerCase().trim()
  
  // Extract vehicle info if mentioned
  const vehicleMatch = message.match(/(\d{4})\s+(\w+)\s+(\w+)/)
  if (vehicleMatch) {
    const [, year, make, model] = vehicleMatch
    return `${year} ${make.charAt(0).toUpperCase() + make.slice(1)} ${model.charAt(0).toUpperCase() + model.slice(1)}`
  }
  
  // Extract common automotive issues
  if (message.includes('brake')) return 'Brake Issues'
  if (message.includes('engine')) return 'Engine Problems'
  if (message.includes('transmission')) return 'Transmission Issues'
  if (message.includes('battery')) return 'Battery Problems'
  if (message.includes('tire') || message.includes('wheel')) return 'Tire/Wheel Issues'
  if (message.includes('oil')) return 'Oil/Maintenance'
  if (message.includes('noise') || message.includes('sound')) return 'Unusual Noises'
  if (message.includes('light') || message.includes('warning')) return 'Warning Lights'
  if (message.includes('ac') || message.includes('heat')) return 'Climate Control'
  if (message.includes('steering')) return 'Steering Issues'
  
  // Fallback to truncated message
  return firstMessage.length > 30 
    ? firstMessage.substring(0, 30) + '...'
    : firstMessage
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessionHistory: [],
      
      createNewSession: () => {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        set((state) => ({
          currentSession: newSession,
          sessionHistory: [newSession, ...state.sessionHistory],
        }))
      },
      
      addMessage: (messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: Date.now().toString(),
          timestamp: new Date(),
        }
        
        set((state) => {
          if (!state.currentSession) {
            // Create new session if none exists
            const newSession: ChatSession = {
              id: Date.now().toString(),
              title: 'New Conversation',
              messages: [message],
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            
            return {
              currentSession: newSession,
              sessionHistory: [newSession, ...state.sessionHistory],
            }
          }
          
          const updatedSession = {
            ...state.currentSession,
            messages: [...state.currentSession.messages, message],
            updatedAt: new Date(),
          }
          
          // Auto-generate title from first user message
          if (message.type === 'user' && state.currentSession.messages.length === 0) {
            updatedSession.title = generateSessionTitle(message.content)
          }
          
          const updatedHistory = state.sessionHistory.map(session =>
            session.id === updatedSession.id ? updatedSession : session
          )
          
          return {
            currentSession: updatedSession,
            sessionHistory: updatedHistory,
          }
        })
      },
      
      loadSession: (sessionId) => {
        const session = get().sessionHistory.find(s => s.id === sessionId)
        if (session) {
          set({ currentSession: session })
        }
      },
      
      deleteSession: (sessionId) => {
        set((state) => {
          const updatedHistory = state.sessionHistory.filter(s => s.id !== sessionId)
          const currentSession = state.currentSession?.id === sessionId 
            ? null 
            : state.currentSession
          
          return {
            sessionHistory: updatedHistory,
            currentSession,
          }
        })
      },
      
      updateSessionTitle: (sessionId, title) => {
        set((state) => {
          const updatedHistory = state.sessionHistory.map(session =>
            session.id === sessionId 
              ? { ...session, title, updatedAt: new Date() }
              : session
          )
          
          const currentSession = state.currentSession?.id === sessionId
            ? { ...state.currentSession, title, updatedAt: new Date() }
            : state.currentSession
          
          return {
            sessionHistory: updatedHistory,
            currentSession,
          }
        })
      },
      
      clearAllSessions: () => {
        set({
          currentSession: null,
          sessionHistory: [],
        })
      },
      
      generateSessionTitle,
      
      getCurrentMessages: () => {
        return get().currentSession?.messages || []
      },
    }),
    {
      name: 'dixon-chat-storage',
      storage: createJSONStorage(() => storage),
      // Only persist session history, not current session
      partialize: (state) => ({ 
        sessionHistory: state.sessionHistory 
      }),
    }
  )
)
