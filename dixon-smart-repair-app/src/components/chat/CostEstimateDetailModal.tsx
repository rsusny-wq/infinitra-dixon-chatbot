import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../../services/ChatService';

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
      urls?: string[];
      items?: Array<{
        description: string;
        partNumber: string;
        cost: number;
        warranty: string;
        retailerName: string;
        url?: string;
      }>;
    };
    shopFees?: {
      total: number;
    };
    tax: number;
  };
  partUrls?: string[];
  status: string;
  createdAt: string;
  validUntil: string;
  confidence: number;
}

interface CostEstimateDetailModalProps {
  visible: boolean;
  estimate: CostEstimate | null;
  onClose: () => void;
  onShare?: (estimateId: string, comment: string) => void;
}

export const CostEstimateDetailModal: React.FC<CostEstimateDetailModalProps> = ({
  visible,
  estimate,
  onClose,
  onShare,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  if (!estimate) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shown_to_customer_pending_mechanic_approval':
        return '#FF9500';
      case 'approved':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'mechanic_approved':
        return '#34C759';
      case 'mechanic_modified':
        return '#007AFF';
      case 'mechanic_rejected':
        return '#FF3B30';
      default:
        return '#8E8E93';
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
      case 'mechanic_approved':
        return 'Mechanic Approved';
      case 'mechanic_modified':
        return 'Modified by Mechanic';
      case 'mechanic_rejected':
        return 'Mechanic Rejected';
      default:
        return 'Draft';
    }
  };

  const handleShareWithMechanic = async () => {
    if (!shareComment.trim()) {
      Alert.alert('Comment Required', 'Please add a comment or question for the mechanic.');
      return;
    }

    setIsSharing(true);
    try {
      // Call the shareEstimateWithMechanic mutation
      const response = await chatService.shareEstimateWithMechanic({
        estimateId: estimate.estimateId,
        customerComment: shareComment.trim(),
        shopId: 'dixon-repair-main', // Default shop for now
      });

      if (response.success) {
        Alert.alert(
          'Estimate Shared',
          'Your cost estimate has been shared with the mechanic. You\'ll be notified when they respond.',
          [{ text: 'OK' }]
        );
        setShowShareModal(false);
        setShareComment('');
        if (onShare) {
          onShare(estimate.estimateId, shareComment.trim());
        }
      } else {
        throw new Error(response.error || 'Failed to share estimate');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share estimate with mechanic. Please try again.');
      console.error('Error sharing estimate:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Cost Estimate Details</Text>
              <Text style={styles.headerSubtitle}>#{estimate.estimateId}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Status Badge */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(estimate.status) }]}>
                <Text style={styles.statusText}>{getStatusText(estimate.status)}</Text>
              </View>
              <Text style={styles.confidenceText}>
                Confidence: {estimate.confidence}%
              </Text>
            </View>

            {/* Vehicle Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleRow}>
                  <Ionicons name="car-outline" size={20} color="#007AFF" />
                  <Text style={styles.vehicleText}>
                    {estimate.vehicleInfo.year} {estimate.vehicleInfo.make} {estimate.vehicleInfo.model}
                    {estimate.vehicleInfo.trim && ` ${estimate.vehicleInfo.trim}`}
                  </Text>
                </View>
                {estimate.vehicleInfo.vin && (
                  <Text style={styles.vinText}>VIN: {estimate.vehicleInfo.vin}</Text>
                )}
                <Text style={styles.optionText}>
                  Selected Option: {estimate.selectedOption.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            {/* Cost Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost Breakdown</Text>
              
              {/* Labor Details */}
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Labor</Text>
                {estimate.breakdown.labor.items?.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    <Text style={styles.itemDetails}>
                      {item.hours}h × ${item.rate}/hr = ${item.cost.toFixed(2)}
                    </Text>
                  </View>
                )) || (
                  <View style={styles.itemRow}>
                    <Text style={styles.itemDescription}>Labor Services</Text>
                    <Text style={styles.itemDetails}>
                      {estimate.breakdown.labor.totalHours || 'N/A'}h × ${estimate.breakdown.labor.hourlyRate || 95}/hr
                    </Text>
                  </View>
                )}
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalText}>Labor Total: ${estimate.breakdown.labor.total.toFixed(2)}</Text>
                </View>
              </View>

              {/* Parts Details */}
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Parts</Text>
                {estimate.breakdown.parts.items?.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    <Text style={styles.itemDetails}>
                      Part #{item.partNumber} - ${item.cost.toFixed(2)}
                    </Text>
                    <Text style={styles.warrantyText}>
                      {item.warranty} warranty from {item.retailerName}
                    </Text>
                  </View>
                )) || (
                  <View style={styles.itemRow}>
                    <Text style={styles.itemDescription}>Parts & Materials</Text>
                  </View>
                )}
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalText}>Parts Total: ${estimate.breakdown.parts.total.toFixed(2)}</Text>
                </View>
                
                {/* Part URLs */}
                {(estimate.partUrls || estimate.breakdown.parts.urls) && (
                  <View style={styles.urlsSection}>
                    <Text style={styles.urlsTitle}>Where to Buy:</Text>
                    {(estimate.partUrls || estimate.breakdown.parts.urls)?.map((url, index) => {
                      // Extract retailer name from URL for display
                      let retailerName = 'View Part';
                      try {
                        const hostname = new URL(url).hostname.toLowerCase();
                        if (hostname.includes('autozone')) retailerName = 'AutoZone';
                        else if (hostname.includes('amazon')) retailerName = 'Amazon';
                        else if (hostname.includes('toyota')) retailerName = 'Toyota Parts';
                        else if (hostname.includes('honda')) retailerName = 'Honda Parts';
                        else if (hostname.includes('advanceautoparts')) retailerName = 'Advance Auto';
                        else retailerName = hostname.replace('www.', '').split('.')[0];
                      } catch (e) {
                        // Keep default name if URL parsing fails
                      }
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.urlButton}
                          onPress={() => Linking.openURL(url)}
                        >
                          <Ionicons name="link-outline" size={16} color="#007AFF" />
                          <Text style={styles.urlText}>{retailerName}</Text>
                          <Ionicons name="open-outline" size={14} color="#007AFF" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Shop Fees */}
              {estimate.breakdown.shopFees && (
                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownTitle}>Shop Fees</Text>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemDescription}>Environmental & Shop Fees</Text>
                  </View>
                  <View style={styles.subtotalRow}>
                    <Text style={styles.subtotalText}>Fees Total: ${estimate.breakdown.shopFees.total.toFixed(2)}</Text>
                  </View>
                </View>
              )}

              {/* Tax and Total */}
              <View style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax:</Text>
                  <Text style={styles.totalValue}>${estimate.breakdown.tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total:</Text>
                  <Text style={styles.grandTotalValue}>${estimate.breakdown.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Estimate Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estimate Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>{formatDate(estimate.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Valid Until:</Text>
                  <Text style={styles.infoValue}>{formatDate(estimate.validUntil)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Conversation:</Text>
                  <Text style={styles.infoValue}>#{estimate.conversationId}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setShowShareModal(true)}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>Share with Mechanic</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalContainer}>
          <View style={styles.shareHeader}>
            <TouchableOpacity
              onPress={() => setShowShareModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.shareTitle}>Share with Mechanic</Text>
            
            <TouchableOpacity
              onPress={handleShareWithMechanic}
              style={[styles.sendButton, isSharing && styles.sendButtonDisabled]}
              disabled={isSharing}
            >
              <Text style={styles.sendButtonText}>
                {isSharing ? 'Sharing...' : 'Share'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shareContent}>
            <Text style={styles.shareDescription}>
              Add a comment or question about this estimate for the mechanic:
            </Text>
            
            <TextInput
              style={styles.commentInput}
              value={shareComment}
              onChangeText={setShareComment}
              placeholder="e.g., Can you review this estimate and let me know if there are any budget-friendly alternatives?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            
            <Text style={styles.characterCount}>
              {shareComment.length}/500 characters
            </Text>

            <View style={styles.shareInfo}>
              <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.shareInfoText}>
                The mechanic will review your estimate and may suggest modifications or alternatives. You'll be notified when they respond.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  vinText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  breakdownCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  itemRow: {
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  warrantyText: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 2,
  },
  subtotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
    marginTop: 8,
  },
  subtotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
  },
  totalCard: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#000',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#007AFF',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  actionButtons: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  shareModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 50,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  sendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareContent: {
    flex: 1,
    padding: 16,
  },
  shareDescription: {
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#F9F9F9',
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  shareInfoText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  urlsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  urlsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  urlText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
    marginRight: 6,
    flex: 1,
    fontWeight: '500',
  },
});
