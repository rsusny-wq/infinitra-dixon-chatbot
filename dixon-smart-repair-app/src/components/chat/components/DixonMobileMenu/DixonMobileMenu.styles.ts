import { StyleSheet } from 'react-native';
import { DesignSystem, StyleMixins } from '../../../../styles/designSystem';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },

  backdrop: {
    flex: 0.15, // 15% visible chat area
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  menuContainer: {
    flex: 0.85, // 85% menu coverage
    backgroundColor: DesignSystem.colors.white,
  },

  // Header
  header: {
    height: DesignSystem.components.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
  },

  headerTitle: {
    ...StyleMixins.textStyles.h2,
    color: DesignSystem.colors.gray800,
  },

  closeButton: {
    width: DesignSystem.components.minTouchTarget,
    height: DesignSystem.components.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DesignSystem.borderRadius.md,
  },

  // New Chat Button
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary,
    marginHorizontal: DesignSystem.spacing.lg,
    marginVertical: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
  },

  newChatText: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.white,
    fontWeight: DesignSystem.typography.weights.medium,
    marginLeft: DesignSystem.spacing.sm,
  },

  // Menu Content
  menuContent: {
    flex: 1,
  },

  menuSection: {
    paddingVertical: DesignSystem.spacing.md,
  },

  sectionTitle: {
    ...StyleMixins.textStyles.caption,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.sm,
    color: DesignSystem.colors.gray500,
    textTransform: 'uppercase',
    fontSize: DesignSystem.typography.xs,
    fontWeight: DesignSystem.typography.weights.semibold,
    letterSpacing: 0.5,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    minHeight: DesignSystem.components.minTouchTarget,
  },

  menuItemIcon: {
    marginRight: DesignSystem.spacing.md,
  },

  menuItemText: {
    ...StyleMixins.textStyles.body,
    flex: 1,
    color: DesignSystem.colors.gray700,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray200,
    paddingVertical: DesignSystem.spacing.sm,
  },

  // User Section
  userSection: {
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
    marginBottom: DesignSystem.spacing.sm,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userAvatar: {
    marginRight: DesignSystem.spacing.md,
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.gray800,
    fontWeight: DesignSystem.typography.weights.medium,
    fontSize: DesignSystem.typography.sm,
  },

  userEmail: {
    ...StyleMixins.textStyles.caption,
    color: DesignSystem.colors.gray500,
    fontSize: DesignSystem.typography.xs,
    marginTop: 2,
  },

  // Sign In Button
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary,
    marginHorizontal: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
  },

  signInButtonText: {
    ...StyleMixins.textStyles.body,
    color: DesignSystem.colors.white,
    fontWeight: DesignSystem.typography.weights.medium,
    marginLeft: DesignSystem.spacing.sm,
    fontSize: DesignSystem.typography.sm,
  },
});
