import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface Vehicle {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  engine?: string
  transmission?: string
  mileage: number
  color?: string
  nickname?: string
  isPrimary: boolean
  addedDate: Date
  lastServiceDate?: Date
  nextServiceDue?: Date
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      vin: '1HGBH41JXMN109186',
      year: 2021,
      make: 'Honda',
      model: 'Civic',
      trim: 'Sport',
      engine: '2.0L 4-Cylinder',
      transmission: 'CVT',
      mileage: 45000,
      color: 'Silver',
      nickname: 'Daily Driver',
      isPrimary: true,
      addedDate: new Date('2023-01-15'),
      lastServiceDate: new Date('2024-06-15'),
      nextServiceDue: new Date('2024-12-15'),
    },
    {
      id: '2',
      vin: '1FTFW1ET5DFC10312',
      year: 2013,
      make: 'Ford',
      model: 'F-150',
      trim: 'XLT',
      engine: '5.0L V8',
      transmission: '6-Speed Automatic',
      mileage: 125000,
      color: 'Blue',
      nickname: 'Work Truck',
      isPrimary: false,
      addedDate: new Date('2023-03-20'),
      lastServiceDate: new Date('2024-05-10'),
      nextServiceDue: new Date('2024-11-10'),
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [newVehicle, setNewVehicle] = useState({
    vin: '',
    year: '',
    make: '',
    model: '',
    mileage: '',
    nickname: '',
  })

  const handleAddVehicle = () => {
    if (!newVehicle.vin || !newVehicle.make || !newVehicle.model) {
      Alert.alert('Error', 'Please fill in required fields (VIN, Make, Model)')
      return
    }

    const vehicle: Vehicle = {
      id: Date.now().toString(),
      vin: newVehicle.vin,
      year: parseInt(newVehicle.year) || new Date().getFullYear(),
      make: newVehicle.make,
      model: newVehicle.model,
      mileage: parseInt(newVehicle.mileage) || 0,
      nickname: newVehicle.nickname || `${newVehicle.make} ${newVehicle.model}`,
      isPrimary: vehicles.length === 0,
      addedDate: new Date(),
    }

    setVehicles(prev => [...prev, vehicle])
    setNewVehicle({ vin: '', year: '', make: '', model: '', mileage: '', nickname: '' })
    setShowAddModal(false)
  }

  const handleDeleteVehicle = (vehicleId: string) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to remove this vehicle from your garage?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVehicles(prev => prev.filter(v => v.id !== vehicleId))
          }
        }
      ]
    )
  }

  const handleSetPrimary = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => ({
      ...v,
      isPrimary: v.id === vehicleId
    })))
  }

  const handleStartDiagnosis = (vehicle: Vehicle) => {
    // Navigate back to chat with vehicle context
    router.push('/')
    // In a real app, you'd pass the vehicle context to the chat
  }

  const getServiceStatus = (vehicle: Vehicle) => {
    if (!vehicle.nextServiceDue) return { status: 'unknown', color: '#64748b', text: 'No schedule' }
    
    const now = new Date()
    const daysUntilService = Math.ceil((vehicle.nextServiceDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilService < 0) return { status: 'overdue', color: '#dc2626', text: `${Math.abs(daysUntilService)} days overdue` }
    if (daysUntilService <= 30) return { status: 'due', color: '#ea580c', text: `Due in ${daysUntilService} days` }
    return { status: 'good', color: '#16a34a', text: `Due in ${daysUntilService} days` }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.titleText}>My Vehicles</Text>
          <Text style={styles.subtitleText}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in garage</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Vehicle List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Vehicles Added</Text>
            <Text style={styles.emptyDescription}>
              Add your vehicles to get personalized diagnostics and maintenance tracking
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyButtonText}>Add Your First Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((vehicle) => {
            const serviceStatus = getServiceStatus(vehicle)
            
            return (
              <View key={vehicle.id} style={styles.vehicleCard}>
                {/* Vehicle Header */}
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleInfo}>
                    <View style={styles.vehicleTitle}>
                      <Text style={styles.vehicleName}>
                        {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </Text>
                      {vehicle.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryText}>PRIMARY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.vehicleDetails}>
                      {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && `• ${vehicle.trim}`}
                    </Text>
                    <Text style={styles.vehicleSpecs}>
                      {vehicle.engine} • {vehicle.mileage.toLocaleString()} miles
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.menuButton}
                    onPress={() => {
                      Alert.alert(
                        'Vehicle Options',
                        `Options for ${vehicle.nickname || vehicle.make + ' ' + vehicle.model}`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: vehicle.isPrimary ? 'Primary Vehicle' : 'Set as Primary',
                            onPress: vehicle.isPrimary ? undefined : () => handleSetPrimary(vehicle.id),
                            style: vehicle.isPrimary ? 'default' : 'default'
                          },
                          { text: 'Delete Vehicle', onPress: () => handleDeleteVehicle(vehicle.id), style: 'destructive' }
                        ]
                      )
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Service Status */}
                <View style={styles.serviceStatus}>
                  <View style={styles.statusItem}>
                    <Ionicons name="build" size={16} color={serviceStatus.color} />
                    <Text style={[styles.statusText, { color: serviceStatus.color }]}>
                      Service: {serviceStatus.text}
                    </Text>
                  </View>
                  
                  {vehicle.lastServiceDate && (
                    <Text style={styles.lastService}>
                      Last service: {vehicle.lastServiceDate.toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {/* Vehicle Actions */}
                <View style={styles.vehicleActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.primaryAction]}
                    onPress={() => handleStartDiagnosis(vehicle)}
                  >
                    <Ionicons name="medical" size={18} color="#ffffff" />
                    <Text style={styles.primaryActionText}>Start Diagnosis</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryAction]}
                    onPress={() => router.push('/service-history')}
                  >
                    <Ionicons name="time" size={18} color="#1e40af" />
                    <Text style={styles.secondaryActionText}>Service History</Text>
                  </TouchableOpacity>
                </View>

                {/* VIN Display */}
                <View style={styles.vinContainer}>
                  <Text style={styles.vinLabel}>VIN:</Text>
                  <Text style={styles.vinText}>{vehicle.vin}</Text>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Vehicle</Text>
            <TouchableOpacity onPress={handleAddVehicle}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>VIN Number *</Text>
              <TextInput
                style={styles.textInput}
                value={newVehicle.vin}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, vin: text.toUpperCase() }))}
                placeholder="Enter 17-character VIN"
                maxLength={17}
                autoCapitalize="characters"
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Year</Text>
                <TextInput
                  style={styles.textInput}
                  value={newVehicle.year}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, year: text }))}
                  placeholder="2020"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 2, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Make *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newVehicle.make}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, make: text }))}
                  placeholder="Honda, Ford, Toyota..."
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Model *</Text>
              <TextInput
                style={styles.textInput}
                value={newVehicle.model}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, model: text }))}
                placeholder="Civic, F-150, Camry..."
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Mileage</Text>
              <TextInput
                style={styles.textInput}
                value={newVehicle.mileage}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, mileage: text }))}
                placeholder="50000"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nickname (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newVehicle.nickname}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, nickname: text }))}
                placeholder="Daily Driver, Work Truck..."
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  primaryBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
  },
  vehicleDetails: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  vehicleSpecs: {
    fontSize: 14,
    color: '#64748b',
  },
  menuButton: {
    padding: 4,
  },
  serviceStatus: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  lastService: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 22,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
  },
  primaryAction: {
    backgroundColor: '#1e40af',
  },
  secondaryAction: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryActionText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  vinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  vinLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginRight: 8,
  },
  vinText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalSave: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
})
