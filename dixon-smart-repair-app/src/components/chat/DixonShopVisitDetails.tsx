import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../styles/designSystem';

interface ShopVisit {
  visitId: string;
  userId: string;
  shopId: string;
  customerName: string;
  serviceType: 'diagnostic' | 'repair' | 'pickup' | 'consultation';
  status: 'checked_in' | 'in_service' | 'completed' | 'cancelled';
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  estimatedServiceTime: string;
  actualServiceTime?: string;
  mechanicNotes: string;
  vehicleInfo: {
    year: number;
    make: string;
    model: string;
    trim?: string;
  };
  sessionData?: {
    conversationId: string;
    customerPreferences: {
      communicationMethod: string;
      preferredPartType: string;
    };
    conversationHistory?: Array<{
      id: string;
      messageType: string;
      sender: string;
      content: string;
      timestamp: string;
    }>;
  };
}

interface DixonShopVisitDetailsProps {
  visit: ShopVisit;
  onBackToList: () => void;
}

export const DixonShopVisitDetails: React.FC<DixonShopVisitDetailsProps> = ({
  visit,
  onBackToList,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
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
      case 'checked_in':
        return '#FF9500'; // Orange
      case 'in_service':
        return '#007AFF'; // Blue
      case 'completed':
        return '#34C759'; // Green
      case 'cancelled':
        return '#FF3B30'; // Red
      default:
        return '#8E8E93'; // Gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'Checked In';
      case 'in_service':
        return 'In Service';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getServiceTypeText = (serviceType: string) => {
    switch (serviceType) {
      case 'diagnostic':
        return 'Diagnostic Service';
      case 'repair':
        return 'Repair Service';
      case 'pickup':
        return 'Vehicle Pickup';
      case 'consultation':
        return 'Consultation';
      default:
        return serviceType;
    }
  };

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'diagnostic':
        return 'search';
      case 'repair':
        return 'build';
      case 'pickup':
        return 'car';
      case 'consultation':
        return 'chatbubbles';
      default:
        return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToList} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.gray600} />
          <Text style={styles.backText}>Back to Visits</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Visit Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons 
              name={getServiceTypeIcon(visit.serviceType)} 
              size={24} 
              color={DesignSystem.colors.primary} 
            />
            <Text style={styles.sectionTitle}>Visit Overview</Text>
          </View>
          <View style={styles.overviewContent}>
            <Text style={styles.serviceTypeText}>{getServiceTypeText(visit.serviceType)}</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visit.status) }]}>
                <Text style={styles.statusText}>{getStatusText(visit.status)}</Text>
              </View>
            </View>
            <Text style={styles.visitIdText}>Visit ID: {visit.visitId}</Text>
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleText}>
              {visit.vehicleInfo.year} {visit.vehicleInfo.make} {visit.vehicleInfo.model}
              {visit.vehicleInfo.trim && ` ${visit.vehicleInfo.trim}`}
            </Text>
          </View>
        </View>

        {/* Shop Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.sectionTitle}>Shop Information</Text>
          </View>
          <View style={styles.shopInfo}>
            <Text style={styles.shopText}>{visit.shopId}</Text>
            <Text style={styles.customerText}>Customer: {visit.customerName}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color={DesignSystem.colors.primary} />
            <Text style={styles.sectionTitle}>Timeline</Text>
          </View>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Check-in:</Text>
              <Text style={styles.timelineValue}>{formatDate(visit.timestamp)}</Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Last Updated:</Text>
              <Text style={styles.timelineValue}>{formatDate(visit.updatedAt)}</Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Estimated Time:</Text>
              <Text style={styles.timelineValue}>
                {visit.estimatedServiceTime === 'TBD' ? 'To Be Determined' : visit.estimatedServiceTime}
              </Text>
            </View>
            {visit.actualServiceTime && (
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Actual Time:</Text>
                <Text style={styles.timelineValue}>{visit.actualServiceTime}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Mechanic Notes */}
        {visit.mechanicNotes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color={DesignSystem.colors.primary} />
              <Text style={styles.sectionTitle}>Mechanic Notes</Text>
            </View>
            <View style={styles.notesContent}>
              <Text style={styles.notesText}>{visit.mechanicNotes}</Text>
            </View>
          </View>
        )}

        {/* Customer Preferences */}
        {visit.sessionData?.customerPreferences && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={24} color={DesignSystem.colors.primary} />
              <Text style={styles.sectionTitle}>Customer Preferences</Text>
            </View>
            <View style={styles.preferencesContent}>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Communication:</Text>
                <Text style={styles.preferenceValue}>
                  {visit.sessionData.customerPreferences.communicationMethod}
                </Text>
              </View>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Preferred Parts:</Text>
                <Text style={styles.preferenceValue}>
                  {visit.sessionData.customerPreferences.preferredPartType}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Conversation History */}
        {visit.sessionData?.conversationHistory && visit.sessionData.conversationHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles" size={24} color={DesignSystem.colors.primary} />
              <Text style={styles.sectionTitle}>Conversation History</Text>
            </View>
            <View style={styles.conversationContent}>
              {visit.sessionData.conversationHistory.map((message, index) => (
                <View key={message.id || index} style={styles.messageItem}>
                  <Text style={styles.messageTimestamp}>
                    {formatDate(message.timestamp)}
                  </Text>
                  <Text style={styles.messageContent} numberOfLines={3}>
                    {message.content}
                  </Text>
                </View>
              ))}
            </View>
          </View>
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
  overviewContent: {
    marginLeft: 32,
  },
  serviceTypeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginRight: 8,
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
  visitIdText: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    fontFamily: 'monospace',
  },
  vehicleInfo: {
    marginLeft: 32,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  shopInfo: {
    marginLeft: 32,
  },
  shopText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    marginBottom: 4,
  },
  customerText: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
  },
  timeline: {
    marginLeft: 32,
  },
  timelineItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    flex: 1,
  },
  timelineValue: {
    fontSize: 14,
    color: DesignSystem.colors.gray900,
    fontWeight: '500' as const,
    flex: 2,
    textAlign: 'right' as const,
  },
  notesContent: {
    marginLeft: 32,
  },
  notesText: {
    fontSize: 14,
    color: DesignSystem.colors.gray700,
    lineHeight: 20,
  },
  preferencesContent: {
    marginLeft: 32,
  },
  preferenceItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    flex: 1,
  },
  preferenceValue: {
    fontSize: 14,
    color: DesignSystem.colors.gray900,
    fontWeight: '500' as const,
    flex: 1,
    textAlign: 'right' as const,
  },
  conversationContent: {
    marginLeft: 32,
  },
  messageItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray100,
  },
  messageTimestamp: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: DesignSystem.colors.gray700,
    lineHeight: 18,
  },
};
