import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from './storage'

// Types
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  preferredContactMethod: 'email' | 'phone' | 'sms';
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  // Voice Settings
  voiceEnabled: boolean;
  handsFreeModeEnabled: boolean;
  voiceLanguage: string;
  speechRate: number; // 0.5 to 2.0
  speechVolume: number; // 0.0 to 1.0
  
  // Notification Settings
  pushNotificationsEnabled: boolean;
  maintenanceRemindersEnabled: boolean;
  serviceUpdatesEnabled: boolean;
  
  // Display Settings
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  highContrastMode: boolean;
  
  // Privacy Settings
  dataCollectionEnabled: boolean;
  analyticsEnabled: boolean;
  locationSharingEnabled: boolean;
  
  // Automotive Settings
  defaultMileageUnit: 'miles' | 'kilometers';
  defaultCurrency: 'USD' | 'CAD' | 'EUR' | 'GBP';
  autoVinDetection: boolean;
  
  // App Behavior
  autoSaveConversations: boolean;
  clearHistoryOnExit: boolean;
  offlineModeEnabled: boolean;
}

interface SettingsStore {
  // State
  userProfile: UserProfile | null;
  appSettings: AppSettings;
  
  // User Profile Actions
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  clearUserProfile: () => void;
  
  // Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // Voice Settings Shortcuts
  toggleVoice: () => void;
  toggleHandsFree: () => void;
  setSpeechRate: (rate: number) => void;
  setSpeechVolume: (volume: number) => void;
  
  // Notification Settings Shortcuts
  togglePushNotifications: () => void;
  toggleMaintenanceReminders: () => void;
  
  // Display Settings Shortcuts
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleHighContrast: () => void;
  
  // Utility Functions
  getVoiceSettings: () => Pick<AppSettings, 'voiceEnabled' | 'handsFreeModeEnabled' | 'speechRate' | 'speechVolume'>;
  getNotificationSettings: () => Pick<AppSettings, 'pushNotificationsEnabled' | 'maintenanceRemindersEnabled' | 'serviceUpdatesEnabled'>;
}

// Default settings
const defaultSettings: AppSettings = {
  // Voice Settings (Automotive Optimized)
  voiceEnabled: true,
  handsFreeModeEnabled: true,
  voiceLanguage: 'en-US',
  speechRate: 0.85, // Slower for automotive use
  speechVolume: 0.9, // Louder for road noise
  
  // Notification Settings
  pushNotificationsEnabled: true,
  maintenanceRemindersEnabled: true,
  serviceUpdatesEnabled: true,
  
  // Display Settings
  theme: 'auto',
  fontSize: 'medium',
  highContrastMode: false,
  
  // Privacy Settings
  dataCollectionEnabled: true,
  analyticsEnabled: true,
  locationSharingEnabled: false,
  
  // Automotive Settings
  defaultMileageUnit: 'miles',
  defaultCurrency: 'USD',
  autoVinDetection: true,
  
  // App Behavior
  autoSaveConversations: true,
  clearHistoryOnExit: false,
  offlineModeEnabled: true,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      userProfile: null,
      appSettings: defaultSettings,
      
      // User Profile Actions
      updateUserProfile: (updates) => {
        set((state) => ({
          userProfile: state.userProfile 
            ? { ...state.userProfile, ...updates, updatedAt: new Date() }
            : {
                id: Date.now().toString(),
                preferredContactMethod: 'email',
                createdAt: new Date(),
                updatedAt: new Date(),
                ...updates,
              }
        }))
      },
      
      clearUserProfile: () => {
        set({ userProfile: null })
      },
      
      // Settings Actions
      updateSettings: (updates) => {
        set((state) => ({
          appSettings: { ...state.appSettings, ...updates }
        }))
      },
      
      resetSettings: () => {
        set({ appSettings: defaultSettings })
      },
      
      // Voice Settings Shortcuts
      toggleVoice: () => {
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            voiceEnabled: !state.appSettings.voiceEnabled
          }
        }))
      },
      
      toggleHandsFree: () => {
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            handsFreeModeEnabled: !state.appSettings.handsFreeModeEnabled
          }
        }))
      },
      
      setSpeechRate: (rate) => {
        const clampedRate = Math.max(0.5, Math.min(2.0, rate))
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            speechRate: clampedRate
          }
        }))
      },
      
      setSpeechVolume: (volume) => {
        const clampedVolume = Math.max(0.0, Math.min(1.0, volume))
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            speechVolume: clampedVolume
          }
        }))
      },
      
      // Notification Settings Shortcuts
      togglePushNotifications: () => {
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            pushNotificationsEnabled: !state.appSettings.pushNotificationsEnabled
          }
        }))
      },
      
      toggleMaintenanceReminders: () => {
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            maintenanceRemindersEnabled: !state.appSettings.maintenanceRemindersEnabled
          }
        }))
      },
      
      // Display Settings Shortcuts
      setTheme: (theme) => {
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            theme
          }
        }))
      },
      
      setFontSize: (fontSize) => {
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            fontSize
          }
        }))
      },
      
      toggleHighContrast: () => {
        set((state) => ({
          appSettings: {
            ...state.appSettings,
            highContrastMode: !state.appSettings.highContrastMode
          }
        }))
      },
      
      // Utility Functions
      getVoiceSettings: () => {
        const { voiceEnabled, handsFreeModeEnabled, speechRate, speechVolume } = get().appSettings
        return { voiceEnabled, handsFreeModeEnabled, speechRate, speechVolume }
      },
      
      getNotificationSettings: () => {
        const { pushNotificationsEnabled, maintenanceRemindersEnabled, serviceUpdatesEnabled } = get().appSettings
        return { pushNotificationsEnabled, maintenanceRemindersEnabled, serviceUpdatesEnabled }
      },
    }),
    {
      name: 'dixon-settings-storage',
      storage: createJSONStorage(() => storage),
    }
  )
)
