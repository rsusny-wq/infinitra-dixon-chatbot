import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../styles/designSystem';

interface PartItem {
  description: string;
  cost: number;
  warranty: string;
  url?: string;
}

interface EstimateBreakdown {
  total: number;
  parts: {
    total: number;
    items?: PartItem[];
  };
  labor: {
    total: number;
    totalHours?: number;
    hourlyRate?: number;
  };
  shopFees?: {
    total: number;
  };
  tax: number;
}

interface CostEstimate {
  id: string;
  estimateId: string;
  vehicleInfo: {
    year: string;
    make: string;
    model: string;
    trim?: string;
  };
  selectedOption: string;
  breakdown: EstimateBreakdown;
  status: string;
  confidence: number;
  createdAt: string;
  // Modified estimate fields
  isModified?: boolean;
  originalEstimate?: any;
  modifiedEstimate?: any;
  mechanicNotes?: string;
  modifiedAt?: string;
  mechanicRequestId?: string;
}

interface DixonEstimateApprovalModalProps {
  visible: boolean;
  estimate: CostEstimate;
  onClose: () => void;
  onApprove: (estimateId: string, customerNotes?: string) => void;
  onReject: (estimateId: string, customerNotes: string) => void;
}

export default function DixonEstimateApprovalModal({
  visible,
  estimate,
  onClose,
  onApprove,
  onReject,
}: DixonEstimateApprovalModalProps) {
  const [customerNotes, setCustomerNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = () => {
    setActionType('approve');
    setShowNotesInput(true);
  };

  const handleReject = () => {
    setActionType('reject');
    setShowNotesInput(true);
  };

  const handleConfirmAction = () => {
    if (actionType === 'approve') {
      onApprove(estimate.estimateId, customerNotes.trim() || undefined);
    } else if (actionType === 'reject') {
      if (!customerNotes.trim()) {
        Alert.alert('Required', 'Please provide a reason for rejecting the estimate.');
        return;
      }
      onReject(estimate.estimateId, customerNotes.trim());
    }
    
    // Reset state
    setCustomerNotes('');
    setShowNotesInput(false);
    setActionType(null);
  };

  const handleCancel = () => {
    setCustomerNotes('');
    setShowNotesInput(false);
    setActionType(null);
  };

  const renderBreakdownComparison = () => {
    const original = estimate.originalEstimate?.breakdown || estimate.breakdown;
    const modified = estimate.modifiedEstimate?.breakdown || estimate.breakdown;

    return (
      <View style={styles.comparisonContainer}>
        <Text style={styles.comparisonTitle}>Cost Comparison</Text>
        
        {/* Parts Comparison */}
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>Parts:</Text>
          <View style={styles.comparisonValues}>
            <Text style={[styles.originalValue, original.parts.total !== modified.parts.total && styles.changedValue]}>
              ${original.parts.total.toFixed(2)}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={DesignSystem.colors.gray400} />
            <Text style={[styles.modifiedValue, original.parts.total !== modified.parts.total && styles.highlightedValue]}>
              ${modified.parts.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Labor Comparison */}
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>Labor:</Text>
          <View style={styles.comparisonValues}>
            <Text style={[styles.originalValue, original.labor.total !== modified.labor.total && styles.changedValue]}>
              ${original.labor.total.toFixed(2)}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={DesignSystem.colors.gray400} />
            <Text style={[styles.modifiedValue, original.labor.total !== modified.labor.total && styles.highlightedValue]}>
              ${modified.labor.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Labor Hours Comparison */}
        {modified.labor.totalHours && (
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonSubLabel}>Hours:</Text>
            <View style={styles.comparisonValues}>
              <Text style={[styles.originalValue, (original.labor.totalHours || 0) !== modified.labor.totalHours && styles.changedValue]}>
                {original.labor.totalHours || 'N/A'}h
              </Text>
              <Ionicons name="arrow-forward" size={16} color={DesignSystem.colors.gray400} />
              <Text style={[styles.modifiedValue, (original.labor.totalHours || 0) !== modified.labor.totalHours && styles.highlightedValue]}>
                {modified.labor.totalHours}h @ ${modified.labor.hourlyRate || 95}/h
              </Text>
            </View>
          </View>
        )}

        {/* Shop Fees Comparison */}
        {modified.shopFees && (
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Shop Fees:</Text>
            <View style={styles.comparisonValues}>
              <Text style={[styles.originalValue, (original.shopFees?.total || 0) !== modified.shopFees.total && styles.changedValue]}>
                ${(original.shopFees?.total || 0).toFixed(2)}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={DesignSystem.colors.gray400} />
              <Text style={[styles.modifiedValue, (original.shopFees?.total || 0) !== modified.shopFees.total && styles.highlightedValue]}>
                ${modified.shopFees.total.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Tax Comparison */}
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>Tax:</Text>
          <View style={styles.comparisonValues}>
            <Text style={[styles.originalValue, original.tax !== modified.tax && styles.changedValue]}>
              ${original.tax.toFixed(2)}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={DesignSystem.colors.gray400} />
            <Text style={[styles.modifiedValue, original.tax !== modified.tax && styles.highlightedValue]}>
              ${modified.tax.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Total Comparison */}
        <View style={[styles.comparisonRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <View style={styles.comparisonValues}>
            <Text style={[styles.originalTotal, original.total !== modified.total && styles.changedValue]}>
              ${original.total.toFixed(2)}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={DesignSystem.colors.gray400} />
            <Text style={[styles.modifiedTotal, original.total !== modified.total && styles.highlightedTotal]}>
              ${modified.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Savings/Additional Cost */}
        {original.total !== modified.total && (
          <View style={styles.savingsContainer}>
            <Text style={[
              styles.savingsText,
              modified.total < original.total ? styles.savingsPositive : styles.savingsNegative
            ]}>
              {modified.total < original.total ? 'You save: ' : 'Additional cost: '}
              ${Math.abs(original.total - modified.total).toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderPartsChanges = () => {
    const originalParts = estimate.originalEstimate?.breakdown?.parts?.items || [];
    const modifiedParts = estimate.modifiedEstimate?.breakdown?.parts?.items || [];

    if (!modifiedParts.length) return null;

    return (
      <View style={styles.partsChangesContainer}>
        <Text style={styles.sectionTitle}>Parts Changes</Text>
        
        {modifiedParts.map((part, index) => {
          const originalPart = originalParts[index];
          const isNew = !originalPart;
          const isChanged = originalPart && (
            originalPart.description !== part.description ||
            originalPart.cost !== part.cost ||
            originalPart.warranty !== part.warranty
          );

          return (
            <View key={index} style={[
              styles.partItem,
              isNew && styles.newPartItem,
              isChanged && styles.changedPartItem
            ]}>
              {isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              {isChanged && (
                <View style={styles.changedBadge}>
                  <Text style={styles.changedBadgeText}>MODIFIED</Text>
                </View>
              )}
              
              <Text style={styles.partDescription}>{part.description}</Text>
              <View style={styles.partDetails}>
                <Text style={styles.partCost}>${part.cost.toFixed(2)}</Text>
                <Text style={styles.partWarranty}>Warranty: {part.warranty}</Text>
              </View>
              
              {originalPart && isChanged && (
                <View style={styles.originalPartInfo}>
                  <Text style={styles.originalPartText}>
                    Original: {originalPart.description} - ${originalPart.cost.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={DesignSystem.colors.gray600} />
          </TouchableOpacity>
          <Text style={styles.title}>Estimate Modified by Mechanic</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Vehicle Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <Text style={styles.vehicleInfo}>
              {estimate.vehicleInfo.year} {estimate.vehicleInfo.make} {estimate.vehicleInfo.model}
              {estimate.vehicleInfo.trim && ` ${estimate.vehicleInfo.trim}`}
            </Text>
          </View>

          {/* Mechanic Notes */}
          {estimate.mechanicNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mechanic's Notes</Text>
              <View style={styles.mechanicNotesContainer}>
                <Ionicons name="person" size={20} color={DesignSystem.colors.blue500} />
                <Text style={styles.mechanicNotes}>{estimate.mechanicNotes}</Text>
              </View>
            </View>
          )}

          {/* Cost Comparison */}
          {renderBreakdownComparison()}

          {/* Parts Changes */}
          {renderPartsChanges()}

          {/* Modified Date */}
          {estimate.modifiedAt && (
            <View style={styles.section}>
              <Text style={styles.modifiedDate}>
                Modified on {new Date(estimate.modifiedAt).toLocaleDateString()} at{' '}
                {new Date(estimate.modifiedAt).toLocaleTimeString()}
              </Text>
            </View>
          )}

          {/* Customer Notes Input */}
          {showNotesInput && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {actionType === 'approve' ? 'Additional Comments (Optional)' : 'Reason for Rejection *'}
              </Text>
              <TextInput
                style={styles.notesInput}
                placeholder={
                  actionType === 'approve' 
                    ? 'Any additional comments for the mechanic...' 
                    : 'Please explain why you are rejecting this estimate...'
                }
                value={customerNotes}
                onChangeText={setCustomerNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!showNotesInput ? (
            <>
              <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.rejectButtonText}>Request Changes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.approveButtonText}>Approve Estimate</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAction}>
                <Text style={styles.confirmButtonText}>
                  {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DesignSystem.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
    marginBottom: 12,
  },
  vehicleInfo: {
    fontSize: 16,
    color: DesignSystem.colors.gray700,
    fontWeight: '500',
  },
  mechanicNotesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DesignSystem.colors.blue50,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: DesignSystem.colors.blue500,
  },
  mechanicNotes: {
    flex: 1,
    fontSize: 14,
    color: DesignSystem.colors.gray700,
    marginLeft: 8,
    lineHeight: 20,
  },
  comparisonContainer: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray700,
    fontWeight: '500',
    flex: 1,
  },
  comparisonSubLabel: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    fontWeight: '500',
    flex: 1,
    paddingLeft: 16,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalValue: {
    fontSize: 14,
    color: DesignSystem.colors.gray500,
    textAlign: 'right',
    minWidth: 60,
  },
  modifiedValue: {
    fontSize: 14,
    color: DesignSystem.colors.gray900,
    fontWeight: '500',
    textAlign: 'right',
    minWidth: 60,
  },
  changedValue: {
    textDecorationLine: 'line-through',
  },
  highlightedValue: {
    color: DesignSystem.colors.blue600,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray200,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
    flex: 1,
  },
  originalTotal: {
    fontSize: 16,
    color: DesignSystem.colors.gray500,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 80,
  },
  modifiedTotal: {
    fontSize: 16,
    color: DesignSystem.colors.gray900,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 80,
  },
  highlightedTotal: {
    color: DesignSystem.colors.blue600,
  },
  savingsContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  savingsPositive: {
    color: DesignSystem.colors.green600,
  },
  savingsNegative: {
    color: DesignSystem.colors.red600,
  },
  partsChangesContainer: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  partItem: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
  },
  newPartItem: {
    borderColor: DesignSystem.colors.green500,
    backgroundColor: DesignSystem.colors.green50,
  },
  changedPartItem: {
    borderColor: DesignSystem.colors.blue500,
    backgroundColor: DesignSystem.colors.blue50,
  },
  newBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: DesignSystem.colors.green500,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: DesignSystem.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  changedBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: DesignSystem.colors.blue500,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  changedBadgeText: {
    color: DesignSystem.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  partDescription: {
    fontSize: 14,
    color: DesignSystem.colors.gray900,
    fontWeight: '500',
    marginBottom: 4,
  },
  partDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partCost: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.green600,
  },
  partWarranty: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
  },
  originalPartInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray200,
  },
  originalPartText: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    fontStyle: 'italic',
  },
  modifiedDate: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: DesignSystem.colors.white,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: DesignSystem.colors.white,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray200,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: DesignSystem.colors.red500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    color: DesignSystem.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: DesignSystem.colors.green500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButtonText: {
    color: DesignSystem.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: DesignSystem.colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: DesignSystem.colors.gray700,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: DesignSystem.colors.blue500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: DesignSystem.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
