import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export interface ServiceRecord {
  id: string
  diagnosticSessionId?: string
  conversationId?: string
  guidanceLevel: 'generic' | 'basic' | 'vin'
  diagnosticConfidence: number
  serviceDate: Date
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  urgency: 'immediate' | 'soon' | 'routine'
  estimatedTime: string
  recommendedServices: string[]
  vehicleInfo?: {
    year: number
    make: string
    model: string
    vin?: string
  }
  diagnosis?: {
    issue: string
    confidence: number
    description: string
  }
  cost?: {
    estimated: number
    actual?: number
  }
  mechanicNotes?: string
  customerNotes?: string
}

interface ServiceRecordProps {
  record: ServiceRecord
  onViewDiagnostic?: (diagnosticSessionId: string) => void
  onViewConversation?: (conversationId: string) => void
  onUpdateStatus?: (recordId: string, status: ServiceRecord['status']) => void
}

export function ServiceRecordComponent({ 
  record, 
  onViewDiagnostic, 
  onViewConversation,
  onUpdateStatus 
}: ServiceRecordProps) {
  const [expanded, setExpanded] = useState(false)

  const getStatusColor = (status: ServiceRecord['status']) => {
    switch (status) {
      case 'scheduled': return '#3b82f6'
      case 'in-progress': return '#f59e0b'
      case 'completed': return '#10b981'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getUrgencyColor = (urgency: ServiceRecord['urgency']) => {
    switch (urgency) {
      case 'immediate': return '#dc2626'
      case 'soon': return '#ea580c'
      case 'routine': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const getGuidanceLevelIcon = (level: ServiceRecord['guidanceLevel']) => {
    switch (level) {
      case 'generic': return 'flash'
      case 'basic': return 'car'
      case 'vin': return 'scan'
      default: return 'help-circle'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(record.status) }]} />
          <View style={styles.headerInfo}>
            <Text style={styles.serviceTitle}>
              {record.diagnosis?.issue || 'Service Appointment'}
            </Text>
            <Text style={styles.serviceDate}>
              {formatDate(record.serviceDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(record.urgency) }]}>
            <Text style={styles.urgencyText}>{record.urgency.toUpperCase()}</Text>
          </View>
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#64748b" 
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Vehicle Information */}
          {record.vehicleInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle</Text>
              <Text style={styles.vehicleInfo}>
                {record.vehicleInfo.year} {record.vehicleInfo.make} {record.vehicleInfo.model}
              </Text>
              {record.vehicleInfo.vin && (
                <Text style={styles.vinInfo}>VIN: {record.vehicleInfo.vin}</Text>
              )}
            </View>
          )}

          {/* Diagnostic Information */}
          {record.diagnosis && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Diagnostic Information</Text>
                <View style={styles.guidanceLevel}>
                  <Ionicons 
                    name={getGuidanceLevelIcon(record.guidanceLevel)} 
                    size={16} 
                    color="#64748b" 
                  />
                  <Text style={styles.guidanceLevelText}>
                    {record.guidanceLevel} guidance
                  </Text>
                </View>
              </View>
              
              <Text style={styles.diagnosisDescription}>
                {record.diagnosis.description}
              </Text>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Diagnostic Confidence:</Text>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceFill, 
                      { width: `${record.diagnosticConfidence}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.confidenceText}>{record.diagnosticConfidence}%</Text>
              </View>
            </View>
          )}

          {/* Recommended Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Services</Text>
            {record.recommendedServices.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>

          {/* Cost Information */}
          {record.cost && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost Estimate</Text>
              <Text style={styles.costText}>
                Estimated: ${record.cost.estimated.toFixed(2)}
              </Text>
              {record.cost.actual && (
                <Text style={styles.costText}>
                  Actual: ${record.cost.actual.toFixed(2)}
                </Text>
              )}
            </View>
          )}

          {/* Notes */}
          {(record.mechanicNotes || record.customerNotes) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              {record.mechanicNotes && (
                <View style={styles.noteItem}>
                  <Text style={styles.noteLabel}>Mechanic:</Text>
                  <Text style={styles.noteText}>{record.mechanicNotes}</Text>
                </View>
              )}
              {record.customerNotes && (
                <View style={styles.noteItem}>
                  <Text style={styles.noteLabel}>Customer:</Text>
                  <Text style={styles.noteText}>{record.customerNotes}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {record.diagnosticSessionId && onViewDiagnostic && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onViewDiagnostic(record.diagnosticSessionId!)}
              >
                <Ionicons name="medical" size={16} color="#3b82f6" />
                <Text style={styles.actionButtonText}>View Diagnostic</Text>
              </TouchableOpacity>
            )}
            
            {record.conversationId && onViewConversation && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onViewConversation(record.conversationId!)}
              >
                <Ionicons name="chatbubble" size={16} color="#3b82f6" />
                <Text style={styles.actionButtonText}>View Conversation</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  serviceDate: {
    fontSize: 14,
    color: '#64748b',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  vinInfo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  guidanceLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guidanceLevelText: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  diagnosisDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#64748b',
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
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  serviceText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  costText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    marginBottom: 4,
  },
  noteItem: {
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
})
