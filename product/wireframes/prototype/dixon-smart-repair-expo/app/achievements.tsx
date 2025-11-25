import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { AchievementSystem } from '../components/achievement-system'

export default function AchievementsPage() {
  const mockUserStats = {
    totalDiagnostics: 8,
    accurateDiagnostics: 7,
    maintenanceCompleted: 3,
    photosUploaded: 15,
    servicesScheduled: 4,
    daysActive: 45,
    totalPoints: 850,
    currentStreak: 12,
    longestStreak: 18
  }

  const handleAchievementUnlocked = (achievement: any) => {
    console.log('Achievement unlocked:', achievement)
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
          <Text style={styles.titleText}>Achievements</Text>
          <Text style={styles.subtitleText}>Track your progress and earn rewards</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.leaderboardButton}
          onPress={() => console.log('Leaderboard')}
        >
          <Ionicons name="trophy" size={24} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      {/* Achievement System */}
      <AchievementSystem
        userStats={mockUserStats}
        onAchievementUnlocked={handleAchievementUnlocked}
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
  leaderboardButton: {
    padding: 8,
  },
})
