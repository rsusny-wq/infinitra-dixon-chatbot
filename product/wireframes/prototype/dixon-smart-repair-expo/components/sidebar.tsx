import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { shadows } from '../constants/styles'
import { useChatStore } from '../store/chat-store-simple'

const { width } = Dimensions.get('window')

interface SidebarProps {
  visible: boolean
  onClose: () => void
  onOpenCommunicationHub?: () => void
}

export default function Sidebar({ visible, onClose, onOpenCommunicationHub }: SidebarProps) {
  const [slideAnim] = useState(new Animated.Value(-width * 0.8))
  
  // Get conversation history from store
  const { 
    sessionHistory, 
    currentSession, 
    loadSession, 
    deleteSession, 
    createNewSession 
  } = useChatStore()

  // Animate sidebar in/out
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -width * 0.8,
      duration: 300,
      useNativeDriver: false, // Disabled for web compatibility
    }).start()
  }, [visible])

  const handleNavigation = (route: string) => {
    onClose()
    router.push(route as any)
  }

  const handleConversationSelect = (sessionId: string) => {
    if (sessionId !== currentSession?.id) {
      loadSession(sessionId)
    }
    onClose()
  }

  const handleNewConversation = () => {
    createNewSession()
    onClose()
  }

  const handleDeleteConversation = (sessionId: string, event: any) => {
    event.stopPropagation()
    deleteSession(sessionId)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      >
        {/* Sidebar */}
        <Animated.View 
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Header */}
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Dixon Smart Repair</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
              {/* New Conversation Button */}
              <TouchableOpacity 
                style={styles.newConversationButton}
                onPress={handleNewConversation}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.newConversationText}>New Conversation</Text>
              </TouchableOpacity>

              {/* Conversations Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Conversations</Text>
                {sessionHistory.length === 0 ? (
                  <Text style={styles.emptyText}>No conversations yet</Text>
                ) : (
                  sessionHistory.map((session) => (
                    <TouchableOpacity
                      key={session.id}
                      style={[
                        styles.conversationItem,
                        currentSession?.id === session.id && styles.activeConversation
                      ]}
                      onPress={() => handleConversationSelect(session.id)}
                    >
                      <View style={styles.conversationContent}>
                        <Text style={styles.conversationTitle} numberOfLines={1}>
                          {session.title}
                        </Text>
                        <Text style={styles.conversationDate}>
                          {formatDate(session.updatedAt)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => handleDeleteConversation(session.id, e)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#999" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Automotive Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Automotive</Text>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/vehicles')}
                >
                  <Ionicons name="car" size={20} color="#1e40af" style={styles.menuIcon} />
                  <Text style={styles.menuText}>My Vehicles</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/service-history')}
                >
                  <Ionicons name="build" size={20} color="#1e40af" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Service History</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/maintenance-reminders')}
                >
                  <Ionicons name="calendar" size={20} color="#16a34a" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Maintenance Reminders</Text>
                  <View style={styles.newFeatureBadge}>
                    <Text style={styles.newFeatureText}>NEW</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/achievements')}
                >
                  <Ionicons name="trophy" size={20} color="#f59e0b" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Achievements</Text>
                  <View style={styles.newFeatureBadge}>
                    <Text style={styles.newFeatureText}>NEW</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/settings')}
                >
                  <Ionicons name="settings" size={20} color="#64748b" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Settings & Privacy</Text>
                  <View style={styles.newFeatureBadge}>
                    <Text style={styles.newFeatureText}>NEW</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    onClose()
                    onOpenCommunicationHub?.()
                  }}
                >
                  <Ionicons name="chatbubbles" size={20} color="#1e40af" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Messages</Text>
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>1</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/invoices')}
                >
                  <Ionicons name="receipt" size={20} color="#1e40af" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Past Invoices</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/mechanics')}
                >
                  <Ionicons name="location" size={20} color="#1e40af" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Preferred Mechanics</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/reminders')}
                >
                  <Ionicons name="calendar" size={20} color="#1e40af" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Maintenance Reminders</Text>
                </TouchableOpacity>
              </View>

              {/* Account Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/settings')}
                >
                  <Ionicons name="settings" size={20} color="#1e40af" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/profile')}
                >
                  <Ionicons name="person" size={20} color="#1e40af" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Profile</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.8,
    backgroundColor: '#ffffff',
    flex: 1,
    ...shadows.large,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#1e40af',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarContent: {
    flex: 1,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 20,
    paddingBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // New Conversation Button
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  newConversationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Conversation Item Styles
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 12,
    color: '#64748b',
  },
  activeConversation: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  
  // Menu Item Styles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 56, // Large touch target for automotive use
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  newFeatureBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  newFeatureText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
})
