/**
 * Admin Dashboard - Shop Owner Interface
 * Allows admin to create and manage mechanic accounts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthService, { AutomotiveUser } from '../../services/AuthService';
import { AdminService, MechanicRecord } from '../../services/AdminService';

const AdminDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AutomotiveUser | null>(null);
  const [mechanics, setMechanics] = useState<MechanicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create mechanic form state
  const [newMechanic, setNewMechanic] = useState({
    email: '',
    givenName: '',
    familyName: '',
    phoneNumber: '',
    temporaryPassword: '',
  });
  const [creating, setCreating] = useState(false);

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
      
      // Load existing mechanics from backend
      await loadMechanicsList();
      
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadMechanicsList = async () => {
    try {
      console.log('📋 Loading mechanics list...');
      
      const result = await AdminService.getShopMechanics();
      
      if (result.success && result.data) {
        console.log('✅ Loaded mechanics:', result.count || 0);
        setMechanics(result.data);
      } else {
        console.error('Failed to load mechanics:', result.error);
        setMechanics([]);
        
        // Show alert for authentication errors
        if (result.error?.includes('Authentication expired') || result.error?.includes('Not Authorized')) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log out and log back in.',
            [
              {
                text: 'Log Out',
                onPress: async () => {
                  try {
                    await AuthService.signOutUser();
                    // Force page reload to clear state
                    window.location.reload();
                  } catch (error) {
                    console.error('Error logging out:', error);
                  }
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      }
      
    } catch (error) {
      console.error('Error loading mechanics list:', error);
      setMechanics([]);
    }
  };

  const generateTemporaryPassword = () => {
    // Generate a simple temporary password
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + '!'; // Add special character for Cognito requirements
  };

  const handleCreateMechanic = async () => {
    // Validate form
    if (!newMechanic.email || !newMechanic.givenName || !newMechanic.familyName) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Generate temporary password if not provided
    const tempPassword = newMechanic.temporaryPassword || generateTemporaryPassword();

    try {
      setCreating(true);
      
      const result = await AdminService.createMechanicAccount({
        email: newMechanic.email.trim(),
        givenName: newMechanic.givenName.trim(),
        familyName: newMechanic.familyName.trim(),
        phoneNumber: newMechanic.phoneNumber.trim() || undefined,
        temporaryPassword: tempPassword,
        specialties: [], // Could be added to form later
      });

      if (result.success && result.mechanicRecord) {
        // Add the new mechanic to the local list
        setMechanics(prev => [...prev, result.mechanicRecord!]);

        Alert.alert(
          'Mechanic Account Created Successfully! ✅',
          `${newMechanic.givenName} can sign in immediately with:\n\n📧 Email: ${newMechanic.email}\n🔑 Password: ${tempPassword}\n\n✨ No email verification required!\n\n💡 They should change this password after first login for security.`,
          [
            {
              text: 'Copy Credentials',
              onPress: () => {
                // In a real app, you might copy to clipboard here
                console.log('Credentials:', { email: newMechanic.email, password: tempPassword });
              },
            },
            {
              text: 'Done',
              style: 'default',
              onPress: () => {
                // Reset form
                setNewMechanic({
                  email: '',
                  givenName: '',
                  familyName: '',
                  phoneNumber: '',
                  temporaryPassword: '',
                });
                setShowCreateForm(false);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error Creating Mechanic', result.error || 'Failed to create mechanic account');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create mechanic account');
    } finally {
      setCreating(false);
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
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Shop Owner Dashboard</Text>
          <Text style={styles.subtitle}>{currentUser.shopName}</Text>
        </View>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={32} color="#007AFF" />
          <Text style={styles.userName}>{currentUser.givenName}</Text>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={async () => {
              try {
                await AuthService.signOutUser();
                window.location.reload();
              } catch (error) {
                console.error('Error logging out:', error);
              }
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mechanics.length}</Text>
          <Text style={styles.statLabel}>Total Mechanics</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mechanics.filter(m => m.isActive).length}</Text>
          <Text style={styles.statLabel}>Active Mechanics</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </View>
      </View>

      {/* Mechanics Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mechanics Management</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateForm(!showCreateForm)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Mechanic</Text>
          </TouchableOpacity>
        </View>

        {/* Create Mechanic Form */}
        {showCreateForm && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Create New Mechanic Account</Text>
            
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newMechanic.givenName}
                  onChangeText={(text) => setNewMechanic(prev => ({ ...prev, givenName: text }))}
                  placeholder="Enter first name"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newMechanic.familyName}
                  onChangeText={(text) => setNewMechanic(prev => ({ ...prev, familyName: text }))}
                  placeholder="Enter last name"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={newMechanic.email}
                onChangeText={(text) => setNewMechanic(prev => ({ ...prev, email: text }))}
                placeholder="mechanic@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={newMechanic.phoneNumber}
                onChangeText={(text) => setNewMechanic(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Temporary Password</Text>
              <TextInput
                style={styles.input}
                value={newMechanic.temporaryPassword}
                onChangeText={(text) => setNewMechanic(prev => ({ ...prev, temporaryPassword: text }))}
                placeholder="Leave empty to auto-generate"
                secureTextEntry
              />
              <Text style={styles.helpText}>
                If empty, a secure password will be generated automatically
              </Text>
            </View>

            {/* Info about admin-created accounts */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Admin-created accounts can sign in immediately without email verification.
              </Text>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, creating && styles.createButtonDisabled]}
                onPress={handleCreateMechanic}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={16} color="#fff" />
                    <Text style={styles.createButtonText}>Create Mechanic</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mechanics List */}
        <View style={styles.mechanicsList}>
          {mechanics.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No Mechanics Yet</Text>
              <Text style={styles.emptyText}>
                Create your first mechanic account to get started with workflow management
              </Text>
            </View>
          ) : (
            mechanics.map((mechanic) => (
              <View key={mechanic.mechanicId} style={styles.mechanicCard}>
                <View style={styles.mechanicInfo}>
                  <Text style={styles.mechanicName}>
                    {mechanic.displayName}
                  </Text>
                  <Text style={styles.mechanicEmail}>{mechanic.email}</Text>
                  {mechanic.phoneNumber && (
                    <Text style={styles.mechanicPhone}>{mechanic.phoneNumber}</Text>
                  )}
                  <Text style={styles.mechanicStats}>
                    {mechanic.totalRequestsHandled} requests • {mechanic.lastActivityText}
                  </Text>
                </View>
                <View style={styles.mechanicStatus}>
                  <View style={[styles.statusBadge, mechanic.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={styles.statusText}>
                      {mechanic.status.charAt(0).toUpperCase() + mechanic.status.slice(1)}
                    </Text>
                  </View>
                  {mechanic.averageRating > 0 && (
                    <Text style={styles.mechanicRating}>
                      ⭐ {mechanic.averageRating.toFixed(1)}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  createForm: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mechanicsList: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  mechanicCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  mechanicInfo: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mechanicEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mechanicPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mechanicStats: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  mechanicStatus: {
    alignItems: 'flex-end',
  },
  mechanicRating: {
    fontSize: 12,
    color: '#f39c12',
    marginTop: 4,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#d4edda',
  },
  inactiveBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AdminDashboard;
