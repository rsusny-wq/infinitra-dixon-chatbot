/**
 * Enhanced Diagnosis Display Component - Dixon Smart Repair
 * GAP 4: Enhanced Diagnosis Display (US-005)
 * Displays ranked diagnosis results with confidence percentages
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DiagnosisIssue {
  cause: string;
  likelihood: 'high' | 'medium' | 'low';
  urgency: 'high' | 'medium' | 'low';
  confidence: number;
  rank: number;
  vehicleSpecific?: boolean;
  vinVerified?: boolean;
}

export interface DiagnosisData {
  potentialCauses: DiagnosisIssue[];
  diagnosticAccuracy: string;
  safetyConcerns: string[];
  professionalNeeded: boolean;
  vehicleInfo?: {
    year?: number;
    make?: string;
    model?: string;
    vin?: string;
  };
}

interface EnhancedDiagnosisDisplayProps {
  diagnosisData: DiagnosisData;
  onIssuePress?: (issue: DiagnosisIssue) => void;
}

const EnhancedDiagnosisDisplay: React.FC<EnhancedDiagnosisDisplayProps> = ({
  diagnosisData,
  onIssuePress
}) => {
  // Calculate confidence percentage based on diagnostic accuracy and likelihood
  const calculateConfidence = (likelihood: string, diagnosticAccuracy: string): number => {
    const baseAccuracy = parseInt(diagnosticAccuracy.replace('%', ''));
    
    const likelihoodMultipliers = {
      'high': 1.0,     // 100% of base accuracy
      'medium': 0.8,   // 80% of base accuracy  
      'low': 0.6       // 60% of base accuracy
    };
    
    return Math.round(baseAccuracy * (likelihoodMultipliers[likelihood as keyof typeof likelihoodMultipliers] || 0.6));
  };

  // Get color for confidence percentage
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#10a37f'; // Green - High confidence
    if (confidence >= 60) return '#FFA500'; // Orange - Medium confidence
    return '#ff6b6b'; // Red - Low confidence
  };

  // Get severity color based on urgency
  const getSeverityColor = (urgency: string): string => {
    switch (urgency) {
      case 'high': return '#ff4444'; // Red
      case 'medium': return '#FFA500'; // Orange
      case 'low': return '#10a37f'; // Green
      default: return '#8e8ea0'; // Gray
    }
  };

  // Get severity icon
  const getSeverityIcon = (urgency: string): keyof typeof Ionicons.glyphMap => {
    switch (urgency) {
      case 'high': return 'warning';
      case 'medium': return 'alert-circle';
      case 'low': return 'information-circle';
      default: return 'help-circle';
    }
  };

  // Process and rank diagnosis issues
  const processedIssues = diagnosisData.potentialCauses
    .map((cause, index) => ({
      ...cause,
      confidence: calculateConfidence(cause.likelihood, diagnosisData.diagnosticAccuracy),
      rank: index + 1
    }))
    .sort((a, b) => b.confidence - a.confidence) // Sort by confidence descending
    .slice(0, 5); // Limit to top 5 issues

  return (
    <View style={styles.container}>
      {/* Header with Diagnostic Accuracy */}
      <View style={styles.header}>
        <View style={styles.accuracyBadge}>
          <Ionicons name="analytics" size={16} color="#10a37f" />
          <Text style={styles.accuracyText}>
            Diagnostic Accuracy: {diagnosisData.diagnosticAccuracy}
          </Text>
        </View>
        {diagnosisData.vehicleInfo && (
          <Text style={styles.vehicleInfo}>
            {diagnosisData.vehicleInfo.year} {diagnosisData.vehicleInfo.make} {diagnosisData.vehicleInfo.model}
          </Text>
        )}
      </View>

      {/* Top Likely Issues */}
      <View style={styles.issuesSection}>
        <Text style={styles.sectionTitle}>Most Likely Issues</Text>
        
        {processedIssues.map((issue, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.issueCard,
              index === 0 && styles.topIssueCard
            ]}
            onPress={() => onIssuePress?.(issue)}
            activeOpacity={0.7}
          >
            {/* Issue Header */}
            <View style={styles.issueHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{issue.rank}</Text>
              </View>
              
              <View style={styles.issueTitle}>
                <Text style={[styles.issueCause, index === 0 && styles.topIssueCause]}>
                  {issue.cause}
                </Text>
                {issue.vinVerified && (
                  <View style={styles.vinBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#10a37f" />
                    <Text style={styles.vinBadgeText}>VIN Verified</Text>
                  </View>
                )}
              </View>

              <View style={styles.confidenceContainer}>
                <Text style={[
                  styles.confidenceText,
                  { color: getConfidenceColor(issue.confidence) }
                ]}>
                  {issue.confidence}%
                </Text>
              </View>
            </View>

            {/* Issue Details */}
            <View style={styles.issueDetails}>
              <View style={styles.severityIndicator}>
                <Ionicons 
                  name={getSeverityIcon(issue.urgency)} 
                  size={14} 
                  color={getSeverityColor(issue.urgency)} 
                />
                <Text style={[
                  styles.severityText,
                  { color: getSeverityColor(issue.urgency) }
                ]}>
                  {issue.urgency.charAt(0).toUpperCase() + issue.urgency.slice(1)} Priority
                </Text>
              </View>

              <View style={styles.likelihoodIndicator}>
                <Text style={styles.likelihoodText}>
                  {issue.likelihood.charAt(0).toUpperCase() + issue.likelihood.slice(1)} Likelihood
                </Text>
              </View>
            </View>

            {/* Expand Arrow */}
            <View style={styles.expandArrow}>
              <Ionicons name="chevron-forward" size={16} color="#8e8ea0" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Safety Concerns */}
      {diagnosisData.safetyConcerns.length > 0 && (
        <View style={styles.safetySection}>
          <View style={styles.safetySectionHeader}>
            <Ionicons name="shield-checkmark" size={16} color="#ff4444" />
            <Text style={styles.safetySectionTitle}>Safety Concerns</Text>
          </View>
          {diagnosisData.safetyConcerns.map((concern, index) => (
            <View key={index} style={styles.safetyConcern}>
              <Ionicons name="warning" size={14} color="#ff4444" />
              <Text style={styles.safetyConcernText}>{concern}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Professional Service Recommendation */}
      {diagnosisData.professionalNeeded && (
        <View style={styles.professionalSection}>
          <View style={styles.professionalHeader}>
            <Ionicons name="construct" size={16} color="#10a37f" />
            <Text style={styles.professionalTitle}>Professional Service Recommended</Text>
          </View>
          <Text style={styles.professionalText}>
            Based on the diagnosis, professional inspection and repair is recommended for safety and accuracy.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  header: {
    marginBottom: 16,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10a37f',
    marginLeft: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  issuesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  issueCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  topIssueCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10a37f',
    borderWidth: 2,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  issueTitle: {
    flex: 1,
  },
  issueCause: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  topIssueCause: {
    fontSize: 15,
    color: '#10a37f',
  },
  vinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  vinBadgeText: {
    fontSize: 10,
    color: '#10a37f',
    fontWeight: '500',
    marginLeft: 2,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  issueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  likelihoodIndicator: {
    alignItems: 'flex-end',
  },
  likelihoodText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  expandArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -8,
  },
  safetySection: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  safetySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 6,
  },
  safetyConcern: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  safetyConcernText: {
    fontSize: 13,
    color: '#dc2626',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  professionalSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  professionalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10a37f',
    marginLeft: 6,
  },
  professionalText: {
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
  },
});

export default EnhancedDiagnosisDisplay;
