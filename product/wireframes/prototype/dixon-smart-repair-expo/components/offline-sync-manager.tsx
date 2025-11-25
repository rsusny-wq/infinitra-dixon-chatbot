import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface SyncItem {
  id: string
  type: 'diagnostic' | 'photo' | 'message' | 'service' | 'maintenance'
  title: string
  description: string
  timestamp: Date
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
  size: number // in bytes
  retryCount: number
  lastAttempt?: Date
  conflictData?: {
    local: any
    remote: any
  }
}

interface NetworkStatus {
  isConnected: boolean
  connectionType: 'wifi' | 'cellular' | 'none'
  isMetered: boolean
  strength: 'excellent' | 'good' | 'fair' | 'poor'
}

interface OfflineSyncManagerProps {
  visible: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function OfflineSyncManager({ visible, onClose, onSyncComplete }: OfflineSyncManagerProps) {
  const [syncItems, setSyncItems] = useState<SyncItem[]>([])
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    connectionType: 'wifi',
    isMetered: false,
    strength: 'excellent'
  })
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [wifiOnlySync, setWifiOnlySync] = useState(false)
  const [showConflictResolution, setShowConflictResolution] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState<SyncItem | null>(null)

  useEffect(() => {
    generateMockSyncItems()
    simulateNetworkChanges()
  }, [])

  const generateMockSyncItems = () => {
    const mockItems: SyncItem[] = [
      {
        id: 'sync_001',
        type: 'diagnostic',
        title: 'Brake System Diagnostic',
        description: 'Complete diagnostic session with AI analysis',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'pending',
        size: 1024 * 150, // 150KB
        retryCount: 0
      },
      {
        id: 'sync_002',
        type: 'photo',
        title: 'Brake Pad Photos (3 images)',
        description: 'High-resolution diagnostic photos',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        status: 'synced',
        size: 1024 * 1024 * 2.5, // 2.5MB
        retryCount: 0
      },
      {
        id: 'sync_003',
        type: 'message',
        title: 'Mechanic Conversation',
        description: 'Chat messages with AutoCare Plus',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        status: 'failed',
        size: 1024 * 25, // 25KB
        retryCount: 2,
        lastAttempt: new Date(Date.now() - 10 * 60 * 1000)
      },
      {
        id: 'sync_004',
        type: 'service',
        title: 'Service Appointment Update',
        description: 'Scheduled maintenance reminder',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        status: 'conflict',
        size: 1024 * 5, // 5KB
        retryCount: 1,
        conflictData: {
          local: { scheduledDate: '2024-12-20', notes: 'Customer requested morning slot' },
          remote: { scheduledDate: '2024-12-21', notes: 'Shop suggested afternoon slot' }
        }
      },
      {
        id: 'sync_005',
        type: 'maintenance',
        title: 'Oil Change Reminder',
        description: 'Maintenance reminder settings update',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        status: 'syncing',
        size: 1024 * 8, // 8KB
        retryCount: 0
      }
    ]

    setSyncItems(mockItems)
  }

  const simulateNetworkChanges = () => {
    // Simulate network status changes
    const networkStates = [
      { isConnected: true, connectionType: 'wifi' as const, strength: 'excellent' as const },
      { isConnected: true, connectionType: 'cellular' as const, strength: 'good' as const },
      { isConnected: false, connectionType: 'none' as const, strength: 'poor' as const }
    ]

    let currentIndex = 0
    setInterval(() => {
      const state = networkStates[currentIndex % networkStates.length]
      setNetworkStatus(prev => ({
        ...prev,
        ...state,
        isMetered: state.connectionType === 'cellular'
      }))
      currentIndex++
    }, 10000) // Change every 10 seconds for demo
  }

  const getStatusColor = (status: SyncItem['status']) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'syncing': return '#3b82f6'
      case 'synced': return '#16a34a'
      case 'failed': return '#dc2626'
      case 'conflict': return '#7c3aed'
      default: return '#64748b'
    }
  }

  const getStatusIcon = (status: SyncItem['status']) => {
    switch (status) {
      case 'pending': return 'time'
      case 'syncing': return 'sync'
      case 'synced': return 'checkmark-circle'
      case 'failed': return 'warning'
      case 'conflict': return 'git-merge'
      default: return 'help-circle'
    }
  }

  const getTypeIcon = (type: SyncItem['type']) => {
    switch (type) {
      case 'diagnostic': return 'medical'
      case 'photo': return 'camera'
      case 'message': return 'chatbubble'
      case 'service': return 'calendar'
      case 'maintenance': return 'construct'
      default: return 'document'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSyncAll = async () => {
    if (!networkStatus.isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.')
      return
    }

    if (networkStatus.isMetered && wifiOnlySync) {
      Alert.alert(
        'Cellular Connection',
        'You have Wi-Fi only sync enabled. Connect to Wi-Fi to sync your data.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sync Anyway', onPress: () => performSync() }
        ]
      )
      return
    }

    performSync()
  }

  const performSync = async () => {
    setSyncInProgress(true)
    
    const pendingItems = syncItems.filter(item => 
      item.status === 'pending' || item.status === 'failed'
    )

    for (const item of pendingItems) {
      // Update status to syncing
      setSyncItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'syncing' } : i
      ))

      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Simulate success/failure
      const success = Math.random() > 0.2 // 80% success rate
      
      setSyncItems(prev => prev.map(i => 
        i.id === item.id 
          ? { 
              ...i, 
              status: success ? 'synced' : 'failed',
              retryCount: success ? 0 : i.retryCount + 1,
              lastAttempt: new Date()
            }
          : i
      ))
    }

    setSyncInProgress(false)
    onSyncComplete()
  }

  const handleRetryItem = async (item: SyncItem) => {
    setSyncItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, status: 'syncing' } : i
    ))

    // Simulate retry
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const success = Math.random() > 0.3 // 70% success rate on retry
    
    setSyncItems(prev => prev.map(i => 
      i.id === item.id 
        ? { 
            ...i, 
            status: success ? 'synced' : 'failed',
            retryCount: success ? 0 : i.retryCount + 1,
            lastAttempt: new Date()
          }
        : i
    ))
  }

  const handleResolveConflict = (item: SyncItem, resolution: 'local' | 'remote') => {
    Alert.alert(
      'Conflict Resolved',
      `Using ${resolution} version of the data.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setSyncItems(prev => prev.map(i => 
              i.id === item.id ? { ...i, status: 'synced', conflictData: undefined } : i
            ))
            setShowConflictResolution(false)
            setSelectedConflict(null)
          }
        }
      ]
    )
  }

  const pendingCount = syncItems.filter(item => 
    item.status === 'pending' || item.status === 'failed'
  ).length
  
  const conflictCount = syncItems.filter(item => item.status === 'conflict').length
  
  const totalSize = syncItems
    .filter(item => item.status === 'pending' || item.status === 'failed')
    .reduce((sum, item) => sum + item.size, 0)

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Offline Sync</Text>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => Alert.alert('Sync Settings', 'Sync preferences and configuration')}
          >
            <Ionicons name="settings" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Network Status */}
        <View style={styles.networkStatus}>
          <View style={styles.networkInfo}>
            <View style={[
              styles.networkIndicator,
              { backgroundColor: networkStatus.isConnected ? '#16a34a' : '#dc2626' }
            ]}>
              <Ionicons 
                name={networkStatus.isConnected ? 'wifi' : 'wifi-off'} 
                size={16} 
                color="#ffffff" 
              />
            </View>
            
            <View style={styles.networkDetails}>
              <Text style={styles.networkStatusText}>
                {networkStatus.isConnected 
                  ? `Connected via ${networkStatus.connectionType.toUpperCase()}`
                  : 'No Connection'
                }
              </Text>
              {networkStatus.isConnected && (
                <Text style={styles.networkStrength}>
                  Signal: {networkStatus.strength} • {networkStatus.isMetered ? 'Metered' : 'Unlimited'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Sync Summary */}
        <View style={styles.syncSummary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{conflictCount}</Text>
            <Text style={styles.summaryLabel}>Conflicts</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{formatFileSize(totalSize)}</Text>
            <Text style={styles.summaryLabel}>To Sync</Text>
          </View>
        </View>

        {/* Sync Items List */}
        <ScrollView style={styles.syncItemsList} showsVerticalScrollIndicator={false}>
          {syncItems.map(item => (
            <View key={item.id} style={styles.syncItemCard}>
              <View style={styles.syncItemHeader}>
                <View style={styles.syncItemInfo}>
                  <View style={styles.syncItemIconContainer}>
                    <Ionicons name={getTypeIcon(item.type) as any} size={20} color="#64748b" />
                  </View>
                  
                  <View style={styles.syncItemDetails}>
                    <Text style={styles.syncItemTitle}>{item.title}</Text>
                    <Text style={styles.syncItemDescription}>{item.description}</Text>
                    <Text style={styles.syncItemMeta}>
                      {item.timestamp.toLocaleString()} • {formatFileSize(item.size)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.syncItemStatus}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(item.status) }
                  ]}>
                    <Ionicons name={getStatusIcon(item.status) as any} size={16} color="#ffffff" />
                  </View>
                </View>
              </View>

              {item.status === 'failed' && (
                <View style={styles.failedItemActions}>
                  <Text style={styles.failedItemText}>
                    Failed to sync • Retry {item.retryCount}/3
                  </Text>
                  {item.lastAttempt && (
                    <Text style={styles.lastAttemptText}>
                      Last attempt: {item.lastAttempt.toLocaleTimeString()}
                    </Text>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => handleRetryItem(item)}
                  >
                    <Ionicons name="refresh" size={14} color="#3b82f6" />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'conflict' && (
                <View style={styles.conflictItemActions}>
                  <Text style={styles.conflictItemText}>
                    Sync conflict detected • Manual resolution required
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.resolveButton}
                    onPress={() => {
                      setSelectedConflict(item)
                      setShowConflictResolution(true)
                    }}
                  >
                    <Ionicons name="git-merge" size={14} color="#7c3aed" />
                    <Text style={styles.resolveButtonText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.syncAllButton,
              (!networkStatus.isConnected || syncInProgress) && styles.syncAllButtonDisabled
            ]}
            onPress={handleSyncAll}
            disabled={!networkStatus.isConnected || syncInProgress}
          >
            <Ionicons 
              name={syncInProgress ? "sync" : "cloud-upload"} 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.syncAllButtonText}>
              {syncInProgress ? 'Syncing...' : `Sync All (${pendingCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conflict Resolution Modal */}
        <Modal visible={showConflictResolution} transparent animationType="fade">
          {selectedConflict && (
            <View style={styles.conflictModalOverlay}>
              <View style={styles.conflictModalContent}>
                <Text style={styles.conflictModalTitle}>Resolve Sync Conflict</Text>
                <Text style={styles.conflictModalDescription}>
                  {selectedConflict.title} has conflicting changes. Choose which version to keep:
                </Text>
                
                <View style={styles.conflictOptions}>
                  <TouchableOpacity 
                    style={styles.conflictOption}
                    onPress={() => handleResolveConflict(selectedConflict, 'local')}
                  >
                    <View style={styles.conflictOptionHeader}>
                      <Ionicons name="phone-portrait" size={20} color="#3b82f6" />
                      <Text style={styles.conflictOptionTitle}>Keep Local Version</Text>
                    </View>
                    <Text style={styles.conflictOptionDescription}>
                      Use the version saved on this device
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.conflictOption}
                    onPress={() => handleResolveConflict(selectedConflict, 'remote')}
                  >
                    <View style={styles.conflictOptionHeader}>
                      <Ionicons name="cloud" size={20} color="#16a34a" />
                      <Text style={styles.conflictOptionTitle}>Keep Server Version</Text>
                    </View>
                    <Text style={styles.conflictOptionDescription}>
                      Use the version from the server
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.conflictCancelButton}
                  onPress={() => {
                    setShowConflictResolution(false)
                    setSelectedConflict(null)
                  }}
                >
                  <Text style={styles.conflictCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </Modal>
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
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  settingsButton: {
    padding: 4,
  },
  networkStatus: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  networkDetails: {
    flex: 1,
  },
  networkStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  networkStrength: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  syncSummary: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  syncItemsList: {
    flex: 1,
    padding: 16,
  },
  syncItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  syncItemDetails: {
    flex: 1,
  },
  syncItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 2,
  },
  syncItemDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  syncItemMeta: {
    fontSize: 10,
    color: '#9ca3af',
  },
  syncItemStatus: {
    marginLeft: 12,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedItemActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  failedItemText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    marginBottom: 4,
  },
  lastAttemptText: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    gap: 4,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  conflictItemActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  conflictItemText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
    marginBottom: 8,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#faf5ff',
    borderRadius: 6,
    gap: 4,
  },
  resolveButtonText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  actionButtons: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  syncAllButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  syncAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  conflictModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conflictModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  conflictModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  conflictModalDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  conflictOptions: {
    gap: 12,
    marginBottom: 24,
  },
  conflictOption: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  conflictOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  conflictOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  conflictOptionDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  conflictCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  conflictCancelText: {
    fontSize: 16,
    color: '#64748b',
  },
})
