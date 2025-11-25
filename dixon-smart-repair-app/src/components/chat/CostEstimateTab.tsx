import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutomotiveUser } from '../../services/AuthService';
import { chatService } from '../../services/ChatService';
import { CostEstimateDetailModal } from './CostEstimateDetailModal';
import { styles } from './CostEstimateTab.styles';

// Updated interface for user-centric cost estimates
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
      urls?: string[];
    };
    tax: number;
  };
  partUrls?: string[];
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

interface CostEstimateTabProps {
  currentUser: AutomotiveUser | null;
  onClose: () => void;
}

export const CostEstimateTab: React.FC<CostEstimateTabProps> = ({ 
  currentUser, 
  onClose 
}) => {
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<CostEstimate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const handleEstimatePress = (estimate: CostEstimate) => {
    setSelectedEstimate(estimate);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedEstimate(null);
  };

  const handleEstimateShared = (estimateId: string, comment: string) => {
    // Refresh the estimates to show updated status
    fetchUserCostEstimates();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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
          <Text style={styles.headerTitle}>Cost Estimates</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your cost estimates...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cost Estimates</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserCostEstimates}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (costEstimates.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cost Estimates</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Ionicons name="receipt-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No Cost Estimates Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a diagnostic conversation to get cost estimates for your vehicle repairs.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Cost Estimates</Text>
          <Text style={styles.headerSubtitle}>
            {costEstimates.length} estimate{costEstimates.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {costEstimates.map((estimate, index) => (
          <TouchableOpacity 
            key={estimate.id} 
            style={styles.estimateCard}
            onPress={() => handleEstimatePress(estimate)}
            activeOpacity={0.7}
          >
            <View style={styles.estimateHeader}>
              <Text style={styles.estimateId}>#{estimate.estimateId}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(estimate.status) }]}>
                <Text style={styles.statusText}>{getStatusText(estimate.status)}</Text>
              </View>
            </View>
            
            <View style={styles.vehicleInfo}>
              <Ionicons name="car-outline" size={16} color="#666" />
              <Text style={styles.estimateVehicle}>
                {estimate.vehicleInfo?.year} {estimate.vehicleInfo?.make} {estimate.vehicleInfo?.model}
                {estimate.vehicleInfo?.trim && ` ${estimate.vehicleInfo.trim}`}
              </Text>
            </View>
            
            <Text style={styles.estimateOption}>
              {estimate.selectedOption?.replace(/_/g, ' ')} Option
            </Text>
            
            <View style={styles.costBreakdown}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Labor:</Text>
                <Text style={styles.costValue}>${estimate.breakdown?.labor?.total?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Parts:</Text>
                <Text style={styles.costValue}>${estimate.breakdown?.parts?.total?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Tax:</Text>
                <Text style={styles.costValue}>${estimate.breakdown?.tax?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${estimate.breakdown?.total?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
            
            <View style={styles.estimateFooter}>
              <Text style={styles.estimateDate}>
                Created: {formatDate(estimate.createdAt)}
              </Text>
              <Text style={styles.estimateConfidence}>
                Confidence: {estimate.confidence || 0}%
              </Text>
            </View>
            
            {estimate.validUntil && (
              <Text style={styles.validUntil}>
                Valid until: {formatDate(estimate.validUntil)}
              </Text>
            )}
            
            {/* Tap indicator */}
            <View style={styles.tapIndicator}>
              <Text style={styles.tapText}>Tap to view details and share</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cost Estimate Detail Modal */}
      <CostEstimateDetailModal
        visible={showDetailModal}
        estimate={selectedEstimate}
        onClose={handleCloseModal}
        onShare={handleEstimateShared}
      />
    </View>
  );
};
