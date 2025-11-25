import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import styles
import { styles } from './DixonMobileMenu.styles';
import { DesignSystem } from '../../../../styles/designSystem';

// Types
interface DixonMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelect: (item: string) => void;
  onNewChat: () => void;
  user?: any;
  isAuthenticated: boolean;
}

const DixonMobileMenu: React.FC<DixonMobileMenuProps> = ({
  isOpen,
  onClose,
  onItemSelect,
  onNewChat,
  user,
  isAuthenticated,
}) => {
  const menuItems = [
    { id: 'cost-estimates', label: 'Cost Estimates', icon: 'calculator' },
    { id: 'service-history', label: 'Service History', icon: 'time' },
    { id: 'shop-visits', label: 'Shop Visits', icon: 'location' },
    { id: 'vehicles', label: 'My Vehicles', icon: 'car' },
    { id: 'chat-history', label: 'Chat History', icon: 'chatbubbles' },
  ];

  const handleItemSelect = (item: string) => {
    onItemSelect(item);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Menu Content - Rendered first to appear on left */}
        <View style={styles.menuContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dixon Smart Repair</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={DesignSystem.components.iconSize.md}
                color={DesignSystem.colors.gray600}
              />
            </TouchableOpacity>
          </View>

          {/* New Chat Button */}
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add"
              size={DesignSystem.components.iconSize.md}
              color={DesignSystem.colors.white}
            />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>

          {/* Menu Items */}
          <ScrollView style={styles.menuContent}>
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>MAIN</Text>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleItemSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={DesignSystem.components.iconSize.md}
                    color={DesignSystem.colors.gray600}
                    style={styles.menuItemIcon}
                  />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conversations Section */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>CONVERSATIONS</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleItemSelect('chat-history')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chatbubbles"
                  size={DesignSystem.components.iconSize.md}
                  color={DesignSystem.colors.gray600}
                  style={styles.menuItemIcon}
                />
                <Text style={styles.menuItemText}>Chat History</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {/* Authentication Section */}
            {isAuthenticated ? (
              <>
                <View style={styles.userSection}>
                  <View style={styles.userInfo}>
                    <Ionicons
                      name="person-circle"
                      size={DesignSystem.components.iconSize.lg}
                      color={DesignSystem.colors.primary}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>
                        {user?.givenName}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemSelect('signout')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="log-out"
                    size={DesignSystem.components.iconSize.md}
                    color={DesignSystem.colors.gray600}
                    style={styles.menuItemIcon}
                  />
                  <Text style={styles.menuItemText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => handleItemSelect('signin')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="log-in"
                  size={DesignSystem.components.iconSize.md}
                  color={DesignSystem.colors.white}
                />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleItemSelect('settings')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="settings"
                size={DesignSystem.components.iconSize.md}
                color={DesignSystem.colors.gray600}
                style={styles.menuItemIcon}
              />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleItemSelect('help')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="help-circle"
                size={DesignSystem.components.iconSize.md}
                color={DesignSystem.colors.gray600}
                style={styles.menuItemIcon}
              />
              <Text style={styles.menuItemText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Backdrop - Rendered second to appear on right */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

export default React.memo(DixonMobileMenu);
