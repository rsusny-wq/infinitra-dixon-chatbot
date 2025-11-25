import { StyleSheet, Platform } from 'react-native';
import { DesignSystem } from '../../../../styles/designSystem';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.white,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray200,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? DesignSystem.spacing.lg : DesignSystem.spacing.md,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.gray100, // Restored gray background box
    borderRadius: DesignSystem.borderRadius.xl, // Restored rounded corners
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    minHeight: 58, // Reduced from 64 to 58 (90% of 64)
  },

  textInput: {
    flex: 1,
    fontSize: 18,
    color: DesignSystem.colors.gray800,
    lineHeight: 22,
    minHeight: 40, // Reduced from 44 to 40 (90% of 44)
    maxHeight: 77, // Reduced from 86 to 77 (90% of 86)
    paddingVertical: 8,
    paddingHorizontal: 0, // Removed horizontal padding from text input
    textAlignVertical: 'center',
    marginHorizontal: DesignSystem.spacing.xs,
    includeFontPadding: false,
    backgroundColor: 'transparent', // Removed any background from text input
    borderWidth: 0, // Removed any border from text input
    outlineStyle: 'none', // Remove focus outline on web
  },

  textInputFocused: {
    // Remove any focus styling - keep it empty
    borderWidth: 0,
    outlineStyle: 'none',
  },

  textInputDisabled: {
    color: DesignSystem.colors.gray400,
    opacity: 0.7,
  },

  // Enhanced text input container styles
  textInputContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.white,
    borderRadius: DesignSystem.borderRadius.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    minHeight: 44,
  },

  textInputContainerFocused: {
    borderColor: DesignSystem.colors.primary,
    shadowColor: DesignSystem.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  textInputContainerWithImage: {
    paddingTop: DesignSystem.spacing.md,
  },

  // Inline image preview styles (inside text input)
  inlineImagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray100,
  },

  inlineImageWrapper: {
    position: 'relative',
    marginRight: DesignSystem.spacing.sm,
  },

  inlineImage: {
    width: 60,
    height: 40,
    borderRadius: DesignSystem.borderRadius.sm,
  },

  inlineRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: DesignSystem.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  inlineImageText: {
    fontSize: 12,
    color: DesignSystem.colors.gray600,
    fontWeight: '500',
  },

  textInputWithImage: {
    paddingTop: 0, // Remove top padding when image is present
  },

  // Legacy image preview styles (kept for compatibility)
  imagePreviewContainer: {
    backgroundColor: DesignSystem.colors.white,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray200,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.sm,
  },

  imagePreviewWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderRadius: DesignSystem.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: DesignSystem.colors.gray100,
  },

  imagePreview: {
    width: 240,
    height: 160,
    borderRadius: DesignSystem.borderRadius.md,
  },

  imagePreviewProcessing: {
    opacity: 0.7,
  },

  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: DesignSystem.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imagePreviewText: {
    fontSize: 12,
    color: DesignSystem.colors.gray600,
    marginTop: DesignSystem.spacing.xs,
    fontStyle: 'italic',
  },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: DesignSystem.spacing.sm,
  },

  actionButton: {
    width: 32, // Smaller to fit better
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.xs,
  },

  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendButtonActive: {
    backgroundColor: DesignSystem.colors.primary,
  },

  sendButtonDisabled: {
    backgroundColor: DesignSystem.colors.gray300,
  },

  // Options menu button (+ symbol)
  optionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.xs,
  },

  // Voice button specific styling
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  voiceButtonRecording: {
    backgroundColor: DesignSystem.colors.error + '20', // Light red background when recording
  },

  // Clear button for when there's text
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.xs,
  },
});
