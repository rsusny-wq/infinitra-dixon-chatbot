import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutomotiveUser } from '../../services/AuthService';
import { chatService } from '../../services/ChatService';
import { DesignSystem } from '../../styles/designSystem';

// Cost estimate interface
interface CostEstimate {
  id: string;
  estimateId: string;
  userId: string;
  conversationId: string;
  vehicleInfo: {
    year: string;
    make: string;
    model: string;
    trim?: string;
  };
  selectedOption: string;
  breakdown: {
    total: number;
    labor: {
      total: number;
    };
    parts: {
      total: number;
    };
    tax: number;
  };
  status: string;
  createdAt: string;
  validUntil: string;
  confidence: number;
}

interface UserCostEstimatesResponse {
  success: boolean;
  estimates: CostEstimate[];
  count: number;
  error?: string;
}

interface DixonCostEstimatesListProps {
  currentUser: AutomotiveUser | null;
  onBackToChat: () => void;
  onEstimateSelect: (estimate: CostEstimate) => void;
}

export const DixonCostEstimatesList: React.FC<DixonCostEstimatesListProps> = ({ 
  currentUser, 
  onBackToChat,
  onEstimateSelect
}) => {
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserCostEstimates = async () => {
    if (!currentUser?.userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('📊 Fetching cost estimates for user:', currentUser.userId);
      
      const response = await chatService.getUserCostEstimates(currentUser.userId, 10);
      console.log('📊 User cost estimates response:', response);
      
      if (response.success && response.estimates) {
        setCostEstimates(response.estimates);
      } else {
        setError(response.error || 'Failed to load cost estimates');
        setCostEstimates([]);
      }
    } catch (err) {
      console.error('❌ Error fetching user cost estimates:', err);
      setError('Failed to load cost estimates');
      setCostEstimates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserCostEstimates();
  }, [currentUser?.userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserCostEstimates();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string, isModified?: boolean) => {
    if (isModified) {
      switch (status) {
        case 'pending_customer_approval':
          return '#FF9500'; // Orange - needs customer approval
        case 'customer_approved':
          return '#34C759'; // Green - customer approved
        case 'customer_rejected':
          return '#FF3B30'; // Red - customer rejected
        default:
          return '#007AFF'; // Blue - modified
      }
    }
    
    switch (status) {
      case 'shown_to_customer_pending_mechanic_approval':
        return '#FF9500'; // Orange
      case 'approved':
        return '#34C759'; // Green
      case 'rejected':
        return '#FF3B30'; // Red
      default:
        return '#8E8E93'; // Gray
    }
  };

  const getStatusText = (status: string, isModified?: boolean) => {
    if (isModified) {
      switch (status) {
        case 'pending_customer_approval':
          return 'Modified - Needs Approval';
        case 'customer_approved':
          return 'Approved by Customer';
        case 'customer_rejected':
          return 'Rejected by Customer';
        default:
          return 'Modified by Mechanic';
      }
    }
    
    switch (status) {
      case 'shown_to_customer_pending_mechanic_approval':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Draft';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackToChat} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.gray600} />
            <Text style={styles.backText}>Back to Chat</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cost estimates...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackToChat} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.gray600} />
            <Text style={styles.backText}>Back to Chat</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchUserCostEstimates} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToChat} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.gray600} />
          <Text style={styles.backText}>Back to Chat</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cost Estimates</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {costEstimates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calculator-outline" size={48} color={DesignSystem.colors.gray400} />
            <Text style={styles.emptyTitle}>No Cost Estimates</Text>
            <Text style={styles.emptyText}>
              Start a diagnostic conversation to get repair cost estimates.
            </Text>
          </View>
        ) : (
          costEstimates.map((estimate) => (
            <TouchableOpacity
              key={estimate.id}
              style={styles.estimateCard}
              onPress={() => onEstimateSelect(estimate)}
            >
              <View style={styles.estimateHeader}>
                <Text style={styles.vehicleText}>
                  {estimate.vehicleInfo.year} {estimate.vehicleInfo.make} {estimate.vehicleInfo.model}
                  {estimate.vehicleInfo.trim && ` ${estimate.vehicleInfo.trim}`}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(estimate.status, estimate.isModified) }]}>
                  <Text style={styles.statusText}>{getStatusText(estimate.status, estimate.isModified)}</Text>
                </View>
              </View>
              
              <Text style={styles.serviceText}>{estimate.selectedOption}</Text>
              
              <View style={styles.estimateFooter}>
                <Text style={styles.costText}>
                  ${estimate.breakdown.total.toFixed(2)}
                </Text>
                <Text style={styles.dateText}>
                  {formatDate(estimate.createdAt)}
                </Text>
              </View>
              
              <View style={styles.chevron}>
                <Ionicons name="chevron-forward" size={20} color={DesignSystem.colors.gray400} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
    backgroundColor: DesignSystem.colors.white,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: DesignSystem.colors.gray600,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: DesignSystem.colors.red500,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: DesignSystem.colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  estimateCard: {
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    position: 'relative' as const,
  },
  estimateHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: DesignSystem.colors.white,
  },
  serviceText: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginBottom: 12,
  },
  estimateFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  costText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: DesignSystem.colors.primary,
  },
  dateText: {
    fontSize: 14,
    color: DesignSystem.colors.gray500,
  },
  chevron: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
};
