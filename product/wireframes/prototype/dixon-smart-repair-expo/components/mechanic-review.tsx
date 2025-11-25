import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface MechanicReviewProps {
  diagnosticSession: DiagnosticSession
  onApprove: (review: MechanicReview) => void
  onReject: (review: MechanicReview) => void
  onRequestMoreInfo: (request: InfoRequest) => void
}

interface DiagnosticSession {
  id: string
  customerId: string
  conversationId: string
  vehicleInfo?: {
    year: number
    make: string
    model: string
    vin?: string
  }
  guidanceLevel: 'generic' | 'basic' | 'vin'
  symptoms: string[]
  aiDiagnosis: {
    primaryDiagnosis: {
      issue: string
      confidence: number
      description: string
    }
    alternativeDiagnoses: Array<{
      issue: string
      confidence: number
      description: string
    }>
    recommendedActions: string[]
  }
  estimatedCost: {
    min: number
    max: number
    description: string
  }
  urgency: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
}

interface MechanicReview {
  sessionId: string
  mechanicId: string
  status: 'approved' | 'rejected' | 'modified'
  modifiedDiagnosis?: {
    issue: string
    confidence: number
    description: string
    reasoning: string
  }
  modifiedCost?: {
    min: number
    max: number
    description: string
    reasoning: string
  }
  mechanicNotes: string
  recommendedUrgency?: 'low' | 'medium' | 'high' | 'critical'
  additionalServices?: string[]
  reviewedAt: Date
}

interface InfoRequest {
  sessionId: string
  mechanicId: string
  requestType: 'vehicle_info' | 'symptoms' | 'photos' | 'diagnostic_data'
  message: string
  urgency: 'low' | 'medium' | 'high'
}

