/**
 * Dixon Smart Repair - Modern Design System
 * Consistent colors, typography, and spacing across all components
 */

export const DesignSystem = {
  // Color Palette - Classic Blue Theme
  colors: {
    // Primary Blues
    primary: '#2563eb',      // Main brand color
    primaryLight: '#3b82f6', // Hover states
    primaryDark: '#1d4ed8',  // Pressed states
    primaryBg: '#dbeafe',    // Light backgrounds
    
    // Success (keep touch of green for positive actions)
    success: '#059669',
    successLight: '#10b981',
    successBg: '#f0fdf4',
    
    // Grays
    gray50: '#f8f9fa',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    
    // Semantic Colors
    white: '#ffffff',
    black: '#000000',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  
  // Typography Scale
  typography: {
    // Font Sizes
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    
    // Font Weights
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    // Line Heights
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing Scale (based on 4px grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    xl: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    modal: '0 10px 25px rgba(0, 0, 0, 0.15)',
  },
  
  // Animation Durations
  animation: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  
  // Component Sizes
  components: {
    // Button Heights
    buttonHeight: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    
    // Input Heights
    inputHeight: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    
    // Icon Sizes
    iconSize: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
    },
    
    // Header Height
    headerHeight: 64,
    
    // Touch Targets (minimum 44px for accessibility)
    minTouchTarget: 44,
  },
};

// Helper function to create consistent styles
export const createStyles = (styles: any) => styles;

// Common style mixins
export const StyleMixins = {
  // Card style
  card: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: DesignSystem.borderRadius.lg,
    shadowColor: DesignSystem.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Button base
  buttonBase: {
    height: DesignSystem.components.buttonHeight.md,
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  
  // Input base
  inputBase: {
    height: DesignSystem.components.inputHeight.md,
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    fontSize: DesignSystem.typography.base,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
  },
  
  // Text styles
  textStyles: {
    h1: {
      fontSize: DesignSystem.typography['2xl'],
      fontWeight: DesignSystem.typography.weights.bold,
      color: DesignSystem.colors.gray800,
      lineHeight: DesignSystem.typography.lineHeights.tight,
    },
    h2: {
      fontSize: DesignSystem.typography.xl,
      fontWeight: DesignSystem.typography.weights.semibold,
      color: DesignSystem.colors.gray800,
      lineHeight: DesignSystem.typography.lineHeights.tight,
    },
    h3: {
      fontSize: DesignSystem.typography.lg,
      fontWeight: DesignSystem.typography.weights.semibold,
      color: DesignSystem.colors.gray700,
      lineHeight: DesignSystem.typography.lineHeights.normal,
    },
    body: {
      fontSize: DesignSystem.typography.base,
      fontWeight: DesignSystem.typography.weights.normal,
      color: DesignSystem.colors.gray600,
      lineHeight: DesignSystem.typography.lineHeights.normal,
    },
    caption: {
      fontSize: DesignSystem.typography.sm,
      fontWeight: DesignSystem.typography.weights.normal,
      color: DesignSystem.colors.gray500,
      lineHeight: DesignSystem.typography.lineHeights.normal,
    },
  },
};
