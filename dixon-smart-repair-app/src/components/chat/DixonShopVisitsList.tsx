import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutomotiveUser } from '../../services/AuthService';
import { chatService } from '../../services/ChatService';
import { DesignSystem } from '../../styles/designSystem';
import { ShopVisitScanner } from './ShopVisitScanner';

// Shop visit interface
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
}

interface UserShopVisitsResponse {
  success: boolean;
  visits: ShopVisit[];
  count: number;
  error?: string;
}

interface DixonShopVisitsListProps {
  currentUser: AutomotiveUser | null;
  onBackToChat: () => void;
  onVisitSelect: (visit: ShopVisit) => void;
}

export const DixonShopVisitsList: React.FC<DixonShopVisitsListProps> = ({ 
  currentUser, 
  onBackToChat,
  onVisitSelect
}) => {
  const [visits, setVisits] = useState<ShopVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<ShopVisit | null>(null);
  const [showVisitDetails, setShowVisitDetails] = useState(false);

  const fetchUserShopVisits = async () => {
    if (!currentUser?.userId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🏪 Fetching shop visits for user:', currentUser.userId);
      const response = await chatService.getUserShopVisits(currentUser.userId);
      console.log('🏪 User shop visits response:', response);
      
      if (response.success) {
        setVisits(response.visits);
      } else {
        console.error('🏪 Failed to load shop visits:', response.error);
        // Add sample visits for testing if no real visits exist
        if (response.visits.length === 0) {
          setVisits(getSampleVisits());
        }
      }
    } catch (error) {
      console.error('🏪 Error fetching shop visits:', error);
      // Add sample visits for testing
      setVisits(getSampleVisits());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSampleVisits = (): ShopVisit[] => {
    return [
      {
        visitId: 'visit-20250731-001',
        userId: currentUser?.userId || '',
        shopId: 'dixon-main',
        customerName: currentUser?.givenName + ' ' + currentUser?.familyName || 'Customer',
        serviceType: 'diagnostic',
        status: 'completed',
        timestamp: '2025-07-29T14:30:00.000Z',
        createdAt: '2025-07-29T14:30:00.000Z',
        updatedAt: '2025-07-29T16:45:00.000Z',
        estimatedServiceTime: '2 hours',
        actualServiceTime: '2.25 hours',
        mechanicNotes: 'Completed diagnostic on 2020 Honda Civic. Found issue with brake pads and rotors. Customer approved repair estimate.'
      },
      {
        visitId: 'visit-20250731-002',
        userId: currentUser?.userId || '',
        shopId: 'dixon-north',
        customerName: currentUser?.givenName + ' ' + currentUser?.familyName || 'Customer',
        serviceType: 'repair',
        status: 'in_service',
        timestamp: '2025-07-30T10:15:00.000Z',
        createdAt: '2025-07-30T10:15:00.000Z',
        updatedAt: '2025-07-30T10:15:00.000Z',
        estimatedServiceTime: '4 hours',
        mechanicNotes: 'Brake pad and rotor replacement in progress. Expected completion by 2 PM.'
      },
      {
        visitId: 'visit-20250731-003',
        userId: currentUser?.userId || '',
        shopId: 'dixon-main',
        customerName: currentUser?.givenName + ' ' + currentUser?.familyName || 'Customer',
        serviceType: 'consultation',
        status: 'checked_in',
        timestamp: '2025-07-31T09:00:00.000Z',
        createdAt: '2025-07-31T09:00:00.000Z',
        updatedAt: '2025-07-31T09:00:00.000Z',
        estimatedServiceTime: '30 minutes',
        mechanicNotes: 'Customer consultation scheduled for Toyota Camry maintenance recommendations.'
      }
    ];
  };

  useEffect(() => {
    fetchUserShopVisits();
  }, [currentUser?.userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserShopVisits();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return DesignSystem.colors.green500;
      case 'in_service':
        return DesignSystem.colors.blue500;
      case 'checked_in':
        return DesignSystem.colors.orange500;
      case 'cancelled':
        return DesignSystem.colors.red500;
      default:
        return DesignSystem.colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'in_service':
        return 'construct';
      case 'checked_in':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
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
        return 'help';
    }
  };

  const handleVisitPress = (visit: ShopVisit) => {
    setSelectedVisit(visit);
    setShowVisitDetails(true);
  };

  const handleVisitRecorded = (visitData: any) => {
    // Refresh the visits list when a new visit is recorded
    fetchUserShopVisits();
    setShowScanner(false);
  };

  const renderVisitCard = (visit: ShopVisit) => (
    <TouchableOpacity
      key={visit.visitId}
      style={styles.visitCard}
      onPress={() => handleVisitPress(visit)}
    >
      <View style={styles.visitHeader}>
        <View style={styles.visitMainInfo}>
          <Ionicons 
            name={getServiceTypeIcon(visit.serviceType)} 
            size={24} 
            color={DesignSystem.colors.primary} 
          />
          <View style={styles.visitTextContainer}>
            <Text style={styles.visitTitle}>
              {visit.serviceType.charAt(0).toUpperCase() + visit.serviceType.slice(1)} Service
            </Text>
            <Text style={styles.visitShop}>
              {visit.shopId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visit.status) }]}>
          <Ionicons 
            name={getStatusIcon(visit.status)} 
            size={16} 
            color={DesignSystem.colors.white} 
          />
          <Text style={styles.statusText}>
            {visit.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
        </View>
      </View>

      <View style={styles.visitDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={DesignSystem.colors.gray500} />
          <Text style={styles.detailText}>
            {formatDate(visit.timestamp)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={DesignSystem.colors.gray500} />
          <Text style={styles.detailText}>
            Est. {visit.estimatedServiceTime}
            {visit.actualServiceTime && ` • Actual: ${visit.actualServiceTime}`}
          </Text>
        </View>

        {visit.mechanicNotes && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color={DesignSystem.colors.gray500} />
            <Text style={styles.detailText} numberOfLines={2}>
              {visit.mechanicNotes}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={20} color={DesignSystem.colors.gray400} />
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.loadingText}>Loading shop visits...</Text>
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
        <Text style={styles.headerTitle}>My Shop Visits</Text>
        <TouchableOpacity 
          onPress={() => setShowScanner(true)} 
          style={styles.scanButton}
        >
          <Ionicons name="qr-code" size={24} color={DesignSystem.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {visits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color={DesignSystem.colors.gray400} />
            <Text style={styles.emptyTitle}>No Shop Visits Yet</Text>
            <Text style={styles.emptyText}>
              Scan a QR code at any Dixon Smart Repair location to check in for service.
            </Text>
            <TouchableOpacity 
              style={styles.scanButtonLarge} 
              onPress={() => setShowScanner(true)}
            >
              <Ionicons name="qr-code" size={20} color={DesignSystem.colors.white} />
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {visits.map(renderVisitCard)}
            
            <TouchableOpacity 
              style={styles.addVisitCard} 
              onPress={() => setShowScanner(true)}
            >
              <Ionicons name="qr-code" size={32} color={DesignSystem.colors.primary} />
              <Text style={styles.addVisitText}>Check In at Shop</Text>
              <Text style={styles.addVisitSubtext}>
                Scan QR code to record a new visit
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowScanner(false)}
      >
        <ShopVisitScanner
          currentUser={currentUser}
          onVisitRecorded={handleVisitRecorded}
          onClose={() => setShowScanner(false)}
        />
      </Modal>

      {/* Visit Details Modal */}
      <Modal
        visible={showVisitDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVisitDetails(false)}
      >
        {selectedVisit && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowVisitDetails(false)}>
                <Text style={styles.cancelButton}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Visit Details</Text>
              <View style={{ width: 60 }} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.visitDetailCard}>
                <View style={styles.visitDetailHeader}>
                  <Ionicons 
                    name={getServiceTypeIcon(selectedVisit.serviceType)} 
                    size={32} 
                    color={DesignSystem.colors.primary} 
                  />
                  <View style={styles.visitDetailTitleContainer}>
                    <Text style={styles.visitDetailTitle}>
                      {selectedVisit.serviceType.charAt(0).toUpperCase() + selectedVisit.serviceType.slice(1)} Service
                    </Text>
                    <Text style={styles.visitDetailShop}>
                      {selectedVisit.shopId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedVisit.status) }]}>
                    <Ionicons 
                      name={getStatusIcon(selectedVisit.status)} 
                      size={16} 
                      color={DesignSystem.colors.white} 
                    />
                    <Text style={styles.statusText}>
                      {selectedVisit.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                </View>

                <View style={styles.visitDetailInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Visit ID:</Text>
                    <Text style={styles.infoValue}>{selectedVisit.visitId}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Check-in Time:</Text>
                    <Text style={styles.infoValue}>{formatDate(selectedVisit.timestamp)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estimated Time:</Text>
                    <Text style={styles.infoValue}>{selectedVisit.estimatedServiceTime}</Text>
                  </View>
                  {selectedVisit.actualServiceTime && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Actual Time:</Text>
                      <Text style={styles.infoValue}>{selectedVisit.actualServiceTime}</Text>
                    </View>
                  )}
                </View>

                {selectedVisit.mechanicNotes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesTitle}>Mechanic Notes:</Text>
                    <Text style={styles.notesText}>{selectedVisit.mechanicNotes}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
    justifyContent: 'space-between' as const,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    flex: 1,
    textAlign: 'center' as const,
  },
  scanButton: {
    padding: 8,
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
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
    minHeight: 400,
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
    marginBottom: 24,
  },
  scanButtonLarge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanButtonText: {
    color: DesignSystem.colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  visitCard: {
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    position: 'relative' as const,
  },
  visitHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  visitMainInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  visitTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  visitTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  visitShop: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: DesignSystem.colors.white,
    marginLeft: 4,
  },
  visitDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginLeft: 8,
    flex: 1,
  },
  chevron: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  addVisitCard: {
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DesignSystem.colors.primary,
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addVisitText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.primary,
    marginTop: 8,
  },
  addVisitSubtext: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.white,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  cancelButton: {
    fontSize: 16,
    color: DesignSystem.colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  visitDetailCard: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
  },
  visitDetailHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  visitDetailTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  visitDetailTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  visitDetailShop: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginTop: 2,
  },
  visitDetailInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray100,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray700,
  },
  infoValue: {
    fontSize: 14,
    color: DesignSystem.colors.gray900,
    textAlign: 'right' as const,
    flex: 1,
    marginLeft: 16,
  },
  notesSection: {
    backgroundColor: DesignSystem.colors.gray50,
    padding: 12,
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray700,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: DesignSystem.colors.gray900,
    lineHeight: 20,
  },
};
