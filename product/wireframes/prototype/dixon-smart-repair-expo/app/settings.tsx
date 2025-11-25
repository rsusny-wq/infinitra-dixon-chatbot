import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SettingsPrivacyControls } from '../components/settings-privacy-controls'

export default function SettingsPage() {
  const handleSettingChanged = (settingId: string, value: any) => {
    console.log(`Setting ${settingId} changed to:`, value)
    
    // Handle specific setting changes
    switch (settingId) {
      case 'pushNotifications':
        if (!value) {
          Alert.alert(
            'Notifications Disabled',
            'You may miss important updates about your vehicle service. You can re-enable notifications anytime in settings.'
          )
        }
        break
      
      case 'locationServices':
        if (!value) {
          Alert.alert(
            'Location Services Disabled',
            'We won\'t be able to find nearby service providers automatically. You can still search manually.'
          )
        }
        break
      
      case 'dataCollection':
        if (!value) {
          Alert.alert(
            'Data Collection Disabled',
            'This may limit our ability to improve the diagnostic accuracy and service quality.'
          )
        }
        break
      
      case 'biometricAuth':
        if (value) {
          Alert.alert(
            'Biometric Authentication Enabled',
            'Your app is now secured with biometric authentication for enhanced security.'
          )
        }
        break
    }
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
          <Text style={styles.titleText}>Settings & Privacy</Text>
          <Text style={styles.subtitleText}>Manage your preferences and data</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => Alert.alert('Help', 'Settings help and support information')}
        >
          <Ionicons name="help-circle" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Settings & Privacy Controls */}
      <SettingsPrivacyControls onSettingChanged={handleSettingChanged} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748b',
  },
  helpButton: {
    padding: 8,
  },
})
