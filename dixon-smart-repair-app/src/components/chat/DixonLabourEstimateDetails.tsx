import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../styles/designSystem';

// Labour estimate interface (same as in DixonLabourEstimatesList)
interface LabourEstimate {
  reportId: string;
  userId: string;
  conversationId: string;
  repairType: string;
  vehicleInfo: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string;
  };
  initialEstimate: {
    labor_hours_low?: number;
    labor_hours_high?: number;
    labor_hours_average?: number;
    reasoning?: string;
  };
  modelResults: {
    claude_estimate?: {
      labor_hours_low?: number;
      labor_hours_high?: number;
      labor_hours_average?: number;
      reason_for_low?: string;
      reason_for_high?: string;
      reason_for_average?: string;
    };
    web_validation?: {
      labor_hours_low?: number;
      labor_hours_high?: number;
      labor_hours_average?: number;
      confidence?: string;
      search_answer?: string;
      source?: string;
    };
  };
  finalEstimate: {
    labor_hours_low?: number;
    labor_hours_high?: number;
    labor_hours_average?: number;
    reasoning?: string;
  };
  consensusReasoning: string;
  dataQuality?: {
    score?: number;
    level?: string;
    factors?: string[];
    model_count?: number;
  };
  createdAt: string;
  version: string;
}

interface DixonLabourEstimateDetailsProps {
  estimate: LabourEstimate;
  onBackToList: () => void;
}

