/**
 * DiagnosticChoiceInterface Component
 * Three-option diagnostic accuracy selection (Quick/Vehicle/Precision Help)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DiagnosticOption {
  id: number;
  name: string;
  description: string;
  confidence: number;
  icon: keyof typeof Ionicons.glyphMap;
  requirements: string;
  features: string[];
  color: string;
}

const DiagnosticOptions: DiagnosticOption[] = [
  {
    id: 1,
    name: "Quick Help",
    description: "General automotive guidance right now",
    confidence: 65,
    icon: "flash",
    requirements: "No vehicle info needed",
    features: [
      "Immediate assistance",
      "General automotive knowledge",
      "Basic troubleshooting steps",
      "Safety guidance"
    ],
    color: "#ff6b6b"
  },
  {
    id: 2,
    name: "Vehicle Help", 
    description: "Tailored advice for your specific car",
    confidence: 80,
    icon: "car",
    requirements: "Share make, model, year",
    features: [
      "Vehicle-specific guidance",
      "Targeted recommendations",
      "Better part compatibility",
      "Improved accuracy"
    ],
    color: "#4ecdc4"
  },
  {
    id: 3,
    name: "Precision Help",
    description: "Exact parts & pricing with VIN scan",
    confidence: 95,
    icon: "camera",
    requirements: "Photo of your VIN",
    features: [
      "NHTSA-verified specifications",
      "Exact part numbers & pricing",
      "Known issues & recalls",
      "Professional-grade accuracy"
    ],
    color: "#10a37f"
  }
];

export interface DiagnosticChoiceProps {
  onOptionSelected: (option: DiagnosticOption) => void;
  onSkip: () => void;
}

export const DiagnosticChoiceInterface: React.FC<DiagnosticChoiceProps> = ({
  onOptionSelected,
  onSkip,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>How would you like me to help you today?</Text>
        <Text style={styles.subtitle}>
          Choose your preferred level of diagnostic accuracy
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {DiagnosticOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, { borderColor: option.color }]}
            onPress={() => onOptionSelected(option)}
            activeOpacity={0.7}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon} size={24} color="white" />
              </View>
              <View style={styles.optionTitleContainer}>
                <Text style={styles.optionName}>{option.name}</Text>
                <View style={[styles.confidenceBadge, { backgroundColor: option.color }]}>
                  <Text style={styles.confidenceText}>{option.confidence}%</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.optionDescription}>
              {option.description}
            </Text>
            
            <Text style={styles.optionRequirements}>
              📋 {option.requirements}
            </Text>

            <View style={styles.featuresContainer}>
              {option.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {option.id === 3 && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>⭐ Recommended</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.upgradeNote}>
          💡 You can always upgrade to higher accuracy during our conversation
        </Text>
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={onSkip}
        >
          <Text style={styles.skipButtonText}>Skip - Start Basic Chat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>Accuracy Comparison</Text>
        <View style={styles.comparisonChart}>
          <View style={styles.chartBar}>
            <View style={[styles.chartFill, { width: '65%', backgroundColor: '#ff6b6b' }]} />
            <Text style={styles.chartLabel}>Quick: 65%</Text>
          </View>
          <View style={styles.chartBar}>
            <View style={[styles.chartFill, { width: '80%', backgroundColor: '#4ecdc4' }]} />
            <Text style={styles.chartLabel}>Vehicle: 80%</Text>
          </View>
          <View style={styles.chartBar}>
            <View style={[styles.chartFill, { width: '95%', backgroundColor: '#10a37f' }]} />
            <Text style={styles.chartLabel}>Precision: 95%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
  },
  optionRequirements: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  featureBullet: {
    fontSize: 14,
    color: '#10a37f',
    marginRight: 8,
    marginTop: 1,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  upgradeNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  comparisonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 20,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  comparisonChart: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  chartBar: {
    marginBottom: 8,
    position: 'relative',
  },
  chartFill: {
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
  },
  chartLabel: {
    position: 'absolute',
    left: 8,
    top: 4,
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});

export default DiagnosticChoiceInterface;
