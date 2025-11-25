/**
 * Collapsed Menu Item Component
 * Shows contextual icons when honeycomb menu is collapsed
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../styles/designSystem';
import { MenuItem } from './hooks/useMenuData';

interface CollapsedMenuItemProps {
  item: MenuItem;
  isActive: boolean;
  onPress: (item: MenuItem) => void;
}

export const CollapsedMenuItem: React.FC<CollapsedMenuItemProps> = ({
  item,
  isActive,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && styles.activeContainer,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        isActive && styles.activeIconContainer,
      ]}>
        <Ionicons
          name={item.contextIcon as any}
          size={20}
          color={isActive ? DesignSystem.colors.white : DesignSystem.colors.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    marginVertical: DesignSystem.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContainer: {
    // Active state styling handled by iconContainer
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: DesignSystem.borderRadius.lg,
    backgroundColor: DesignSystem.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DesignSystem.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeIconContainer: {
    backgroundColor: DesignSystem.colors.primary,
    shadowColor: DesignSystem.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
