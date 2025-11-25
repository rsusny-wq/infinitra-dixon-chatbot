/**
 * HamburgerMenu Component
 * Automotive-specific navigation menu with ChatGPT-style sliding behavior
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export enum MenuSection {
  CHAT_HISTORY = 'chat_history',
  PAST_INVOICES = 'past_invoices',
  SERVICE_HISTORY = 'service_history',
  MY_VEHICLES = 'my_vehicles',
  PREFERRED_MECHANICS = 'preferred_mechanics',
  MAINTENANCE_REMINDERS = 'maintenance_reminders',
  SETTINGS = 'settings',
}

export interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: string;
  onSectionChange: (section: string) => void;
}

interface MenuItemData {
  id: MenuSection;
  title: string;
  icon: string;
  route?: string;
  content?: any[];
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  currentSection,
  onSectionChange,
}) => {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const menuItems: MenuItemData[] = [
    {
      id: MenuSection.CHAT_HISTORY,
      title: 'Chat History',
      icon: 'chatbubbles-outline',
      content: [
        { id: '1', title: 'Engine Diagnostic - Honda Civic', date: '2024-01-15', preview: 'Strange noise from engine...' },
        { id: '2', title: 'Brake Inspection - Toyota Camry', date: '2024-01-10', preview: 'Squeaking when braking...' },
        { id: '3', title: 'Oil Change - Ford F-150', date: '2024-01-05', preview: 'Due for oil change...' },
      ],
    },
    {
      id: MenuSection.PAST_INVOICES,
      title: 'Past Invoices',
      icon: 'receipt-outline',
      route: 'Invoices',
      content: [
        { id: '2024-001', amount: 450.00, date: '2024-01-15', service: 'Starter Motor Replacement' },
        { id: '2024-002', amount: 125.50, date: '2024-01-10', service: 'Brake Pad Replacement' },
        { id: '2023-089', amount: 75.00, date: '2023-12-20', service: 'Oil Change' },
      ],
    },
    {
      id: MenuSection.SERVICE_HISTORY,
      title: 'Service History',
      icon: 'construct-outline',
      route: 'ServiceHistory',
      content: [
        { id: '1', service: 'Oil Change', date: '2024-01-15', mileage: 45000, shop: 'AutoCare Plus' },
        { id: '2', service: 'Brake Service', date: '2023-12-10', mileage: 43500, shop: 'Brake Masters' },
        { id: '3', service: 'Tire Rotation', date: '2023-11-05', mileage: 42000, shop: 'Tire Pro' },
      ],
    },
    {
      id: MenuSection.MY_VEHICLES,
      title: 'My Vehicles',
      icon: 'car-outline',
      route: 'Vehicles',
      content: [
        { id: '1', make: 'Honda', model: 'Civic', year: 2020, vin: '1HGBH41JXMN109186', mileage: 45000 },
        { id: '2', make: 'Toyota', model: 'Camry', year: 2018, vin: '4T1BF1FK5JU123456', mileage: 62000 },
      ],
    },
    {
      id: MenuSection.PREFERRED_MECHANICS,
      title: 'Preferred Mechanics',
      icon: 'people-outline',
      route: 'Mechanics',
      content: [
        { id: '1', name: 'AutoCare Plus', rating: 4.8, reviews: 127, distance: '2.3 miles' },
        { id: '2', name: 'Brake Masters', rating: 4.6, reviews: 89, distance: '3.1 miles' },
        { id: '3', name: 'Engine Experts', rating: 4.9, reviews: 156, distance: '4.2 miles' },
      ],
    },
    {
      id: MenuSection.MAINTENANCE_REMINDERS,
      title: 'Maintenance Reminders',
      icon: 'alarm-outline',
      route: 'Reminders',
      content: [
        { id: '1', type: 'Oil Change', vehicle: '2020 Honda Civic', due: 'Due in 500 miles', urgency: 'medium' },
        { id: '2', type: 'Brake Inspection', vehicle: '2018 Toyota Camry', due: 'Due in 2 weeks', urgency: 'high' },
        { id: '3', type: 'Tire Rotation', vehicle: '2020 Honda Civic', due: 'Due in 1000 miles', urgency: 'low' },
      ],
    },
    {
      id: MenuSection.SETTINGS,
      title: 'Settings',
      icon: 'settings-outline',
      route: 'Settings',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web', // Disable for web to avoid warnings
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web', // Disable for web to avoid warnings
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.8,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web', // Disable for web to avoid warnings
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web', // Disable for web to avoid warnings
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, opacityAnim]);

  const handleSectionPress = (section: MenuSection, route?: string) => {
    onSectionChange(section);

    // Only navigate and close menu for sections that have dedicated screens
    if (route) {
      try {
        navigation.navigate(route as never);
        onClose(); // Close menu after navigation
      } catch (error) {
        console.warn('Navigation error:', error);
      }
    }
    // For sections without routes (like chat_history), keep menu open to show content
  };

  const renderSectionContent = (item: MenuItemData) => {
    if (!item.content || currentSection !== item.id) return null;

    switch (item.id) {
      case MenuSection.CHAT_HISTORY:
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionContentTitle}>Recent Conversations</Text>
            {item.content.map((chat: any) => (
              <TouchableOpacity key={chat.id} style={styles.contentItem}>
                <Text style={styles.contentItemTitle}>{chat.title}</Text>
                <Text style={styles.contentItemDate}>{chat.date}</Text>
                <Text style={styles.contentItemPreview}>{chat.preview}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case MenuSection.PAST_INVOICES:
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionContentTitle}>Recent Invoices</Text>
            {item.content.map((invoice: any) => (
              <TouchableOpacity key={invoice.id} style={styles.contentItem}>
                <View style={styles.invoiceHeader}>
                  <Text style={styles.contentItemTitle}>Invoice #{invoice.id}</Text>
                  <Text style={styles.invoiceAmount}>${invoice.amount.toFixed(2)}</Text>
                </View>
                <Text style={styles.contentItemDate}>{invoice.date}</Text>
                <Text style={styles.contentItemPreview}>{invoice.service}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case MenuSection.SERVICE_HISTORY:
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionContentTitle}>Service Records</Text>
            {item.content.map((service: any) => (
              <TouchableOpacity key={service.id} style={styles.contentItem}>
                <Text style={styles.contentItemTitle}>{service.service} - {service.date}</Text>
                <Text style={styles.contentItemPreview}>
                  {service.mileage.toLocaleString()} miles • {service.shop}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case MenuSection.MY_VEHICLES:
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionContentTitle}>Your Vehicles</Text>
            {item.content.map((vehicle: any) => (
              <TouchableOpacity key={vehicle.id} style={styles.contentItem}>
                <Text style={styles.contentItemTitle}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.contentItemPreview}>VIN: {vehicle.vin}</Text>
                <Text style={styles.contentItemPreview}>
                  {vehicle.mileage.toLocaleString()} miles
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case MenuSection.PREFERRED_MECHANICS:
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionContentTitle}>Preferred Mechanics</Text>
            {item.content.map((mechanic: any) => (
              <TouchableOpacity key={mechanic.id} style={styles.contentItem}>
                <Text style={styles.contentItemTitle}>{mechanic.name}</Text>
                <Text style={styles.contentItemPreview}>
                  {mechanic.rating} ⭐ ({mechanic.reviews} reviews)
                </Text>
                <Text style={styles.contentItemPreview}>{mechanic.distance}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case MenuSection.MAINTENANCE_REMINDERS:
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionContentTitle}>Upcoming Maintenance</Text>
            {item.content.map((reminder: any) => (
              <TouchableOpacity key={reminder.id} style={styles.contentItem}>
                <View style={styles.reminderHeader}>
                  <Text style={styles.contentItemTitle}>{reminder.type} Due</Text>
                  <View
                    style={[
                      styles.urgencyIndicator,
                      {
                        backgroundColor:
                          reminder.urgency === 'high' ? '#F44336' :
                            reminder.urgency === 'medium' ? '#FF9800' : '#4CAF50'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.contentItemPreview}>{reminder.vehicle}</Text>
                <Text style={styles.contentItemPreview}>{reminder.due}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          testID="menu-backdrop"
          activeOpacity={1}
          accessible={false}
        />

        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
          testID="hamburger-menu"
          accessible={true}
          accessibilityRole="menu"
          accessibilityLabel="Navigation menu"
        >
          <SafeAreaView style={styles.menuContent}>
            {/* Header */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Dixon Smart Repair</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
              {menuItems.map((item) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      currentSection === item.id && styles.activeMenuItem,
                    ]}
                    onPress={() => handleSectionPress(item.id, item.route)}
                    testID={`menu-section-${item.id}`}
                    accessibilityLabel={`${item.title}${item.route ? ' - Navigate to screen' : ' - Show content'}`}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: currentSection === item.id }}
                    accessibilityHint={item.route ? 'Double tap to navigate' : 'Double tap to view content'}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={currentSection === item.id ? '#007AFF' : '#666'}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        currentSection === item.id && styles.activeMenuItemText,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {/* Show indicator for sections with content vs navigation */}
                    {!item.route && (
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={currentSection === item.id ? '#007AFF' : '#999'}
                      />
                    )}
                    {item.route && (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#999"
                      />
                    )}
                  </TouchableOpacity>

                  {renderSectionContent(item)}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // flexDirection: 'row', // REMOVED: Causes layout issues with absolute positioning
    pointerEvents: 'box-none', // Allow touches to pass through to children
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto', // Ensure backdrop can receive touches
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: 'white',
    zIndex: 1000,
    // Use platform-specific shadow styling to avoid deprecation warnings
    ...(Platform.OS === 'web' ? {
      boxShadow: '2px 0px 3.84px rgba(0, 0, 0, 0.25)',
    } : {
      shadowColor: '#000',
      shadowOffset: {
        width: 2,
        height: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    }),
  },
  menuContent: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 56, // Ensure minimum touch target size
  },
  activeMenuItem: {
    backgroundColor: '#f0f8ff',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1, // Take up remaining space
  },
  activeMenuItemText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  sectionContent: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionContentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  contentItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  contentItemDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  contentItemPreview: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default HamburgerMenu;
