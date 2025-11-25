import React, { useState } from 'react'
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
import { MaintenanceReminderSystem } from '../components/maintenance-reminder-system'

export default function MaintenanceRemindersPage() {
  const [vehicleInfo] = useState({
    year: 2020,
    make: 'Honda',
    model: 'Civic',
    mileage: 75000,
    vin: '1HGBH41JXMN109186'
  })

  const handleScheduleService = (item: any) => {
    // Integration with service booking system
    Alert.alert(
      'Service Scheduled',
      `${item.name} has been scheduled. You'll receive confirmation details shortly.`,
      [
        { text: 'OK' },
        { 
          text: 'View Services', 
          onPress: () => router.push('/service-history')
        }
      ]
    )
  }

  const handleUpdateReminder = (item: any) => {
    // Update reminder preferences
    console.log('Reminder updated:', item)
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
          <Text style={styles.titleText}>Maintenance Reminders</Text>
          <Text style={styles.subtitleText}>Smart scheduling for your vehicle</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Alert.alert('Settings', 'Reminder settings and preferences')}
        >
          <Ionicons name="settings" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Maintenance Reminder System */}
      <MaintenanceReminderSystem
        vehicleInfo={vehicleInfo}
        onScheduleService={handleScheduleService}
        onUpdateReminder={handleUpdateReminder}
      />
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
  settingsButton: {
    padding: 8,
  },
})
