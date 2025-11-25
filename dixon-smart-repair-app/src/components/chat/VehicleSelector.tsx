/**
 * VehicleSelector Component
 * Modal for selecting vehicle context in conversations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VehicleInfo } from '../../stores/conversationStore';

export interface VehicleSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onVehicleSelect: (vehicle: VehicleInfo) => void;
  currentVehicle?: VehicleInfo;
}

// Mock vehicle data - would come from user's saved vehicles
const mockVehicles: VehicleInfo[] = [
  {
    id: '1',
    make: 'Honda',
    model: 'Civic',
    year: 2020,
    vin: '1HGBH41JXMN109186',
    mileage: 45000,
  },
  {
    id: '2',
    make: 'Toyota',
    model: 'Camry',
    year: 2018,
    vin: '4T1BF1FK5JU123456',
    mileage: 62000,
  },
  {
    id: '3',
    make: 'Ford',
    model: 'F-150',
    year: 2019,
    vin: '1FTFW1ET5KFA12345',
    mileage: 38000,
  },
];

const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  isVisible,
  onClose,
  onVehicleSelect,
  currentVehicle,
}) => {
  const [searchText, setSearchText] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    mileage: '',
  });

  const filteredVehicles = mockVehicles.filter(vehicle =>
    `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const handleVehicleSelect = (vehicle: VehicleInfo) => {
    onVehicleSelect(vehicle);
  };

  const handleAddVehicle = () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.year) {
      Alert.alert('Error', 'Please fill in make, model, and year.');
      return;
    }

    const vehicle: VehicleInfo = {
      id: `new-${Date.now()}`,
      make: newVehicle.make,
      model: newVehicle.model,
      year: parseInt(newVehicle.year),
      vin: newVehicle.vin || undefined,
      mileage: newVehicle.mileage ? parseInt(newVehicle.mileage) : undefined,
    };

    onVehicleSelect(vehicle);
    setShowAddVehicle(false);
    setNewVehicle({ make: '', model: '', year: '', vin: '', mileage: '' });
  };

  const renderVehicleItem = (vehicle: VehicleInfo) => (
    <TouchableOpacity
      key={vehicle.id}
      style={[
        styles.vehicleItem,
        currentVehicle?.id === vehicle.id && styles.selectedVehicleItem,
      ]}
      onPress={() => handleVehicleSelect(vehicle)}
    >
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Text>
        {vehicle.vin && (
          <Text style={styles.vehicleVin}>VIN: {vehicle.vin}</Text>
        )}
        {vehicle.mileage && (
          <Text style={styles.vehicleMileage}>
            {vehicle.mileage.toLocaleString()} miles
          </Text>
        )}
      </View>
      
      {currentVehicle?.id === vehicle.id && (
        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  const renderAddVehicleForm = () => (
    <View style={styles.addVehicleForm}>
      <Text style={styles.addVehicleTitle}>Add New Vehicle</Text>
      
      <View style={styles.formRow}>
        <TextInput
          style={[styles.formInput, styles.halfInput]}
          placeholder="Make (e.g., Honda)"
          value={newVehicle.make}
          onChangeText={(text) => setNewVehicle({ ...newVehicle, make: text })}
        />
        <TextInput
          style={[styles.formInput, styles.halfInput]}
          placeholder="Model (e.g., Civic)"
          value={newVehicle.model}
          onChangeText={(text) => setNewVehicle({ ...newVehicle, model: text })}
        />
      </View>

      <TextInput
        style={styles.formInput}
        placeholder="Year (e.g., 2020)"
        value={newVehicle.year}
        onChangeText={(text) => setNewVehicle({ ...newVehicle, year: text })}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.formInput}
        placeholder="VIN (optional)"
        value={newVehicle.vin}
        onChangeText={(text) => setNewVehicle({ ...newVehicle, vin: text })}
        autoCapitalize="characters"
        maxLength={17}
      />

      <TextInput
        style={styles.formInput}
        placeholder="Mileage (optional)"
        value={newVehicle.mileage}
        onChangeText={(text) => setNewVehicle({ ...newVehicle, mileage: text })}
        keyboardType="numeric"
      />

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={[styles.formButton, styles.cancelButton]}
          onPress={() => setShowAddVehicle(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.formButton, styles.addButton]}
          onPress={handleAddVehicle}
        >
          <Text style={styles.addButtonText}>Add Vehicle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Select Vehicle</Text>
          
          <TouchableOpacity
            onPress={() => setShowAddVehicle(!showAddVehicle)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        {!showAddVehicle && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vehicles..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        )}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {showAddVehicle ? (
            renderAddVehicleForm()
          ) : (
            <>
              {/* Current Selection */}
              {currentVehicle && (
                <View style={styles.currentSelection}>
                  <Text style={styles.currentSelectionTitle}>Current Vehicle</Text>
                  {renderVehicleItem(currentVehicle)}
                </View>
              )}

              {/* Vehicle List */}
              <View style={styles.vehicleList}>
                <Text style={styles.sectionTitle}>Your Vehicles</Text>
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map(renderVehicleItem)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="car-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>
                      {searchText ? 'No vehicles match your search' : 'No vehicles found'}
                    </Text>
                  </View>
                )}
              </View>

              {/* No Vehicle Option */}
              <TouchableOpacity
                style={[
                  styles.vehicleItem,
                  !currentVehicle && styles.selectedVehicleItem,
                ]}
                onPress={() => onVehicleSelect(undefined as any)}
              >
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleTitle}>No specific vehicle</Text>
                  <Text style={styles.vehicleSubtitle}>
                    Get general automotive advice
                  </Text>
                </View>
                
                {!currentVehicle && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  currentSelection: {
    marginBottom: 24,
  },
  currentSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  vehicleList: {
    marginBottom: 24,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  selectedVehicleItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  vehicleVin: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  vehicleMileage: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  addVehicleForm: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  addVehicleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  halfInput: {
    width: '48%',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  addButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default VehicleSelector;
