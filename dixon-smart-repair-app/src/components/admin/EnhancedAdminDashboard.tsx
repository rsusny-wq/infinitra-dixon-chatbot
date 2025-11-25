/**
 * Enhanced Admin Dashboard - Shop Owner Interface with Mechanic View
 * Allows admin to see both admin functions and mechanic operations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthService, { AutomotiveUser } from '../../services/AuthService';

// Import both dashboards
import AdminDashboard from './AdminDashboard';
import MechanicDashboard from '../mechanic-dashboard';

type ViewMode = 'admin' | 'mechanic';

const EnhancedAdminDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AutomotiveUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('admin');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Get current user and verify admin role
      const user = await AuthService.getCurrentUser();
      if (!user || user.role !== 'admin') {
        Alert.alert('Access Denied', 'Only shop owners can access this interface');
        return;
      }
      
      setCurrentUser(user);
      
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOutUser();
      // In a real app, this would navigate back to login
      Alert.alert('Logged Out', 'You have been logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="shield-outline" size={48} color="#FF4444" />
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>Only shop owners can access this interface</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with View Toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.userInfo}>
            <Ionicons name="business" size={24} color="#007AFF" />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{currentUser.givenName} {currentUser.familyName}</Text>
              <Text style={styles.userRole}>Shop Owner • {currentUser.shopName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* View Mode Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'admin' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('admin')}
            >
              <Ionicons 
                name="settings" 
                size={16} 
                color={viewMode === 'admin' ? '#007AFF' : '#666'} 
              />
              <Text style={[
                styles.toggleText,
                viewMode === 'admin' && styles.toggleTextActive
              ]}>
                Admin View
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'mechanic' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('mechanic')}
            >
              <Ionicons 
                name="construct" 
                size={16} 
                color={viewMode === 'mechanic' ? '#007AFF' : '#666'} 
              />
              <Text style={[
                styles.toggleText,
                viewMode === 'mechanic' && styles.toggleTextActive
              ]}>
                Mechanic View
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Mode Indicator */}
      <View style={styles.viewIndicator}>
        <View style={[
          styles.indicatorBadge,
          viewMode === 'admin' ? styles.adminBadge : styles.mechanicBadge
        ]}>
          <Ionicons 
            name={viewMode === 'admin' ? 'shield-checkmark' : 'construct'} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.indicatorText}>
            {viewMode === 'admin' ? 'Admin Mode' : 'Mechanic Mode'}
          </Text>
        </View>
        <Text style={styles.indicatorSubtext}>
          {viewMode === 'admin' 
            ? 'Manage mechanics and shop settings'
            : 'View operations as mechanics see them'
          }
        </Text>
      </View>

      {/* Dynamic Content Based on View Mode */}
      <View style={styles.content}>
        {viewMode === 'admin' ? (
          <AdminDashboard />
        ) : (
          <View style={styles.mechanicViewWrapper}>
            {/* Optional: Add admin context bar */}
            <View style={styles.adminContextBar}>
              <Ionicons name="eye" size={16} color="#007AFF" />
              <Text style={styles.adminContextText}>
                Viewing as mechanics see it - All mechanic functions available
              </Text>
            </View>
            <MechanicDashboard />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  toggleTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 6,
  },
  viewIndicator: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  indicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 4,
  },
  adminBadge: {
    backgroundColor: '#059669',
  },
  mechanicBadge: {
    backgroundColor: '#ea580c',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  indicatorSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  mechanicViewWrapper: {
    flex: 1,
  },
  adminContextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  adminContextText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },
});

export default EnhancedAdminDashboard;
