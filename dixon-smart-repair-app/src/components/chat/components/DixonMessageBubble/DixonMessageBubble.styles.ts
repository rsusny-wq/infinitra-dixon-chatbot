import { StyleSheet, Platform } from 'react-native';
import { DesignSystem, StyleMixins } from '../../../../styles/designSystem';

export const styles = StyleSheet.create({
  // Message Wrapper
  messageWrapper: {
    marginVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    width: '100%', // Ensure full width for proper alignment
  },

  userMessageWrapper: {
    alignItems: 'flex-end',
  },

  assistantMessageWrapper: {
    alignItems: 'flex-start',
  },

  // Message Bubble - Fixed for proper text expansion
  messageBubble: {
    maxWidth: '85%', // Slightly wider for better text display
    minWidth: '20%', // Minimum width to prevent tiny bubbles
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    // Ensure proper flex behavior for text expansion
    flexShrink: 1,
    flexGrow: 0,
  },

  userMessageBubble: {
    backgroundColor: DesignSystem.colors.primary,
    borderBottomRightRadius: DesignSystem.borderRadius.sm,
  },

  assistantMessageBubble: {
    backgroundColor: DesignSystem.colors.white,
    borderBottomLeftRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    // Platform-specific shadow for better compatibility
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

  // Message Text - Fixed for proper line height and wrapping
  messageText: {
    fontSize: DesignSystem.typography.base,
    fontWeight: DesignSystem.typography.weights.normal,
    // Use a more conservative line height to prevent overlap
    lineHeight: Platform.OS === 'web' 
      ? DesignSystem.typography.base * 1.4  // 1.4x for web
      : DesignSystem.typography.base * 1.3, // 1.3x for mobile
    // Ensure proper text wrapping
    flexWrap: 'wrap',
    textAlign: 'left',
    // Prevent text from being squeezed
    flexShrink: 1,
    width: '100%',
  },

  userMessageText: {
    color: DesignSystem.colors.white,
  },

  assistantMessageText: {
    color: DesignSystem.colors.gray800,
  },

  // Timestamp - Fixed positioning
  messageTimestamp: {
    fontSize: DesignSystem.typography.xs,
    fontWeight: DesignSystem.typography.weights.normal,
    lineHeight: DesignSystem.typography.xs * 1.2,
    marginTop: DesignSystem.spacing.xs,
    opacity: 0.7,
  },

  userTimestamp: {
    color: DesignSystem.colors.gray400,
    textAlign: 'right',
    alignSelf: 'flex-end',
  },

  assistantTimestamp: {
    color: DesignSystem.colors.gray500,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
});
