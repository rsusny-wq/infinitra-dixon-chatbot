import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MechanicRequest } from '../services/MechanicService';

interface SharedEstimateDetailModalProps {
  visible: boolean;
  request: MechanicRequest | null;
  mechanicId: string;
  onClose: () => void;
  onAssign: (request: MechanicRequest) => void;
  onUpdateStatus: (requestId: string, status: string) => void;
  onEditEstimate: (request: MechanicRequest) => void;
}

export default function SharedEstimateDetailModal({
  visible,
  request,
  mechanicId,
  onClose,
  onAssign,
  onUpdateStatus,
  onEditEstimate,
}: SharedEstimateDetailModalProps) {
  if (!request) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return '#6b7280';
      case 'assigned': return '#2563eb';
      case 'active': return '#ea580c';
      case 'completed': return '#16a34a';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const handleStatusUpdate = (status: string) => {
    Alert.alert(
      'Update Status',
      `Are you sure you want to mark this request as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            onUpdateStatus(request.id, status);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Shared Cost Estimate</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{request.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Request Date:</Text>
              <Text style={styles.value}>
                {new Date(request.createdAt).toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Priority:</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(request.urgency) }]}>
                <Text style={styles.urgencyText}>{request.urgency.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Customer Comment */}
          {request.customerComment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Comment</Text>
              <View style={styles.commentBox}>
                <Text style={styles.commentText}>{request.customerComment}</Text>
              </View>
            </View>
          )}

          {/* Vehicle Information */}
          {request.sharedEstimate?.vehicleInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleText}>
                  {request.sharedEstimate.vehicleInfo.year} {request.sharedEstimate.vehicleInfo.make} {request.sharedEstimate.vehicleInfo.model}
                  {request.sharedEstimate.vehicleInfo.trim && ` ${request.sharedEstimate.vehicleInfo.trim}`}
                </Text>
              </View>
            </View>
          )}

          {/* Cost Estimate Details */}
          {request.sharedEstimate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost Estimate Details</Text>
              
              <View style={styles.repairInfo}>
                <Text style={styles.repairTitle}>{request.sharedEstimate.repairDescription}</Text>
                <Text style={styles.selectedOption}>
                  Selected Option: {request.sharedEstimate.selectedOption.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              {/* Cost Breakdown */}
              <View style={styles.costBreakdown}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Parts:</Text>
                  <Text style={styles.costValue}>
                    ${request.sharedEstimate.breakdown.parts.total.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Labor:</Text>
                  <Text style={styles.costValue}>
                    ${request.sharedEstimate.breakdown.labor.total.toFixed(2)} 
                    ({request.sharedEstimate.breakdown.labor.totalHours}h @ ${request.sharedEstimate.breakdown.labor.hourlyRate}/h)
                  </Text>
                </View>
                
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Shop Fees:</Text>
                  <Text style={styles.costValue}>
                    ${request.sharedEstimate.breakdown.shopFees.total.toFixed(2)}
                  </Text>
                </View>
                
                <View style={[styles.costRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    ${request.sharedEstimate.breakdown.total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Parts Details */}
              {request.sharedEstimate.breakdown.parts.items.length > 0 && (
                <View style={styles.partsSection}>
                  <Text style={styles.partsTitle}>Parts Details:</Text>
                  {request.sharedEstimate.breakdown.parts.items.map((part, index) => (
                    <View key={index} style={styles.partItem}>
                      <Text style={styles.partDescription}>{part.description}</Text>
                      <View style={styles.partDetails}>
                        <Text style={styles.partCost}>${part.cost.toFixed(2)}</Text>
                        <Text style={styles.partWarranty}>Warranty: {part.warranty}</Text>
                      </View>
                      {part.url && (
                        <Text style={styles.partUrl} numberOfLines={1}>
                          Source: {part.url}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {request.status === 'queued' && (
            <>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => {
                  onAssign(request);
                  onClose();
                }}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.assignButtonText}>Assign to Me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEditEstimate(request)}
              >
                <Ionicons name="create" size={20} color="#007AFF" />
                <Text style={styles.editButtonText}>Edit Estimate</Text>
              </TouchableOpacity>
            </>
          )}
          
          {request.status === 'assigned' && request.assignedMechanicId === mechanicId && (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEditEstimate(request)}
              >
                <Ionicons name="create" size={20} color="#007AFF" />
                <Text style={styles.editButtonText}>Edit Estimate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.activeButton}
                onPress={() => handleStatusUpdate('active')}
              >
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.activeButtonText}>Start Work</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleStatusUpdate('completed')}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.completeButtonText}>Mark Complete</Text>
              </TouchableOpacity>
            </>
          )}
          
          {request.status === 'active' && request.assignedMechanicId === mechanicId && (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEditEstimate(request)}
              >
                <Ionicons name="create" size={20} color="#007AFF" />
                <Text style={styles.editButtonText}>Edit Estimate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleStatusUpdate('completed')}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.completeButtonText}>Mark Complete</Text>
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
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    width: 100,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  vehicleInfo: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  repairInfo: {
    marginBottom: 16,
  },
  repairTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedOption: {
    fontSize: 14,
    color: '#6b7280',
  },
  costBreakdown: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  costValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  partsSection: {
    marginTop: 16,
  },
  partsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  partItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  partDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  partDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  partWarranty: {
    fontSize: 12,
    color: '#6b7280',
  },
  partUrl: {
    fontSize: 12,
    color: '#3b82f6',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  assignButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  assignButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeButton: {
    flex: 1,
    backgroundColor: '#ea580c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
