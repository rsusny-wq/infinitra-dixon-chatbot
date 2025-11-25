import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MechanicCustomerChat } from './mechanic-customer-chat'

interface CommunicationThread {
  id: string
  serviceRecordId: string
  mechanicId: string
  mechanicName: string
  shopName: string
  vehicleInfo: {
    year: number
    make: string
    model: string
    vin?: string
  }
  diagnosis: {
    issue: string
    confidence: number
    description: string
  }
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  lastMessage: {
    content: string
    timestamp: Date
    senderType: 'customer' | 'mechanic'
  }
  unreadCount: number
  priority: 'low' | 'medium' | 'high'
}

interface CommunicationHubProps {
  customerId: string
  onClose: () => void
}

export function CommunicationHub({ customerId, onClose }: CommunicationHubProps) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [threads] = useState<CommunicationThread[]>([
    {
      id: 'thread_001',
      serviceRecordId: 'service_001',
      mechanicId: 'mechanic_001',
      mechanicName: 'Mike Johnson',
      shopName: 'AutoCare Plus',
      vehicleInfo: {
        year: 2018,
        make: 'Toyota',
        model: 'Camry',
        vin: '1HGBH41JXMN109186'
      },
      diagnosis: {
        issue: 'Worn brake pads and brake fluid leak',
        confidence: 87,
        description: 'Squealing noise and soft pedal indicate brake system issues'
      },
      status: 'scheduled',
      lastMessage: {
        content: 'Your appointment is confirmed for tomorrow at 10 AM. We\'ll check both the brake pads and fluid system.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        senderType: 'mechanic'
      },
      unreadCount: 1,
      priority: 'high'
    },
    {
      id: 'thread_002',
      serviceRecordId: 'service_002',
      mechanicId: 'mechanic_002',
      mechanicName: 'Sarah Chen',
      shopName: 'Precision Auto',
      vehicleInfo: {
        year: 2020,
        make: 'Honda',
        model: 'Civic'
      },
      diagnosis: {
        issue: 'VVT actuator replacement needed',
        confidence: 72,
        description: 'Engine rattling on startup - mechanic updated diagnosis from AI timing chain assessment'
      },
      status: 'in-progress',
      lastMessage: {
        content: 'We\'ve started the VVT actuator replacement. Should be ready by 3 PM today.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        senderType: 'mechanic'
      },
      unreadCount: 0,
      priority: 'medium'
    },
    {
      id: 'thread_003',
      serviceRecordId: 'service_003',
      mechanicId: 'mechanic_003',
      mechanicName: 'Tom Rodriguez',
      shopName: 'Downtown Garage',
      vehicleInfo: {
        year: 2019,
        make: 'Ford',
        model: 'F-150'
      },
      diagnosis: {
        issue: 'Brake caliper sticking',
        confidence: 65,
        description: 'Truck pulling to right when braking - AI diagnosis confirmed'
      },
      status: 'completed',
      lastMessage: {
        content: 'Service completed! Your F-150 is ready for pickup. The brake caliper has been rebuilt and tested.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        senderType: 'mechanic'
      },
      unreadCount: 0,
      priority: 'low'
    }
  ])

  const handleSendMessage = (message: any) => {
    console.log('Sending message:', message)
    // In real app, would send to backend
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6'
      case 'in-progress': return '#f59e0b'
      case 'completed': return '#16a34a'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626'
      case 'medium': return '#f59e0b'
      case 'low': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const formatTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString()
  }

  if (selectedThread) {
    const thread = threads.find(t => t.id === selectedThread)
    if (thread) {
      return (
        <MechanicCustomerChat
          serviceContext={{
            serviceRecordId: thread.serviceRecordId,
            vehicleInfo: thread.vehicleInfo,
            diagnosis: thread.diagnosis,
            status: thread.status,
            mechanic: {
              name: thread.mechanicName,
              shop: thread.shopName,
              phone: '(555) 123-4567'
            }
          }}
          customerId={customerId}
          mechanicId={thread.mechanicId}
          onSendMessage={handleSendMessage}
          onClose={() => setSelectedThread(null)}
        />
      )
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            {threads.filter(t => t.unreadCount > 0).length} unread conversations
          </Text>
        </View>
        
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="add" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Thread List */}
      <ScrollView style={styles.threadsList}>
        {threads.map((thread) => (
          <TouchableOpacity
            key={thread.id}
            style={[
              styles.threadCard,
              thread.unreadCount > 0 && styles.unreadThread
            ]}
            onPress={() => setSelectedThread(thread.id)}
          >
            {/* Thread Header */}
            <View style={styles.threadHeader}>
              <View style={styles.threadInfo}>
                <View style={styles.threadTitleRow}>
                  <Text style={styles.mechanicName}>{thread.mechanicName}</Text>
                  <View style={styles.threadBadges}>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(thread.priority) }]} />
                    {thread.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{thread.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <Text style={styles.shopName}>{thread.shopName}</Text>
                <Text style={styles.vehicleInfo}>
                  {thread.vehicleInfo.year} {thread.vehicleInfo.make} {thread.vehicleInfo.model}
                </Text>
              </View>
            </View>

            {/* Service Context */}
            <View style={styles.serviceContext}>
              <View style={styles.serviceInfo}>
                <Ionicons name="medical" size={14} color="#3b82f6" />
                <Text style={styles.serviceIssue} numberOfLines={1}>
                  {thread.diagnosis.issue}
                </Text>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(thread.status) }]}>
                <Text style={styles.statusText}>{thread.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Last Message */}
            <View style={styles.lastMessage}>
              <Text 
                style={[
                  styles.messagePreview,
                  thread.unreadCount > 0 && styles.unreadMessagePreview
                ]} 
                numberOfLines={2}
              >
                {thread.lastMessage.content}
              </Text>
              
              <View style={styles.messageFooter}>
                <Text style={styles.messageTime}>
                  {formatTime(thread.lastMessage.timestamp)}
                </Text>
                <Ionicons 
                  name={thread.lastMessage.senderType === 'mechanic' ? 'person' : 'person-outline'} 
                  size={12} 
                  color="#64748b" 
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="call" size={20} color="#3b82f6" />
          <Text style={styles.quickActionText}>Call Shop</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="calendar" size={20} color="#3b82f6" />
          <Text style={styles.quickActionText}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="location" size={20} color="#3b82f6" />
          <Text style={styles.quickActionText}>Directions</Text>
        </TouchableOpacity>
      </View>
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
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 12,
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
  newMessageButton: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
  },
  threadsList: {
    flex: 1,
    padding: 16,
  },
  threadCard: {
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
  unreadThread: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  threadHeader: {
    marginBottom: 12,
  },
  threadInfo: {
    flex: 1,
  },
  threadTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mechanicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  threadBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unreadBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  shopName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#64748b',
  },
  serviceContext: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIssue: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  lastMessage: {
    marginTop: 8,
  },
  messagePreview: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 6,
  },
  unreadMessagePreview: {
    color: '#374151',
    fontWeight: '500',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    color: '#64748b',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
})
