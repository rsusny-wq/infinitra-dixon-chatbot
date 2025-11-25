import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface InlineVehicleChoiceProps {
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
  color: string
  backgroundColor: string
}

export function InlineVehicleChoice({ 
  onChoiceSelected, 
  symptomType = "vehicle issue" 
}: InlineVehicleChoiceProps) {

  const guidanceOptions: GuidanceOption[] = [
    {
      level: 'generic',
      icon: 'flash',
      title: 'General Guidance',
      subtitle: 'Quick help for common issues',
      description: `Get immediate advice for your ${symptomType} that works for most vehicles`,
      accuracy: 'Good for common problems',
      timeEstimate: 'Immediate',
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
      color: '#7c3aed',
      backgroundColor: '#faf5ff'
    }
  ]

  const handleOptionSelect = (level: GuidanceLevel) => {
    onChoiceSelected(level)
  }

  const renderOption = (option: GuidanceOption) => {
    return (
      <TouchableOpacity
        key={option.level}
        style={[
          styles.optionCard,
          { backgroundColor: option.backgroundColor, borderColor: option.color }
        ]}
        onPress={() => handleOptionSelect(option.level)}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
            <Ionicons name={option.icon as any} size={20} color="#ffffff" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={option.color} />
        </View>

        <Text style={styles.optionDescription}>{option.description}</Text>

        <View style={styles.optionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={14} color={option.color} />
            <Text style={styles.detailText}>Accuracy: {option.accuracy}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color={option.color} />
            <Text style={styles.detailText}>Setup: {option.timeEstimate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
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
        <Ionicons name="arrow-up-circle" size={16} color="#1e40af" />
        <Text style={styles.upgradeText}>
          You can always upgrade to a higher accuracy level during our conversation
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  introduction: {
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  introText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  optionDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  optionDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  upgradeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 6,
  },
  upgradeText: {
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
})
