import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { Camera } from 'expo-camera'
import { VinLocationGuide } from './vin-location-guide'

interface VinCaptureCardProps {
  onVinCaptured: (vinData: VehicleInfo) => void
  onClose: () => void
}

interface VehicleInfo {
  vin: string
  year: number
  make: string
  model: string
  engine?: string
  transmission?: string
}

export function VinCaptureCard({ onVinCaptured, onClose }: VinCaptureCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [captureMethod, setCaptureMethod] = useState<'camera' | 'photo' | 'manual' | null>(null)
  const [showLocationGuide, setShowLocationGuide] = useState(false)

  const validateVIN = (vin: string): { isValid: boolean; error?: string } => {
    // Remove spaces and convert to uppercase
    const cleanVin = vin.replace(/\s/g, '').toUpperCase()
    
    // Check length
    if (cleanVin.length !== 17) {
      return { 
        isValid: false, 
        error: `VIN must be exactly 17 characters. You entered ${cleanVin.length} characters.` 
      }
    }
    
    // Check for invalid characters (I, O, Q are not used in VINs)
    const invalidChars = cleanVin.match(/[IOQ]/g)
    if (invalidChars) {
      return { 
        isValid: false, 
        error: `VIN cannot contain the letters I, O, or Q. Found: ${invalidChars.join(', ')}` 
      }
    }
    
    // Check for valid characters (only letters and numbers)
    const validPattern = /^[A-HJ-NPR-Z0-9]{17}$/
    if (!validPattern.test(cleanVin)) {
      return { 
        isValid: false, 
        error: 'VIN can only contain letters (except I, O, Q) and numbers.' 
      }
    }
    
    // Mock check digit validation (simplified)
    // In a real implementation, this would use the actual VIN check digit algorithm
    const checkDigit = cleanVin[8]
    if (!/[0-9X]/.test(checkDigit)) {
      return { 
        isValid: false, 
        error: 'VIN format appears incorrect. Please double-check the 9th character.' 
      }
    }
    
    return { isValid: true }
  }

  const mockVinLookup = async (vin: string): Promise<VehicleInfo> => {
    // Validate VIN first
    const validation = validateVIN(vin)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Clean VIN for lookup
    const cleanVin = vin.replace(/\s/g, '').toUpperCase()
    
    // Mock VIN database with more realistic entries
    const mockVehicles: Record<string, VehicleInfo> = {
      '1HGBH41JXMN109186': {
        vin: '1HGBH41JXMN109186',
        year: 2021,
        make: 'Honda',
        model: 'Civic',
        engine: '2.0L 4-Cylinder',
        transmission: 'CVT'
      },
      '1FTFW1ET5DFC10312': {
        vin: '1FTFW1ET5DFC10312',
        year: 2013,
        make: 'Ford',
        model: 'F-150',
        engine: '5.0L V8',
        transmission: '6-Speed Automatic'
      },
      '1G1YY22G965107849': {
        vin: '1G1YY22G965107849',
        year: 2006,
        make: 'Chevrolet',
        model: 'Corvette',
        engine: '6.0L V8',
        transmission: '6-Speed Manual'
      },
      '5NPE24AF2FH123456': {
        vin: '5NPE24AF2FH123456',
        year: 2015,
        make: 'Hyundai',
        model: 'Elantra',
        engine: '1.8L 4-Cylinder',
        transmission: '6-Speed Automatic'
      }
    }
    
    // Return specific vehicle or generate realistic default
    if (mockVehicles[cleanVin]) {
      return mockVehicles[cleanVin]
    }
    
    // Generate realistic vehicle based on VIN pattern
    const year = 2000 + parseInt(cleanVin[9]) || 2020
    const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai']
    const models = ['Camry', 'Civic', 'F-150', 'Silverado', 'Altima', 'Elantra']
    
    const makeIndex = cleanVin.charCodeAt(0) % makes.length
    const modelIndex = cleanVin.charCodeAt(1) % models.length
    
    return {
      vin: cleanVin,
      year: year,
      make: makes[makeIndex],
      model: models[modelIndex],
      engine: '2.5L 4-Cylinder',
      transmission: 'CVT'
    }
  }

  const handleCameraCapture = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to scan VIN numbers.')
        return
      }

      setCaptureMethod('camera')
      setIsProcessing(true)

      // Simulate VIN scanning from camera
      setTimeout(async () => {
        try {
          const mockScannedVin = '1HGBH41JXMN109186'
          const vehicleInfo = await mockVinLookup(mockScannedVin)
          onVinCaptured(vehicleInfo)
          setIsProcessing(false)
        } catch (error) {
          setIsProcessing(false)
          Alert.alert('VIN Validation Error', error instanceof Error ? error.message : 'Invalid VIN format')
        }
      }, 3000)
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera')
      setIsProcessing(false)
    }
  }

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        setCaptureMethod('photo')
        setIsProcessing(true)

        // Simulate VIN extraction from photo
        setTimeout(async () => {
          try {
            const mockExtractedVin = '1FTFW1ET5DFC10312'
            const vehicleInfo = await mockVinLookup(mockExtractedVin)
            onVinCaptured(vehicleInfo)
            setIsProcessing(false)
          } catch (error) {
            setIsProcessing(false)
            Alert.alert('VIN Validation Error', error instanceof Error ? error.message : 'Invalid VIN format')
          }
        }, 4000)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process image')
      setIsProcessing(false)
    }
  }

  const handleManualEntry = () => {
    setCaptureMethod('manual')
    // For now, simulate manual entry with a default vehicle
    setTimeout(async () => {
      try {
        const vehicleInfo = await mockVinLookup('5NPE24AF2FH123456')
        onVinCaptured(vehicleInfo)
      } catch (error) {
        Alert.alert('VIN Validation Error', error instanceof Error ? error.message : 'Invalid VIN format')
      }
    }, 1000)
  }

  if (isProcessing) {
    return (
      <View style={styles.card}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.processingText}>
            {captureMethod === 'camera' && 'Scanning VIN from camera...'}
            {captureMethod === 'photo' && 'Extracting VIN from photo...'}
            {captureMethod === 'manual' && 'Looking up vehicle information...'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Identification</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.description}>
        I can help identify your vehicle for more accurate diagnostics. Choose one of these options:
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option} onPress={handleCameraCapture}>
          <View style={styles.optionIcon}>
            <Ionicons name="camera" size={24} color="#1e40af" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Scan VIN with Camera</Text>
            <Text style={styles.optionDescription}>Point camera at VIN number</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handlePhotoUpload}>
          <View style={styles.optionIcon}>
            <Ionicons name="image" size={24} color="#1e40af" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Upload VIN Photo</Text>
            <Text style={styles.optionDescription}>Select photo from gallery</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleManualEntry}>
          <View style={styles.optionIcon}>
            <Ionicons name="create" size={24} color="#1e40af" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Enter Vehicle Info</Text>
            <Text style={styles.optionDescription}>Manually enter make, model, year</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.helpContainer}>
        <Ionicons name="information-circle" size={16} color="#64748b" />
        <Text style={styles.helpText}>
          VIN is usually found on dashboard, driver's door, or registration
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.locationGuideButton}
        onPress={() => setShowLocationGuide(true)}
      >
        <Ionicons name="map" size={20} color="#1e40af" />
        <Text style={styles.locationGuideText}>Show VIN Location Guide</Text>
        <Ionicons name="chevron-forward" size={16} color="#1e40af" />
      </TouchableOpacity>

      {/* VIN Location Guide Modal */}
      <VinLocationGuide
        visible={showLocationGuide}
        onClose={() => setShowLocationGuide(false)}
        vehicleInfo={undefined} // Could pass known vehicle info if available
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  locationGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e40af',
    marginTop: 12,
  },
  locationGuideText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    marginHorizontal: 8,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  processingText: {
    fontSize: 16,
    color: '#1e40af',
    marginTop: 12,
    textAlign: 'center',
  },
})
