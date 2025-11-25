/**
 * Honeycomb Menu Item Component
 * Individual hexagonal menu item for expanded honeycomb state
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../styles/designSystem';
import { MenuItem } from './hooks/useMenuData';

interface HoneycombMenuItemProps {
  item: MenuItem;
  isActive: boolean;
  onPress: (item: MenuItem) => void;
  size?: number;
}

export const HoneycombMenuItem: React.FC<HoneycombMenuItemProps> = ({
  item,
  isActive,
  onPress,
  size = 80,
}) => {
  const hexagonPath = `M${size * 0.25},${size * 0.067} L${size * 0.75},${size * 0.067} L${size * 0.933},${size * 0.5} L${size * 0.75},${size * 0.933} L${size * 0.25},${size * 0.933} L${size * 0.067},${size * 0.5} Z`;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: size, height: size },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Hexagon Background */}
      <View style={[
        styles.hexagon,
        { width: size, height: size },
        isActive && styles.activeHexagon,
      ]}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.icon as any}
            size={24}
            color={isActive ? DesignSystem.colors.white : DesignSystem.colors.primary}
          />
        </View>
        
        {/* Title */}
        <Text style={[
          styles.title,
          isActive && styles.activeTitle,
        ]} 
        numberOfLines={2}
        adjustsFontSizeToFit={true} // Allow text to shrink if needed
        minimumFontScale={0.8} // Don't shrink below 80% of original size
        >
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: DesignSystem.spacing.xs,
  },
  hexagon: {
    backgroundColor: DesignSystem.colors.primaryBg,
    borderRadius: DesignSystem.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSystem.spacing.sm, // Increased from xs to sm for more text space
    paddingVertical: DesignSystem.spacing.sm,
    shadowColor: DesignSystem.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Hexagon shape approximation using border radius
    transform: [{ rotate: '0deg' }],
    // Ensure container can accommodate text properly
    minHeight: 80, // Minimum height to prevent text cutoff
  },
  activeHexagon: {
    backgroundColor: DesignSystem.colors.primary,
    shadowColor: DesignSystem.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    marginBottom: DesignSystem.spacing.xs, // Keep small margin to maximize text space
    flexShrink: 0, // Prevent icon from shrinking
  },
  title: {
    fontSize: DesignSystem.typography.sm, // Increased from xs (12px) to sm (14px)
    fontWeight: '500' as any,
    color: DesignSystem.colors.primary,
    textAlign: 'center',
    lineHeight: DesignSystem.typography.sm * 1.1, // Tighter line height for better fit
    // Ensure text doesn't overflow
    flexShrink: 1,
    width: '100%',
    paddingHorizontal: 2, // Small horizontal padding to prevent edge cutoff
  },
  activeTitle: {
    color: DesignSystem.colors.white,
    fontWeight: '600' as any,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: DesignSystem.colors.error,
    borderRadius: DesignSystem.borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  activeBadge: {
    backgroundColor: DesignSystem.colors.white,
  },
  badgeText: {
    fontSize: DesignSystem.typography.xs - 2,
    fontWeight: '700' as any,
    color: DesignSystem.colors.white,
  },
  activeBadgeText: {
    color: DesignSystem.colors.primary,
  },
});
