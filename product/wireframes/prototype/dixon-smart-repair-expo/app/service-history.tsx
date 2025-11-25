import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface ServiceRecord {
  id: string
  vehicleId: string
  vehicleName: string
  date: Date
  mileage: number
  serviceType: 'maintenance' | 'repair' | 'diagnostic' | 'inspection'
  title: string
  description: string
  mechanic: {
    name: string
    shop: string
    rating: number
  }
  cost: {
    parts: number
    labor: number
    total: number
  }
  warranty: {
    parts: number // months
    labor: number // months
    expires: Date
  }
  status: 'completed' | 'in-progress' | 'scheduled'
  diagnosticId?: string // Link to chat conversation
  invoiceId?: string
  photos?: string[]
}

export default function ServiceHistoryPage() {
  const [serviceRecords] = useState<ServiceRecord[]>([
    {
      id: '1',
      vehicleId: '1',
      vehicleName: '2021 Honda Civic',
      date: new Date('2024-06-15'),
      mileage: 42000,
      serviceType: 'repair',
      title: 'Brake Pad Replacement',
      description: 'Replaced front brake pads and rotors. Brake fluid flush performed.',
      mechanic: {
        name: 'Mike Johnson',
        shop: 'AutoCare Plus',
        rating: 4.8
      },
      cost: {
        parts: 180,
        labor: 120,
        total: 300
      },
      warranty: {
        parts: 24,
        labor: 12,
        expires: new Date('2025-06-15')
      },
      status: 'completed',
      diagnosticId: 'chat-001',
      invoiceId: 'inv-001'
    },
    {
      id: '2',
      vehicleId: '1',
      vehicleName: '2021 Honda Civic',
      date: new Date('2024-03-10'),
      mileage: 38000,
      serviceType: 'maintenance',
      title: 'Oil Change & Filter',
      description: 'Full synthetic oil change, air filter replacement, multi-point inspection.',
      mechanic: {
        name: 'Sarah Chen',
        shop: 'Quick Lube Express',
        rating: 4.5
      },
      cost: {
        parts: 45,
        labor: 25,
        total: 70
      },
      warranty: {
        parts: 6,
        labor: 3,
        expires: new Date('2024-09-10')
      },
      status: 'completed',
      invoiceId: 'inv-002'
    },
    {
      id: '3',
      vehicleId: '2',
      vehicleName: '2013 Ford F-150',
      date: new Date('2024-05-10'),
      mileage: 122000,
      serviceType: 'repair',
      title: 'Engine Belt Replacement',
      description: 'Replaced serpentine belt and tensioner. Checked all pulleys.',
      mechanic: {
        name: 'Tom Rodriguez',
        shop: 'Ford Service Center',
        rating: 4.9
      },
      cost: {
        parts: 85,
        labor: 95,
        total: 180
      },
      warranty: {
        parts: 36,
        labor: 12,
        expires: new Date('2025-05-10')
      },
      status: 'completed',
      diagnosticId: 'chat-002',
      invoiceId: 'inv-003'
    },
    {
      id: '4',
      vehicleId: '1',
      vehicleName: '2021 Honda Civic',
      date: new Date('2024-12-20'),
      mileage: 45000,
      serviceType: 'maintenance',
      title: 'Winter Service Package',
      description: 'Tire rotation, battery test, coolant check, winter inspection.',
      mechanic: {
        name: 'Mike Johnson',
        shop: 'AutoCare Plus',
        rating: 4.8
      },
      cost: {
        parts: 0,
        labor: 85,
        total: 85
      },
      warranty: {
        parts: 0,
        labor: 3,
        expires: new Date('2025-03-20')
      },
      status: 'scheduled'
    }
  ])

  const [filterType, setFilterType] = useState<'all' | 'maintenance' | 'repair' | 'diagnostic'>('all')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')

  const filteredRecords = serviceRecords.filter(record => {
    const typeMatch = filterType === 'all' || record.serviceType === filterType
    const vehicleMatch = selectedVehicle === 'all' || record.vehicleId === selectedVehicle
    return typeMatch && vehicleMatch
  })

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return 'build'
      case 'repair': return 'hammer'
      case 'diagnostic': return 'medical'
      case 'inspection': return 'checkmark-circle'
      default: return 'car'
    }
  }

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return '#16a34a'
      case 'repair': return '#ea580c'
      case 'diagnostic': return '#1e40af'
      case 'inspection': return '#7c3aed'
      default: return '#64748b'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a'
      case 'in-progress': return '#ea580c'
      case 'scheduled': return '#1e40af'
      default: return '#64748b'
    }
  }

  const isWarrantyActive = (warranty: ServiceRecord['warranty']) => {
    return new Date() < warranty.expires
  }

  const handleViewDiagnostic = (diagnosticId: string) => {
    // Navigate to specific chat conversation
    router.push(`/c/${diagnosticId}`)
  }

  const handleViewInvoice = (invoiceId: string) => {
    router.push('/invoices')
  }

  const handleBookService = () => {
    router.push('/')
    // In real app, would start diagnostic conversation
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
          <Text style={styles.titleText}>Service History</Text>
          <Text style={styles.subtitleText}>{filteredRecords.length} service record{filteredRecords.length !== 1 ? 's' : ''}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleBookService}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {[
            { key: 'all', label: 'All Services' },
            { key: 'maintenance', label: 'Maintenance' },
            { key: 'repair', label: 'Repairs' },
            { key: 'diagnostic', label: 'Diagnostics' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterType === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setFilterType(filter.key as any)}
            >
              <Text style={[
                styles.filterText,
                filterType === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Service Records */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="build" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Service Records</Text>
            <Text style={styles.emptyDescription}>
              Your service history will appear here after your first service appointment
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleBookService}
            >
              <Text style={styles.emptyButtonText}>Book Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.id} style={styles.serviceCard}>
              {/* Service Header */}
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceTitleRow}>
                    <View style={[
                      styles.serviceTypeIcon,
                      { backgroundColor: getServiceTypeColor(record.serviceType) + '20' }
                    ]}>
                      <Ionicons 
                        name={getServiceTypeIcon(record.serviceType) as any} 
                        size={16} 
                        color={getServiceTypeColor(record.serviceType)} 
                      />
                    </View>
                    <Text style={styles.serviceTitle}>{record.title}</Text>
                  </View>
                  
                  <Text style={styles.vehicleName}>{record.vehicleName}</Text>
                  <Text style={styles.serviceDate}>
                    {record.date.toLocaleDateString()} • {record.mileage.toLocaleString()} miles
                  </Text>
                </View>
                
                <View style={styles.serviceStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(record.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {record.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.serviceCost}>${record.cost.total}</Text>
                </View>
              </View>

              {/* Service Description */}
              <Text style={styles.serviceDescription}>{record.description}</Text>

              {/* Mechanic Info */}
              <View style={styles.mechanicInfo}>
                <View style={styles.mechanicDetails}>
                  <Text style={styles.mechanicName}>{record.mechanic.name}</Text>
                  <Text style={styles.shopName}>{record.mechanic.shop}</Text>
                </View>
                <View style={styles.rating}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.ratingText}>{record.mechanic.rating}</Text>
                </View>
              </View>

              {/* Cost Breakdown */}
              <View style={styles.costBreakdown}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Parts:</Text>
                  <Text style={styles.costValue}>${record.cost.parts}</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Labor:</Text>
                  <Text style={styles.costValue}>${record.cost.labor}</Text>
                </View>
                <View style={[styles.costRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>${record.cost.total}</Text>
                </View>
              </View>

              {/* Warranty Info */}
              {(record.warranty.parts > 0 || record.warranty.labor > 0) && (
                <View style={styles.warrantyInfo}>
                  <View style={styles.warrantyHeader}>
                    <Ionicons 
                      name="shield-checkmark" 
                      size={16} 
                      color={isWarrantyActive(record.warranty) ? '#16a34a' : '#64748b'} 
                    />
                    <Text style={[
                      styles.warrantyTitle,
                      { color: isWarrantyActive(record.warranty) ? '#16a34a' : '#64748b' }
                    ]}>
                      Warranty {isWarrantyActive(record.warranty) ? 'Active' : 'Expired'}
                    </Text>
                  </View>
                  <Text style={styles.warrantyDetails}>
                    Parts: {record.warranty.parts} months • Labor: {record.warranty.labor} months
                  </Text>
                  <Text style={styles.warrantyExpiry}>
                    Expires: {record.warranty.expires.toLocaleDateString()}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {record.diagnosticId && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryAction]}
                    onPress={() => handleViewDiagnostic(record.diagnosticId!)}
                  >
                    <Ionicons name="chatbubble" size={16} color="#1e40af" />
                    <Text style={styles.secondaryActionText}>View Diagnostic</Text>
                  </TouchableOpacity>
                )}
                
                {record.invoiceId && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryAction]}
                    onPress={() => handleViewInvoice(record.invoiceId!)}
                  >
                    <Ionicons name="document-text" size={16} color="#1e40af" />
                    <Text style={styles.secondaryActionText}>View Invoice</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
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
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
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
  serviceCard: {
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
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  vehicleName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  serviceDate: {
    fontSize: 12,
    color: '#64748b',
  },
  serviceStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  serviceCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  mechanicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mechanicDetails: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  shopName: {
    fontSize: 12,
    color: '#64748b',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  costBreakdown: {
    marginBottom: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  costLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  costValue: {
    fontSize: 14,
    color: '#374151',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  warrantyInfo: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warrantyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warrantyTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  warrantyDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  warrantyExpiry: {
    fontSize: 12,
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minHeight: 36,
  },
  secondaryAction: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  secondaryActionText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
})
