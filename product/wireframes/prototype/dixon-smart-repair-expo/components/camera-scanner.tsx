import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
} from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'

interface CameraScannerProps {
  visible: boolean
  onClose: () => void
  onVinDetected: (vin: string) => void
  onPhotoTaken: (uri: string) => void
}

const { width, height } = Dimensions.get('window')

export function CameraScanner({ visible, onClose, onVinDetected, onPhotoTaken }: CameraScannerProps) {
  const [facing, setFacing] = useState<CameraType>('back')
  const [permission, requestPermission] = useCameraPermissions()
  const [isScanning, setIsScanning] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  // Mock VIN patterns for demonstration
  const mockVins = [
    '1HGBH41JXMN109186', // Honda
    '4T1C11AK8LU123456', // Toyota
    '1FTFW1ET5DFC10312', // Ford
    '1G1ZT53806F109149', // Chevrolet
    'WBAVA33598NL12345', // BMW
  ]

  const handlePermissionRequest = async () => {
    if (!permission?.granted) {
      const result = await requestPermission()
      return result.granted
    }
    return true
  }

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return

    try {
      setIsScanning(true)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      if (photo?.uri) {
        onPhotoTaken(photo.uri)
        
        // Simulate VIN detection from photo
        setTimeout(() => {
          const randomVin = mockVins[Math.floor(Math.random() * mockVins.length)]
          onVinDetected(randomVin)
          setIsScanning(false)
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Camera error:', error)
      Alert.alert('Camera Error', 'Failed to take photo')
      setIsScanning(false)
    }
  }

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri
        onPhotoTaken(uri)
        
        // Simulate VIN detection from uploaded image
        setTimeout(() => {
          const randomVin = mockVins[Math.floor(Math.random() * mockVins.length)]
          onVinDetected(randomVin)
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'))
  }

  if (!permission) {
    return <View />
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Dixon Smart Repair needs camera access to scan VIN numbers and capture vehicle issues.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan VIN or Take Photo</Text>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Text style={styles.flipButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* VIN Scanning Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanText}>
                {isScanning ? 'Scanning VIN...' : 'Position VIN within frame'}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
              <Text style={styles.controlButtonText}>🖼️</Text>
              <Text style={styles.controlLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.captureButton, isScanning && styles.captureButtonScanning]} 
              onPress={handleTakePhoto}
              disabled={isScanning}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.manualButton} onPress={() => {
              onClose()
              // Could trigger manual VIN entry
            }}>
              <Text style={styles.controlButtonText}>⌨️</Text>
              <Text style={styles.controlLabel}>Manual</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    color: '#ffffff',
    fontSize: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.8,
    height: 120,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scanText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  galleryButton: {
    alignItems: 'center',
  },
  manualButton: {
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonScanning: {
    backgroundColor: '#f59e0b',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e40af',
  },
})
