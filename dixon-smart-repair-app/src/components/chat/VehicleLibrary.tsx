/**
 * Vehicle Library Component
 * Manage user's vehicle library (max 10 vehicles for authenticated users)
 * Phase 3: Frontend Session Management UI
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore, VehicleInfo } from '../../stores/sessionStore';

// Helper function to safely format dates
const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'Never used';
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
    return 'Never used';
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Never used';
  }
};

interface VehicleLibraryProps {
  onVehicleSelect: (vehicle: VehicleInfo) => void;
  selectedVehicleId?: string;
}

const VehicleLibrary: React.FC<VehicleLibraryProps> = ({ onVehicleSelect, selectedVehicleId }) => {
  const {
    vehicles,
    userProfile,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    selectVehicle
  } = useSessionStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    trim: '', // Added trim field
    vin: '',
    nickname: ''
  });

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: '',
      trim: '', // Added trim field
      vin: '',
      nickname: ''
    });
  };

  const handleAddVehicle = () => {
    if (!formData.make || !formData.model || !formData.year) {
      Alert.alert('Missing Information', 'Please fill in make, model, and year.');
      return;
    }

    const yearNum = parseInt(formData.year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year.');
      return;
    }

    const vehicleData = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: yearNum,
      trim: formData.trim.trim() || undefined, // Added trim field
      vin: formData.vin.trim() || undefined,
      nickname: formData.nickname.trim() || undefined,
      verified: false
    };

    const vehicleId = addVehicle(vehicleData);
    if (vehicleId) {
      setShowAddModal(false);
      resetForm();
    } else {
      Alert.alert('Limit Reached', 'You can only save up to 10 vehicles. Please delete some vehicles first.');
    }
  };

  const handleEditVehicle = (vehicle: VehicleInfo) => {
    setEditingVehicleId(vehicle.id);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      vin: vehicle.vin || '',
      nickname: vehicle.nickname || ''
    });
    setShowAddModal(true);
  };

  const handleUpdateVehicle = () => {
    if (!editingVehicleId || !formData.make || !formData.model || !formData.year) {
      Alert.alert('Missing Information', 'Please fill in make, model, and year.');
      return;
    }

    const yearNum = parseInt(formData.year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year.');
      return;
    }

    const updates = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: yearNum,
      vin: formData.vin.trim() || undefined,
      nickname: formData.nickname.trim() || undefined
    };

    updateVehicle(editingVehicleId, updates);
    setShowAddModal(false);
    setEditingVehicleId(null);
    resetForm();
  };

  const handleDeleteVehicle = (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to remove "${vehicleName}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteVehicle(vehicleId)
        }
      ]
    );
  };

  const handleSelectVehicle = (vehicle: VehicleInfo) => {
    selectVehicle(vehicle.id);
    onVehicleSelect(vehicle);
  };

  const renderVehicleItem = ({ item: vehicle }: { item: VehicleInfo }) => {
    const isSelected = vehicle.id === selectedVehicleId;
    const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    
    return (
      <TouchableOpacity
        style={[styles.vehicleItem, isSelected && styles.selectedVehicle]}
        onPress={() => handleSelectVehicle(vehicle)}
        activeOpacity={0.7}
      >
        <View style={styles.vehicleIcon}>
          <Ionicons 
            name="car" 
            size={24} 
            color={isSelected ? '#10a37f' : '#6b7280'} 
          />
          {vehicle.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10a37f" />
            </View>
          )}
        </View>
        
        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleName, isSelected && styles.selectedVehicleName]}>
            {displayName}
          </Text>
          <View style={styles.vehicleDetails}>
            <Text style={[styles.vehicleDetailText, isSelected && styles.selectedVehicleDetail]}>
              {vehicle.make} {vehicle.model} • {vehicle.year}
            </Text>
            {vehicle.vin && (
              <Text style={[styles.vinText, isSelected && styles.selectedVehicleDetail]}>
                VIN: {vehicle.vin.substring(0, 8)}...
              </Text>
            )}
          </View>
          <View style={styles.vehicleMeta}>
            <Text style={[styles.usageText, isSelected && styles.selectedVehicleDetail]}>
              Used {vehicle.usageCount} times
            </Text>
            <Text style={[styles.lastUsedText, isSelected && styles.selectedVehicleDetail]}>
              {formatDate(vehicle.lastUsed)}
            </Text>
          </View>
        </View>
        
        <View style={styles.vehicleActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditVehicle(vehicle)}
          >
            <Ionicons name="pencil-outline" size={16} color="#8e8ea0" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteVehicle(vehicle.id, displayName)}
          >
            <Ionicons name="trash-outline" size={16} color="#8e8ea0" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (!userProfile?.isAuthenticated) {
    return (
      <View style={styles.unauthenticatedContainer}>
        <Ionicons name="car-outline" size={48} color="#8e8ea0" />
        <Text style={styles.unauthenticatedTitle}>Sign in to save vehicles</Text>
        <Text style={styles.unauthenticatedText}>
          Save up to 10 vehicles for faster diagnostics and personalized recommendations.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <View style={styles.headerRight}>
          <Text style={styles.vehicleCount}>{vehicles.length}/10</Text>
          <TouchableOpacity
            style={[styles.addButton, vehicles.length >= 10 && styles.addButtonDisabled]}
            onPress={() => setShowAddModal(true)}
            disabled={vehicles.length >= 10}
          >
            <Ionicons name="add" size={20} color={vehicles.length >= 10 ? '#8e8ea0' : '#10a37f'} />
          </TouchableOpacity>
        </View>
      </View>
      
      {vehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={48} color="#8e8ea0" />
          <Text style={styles.emptyTitle}>No vehicles saved</Text>
          <Text style={styles.emptyText}>
            Add your vehicles for faster diagnostics and VIN-enhanced accuracy.
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.addFirstButtonText}>Add Your First Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicleItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

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
              <Text style={styles.saveButton}>
                {editingVehicleId ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Make *</Text>
              <TextInput
                style={styles.input}
                value={formData.make}
                onChangeText={(text) => setFormData({ ...formData, make: text })}
                placeholder="e.g., Toyota"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Model *</Text>
              <TextInput
                style={styles.input}
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
                placeholder="e.g., Camry"
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
              <Text style={styles.label}>Trim (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.trim}
                onChangeText={(text) => setFormData({ ...formData, trim: text })}
                placeholder="e.g., LX, EX, Sport, Limited"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>VIN (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.vin}
                onChangeText={(text) => setFormData({ ...formData, vin: text.toUpperCase() })}
                placeholder="17-character VIN for 95% accuracy"
                autoCapitalize="characters"
                maxLength={17}
              />
              <Text style={styles.helpText}>
                Adding your VIN enables 95% diagnostic accuracy with exact part numbers.
              </Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nickname (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.nickname}
                onChangeText={(text) => setFormData({ ...formData, nickname: text })}
                placeholder="e.g., My Daily Driver"
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleCount: {
    fontSize: 12,
    color: '#8e8ea0',
    marginRight: 8,
  },
  addButton: {
    padding: 4,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  listContent: {
    paddingBottom: 20,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  selectedVehicle: {
    borderColor: '#10a37f',
    backgroundColor: '#f0fdf4',
  },
  vehicleIcon: {
    position: 'relative',
    marginRight: 12,
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 6,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedVehicleName: {
    color: '#10a37f',
  },
  vehicleDetails: {
    marginBottom: 4,
  },
  vehicleDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedVehicleDetail: {
    color: '#059669',
  },
  vinText: {
    fontSize: 11,
    color: '#8e8ea0',
    fontFamily: 'monospace',
  },
  vehicleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageText: {
    fontSize: 11,
    color: '#8e8ea0',
  },
  lastUsedText: {
    fontSize: 11,
    color: '#8e8ea0',
  },
  vehicleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8ea0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10a37f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  unauthenticatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthenticatedText: {
    fontSize: 14,
    color: '#8e8ea0',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8e8ea0',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10a37f',
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 16,
  },
});

export default VehicleLibrary;
