/**
 * Work Item Detail Modal - Phase 2.2
 * Shows detailed information about a work authorization item
 * Allows mechanics to update status and add notes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkAuthorization {
  id: string;
  mechanicRequestId: string;
  customerId: string;
  customerName: string;
  mechanicId: string;
  shopId: string;
  serviceType: string;
  urgency: 'low' | 'medium' | 'high';
  workflowStatus: 'assigned' | 'authorized' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  previousStatus: string;
  timeTracking: TimeTracking;
  estimatedDuration: number;
  estimatedCompletion: string;
  actualDuration?: number;
  actualCompletion?: string;
  customerNotified: boolean;
  lastCustomerUpdate?: string;
  originalRequestMessage: string;
  mechanicNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimeTracking {
  queued?: TimeStage;
  assigned?: TimeStage;
  authorized?: TimeStage;
  in_progress?: TimeStage;
  completed?: TimeStage;
}

interface TimeStage {
  startTime?: string;
  endTime?: string;
  duration?: number;
}

interface WorkItemDetailModalProps {
  visible: boolean;
  workItem: WorkAuthorization | null;
  onClose: () => void;
  onStatusUpdate: (workItemId: string, newStatus: string, notes?: string) => void;
}

const WorkItemDetailModal: React.FC<WorkItemDetailModalProps> = ({
  visible,
  workItem,
  onClose,
  onStatusUpdate,
}) => {
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  if (!workItem) return null;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF4444';
      case 'medium': return '#FF8800';
      case 'low': return '#00AA00';
      default: return '#666666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#3498db';
      case 'authorized': return '#f39c12';
      case 'in_progress': return '#e74c3c';
      case 'completed': return '#27ae60';
      case 'on_hold': return '#95a5a6';
      case 'cancelled': return '#7f8c8d';
      default: return '#666666';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'authorized': return 'Authorized';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'assigned':
        return ['authorized', 'on_hold', 'cancelled'];
      case 'authorized':
        return ['in_progress', 'on_hold', 'cancelled'];
      case 'in_progress':
        return ['completed', 'on_hold', 'cancelled'];
      case 'on_hold':
        return ['in_progress', 'cancelled'];
      case 'completed':
        return [];
      case 'cancelled':
        return [];
      default:
        return [];
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (updating) return;

    Alert.alert(
      'Update Status',
      `Change status to ${getStatusDisplayName(newStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setUpdating(true);
            try {
              await onStatusUpdate(workItem.id, newStatus, notes.trim() || undefined);
              setNotes('');
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to update status. Please try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const renderTimeStage = (stageName: string, stage?: TimeStage) => {
    if (!stage) return null;

    return (
      <View style={styles.timeStageContainer}>
        <View style={styles.timeStageHeader}>
          <Text style={styles.timeStageName}>{stageName}</Text>
          {stage.duration && (
            <Text style={styles.timeStageDuration}>{formatDuration(stage.duration)}</Text>
          )}
        </View>
        {stage.startTime && (
          <Text style={styles.timeStageTime}>
            Started: {formatDateTime(stage.startTime)}
          </Text>
        )}
        {stage.endTime && (
          <Text style={styles.timeStageTime}>
            Ended: {formatDateTime(stage.endTime)}
          </Text>
        )}
        {stage.startTime && !stage.endTime && (
          <Text style={[styles.timeStageTime, { color: '#007AFF' }]}>
            In progress...
          </Text>
        )}
      </View>
    );
  };

  const nextStatuses = getNextStatuses(workItem.workflowStatus);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Work Item Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{workItem.customerName}</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(workItem.urgency) }]}>
                <Text style={styles.urgencyText}>{workItem.urgency.toUpperCase()} PRIORITY</Text>
              </View>
            </View>
            <Text style={styles.serviceType}>Service Type: {workItem.serviceType}</Text>
          </View>

          {/* Current Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workItem.workflowStatus) }]}>
              <Text style={styles.statusText}>{getStatusDisplayName(workItem.workflowStatus)}</Text>
            </View>
          </View>

          {/* Original Request */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Original Request</Text>
            <Text style={styles.requestMessage}>{workItem.originalRequestMessage}</Text>
            <Text style={styles.requestTime}>
              Submitted: {formatDateTime(workItem.createdAt)}
            </Text>
          </View>

          {/* Time Tracking */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Tracking</Text>
            <View style={styles.timeTrackingContainer}>
              {renderTimeStage('Assigned', workItem.timeTracking.assigned)}
              {renderTimeStage('Authorized', workItem.timeTracking.authorized)}
              {renderTimeStage('In Progress', workItem.timeTracking.in_progress)}
              {renderTimeStage('Completed', workItem.timeTracking.completed)}
            </View>
          </View>

          {/* Estimates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Estimates</Text>
            <View style={styles.estimatesContainer}>
              <View style={styles.estimateItem}>
                <Text style={styles.estimateLabel}>Estimated Duration</Text>
                <Text style={styles.estimateValue}>{formatDuration(workItem.estimatedDuration)}</Text>
              </View>
              <View style={styles.estimateItem}>
                <Text style={styles.estimateLabel}>Estimated Completion</Text>
                <Text style={styles.estimateValue}>{formatDateTime(workItem.estimatedCompletion)}</Text>
              </View>
              {workItem.actualDuration && (
                <View style={styles.estimateItem}>
                  <Text style={styles.estimateLabel}>Actual Duration</Text>
                  <Text style={styles.estimateValue}>{formatDuration(workItem.actualDuration)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Existing Notes */}
          {workItem.mechanicNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Previous Notes</Text>
              <Text style={styles.existingNotes}>{workItem.mechanicNotes}</Text>
            </View>
          )}

          {/* Add Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this work item..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Status Actions */}
          {nextStatuses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Status</Text>
              <View style={styles.statusActions}>
                {nextStatuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      { backgroundColor: getStatusColor(status) },
                      updating && styles.statusButtonDisabled,
                    ]}
                    onPress={() => handleStatusUpdate(status)}
                    disabled={updating}
                  >
                    <Text style={styles.statusButtonText}>
                      {getStatusDisplayName(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  headerSpacer: {
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
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  urgencyBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  serviceType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  requestMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  requestTime: {
    fontSize: 14,
    color: '#666',
  },
  timeTrackingContainer: {
    gap: 12,
  },
  timeStageContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
  },
  timeStageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeStageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  timeStageDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  timeStageTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  estimatesContainer: {
    gap: 12,
  },
  estimateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 14,
    color: '#666',
  },
  estimateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  existingNotes: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 80,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  statusButtonDisabled: {
    opacity: 0.6,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default WorkItemDetailModal;
