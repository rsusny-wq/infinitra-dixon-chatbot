import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface SettingsSection {
  id: string
  title: string
  items: SettingsItem[]
}

interface SettingsItem {
  id: string
  type: 'toggle' | 'select' | 'action' | 'info'
  title: string
  description?: string
  value?: boolean | string
  options?: string[]
  icon: string
  color?: string
  onPress?: () => void
}

interface SettingsPrivacyControlsProps {
  onSettingChanged: (settingId: string, value: any) => void
}

export function SettingsPrivacyControls({ onSettingChanged }: SettingsPrivacyControlsProps) {
  const [settings, setSettings] = useState<Record<string, any>>({
    // Notification Settings
    pushNotifications: true,
    maintenanceReminders: true,
    serviceUpdates: true,
    promotionalOffers: false,
    
    // Privacy Settings
    dataCollection: true,
    analyticsTracking: false,
    locationServices: true,
    crashReporting: true,
    
    // Communication Settings
    emailNotifications: true,
    smsNotifications: false,
    phoneCallUpdates: false,
    
    // Diagnostic Settings
    autoPhotoAnalysis: true,
    shareWithMechanics: true,
    diagnosticHistory: true,
    
    // Account Settings
    biometricAuth: false,
    autoLogin: true,
    sessionTimeout: '30',
  })

  const [showDataExport, setShowDataExport] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  const settingsSections: SettingsSection[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      items: [
        {
          id: 'pushNotifications',
          type: 'toggle',
          title: 'Push Notifications',
          description: 'Receive notifications on your device',
          value: settings.pushNotifications,
          icon: 'notifications',
          color: '#3b82f6'
        },
        {
          id: 'maintenanceReminders',
          type: 'toggle',
          title: 'Maintenance Reminders',
          description: 'Get reminded about upcoming maintenance',
          value: settings.maintenanceReminders,
          icon: 'calendar',
          color: '#16a34a'
        },
        {
          id: 'serviceUpdates',
          type: 'toggle',
          title: 'Service Updates',
          description: 'Updates about your service appointments',
          value: settings.serviceUpdates,
          icon: 'construct',
          color: '#ea580c'
        },
        {
          id: 'promotionalOffers',
          type: 'toggle',
          title: 'Promotional Offers',
          description: 'Special deals and discounts',
          value: settings.promotionalOffers,
          icon: 'pricetag',
          color: '#7c3aed'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      items: [
        {
          id: 'dataCollection',
          type: 'toggle',
          title: 'Data Collection',
          description: 'Allow collection of usage data to improve service',
          value: settings.dataCollection,
          icon: 'analytics',
          color: '#3b82f6'
        },
        {
          id: 'analyticsTracking',
          type: 'toggle',
          title: 'Analytics Tracking',
          description: 'Track app usage for analytics purposes',
          value: settings.analyticsTracking,
          icon: 'trending-up',
          color: '#16a34a'
        },
        {
          id: 'locationServices',
          type: 'toggle',
          title: 'Location Services',
          description: 'Use location to find nearby service providers',
          value: settings.locationServices,
          icon: 'location',
          color: '#dc2626'
        },
        {
          id: 'crashReporting',
          type: 'toggle',
          title: 'Crash Reporting',
          description: 'Automatically report app crashes',
          value: settings.crashReporting,
          icon: 'bug',
          color: '#f59e0b'
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication Preferences',
      items: [
        {
          id: 'emailNotifications',
          type: 'toggle',
          title: 'Email Notifications',
          description: 'Receive updates via email',
          value: settings.emailNotifications,
          icon: 'mail',
          color: '#3b82f6'
        },
        {
          id: 'smsNotifications',
          type: 'toggle',
          title: 'SMS Notifications',
          description: 'Receive updates via text message',
          value: settings.smsNotifications,
          icon: 'chatbubble',
          color: '#16a34a'
        },
        {
          id: 'phoneCallUpdates',
          type: 'toggle',
          title: 'Phone Call Updates',
          description: 'Receive important updates via phone call',
          value: settings.phoneCallUpdates,
          icon: 'call',
          color: '#ea580c'
        }
      ]
    },
    {
      id: 'diagnostic',
      title: 'Diagnostic Features',
      items: [
        {
          id: 'autoPhotoAnalysis',
          type: 'toggle',
          title: 'Auto Photo Analysis',
          description: 'Automatically analyze uploaded photos with AI',
          value: settings.autoPhotoAnalysis,
          icon: 'camera',
          color: '#7c3aed'
        },
        {
          id: 'shareWithMechanics',
          type: 'toggle',
          title: 'Share with Mechanics',
          description: 'Allow mechanics to access your diagnostic data',
          value: settings.shareWithMechanics,
          icon: 'people',
          color: '#16a34a'
        },
        {
          id: 'diagnosticHistory',
          type: 'toggle',
          title: 'Diagnostic History',
          description: 'Keep history of all diagnostic sessions',
          value: settings.diagnosticHistory,
          icon: 'time',
          color: '#3b82f6'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Account',
      items: [
        {
          id: 'biometricAuth',
          type: 'toggle',
          title: 'Biometric Authentication',
          description: 'Use fingerprint or face ID to unlock app',
          value: settings.biometricAuth,
          icon: 'finger-print',
          color: '#dc2626'
        },
        {
          id: 'autoLogin',
          type: 'toggle',
          title: 'Auto Login',
          description: 'Stay logged in between app sessions',
          value: settings.autoLogin,
          icon: 'log-in',
          color: '#16a34a'
        },
        {
          id: 'sessionTimeout',
          type: 'select',
          title: 'Session Timeout',
          description: 'Automatically log out after inactivity',
          value: settings.sessionTimeout,
          options: ['15', '30', '60', '120', 'Never'],
          icon: 'timer',
          color: '#f59e0b'
        }
      ]
    },
    {
      id: 'data_management',
      title: 'Data Management',
      items: [
        {
          id: 'exportData',
          type: 'action',
          title: 'Export My Data',
          description: 'Download a copy of your data',
          icon: 'download',
          color: '#3b82f6',
          onPress: () => setShowDataExport(true)
        },
        {
          id: 'clearCache',
          type: 'action',
          title: 'Clear Cache',
          description: 'Clear app cache and temporary files',
          icon: 'refresh',
          color: '#16a34a',
          onPress: () => handleClearCache()
        },
        {
          id: 'deleteAccount',
          type: 'action',
          title: 'Delete Account',
          description: 'Permanently delete your account and data',
          icon: 'trash',
          color: '#dc2626',
          onPress: () => setShowDeleteAccount(true)
        }
      ]
    },
    {
      id: 'about',
      title: 'About',
      items: [
        {
          id: 'version',
          type: 'info',
          title: 'App Version',
          description: '2.1.0 (Build 2024.12)',
          icon: 'information-circle',
          color: '#64748b'
        },
        {
          id: 'privacy_policy',
          type: 'action',
          title: 'Privacy Policy',
          description: 'View our privacy policy',
          icon: 'document-text',
          color: '#3b82f6',
          onPress: () => handleViewPrivacyPolicy()
        },
        {
          id: 'terms_of_service',
          type: 'action',
          title: 'Terms of Service',
          description: 'View terms of service',
          icon: 'document',
          color: '#3b82f6',
          onPress: () => handleViewTerms()
        }
      ]
    }
  ]

  const handleSettingChange = (settingId: string, value: any) => {
    setSettings(prev => ({ ...prev, [settingId]: value }))
    onSettingChanged(settingId, value)
  }

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and may improve app performance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Cache Cleared', 'App cache has been cleared successfully.')
          }
        }
      ]
    )
  }

  const handleViewPrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy would open in browser or in-app viewer.')
  }

  const handleViewTerms = () => {
    Alert.alert('Terms of Service', 'Terms of service would open in browser or in-app viewer.')
  }

  const handleDataExport = () => {
    Alert.alert(
      'Data Export Started',
      'Your data export has been initiated. You will receive an email with download instructions within 24 hours.',
      [{ text: 'OK', onPress: () => setShowDataExport(false) }]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Account deletion process initiated. You will receive confirmation via email.')
            setShowDeleteAccount(false)
          }
        }
      ]
    )
  }

  const renderSettingItem = (item: SettingsItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <View key={item.id} style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={20} color="#ffffff" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.settingDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <Switch
              value={item.value as boolean}
              onValueChange={(value) => handleSettingChange(item.id, value)}
              trackColor={{ false: '#d1d5db', true: item.color }}
              thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        )

      case 'select':
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                item.title,
                'Select timeout duration:',
                item.options?.map(option => ({
                  text: option === 'Never' ? option : `${option} minutes`,
                  onPress: () => handleSettingChange(item.id, option)
                })) || []
              )
            }}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={20} color="#ffffff" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.settingDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>
                {item.value === 'Never' ? 'Never' : `${item.value} min`}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        )

      case 'action':
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            onPress={item.onPress}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={20} color="#ffffff" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.settingDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )

      case 'info':
        return (
          <View key={item.id} style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={20} color="#ffffff" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.settingDescription}>{item.description}</Text>
                )}
              </View>
            </View>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Data Export Modal */}
      <Modal visible={showDataExport} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Export Your Data</Text>
            <Text style={styles.modalDescription}>
              We'll prepare a comprehensive export of your data including:
            </Text>
            
            <View style={styles.exportList}>
              <Text style={styles.exportItem}>• Vehicle information and history</Text>
              <Text style={styles.exportItem}>• Diagnostic sessions and results</Text>
              <Text style={styles.exportItem}>• Service records and invoices</Text>
              <Text style={styles.exportItem}>• Photos and attachments</Text>
              <Text style={styles.exportItem}>• Communication history</Text>
              <Text style={styles.exportItem}>• Maintenance reminders</Text>
            </View>
            
            <Text style={styles.modalNote}>
              The export will be sent to your registered email address within 24 hours.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDataExport(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleDataExport}
              >
                <Text style={styles.modalConfirmText}>Start Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteAccount} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={32} color="#dc2626" />
              <Text style={styles.modalTitle}>Delete Account</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              This action will permanently delete your account and all associated data:
            </Text>
            
            <View style={styles.deleteList}>
              <Text style={styles.deleteItem}>• All vehicle and diagnostic data</Text>
              <Text style={styles.deleteItem}>• Service history and invoices</Text>
              <Text style={styles.deleteItem}>• Photos and attachments</Text>
              <Text style={styles.deleteItem}>• Communication history</Text>
              <Text style={styles.deleteItem}>• Account preferences</Text>
            </View>
            
            <Text style={styles.warningNote}>
              This action cannot be undone. Consider exporting your data first.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteAccount(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalDeleteButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalDeleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  exportList: {
    marginBottom: 16,
  },
  exportItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  modalNote: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  warningHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteList: {
    marginBottom: 16,
  },
  deleteItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  warningNote: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 8,
  },
  modalDeleteText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
})
