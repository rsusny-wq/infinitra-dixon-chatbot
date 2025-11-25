import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutomotiveUser } from '../../services/AuthService';
import { ChatService } from '../../services/ChatService';
import { DesignSystem } from '../../styles/designSystem';

// Labour estimate interface based on DynamoDB LaborEstimateReports structure
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

interface DixonLabourEstimatesListProps {
  currentUser: AutomotiveUser | null;
  onBackToChat: () => void;
  onEstimateSelect: (estimate: LabourEstimate) => void;
}

export const DixonLabourEstimatesList: React.FC<DixonLabourEstimatesListProps> = ({
  currentUser,
  onBackToChat,
  onEstimateSelect,
}) => {
  const [estimates, setEstimates] = useState<LabourEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize ChatService
  const chatService = React.useMemo(() => new ChatService(), []);

  const fetchLabourEstimates = async (isRefresh = false) => {
    if (!currentUser?.userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Fetching labour estimates for user:', currentUser.userId);
      
      const response = await chatService.getUserLabourEstimates(currentUser.userId, 20);
      
      if (response.success) {
        console.log('Labour estimates fetched successfully:', response.estimates?.length || 0);
        setEstimates(response.estimates || []);
      } else {
        console.error('Failed to fetch labour estimates:', response.error);
        setError(response.error || 'Failed to load labour estimates');
        setEstimates([]);
      }
    } catch (err) {
      console.error('Error fetching labour estimates:', err);
      setError('Failed to load labour estimates. Please try again.');
      setEstimates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLabourEstimates();
  }, [currentUser?.userId]);

  const onRefresh = () => {
    fetchLabourEstimates(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
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
    return `${hours}h`;
  };

  const getQualityColor = (score?: number) => {
    if (!score) return DesignSystem.colors.gray400;
    if (score >= 80) return DesignSystem.colors.success;
    if (score >= 60) return DesignSystem.colors.warning;
    return DesignSystem.colors.error;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackToChat} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Labour Estimates</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
          <Text style={styles.loadingText}>Loading labour estimates...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToChat} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Labour Estimates</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={DesignSystem.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchLabourEstimates()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : estimates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct" size={64} color={DesignSystem.colors.gray400} />
            <Text style={styles.emptyTitle}>No Labour Estimates</Text>
            <Text style={styles.emptySubtitle}>
              Labour estimates will appear here after you receive repair estimates from Dixon.
            </Text>
          </View>
        ) : (
          <View style={styles.estimatesList}>
            {estimates.map((estimate) => (
              <TouchableOpacity
                key={estimate.reportId}
                style={styles.estimateCard}
                onPress={() => onEstimateSelect(estimate)}
                activeOpacity={0.7}
              >
                <View style={styles.estimateHeader}>
                  <View style={styles.estimateTitle}>
                    <Text style={styles.repairType}>{estimate.repairType}</Text>
                    <Text style={styles.vehicle}>{formatVehicle(estimate.vehicleInfo)}</Text>
                  </View>
                  <View style={styles.qualityBadge}>
                    <View style={[styles.qualityDot, { backgroundColor: getQualityColor(estimate.dataQuality?.score) }]} />
                    <Text style={styles.qualityText}>
                      {estimate.dataQuality?.score || 0}% Quality
                    </Text>
                  </View>
                </View>

                <View style={styles.estimateDetails}>
                  <View style={styles.estimateRow}>
                    <Text style={styles.estimateLabel}>Final Estimate:</Text>
                    <Text style={styles.estimateValue}>
                      {formatHours(estimate.finalEstimate.labor_hours_low)} - {formatHours(estimate.finalEstimate.labor_hours_high)}
                    </Text>
                  </View>
                  
                  <View style={styles.estimateRow}>
                    <Text style={styles.estimateLabel}>Models Used:</Text>
                    <Text style={styles.estimateValue}>
                      {estimate.dataQuality?.model_count || 0} models
                    </Text>
                  </View>

                  <View style={styles.estimateRow}>
                    <Text style={styles.estimateLabel}>Version:</Text>
                    <Text style={styles.estimateValue}>{estimate.version}</Text>
                  </View>
                </View>

                <View style={styles.estimateFooter}>
                  <Text style={styles.dateText}>{formatDate(estimate.createdAt)}</Text>
                  <Ionicons name="chevron-forward" size={20} color={DesignSystem.colors.gray400} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.white,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  loadingText: {
    marginTop: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.base,
    color: DesignSystem.colors.gray600,
    textAlign: 'center' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  errorText: {
    marginTop: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.base,
    color: DesignSystem.colors.error,
    textAlign: 'center' as const,
  },
  retryButton: {
    marginTop: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: DesignSystem.borderRadius.md,
  },
  retryButtonText: {
    color: DesignSystem.colors.white,
    fontSize: DesignSystem.typography.base,
    fontWeight: DesignSystem.typography.weights.medium as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  emptyTitle: {
    marginTop: DesignSystem.spacing.lg,
    fontSize: DesignSystem.typography.xl,
    fontWeight: DesignSystem.typography.weights.bold as any,
    color: DesignSystem.colors.gray900,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    marginTop: DesignSystem.spacing.sm,
    fontSize: DesignSystem.typography.base,
    color: DesignSystem.colors.gray600,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  estimatesList: {
    padding: DesignSystem.spacing.md,
  },
  estimateCard: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    shadowColor: DesignSystem.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  estimateHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: DesignSystem.spacing.sm,
  },
  estimateTitle: {
    flex: 1,
  },
  repairType: {
    fontSize: DesignSystem.typography.lg,
    fontWeight: DesignSystem.typography.weights.semibold as any,
    color: DesignSystem.colors.gray900,
    textTransform: 'capitalize' as const,
  },
  vehicle: {
    fontSize: DesignSystem.typography.sm,
    color: DesignSystem.colors.gray600,
    marginTop: 2,
  },
  qualityBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: DesignSystem.colors.gray100,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.full,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DesignSystem.spacing.xs,
  },
  qualityText: {
    fontSize: DesignSystem.typography.xs,
    fontWeight: DesignSystem.typography.weights.medium as any,
    color: DesignSystem.colors.gray700,
  },
  estimateDetails: {
    marginBottom: DesignSystem.spacing.sm,
  },
  estimateRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: DesignSystem.spacing.xs,
  },
  estimateLabel: {
    fontSize: DesignSystem.typography.sm,
    color: DesignSystem.colors.gray600,
  },
  estimateValue: {
    fontSize: DesignSystem.typography.sm,
    fontWeight: DesignSystem.typography.weights.medium as any,
    color: DesignSystem.colors.gray900,
  },
  estimateFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray100,
  },
  dateText: {
    fontSize: DesignSystem.typography.xs,
    color: DesignSystem.colors.gray500,
  },
};
