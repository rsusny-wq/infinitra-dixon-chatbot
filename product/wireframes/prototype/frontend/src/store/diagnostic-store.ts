import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    suggestions?: string[];
    vehicleData?: any;
    diagnosticData?: any;
  };
}

export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  transmission: string;
  mileage?: number;
}

export interface Diagnosis {
  id: string;
  issue: string;
  confidence: number;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  estimatedCost: number;
}

export interface QuoteOption {
  id: string;
  type: 'basic' | 'comprehensive';
  partsType: 'oem' | 'aftermarket';
  parts: Array<{
    name: string;
    cost: number;
    type: 'oem' | 'aftermarket';
  }>;
  laborHours: number;
  laborRate: number;
  totalCost: number;
}

export interface DiagnosticSession {
  id: string;
  vehicle?: Vehicle;
  symptoms: string;
  clarificationAnswers: Record<string, string>;
  diagnoses: Diagnosis[];
  quotes: QuoteOption[];
  status: 'vehicle-id' | 'symptoms' | 'clarification' | 'diagnosis' | 'quote' | 'mechanic-review' | 'approved';
  mechanicNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Conversational state
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  isChatMinimized: boolean;
  isAiTyping: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface DiagnosticStore {
  // Current session
  currentSession: DiagnosticSession | null;
  
  // User role
  userRole: 'customer' | 'mechanic';
  
  // Notifications
  notifications: Notification[];
  
  // Mechanic queue (for mechanic dashboard)
  mechanicQueue: DiagnosticSession[];
  
  // Actions
  startNewSession: () => void;
  setVehicle: (vehicle: Vehicle) => void;
  setSymptoms: (symptoms: string) => void;
  addClarificationAnswer: (question: string, answer: string) => void;
  setDiagnoses: (diagnoses: Diagnosis[]) => void;
  setQuotes: (quotes: QuoteOption[]) => void;
  updateSessionStatus: (status: DiagnosticSession['status']) => void;
  addMechanicNotes: (notes: string) => void;
  setUserRole: (role: 'customer' | 'mechanic') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  loadMechanicQueue: () => void;
  
  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  setAiTyping: (typing: boolean) => void;
  simulateAiResponse: (userMessage: string) => Promise<void>;
}

// Sample data
const sampleVehicles: Vehicle[] = [
  {
    id: '1',
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Civic',
    year: 2018,
    engine: '2.0L 4-Cylinder',
    transmission: 'CVT',
    mileage: 45000
  },
  {
    id: '2', 
    vin: '1FTFW1ET5DFC10312',
    make: 'Ford',
    model: 'F-150',
    year: 2019,
    engine: '3.5L V6 EcoBoost',
    transmission: '10-Speed Automatic',
    mileage: 32000
  }
];

const sampleDiagnoses: Diagnosis[] = [
  {
    id: '1',
    issue: 'Brake Pad Wear',
    confidence: 85,
    description: 'Front brake pads are likely worn and need replacement. This is causing the squeaking noise when braking.',
    category: 'Brakes',
    severity: 'medium',
    estimatedCost: 280
  },
  {
    id: '2',
    issue: 'Brake Rotor Scoring',
    confidence: 70,
    description: 'Brake rotors may have surface scoring due to worn pads. May require resurfacing or replacement.',
    category: 'Brakes',
    severity: 'medium',
    estimatedCost: 450
  },
  {
    id: '3',
    issue: 'Brake Fluid Low',
    confidence: 45,
    description: 'Brake fluid level may be low, contributing to brake performance issues.',
    category: 'Brakes',
    severity: 'low',
    estimatedCost: 25
  }
];

const sampleQuotes: QuoteOption[] = [
  {
    id: '1',
    type: 'basic',
    partsType: 'aftermarket',
    parts: [
      { name: 'Brake Pads (Front)', cost: 45, type: 'aftermarket' },
      { name: 'Brake Fluid', cost: 12, type: 'aftermarket' }
    ],
    laborHours: 1.5,
    laborRate: 120,
    totalCost: 237
  },
  {
    id: '2',
    type: 'comprehensive',
    partsType: 'oem',
    parts: [
      { name: 'OEM Brake Pads (Front)', cost: 85, type: 'oem' },
      { name: 'Brake Rotors (Front)', cost: 180, type: 'oem' },
      { name: 'Brake Fluid', cost: 18, type: 'oem' }
    ],
    laborHours: 2.5,
    laborRate: 120,
    totalCost: 583
  }
];

export const useDiagnosticStore = create<DiagnosticStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      userRole: 'customer',
      notifications: [],
      mechanicQueue: [],

