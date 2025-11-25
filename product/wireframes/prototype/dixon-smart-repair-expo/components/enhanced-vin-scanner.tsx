import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface EnhancedVinScannerProps {
  visible: boolean
  onVinScanned: (vin: string, method: 'camera' | 'photo' | 'manual') => void
  onClose: () => void
}

interface ScanningState {
  isScanning: boolean
  method: 'camera' | 'photo' | 'manual' | null
  progress: number
  detectedChars: string
  confidence: number
}

export function EnhancedVinScanner({ visible, onVinScanned, onClose }: EnhancedVinScannerProps) {
  const [scanningState, setScanningState] = useState<ScanningState>({
    isScanning: false,
    method: null,
    progress: 0,
    detectedChars: '',
    confidence: 0
  })
  
  const [manualVin, setManualVin] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [scanAnimation] = useState(new Animated.Value(0))
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Mock VIN examples for simulation
  const mockVins = [
    '1HGBH41JXMN109186', // Honda
    '1FTFW1ET5DFC10312', // Ford
    '1G1BE5SM7G7115716', // Chevrolet
    'WBAVA33598P123456', // BMW
    'JM1BL1SF6A1234567', // Mazda
    '1N4AL3AP8DC123456'  // Nissan
  ]

  useEffect(() => {
    if (scanningState.isScanning) {
      startScanAnimation()
    }
  }, [scanningState.isScanning])

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

  const validateVin = (vin: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Length check
    if (vin.length !== 17) {
      errors.push(`VIN must be exactly 17 characters (current: ${vin.length})`)
    }
    
    // Character validation
    const invalidChars = vin.match(/[IOQ]/g)
    if (invalidChars) {
      errors.push('VIN cannot contain letters I, O, or Q')
    }
    
    // Format validation
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      errors.push('VIN contains invalid characters')
    }
    
    // Basic checksum validation (simplified)
    if (vin.length === 17) {
      const checkDigit = vin.charAt(8)
      if (!/[0-9X]/.test(checkDigit)) {
        errors.push('Invalid check digit at position 9')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const simulateCameraScanning = () => {
    setScanningState({
      isScanning: true,
      method: 'camera',
      progress: 0,
      detectedChars: '',
      confidence: 0
    })

    // Simulate progressive character detection
    const targetVin = mockVins[Math.floor(Math.random() * mockVins.length)]
    let currentProgress = 0
    let detectedSoFar = ''

    const scanInterval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5 // 5-20% progress per step
      
      if (currentProgress >= 100) {
        currentProgress = 100
        detectedSoFar = targetVin
        
        setScanningState(prev => ({
          ...prev,
          progress: currentProgress,
          detectedChars: detectedSoFar,
          confidence: 95 + Math.random() * 5, // 95-100% confidence
          isScanning: false
        }))
        
        clearInterval(scanInterval)
        
        // Complete scan after brief delay
        setTimeout(() => {
          onVinScanned(targetVin, 'camera')
          resetScanner()
        }, 1000)
        
      } else {
        // Progressive character detection
        const charsToShow = Math.floor((currentProgress / 100) * targetVin.length)
        detectedSoFar = targetVin.substring(0, charsToShow) + 
                       '_'.repeat(Math.max(0, targetVin.length - charsToShow))
        
        setScanningState(prev => ({
          ...prev,
          progress: currentProgress,
          detectedChars: detectedSoFar,
          confidence: Math.min(currentProgress * 0.9, 90) // Max 90% during scanning
        }))
      }
    }, 500)
  }

  const simulatePhotoScanning = () => {
    setScanningState({
      isScanning: true,
      method: 'photo',
      progress: 0,
      detectedChars: '',
      confidence: 0
    })

    // Simulate photo processing
    const targetVin = mockVins[Math.floor(Math.random() * mockVins.length)]
    
    setTimeout(() => {
      setScanningState({
        isScanning: false,
        method: 'photo',
        progress: 100,
        detectedChars: targetVin,
        confidence: 85 + Math.random() * 10 // 85-95% confidence for photos
      })
      
      setTimeout(() => {
        onVinScanned(targetVin, 'photo')
        resetScanner()
      }, 1000)
    }, 2000)
  }

  const handleManualEntry = () => {
    const validation = validateVin(manualVin.toUpperCase())
    setValidationErrors(validation.errors)
    
    if (validation.isValid) {
      onVinScanned(manualVin.toUpperCase(), 'manual')
      resetScanner()
    } else {
      Alert.alert('Invalid VIN', validation.errors.join('\n'))
    }
  }

  const resetScanner = () => {
    setScanningState({
      isScanning: false,
      method: null,
      progress: 0,
      detectedChars: '',
      confidence: 0
    })
    setManualVin('')
    setShowManualEntry(false)
    setValidationErrors([])
    scanAnimation.setValue(0)
  }

  const handleClose = () => {
    resetScanner()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Enhanced VIN Scanner</Text>
          
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert('VIN Help', 'VIN is located on dashboard, driver door, or engine bay')}
          >
            <Ionicons name="help-circle" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {!scanningState.isScanning && !showManualEntry && (
          /* Method Selection */
          <View style={styles.methodSelection}>
            <Text style={styles.methodTitle}>Choose Scanning Method</Text>
            <Text style={styles.methodSubtitle}>
              Select the best method for your situation
            </Text>

            <View style={styles.methodOptions}>
              <TouchableOpacity 
                style={styles.methodOption}
                onPress={simulateCameraScanning}
              >
                <View style={[styles.methodIcon, { backgroundColor: '#3b82f6' }]}>
                  <Ionicons name="camera" size={32} color="#ffffff" />
                </View>
                <Text style={styles.methodOptionTitle}>Live Camera</Text>
                <Text style={styles.methodOptionDescription}>
                  Point camera at VIN for real-time scanning
                </Text>
                <View style={styles.methodBadge}>
                  <Text style={styles.methodBadgeText}>RECOMMENDED</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.methodOption}
                onPress={simulatePhotoScanning}
              >
                <View style={[styles.methodIcon, { backgroundColor: '#16a34a' }]}>
                  <Ionicons name="image" size={32} color="#ffffff" />
                </View>
                <Text style={styles.methodOptionTitle}>Photo Upload</Text>
                <Text style={styles.methodOptionDescription}>
                  Take or select a photo of your VIN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.methodOption}
                onPress={() => setShowManualEntry(true)}
              >
                <View style={[styles.methodIcon, { backgroundColor: '#7c3aed' }]}>
                  <Ionicons name="create" size={32} color="#ffffff" />
                </View>
                <Text style={styles.methodOptionTitle}>Manual Entry</Text>
                <Text style={styles.methodOptionDescription}>
                  Type VIN manually if scanning fails
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanningState.isScanning && (
          /* Scanning Interface */
          <View style={styles.scanningInterface}>
            <View style={styles.cameraView}>
              <View style={styles.scanningOverlay}>
                <View style={styles.scanningFrame}>
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
                  {scanningState.method === 'camera' 
                    ? 'Position VIN within the frame'
                    : 'Processing photo...'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.scanningInfo}>
              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Scanning Progress</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${scanningState.progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(scanningState.progress)}%</Text>
              </View>

              {scanningState.detectedChars && (
                <View style={styles.detectionContainer}>
                  <Text style={styles.detectionLabel}>Detected VIN:</Text>
                  <Text style={styles.detectedVin}>{scanningState.detectedChars}</Text>
                  <Text style={styles.confidenceText}>
                    Confidence: {Math.round(scanningState.confidence)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {showManualEntry && (
          /* Manual Entry Interface */
          <View style={styles.manualEntry}>
            <Text style={styles.manualTitle}>Enter VIN Manually</Text>
            <Text style={styles.manualSubtitle}>
              VIN is exactly 17 characters (letters and numbers)
            </Text>

            <View style={styles.vinInputContainer}>
              <TextInput
                style={[
                  styles.vinInput,
                  validationErrors.length > 0 && styles.vinInputError
                ]}
                value={manualVin}
                onChangeText={(text) => {
                  setManualVin(text.toUpperCase())
                  if (validationErrors.length > 0) {
                    setValidationErrors([])
                  }
                }}
                placeholder="Enter 17-character VIN"
                maxLength={17}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              
              <View style={styles.vinInputInfo}>
                <Text style={styles.vinInputCounter}>
                  {manualVin.length}/17 characters
                </Text>
                {manualVin.length === 17 && (
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                )}
              </View>
            </View>

            {validationErrors.length > 0 && (
              <View style={styles.errorContainer}>
                {validationErrors.map((error, index) => (
                  <View key={index} style={styles.errorItem}>
                    <Ionicons name="warning" size={16} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.vinTips}>
              <Text style={styles.vinTipsTitle}>VIN Tips:</Text>
              <Text style={styles.vinTip}>• VIN never contains letters I, O, or Q</Text>
              <Text style={styles.vinTip}>• Check dashboard, driver door, or engine bay</Text>
              <Text style={styles.vinTip}>• VIN is case-insensitive</Text>
            </View>

            <View style={styles.manualActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowManualEntry(false)}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  manualVin.length !== 17 && styles.submitButtonDisabled
                ]}
                onPress={handleManualEntry}
                disabled={manualVin.length !== 17}
              >
                <Text style={styles.submitButtonText}>Validate VIN</Text>
              </TouchableOpacity>
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
  methodSelection: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
  },
  methodTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  methodSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  methodOptions: {
    gap: 20,
  },
  methodOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  methodIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  methodOptionDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  methodBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  scanningInterface: {
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
    width: 300,
    height: 100,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    position: 'relative',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
    marginTop: 20,
  },
  scanningInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  detectionContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  detectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  detectedVin: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#0f172a',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#64748b',
  },
  manualEntry: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  manualSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  vinInputContainer: {
    marginBottom: 20,
  },
  vinInput: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  vinInputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  vinInputInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  vinInputCounter: {
    fontSize: 12,
    color: '#64748b',
  },
  errorContainer: {
    marginBottom: 20,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  vinTips: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  vinTipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 8,
  },
  vinTip: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
  },
  manualActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
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
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
})
