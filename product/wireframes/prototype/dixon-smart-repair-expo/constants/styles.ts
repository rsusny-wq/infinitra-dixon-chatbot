import { Platform } from 'react-native'

// Cross-platform shadow utility
export const createShadow = (
  elevation: number = 2,
  shadowColor: string = '#000',
  shadowOpacity: number = 0.1,
  shadowRadius: number = 4,
  shadowOffsetHeight: number = 2
) => {
  if (Platform.OS === 'web') {
    // Use only boxShadow for web to avoid deprecation warnings
    return {
      boxShadow: `0px ${shadowOffsetHeight}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    }
  }
  
  // Use React Native shadow properties for mobile
  return {
    elevation,
    shadowColor,
    shadowOffset: { width: 0, height: shadowOffsetHeight },
    shadowOpacity,
    shadowRadius,
  }
}

// Common shadow presets
export const shadows = {
  small: createShadow(1, '#000', 0.05, 2, 1),
  medium: createShadow(2, '#000', 0.1, 4, 2),
  large: createShadow(4, '#000', 0.15, 8, 4),
  card: createShadow(2, '#000', 0.1, 4, 2),
  modal: createShadow(8, '#000', 0.25, 8, 4),
}
