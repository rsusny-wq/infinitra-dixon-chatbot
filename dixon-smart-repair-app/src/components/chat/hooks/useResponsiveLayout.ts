import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

interface ResponsiveLayoutState {
  isDesktop: boolean;
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useResponsiveLayout = (): ResponsiveLayoutState => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const isDesktop = Platform.OS === 'web' && dimensions.width >= 768;
  const isMobile = !isDesktop;

  return {
    isDesktop,
    isMobile,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
  };
};
