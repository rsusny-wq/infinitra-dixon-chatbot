import { StyleSheet, Platform } from 'react-native';
import { DesignSystem, StyleMixins } from '../../../../styles/designSystem';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.gray50,
    position: 'relative',
  },

  // Header (mobile only)
  header: {
    height: DesignSystem.components.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
    zIndex: 10,
    flexShrink: 0,
  },

  menuButton: {
    width: DesignSystem.components.minTouchTarget,
    height: DesignSystem.components.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DesignSystem.borderRadius.md,
  },

  headerTitle: {
    ...StyleMixins.textStyles.h2,
    flex: 1,
    textAlign: 'center',
    color: DesignSystem.colors.gray800,
  },

  headerSpacer: {
    width: DesignSystem.components.minTouchTarget,
  },

  // Communication Mode Indicator
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.gray100,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.full,
    marginRight: DesignSystem.spacing.sm,
  },

  modeText: {
    fontSize: DesignSystem.typography.xs,
    fontWeight: DesignSystem.typography.weights.semibold,
    marginLeft: DesignSystem.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Messages - Optimized for FlatList with web constraints
  messagesContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.gray50,
    // Critical for web: prevent FlatList from expanding beyond container
    ...(Platform.OS === 'web' && {
      height: '100%',
      maxHeight: '100%',
      overflow: 'auto',
    }),
  },

  messagesContent: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.xl,
    // For FlatList, we don't need flexGrow on native
    // But for web, we need to ensure proper sizing
    ...(Platform.OS === 'web' ? {
      minHeight: '100%',
      flexGrow: 1,
    } : {
      minHeight: '100%',
    }),
  },

  // Welcome message
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.spacing['4xl'],
    paddingHorizontal: DesignSystem.spacing.lg,
    minHeight: 400, // Ensure adequate height for welcome message
  },

  welcomeBubble: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: DesignSystem.borderRadius.lg,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    maxWidth: '90%',
    alignItems: 'center',
    // Platform-specific shadow
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: DesignSystem.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
  },

  welcomeText: {
    fontSize: DesignSystem.typography.lg,
    fontWeight: DesignSystem.typography.weights.medium,
    color: DesignSystem.colors.gray800,
    textAlign: 'center',
    lineHeight: DesignSystem.typography.lg * 1.4,
    marginBottom: DesignSystem.spacing.sm,
  },

  welcomeSubtext: {
    fontSize: DesignSystem.typography.sm,
    fontWeight: DesignSystem.typography.weights.normal,
    color: DesignSystem.colors.gray600,
    textAlign: 'center',
    lineHeight: DesignSystem.typography.sm * 1.4,
  },

  // Loading - Footer component for FlatList
  loadingContainer: {
    alignItems: 'flex-start',
    marginVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.lg, // Extra padding for footer
  },

  loadingBubble: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: DesignSystem.borderRadius.lg,
    borderBottomLeftRadius: DesignSystem.borderRadius.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    // Platform-specific shadow
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: DesignSystem.colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    }),
  },

  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.sm,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DesignSystem.colors.gray400,
    marginHorizontal: 1,
  },

  dot1: {
    // Animation will be added later
  },

  dot2: {
    // Animation will be added later
  },

  dot3: {
    // Animation will be added later
  },

  loadingText: {
    fontSize: DesignSystem.typography.sm,
    fontWeight: DesignSystem.typography.weights.normal,
    color: DesignSystem.colors.gray500,
    fontStyle: 'italic',
    lineHeight: DesignSystem.typography.sm * 1.3,
  },

  // Scroll to bottom button - Fixed positioning
  scrollToBottomButton: {
    position: 'absolute',
    bottom: DesignSystem.spacing.xl,
    right: DesignSystem.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    // Platform-specific shadow
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    } : {
      shadowColor: DesignSystem.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    }),
  },
});
