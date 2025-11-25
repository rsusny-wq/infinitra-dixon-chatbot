import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../../styles/designSystem';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelect: (item: string) => void;
  onNewChat: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onItemSelect,
  onNewChat,
}) => {
  const menuItems = [
    { id: 'history', label: 'Chat History', icon: 'time' },
    { id: 'vehicles', label: 'My Vehicles', icon: 'car' },
    { id: 'estimates', label: 'Cost Estimates', icon: 'calculator' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const handleItemPress = (itemId: string) => {
    onItemSelect(itemId);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.menuContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dixon AI</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
                <Ionicons name="add" size={20} color={DesignSystem.colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={DesignSystem.colors.gray600} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleItemPress(item.id)}
              >
                <Ionicons name={item.icon as any} size={20} color={DesignSystem.colors.gray600} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  backdrop: {
    flex: 0.3, // 30% of screen for backdrop
  },
  
  menuContainer: {
    flex: 0.7, // 70% of screen for menu
    backgroundColor: DesignSystem.colors.white,
    borderTopLeftRadius: DesignSystem.borderRadius.xl,
    borderTopRightRadius: DesignSystem.borderRadius.xl,
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
  
  headerButtons: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  
  newChatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: DesignSystem.spacing.sm,
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    paddingVertical: DesignSystem.spacing.lg,
  },
  
  menuItemText: {
    marginLeft: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.base,
    color: DesignSystem.colors.gray700,
  },
};

export default React.memo(MobileMenu);
