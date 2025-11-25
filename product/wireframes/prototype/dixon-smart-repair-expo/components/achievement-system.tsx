import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  color: string
  category: 'diagnostic' | 'maintenance' | 'engagement' | 'milestone' | 'special'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
  progress: {
    current: number
    target: number
  }
  isUnlocked: boolean
  unlockedDate?: Date
  requirements: string[]
  rewards: string[]
}

interface UserStats {
  totalDiagnostics: number
  accurateDiagnostics: number
  maintenanceCompleted: number
  photosUploaded: number
  servicesScheduled: number
  daysActive: number
  totalPoints: number
  currentStreak: number
  longestStreak: number
}

interface AchievementSystemProps {
  userStats: UserStats
  onAchievementUnlocked: (achievement: Achievement) => void
}

export function AchievementSystem({ userStats, onAchievementUnlocked }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAchievementDetail, setShowAchievementDetail] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [celebrationAnimation] = useState(new Animated.Value(0))

  useEffect(() => {
    generateAchievements()
  }, [userStats])

  const generateAchievements = () => {
    const baseAchievements: Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedDate'>[] = [
      // Diagnostic Achievements
      {
        id: 'first_diagnostic',
        title: 'First Steps',
        description: 'Complete your first diagnostic session',
        icon: 'medical',
        color: '#16a34a',
        category: 'diagnostic',
        tier: 'bronze',
        points: 50,
        requirements: ['Complete 1 diagnostic session'],
        rewards: ['50 points', 'Diagnostic badge']
      },
      {
        id: 'diagnostic_expert',
        title: 'Diagnostic Expert',
        description: 'Complete 10 diagnostic sessions',
        icon: 'school',
        color: '#3b82f6',
        category: 'diagnostic',
        tier: 'silver',
        points: 200,
        requirements: ['Complete 10 diagnostic sessions'],
        rewards: ['200 points', 'Expert badge', 'Priority support']
      },
      {
        id: 'accuracy_master',
        title: 'Accuracy Master',
        description: 'Achieve 90% diagnostic accuracy',
        icon: 'target',
        color: '#7c3aed',
        category: 'diagnostic',
        tier: 'gold',
        points: 500,
        requirements: ['Maintain 90% diagnostic accuracy', 'Complete at least 5 diagnostics'],
        rewards: ['500 points', 'Master badge', 'Premium features']
      },

      // Maintenance Achievements
      {
        id: 'maintenance_starter',
        title: 'Maintenance Starter',
        description: 'Schedule your first maintenance service',
        icon: 'construct',
        color: '#ea580c',
        category: 'maintenance',
        tier: 'bronze',
        points: 75,
        requirements: ['Schedule 1 maintenance service'],
        rewards: ['75 points', 'Maintenance badge']
      },
      {
        id: 'proactive_owner',
        title: 'Proactive Owner',
        description: 'Complete 5 scheduled maintenance services',
        icon: 'calendar-check',
        color: '#16a34a',
        category: 'maintenance',
        tier: 'silver',
        points: 300,
        requirements: ['Complete 5 maintenance services'],
        rewards: ['300 points', 'Proactive badge', '10% service discount']
      },
      {
        id: 'maintenance_guru',
        title: 'Maintenance Guru',
        description: 'Maintain perfect maintenance schedule for 6 months',
        icon: 'trophy',
        color: '#f59e0b',
        category: 'maintenance',
        tier: 'gold',
        points: 750,
        requirements: ['Perfect maintenance schedule', '6 months consistency'],
        rewards: ['750 points', 'Guru badge', '20% service discount']
      },

      // Engagement Achievements
      {
        id: 'photo_enthusiast',
        title: 'Photo Enthusiast',
        description: 'Upload 25 diagnostic photos',
        icon: 'camera',
        color: '#7c3aed',
        category: 'engagement',
        tier: 'bronze',
        points: 100,
        requirements: ['Upload 25 photos'],
        rewards: ['100 points', 'Photo badge']
      },
      {
        id: 'active_user',
        title: 'Active User',
        description: 'Use the app for 30 consecutive days',
        icon: 'flame',
        color: '#dc2626',
        category: 'engagement',
        tier: 'silver',
        points: 400,
        requirements: ['30-day activity streak'],
        rewards: ['400 points', 'Streak badge', 'Premium themes']
      },
      {
        id: 'community_helper',
        title: 'Community Helper',
        description: 'Share diagnostic insights with mechanics',
        icon: 'people',
        color: '#16a34a',
        category: 'engagement',
        tier: 'silver',
        points: 250,
        requirements: ['Share insights with 5 mechanics'],
        rewards: ['250 points', 'Helper badge', 'Community access']
      },

      // Milestone Achievements
      {
        id: 'point_collector',
        title: 'Point Collector',
        description: 'Earn 1,000 total points',
        icon: 'star',
        color: '#f59e0b',
        category: 'milestone',
        tier: 'silver',
        points: 0,
        requirements: ['Earn 1,000 total points'],
        rewards: ['Collector badge', 'Bonus multiplier']
      },
      {
        id: 'point_master',
        title: 'Point Master',
        description: 'Earn 5,000 total points',
        icon: 'diamond',
        color: '#7c3aed',
        category: 'milestone',
        tier: 'gold',
        points: 0,
        requirements: ['Earn 5,000 total points'],
        rewards: ['Master badge', '2x point multiplier', 'VIP support']
      },

      // Special Achievements
      {
        id: 'early_adopter',
        title: 'Early Adopter',
        description: 'One of the first 1000 users',
        icon: 'rocket',
        color: '#3b82f6',
        category: 'special',
        tier: 'platinum',
        points: 1000,
        requirements: ['Join in first 1000 users'],
        rewards: ['1000 points', 'Founder badge', 'Lifetime premium']
      },
      {
        id: 'perfect_week',
        title: 'Perfect Week',
        description: 'Complete all daily activities for a week',
        icon: 'checkmark-done',
        color: '#16a34a',
        category: 'special',
        tier: 'gold',
        points: 350,
        requirements: ['Complete daily activities for 7 days'],
        rewards: ['350 points', 'Perfect badge', 'Weekly bonus']
      }
    ]

    const processedAchievements = baseAchievements.map(achievement => {
      let progress = { current: 0, target: 1 }
      let isUnlocked = false
      let unlockedDate: Date | undefined

      // Calculate progress based on achievement type
      switch (achievement.id) {
        case 'first_diagnostic':
          progress = { current: userStats.totalDiagnostics, target: 1 }
          isUnlocked = userStats.totalDiagnostics >= 1
          break
        case 'diagnostic_expert':
          progress = { current: userStats.totalDiagnostics, target: 10 }
          isUnlocked = userStats.totalDiagnostics >= 10
          break
        case 'accuracy_master':
          const accuracy = userStats.totalDiagnostics > 0 ? (userStats.accurateDiagnostics / userStats.totalDiagnostics) * 100 : 0
          progress = { current: Math.round(accuracy), target: 90 }
          isUnlocked = accuracy >= 90 && userStats.totalDiagnostics >= 5
          break
        case 'maintenance_starter':
          progress = { current: userStats.servicesScheduled, target: 1 }
          isUnlocked = userStats.servicesScheduled >= 1
          break
        case 'proactive_owner':
          progress = { current: userStats.maintenanceCompleted, target: 5 }
          isUnlocked = userStats.maintenanceCompleted >= 5
          break
        case 'maintenance_guru':
          progress = { current: Math.min(userStats.daysActive / 30, 6), target: 6 }
          isUnlocked = userStats.daysActive >= 180 && userStats.maintenanceCompleted >= 6
          break
        case 'photo_enthusiast':
          progress = { current: userStats.photosUploaded, target: 25 }
          isUnlocked = userStats.photosUploaded >= 25
          break
        case 'active_user':
          progress = { current: userStats.currentStreak, target: 30 }
          isUnlocked = userStats.longestStreak >= 30
          break
        case 'community_helper':
          progress = { current: Math.min(userStats.totalDiagnostics, 5), target: 5 }
          isUnlocked = userStats.totalDiagnostics >= 5
          break
        case 'point_collector':
          progress = { current: userStats.totalPoints, target: 1000 }
          isUnlocked = userStats.totalPoints >= 1000
          break
        case 'point_master':
          progress = { current: userStats.totalPoints, target: 5000 }
          isUnlocked = userStats.totalPoints >= 5000
          break
        case 'early_adopter':
          progress = { current: 1, target: 1 }
          isUnlocked = true // Assume user is early adopter
          break
        case 'perfect_week':
          progress = { current: userStats.currentStreak, target: 7 }
          isUnlocked = userStats.currentStreak >= 7
          break
      }

      if (isUnlocked && !unlockedDate) {
        unlockedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      }

      return {
        ...achievement,
        progress,
        isUnlocked,
        unlockedDate
      }
    })

    setAchievements(processedAchievements)
  }

  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return '#cd7f32'
      case 'silver': return '#c0c0c0'
      case 'gold': return '#ffd700'
      case 'platinum': return '#e5e4e2'
      default: return '#64748b'
    }
  }

  const getTierIcon = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'medal'
      case 'silver': return 'medal'
      case 'gold': return 'trophy'
      case 'platinum': return 'diamond'
      default: return 'ribbon'
    }
  }

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)
  }

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  )

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalPoints = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0)

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'diagnostic', name: 'Diagnostic', icon: 'medical' },
    { id: 'maintenance', name: 'Maintenance', icon: 'construct' },
    { id: 'engagement', name: 'Engagement', icon: 'people' },
    { id: 'milestone', name: 'Milestones', icon: 'flag' },
    { id: 'special', name: 'Special', icon: 'star' }
  ]

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{unlockedCount}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalPoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={16} 
              color={selectedCategory === category.id ? '#ffffff' : '#64748b'} 
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView style={styles.achievementsList} showsVerticalScrollIndicator={false}>
        {filteredAchievements.map(achievement => (
          <TouchableOpacity
            key={achievement.id}
            style={[
              styles.achievementCard,
              achievement.isUnlocked && styles.achievementCardUnlocked
            ]}
            onPress={() => {
              setSelectedAchievement(achievement)
              setShowAchievementDetail(true)
            }}
          >
            <View style={styles.achievementHeader}>
              <View style={[
                styles.achievementIcon,
                { backgroundColor: achievement.isUnlocked ? achievement.color : '#e5e7eb' }
              ]}>
                <Ionicons 
                  name={achievement.icon as any} 
                  size={24} 
                  color={achievement.isUnlocked ? '#ffffff' : '#9ca3af'} 
                />
              </View>
              
              <View style={styles.achievementInfo}>
                <View style={styles.achievementTitleRow}>
                  <Text style={[
                    styles.achievementTitle,
                    !achievement.isUnlocked && styles.achievementTitleLocked
                  ]}>
                    {achievement.title}
                  </Text>
                  
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(achievement.tier) }]}>
                    <Ionicons name={getTierIcon(achievement.tier) as any} size={12} color="#ffffff" />
                  </View>
                </View>
                
                <Text style={[
                  styles.achievementDescription,
                  !achievement.isUnlocked && styles.achievementDescriptionLocked
                ]}>
                  {achievement.description}
                </Text>
              </View>
            </View>

            {!achievement.isUnlocked && (
              <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>
                    {achievement.progress.current} / {achievement.progress.target}
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round(getProgressPercentage(achievement))}%
                  </Text>
                </View>
                
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${getProgressPercentage(achievement)}%`,
                        backgroundColor: achievement.color
                      }
                    ]}
                  />
                </View>
              </View>
            )}

            {achievement.isUnlocked && (
              <View style={styles.unlockedSection}>
                <View style={styles.pointsEarned}>
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.pointsText}>+{achievement.points} points</Text>
                </View>
                
                {achievement.unlockedDate && (
                  <Text style={styles.unlockedDate}>
                    Unlocked {achievement.unlockedDate.toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal visible={showAchievementDetail} animationType="slide" presentationStyle="pageSheet">
        {selectedAchievement && (
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAchievementDetail(false)}
              >
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
              
              <Text style={styles.detailTitle}>Achievement Details</Text>
              
              <View style={styles.placeholder} />
            </View>
            
            <ScrollView style={styles.detailContent}>
              <View style={styles.detailAchievementHeader}>
                <View style={[
                  styles.detailAchievementIcon,
                  { backgroundColor: selectedAchievement.isUnlocked ? selectedAchievement.color : '#e5e7eb' }
                ]}>
                  <Ionicons 
                    name={selectedAchievement.icon as any} 
                    size={48} 
                    color={selectedAchievement.isUnlocked ? '#ffffff' : '#9ca3af'} 
                  />
                </View>
                
                <Text style={styles.detailAchievementTitle}>{selectedAchievement.title}</Text>
                <Text style={styles.detailAchievementDescription}>{selectedAchievement.description}</Text>
                
                <View style={styles.detailTierInfo}>
                  <View style={[styles.detailTierBadge, { backgroundColor: getTierColor(selectedAchievement.tier) }]}>
                    <Ionicons name={getTierIcon(selectedAchievement.tier) as any} size={16} color="#ffffff" />
                    <Text style={styles.detailTierText}>{selectedAchievement.tier.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Requirements</Text>
                {selectedAchievement.requirements.map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Rewards</Text>
                {selectedAchievement.rewards.map((reward, index) => (
                  <View key={index} style={styles.rewardItem}>
                    <Ionicons name="gift" size={16} color="#7c3aed" />
                    <Text style={styles.rewardText}>{reward}</Text>
                  </View>
                ))}
              </View>
              
              {!selectedAchievement.isUnlocked && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Progress</Text>
                  <View style={styles.detailProgressInfo}>
                    <Text style={styles.detailProgressText}>
                      {selectedAchievement.progress.current} / {selectedAchievement.progress.target}
                    </Text>
                    <Text style={styles.detailProgressPercentage}>
                      {Math.round(getProgressPercentage(selectedAchievement))}% Complete
                    </Text>
                  </View>
                  
                  <View style={styles.detailProgressBar}>
                    <View 
                      style={[
                        styles.detailProgressFill,
                        { 
                          width: `${getProgressPercentage(selectedAchievement)}%`,
                          backgroundColor: selectedAchievement.color
                        }
                      ]}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
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
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  categoryFilter: {
    maxHeight: 60,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  achievementsList: {
    flex: 1,
    padding: 16,
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    opacity: 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  achievementTitleLocked: {
    color: '#9ca3af',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  achievementDescriptionLocked: {
    color: '#9ca3af',
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  unlockedSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  pointsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  unlockedDate: {
    fontSize: 10,
    color: '#9ca3af',
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
  placeholder: {
    width: 32,
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailAchievementHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  detailAchievementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailAchievementTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailAchievementDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailTierInfo: {
    alignItems: 'center',
  },
  detailTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  detailTierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  rewardText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  detailProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailProgressText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  detailProgressPercentage: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailProgressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  detailProgressFill: {
    height: '100%',
  },
})
