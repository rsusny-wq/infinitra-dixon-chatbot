import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface MaintenanceReminder {
  id: string
  vehicleId: string
  vehicleName: string
  type: 'mileage' | 'time' | 'both'
  title: string
  description: string
  category: 'oil' | 'brakes' | 'tires' | 'engine' | 'transmission' | 'other'
  currentMileage: number
  targetMileage?: number
  lastServiceDate?: Date
  nextServiceDate?: Date
  interval: {
    miles?: number
    months?: number
  }
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'upcoming' | 'due' | 'overdue' | 'completed'
  estimatedCost: {
    min: number
    max: number
  }
  preferredMechanic?: string
  notes?: string
  isEnabled: boolean
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([
    {
      id: '1',
      vehicleId: '1',
      vehicleName: '2021 Honda Civic',
      type: 'both',
      title: 'Oil Change',
      description: 'Full synthetic oil change and filter replacement',
      category: 'oil',
      currentMileage: 45000,
      targetMileage: 48000,
      lastServiceDate: new Date('2024-06-15'),
      nextServiceDate: new Date('2024-12-15'),
      interval: {
        miles: 7500,
        months: 6
      },
      priority: 'medium',
      status: 'upcoming',
      estimatedCost: {
        min: 60,
        max: 90
      },
      preferredMechanic: 'Quick Lube Express',
      isEnabled: true
    },
    {
      id: '2',
      vehicleId: '1',
      vehicleName: '2021 Honda Civic',
      type: 'mileage',
      title: 'Brake Inspection',
      description: 'Inspect brake pads, rotors, and brake fluid',
      category: 'brakes',
      currentMileage: 45000,
      targetMileage: 50000,
      lastServiceDate: new Date('2024-06-15'),
      interval: {
        miles: 15000
      },
      priority: 'high',
      status: 'upcoming',
      estimatedCost: {
        min: 50,
        max: 400
      },
      preferredMechanic: 'AutoCare Plus',
      notes: 'Last service replaced front pads and rotors',
      isEnabled: true
    },
    {
      id: '3',
      vehicleId: '2',
      vehicleName: '2013 Ford F-150',
      type: 'time',
      title: 'Transmission Service',
      description: 'Transmission fluid change and filter replacement',
      category: 'transmission',
      currentMileage: 125000,
      lastServiceDate: new Date('2022-05-10'),
      nextServiceDate: new Date('2024-05-10'),
      interval: {
        months: 24
      },
      priority: 'critical',
      status: 'overdue',
      estimatedCost: {
        min: 200,
        max: 350
      },
      preferredMechanic: 'Ford Service Center',
      isEnabled: true
    },
    {
      id: '4',
      vehicleId: '1',
      vehicleName: '2021 Honda Civic',
      type: 'mileage',
      title: 'Tire Rotation',
      description: 'Rotate tires and check tire pressure',
      category: 'tires',
      currentMileage: 45000,
      targetMileage: 47500,
      lastServiceDate: new Date('2024-03-10'),
      interval: {
        miles: 7500
      },
      priority: 'low',
      status: 'due',
      estimatedCost: {
        min: 25,
        max: 50
      },
      isEnabled: true
    }
  ])

  const [filterStatus, setFilterStatus] = useState<'all' | 'due' | 'upcoming' | 'overdue'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredReminders = reminders.filter(reminder => {
    if (!reminder.isEnabled) return false
    return filterStatus === 'all' || reminder.status === filterStatus
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'oil': return 'water'
      case 'brakes': return 'stop-circle'
      case 'tires': return 'ellipse'
      case 'engine': return 'hardware-chip'
      case 'transmission': return 'settings'
      default: return 'build'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'oil': return '#ea580c'
      case 'brakes': return '#dc2626'
      case 'tires': return '#374151'
      case 'engine': return '#1e40af'
      case 'transmission': return '#7c3aed'
      default: return '#64748b'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#16a34a'
      default: return '#64748b'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#dc2626'
      case 'due': return '#ea580c'
      case 'upcoming': return '#1e40af'
      case 'completed': return '#16a34a'
      default: return '#64748b'
    }
  }

  const getDaysUntilDue = (reminder: MaintenanceReminder) => {
    if (reminder.type === 'mileage' && reminder.targetMileage) {
      const milesRemaining = reminder.targetMileage - reminder.currentMileage
      const avgMilesPerDay = 40 // Estimate
      return Math.ceil(milesRemaining / avgMilesPerDay)
    }
    
    if (reminder.nextServiceDate) {
      const now = new Date()
      const diffTime = reminder.nextServiceDate.getTime() - now.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    
    return null
  }

  const handleCompleteReminder = (reminderId: string) => {
    Alert.alert(
      'Mark as Completed',
      'Has this maintenance been completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            setReminders(prev => prev.map(reminder => 
              reminder.id === reminderId 
                ? { ...reminder, status: 'completed' as const }
                : reminder
            ))
          }
        }
      ]
    )
  }

  const handleScheduleService = (reminder: MaintenanceReminder) => {
    Alert.alert(
      'Schedule Service',
      `Schedule ${reminder.title} for ${reminder.vehicleName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Find Mechanics', onPress: () => router.push('/mechanics') },
        { text: 'Start Diagnosis', onPress: () => router.push('/') }
      ]
    )
  }

  const handleToggleReminder = (reminderId: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, isEnabled: !reminder.isEnabled }
        : reminder
    ))
  }

  const overdueCount = reminders.filter(r => r.status === 'overdue' && r.isEnabled).length
  const dueCount = reminders.filter(r => r.status === 'due' && r.isEnabled).length
  const upcomingCount = reminders.filter(r => r.status === 'upcoming' && r.isEnabled).length

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
          <Text style={styles.titleText}>Maintenance Reminders</Text>
          <Text style={styles.subtitleText}>
            {filteredReminders.length} active reminder{filteredReminders.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { borderLeftColor: '#dc2626' }]}>
          <Text style={styles.summaryNumber}>{overdueCount}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        
        <View style={[styles.summaryCard, { borderLeftColor: '#ea580c' }]}>
          <Text style={styles.summaryNumber}>{dueCount}</Text>
          <Text style={styles.summaryLabel}>Due Now</Text>
        </View>
        
        <View style={[styles.summaryCard, { borderLeftColor: '#1e40af' }]}>
          <Text style={styles.summaryNumber}>{upcomingCount}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {[
            { key: 'all', label: 'All' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'due', label: 'Due Now' },
            { key: 'upcoming', label: 'Upcoming' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterStatus === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(filter.key as any)}
            >
              <Text style={[
                styles.filterText,
                filterStatus === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reminders List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Reminders</Text>
            <Text style={styles.emptyDescription}>
              {filterStatus === 'all' 
                ? 'Add maintenance reminders to stay on top of vehicle care'
                : `No ${filterStatus} maintenance items`
              }
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyButtonText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredReminders.map((reminder) => {
            const daysUntil = getDaysUntilDue(reminder)
            
            return (
              <View key={reminder.id} style={styles.reminderCard}>
                {/* Reminder Header */}
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderInfo}>
                    <View style={styles.reminderTitleRow}>
                      <View style={[
                        styles.categoryIcon,
                        { backgroundColor: getCategoryColor(reminder.category) + '20' }
                      ]}>
                        <Ionicons 
                          name={getCategoryIcon(reminder.category) as any} 
                          size={16} 
                          color={getCategoryColor(reminder.category)} 
                        />
                      </View>
                      <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    </View>
                    
                    <Text style={styles.vehicleName}>{reminder.vehicleName}</Text>
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>
                  </View>
                  
                  <View style={styles.reminderStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(reminder.status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {reminder.status.toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(reminder.priority) + '20' }
                    ]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(reminder.priority) }]}>
                        {reminder.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Reminder Details */}
                <View style={styles.reminderDetails}>
                  {reminder.type === 'mileage' && reminder.targetMileage && (
                    <View style={styles.detailRow}>
                      <Ionicons name="speedometer" size={16} color="#64748b" />
                      <Text style={styles.detailText}>
                        {reminder.currentMileage.toLocaleString()} / {reminder.targetMileage.toLocaleString()} miles
                      </Text>
                    </View>
                  )}
                  
                  {reminder.nextServiceDate && (
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#64748b" />
                      <Text style={styles.detailText}>
                        Due: {reminder.nextServiceDate.toLocaleDateString()}
                        {daysUntil !== null && (
                          <Text style={[
                            styles.daysText,
                            { color: daysUntil < 0 ? '#dc2626' : daysUntil <= 7 ? '#ea580c' : '#64748b' }
                          ]}>
                            {daysUntil < 0 ? ` (${Math.abs(daysUntil)} days overdue)` : 
                             daysUntil === 0 ? ' (due today)' :
                             ` (${daysUntil} days)`}
                          </Text>
                        )}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={16} color="#64748b" />
                    <Text style={styles.detailText}>
                      Est. cost: ${reminder.estimatedCost.min} - ${reminder.estimatedCost.max}
                    </Text>
                  </View>
                  
                  {reminder.preferredMechanic && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color="#64748b" />
                      <Text style={styles.detailText}>{reminder.preferredMechanic}</Text>
                    </View>
                  )}
                </View>

                {/* Notes */}
                {reminder.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>{reminder.notes}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryAction]}
                    onPress={() => handleCompleteReminder(reminder.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#16a34a" />
                    <Text style={[styles.secondaryActionText, { color: '#16a34a' }]}>Complete</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.primaryAction]}
                    onPress={() => handleScheduleService(reminder)}
                  >
                    <Ionicons name="calendar" size={16} color="#ffffff" />
                    <Text style={styles.primaryActionText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
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
            <Text style={styles.modalTitle}>Add Reminder</Text>
            <TouchableOpacity onPress={() => {
              Alert.alert('Add Reminder', 'Reminder creation would be implemented here')
              setShowAddModal(false)
            }}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Create custom maintenance reminders based on mileage, time, or both.
            </Text>
            
            <View style={styles.quickOptions}>
              <Text style={styles.quickOptionsTitle}>Quick Add:</Text>
              {[
                { title: 'Oil Change', category: 'oil', miles: 7500, months: 6 },
                { title: 'Brake Inspection', category: 'brakes', miles: 15000 },
                { title: 'Tire Rotation', category: 'tires', miles: 7500 },
                { title: 'Transmission Service', category: 'transmission', months: 24 }
              ].map((option, index) => (
                <TouchableOpacity key={index} style={styles.quickOption}>
                  <View style={[
                    styles.quickOptionIcon,
                    { backgroundColor: getCategoryColor(option.category) + '20' }
                  ]}>
                    <Ionicons 
                      name={getCategoryIcon(option.category) as any} 
                      size={16} 
                      color={getCategoryColor(option.category)} 
                    />
                  </View>
                  <Text style={styles.quickOptionText}>{option.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
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
  reminderCard: {
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
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reminderTitle: {
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
  reminderDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  reminderStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '600',
  },
  reminderDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 12,
    color: '#92400e',
    fontStyle: 'italic',
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 40,
  },
  primaryAction: {
    backgroundColor: '#1e40af',
  },
  secondaryAction: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  modalDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 24,
  },
  quickOptions: {
    marginBottom: 24,
  },
  quickOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  quickOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickOptionText: {
    fontSize: 16,
    color: '#0f172a',
    flex: 1,
  },
})
