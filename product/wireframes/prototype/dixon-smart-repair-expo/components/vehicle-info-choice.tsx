import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface VehicleInfoChoiceProps {
  visible: boolean
  onClose: () => void
  onChoiceSelected: (choice: GuidanceLevel) => void
  symptomType?: string
}

export type GuidanceLevel = 'generic' | 'basic' | 'vin'

interface GuidanceOption {
  level: GuidanceLevel
  icon: string
  title: string
  subtitle: string
  description: string
  accuracy: string
  timeEstimate: string
  benefits: string[]
  limitations: string[]
  color: string
  backgroundColor: string
}

export function VehicleInfoChoice({ 
  visible, 
  onClose, 
  onChoiceSelected, 
  symptomType = "vehicle issue" 
}: VehicleInfoChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<GuidanceLevel | null>(null)

  const guidanceOptions: GuidanceOption[] = [
    {
      level: 'generic',
      icon: 'flash',
      title: 'General Guidance',
      subtitle: 'Quick help for common issues',
      description: `Get immediate advice for your ${symptomType} that works for most vehicles`,
      accuracy: 'Good for common problems',
      timeEstimate: 'Immediate',
      benefits: [
        'Instant helpful advice',
        'No vehicle info needed',
        'Works for most common issues',
        'Quick troubleshooting steps'
      ],
      limitations: [
        'General advice only',
        'May not be vehicle-specific',
        'Limited precision'
      ],
      color: '#16a34a',
      backgroundColor: '#f0fdf4'
    },
    {
      level: 'basic',
      icon: 'car',
      title: 'Vehicle-Specific Guidance',
      subtitle: 'Better accuracy with basic vehicle info',
      description: `Get tailored advice for your ${symptomType} based on your vehicle type`,
      accuracy: 'More accurate recommendations',
      timeEstimate: '30 seconds setup',
      benefits: [
        'Vehicle-type specific advice',
        'Better diagnostic accuracy',
        'Tailored recommendations',
        'Known issue awareness'
      ],
      limitations: [
        'Requires make/model/year',
        'General vehicle specs only'
      ],
      color: '#ea580c',
      backgroundColor: '#fff7ed'
    },
    {
      level: 'vin',
      icon: 'scan',
      title: 'Precision Guidance',
      subtitle: 'Highest accuracy with VIN',
      description: `Get the most accurate diagnosis for your ${symptomType} with complete vehicle specifications`,
      accuracy: 'Highest accuracy possible',
      timeEstimate: '1-2 minutes setup',
      benefits: [
        'Exact vehicle specifications',
        'Highest diagnostic confidence',
        'Precise parts and pricing',
        'Known recalls and issues'
      ],
      limitations: [
        'Requires VIN access',
        'Takes a bit longer to set up'
      ],
      color: '#7c3aed',
      backgroundColor: '#faf5ff'
    }
  ]

  const handleOptionSelect = (level: GuidanceLevel) => {
    setSelectedOption(level)
  }

  const handleConfirmChoice = () => {
    if (selectedOption) {
      onChoiceSelected(selectedOption)
      onClose()
    }
  }

  const renderOption = (option: GuidanceOption) => {
    const isSelected = selectedOption === option.level
    
    return (
      <TouchableOpacity
        key={option.level}
        style={[
          styles.optionCard,
          { backgroundColor: option.backgroundColor },
          isSelected && { borderColor: option.color, borderWidth: 2 }
        ]}
        onPress={() => handleOptionSelect(option.level)}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
            <Ionicons name={option.icon as any} size={24} color="#ffffff" />
          </View>
          <View style={styles.optionTitleContainer}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          </View>
          <View style={styles.selectionIndicator}>
            {isSelected ? (
              <Ionicons name="radio-button-on" size={24} color={option.color} />
            ) : (
              <Ionicons name="radio-button-off" size={24} color="#cbd5e1" />
            )}
          </View>
        </View>

        <Text style={styles.optionDescription}>{option.description}</Text>

        <View style={styles.optionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={16} color={option.color} />
            <Text style={styles.detailText}>Accuracy: {option.accuracy}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={option.color} />
            <Text style={styles.detailText}>Setup: {option.timeEstimate}</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.expandedDetails}>
            <View style={styles.benefitsSection}>
              <Text style={styles.sectionTitle}>Benefits:</Text>
              {option.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark" size={14} color={option.color} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {option.limitations.length > 0 && (
              <View style={styles.limitationsSection}>
                <Text style={styles.sectionTitle}>Considerations:</Text>
                {option.limitations.map((limitation, index) => (
                  <View key={index} style={styles.limitationItem}>
                    <Ionicons name="information-circle" size={14} color="#64748b" />
                    <Text style={styles.limitationText}>{limitation}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Your Guidance Level</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introduction}>
            <Text style={styles.introTitle}>How can I help you best?</Text>
            <Text style={styles.introText}>
              I can provide different levels of guidance for your {symptomType}. 
              Choose the approach that works best for your situation:
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {guidanceOptions.map(renderOption)}
          </View>

          {/* Upgrade Note */}
          <View style={styles.upgradeNote}>
            <Ionicons name="arrow-up-circle" size={20} color="#1e40af" />
            <Text style={styles.upgradeText}>
              You can always upgrade to a higher accuracy level during our conversation
            </Text>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              selectedOption ? styles.confirmButtonActive : styles.confirmButtonDisabled
            ]}
            onPress={handleConfirmChoice}
            disabled={!selectedOption}
          >
            <Text style={[
              styles.confirmButtonText,
              selectedOption ? styles.confirmButtonTextActive : styles.confirmButtonTextDisabled
            ]}>
              {selectedOption 
                ? `Continue with ${guidanceOptions.find(opt => opt.level === selectedOption)?.title}`
                : 'Select a guidance level'
              }
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introduction: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  optionDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  optionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  benefitsSection: {
    marginBottom: 12,
  },
  limitationsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  limitationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  upgradeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  upgradeText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
  },
  actionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  confirmButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  confirmButtonActive: {
    backgroundColor: '#1e40af',
  },
  confirmButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonTextActive: {
    color: '#ffffff',
  },
  confirmButtonTextDisabled: {
    color: '#94a3b8',
  },
})
