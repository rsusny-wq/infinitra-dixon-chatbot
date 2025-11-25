import { Platform } from 'react-native'

// Web-compatible storage implementation
const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Silently fail on web if localStorage is not available
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silently fail on web if localStorage is not available
    }
  }
}

// Use AsyncStorage for native platforms, localStorage for web
export const storage = Platform.OS === 'web' ? webStorage : require('@react-native-async-storage/async-storage').default