export const DixonLabourEstimateDetails: React.FC<DixonLabourEstimateDetailsProps> = ({
  estimate,
  onBackToList,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatVehicle = (vehicleInfo: LabourEstimate['vehicleInfo']) => {
    const parts = [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model, vehicleInfo.trim]
      .filter(Boolean);
    return parts.join(' ') || 'Unknown Vehicle';
  };

  const formatHours = (hours?: number) => {
    if (!hours) return 'N/A';
    return `${hours} hours`;
  };

  const getQualityColor = (score?: number) => {
    if (!score) return DesignSystem.colors.gray400;
    if (score >= 80) return DesignSystem.colors.success;
    if (score >= 60) return DesignSystem.colors.warning;
    return DesignSystem.colors.error;
  };

  const getQualityLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 80) return 'High Quality';
    if (score >= 60) return 'Medium Quality';
    return 'Low Quality';
  };

  const renderEstimateSection = (title: string, data: any, icon: string) => {
    if (!data) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon as any} size={20} color={DesignSystem.colors.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionContent}>
          {data.labor_hours_low !== undefined && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Low Estimate:</Text>
              <Text style={styles.dataValue}>{formatHours(data.labor_hours_low)}</Text>
            </View>
          )}
          {data.labor_hours_high !== undefined && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>High Estimate:</Text>
              <Text style={styles.dataValue}>{formatHours(data.labor_hours_high)}</Text>
            </View>
          )}
          {data.labor_hours_average !== undefined && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Average Estimate:</Text>
              <Text style={styles.dataValue}>{formatHours(data.labor_hours_average)}</Text>
            </View>
          )}
          {data.reasoning && (
            <View style={styles.reasoningContainer}>
              <Text style={styles.reasoningLabel}>Reasoning:</Text>
              <Text style={styles.reasoningText}>{data.reasoning}</Text>
            </View>
          )}
          {data.reason_for_low && (
            <View style={styles.reasoningContainer}>
              <Text style={styles.reasoningLabel}>Low End Scenario:</Text>
              <Text style={styles.reasoningText}>{data.reason_for_low}</Text>
            </View>
          )}
          {data.reason_for_high && (
            <View style={styles.reasoningContainer}>
              <Text style={styles.reasoningLabel}>High End Scenario:</Text>
              <Text style={styles.reasoningText}>{data.reason_for_high}</Text>
            </View>
          )}
          {data.reason_for_average && (
            <View style={styles.reasoningContainer}>
              <Text style={styles.reasoningLabel}>Average Scenario:</Text>
              <Text style={styles.reasoningText}>{data.reason_for_average}</Text>
            </View>
          )}
          {data.confidence && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Confidence:</Text>
              <Text style={styles.dataValue}>{data.confidence}</Text>
            </View>
          )}
          {data.search_answer && (
            <View style={styles.reasoningContainer}>
              <Text style={styles.reasoningLabel}>Web Search Result:</Text>
              <Text style={styles.reasoningText}>{data.search_answer}</Text>
            </View>
          )}
          {data.source && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Source:</Text>
              <Text style={styles.dataValue}>{data.source}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToList} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Labour Estimate Details</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.repairType}>{estimate.repairType}</Text>
            <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(estimate.dataQuality?.score) }]}>
              <Text style={styles.qualityBadgeText}>
                {getQualityLabel(estimate.dataQuality?.score)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.vehicle}>{formatVehicle(estimate.vehicleInfo)}</Text>
          <Text style={styles.date}>{formatDate(estimate.createdAt)}</Text>
          
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Report ID</Text>
              <Text style={styles.metadataValue}>{estimate.reportId}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Version</Text>
              <Text style={styles.metadataValue}>{estimate.version}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Quality Score</Text>
              <Text style={styles.metadataValue}>{estimate.dataQuality?.score || 0}%</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Models Used</Text>
              <Text style={styles.metadataValue}>{estimate.dataQuality?.model_count || 0}</Text>
            </View>
          </View>
        </View>

        {/* Initial Agent Estimate */}
        {renderEstimateSection('Initial Agent Estimate', estimate.initialEstimate, 'person')}

        {/* Claude Estimate */}
        {renderEstimateSection('Claude 3.5 Sonnet Estimate', estimate.modelResults.claude_estimate, 'brain')}

        {/* Web Validation */}
        {renderEstimateSection('Web Validation Results', estimate.modelResults.web_validation, 'globe')}

        {/* Final Consensus */}
        {renderEstimateSection('Final Consensus Decision', estimate.finalEstimate, 'checkmark-circle')}

        {/* Consensus Reasoning */}
        {estimate.consensusReasoning && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics" size={20} color={DesignSystem.colors.primary} />
              <Text style={styles.sectionTitle}>Consensus Reasoning</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.consensusText}>{estimate.consensusReasoning}</Text>
            </View>
          </View>
        )}

        {/* Data Quality Analysis */}
        {estimate.dataQuality && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bar-chart" size={20} color={DesignSystem.colors.primary} />
              <Text style={styles.sectionTitle}>Data Quality Analysis</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Quality Score:</Text>
                <Text style={[styles.dataValue, { color: getQualityColor(estimate.dataQuality.score) }]}>
                  {estimate.dataQuality.score}% ({estimate.dataQuality.level})
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Model Count:</Text>
                <Text style={styles.dataValue}>{estimate.dataQuality.model_count}</Text>
              </View>
              {estimate.dataQuality.factors && estimate.dataQuality.factors.length > 0 && (
                <View style={styles.reasoningContainer}>
                  <Text style={styles.reasoningLabel}>Quality Factors:</Text>
                  {estimate.dataQuality.factors.map((factor, index) => (
                    <Text key={index} style={styles.factorText}>• {factor}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Technical Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={20} color={DesignSystem.colors.primary} />
            <Text style={styles.sectionTitle}>Technical Details</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Conversation ID:</Text>
              <Text style={styles.dataValue}>{estimate.conversationId}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>User ID:</Text>
              <Text style={styles.dataValue}>{estimate.userId}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>System Version:</Text>
              <Text style={styles.dataValue}>{estimate.version}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.gray50,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
    backgroundColor: DesignSystem.colors.white,
  },
  backButton: {
    marginRight: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.xs,
  },
  headerTitle: {
    fontSize: DesignSystem.typography.xl,
    fontWeight: DesignSystem.typography.weights.bold as any,
    color: DesignSystem.colors.gray900,
  },
  content: {
    flex: 1,
    padding: DesignSystem.spacing.md,
  },
  overviewCard: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.md,
    shadowColor: DesignSystem.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: DesignSystem.spacing.sm,
  },
  repairType: {
    fontSize: DesignSystem.typography.xl,
    fontWeight: DesignSystem.typography.weights.bold as any,
    color: DesignSystem.colors.gray900,
    textTransform: 'capitalize' as const,
    flex: 1,
  },
  qualityBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.full,
    marginLeft: DesignSystem.spacing.sm,
  },
  qualityBadgeText: {
    color: DesignSystem.colors.white,
    fontSize: DesignSystem.typography.xs,
    fontWeight: DesignSystem.typography.weights.bold as any,
  },
  vehicle: {
    fontSize: DesignSystem.typography.lg,
    color: DesignSystem.colors.gray700,
    marginBottom: DesignSystem.spacing.xs,
  },
  date: {
    fontSize: DesignSystem.typography.sm,
    color: DesignSystem.colors.gray500,
    marginBottom: DesignSystem.spacing.md,
  },
  metadataGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginTop: DesignSystem.spacing.sm,
  },
  metadataItem: {
    width: '50%',
    marginBottom: DesignSystem.spacing.sm,
  },
  metadataLabel: {
    fontSize: DesignSystem.typography.xs,
    color: DesignSystem.colors.gray500,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  metadataValue: {
    fontSize: DesignSystem.typography.sm,
    fontWeight: DesignSystem.typography.weights.medium as any,
    color: DesignSystem.colors.gray900,
    marginTop: 2,
  },
  section: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: DesignSystem.borderRadius.lg,
    marginBottom: DesignSystem.spacing.md,
    shadowColor: DesignSystem.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray100,
  },
  sectionTitle: {
    fontSize: DesignSystem.typography.lg,
    fontWeight: DesignSystem.typography.weights.semibold as any,
    color: DesignSystem.colors.gray900,
    marginLeft: DesignSystem.spacing.sm,
  },
  sectionContent: {
    padding: DesignSystem.spacing.md,
  },
  dataRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: DesignSystem.spacing.xs,
  },
  dataLabel: {
    fontSize: DesignSystem.typography.sm,
    color: DesignSystem.colors.gray600,
    flex: 1,
  },
  dataValue: {
    fontSize: DesignSystem.typography.sm,
    fontWeight: DesignSystem.typography.weights.medium as any,
    color: DesignSystem.colors.gray900,
    textAlign: 'right' as const,
    flex: 1,
  },
  reasoningContainer: {
    marginTop: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray100,
  },
  reasoningLabel: {
    fontSize: DesignSystem.typography.sm,
    fontWeight: DesignSystem.typography.weights.medium as any,
    color: DesignSystem.colors.gray700,
    marginBottom: DesignSystem.spacing.xs,
  },
  reasoningText: {
    fontSize: DesignSystem.typography.sm,
    color: DesignSystem.colors.gray600,
    lineHeight: 20,
  },
  consensusText: {
    fontSize: DesignSystem.typography.base,
    color: DesignSystem.colors.gray700,
    lineHeight: 22,
  },
  factorText: {
    fontSize: DesignSystem.typography.sm,
    color: DesignSystem.colors.gray600,
    marginTop: DesignSystem.spacing.xs,
    paddingLeft: DesignSystem.spacing.sm,
  },
};
