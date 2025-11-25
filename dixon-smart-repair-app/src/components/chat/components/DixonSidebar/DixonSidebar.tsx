import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import styles
import { styles } from './DixonSidebar.styles';
import { DesignSystem } from '../../../../styles/designSystem';

// Types
interface DixonSidebarProps {
  onItemSelect: (item: string) => void;
  onNewChat: () => void;
  user?: any;
  isAuthenticated: boolean;
}

const DixonSidebar: React.FC<DixonSidebarProps> = ({
  onItemSelect,
  onNewChat,
  user,
  isAuthenticated,
}) => {
  const menuItems = [
    { id: 'cost-estimates', label: 'Cost Estimates', icon: 'calculator' },
    { id: 'labour-estimates', label: 'Labour Estimates', icon: 'construct' },
    { id: 'service-history', label: 'Service History', icon: 'time' },
    { id: 'shop-visits', label: 'Shop Visits', icon: 'location' },
    { id: 'vehicles', label: 'My Vehicles', icon: 'car' },
    { id: 'chat-history', label: 'Chat History', icon: 'chatbubbles' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dixon Smart Repair</Text>
      </View>

      {/* New Chat Button */}
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={onNewChat}
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
      <ScrollView style={styles.menuContainer}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>MAIN</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => onItemSelect(item.id)}
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
              onPress={() => onItemSelect('signout')}
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
            onPress={() => onItemSelect('signin')}
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
          onPress={() => onItemSelect('settings')}
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
          onPress={() => onItemSelect('help')}
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
  );
};

export default React.memo(DixonSidebar);
