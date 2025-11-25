import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MechanicReview } from '../components/mechanic-review'

// Mock diagnostic sessions for demonstration
const mockDiagnosticSessions = [
  {
    id: 'session_001',
    customerId: 'customer_123',
    conversationId: 'conv_456',
    vehicleInfo: {
      year: 2018,
      make: 'Toyota',
      model: 'Camry',
      vin: '1HGBH41JXMN109186'
    },
    guidanceLevel: 'vin' as const,
    symptoms: ['Brakes making squealing noise when stopping', 'Brake pedal feels soft'],
    aiDiagnosis: {
      primaryDiagnosis: {
        issue: 'Worn brake pads and possible brake fluid leak',
        confidence: 87,
        description: 'The squealing noise typically indicates worn brake pads, while the soft pedal suggests a brake fluid leak or air in the brake lines. This combination requires immediate attention for safety.'
      },
      alternativeDiagnoses: [
        {
          issue: 'Warped brake rotors',
          confidence: 65,
          description: 'Could be causing noise and pedal issues'
        },
        {
          issue: 'Brake caliper malfunction',
          confidence: 45,
          description: 'Less likely but possible cause of soft pedal'
        }
      ],
      recommendedActions: [
        'Inspect brake pads for wear',
        'Check brake fluid level and condition',
        'Test brake system for leaks',
        'Examine brake rotors for warping'
      ]
    },
    estimatedCost: {
      min: 250,
      max: 450,
      description: 'Brake pad replacement and fluid service'
    },
    urgency: 'high' as const,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 'session_002',
    customerId: 'customer_789',
    conversationId: 'conv_012',
    vehicleInfo: {
      year: 2020,
      make: 'Honda',
      model: 'Civic'
    },
    guidanceLevel: 'basic' as const,
    symptoms: ['Engine making rattling noise on startup', 'Noise goes away after warming up'],
    aiDiagnosis: {
      primaryDiagnosis: {
        issue: 'Cold start engine rattle - likely timing chain or VVT system',
        confidence: 72,
        description: 'Rattling noise on cold start that disappears when warm is commonly related to timing chain stretch or Variable Valve Timing (VVT) system issues in Honda engines.'
      },
      alternativeDiagnoses: [
        {
          issue: 'Low oil pressure on startup',
          confidence: 58,
          description: 'Could cause temporary rattling until oil circulates'
        }
      ],
      recommendedActions: [
        'Check engine oil level and condition',
        'Inspect timing chain tension',
        'Diagnose VVT system operation',
        'Listen to engine with stethoscope'
      ]
    },
    estimatedCost: {
      min: 150,
      max: 800,
      description: 'Diagnosis and potential timing chain service'
    },
    urgency: 'medium' as const,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  }
]

export default function MechanicDashboard() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [reviewedSessions, setReviewedSessions] = useState<string[]>([])

  const handleReviewApprove = (review: any) => {
    console.log('Approved review:', review)
    setReviewedSessions(prev => [...prev, review.sessionId])
    setSelectedSession(null)
    // In real app, would send to backend
  }

  const handleReviewReject = (review: any) => {
    console.log('Rejected review:', review)
    setReviewedSessions(prev => [...prev, review.sessionId])
    setSelectedSession(null)
    // In real app, would send to backend
  }

  const handleRequestMoreInfo = (request: any) => {
    console.log('Info request:', request)
    // In real app, would send request to customer
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const getGuidanceLevelInfo = (level: string) => {
    switch (level) {
      case 'generic':
        return { icon: 'flash', label: 'Generic', color: '#16a34a' }
      case 'basic':
        return { icon: 'car', label: 'Basic Info', color: '#ea580c' }
      case 'vin':
        return { icon: 'scan', label: 'VIN-Based', color: '#7c3aed' }
      default:
        return { icon: 'help-circle', label: 'Unknown', color: '#6b7280' }
    }
  }

  if (selectedSession) {
    const session = mockDiagnosticSessions.find(s => s.id === selectedSession)
    if (session) {
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setSelectedSession(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
              <Text style={styles.backText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
          
          <MechanicReview
            diagnosticSession={session}
            onApprove={handleReviewApprove}
            onReject={handleReviewReject}
            onRequestMoreInfo={handleRequestMoreInfo}
          />
        </View>
      )
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mechanic Dashboard</Text>
        <Text style={styles.subtitle}>Diagnostic Reviews Pending</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockDiagnosticSessions.length}</Text>
          <Text style={styles.statLabel}>Pending Reviews</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reviewedSessions.length}</Text>
          <Text style={styles.statLabel}>Completed Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {mockDiagnosticSessions.filter(s => s.urgency === 'high' || s.urgency === 'critical').length}
          </Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>
      </View>

      {/* Diagnostic Sessions List */}
      <ScrollView style={styles.sessionsList}>
        {mockDiagnosticSessions.map((session) => {
          const isReviewed = reviewedSessions.includes(session.id)
          const guidanceInfo = getGuidanceLevelInfo(session.guidanceLevel)
          
          return (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, isReviewed && styles.reviewedCard]}
              onPress={() => !isReviewed && setSelectedSession(session.id)}
              disabled={isReviewed}
            >
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>
                    {session.aiDiagnosis.primaryDiagnosis.issue}
                  </Text>
                  <Text style={styles.sessionVehicle}>
                    {session.vehicleInfo ? 
                      `${session.vehicleInfo.year} ${session.vehicleInfo.make} ${session.vehicleInfo.model}` :
                      'Vehicle info limited'
                    }
                  </Text>
                  <Text style={styles.sessionTime}>
                    {session.createdAt.toLocaleTimeString()} - Customer: {session.customerId}
                  </Text>
                </View>
                
                <View style={styles.sessionBadges}>
                  <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(session.urgency) }]}>
                    <Text style={styles.urgencyText}>{session.urgency.toUpperCase()}</Text>
                  </View>
                  
                  <View style={[styles.guidanceBadge, { backgroundColor: guidanceInfo.color }]}>
                    <Ionicons name={guidanceInfo.icon as any} size={12} color="#ffffff" />
                    <Text style={styles.guidanceText}>{guidanceInfo.label}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.sessionDetails}>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>AI Confidence:</Text>
                  <View style={styles.confidenceBar}>
                    <View 
                      style={[
                        styles.confidenceFill, 
                        { width: `${session.aiDiagnosis.primaryDiagnosis.confidence}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.confidenceText}>
                    {session.aiDiagnosis.primaryDiagnosis.confidence}%
                  </Text>
                </View>

                <View style={styles.costContainer}>
                  <Text style={styles.costLabel}>Estimated Cost:</Text>
                  <Text style={styles.costText}>
                    ${session.estimatedCost.min} - ${session.estimatedCost.max}
                  </Text>
                </View>
              </View>

              <View style={styles.sessionFooter}>
                {isReviewed ? (
                  <View style={styles.reviewedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text style={styles.reviewedText}>Reviewed</Text>
                  </View>
                ) : (
                  <View style={styles.actionIndicator}>
                    <Ionicons name="medical" size={16} color="#3b82f6" />
                    <Text style={styles.actionText}>Tap to Review</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
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
  sessionsList: {
    flex: 1,
    padding: 16,
  },
  sessionCard: {
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
  reviewedCard: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  sessionVehicle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: '#64748b',
  },
  sessionBadges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  guidanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  guidanceText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 80,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  confidenceText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    width: 35,
    textAlign: 'right',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  costLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 80,
  },
  costText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
})
