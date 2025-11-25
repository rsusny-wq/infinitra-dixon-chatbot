import { useState, useEffect } from 'react';
import { useWindowDimensions, Platform } from 'react-native';

// Breakpoints following 2025 responsive design standards
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
} as const;

interface ResponsiveLayout {
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  platform: typeof Platform.OS;
}

export const useResponsiveLayout = (): ResponsiveLayout => {
  const { width, height } = useWindowDimensions();
  
  const [layout, setLayout] = useState<ResponsiveLayout>(() => ({
    screenWidth: width,
    screenHeight: height,
    isMobile: width < BREAKPOINTS.mobile,
    isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
    isDesktop: width >= BREAKPOINTS.desktop,
    orientation: width > height ? 'landscape' : 'portrait',
    platform: Platform.OS,
  }));

  useEffect(() => {
    const newLayout: ResponsiveLayout = {
      screenWidth: width,
      screenHeight: height,
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
      isDesktop: width >= BREAKPOINTS.desktop,
      orientation: width > height ? 'landscape' : 'portrait',
      platform: Platform.OS,
    };

    setLayout(newLayout);
  }, [width, height]);

  return layout;
};
