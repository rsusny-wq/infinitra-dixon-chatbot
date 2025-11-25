import { StyleSheet, Dimensions } from 'react-native';
import { DesignSystem, StyleMixins } from '../../../../styles/designSystem';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
  },

  modalContainer: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: DesignSystem.borderRadius.lg,
    width: '100%',
    maxWidth: 450, // Increased width
    maxHeight: screenHeight * 0.95, // Increased height
    minHeight: 600, // Added minimum height
    shadowColor: DesignSystem.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
    backgroundColor: DesignSystem.colors.white,
  },

  headerTitle: {
    ...StyleMixins.textStyles.h2,
    color: DesignSystem.colors.gray800,
    fontSize: DesignSystem.typography.lg,
    fontWeight: DesignSystem.typography.weights.semibold,
  },

  closeButton: {
    width: DesignSystem.components.minTouchTarget,
    height: DesignSystem.components.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DesignSystem.borderRadius.md,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing['2xl'], // Increased padding
    backgroundColor: DesignSystem.colors.white,
  },

  // Welcome Section
  welcomeSection: {
    paddingVertical: DesignSystem.spacing['3xl'], // Increased padding
    paddingHorizontal: DesignSystem.spacing.lg, // Increased horizontal padding
    alignItems: 'center',
    minHeight: 120, // Added minimum height
  },

  welcomeTitle: {
    ...StyleMixins.textStyles.h2,
    color: DesignSystem.colors.gray800,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg, // Increased margin
    fontSize: DesignSystem.typography['2xl'], // Larger font
    fontWeight: DesignSystem.typography.weights.bold,
    lineHeight: 32, // Explicit line height
  },

  welcomeSubtitle: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.gray600,
    textAlign: 'center',
    lineHeight: 24, // Explicit line height
    fontSize: DesignSystem.typography.lg, // Larger font
    paddingHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm, // Added top margin
  },

  // Error
  errorContainer: {
    backgroundColor: DesignSystem.colors.error + '10',
    borderWidth: 1,
    borderColor: DesignSystem.colors.error + '30',
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.lg, // Increased padding
    marginBottom: DesignSystem.spacing.xl, // Increased margin
    marginHorizontal: DesignSystem.spacing.sm, // Added horizontal margin
  },

  errorText: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.error,
    textAlign: 'center',
    fontSize: DesignSystem.typography.base, // Increased font size
    lineHeight: 20, // Explicit line height
  },

  // Form
  formContainer: {
    marginBottom: DesignSystem.spacing['2xl'], // Increased margin
    paddingHorizontal: DesignSystem.spacing.sm, // Added padding
  },

  nameRow: {
    flexDirection: 'row',
    marginBottom: DesignSystem.spacing.lg,
  },

  inputContainer: {
    marginBottom: DesignSystem.spacing['2xl'], // Increased margin
  },

  inputLabel: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.gray700,
    fontWeight: DesignSystem.typography.weights.medium,
    marginBottom: DesignSystem.spacing.md, // Increased margin
    fontSize: DesignSystem.typography.base, // Increased font size
  },

  textInput: {
    ...StyleMixins.inputBase,
    backgroundColor: DesignSystem.colors.gray50,
    borderColor: DesignSystem.colors.gray200,
    color: DesignSystem.colors.gray800,
    fontSize: DesignSystem.typography.base, // Increased font size
    paddingVertical: DesignSystem.spacing.lg, // Increased padding
  },

  helpText: {
    ...StyleMixins.textStyles.caption,
    color: DesignSystem.colors.gray500,
    fontSize: DesignSystem.typography.xs,
    marginTop: DesignSystem.spacing.xs,
    fontStyle: 'italic',
  },

  // Action Button
  actionButton: {
    ...StyleMixins.buttonBase,
    backgroundColor: DesignSystem.colors.primary,
    marginBottom: DesignSystem.spacing.lg,
  },

  actionButtonDisabled: {
    backgroundColor: DesignSystem.colors.gray300,
  },

  actionButtonText: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.white,
    fontWeight: DesignSystem.typography.weights.semibold,
  },

  // Forgot Password
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },

  forgotPasswordText: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.primary,
    fontSize: DesignSystem.typography.sm,
    fontWeight: DesignSystem.typography.weights.medium,
    textDecorationLine: 'underline',
  },

  // Link Container (for multiple links)
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },

  linkButton: {
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
  },

  linkText: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.primary,
    fontSize: DesignSystem.typography.sm,
    fontWeight: DesignSystem.typography.weights.medium,
    textDecorationLine: 'underline',
  },

  // Switch Mode
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: DesignSystem.spacing.xl,
  },

  switchModeText: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.gray600,
    fontSize: DesignSystem.typography.sm,
  },

  switchModeLink: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.primary,
    fontWeight: DesignSystem.typography.weights.medium,
    fontSize: DesignSystem.typography.sm,
  },
});