      startNewSession: () => {
        const newSession: DiagnosticSession = {
          id: Date.now().toString(),
          symptoms: '',
          clarificationAnswers: {},
          diagnoses: [],
          quotes: [],
          status: 'vehicle-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          chatMessages: [],
          isChatOpen: false,
          isChatMinimized: false,
          isAiTyping: false
        };
        set({ currentSession: newSession });
      },

  setVehicle: (vehicle: Vehicle) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          vehicle,
          status: 'symptoms',
          updatedAt: new Date()
        }
      });
    }
  },

  setSymptoms: (symptoms: string) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          symptoms,
          status: 'clarification',
          updatedAt: new Date()
        }
      });
    }
  },

  addClarificationAnswer: (question: string, answer: string) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          clarificationAnswers: {
            ...session.clarificationAnswers,
            [question]: answer
          },
          updatedAt: new Date()
        }
      });
    }
  },

  setDiagnoses: (diagnoses: Diagnosis[]) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          diagnoses,
          status: 'diagnosis',
          updatedAt: new Date()
        }
      });
    }
  },

  setQuotes: (quotes: QuoteOption[]) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          quotes,
          status: 'quote',
          updatedAt: new Date()
        }
      });
    }
  },

  updateSessionStatus: (status: DiagnosticSession['status']) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          status,
          updatedAt: new Date()
        }
      });
    }
  },

  addMechanicNotes: (notes: string) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          mechanicNotes: notes,
          updatedAt: new Date()
        }
      });
    }
  },

  setUserRole: (role: 'customer' | 'mechanic') => {
    set({ userRole: role });
  },

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    set(state => ({
      notifications: [newNotification, ...state.notifications]
    }));
  },

  markNotificationRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },

  loadMechanicQueue: () => {
    // Simulate mechanic queue with sample sessions
    const sampleSessions: DiagnosticSession[] = [
      {
        id: 'session-1',
        vehicle: sampleVehicles[0],
        symptoms: 'My brakes are making a squeaking noise when I stop',
        clarificationAnswers: {
          'When did you first notice this?': 'About a week ago',
          'Does it happen every time you brake?': 'Yes, especially in the morning'
        },
        diagnoses: sampleDiagnoses,
        quotes: sampleQuotes,
        status: 'mechanic-review',
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
        chatMessages: [],
        isChatOpen: false,
        isChatMinimized: false,
        isAiTyping: false
      },
      {
        id: 'session-2',
        vehicle: sampleVehicles[1],
        symptoms: 'Engine makes a rattling sound on startup',
        clarificationAnswers: {
          'How long does the rattling last?': 'About 10-15 seconds',
          'Does it happen in cold weather?': 'Yes, more noticeable when cold'
        },
        diagnoses: [
          {
            id: '4',
            issue: 'Timing Chain Tensioner',
            confidence: 75,
            description: 'Timing chain tensioner may be worn, causing rattling on startup.',
            category: 'Engine',
            severity: 'high',
            estimatedCost: 850
          }
        ],
        quotes: [
          {
            id: '3',
            type: 'comprehensive',
            partsType: 'oem',
            parts: [
              { name: 'Timing Chain Tensioner', cost: 180, type: 'oem' },
              { name: 'Engine Oil', cost: 35, type: 'oem' }
            ],
            laborHours: 4.5,
            laborRate: 120,
            totalCost: 755
          }
        ],
        status: 'mechanic-review',
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60),
        chatMessages: [],
        isChatOpen: false,
        isChatMinimized: false,
        isAiTyping: false
      }
    ];
    
    set({ mechanicQueue: sampleSessions });
  },

  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const session = get().currentSession;
    if (session) {
      const newMessage: ChatMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      set({
        currentSession: {
          ...session,
          chatMessages: [...session.chatMessages, newMessage],
          updatedAt: new Date()
        }
      });
    }
  },

  toggleChat: () => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          isChatOpen: !session.isChatOpen,
          isChatMinimized: false
        }
      });
    }
  },

  minimizeChat: () => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          isChatOpen: false,
          isChatMinimized: true
        }
      });
    }
  },

  maximizeChat: () => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          isChatOpen: true,
          isChatMinimized: false
        }
      });
    }
  },

  setAiTyping: (typing: boolean) => {
    const session = get().currentSession;
    if (session) {
      set({
        currentSession: {
          ...session,
          isAiTyping: typing
        }
      });
    }
  },

  simulateAiResponse: async (userMessage: string) => {
    const session = get().currentSession;
    if (!session) return;

    const { setAiTyping, addChatMessage, setVehicle, setSymptoms, setDiagnoses, setQuotes, updateSessionStatus } = get();
    
    setAiTyping(true);
    
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    let aiResponse = '';
    let shouldUpdateSession = false;
    
    // AI responses based on current session status and user input
    switch (session.status) {
      case 'vehicle-id':
        if (userMessage.toLowerCase().includes('vin') || userMessage.match(/[A-HJ-NPR-Z0-9]{17}/)) {
          // VIN detected
          const mockVehicle = sampleVehicles[0]; // Use sample vehicle
          setVehicle(mockVehicle);
          aiResponse = `Great! I found your vehicle: ${mockVehicle.year} ${mockVehicle.make} ${mockVehicle.model}. Now, can you describe what's wrong with your car? What symptoms are you experiencing?`;
          shouldUpdateSession = true;
        } else {
          aiResponse = "Hi! I'm here to help diagnose your vehicle. To get started, I'll need to identify your car. You can either scan your VIN with your camera or tell me your vehicle's make, model, and year. What would you prefer?";
        }
        break;
        
      case 'symptoms':
        setSymptoms(userMessage);
        aiResponse = `I understand you're experiencing: "${userMessage}". Let me ask a few clarifying questions to better diagnose the issue:\n\n1. When did you first notice this problem?\n2. Does it happen every time you drive?\n3. Have you noticed any other unusual sounds, smells, or behaviors?`;
        updateSessionStatus('clarification');
        shouldUpdateSession = true;
        break;
        
      case 'clarification':
        // Simulate diagnosis after clarification
        setDiagnoses(sampleDiagnoses);
        aiResponse = `Based on your symptoms and answers, I've identified the most likely issues:\n\n🔧 **Primary Diagnosis (85% confidence)**\nBrake Pad Wear - Your brake pads likely need replacement\n\n🔧 **Alternative Possibilities**\n• Brake Rotor Scoring (70% confidence)\n• Low Brake Fluid (45% confidence)\n\nWould you like me to generate repair quotes for these issues?`;
        updateSessionStatus('diagnosis');
        shouldUpdateSession = true;
        break;
        
      case 'diagnosis':
        if (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('quote')) {
          setQuotes(sampleQuotes);
          aiResponse = `Here are your repair options:\n\n💰 **Basic Option - $237**\n• Aftermarket brake pads\n• 1.5 hours labor\n• Essential repairs only\n\n💰 **Comprehensive Option - $583**\n• OEM brake pads & rotors\n• 2.5 hours labor\n• Complete brake service\n\nBoth quotes are preliminary and will be reviewed by a certified mechanic. Would you like to proceed with one of these options?`;
          updateSessionStatus('quote');
          shouldUpdateSession = true;
        } else {
          aiResponse = "I understand you'd like more information. What specific questions do you have about the diagnosis? I can explain any of the identified issues in more detail.";
        }
        break;
        
      case 'quote':
        aiResponse = `Perfect! I've prepared your diagnostic information for mechanic review. A certified technician will:\n\n✅ Verify the AI diagnosis\n✅ Confirm the repair quote\n✅ Contact you within 2 hours\n\nYour session ID is: ${session.id}\n\nIs there anything else I can help you with today?`;
        updateSessionStatus('mechanic-review');
        shouldUpdateSession = true;
        break;
        
      default:
        aiResponse = "I'm here to help with your vehicle diagnosis. How can I assist you today?";
    }
    
    setAiTyping(false);
    addChatMessage({
      type: 'ai',
      content: aiResponse,
      metadata: shouldUpdateSession ? { confidence: 85 } : undefined
    });
  }
}),
{
  name: 'dixon-diagnostic-storage',
  partialize: (state) => ({
    currentSession: state.currentSession,
    userRole: state.userRole,
  }),
}
)
);
