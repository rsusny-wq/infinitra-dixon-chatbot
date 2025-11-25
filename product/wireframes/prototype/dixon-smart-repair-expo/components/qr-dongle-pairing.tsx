import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface QRDonglePairingProps {
  visible: boolean
  onPairingComplete: (dongleInfo: DongleInfo) => void
  onClose: () => void
}

interface DongleInfo {
  id: string
  shopName: string
  shopAddress: string
  dongleModel: string
  capabilities: string[]
  pairingCode: string
  batteryLevel: number
  lastSync: Date
}

export function QRDonglePairing({ visible, onPairingComplete, onClose }: QRDonglePairingProps) {
  const [scanningState, setScanningState] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle')
  const [scanAnimation] = useState(new Animated.Value(0))
  const [detectedQR, setDetectedQR] = useState<string | null>(null)
  const [dongleInfo, setDongleInfo] = useState<DongleInfo | null>(null)

  // Mock dongle data for simulation
  const mockDongles: DongleInfo[] = [
    {
      id: 'DSR-DONGLE-001',
      shopName: 'AutoCare Plus',
      shopAddress: '123 Main St, Anytown, ST 12345',
      dongleModel: 'Dixon Smart Repair Pro',
      capabilities: ['OBD-II Diagnostics', 'Real-time Data', 'Code Reading', 'Live Sensors'],
      pairingCode: 'AC-2024-001',
      batteryLevel: 87,
      lastSync: new Date()
    },
    {
      id: 'DSR-DONGLE-002',
      shopName: 'Quick Fix Garage',
      shopAddress: '456 Oak Ave, Somewhere, ST 67890',
      dongleModel: 'Dixon Smart Repair Lite',
      capabilities: ['Basic Diagnostics', 'Code Reading'],
      pairingCode: 'QF-2024-002',
      batteryLevel: 92,
      lastSync: new Date()
    }
  ]

  useEffect(() => {
    if (scanningState === 'scanning') {
      startScanAnimation()
    }
  }, [scanningState])

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start()
  }

  const startScanning = () => {
    setScanningState('scanning')
    setDetectedQR(null)
    
    // Simulate QR code detection after 3-5 seconds
    setTimeout(() => {
      const randomDongle = mockDongles[Math.floor(Math.random() * mockDongles.length)]
      const qrData = `DSR-DONGLE:${randomDongle.id}:${randomDongle.pairingCode}`
      
      setDetectedQR(qrData)
      setScanningState('processing')
      
      // Process the QR code
      setTimeout(() => {
        setDongleInfo(randomDongle)
        setScanningState('success')
      }, 2000)
    }, 3000 + Math.random() * 2000)
  }

  const handlePairDongle = () => {
    if (dongleInfo) {
      onPairingComplete(dongleInfo)
      Alert.alert(
        'Dongle Paired Successfully',
        `Connected to ${dongleInfo.shopName}'s diagnostic dongle. You can now receive enhanced diagnostics during your visit.`
      )
      handleClose()
    }
  }

  const handleClose = () => {
    setScanningState('idle')
    setDetectedQR(null)
    setDongleInfo(null)
    scanAnimation.setValue(0)
    onClose()
  }

  const handleManualEntry = () => {
    Alert.alert(
      'Manual Pairing',
      'Enter the 6-digit pairing code displayed on the diagnostic dongle:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pair',
          onPress: () => {
            const randomDongle = mockDongles[0]
            setDongleInfo(randomDongle)
            setScanningState('success')
          }
        }
      ]
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Dongle Pairing</Text>
          
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert('Help', 'Point your camera at the QR code on the diagnostic dongle to pair with the shop\'s equipment.')}
          >
            <Ionicons name="help-circle" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {scanningState === 'idle' && (
          /* Initial State */
          <View style={styles.initialState}>
            <View style={styles.instructionCard}>
              <Ionicons name="qr-code" size={64} color="#3b82f6" />
              <Text style={styles.instructionTitle}>Pair with Shop Dongle</Text>
              <Text style={styles.instructionDescription}>
                Connect to your service provider's diagnostic dongle for enhanced real-time diagnostics during your visit.
              </Text>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.benefitText}>Real-time diagnostic data</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.benefitText}>Live sensor readings</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.benefitText}>Enhanced diagnostic accuracy</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.benefitText}>Direct mechanic collaboration</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={startScanning}
              >
                <Ionicons name="camera" size={24} color="#ffffff" />
                <Text style={styles.scanButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.manualButton}
                onPress={handleManualEntry}
              >
                <Ionicons name="keypad" size={20} color="#3b82f6" />
                <Text style={styles.manualButtonText}>Manual Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanningState === 'scanning' && (
          /* Scanning State */
          <View style={styles.scanningState}>
            <View style={styles.cameraView}>
              <View style={styles.scanningOverlay}>
                <View style={styles.scanningFrame}>
                  <View style={styles.frameCorners}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  
                  <Animated.View 
                    style={[
                      styles.scanLine,
                      {
                        transform: [{
                          translateY: scanAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200]
                          })
                        }]
                      }
                    ]}
                  />
                </View>
                
                <Text style={styles.scanningInstructions}>
                  Position QR code within the frame
                </Text>
              </View>
            </View>

            <View style={styles.scanningInfo}>
              <Text style={styles.scanningStatus}>Scanning for QR Code...</Text>
              <TouchableOpacity 
                style={styles.cancelScanButton}
                onPress={() => setScanningState('idle')}
              >
                <Text style={styles.cancelScanText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanningState === 'processing' && (
          /* Processing State */
          <View style={styles.processingState}>
            <View style={styles.processingCard}>
              <Ionicons name="sync" size={48} color="#3b82f6" />
              <Text style={styles.processingTitle}>Processing QR Code</Text>
              <Text style={styles.processingDescription}>
                Connecting to diagnostic dongle...
              </Text>
              
              {detectedQR && (
                <View style={styles.qrDataDisplay}>
                  <Text style={styles.qrDataLabel}>Detected Code:</Text>
                  <Text style={styles.qrDataValue}>{detectedQR}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {scanningState === 'success' && dongleInfo && (
          /* Success State */
          <View style={styles.successState}>
            <View style={styles.successCard}>
              <View style={styles.successHeader}>
                <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
                <Text style={styles.successTitle}>Dongle Found!</Text>
              </View>
              
              <View style={styles.dongleInfo}>
                <Text style={styles.dongleInfoTitle}>{dongleInfo.shopName}</Text>
                <Text style={styles.dongleInfoAddress}>{dongleInfo.shopAddress}</Text>
                
                <View style={styles.dongleDetails}>
                  <View style={styles.dongleDetailRow}>
                    <Text style={styles.dongleDetailLabel}>Model:</Text>
                    <Text style={styles.dongleDetailValue}>{dongleInfo.dongleModel}</Text>
                  </View>
                  
                  <View style={styles.dongleDetailRow}>
                    <Text style={styles.dongleDetailLabel}>Pairing Code:</Text>
                    <Text style={styles.dongleDetailValue}>{dongleInfo.pairingCode}</Text>
                  </View>
                  
                  <View style={styles.dongleDetailRow}>
                    <Text style={styles.dongleDetailLabel}>Battery:</Text>
                    <View style={styles.batteryIndicator}>
                      <View style={styles.batteryBar}>
                        <View 
                          style={[
                            styles.batteryFill, 
                            { 
                              width: `${dongleInfo.batteryLevel}%`,
                              backgroundColor: dongleInfo.batteryLevel > 50 ? '#16a34a' : 
                                             dongleInfo.batteryLevel > 20 ? '#f59e0b' : '#dc2626'
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.batteryText}>{dongleInfo.batteryLevel}%</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.capabilitiesSection}>
                  <Text style={styles.capabilitiesTitle}>Capabilities:</Text>
                  <View style={styles.capabilitiesList}>
                    {dongleInfo.capabilities.map((capability, index) => (
                      <View key={index} style={styles.capabilityItem}>
                        <Ionicons name="checkmark" size={16} color="#16a34a" />
                        <Text style={styles.capabilityText}>{capability}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              <View style={styles.successActions}>
                <TouchableOpacity 
                  style={styles.pairButton}
                  onPress={handlePairDongle}
                >
                  <Ionicons name="link" size={20} color="#ffffff" />
                  <Text style={styles.pairButtonText}>Pair Dongle</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {scanningState === 'error' && (
          /* Error State */
          <View style={styles.errorState}>
            <View style={styles.errorCard}>
              <Ionicons name="warning" size={64} color="#dc2626" />
              <Text style={styles.errorTitle}>Pairing Failed</Text>
              <Text style={styles.errorDescription}>
                Unable to connect to the diagnostic dongle. Please try again or contact the service provider.
              </Text>
              
              <View style={styles.errorActions}>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => setScanningState('idle')}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  helpButton: {
    padding: 8,
  },
  initialState: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsList: {
    alignSelf: 'stretch',
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
  },
  actionButtons: {
    gap: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    gap: 8,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b82f6',
  },
  scanningState: {
    flex: 1,
  },
  cameraView: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  frameCorners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3b82f6',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scanningInstructions: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 32,
  },
  scanningInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
  },
  scanningStatus: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
  },
  cancelScanButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  cancelScanText: {
    fontSize: 14,
    color: '#64748b',
  },
  processingState: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  processingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  processingDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrDataDisplay: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  qrDataLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  qrDataValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  successState: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 12,
  },
  dongleInfo: {
    marginBottom: 24,
  },
  dongleInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  dongleInfoAddress: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  dongleDetails: {
    gap: 12,
    marginBottom: 20,
  },
  dongleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dongleDetailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  dongleDetailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  batteryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batteryBar: {
    width: 60,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
  },
  batteryText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  capabilitiesSection: {
    marginTop: 16,
  },
  capabilitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  capabilitiesList: {
    gap: 8,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capabilityText: {
    fontSize: 14,
    color: '#374151',
  },
  successActions: {
    gap: 12,
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  pairButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorActions: {
    alignSelf: 'stretch',
  },
  retryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})
