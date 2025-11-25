import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  Switch,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface MaintenanceItem {
  id: string
  type: 'oil_change' | 'tire_rotation' | 'brake_inspection' | 'air_filter' | 'transmission' | 'coolant' | 'battery' | 'custom'
  name: string
  description: string
  intervalType: 'mileage' | 'time' | 'both'
  mileageInterval?: number
  timeInterval?: number // months
  lastServiceMileage?: number
  lastServiceDate?: Date
  nextDueMileage?: number
  nextDueDate?: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost: {
    min: number
    max: number
  }
  isEnabled: boolean
  notificationsEnabled: boolean
  reminderSettings: {
    advanceNotice: number // days
    frequency: 'once' | 'weekly' | 'monthly'
  }
}

interface VehicleInfo {
  year: number
  make: string
  model: string
  mileage: number
  vin?: string
}

interface MaintenanceReminderSystemProps {
  vehicleInfo?: VehicleInfo
  onScheduleService: (item: MaintenanceItem) => void
  onUpdateReminder: (item: MaintenanceItem) => void
}

export function MaintenanceReminderSystem({
  vehicleInfo,
  onScheduleService,
  onUpdateReminder
}: MaintenanceReminderSystemProps) {
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([])
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [showReminderDetail, setShowReminderDetail] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MaintenanceItem | null>(null)
  const [currentMileage, setCurrentMileage] = useState(vehicleInfo?.mileage || 75000)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    generateMaintenanceSchedule()
  }, [vehicleInfo])

  const generateMaintenanceSchedule = () => {
    const baseItems: Omit<MaintenanceItem, 'id' | 'lastServiceMileage' | 'lastServiceDate' | 'nextDueMileage' | 'nextDueDate'>[] = [
      {
        type: 'oil_change',
        name: 'Oil Change',
        description: 'Engine oil and filter replacement',
        intervalType: 'both',
        mileageInterval: 5000,
        timeInterval: 6,
        priority: 'high',
        estimatedCost: { min: 35, max: 75 },
        isEnabled: true,
        notificationsEnabled: true,
        reminderSettings: { advanceNotice: 7, frequency: 'once' }
      },
      {
        type: 'tire_rotation',
        name: 'Tire Rotation',
        description: 'Rotate tires for even wear',
        intervalType: 'mileage',
        mileageInterval: 7500,
        priority: 'medium',
        estimatedCost: { min: 25, max: 50 },
        isEnabled: true,
        notificationsEnabled: true,
        reminderSettings: { advanceNotice: 14, frequency: 'once' }
      },
      {
        type: 'brake_inspection',
        name: 'Brake Inspection',
        description: 'Brake pads, rotors, and fluid check',
        intervalType: 'both',
        mileageInterval: 15000,
        timeInterval: 12,
        priority: 'high',
        estimatedCost: { min: 50, max: 150 },
        isEnabled: true,
        notificationsEnabled: true,
        reminderSettings: { advanceNotice: 30, frequency: 'monthly' }
      },
      {
        type: 'air_filter',
        name: 'Air Filter Replacement',
        description: 'Engine air filter replacement',
        intervalType: 'both',
        mileageInterval: 12000,
        timeInterval: 12,
        priority: 'medium',
        estimatedCost: { min: 15, max: 35 },
        isEnabled: true,
        notificationsEnabled: false,
        reminderSettings: { advanceNotice: 14, frequency: 'once' }
      },
      {
        type: 'transmission',
        name: 'Transmission Service',
        description: 'Transmission fluid and filter service',
        intervalType: 'both',
        mileageInterval: 30000,
        timeInterval: 24,
        priority: 'medium',
        estimatedCost: { min: 150, max: 300 },
        isEnabled: true,
        notificationsEnabled: true,
        reminderSettings: { advanceNotice: 60, frequency: 'monthly' }
      },
      {
        type: 'coolant',
        name: 'Coolant System Service',
        description: 'Coolant flush and system inspection',
        intervalType: 'both',
        mileageInterval: 50000,
        timeInterval: 36,
        priority: 'medium',
        estimatedCost: { min: 100, max: 200 },
        isEnabled: true,
        notificationsEnabled: true,
        reminderSettings: { advanceNotice: 30, frequency: 'once' }
      },
      {
        type: 'battery',
        name: 'Battery Test',
        description: 'Battery and charging system test',
        intervalType: 'time',
        timeInterval: 24,
        priority: 'low',
        estimatedCost: { min: 20, max: 150 },
        isEnabled: true,
        notificationsEnabled: false,
        reminderSettings: { advanceNotice: 30, frequency: 'once' }
      }
    ]

    const items = baseItems.map((item, index) => {
      const lastServiceMileage = currentMileage - Math.floor(Math.random() * (item.mileageInterval || 10000))
      const lastServiceDate = new Date()
      lastServiceDate.setMonth(lastServiceDate.getMonth() - Math.floor(Math.random() * (item.timeInterval || 12)))

      const nextDueMileage = item.mileageInterval ? lastServiceMileage + item.mileageInterval : undefined
      const nextDueDate = item.timeInterval ? new Date(lastServiceDate.getTime() + (item.timeInterval * 30 * 24 * 60 * 60 * 1000)) : undefined

      return {
        ...item,
        id: `maintenance_${index}`,
        lastServiceMileage,
        lastServiceDate,
        nextDueMileage,
        nextDueDate
      }
    })

    setMaintenanceItems(items)
  }

  const getItemStatus = (item: MaintenanceItem): 'overdue' | 'due_soon' | 'upcoming' | 'current' => {
    const now = new Date()
    const mileageOverdue = item.nextDueMileage && currentMileage >= item.nextDueMileage
    const timeOverdue = item.nextDueDate && now >= item.nextDueDate

    if (mileageOverdue || timeOverdue) {
      return 'overdue'
    }

    const mileageBuffer = item.mileageInterval ? item.mileageInterval * 0.1 : 1000
    const timeBuffer = 30 * 24 * 60 * 60 * 1000 // 30 days

    const mileageDueSoon = item.nextDueMileage && (currentMileage + mileageBuffer) >= item.nextDueMileage
    const timeDueSoon = item.nextDueDate && (now.getTime() + timeBuffer) >= item.nextDueDate.getTime()

    if (mileageDueSoon || timeDueSoon) {
      return 'due_soon'
    }

    const mileageUpcoming = item.nextDueMileage && (currentMileage + (mileageBuffer * 2)) >= item.nextDueMileage
    const timeUpcoming = item.nextDueDate && (now.getTime() + (timeBuffer * 2)) >= item.nextDueDate.getTime()

    if (mileageUpcoming || timeUpcoming) {
      return 'upcoming'
    }

    return 'current'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#dc2626'
      case 'due_soon': return '#ea580c'
      case 'upcoming': return '#f59e0b'
      case 'current': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return 'warning'
      case 'due_soon': return 'time'
      case 'upcoming': return 'calendar'
      case 'current': return 'checkmark-circle'
      default: return 'help-circle'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return 'alert-circle'
      case 'high': return 'chevron-up'
      case 'medium': return 'remove'
      case 'low': return 'chevron-down'
      default: return 'help-circle'
    }
  }

  const formatNextDue = (item: MaintenanceItem) => {
    const parts = []
    
    if (item.nextDueMileage) {
      const mileageDiff = item.nextDueMileage - currentMileage
      parts.push(`${mileageDiff > 0 ? mileageDiff : 0} miles`)
    }
    
    if (item.nextDueDate) {
      const now = new Date()
      const timeDiff = Math.ceil((item.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      parts.push(`${timeDiff > 0 ? timeDiff : 0} days`)
    }
    
    return parts.join(' or ')
  }

  const handleScheduleService = (item: MaintenanceItem) => {
    Alert.alert(
      'Schedule Service',
      `Schedule ${item.name} for your ${vehicleInfo?.year} ${vehicleInfo?.make} ${vehicleInfo?.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule',
          onPress: () => {
            onScheduleService(item)
            Alert.alert('Service Scheduled', `${item.name} has been scheduled with a local service provider.`)
          }
        }
      ]
    )
  }

  const handleToggleReminder = (item: MaintenanceItem) => {
    const updatedItems = maintenanceItems.map(i => 
      i.id === item.id 
        ? { ...i, notificationsEnabled: !i.notificationsEnabled }
        : i
    )
    setMaintenanceItems(updatedItems)
    onUpdateReminder({ ...item, notificationsEnabled: !item.notificationsEnabled })
  }

  const sortedItems = [...maintenanceItems].sort((a, b) => {
    const statusOrder = { overdue: 0, due_soon: 1, upcoming: 2, current: 3 }
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    
    const aStatus = getItemStatus(a)
    const bStatus = getItemStatus(b)
    
    if (aStatus !== bStatus) {
      return statusOrder[aStatus] - statusOrder[bStatus]
    }
    
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const overdueCount = sortedItems.filter(item => getItemStatus(item) === 'overdue').length
  const dueSoonCount = sortedItems.filter(item => getItemStatus(item) === 'due_soon').length

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Maintenance Reminders</Text>
          <Text style={styles.headerSubtitle}>
            {vehicleInfo ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : 'Your Vehicle'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <View style={styles.notificationToggle}>
            <Text style={styles.notificationLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { borderLeftColor: '#dc2626' }]}>
          <Text style={styles.summaryNumber}>{overdueCount}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        
        <View style={[styles.summaryCard, { borderLeftColor: '#ea580c' }]}>
          <Text style={styles.summaryNumber}>{dueSoonCount}</Text>
          <Text style={styles.summaryLabel}>Due Soon</Text>
        </View>
        
        <View style={[styles.summaryCard, { borderLeftColor: '#16a34a' }]}>
          <Text style={styles.summaryNumber}>{currentMileage.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Current Miles</Text>
        </View>
      </View>

      {/* Maintenance Items List */}
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {sortedItems.map((item) => {
          const status = getItemStatus(item)
          const statusColor = getStatusColor(status)
          
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, { borderLeftColor: statusColor }]}
              onPress={() => {
                setSelectedItem(item)
                setShowReminderDetail(true)
              }}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
                    <Ionicons name={getStatusIcon(status) as any} size={16} color="#ffffff" />
                  </View>
                  
                  <View style={styles.itemTitleInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  </View>
                  
                  <View style={styles.priorityIndicator}>
                    <Ionicons 
                      name={getPriorityIcon(item.priority) as any} 
                      size={16} 
                      color={item.priority === 'critical' ? '#dc2626' : '#64748b'} 
                    />
                  </View>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Next Due:</Text>
                  <Text style={[styles.itemDetailValue, { color: statusColor }]}>
                    {formatNextDue(item)}
                  </Text>
                </View>
                
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Est. Cost:</Text>
                  <Text style={styles.itemDetailValue}>
                    ${item.estimatedCost.min} - ${item.estimatedCost.max}
                  </Text>
                </View>
              </View>

              <View style={styles.itemActions}>
                <TouchableOpacity 
                  style={styles.reminderToggle}
                  onPress={() => handleToggleReminder(item)}
                >
                  <Ionicons 
                    name={item.notificationsEnabled ? 'notifications' : 'notifications-off'} 
                    size={16} 
                    color={item.notificationsEnabled ? '#3b82f6' : '#9ca3af'} 
                  />
                  <Text style={[
                    styles.reminderToggleText,
                    { color: item.notificationsEnabled ? '#3b82f6' : '#9ca3af' }
                  ]}>
                    {item.notificationsEnabled ? 'Reminders On' : 'Reminders Off'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.scheduleButton, { backgroundColor: statusColor }]}
                  onPress={() => handleScheduleService(item)}
                >
                  <Text style={styles.scheduleButtonText}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Reminder Detail Modal */}
      <Modal visible={showReminderDetail} animationType="slide" presentationStyle="pageSheet">
        {selectedItem && (
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowReminderDetail(false)}
              >
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
              
              <Text style={styles.detailTitle}>{selectedItem.name}</Text>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => Alert.alert('Edit Reminder', 'Reminder editing functionality')}
              >
                <Ionicons name="create" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Service Information</Text>
                <Text style={styles.detailDescription}>{selectedItem.description}</Text>
                
                <View style={styles.detailInfoGrid}>
                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>Interval Type</Text>
                    <Text style={styles.detailInfoValue}>
                      {selectedItem.intervalType === 'both' ? 'Mileage & Time' : 
                       selectedItem.intervalType === 'mileage' ? 'Mileage Only' : 'Time Only'}
                    </Text>
                  </View>
                  
                  {selectedItem.mileageInterval && (
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Mileage Interval</Text>
                      <Text style={styles.detailInfoValue}>
                        Every {selectedItem.mileageInterval.toLocaleString()} miles
                      </Text>
                    </View>
                  )}
                  
                  {selectedItem.timeInterval && (
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.detailInfoLabel}>Time Interval</Text>
                      <Text style={styles.detailInfoValue}>
                        Every {selectedItem.timeInterval} months
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>Priority</Text>
                    <Text style={[
                      styles.detailInfoValue,
                      { color: selectedItem.priority === 'high' ? '#dc2626' : '#64748b' }
                    ]}>
                      {selectedItem.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Service History</Text>
                
                <View style={styles.historyItem}>
                  <Text style={styles.historyLabel}>Last Service</Text>
                  <Text style={styles.historyValue}>
                    {selectedItem.lastServiceDate?.toLocaleDateString()} at {selectedItem.lastServiceMileage?.toLocaleString()} miles
                  </Text>
                </View>
                
                <View style={styles.historyItem}>
                  <Text style={styles.historyLabel}>Next Due</Text>
                  <Text style={styles.historyValue}>
                    {selectedItem.nextDueDate?.toLocaleDateString()} or {selectedItem.nextDueMileage?.toLocaleString()} miles
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Reminder Settings</Text>
                
                <View style={styles.reminderSettings}>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Advance Notice</Text>
                    <Text style={styles.settingValue}>
                      {selectedItem.reminderSettings.advanceNotice} days before due
                    </Text>
                  </View>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Frequency</Text>
                    <Text style={styles.settingValue}>
                      {selectedItem.reminderSettings.frequency === 'once' ? 'One-time reminder' :
                       selectedItem.reminderSettings.frequency === 'weekly' ? 'Weekly reminders' :
                       'Monthly reminders'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.detailActions}>
              <TouchableOpacity 
                style={styles.detailScheduleButton}
                onPress={() => {
                  handleScheduleService(selectedItem)
                  setShowReminderDetail(false)
                }}
              >
                <Ionicons name="calendar" size={20} color="#ffffff" />
                <Text style={styles.detailScheduleButtonText}>Schedule Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  notificationToggle: {
    alignItems: 'center',
    gap: 4,
  },
  notificationLabel: {
    fontSize: 12,
    color: '#64748b',
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
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitleInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  priorityIndicator: {
    padding: 4,
  },
  itemDetails: {
    marginBottom: 12,
    gap: 6,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  itemDetailValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scheduleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  scheduleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 4,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  editButton: {
    padding: 4,
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailInfoGrid: {
    gap: 12,
  },
  detailInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailInfoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailInfoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  historyValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  reminderSettings: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  detailActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  detailScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  detailScheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})
