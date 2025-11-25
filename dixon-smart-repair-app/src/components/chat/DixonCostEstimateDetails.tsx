import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../../services/ChatService';
import { DesignSystem } from '../../styles/designSystem';
import DixonEstimateApprovalModal from './DixonEstimateApprovalModal';

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
    vin?: string;
  };
  selectedOption: string;
  breakdown: {
    total: number;
    labor: {
      total: number;
      totalHours?: number;
      hourlyRate?: number;
      items?: Array<{
        description: string;
        hours: number;
        rate: number;
        cost: number;
      }>;
    };
    parts: {
      total: number;
      items?: Array<{
        description: string;
        partNumber?: string;
        cost: number;
        warranty: string;
        retailerName?: string;
        url?: string;
      }>;
    };
    shopFees?: {
      total: number;
    };
    tax: number;
  };
  status: string;
  createdAt: string;
  validUntil: string;
  confidence: number;
  // NEW: Modified estimate fields
  isModified?: boolean;
  originalEstimate?: any;
  modifiedEstimate?: any;
  mechanicNotes?: string;
  modifiedAt?: string;
  mechanicRequestId?: string;
}

interface DixonCostEstimateDetailsProps {
  estimate: CostEstimate;
  onBackToList: () => void;
  onEstimateShared?: (estimateId: string, comment: string) => void;
}