export function MechanicReview({ 
  diagnosticSession, 
  onApprove, 
  onReject, 
  onRequestMoreInfo 
}: MechanicReviewProps) {
  const [reviewMode, setReviewMode] = useState<'review' | 'modify' | 'request_info'>('review')
  const [mechanicNotes, setMechanicNotes] = useState('')
  const [modifiedDiagnosis, setModifiedDiagnosis] = useState(diagnosticSession.aiDiagnosis.primaryDiagnosis.issue)
  const [modifiedDescription, setModifiedDescription] = useState(diagnosticSession.aiDiagnosis.primaryDiagnosis.description)
  const [modifiedConfidence, setModifiedConfidence] = useState(diagnosticSession.aiDiagnosis.primaryDiagnosis.confidence)
  const [modifiedCostMin, setModifiedCostMin] = useState(diagnosticSession.estimatedCost.min.toString())
  const [modifiedCostMax, setModifiedCostMax] = useState(diagnosticSession.estimatedCost.max.toString())
  const [modifiedUrgency, setModifiedUrgency] = useState(diagnosticSession.urgency)
  const [infoRequestMessage, setInfoRequestMessage] = useState('')
  const [infoRequestType, setInfoRequestType] = useState<InfoRequest['requestType']>('vehicle_info')

  const getGuidanceLevelInfo = (level: 'generic' | 'basic' | 'vin') => {
    switch (level) {
      case 'generic':
        return { icon: 'flash', label: 'Generic Guidance', color: '#16a34a' }
      case 'basic':
        return { icon: 'car', label: 'Basic Vehicle Info', color: '#ea580c' }
      case 'vin':
        return { icon: 'scan', label: 'VIN-Based Guidance', color: '#7c3aed' }
    }
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

  const handleApprove = () => {
    const review: MechanicReview = {
      sessionId: diagnosticSession.id,
      mechanicId: 'mechanic_001', // Mock mechanic ID
      status: 'approved',
      mechanicNotes,
      reviewedAt: new Date()
    }
    onApprove(review)
  }

  const handleModifyAndApprove = () => {
    const review: MechanicReview = {
      sessionId: diagnosticSession.id,
      mechanicId: 'mechanic_001',
      status: 'modified',
      modifiedDiagnosis: {
        issue: modifiedDiagnosis,
        confidence: modifiedConfidence,
        description: modifiedDescription,
        reasoning: mechanicNotes
      },
      modifiedCost: {
        min: parseFloat(modifiedCostMin),
        max: parseFloat(modifiedCostMax),
        description: `Updated cost estimate based on mechanic review`,
        reasoning: mechanicNotes
      },
      mechanicNotes,
      recommendedUrgency: modifiedUrgency,
      reviewedAt: new Date()
    }
    onApprove(review)
  }

  const handleReject = () => {
    if (!mechanicNotes.trim()) {
      Alert.alert('Notes Required', 'Please provide notes explaining why this diagnosis is being rejected.')
      return
    }

    const review: MechanicReview = {
      sessionId: diagnosticSession.id,
      mechanicId: 'mechanic_001',
      status: 'rejected',
      mechanicNotes,
      reviewedAt: new Date()
    }
    onReject(review)
  }

  const handleRequestMoreInfo = () => {
    if (!infoRequestMessage.trim()) {
      Alert.alert('Message Required', 'Please provide a message explaining what additional information is needed.')
      return
    }

    const request: InfoRequest = {
      sessionId: diagnosticSession.id,
      mechanicId: 'mechanic_001',
      requestType: infoRequestType,
      message: infoRequestMessage,
      urgency: 'medium'
    }
    onRequestMoreInfo(request)
    setInfoRequestMessage('')
    setReviewMode('review')
  }

  const guidanceInfo = getGuidanceLevelInfo(diagnosticSession.guidanceLevel)

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Diagnostic Review</Text>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionId}>Session: {diagnosticSession.id.slice(-8)}</Text>
          <Text style={styles.timestamp}>
            {diagnosticSession.createdAt.toLocaleDateString()} at {diagnosticSession.createdAt.toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {/* Customer & Vehicle Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer & Vehicle Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Customer ID:</Text>
          <Text style={styles.infoValue}>{diagnosticSession.customerId}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Guidance Level:</Text>
          <View style={styles.guidanceLevel}>
            <Ionicons name={guidanceInfo.icon as any} size={16} color={guidanceInfo.color} />
            <Text style={[styles.guidanceLevelText, { color: guidanceInfo.color }]}>
              {guidanceInfo.label}
            </Text>
          </View>
        </View>

        {diagnosticSession.vehicleInfo ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle:</Text>
              <Text style={styles.infoValue}>
                {diagnosticSession.vehicleInfo.year} {diagnosticSession.vehicleInfo.make} {diagnosticSession.vehicleInfo.model}
              </Text>
            </View>
            {diagnosticSession.vehicleInfo.vin && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>VIN:</Text>
                <Text style={styles.infoValue}>{diagnosticSession.vehicleInfo.vin}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.warningText}>
              Limited vehicle information available. Consider requesting more details for better accuracy.
            </Text>
          </View>
        )}
      </View>

      {/* Customer Symptoms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Symptoms</Text>
        {diagnosticSession.symptoms.map((symptom, index) => (
          <View key={index} style={styles.symptomItem}>
            <Ionicons name="medical" size={16} color="#3b82f6" />
            <Text style={styles.symptomText}>{symptom}</Text>
          </View>
        ))}
      </View>

      {/* AI Diagnosis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Diagnosis</Text>
        
        <View style={styles.diagnosisCard}>
          <View style={styles.diagnosisHeader}>
            <Text style={styles.diagnosisTitle}>Primary Diagnosis</Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{diagnosticSession.aiDiagnosis.primaryDiagnosis.confidence}%</Text>
            </View>
          </View>
          
          <Text style={styles.diagnosisIssue}>{diagnosticSession.aiDiagnosis.primaryDiagnosis.issue}</Text>
          <Text style={styles.diagnosisDescription}>{diagnosticSession.aiDiagnosis.primaryDiagnosis.description}</Text>
        </View>

        {diagnosticSession.aiDiagnosis.alternativeDiagnoses.length > 0 && (
          <View style={styles.alternativeDiagnoses}>
            <Text style={styles.alternativeTitle}>Alternative Diagnoses</Text>
            {diagnosticSession.aiDiagnosis.alternativeDiagnoses.map((alt, index) => (
              <View key={index} style={styles.alternativeItem}>
                <Text style={styles.alternativeIssue}>{alt.issue}</Text>
                <Text style={styles.alternativeConfidence}>{alt.confidence}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Cost Estimate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Estimate</Text>
        <View style={styles.costContainer}>
          <Text style={styles.costRange}>
            ${diagnosticSession.estimatedCost.min} - ${diagnosticSession.estimatedCost.max}
          </Text>
          <Text style={styles.costDescription}>{diagnosticSession.estimatedCost.description}</Text>
        </View>
      </View>

      {/* Urgency Assessment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Urgency Assessment</Text>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(diagnosticSession.urgency) }]}>
          <Text style={styles.urgencyText}>{diagnosticSession.urgency.toUpperCase()}</Text>
        </View>
      </View>

      {/* Review Mode Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review Action</Text>
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, reviewMode === 'review' && styles.modeButtonActive]}
            onPress={() => setReviewMode('review')}
          >
            <Text style={[styles.modeButtonText, reviewMode === 'review' && styles.modeButtonTextActive]}>
              Review
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeButton, reviewMode === 'modify' && styles.modeButtonActive]}
            onPress={() => setReviewMode('modify')}
          >
            <Text style={[styles.modeButtonText, reviewMode === 'modify' && styles.modeButtonTextActive]}>
              Modify
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeButton, reviewMode === 'request_info' && styles.modeButtonActive]}
            onPress={() => setReviewMode('request_info')}
          >
            <Text style={[styles.modeButtonText, reviewMode === 'request_info' && styles.modeButtonTextActive]}>
              Request Info
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Review Content */}
      {reviewMode === 'review' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mechanic Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Add your professional assessment and any additional notes..."
            value={mechanicNotes}
            onChangeText={setMechanicNotes}
          />
          
          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
              <Ionicons name="close-circle" size={20} color="#ffffff" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {reviewMode === 'modify' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modify Diagnosis</Text>
          
          <View style={styles.modifyField}>
            <Text style={styles.fieldLabel}>Diagnosis Issue</Text>
            <TextInput
              style={styles.textInput}
              value={modifiedDiagnosis}
              onChangeText={setModifiedDiagnosis}
              placeholder="Enter modified diagnosis"
            />
          </View>

          <View style={styles.modifyField}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={3}
              value={modifiedDescription}
              onChangeText={setModifiedDescription}
              placeholder="Enter detailed description"
            />
          </View>

          <View style={styles.modifyField}>
            <Text style={styles.fieldLabel}>Confidence Level (%)</Text>
            <TextInput
              style={styles.textInput}
              value={modifiedConfidence.toString()}
              onChangeText={(text) => setModifiedConfidence(parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="0-100"
            />
          </View>

          <View style={styles.costModifyContainer}>
            <View style={styles.costField}>
              <Text style={styles.fieldLabel}>Min Cost ($)</Text>
              <TextInput
                style={styles.textInput}
                value={modifiedCostMin}
                onChangeText={setModifiedCostMin}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            
            <View style={styles.costField}>
              <Text style={styles.fieldLabel}>Max Cost ($)</Text>
              <TextInput
                style={styles.textInput}
                value={modifiedCostMax}
                onChangeText={setModifiedCostMax}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.modifyField}>
            <Text style={styles.fieldLabel}>Reasoning for Changes</Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={4}
              value={mechanicNotes}
              onChangeText={setMechanicNotes}
              placeholder="Explain why you're modifying the AI diagnosis..."
            />
          </View>

          <TouchableOpacity style={styles.modifyApproveButton} onPress={handleModifyAndApprove}>
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.modifyApproveButtonText}>Modify & Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {reviewMode === 'request_info' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Additional Information</Text>
          
          <View style={styles.modifyField}>
            <Text style={styles.fieldLabel}>Information Type</Text>
            <View style={styles.infoTypeSelector}>
              {[
                { value: 'vehicle_info', label: 'Vehicle Information' },
                { value: 'symptoms', label: 'Additional Symptoms' },
                { value: 'photos', label: 'Photos' },
                { value: 'diagnostic_data', label: 'Diagnostic Data' }
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.infoTypeButton,
                    infoRequestType === type.value && styles.infoTypeButtonActive
                  ]}
                  onPress={() => setInfoRequestType(type.value as InfoRequest['requestType'])}
                >
                  <Text style={[
                    styles.infoTypeButtonText,
                    infoRequestType === type.value && styles.infoTypeButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modifyField}>
            <Text style={styles.fieldLabel}>Message to Customer</Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={4}
              value={infoRequestMessage}
              onChangeText={setInfoRequestMessage}
              placeholder="Explain what additional information you need and why it would help with the diagnosis..."
            />
          </View>

          <TouchableOpacity style={styles.requestInfoButton} onPress={handleRequestMoreInfo}>
            <Ionicons name="mail" size={20} color="#ffffff" />
            <Text style={styles.requestInfoButtonText}>Send Request</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionId: {
    fontSize: 14,
    color: '#64748b',
  },
  timestamp: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  guidanceLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guidanceLevelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  symptomText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  diagnosisCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confidenceBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  diagnosisIssue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  diagnosisDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  alternativeDiagnoses: {
    marginTop: 12,
  },
  alternativeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  alternativeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    marginBottom: 4,
  },
  alternativeIssue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  alternativeConfidence: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  costContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  costRange: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  costDescription: {
    fontSize: 14,
    color: '#166534',
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modifyField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    textAlignVertical: 'top',
  },
  costModifyContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  costField: {
    flex: 1,
  },
  modifyApproveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  modifyApproveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  infoTypeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  infoTypeButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  infoTypeButtonTextActive: {
    color: '#ffffff',
  },
  requestInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  requestInfoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})
