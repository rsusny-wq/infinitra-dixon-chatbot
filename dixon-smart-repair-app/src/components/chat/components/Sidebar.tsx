import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../../styles/designSystem';

interface SidebarProps {
  onItemSelect: (item: string) => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onItemSelect,
  onNewChat,
}) => {
  const menuItems = [
    { id: 'history', label: 'Chat History', icon: 'time' },
    { id: 'vehicles', label: 'My Vehicles', icon: 'car' },
    { id: 'estimates', label: 'Cost Estimates', icon: 'calculator' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dixon AI</Text>
        <TouchableOpacity onPress={onNewChat} style={styles.newChatButton}>
          <Ionicons name="add" size={20} color={DesignSystem.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuItems}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => onItemSelect(item.id)}
          >
            <Ionicons name={item.icon as any} size={20} color={DesignSystem.colors.gray600} />
            <Text style={styles.menuItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = {
  container: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: DesignSystem.colors.gray50,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.gray200,
  },
  
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
  },
  
  headerTitle: {
    fontSize: DesignSystem.typography.lg,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  
  newChatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  menuItems: {
    paddingTop: DesignSystem.spacing.lg,
  },
  
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
  },
  
  menuItemText: {
    marginLeft: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.base,
    color: DesignSystem.colors.gray700,
  },
};

export default React.memo(Sidebar);
