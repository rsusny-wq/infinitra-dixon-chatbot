import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface RepairOption {
  id: string
  name: string
  type: 'budget' | 'standard' | 'premium'
  description: string
  parts: {
    type: 'aftermarket' | 'oem' | 'premium'
    description: string
    warranty: string
  }
  labor: {
    approach: 'quick' | 'standard' | 'comprehensive'
    description: string
    timeEstimate: string
  }
  cost: {
    parts: number
    labor: number
    total: number
  }
  timeline: string
  warranty: string
  pros: string[]
  cons: string[]
  recommended?: boolean
}

interface MultipleRepairOptionsProps {
  diagnosis: {
    issue: string
    confidence: number
    description: string
  }
  vehicleInfo?: {
    year: number
    make: string
    model: string
    vin?: string
  }
  onSelectOption: (option: RepairOption) => void
  onClose: () => void
  visible: boolean
}

export function MultipleRepairOptions({
  diagnosis,
  vehicleInfo,
  onSelectOption,
  onClose,
  visible
}: MultipleRepairOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  // Generate repair options based on diagnosis
  const generateRepairOptions = (): RepairOption[] => {
    const baseIssue = diagnosis.issue.toLowerCase()
    
    if (baseIssue.includes('brake')) {
      return [
        {
          id: 'budget',
          name: 'Budget Repair',
          type: 'budget',
          description: 'Essential brake safety repair with aftermarket parts',
          parts: {
            type: 'aftermarket',
            description: 'Quality aftermarket brake pads and basic brake fluid',
            warranty: '12 months / 12,000 miles'
          },
          labor: {
            approach: 'quick',
            description: 'Standard brake pad replacement and fluid top-off',
            timeEstimate: '1-2 hours'
          },
          cost: {
            parts: 85,
            labor: 120,
            total: 205
          },
          timeline: 'Same day',
          warranty: '12 months / 12,000 miles',
          pros: [
            'Most affordable option',
            'Quick turnaround',
            'Restores basic safety',
            'Quality aftermarket parts'
          ],
          cons: [
            'Shorter warranty period',
            'May need replacement sooner',
            'Basic brake fluid service only'
          ]
        },
        {
          id: 'standard',
          name: 'Standard Repair',
          type: 'standard',
          description: 'Complete brake service with OEM-equivalent parts',
          parts: {
            type: 'oem',
            description: 'OEM-equivalent brake pads, rotors, and premium brake fluid',
            warranty: '24 months / 24,000 miles'
          },
          labor: {
            approach: 'standard',
            description: 'Complete brake system service including fluid flush',
            timeEstimate: '2-3 hours'
          },
          cost: {
            parts: 165,
            labor: 180,
            total: 345
          },
          timeline: 'Same day',
          warranty: '24 months / 24,000 miles',
          pros: [
            'OEM-quality parts',
            'Complete brake service',
            'Extended warranty',
            'Better long-term value'
          ],
          cons: [
            'Higher upfront cost',
            'Longer service time'
          ],
          recommended: true
        },
        {
          id: 'premium',
          name: 'Premium Repair',
          type: 'premium',
          description: 'Comprehensive brake system upgrade with premium components',
          parts: {
            type: 'premium',
            description: 'Premium ceramic brake pads, high-performance rotors, DOT 4 brake fluid',
            warranty: '36 months / 36,000 miles'
          },
          labor: {
            approach: 'comprehensive',
            description: 'Complete brake system inspection, service, and performance optimization',
            timeEstimate: '3-4 hours'
          },
          cost: {
            parts: 285,
            labor: 240,
            total: 525
          },
          timeline: 'Same day',
          warranty: '36 months / 36,000 miles',
          pros: [
            'Premium ceramic pads (quieter, longer lasting)',
            'High-performance rotors',
            'Comprehensive system inspection',
            'Maximum warranty coverage',
            'Best long-term value'
          ],
          cons: [
            'Highest upfront cost',
            'Longest service time',
            'May be overkill for basic needs'
          ]
        }
      ]
    }

    // Default engine repair options
    return [
      {
        id: 'budget',
        name: 'Essential Repair',
        type: 'budget',
        description: 'Address immediate issue with cost-effective solution',
        parts: {
          type: 'aftermarket',
          description: 'Quality aftermarket replacement parts',
          warranty: '12 months / 12,000 miles'
        },
        labor: {
          approach: 'quick',
          description: 'Targeted repair of identified issue',
          timeEstimate: '2-3 hours'
        },
        cost: {
          parts: 125,
          labor: 180,
          total: 305
        },
        timeline: '1-2 days',
        warranty: '12 months / 12,000 miles',
        pros: [
          'Most affordable option',
          'Quick turnaround',
          'Addresses immediate problem'
        ],
        cons: [
          'May not address underlying issues',
          'Shorter warranty period'
        ]
      },
      {
        id: 'standard',
        name: 'Complete Repair',
        type: 'standard',
        description: 'Comprehensive repair with OEM-quality parts',
        parts: {
          type: 'oem',
          description: 'OEM or OEM-equivalent parts for reliable performance',
          warranty: '24 months / 24,000 miles'
        },
        labor: {
          approach: 'standard',
          description: 'Complete system diagnosis and repair',
          timeEstimate: '4-6 hours'
        },
        cost: {
          parts: 245,
          labor: 320,
          total: 565
        },
        timeline: '2-3 days',
        warranty: '24 months / 24,000 miles',
        pros: [
          'OEM-quality reliability',
          'Comprehensive repair approach',
          'Extended warranty coverage'
        ],
        cons: [
          'Higher cost',
          'Longer repair time'
        ],
        recommended: true
      },
      {
        id: 'premium',
        name: 'System Upgrade',
        type: 'premium',
        description: 'Premium repair with performance enhancements',
        parts: {
          type: 'premium',
          description: 'Premium parts with enhanced performance characteristics',
          warranty: '36 months / 36,000 miles'
        },
        labor: {
          approach: 'comprehensive',
          description: 'Complete system overhaul with performance optimization',
          timeEstimate: '6-8 hours'
        },
        cost: {
          parts: 385,
          labor: 480,
          total: 865
        },
        timeline: '3-4 days',
        warranty: '36 months / 36,000 miles',
        pros: [
          'Premium performance parts',
          'Maximum reliability',
          'Longest warranty',
          'Future-proofing'
        ],
        cons: [
          'Highest investment',
          'Longest repair time',
          'May exceed basic needs'
        ]
      }
    ]
  }

  const repairOptions = generateRepairOptions()

  const getOptionColor = (type: RepairOption['type']) => {
    switch (type) {
      case 'budget': return '#16a34a'
      case 'standard': return '#3b82f6'
      case 'premium': return '#7c3aed'
      default: return '#6b7280'
    }
  }

  const getOptionIcon = (type: RepairOption['type']) => {
    switch (type) {
      case 'budget': return 'flash'
      case 'standard': return 'checkmark-circle'
      case 'premium': return 'star'
      default: return 'help-circle'
    }
  }

  const handleSelectOption = (option: RepairOption) => {
    setSelectedOption(option.id)
    onSelectOption(option)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Repair Options</Text>
            <Text style={styles.headerSubtitle}>
              {vehicleInfo ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : 'Your Vehicle'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.compareButton}
            onPress={() => setShowComparison(!showComparison)}
          >
            <Ionicons name="analytics" size={20} color="#3b82f6" />
            <Text style={styles.compareText}>Compare</Text>
          </TouchableOpacity>
        </View>

        {/* Diagnosis Summary */}
        <View style={styles.diagnosisSummary}>
          <View style={styles.diagnosisHeader}>
            <Ionicons name="medical" size={16} color="#3b82f6" />
            <Text style={styles.diagnosisTitle}>Diagnosis: {diagnosis.issue}</Text>
          </View>
          <Text style={styles.diagnosisDescription}>{diagnosis.description}</Text>
          <Text style={styles.diagnosisConfidence}>AI Confidence: {diagnosis.confidence}%</Text>
        </View>

        {showComparison ? (
          /* Comparison View */
          <ScrollView style={styles.comparisonContainer}>
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonTitle}>Feature Comparison</Text>
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Cost</Text>
                {repairOptions.map(option => (
                  <Text key={option.id} style={[styles.comparisonValue, { color: getOptionColor(option.type) }]}>
                    ${option.cost.total}
                  </Text>
                ))}
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Timeline</Text>
                {repairOptions.map(option => (
                  <Text key={option.id} style={styles.comparisonValue}>
                    {option.timeline}
                  </Text>
                ))}
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Warranty</Text>
                {repairOptions.map(option => (
                  <Text key={option.id} style={styles.comparisonValue}>
                    {option.warranty}
                  </Text>
                ))}
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Parts</Text>
                {repairOptions.map(option => (
                  <Text key={option.id} style={styles.comparisonValue}>
                    {option.parts.type.toUpperCase()}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Options List View */
          <ScrollView style={styles.optionsList}>
            {repairOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedOption === option.id && styles.selectedOption,
                  option.recommended && styles.recommendedOption
                ]}
                onPress={() => handleSelectOption(option)}
              >
                {option.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Ionicons name="star" size={12} color="#ffffff" />
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}
                
                <View style={styles.optionHeader}>
                  <View style={styles.optionTitleRow}>
                    <View style={[styles.optionIcon, { backgroundColor: getOptionColor(option.type) }]}>
                      <Ionicons name={getOptionIcon(option.type) as any} size={20} color="#ffffff" />
                    </View>
                    <View style={styles.optionTitleInfo}>
                      <Text style={styles.optionName}>{option.name}</Text>
                      <Text style={styles.optionType}>{option.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.optionCost}>
                    <Text style={styles.costAmount}>${option.cost.total}</Text>
                    <Text style={styles.costLabel}>Total</Text>
                  </View>
                </View>

                <Text style={styles.optionDescription}>{option.description}</Text>

                <View style={styles.optionDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={14} color="#64748b" />
                    <Text style={styles.detailText}>Timeline: {option.timeline}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="shield-checkmark" size={14} color="#64748b" />
                    <Text style={styles.detailText}>Warranty: {option.warranty}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="build" size={14} color="#64748b" />
                    <Text style={styles.detailText}>Parts: {option.parts.type.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.costBreakdown}>
                  <View style={styles.costItem}>
                    <Text style={styles.costItemLabel}>Parts:</Text>
                    <Text style={styles.costItemValue}>${option.cost.parts}</Text>
                  </View>
                  <View style={styles.costItem}>
                    <Text style={styles.costItemLabel}>Labor:</Text>
                    <Text style={styles.costItemValue}>${option.cost.labor}</Text>
                  </View>
                </View>

                <View style={styles.prosConsContainer}>
                  <View style={styles.prosContainer}>
                    <Text style={styles.prosTitle}>Pros:</Text>
                    {option.pros.slice(0, 2).map((pro, index) => (
                      <View key={index} style={styles.proItem}>
                        <Ionicons name="checkmark" size={12} color="#16a34a" />
                        <Text style={styles.proText}>{pro}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.consContainer}>
                    <Text style={styles.consTitle}>Considerations:</Text>
                    {option.cons.slice(0, 2).map((con, index) => (
                      <View key={index} style={styles.conItem}>
                        <Ionicons name="information-circle" size={12} color="#f59e0b" />
                        <Text style={styles.conText}>{con}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {selectedOption === option.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.selectedText}>Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.selectButton, !selectedOption && styles.selectButtonDisabled]}
            onPress={() => {
              if (selectedOption) {
                const option = repairOptions.find(opt => opt.id === selectedOption)
                if (option) {
                  handleSelectOption(option)
                  onClose()
                }
              }
            }}
            disabled={!selectedOption}
          >
            <Text style={styles.selectButtonText}>
              {selectedOption ? 'Proceed with Selection' : 'Select an Option'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    gap: 4,
  },
  compareText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  diagnosisSummary: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  diagnosisDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  diagnosisConfidence: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  comparisonContainer: {
    flex: 1,
    padding: 16,
  },
  comparisonTable: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  comparisonHeader: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  comparisonLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  comparisonValue: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  optionsList: {
    flex: 1,
    padding: 16,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#16a34a',
  },
  recommendedOption: {
    borderColor: '#3b82f6',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTitleInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  optionType: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  optionCost: {
    alignItems: 'flex-end',
  },
  costAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  costLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  optionDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  optionDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
  costBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  costItemLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  costItemValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0f172a',
  },
  prosConsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  prosContainer: {
    flex: 1,
  },
  consContainer: {
    flex: 1,
  },
  prosTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  consTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  proItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 2,
  },
  conItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 2,
  },
  proText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  conText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    gap: 6,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  selectButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  selectButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
})
