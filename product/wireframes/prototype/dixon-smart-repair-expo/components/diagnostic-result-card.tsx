import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MultipleRepairOptions } from './multiple-repair-options'

interface DiagnosticResultCardProps {
  diagnosis: DiagnosisResult
  vehicleInfo?: VehicleInfo
  onGetQuotes: () => void
  onScheduleService: () => void
  onBookService?: (serviceDetails: ServiceBookingDetails) => void
}

interface ServiceBookingDetails {
  diagnosticSessionId: string
  urgency: 'immediate' | 'soon' | 'routine'
  estimatedTime: string
  recommendedServices: string[]
  guidanceLevel: 'generic' | 'basic' | 'vin'
  diagnosticConfidence: number
  selectedRepairOption?: any
}

interface DiagnosisResult {
  primaryDiagnosis: Diagnosis
  alternativeDiagnoses: Diagnosis[]
  recommendedActions: string[]
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost: {
    min: number
    max: number
    description: string
  }
}

interface Diagnosis {
  issue: string
  confidence: number
  description: string
  commonCauses: string[]
  symptoms: string[]
}

interface VehicleInfo {
  vin: string
  year: number
  make: string
  model: string
  engine?: string
  transmission?: string
}

export function DiagnosticResultCard({ 
  diagnosis, 
  vehicleInfo, 
  onGetQuotes, 
  onScheduleService,
  onBookService 
}: DiagnosticResultCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showServiceBooking, setShowServiceBooking] = useState(false)
  const [showRepairOptions, setShowRepairOptions] = useState(false)
  const [selectedRepairOption, setSelectedRepairOption] = useState<any>(null)

  const handleBookService = (urgency: 'immediate' | 'soon' | 'routine') => {
    const serviceDetails: ServiceBookingDetails = {
      diagnosticSessionId: Date.now().toString(),
      urgency,
      estimatedTime: getEstimatedTime(urgency),
      recommendedServices: getRecommendedServices(),
      guidanceLevel: vehicleInfo?.vin ? 'vin' : vehicleInfo ? 'basic' : 'generic',
      diagnosticConfidence: diagnosis.primaryDiagnosis.confidence,
      selectedRepairOption
    }
    
    onBookService?.(serviceDetails)
    setShowServiceBooking(false)
  }

  const handleRepairOptionSelected = (option: any) => {
    setSelectedRepairOption(option)
    setShowRepairOptions(false)
    // Automatically show service booking with selected option
    setShowServiceBooking(true)
  }

  const getEstimatedTime = (urgency: 'immediate' | 'soon' | 'routine'): string => {
    switch (urgency) {
      case 'immediate': return '2-4 hours'
      case 'soon': return '1-2 days'
      case 'routine': return '3-7 days'
    }
  }

  const getRecommendedServices = (): string[] => {
    return [
      diagnosis.primaryDiagnosis.issue,
      'Diagnostic confirmation',
      'Parts replacement if needed',
      'System testing'
    ]
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#16a34a'
      default: return '#64748b'
    }
  }

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical': return 'warning'
      case 'high': return 'alert-circle'
      case 'medium': return 'information-circle'
      case 'low': return 'checkmark-circle'
      default: return 'help-circle'
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons 
            name="medical" 
            size={24} 
            color="#1e40af" 
          />
          <Text style={styles.title}>Diagnostic Results</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(diagnosis.urgencyLevel) }]}>
          <Ionicons 
            name={getUrgencyIcon(diagnosis.urgencyLevel) as any} 
            size={16} 
            color="#ffffff" 
          />
          <Text style={styles.urgencyText}>
            {diagnosis.urgencyLevel.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Vehicle Info */}
      {vehicleInfo && (
        <View style={styles.vehicleInfo}>
          <Ionicons name="car" size={16} color="#64748b" />
          <Text style={styles.vehicleText}>
            {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
          </Text>
        </View>
      )}

      {/* Primary Diagnosis */}
      <View style={styles.section}>
        <View style={styles.diagnosisHeader}>
          <Text style={styles.diagnosisTitle}>
            {diagnosis.primaryDiagnosis.issue}
          </Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {diagnosis.primaryDiagnosis.confidence}% confident
            </Text>
          </View>
        </View>
        
        <Text style={styles.diagnosisDescription}>
          {diagnosis.primaryDiagnosis.description}
        </Text>

        {/* Expandable Common Causes */}
        <TouchableOpacity 
          style={styles.expandableHeader}
          onPress={() => toggleSection('causes')}
        >
          <Text style={styles.expandableTitle}>Common Causes</Text>
          <Ionicons 
            name={expandedSection === 'causes' ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#64748b" 
          />
        </TouchableOpacity>
        
        {expandedSection === 'causes' && (
          <View style={styles.expandableContent}>
            {diagnosis.primaryDiagnosis.commonCauses.map((cause, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{cause}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Alternative Diagnoses */}
      {diagnosis.alternativeDiagnoses.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.expandableHeader}
            onPress={() => toggleSection('alternatives')}
          >
            <Text style={styles.expandableTitle}>
              Other Possible Issues ({diagnosis.alternativeDiagnoses.length})
            </Text>
            <Ionicons 
              name={expandedSection === 'alternatives' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#64748b" 
            />
          </TouchableOpacity>
          
          {expandedSection === 'alternatives' && (
            <View style={styles.expandableContent}>
              {diagnosis.alternativeDiagnoses.map((alt, index) => (
                <View key={index} style={styles.alternativeDiagnosis}>
                  <View style={styles.alternativeHeader}>
                    <Text style={styles.alternativeTitle}>{alt.issue}</Text>
                    <Text style={styles.alternativeConfidence}>
                      {alt.confidence}%
                    </Text>
                  </View>
                  <Text style={styles.alternativeDescription}>
                    {alt.description}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Recommended Actions */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.expandableHeader}
          onPress={() => toggleSection('actions')}
        >
          <Text style={styles.expandableTitle}>Recommended Actions</Text>
          <Ionicons 
            name={expandedSection === 'actions' ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#64748b" 
          />
        </TouchableOpacity>
        
        {expandedSection === 'actions' && (
          <View style={styles.expandableContent}>
            {diagnosis.recommendedActions.map((action, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{action}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Cost Estimate */}
      <View style={styles.costSection}>
        <View style={styles.costHeader}>
          <Ionicons name="card" size={20} color="#16a34a" />
          <Text style={styles.costTitle}>Estimated Cost</Text>
        </View>
        <View style={styles.costRange}>
          <Text style={styles.costAmount}>
            ${diagnosis.estimatedCost.min} - ${diagnosis.estimatedCost.max}
          </Text>
          <Text style={styles.costDescription}>
            {diagnosis.estimatedCost.description}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={onGetQuotes}
        >
          <Ionicons name="document-text" size={20} color="#1e40af" />
          <Text style={styles.secondaryButtonText}>Get Quotes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.tertiaryButton]} 
          onPress={() => setShowRepairOptions(true)}
        >
          <Ionicons name="options" size={20} color="#7c3aed" />
          <Text style={styles.tertiaryButtonText}>Repair Options</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => setShowServiceBooking(true)}
        >
          <Ionicons name="calendar" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Book Service</Text>
        </TouchableOpacity>
      </View>

      {/* Service Booking Modal */}
      {showServiceBooking && (
        <View style={styles.serviceBookingModal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Service Appointment</Text>
            <Text style={styles.modalSubtitle}>
              Based on your {diagnosis.primaryDiagnosis.issue} diagnosis
            </Text>

            {selectedRepairOption && (
              <View style={styles.selectedOptionDisplay}>
                <Text style={styles.selectedOptionTitle}>Selected Repair Option:</Text>
                <View style={styles.selectedOptionCard}>
                  <Text style={styles.selectedOptionName}>{selectedRepairOption.name}</Text>
                  <Text style={styles.selectedOptionCost}>${selectedRepairOption.cost.total}</Text>
                </View>
              </View>
            )}

            <View style={styles.urgencyOptions}>
              <TouchableOpacity 
                style={[styles.urgencyButton, styles.immediateButton]}
                onPress={() => handleBookService('immediate')}
              >
                <Ionicons name="warning" size={20} color="#dc2626" />
                <View style={styles.urgencyContent}>
                  <Text style={styles.urgencyTitle}>Immediate</Text>
                  <Text style={styles.urgencyTime}>2-4 hours</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.urgencyButton, styles.soonButton]}
                onPress={() => handleBookService('soon')}
              >
                <Ionicons name="time" size={20} color="#ea580c" />
                <View style={styles.urgencyContent}>
                  <Text style={styles.urgencyTitle}>Soon</Text>
                  <Text style={styles.urgencyTime}>1-2 days</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.urgencyButton, styles.routineButton]}
                onPress={() => handleBookService('routine')}
              >
                <Ionicons name="calendar-outline" size={20} color="#16a34a" />
                <View style={styles.urgencyContent}>
                  <Text style={styles.urgencyTitle}>Routine</Text>
                  <Text style={styles.urgencyTime}>3-7 days</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowServiceBooking(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Multiple Repair Options Modal */}
      <MultipleRepairOptions
        visible={showRepairOptions}
        diagnosis={{
          issue: diagnosis.primaryDiagnosis.issue,
          confidence: diagnosis.primaryDiagnosis.confidence,
          description: diagnosis.primaryDiagnosis.description
        }}
        vehicleInfo={vehicleInfo}
        onSelectOption={handleRepairOptionSelected}
        onClose={() => setShowRepairOptions(false)}
      />

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color="#64748b" />
        <Text style={styles.disclaimerText}>
          This is an AI-generated diagnosis. Professional inspection is recommended for accurate assessment.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 8,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  vehicleText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  diagnosisDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandableTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  expandableContent: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
    marginTop: 2,
  },
  listText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    lineHeight: 20,
  },
  alternativeDiagnosis: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alternativeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  alternativeConfidence: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  alternativeDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  costSection: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  costHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  costTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 8,
  },
  costRange: {
    alignItems: 'center',
  },
  costAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 4,
  },
  costDescription: {
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: '#1e40af',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tertiaryButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#7c3aed',
    borderWidth: 1,
  },
  tertiaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
    marginLeft: 8,
  },
  selectedOptionDisplay: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  selectedOptionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 6,
  },
  selectedOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOptionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  selectedOptionCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  serviceBookingModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  urgencyOptions: {
    gap: 12,
    marginBottom: 20,
  },
  urgencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  immediateButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  soonButton: {
    backgroundColor: '#fff7ed',
    borderColor: '#ea580c',
  },
  routineButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  urgencyContent: {
    marginLeft: 12,
    flex: 1,
  },
  urgencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  urgencyTime: {
    fontSize: 14,
    color: '#64748b',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
})