export const DixonCostEstimateDetails: React.FC<DixonCostEstimateDetailsProps> = ({
  estimate,
  onBackToList,
  onEstimateShared,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const handleApproveEstimate = async (estimateId: string, customerNotes?: string) => {
    try {
      console.log('Approving estimate:', { estimateId, customerNotes });
      
      // Call the approval service
      const result = await chatService.approveModifiedEstimate(estimateId, customerNotes);
      
      if (result.success) {
        Alert.alert(
          'Estimate Approved',
          'You have approved the modified estimate. The mechanic has been notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowApprovalModal(false);
                onBackToList(); // Go back to list to see updated status
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to approve estimate');
      }
    } catch (error: any) {
      console.error('Error approving estimate:', error);
      Alert.alert('Error', error.message || 'Failed to approve estimate');
    }
  };

  const handleRejectEstimate = async (estimateId: string, customerNotes: string) => {
    try {
      console.log('Rejecting estimate:', { estimateId, customerNotes });
      
      // Call the rejection service
      const result = await chatService.rejectModifiedEstimate(estimateId, customerNotes);
      
      if (result.success) {
        Alert.alert(
          'Estimate Rejected',
          'You have requested changes to the estimate. The mechanic has been notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowApprovalModal(false);
                onBackToList(); // Go back to list to see updated status
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to reject estimate');
      }
    } catch (error: any) {
      console.error('Error rejecting estimate:', error);
      Alert.alert('Error', error.message || 'Failed to reject estimate');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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

  const handleShareWithMechanic = async () => {
    try {
      setIsSharing(true);
      
      // Use web-compatible prompt for React Native Web
      const comment = window.prompt(
        'Share with Mechanic\n\nAdd a comment for the mechanic (optional):'
      );
      
      // User cancelled the prompt
      if (comment === null) {
        setIsSharing(false);
        return;
      }
      
      try {
        const response = await chatService.shareEstimateWithMechanic({
          estimateId: estimate.estimateId,
          customerComment: comment || '',
          shopId: 'default-shop', // TODO: Get actual shop ID from user context
        });

        if (response.success) {
          Alert.alert(
            'Success',
            'Estimate shared with mechanic successfully!'
          );
          onEstimateShared?.(estimate.estimateId, comment || '');
        } else {
          Alert.alert('Error', response.error || 'Failed to share estimate');
        }
      } catch (error) {
        console.error('Error sharing estimate:', error);
        Alert.alert('Error', 'Failed to share estimate');
      }
    } catch (error) {
      console.error('Error sharing estimate:', error);
      Alert.alert('Error', 'Failed to share estimate');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSavePDF = () => {
    Alert.alert('Save PDF', 'PDF save functionality coming soon!');
  };

  const handleRequestUpdate = () => {
    Alert.alert('Request Update', 'Update request functionality coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToList} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.gray600} />
          <Text style={styles.backText}>Back to Estimates</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Vehicle Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleText}>
              {estimate.vehicleInfo.year} {estimate.vehicleInfo.make} {estimate.vehicleInfo.model}
              {estimate.vehicleInfo.trim && ` ${estimate.vehicleInfo.trim}`}
            </Text>
            {estimate.vehicleInfo.vin && (
              <Text style={styles.vinText}>VIN: {estimate.vehicleInfo.vin}</Text>
            )}
          </View>
        </View>

        {/* Service Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="build" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.sectionTitle}>Service Details</Text>
          </View>
          <Text style={styles.serviceText}>{estimate.selectedOption}</Text>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Confidence:</Text>
              <Text style={styles.metaValue}>{estimate.confidence}%</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Valid Until:</Text>
              <Text style={styles.metaValue}>{formatDate(estimate.validUntil)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(estimate.status) }]}>
                <Text style={styles.statusText}>{getStatusText(estimate.status)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          </View>
          
          <View style={styles.costBreakdown}>
            {/* Labor */}
            <View style={styles.costItem}>
              <View style={styles.costItemHeader}>
                <Text style={styles.costItemTitle}>Labor</Text>
                <Text style={styles.costItemAmount}>${estimate.breakdown.labor.total.toFixed(2)}</Text>
              </View>
              {estimate.breakdown.labor.totalHours && estimate.breakdown.labor.hourlyRate && (
                <Text style={styles.costItemDetail}>
                  {estimate.breakdown.labor.totalHours} hours @ ${estimate.breakdown.labor.hourlyRate}/hr
                </Text>
              )}
            </View>

            {/* Parts */}
            <View style={styles.costItem}>
              <View style={styles.costItemHeader}>
                <Text style={styles.costItemTitle}>Parts</Text>
                <Text style={styles.costItemAmount}>${estimate.breakdown.parts.total.toFixed(2)}</Text>
              </View>
              {estimate.breakdown.parts.items && estimate.breakdown.parts.items.length > 0 && (
                <View style={styles.partsDetails}>
                  {estimate.breakdown.parts.items.map((part, index) => (
                    <View key={index} style={styles.partItem}>
                      <Text style={styles.partDescription}>{part.description}</Text>
                      <Text style={styles.partCost}>${part.cost.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Tax */}
            <View style={styles.costItem}>
              <View style={styles.costItemHeader}>
                <Text style={styles.costItemTitle}>Tax</Text>
                <Text style={styles.costItemAmount}>${estimate.breakdown.tax.toFixed(2)}</Text>
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalSection}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalAmount}>${estimate.breakdown.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {estimate.isModified && estimate.status === 'pending_customer_approval' ? (
            // Modified estimate approval buttons
            <TouchableOpacity
              style={[styles.actionButton, styles.approvalButton]}
              onPress={() => setShowApprovalModal(true)}
            >
              <Ionicons name="eye" size={20} color={DesignSystem.colors.white} />
              <Text style={styles.primaryButtonText}>Review Changes</Text>
            </TouchableOpacity>
          ) : (
            // Original share button
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleShareWithMechanic}
              disabled={isSharing}
            >
              <Ionicons name="share" size={20} color={DesignSystem.colors.white} />
              <Text style={styles.primaryButtonText}>
                {isSharing ? 'Sharing...' : 'Share with Mechanic'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSavePDF}>
              <Ionicons name="document" size={20} color={DesignSystem.colors.primary} />
              <Text style={styles.secondaryButtonText}>Save PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleRequestUpdate}>
              <Ionicons name="refresh" size={20} color={DesignSystem.colors.primary} />
              <Text style={styles.secondaryButtonText}>Request Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Approval Modal */}
      {estimate.isModified && (
        <DixonEstimateApprovalModal
          visible={showApprovalModal}
          estimate={estimate}
          onClose={() => setShowApprovalModal(false)}
          onApprove={handleApproveEstimate}
          onReject={handleRejectEstimate}
        />
      )}
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
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: DesignSystem.colors.gray600,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    marginLeft: 8,
  },
  vehicleInfo: {
    marginLeft: 32,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    marginBottom: 4,
  },
  vinText: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
  },
  serviceText: {
    fontSize: 16,
    color: DesignSystem.colors.gray900,
    marginLeft: 32,
    marginBottom: 12,
  },
  metaInfo: {
    marginLeft: 32,
  },
  metaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    width: 100,
  },
  metaValue: {
    fontSize: 14,
    color: DesignSystem.colors.gray900,
    fontWeight: '500' as const,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: DesignSystem.colors.white,
  },
  costBreakdown: {
    marginLeft: 32,
  },
  costItem: {
    marginBottom: 16,
  },
  costItemHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  costItemTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: DesignSystem.colors.gray900,
  },
  costItemAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  costItemDetail: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
  },
  partsDetails: {
    marginTop: 8,
  },
  partItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  partDescription: {
    fontSize: 14,
    color: DesignSystem.colors.gray700,
    flex: 1,
  },
  partCost: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: DesignSystem.colors.gray900,
  },
  totalSection: {
    borderTopWidth: 2,
    borderTopColor: DesignSystem.colors.gray300,
    paddingTop: 16,
    marginTop: 8,
  },
  totalLine: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: DesignSystem.colors.gray900,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: DesignSystem.colors.primary,
  },
  actionsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: DesignSystem.colors.primary,
  },
  approvalButton: {
    backgroundColor: DesignSystem.colors.blue500,
  },
  primaryButtonText: {
    color: DesignSystem.colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  secondaryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.white,
    flex: 0.45,
  },
  secondaryButtonText: {
    color: DesignSystem.colors.primary,
    fontSize: 14,
    fontWeight: '500' as const,
    marginLeft: 6,
  },
};
