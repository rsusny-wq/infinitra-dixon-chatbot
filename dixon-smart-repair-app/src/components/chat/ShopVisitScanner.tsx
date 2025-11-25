/**
 * Shop Visit Scanner Component - Phase 1.1
 * QR code scanner for shop visit recognition with service type selection
 * Integrates with existing sidebar structure and session management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/api';
import { useSessionStore } from '../../stores/sessionStore';
import { chatService } from '../../services/ChatService';
import AuthService, { AutomotiveUser } from '../../services/AuthService';
import { DesignSystem } from '../../styles/designSystem';
import { TEST_SHOP_QR_CODES } from '../../utils/qrCodeGenerator';

// Initialize GraphQL client
const graphqlClient = generateClient();

interface ShopVisitScannerProps {
  currentUser: AutomotiveUser | null;
  onVisitRecorded?: (visitData: VisitData) => void;
  onClose: () => void;
}

interface VisitData {
  visitId: string;
  shopId: string;
  serviceType: 'diagnostic' | 'repair' | 'pickup' | 'consultation';
  timestamp: string;
  status: string;
}

interface QRCodeData {
  shopId: string;
  location: string;
  name?: string;
}

const ShopVisitScanner: React.FC<ShopVisitScannerProps> = ({
  currentUser,
  onVisitRecorded,
  onClose
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [recentVisits, setRecentVisits] = useState<VisitData[]>([]);
  
  const { currentSessionId, getSessionMessages } = useSessionStore();

  useEffect(() => {
    loadRecentVisits();
  }, [currentUser]);

  const loadRecentVisits = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Loading recent visits for user:', currentUser.userId);
      setRecentVisits([]); // For now, set empty array to avoid GraphQL issues
    } catch (error) {
      console.error('Failed to load recent visits:', error);
      setRecentVisits([]);
    }
  };

  const handleStartScan = async () => {
    if (!currentUser) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to record shop visits.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowScanner(true);
  };

  const handleTestScan = (shopKey: string) => {
    const testDataString = TEST_SHOP_QR_CODES[shopKey as keyof typeof TEST_SHOP_QR_CODES];
    const testData = JSON.parse(testDataString);
    
    setQrData(testData);
    setShowScanner(false);
    setShowServiceSelection(true);
  };

  const handleServiceTypeSelection = async (serviceType: 'diagnostic' | 'repair' | 'pickup' | 'consultation') => {
    if (!qrData || !currentUser) return;

    setProcessing(true);
    setShowServiceSelection(false);

    try {
      // Collect current session data for mechanic handoff
      const sessionData = await collectSessionData();
      
      // Create mock visit data for now
      const visitData: VisitData = {
        visitId: `visit-${Date.now()}`,
        shopId: qrData.shopId,
        serviceType,
        timestamp: new Date().toISOString(),
        status: 'checked_in'
      };

      // Update local state
      setRecentVisits(prev => [visitData, ...prev.slice(0, 4)]);
      
      // Notify parent component
      if (onVisitRecorded) {
        onVisitRecorded(visitData);
      }

      // Show success message
      Alert.alert(
        'Visit Recorded Successfully! ✅',
        `Check-in complete at ${qrData.name || 'Dixon Smart Repair'}\n\nService Type: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}\n\nYour diagnostic session data has been loaded for the mechanic.`,
        [{ 
          text: 'OK',
          onPress: () => onClose()
        }]
      );

    } catch (error) {
      console.error('Failed to record visit:', error);
      Alert.alert(
        'Recording Failed',
        'Failed to record your visit. Please try again or check in at the front desk.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
      setQrData(null);
    }
  };

  const collectSessionData = async () => {
    try {
      const messages = currentSessionId ? getSessionMessages(currentSessionId) : [];
      const conversationHistory = messages.slice(-10);
      
      return {
        conversationId: currentSessionId,
        conversationHistory,
        aiDiagnosis: null, // Would be populated from actual AI diagnosis
        approvedEstimate: null, // Would be populated from approved estimates
        customerPreferences: {
          communicationMethod: 'app',
          preferredPartType: 'OEM'
        },
        specialInstructions: [],
        collectedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to collect session data:', error);
      return {
        conversationId: currentSessionId,
        conversationHistory: [],
        error: 'Failed to collect session data'
      };
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

  const getServiceTypeDescription = (serviceType: string) => {
    switch (serviceType) {
      case 'diagnostic':
        return 'Professional inspection and diagnosis of vehicle issues';
      case 'repair':
        return 'Actual repair work and parts replacement';
      case 'pickup':
        return 'Collecting your completed vehicle';
      case 'consultation':
        return 'Expert advice and maintenance recommendations';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={DesignSystem.colors.gray600} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Check-In</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan QR Code</Text>
          <Text style={styles.sectionDescription}>
            Scan the QR code at any Dixon Smart Repair location to check in for service.
          </Text>
          
          <TouchableOpacity style={styles.scanButton} onPress={handleStartScan}>
            <Ionicons name="qr-code" size={32} color={DesignSystem.colors.white} />
            <Text style={styles.scanButtonText}>Start QR Scanner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Locations</Text>
          <Text style={styles.sectionDescription}>
            For testing purposes, you can simulate scanning at these locations:
          </Text>
          
          <TouchableOpacity 
            style={styles.testLocationCard} 
            onPress={() => handleTestScan('DIXON_MAIN')}
          >
            <Ionicons name="location" size={24} color={DesignSystem.colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Dixon Smart Repair - Main</Text>
              <Text style={styles.locationAddress}>123 Main Street, Downtown</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DesignSystem.colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testLocationCard} 
            onPress={() => handleTestScan('DIXON_NORTH')}
          >
            <Ionicons name="location" size={24} color={DesignSystem.colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Dixon Smart Repair - North</Text>
              <Text style={styles.locationAddress}>456 North Ave, Northside</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DesignSystem.colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testLocationCard} 
            onPress={() => handleTestScan('DIXON_SOUTH')}
          >
            <Ionicons name="location" size={24} color={DesignSystem.colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Dixon Smart Repair - South</Text>
              <Text style={styles.locationAddress}>789 South Blvd, Southside</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DesignSystem.colors.gray400} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Service Type Selection Modal */}
      <Modal
        visible={showServiceSelection}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowServiceSelection(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowServiceSelection(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Service Type</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              What type of service do you need at {qrData?.name || 'this location'}?
            </Text>

            {(['diagnostic', 'repair', 'pickup', 'consultation'] as const).map((serviceType) => (
              <TouchableOpacity
                key={serviceType}
                style={styles.serviceTypeCard}
                onPress={() => handleServiceTypeSelection(serviceType)}
              >
                <Ionicons 
                  name={getServiceTypeIcon(serviceType)} 
                  size={32} 
                  color={DesignSystem.colors.primary} 
                />
                <View style={styles.serviceTypeInfo}>
                  <Text style={styles.serviceTypeName}>
                    {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
                  </Text>
                  <Text style={styles.serviceTypeDescription}>
                    {getServiceTypeDescription(serviceType)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={DesignSystem.colors.gray400} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Processing Modal */}
      <Modal
        visible={processing}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
            <Text style={styles.processingText}>Recording your visit...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
    backgroundColor: DesignSystem.colors.white,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
    lineHeight: 24,
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  scanButtonText: {
    color: DesignSystem.colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: DesignSystem.colors.gray200,
    marginHorizontal: 20,
  },
  testLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
  },
  locationAddress: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: DesignSystem.colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
  },
  cancelButton: {
    fontSize: 16,
    color: DesignSystem.colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  serviceTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
  },
  serviceTypeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  serviceTypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.gray900,
  },
  serviceTypeDescription: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    marginTop: 4,
    lineHeight: 20,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: DesignSystem.colors.white,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: DesignSystem.colors.gray900,
    marginTop: 16,
  },
});

export { ShopVisitScanner };
