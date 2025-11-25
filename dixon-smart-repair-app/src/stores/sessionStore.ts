/**
 * Session Management Store
 * Zustand store for managing user sessions, conversation history, and vehicle library
 * Phase 3: Frontend Session Management UI
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import AuthService from '../services/AuthService';

// Types
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  showDiagnosticButtons?: boolean;
  showUpgradeOptions?: boolean;
  diagnosisData?: any;
}

export interface SessionInfo {
  id: string;
  title: string;
  userId?: string | null; // Link to authenticated user
  lastAccessed: Date;
  messageCount: number;
  diagnosticLevel: 'quick' | 'vehicle' | 'precision';
  diagnosticAccuracy: string;
  vinEnhanced: boolean;
  vehicleInfo?: VehicleInfo;
  isActive: boolean;
  createdAt: Date;
  messages: ChatMessage[]; // Store actual chat messages
}

export interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  year: number;
  trim?: string; // Added trim field
  vin?: string;
  nickname?: string;
  lastUsed: Date;
  usageCount: number;
  verified: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  isAuthenticated: boolean;
  sessionCount: number;
  vehicleCount: number;
  lastLogin: Date;
  preferences?: {
    theme: string;
    notifications: boolean;
    dataRetention: string;
  };
}

export interface SessionState {
  // Current session
  currentSessionId: string | null;
  currentSession: SessionInfo | null;
  
  // Session history (authenticated users only)
  sessions: SessionInfo[];
  
  // Vehicle library (authenticated users only, max 10)
  vehicles: VehicleInfo[];
  
  // User profile
  userProfile: UserProfile | null;
  
  // UI state
  showSessionHistory: boolean;
  showVehicleLibrary: boolean;
  isLoading: boolean;
  
  // Actions
  createSession: (title?: string) => string;
  updateSessionTitle: (sessionId: string, title: string) => void;
  updateSessionMetadata: (sessionId: string, metadata: Partial<SessionInfo>) => void;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  
  // Message management
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  getSessionMessages: (sessionId: string) => ChatMessage[];
  clearSessionMessages: (sessionId: string) => void;
  
  // Vehicle library actions
  addVehicle: (vehicle: Omit<VehicleInfo, 'id' | 'lastUsed' | 'usageCount'>) => string | null;
  updateVehicle: (vehicleId: string, updates: Partial<VehicleInfo>) => void;
  deleteVehicle: (vehicleId: string) => void;
  selectVehicle: (vehicleId: string) => void;
  
  // User profile actions
  setUserProfile: (profile: UserProfile) => void;
  clearUserData: () => void;
  initializeUserSession: () => Promise<void>;
  linkSessionToUser: (sessionId: string) => Promise<void>;
  
  // UI actions
  toggleSessionHistory: () => void;
  toggleVehicleLibrary: () => void;
  
  // Privacy actions
  clearAllData: () => void;
  exportUserData: () => any;
}

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Generate session titles based on content
const generateSessionTitle = (content?: string): string => {
  if (!content) return `New Chat`; // Temporary title until first message
  
  // Use basic string operations only
  var lowerContent = content.toLowerCase();
  
  // Check for brand + model combinations first (highest priority)
  if (lowerContent.indexOf('honda') !== -1 && lowerContent.indexOf('civic') !== -1) return 'Honda Civic';
  if (lowerContent.indexOf('honda') !== -1 && lowerContent.indexOf('accord') !== -1) return 'Honda Accord';
  if (lowerContent.indexOf('honda') !== -1 && lowerContent.indexOf('crv') !== -1) return 'Honda CR-V';
  if (lowerContent.indexOf('honda') !== -1 && lowerContent.indexOf('cr-v') !== -1) return 'Honda CR-V';
  if (lowerContent.indexOf('honda') !== -1 && lowerContent.indexOf('pilot') !== -1) return 'Honda Pilot';
  
  if (lowerContent.indexOf('toyota') !== -1 && lowerContent.indexOf('camry') !== -1) return 'Toyota Camry';
  if (lowerContent.indexOf('toyota') !== -1 && lowerContent.indexOf('corolla') !== -1) return 'Toyota Corolla';
  if (lowerContent.indexOf('toyota') !== -1 && lowerContent.indexOf('prius') !== -1) return 'Toyota Prius';
  if (lowerContent.indexOf('toyota') !== -1 && lowerContent.indexOf('rav4') !== -1) return 'Toyota RAV4';
  
  if (lowerContent.indexOf('ford') !== -1 && lowerContent.indexOf('f150') !== -1) return 'Ford F-150';
  if (lowerContent.indexOf('ford') !== -1 && lowerContent.indexOf('f-150') !== -1) return 'Ford F-150';
  if (lowerContent.indexOf('ford') !== -1 && lowerContent.indexOf('mustang') !== -1) return 'Ford Mustang';
  if (lowerContent.indexOf('ford') !== -1 && lowerContent.indexOf('explorer') !== -1) return 'Ford Explorer';
  
  // Check for brand + problem combinations
  if (lowerContent.indexOf('honda') !== -1 && (lowerContent.indexOf('brake') !== -1 || lowerContent.indexOf('brakes') !== -1)) return 'Honda Brake Issue';
  if (lowerContent.indexOf('honda') !== -1 && lowerContent.indexOf('engine') !== -1) return 'Honda Engine Problem';
  if (lowerContent.indexOf('honda') !== -1 && lowerContent.indexOf('transmission') !== -1) return 'Honda Transmission Issue';
  if (lowerContent.indexOf('honda') !== -1 && (lowerContent.indexOf('battery') !== -1 || lowerContent.indexOf('batteries') !== -1)) return 'Honda Battery Problem';
  if (lowerContent.indexOf('honda') !== -1 && lowerContent.indexOf('oil') !== -1) return 'Honda Oil Service';
  
  if (lowerContent.indexOf('toyota') !== -1 && (lowerContent.indexOf('brake') !== -1 || lowerContent.indexOf('brakes') !== -1)) return 'Toyota Brake Issue';
  if (lowerContent.indexOf('toyota') !== -1 && lowerContent.indexOf('engine') !== -1) return 'Toyota Engine Problem';
  if (lowerContent.indexOf('toyota') !== -1 && lowerContent.indexOf('transmission') !== -1) return 'Toyota Transmission Issue';
  if (lowerContent.indexOf('toyota') !== -1 && lowerContent.indexOf('oil') !== -1) return 'Toyota Oil Service';
  
  if (lowerContent.indexOf('ford') !== -1 && (lowerContent.indexOf('brake') !== -1 || lowerContent.indexOf('brakes') !== -1)) return 'Ford Brake Issue';
  if (lowerContent.indexOf('ford') !== -1 && lowerContent.indexOf('engine') !== -1) return 'Ford Engine Problem';
  if (lowerContent.indexOf('ford') !== -1 && lowerContent.indexOf('transmission') !== -1) return 'Ford Transmission Issue';
  
  // Check for single brands
  if (lowerContent.indexOf('honda') !== -1) return 'Honda Service';
  if (lowerContent.indexOf('toyota') !== -1) return 'Toyota Service';
  if (lowerContent.indexOf('ford') !== -1) return 'Ford Service';
  if (lowerContent.indexOf('chevrolet') !== -1 || lowerContent.indexOf('chevy') !== -1) return 'Chevrolet Service';
  if (lowerContent.indexOf('nissan') !== -1) return 'Nissan Service';
  if (lowerContent.indexOf('bmw') !== -1) return 'BMW Service';
  if (lowerContent.indexOf('mercedes') !== -1) return 'Mercedes Service';
  if (lowerContent.indexOf('audi') !== -1) return 'Audi Service';
  
  // Check for single models
  if (lowerContent.indexOf('civic') !== -1) return 'Civic Service';
  if (lowerContent.indexOf('accord') !== -1) return 'Accord Service';
  if (lowerContent.indexOf('camry') !== -1) return 'Camry Service';
  if (lowerContent.indexOf('corolla') !== -1) return 'Corolla Service';
  
  // Check for problems only
  if (lowerContent.indexOf('brake') !== -1 || lowerContent.indexOf('brakes') !== -1) return 'Brake Issue';
  if (lowerContent.indexOf('engine') !== -1) return 'Engine Problem';
  if (lowerContent.indexOf('transmission') !== -1) return 'Transmission Issue';
  if (lowerContent.indexOf('battery') !== -1 || lowerContent.indexOf('batteries') !== -1) return 'Battery Problem';
  if (lowerContent.indexOf('tire') !== -1 || lowerContent.indexOf('tires') !== -1) return 'Tire Issue';
  if (lowerContent.indexOf('oil') !== -1) return 'Oil Service';
  if (lowerContent.indexOf('noise') !== -1 || lowerContent.indexOf('sound') !== -1) return 'Noise Diagnosis';
  if (lowerContent.indexOf('vibration') !== -1 || lowerContent.indexOf('vibrating') !== -1) return 'Vibration Issue';
  if (lowerContent.indexOf('leak') !== -1 || lowerContent.indexOf('leaking') !== -1) return 'Leak Diagnosis';
  if (lowerContent.indexOf('light') !== -1 || lowerContent.indexOf('warning') !== -1) return 'Warning Light';
  if (lowerContent.indexOf('alternator') !== -1) return 'Alternator Issue';
  if (lowerContent.indexOf('starter') !== -1) return 'Starter Problem';
  if (lowerContent.indexOf('ac') !== -1 || lowerContent.indexOf('air conditioning') !== -1) return 'AC Issue';
  if (lowerContent.indexOf('filter') !== -1 || lowerContent.indexOf('filters') !== -1) return 'Filter Service';
  if (lowerContent.indexOf('cost') !== -1) return 'Cost Inquiry';
  if (lowerContent.indexOf('price') !== -1) return 'Price Check';
  if (lowerContent.indexOf('repair') !== -1 || lowerContent.indexOf('fix') !== -1) return 'Repair Question';
  
  // Fallback to first few words using basic string operations
  var words = content.split(' ');
  var firstFourWords = '';
  for (var wordIdx = 0; wordIdx < 4 && wordIdx < words.length; wordIdx++) {
    if (wordIdx > 0) firstFourWords += ' ';
    firstFourWords += words[wordIdx];
  }
  
  if (firstFourWords.length > 25) {
    return firstFourWords.substring(0, 25) + '...';
  }
  
  return firstFourWords || 'New Chat';
};

export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSessionId: null,
        currentSession: null,
        sessions: [],
        vehicles: [],
        userProfile: null,
        showSessionHistory: false,
        showVehicleLibrary: false,
        isLoading: false,
        
        // Session actions
        createSession: (title?: string) => {
          const state = get();
          
          // Only create persistent sessions for authenticated users
          if (!state.userProfile?.isAuthenticated) {
            // For unauthenticated users, just return a temporary session ID
            const tempSessionId = generateId();
            console.log('🔒 Created temporary session for unauthenticated user:', tempSessionId);
            return tempSessionId;
          }
          
          const sessionId = generateId();
          const now = new Date();
          
          const newSession: SessionInfo = {
            id: sessionId,
            title: title || generateSessionTitle(),
            userId: state.userProfile.id,
            lastAccessed: now,
            messageCount: 0,
            diagnosticLevel: 'quick',
            diagnosticAccuracy: '65%',
            vinEnhanced: false,
            isActive: true,
            createdAt: now,
            messages: [] // Initialize with empty messages array
          };
          
          set((state) => ({
            currentSessionId: sessionId,
            currentSession: newSession,
            sessions: [newSession, ...state.sessions.slice(0, 49)] // Keep max 50 sessions
          }));
          
          return sessionId;
        },
        
        updateSessionTitle: (sessionId: string, title: string) => {
          const state = get();
          console.log('🏪 SessionStore: updateSessionTitle called:', {
            sessionId,
            title,
            currentSessions: state.sessions.length,
            sessionExists: state.sessions.some(s => s.id === sessionId)
          });
          
          // Manually update sessions array to avoid .map() scoping issues
          var updatedTitleSessions = [];
          var sessionFound = false;
          for (var titleUpdateIdx = 0; titleUpdateIdx < state.sessions.length; titleUpdateIdx++) {
            var sessionToUpdate = state.sessions[titleUpdateIdx];
            if (sessionToUpdate.id === sessionId) {
              updatedTitleSessions.push({ ...sessionToUpdate, title });
              sessionFound = true;
              console.log('🏪 SessionStore: Updated session title from', sessionToUpdate.title, 'to', title);
            } else {
              updatedTitleSessions.push(sessionToUpdate);
            }
          }
          
          // Manually update current session
          var updatedTitleCurrentSession = state.currentSession;
          if (state.currentSession?.id === sessionId) {
            updatedTitleCurrentSession = { ...state.currentSession, title };
            console.log('🏪 SessionStore: Updated current session title to', title);
          }
          
          if (!sessionFound) {
            console.warn('🏪 SessionStore: Session not found for title update:', sessionId);
          }
          
          set({
            sessions: updatedTitleSessions,
            currentSession: updatedTitleCurrentSession
          });
          
          console.log('🏪 SessionStore: Title update complete, new sessions:', updatedTitleSessions.map(s => ({ id: s.id, title: s.title })));
        },
        
        updateSessionMetadata: (sessionId: string, metadata: Partial<SessionInfo>) => {
          const now = new Date();
          const state = get();
          
          // Manually update sessions array to avoid .map() scoping issues
          var updatedMetadataSessions = [];
          for (var metadataIdx = 0; metadataIdx < state.sessions.length; metadataIdx++) {
            var sessionToUpdateMetadata = state.sessions[metadataIdx];
            if (sessionToUpdateMetadata.id === sessionId) {
              updatedMetadataSessions.push({ ...sessionToUpdateMetadata, ...metadata, lastAccessed: now });
            } else {
              updatedMetadataSessions.push(sessionToUpdateMetadata);
            }
          }
          
          // Manually update current session
          var updatedMetadataCurrentSession = state.currentSession;
          if (state.currentSession?.id === sessionId) {
            updatedMetadataCurrentSession = { ...state.currentSession, ...metadata, lastAccessed: now };
          }
          
          set({
            sessions: updatedMetadataSessions,
            currentSession: updatedMetadataCurrentSession
          });
        },
        
        deleteSession: (sessionId: string) => {
          const state = get();
          
          // Manually filter sessions to avoid .filter() scoping issues
          var filteredSessions = [];
          for (var deleteIdx = 0; deleteIdx < state.sessions.length; deleteIdx++) {
            if (state.sessions[deleteIdx].id !== sessionId) {
              filteredSessions.push(state.sessions[deleteIdx]);
            }
          }
          
          set({
            sessions: filteredSessions,
            currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
            currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
          });
        },
        
        setCurrentSession: (sessionId: string) => {
          const state = get();
          // Manually find session to avoid .find() scoping issues
          var foundSession = null;
          for (var findIdx = 0; findIdx < state.sessions.length; findIdx++) {
            if (state.sessions[findIdx].id === sessionId) {
              foundSession = state.sessions[findIdx];
              break;
            }
          }
          
          if (foundSession) {
            set({
              currentSessionId: sessionId,
              currentSession: foundSession
            });
          }
        },
        
        // Message management methods
        addMessageToSession: (sessionId: string, message: ChatMessage) => {
          const state = get();
          if (!state.userProfile?.isAuthenticated) {
            // Don't persist messages for unauthenticated users
            return;
          }
          
          // Manually update sessions array to avoid .map() scoping issues
          var updatedSessions = [];
          for (var sessionIdx = 0; sessionIdx < state.sessions.length; sessionIdx++) {
            var currentSession = state.sessions[sessionIdx];
            if (currentSession.id === sessionId) {
              updatedSessions.push({
                ...currentSession,
                messages: [...currentSession.messages, message],
                messageCount: currentSession.messages.length + 1,
                lastAccessed: new Date()
              });
            } else {
              updatedSessions.push(currentSession);
            }
          }
          
          // Manually update current session to avoid scoping issues
          var updatedCurrentSession = state.currentSession;
          if (state.currentSession?.id === sessionId) {
            updatedCurrentSession = {
              ...state.currentSession,
              messages: [...state.currentSession.messages, message],
              messageCount: state.currentSession.messages.length + 1,
              lastAccessed: new Date()
            };
          }
          
          set({
            sessions: updatedSessions,
            currentSession: updatedCurrentSession
          });
        },
        
        getSessionMessages: (sessionId: string) => {
          const state = get();
          // Manually find session to avoid .find() scoping issues
          for (var sessionFindIdx = 0; sessionFindIdx < state.sessions.length; sessionFindIdx++) {
            if (state.sessions[sessionFindIdx].id === sessionId) {
              return state.sessions[sessionFindIdx].messages || [];
            }
          }
          return [];
        },
        
        clearSessionMessages: (sessionId: string) => {
          const state = get();
          if (!state.userProfile?.isAuthenticated) {
            return;
          }
          
          // Manually update sessions array to avoid .map() scoping issues
          var clearedSessions = [];
          for (var clearIdx = 0; clearIdx < state.sessions.length; clearIdx++) {
            var sessionToClear = state.sessions[clearIdx];
            if (sessionToClear.id === sessionId) {
              clearedSessions.push({ ...sessionToClear, messages: [], messageCount: 0 });
            } else {
              clearedSessions.push(sessionToClear);
            }
          }
          
          // Manually update current session
          var clearedCurrentSession = state.currentSession;
          if (state.currentSession?.id === sessionId) {
            clearedCurrentSession = { ...state.currentSession, messages: [], messageCount: 0 };
          }
          
          set({
            sessions: clearedSessions,
            currentSession: clearedCurrentSession
          });
        },
        
        // Vehicle library actions
        addVehicle: (vehicle: Omit<VehicleInfo, 'id' | 'lastUsed' | 'usageCount'>) => {
          const state = get();
          
          // Check if authenticated and under limit
          if (!state.userProfile?.isAuthenticated) return null;
          if (state.vehicles.length >= 10) return null;
          
          const vehicleId = generateId();
          const newVehicle: VehicleInfo = {
            ...vehicle,
            id: vehicleId,
            lastUsed: new Date(),
            usageCount: 1
          };
          
          set((state) => ({
            vehicles: [newVehicle, ...state.vehicles]
          }));
          
          return vehicleId;
        },
        
        updateVehicle: (vehicleId: string, updates: Partial<VehicleInfo>) => {
          set((state) => ({
            vehicles: state.vehicles.map(vehicle =>
              vehicle.id === vehicleId 
                ? { ...vehicle, ...updates, lastUsed: new Date() }
                : vehicle
            )
          }));
        },
        
        deleteVehicle: (vehicleId: string) => {
          set((state) => ({
            vehicles: state.vehicles.filter(vehicle => vehicle.id !== vehicleId)
          }));
        },
        
        selectVehicle: (vehicleId: string) => {
          set((state) => ({
            vehicles: state.vehicles.map(vehicle =>
              vehicle.id === vehicleId
                ? { ...vehicle, lastUsed: new Date(), usageCount: vehicle.usageCount + 1 }
                : vehicle
            )
          }));
        },
        
        // User profile actions
        setUserProfile: (profile: UserProfile) => {
          set({ userProfile: profile });
        },
        
        clearUserData: () => {
          const state = get();
          set({
            sessions: [],
            vehicles: state.vehicles, // Preserve vehicles during sign out
            userProfile: null,
            currentSessionId: null,
            currentSession: null
          });
        },

        // Authentication integration methods
        initializeUserSession: async () => {
          try {
            const currentUser = await AuthService.getCurrentUser();
            if (currentUser) {
              const userProfile: UserProfile = {
                id: currentUser.userId,
                email: currentUser.email || '',
                name: currentUser.name || '',
                role: currentUser.role || 'customer',
                isAuthenticated: true,
                preferences: {
                  theme: 'light',
                  notifications: true,
                  dataRetention: '1year'
                }
              };
              
              get().setUserProfile(userProfile);
              console.log('SessionStore: Initialized user session for:', currentUser.userId);
            } else {
              console.log('SessionStore: No authenticated user found');
            }
          } catch (error) {
            console.error('SessionStore: Error initializing user session:', error);
          }
        },

        linkSessionToUser: async (sessionId: string) => {
          try {
            const currentUser = await AuthService.getCurrentUser();
            if (currentUser) {
              const state = get();
              const session = state.sessions.find(s => s.id === sessionId);
              if (session) {
                // Update session with user ID
                get().updateSessionMetadata(sessionId, {
                  userId: currentUser.userId
                });
                console.log('SessionStore: Linked session to user:', currentUser.userId);
              }
            }
          } catch (error) {
            console.error('SessionStore: Error linking session to user:', error);
          }
        },
        
        // UI actions
        toggleSessionHistory: () => {
          set((state) => ({ showSessionHistory: !state.showSessionHistory }));
        },
        
        toggleVehicleLibrary: () => {
          set((state) => ({ showVehicleLibrary: !state.showVehicleLibrary }));
        },
        
        // Privacy actions
        clearAllData: () => {
          set({
            currentSessionId: null,
            currentSession: null,
            sessions: [],
            vehicles: [],
            userProfile: null,
            showSessionHistory: false,
            showVehicleLibrary: false,
            isLoading: false
          });
        },
        
        exportUserData: () => {
          const state = get();
          return {
            userProfile: state.userProfile,
            sessions: state.sessions,
            vehicles: state.vehicles,
            exportedAt: new Date().toISOString()
          };
        }
      }),
      {
        name: 'dixon-session-storage',
        // Only persist for authenticated users
        partialize: (state) => state.userProfile?.isAuthenticated ? {
          sessions: state.sessions,
          vehicles: state.vehicles,
          userProfile: state.userProfile
        } : {},
        // Custom serialization to handle Date objects
        serialize: (state) => {
          // Convert Date objects to ISO strings for storage
          const serializedState = {
            ...state,
            sessions: state.sessions?.map(session => ({
              ...session,
              lastAccessed: session.lastAccessed instanceof Date 
                ? session.lastAccessed.toISOString() 
                : session.lastAccessed,
              createdAt: session.createdAt instanceof Date 
                ? session.createdAt.toISOString() 
                : session.createdAt,
              messages: session.messages?.map(message => ({
                ...message,
                timestamp: message.timestamp instanceof Date
                  ? message.timestamp.toISOString()
                  : message.timestamp
              })) || []
            })),
            vehicles: state.vehicles?.map(vehicle => ({
              ...vehicle,
              lastUsed: vehicle.lastUsed instanceof Date 
                ? vehicle.lastUsed.toISOString() 
                : vehicle.lastUsed
            })),
            userProfile: state.userProfile ? {
              ...state.userProfile,
              lastLogin: state.userProfile.lastLogin instanceof Date 
                ? state.userProfile.lastLogin.toISOString() 
                : state.userProfile.lastLogin
            } : null
          };
          return JSON.stringify(serializedState);
        },
        deserialize: (str) => {
          const parsed = JSON.parse(str);
          
          // Convert date strings back to Date objects
          if (parsed.sessions) {
            parsed.sessions = parsed.sessions.map((session: any) => ({
              ...session,
              lastAccessed: typeof session.lastAccessed === 'string' 
                ? new Date(session.lastAccessed) 
                : session.lastAccessed,
              createdAt: typeof session.createdAt === 'string' 
                ? new Date(session.createdAt) 
                : session.createdAt,
              messages: session.messages?.map((message: any) => ({
                ...message,
                timestamp: typeof message.timestamp === 'string'
                  ? new Date(message.timestamp)
                  : message.timestamp
              })) || []
            }));
          }
          
          if (parsed.vehicles) {
            parsed.vehicles = parsed.vehicles.map((vehicle: any) => ({
              ...vehicle,
              lastUsed: typeof vehicle.lastUsed === 'string' 
                ? new Date(vehicle.lastUsed) 
                : vehicle.lastUsed
            }));
          }
          
          if (parsed.userProfile?.lastLogin) {
            parsed.userProfile.lastLogin = typeof parsed.userProfile.lastLogin === 'string' 
              ? new Date(parsed.userProfile.lastLogin) 
              : parsed.userProfile.lastLogin;
          }
          
          return parsed;
        },
        // Platform-specific storage
        ...(Platform.OS === 'web' ? {} : {})
      }
    ),
    { name: 'SessionStore' }
  )
);
