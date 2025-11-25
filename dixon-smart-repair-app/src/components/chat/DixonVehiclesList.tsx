import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/api';
import { AutomotiveUser } from '../../services/AuthService';
import { useSessionStore, VehicleInfo } from '../../stores/sessionStore';
import { GET_USER_VEHICLES_QUERY } from '../../services/GraphQLService';
import { DesignSystem } from '../../styles/designSystem';

const client = generateClient();

interface DixonVehiclesListProps {
  currentUser: AutomotiveUser | null;
  onBackToChat: () => void;
  onVehicleSelect: (vehicle: VehicleInfo) => void;
}

export const DixonVehiclesList: React.FC<DixonVehiclesListProps> = ({ 
  currentUser, 
  onBackToChat,
  onVehicleSelect
}) => {
  const {
    vehicles,
    userProfile,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    selectVehicle,
    setUserProfile
  } = useSessionStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states (from VehicleLibrary)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    trim: '',
    vin: '',
    nickname: ''
  });

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: '',
      trim: '',
      vin: '',
      nickname: ''
    });
  };

  const fetchUserVehicles = async () => {
    if (!currentUser?.userId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🚗 Loading vehicles for user:', currentUser.userId);
      
      // Fetch vehicles from database via GraphQL
      const response = await client.graphql({
        query: GET_USER_VEHICLES_QUERY,
        variables: { userId: currentUser.userId }
      });

      if (response.errors && response.errors.length > 0) {
        console.error('❌ GraphQL errors loading vehicles:', response.errors);
        throw new Error(response.errors[0].message);
      }

      const vehiclesData = response.data?.getUserVehicles || [];
      console.log('🚗 Loaded vehicles from database:', vehiclesData);

      // Convert database format to frontend format and update store
      const convertedVehicles: VehicleInfo[] = vehiclesData.map((vehicle: any) => ({
        id: vehicle.vehicleId || vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: parseInt(vehicle.year),
        trim: vehicle.trim || '',
        vin: vehicle.vin || '',
        nickname: vehicle.nickname || '',
        lastUsed: new Date(vehicle.lastUsed || vehicle.updatedAt),
        usageCount: 0, // Not tracked in database yet
        verified: !!vehicle.vin // Consider verified if has VIN
      }));

      // Update the store with fetched vehicles
      // Clear existing vehicles and add fetched ones
      convertedVehicles.forEach(vehicle => {
        addVehicle(vehicle);
      });

      console.log('🚗 Updated store with vehicles:', convertedVehicles.length);
      
    } catch (err) {
      console.error('❌ Error loading user vehicles:', err);
      // Don't throw - just log and continue with empty vehicles
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserVehicles();
  }, [currentUser?.userId]);

  // Initialize user profile if not set but currentUser exists
  useEffect(() => {
    if (currentUser && (!userProfile || !userProfile.isAuthenticated)) {
      console.log('🚗 Setting user profile for authenticated user');
      setUserProfile({
        userId: currentUser.userId,
        email: currentUser.email,
        isAuthenticated: true,
        sessionCount: 0,
        vehicleCount: vehicles.length,
        lastLogin: new Date()
      });
    }
  }, [currentUser, userProfile, setUserProfile, vehicles.length]);

  // Debug logging to see current vehicles
  useEffect(() => {
    console.log('🚗 Current vehicles in store:', vehicles);
    console.log('🚗 Vehicles count:', vehicles.length);
    console.log('🚗 User profile:', userProfile);
    console.log('🚗 User authenticated?', userProfile?.isAuthenticated);
    console.log('🚗 Current user from props:', currentUser);
  }, [vehicles, userProfile, currentUser]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserVehicles();
  };

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'Never used';
    
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      return 'Never used';
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Never used';
    }
  };

  const handleVehiclePress = (vehicle: VehicleInfo) => {
    selectVehicle(vehicle.id);
    onVehicleSelect(vehicle);
  };

  const handleDeleteVehicle = (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicleName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteVehicle(vehicleId);
          },
        },
      ]
    );
  };

  const getVehicleDisplayName = (vehicle: VehicleInfo) => {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  };

  // Modal handlers (from VehicleLibrary)
  const handleAddVehicle = () => {
    console.log('🚗 handleAddVehicle called with formData:', formData);
    
    if (!formData.make || !formData.model || !formData.year) {
      console.log('🚗 Validation failed - missing required fields');
      Alert.alert('Error', 'Please fill in Make, Model, and Year');
      return;
    }

    console.log('🚗 Attempting to add vehicle...');
    const vehicleId = addVehicle({
      make: formData.make,
      model: formData.model,
      year: formData.year,
      trim: formData.trim,
      vin: formData.vin,
      isActive: true,
      createdAt: new Date()
    });

    console.log('🚗 addVehicle returned:', vehicleId);
    
    if (vehicleId) {
      console.log('🚗 Vehicle added successfully');
      Alert.alert('Success', 'Vehicle added successfully');
      resetForm();
      setShowAddModal(false);
    } else {
      console.log('🚗 Failed to add vehicle');
      Alert.alert('Error', 'Failed to add vehicle. Maximum 10 vehicles allowed.');
    }
  };

  const handleEditVehicle = (vehicle: VehicleInfo) => {
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim || '',
      vin: vehicle.vin || '',
      nickname: ''
    });
    setEditingVehicleId(vehicle.id);
    setShowAddModal(true);
  };

  const handleUpdateVehicle = () => {
    if (!formData.make || !formData.model || !formData.year) {
      Alert.alert('Error', 'Please fill in Make, Model, and Year');
      return;
    }

    if (editingVehicleId) {
      updateVehicle(editingVehicleId, {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        trim: formData.trim,
        vin: formData.vin
      });
      
      Alert.alert('Success', 'Vehicle updated successfully');
      resetForm();
      setEditingVehicleId(null);
      setShowAddModal(false);
    }
  };

  // Add some sample vehicles if none exist (for testing)
  useEffect(() => {
    console.log('🚗 Sample vehicle effect running...');
    console.log('🚗 Current vehicles count:', vehicles.length);
    console.log('🚗 Current user ID:', currentUser?.userId);
    
    if (vehicles.length === 0 && currentUser?.userId) {
      console.log('🚗 Adding sample vehicles...');
      
      // Add sample vehicles for testing
      const vehicle1Id = addVehicle({
        make: 'Honda',
        model: 'Civic',
        year: '2020',
        trim: 'LX',
        vin: '1HGBH41JXMN109186',
        isActive: true,
        createdAt: new Date('2025-07-25T10:00:00.000Z')
      });
      console.log('🚗 Added vehicle 1:', vehicle1Id);
      
      const vehicle2Id = addVehicle({
        make: 'Honda',
        model: 'Accord',
        year: '2018',
        trim: 'EX',
        vin: '1HGCV1F30JA123456',
        isActive: true,
        createdAt: new Date('2025-07-20T14:30:00.000Z')
      });
      console.log('🚗 Added vehicle 2:', vehicle2Id);
      
      const vehicle3Id = addVehicle({
        make: 'Toyota',
        model: 'Camry',
        year: '2019',
        trim: 'LE',
        vin: '4T1BF1FK5KU123789',
        isActive: true,
        createdAt: new Date('2025-07-10T16:20:00.000Z')
      });
      console.log('🚗 Added vehicle 3:', vehicle3Id);
      
      console.log('🚗 Sample vehicles added, new count should be 3');
    } else {
      console.log('🚗 Skipping sample vehicles - either vehicles exist or no user');
    }
  }, [currentUser?.userId, vehicles.length, addVehicle]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackToChat} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.gray600} />
            <Text style={styles.backText}>Back to Chat</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToChat} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.gray600} />
          <Text style={styles.backText}>Back to Chat</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vehicles</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {vehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color={DesignSystem.colors.gray400} />
            <Text style={styles.emptyTitle}>No Vehicles Added</Text>
            <Text style={styles.emptyText}>
              Add your vehicles to get personalized diagnostic help and service recommendations.
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={DesignSystem.colors.white} />
              <Text style={styles.addButtonText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  vehicle.id === userProfile?.selectedVehicleId && styles.selectedVehicleCard
                ]}
                onPress={() => handleVehiclePress(vehicle)}
              >
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleMainInfo}>
                    <Ionicons 
                      name="car" 
                      size={24} 
                      color={vehicle.id === userProfile?.selectedVehicleId ? DesignSystem.colors.primary : DesignSystem.colors.gray600} 
                    />
                    <View style={styles.vehicleTextContainer}>
                      <Text style={[
                        styles.vehicleText,
                        vehicle.id === userProfile?.selectedVehicleId && styles.selectedVehicleText
                      ]}>
                        {getVehicleDisplayName(vehicle)}
                      </Text>
                      {vehicle.vin && (
                        <Text style={styles.vinText}>VIN: {vehicle.vin}</Text>
                      )}
                    </View>
                  </View>
                  
                  {vehicle.id === userProfile?.selectedVehicleId && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  )}
                </View>

                <View style={styles.vehicleDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color={DesignSystem.colors.gray500} />
                    <Text style={styles.detailText}>
                      Last used: {formatDate(vehicle.lastUsed)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color={DesignSystem.colors.gray500} />
                    <Text style={styles.detailText}>
                      Added: {formatDate(vehicle.createdAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.vehicleActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditVehicle(vehicle)}
                  >
                    <Ionicons name="pencil" size={16} color={DesignSystem.colors.primary} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteVehicle(vehicle.id, getVehicleDisplayName(vehicle))}
                  >
                    <Ionicons name="trash" size={16} color={DesignSystem.colors.red500} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.chevron}>
                  <Ionicons name="chevron-forward" size={20} color={DesignSystem.colors.gray400} />
                </View>
              </TouchableOpacity>
            ))}

            {vehicles.length < 10 && (
              <TouchableOpacity 
                style={styles.addVehicleCard} 
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add-circle" size={32} color={DesignSystem.colors.primary} />
                <Text style={styles.addVehicleText}>Add Another Vehicle</Text>
                <Text style={styles.addVehicleSubtext}>
                  {10 - vehicles.length} more vehicle{10 - vehicles.length !== 1 ? 's' : ''} allowed
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Vehicle Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingVehicleId(null);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setEditingVehicleId(null);
                resetForm();
              }}
            >
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>
            <TouchableOpacity
              onPress={editingVehicleId ? handleUpdateVehicle : handleAddVehicle}
            >
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Make *</Text>
              <TextInput
                style={styles.input}
                value={formData.make}
                onChangeText={(text) => setFormData({ ...formData, make: text })}
                placeholder="e.g., Honda, Toyota, Ford"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Model *</Text>
              <TextInput
                style={styles.input}
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
                placeholder="e.g., Civic, Camry, F-150"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Year *</Text>
              <TextInput
                style={styles.input}
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                placeholder="e.g., 2020"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Trim</Text>
              <TextInput
                style={styles.input}
                value={formData.trim}
                onChangeText={(text) => setFormData({ ...formData, trim: text })}
                placeholder="e.g., LX, EX, Sport (optional)"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>VIN</Text>
              <TextInput
                style={styles.input}
                value={formData.vin}
                onChangeText={(text) => setFormData({ ...formData, vin: text.toUpperCase() })}
                placeholder="17-character VIN (optional)"
                autoCapitalize="characters"
                maxLength={17}
              />
            </View>

            <Text style={styles.requiredNote}>* Required fields</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
    backgroundColor: DesignSystem.colors.white,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: DesignSystem.colors.gray600,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: DesignSystem.colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  vehicleCard: {
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    position: 'relative' as const,
  },
  selectedVehicleCard: {
    borderColor: DesignSystem.colors.primary,
    borderWidth: 2,
  },
  vehicleHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  vehicleMainInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  vehicleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  selectedVehicleText: {
    color: DesignSystem.colors.primary,
  },
  vinText: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  selectedBadge: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: DesignSystem.colors.white,
  },
  vehicleDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginLeft: 8,
  },
  vehicleActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-start' as const,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
  },
  editButton: {
    marginRight: 16,
  },
  actionButtonText: {
    fontSize: 14,
    color: DesignSystem.colors.primary,
    marginLeft: 4,
  },
  deleteButton: {
    borderColor: DesignSystem.colors.red500,
  },
  deleteButtonText: {
    color: DesignSystem.colors.red500,
  },
  chevron: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  addVehicleCard: {
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignSystem.colors.primary,
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addVehicleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.primary,
    marginTop: 8,
  },
  addVehicleSubtext: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8e8ea0',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10a37f',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  requiredNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 16,
    fontStyle: 'italic' as const,
  },
};
