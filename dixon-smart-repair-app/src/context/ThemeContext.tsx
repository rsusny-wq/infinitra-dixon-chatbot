/**
 * Theme Context
 * ChatGPT-style theme system with automotive adaptations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ChatGPT-style Color Scheme with Automotive Adaptations
export interface ColorScheme {
  // Background Colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  
  // Text Colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Interactive Colors
  primary: string;
  primaryHover: string;
  secondary: string;
  
  // Message Bubble Colors
  userBubble: string;
  aiBubble: string;
  systemBubble: string;
  
  // Border Colors
  border: string;
  borderLight: string;
  
  // Status Colors
  success: string;
  warning: string;
  error: string;
  
  // Automotive-specific Colors
  diagnostic: {
    high: string;      // High confidence - Green
    medium: string;    // Medium confidence - Orange
    low: string;       // Low confidence - Red
  };
  
  // Automotive Context Colors
  vehicle: string;
  repair: string;
  maintenance: string;
}

// Light Theme (ChatGPT-style)
const lightTheme: ColorScheme = {
  background: '#ffffff',
  surface: '#f7f7f8',
  surfaceSecondary: '#ececf1',
  
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#8e8ea0',
  
  primary: '#007AFF',
  primaryHover: '#0056CC',
  secondary: '#f0f9ff',
  
  userBubble: '#007AFF',
  aiBubble: '#f7f7f8',
  systemBubble: '#ececf1',
  
  border: '#e5e5e7',
  borderLight: '#f0f0f0',
  
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  
  diagnostic: {
    high: '#4CAF50',    // Green for high confidence
    medium: '#FF9800',  // Orange for medium confidence
    low: '#F44336',     // Red for low confidence
  },
  
  vehicle: '#2196F3',     // Blue for vehicle info
  repair: '#FF5722',      // Orange-red for repairs
  maintenance: '#9C27B0', // Purple for maintenance
};

// Dark Theme (ChatGPT-style with automotive adaptations)
const darkTheme: ColorScheme = {
  background: '#1a1a1a',
  surface: '#2d2d30',
  surfaceSecondary: '#3c3c41',
  
  text: '#ffffff',
  textSecondary: '#b4b4b4',
  textTertiary: '#8e8ea0',
  
  primary: '#007AFF',
  primaryHover: '#0056CC',
  secondary: '#1e3a5f',
  
  userBubble: '#007AFF',
  aiBubble: '#2d2d30',
  systemBubble: '#3c3c41',
  
  border: '#4a4a4f',
  borderLight: '#3c3c41',
  
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  
  diagnostic: {
    high: '#4CAF50',
    medium: '#FF9800',
    low: '#F44336',
  },
  
  vehicle: '#2196F3',
  repair: '#FF5722',
  maintenance: '#9C27B0',
};

// Automotive High Contrast Theme (for automotive environments)
const automotiveTheme: ColorScheme = {
  background: '#000000',
  surface: '#1a1a1a',
  surfaceSecondary: '#2d2d30',
  
  text: '#ffffff',
  textSecondary: '#e0e0e0',
  textTertiary: '#b0b0b0',
  
  primary: '#00D4FF',     // Bright blue for automotive displays
  primaryHover: '#00B8E6',
  secondary: '#1a4a5f',
  
  userBubble: '#00D4FF',
  aiBubble: '#1a1a1a',
  systemBubble: '#2d2d30',
  
  border: '#666666',
  borderLight: '#4a4a4a',
  
  success: '#00FF88',     // Bright green
  warning: '#FFB800',     // Bright orange
  error: '#FF4444',       // Bright red
  
  diagnostic: {
    high: '#00FF88',
    medium: '#FFB800',
    low: '#FF4444',
  },
  
  vehicle: '#00D4FF',
  repair: '#FF6B35',
  maintenance: '#B347D9',
};

export interface ThemeContextValue {
  theme: ColorScheme;
  isDark: boolean;
  isAutomotive: boolean;
  toggleTheme: () => void;
  setAutomotiveMode: (enabled: boolean) => void;
  systemTheme: ColorSchemeName;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isAutomotive, setIsAutomotive] = useState(false);
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load saved theme preferences
  useEffect(() => {
    loadThemePreferences();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreferences = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('theme_dark_mode');
      const savedAutomotiveMode = await AsyncStorage.getItem('theme_automotive_mode');
      
      if (savedDarkMode !== null) {
        setIsDark(JSON.parse(savedDarkMode));
      } else {
        // Default to system theme
        setIsDark(systemTheme === 'dark');
      }
      
      if (savedAutomotiveMode !== null) {
        setIsAutomotive(JSON.parse(savedAutomotiveMode));
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    }
  };

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    try {
      await AsyncStorage.setItem('theme_dark_mode', JSON.stringify(newIsDark));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setAutomotiveMode = async (enabled: boolean) => {
    setIsAutomotive(enabled);
    
    try {
      await AsyncStorage.setItem('theme_automotive_mode', JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving automotive mode preference:', error);
    }
  };

  // Determine current theme
  const getCurrentTheme = (): ColorScheme => {
    if (isAutomotive) {
      return automotiveTheme;
    }
    return isDark ? darkTheme : lightTheme;
  };

  const value: ThemeContextValue = {
    theme: getCurrentTheme(),
    isDark,
    isAutomotive,
    toggleTheme,
    setAutomotiveMode,
    systemTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Utility function to create themed styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: ColorScheme) => T
) => {
  return (theme: ColorScheme): T => styleFactory(theme);
};

export default ThemeContext;
