import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Alert,
  ScrollView,
} from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { CameraScanner } from './camera-scanner'
import { shadows } from '../constants/styles'

interface PhotoAttachmentProps {
  visible: boolean
  onClose: () => void
  onPhotosSelected: (photos: string[]) => void
  onVinDetected?: (vin: string) => void
  maxPhotos?: number
}

export function PhotoAttachment({ 
  visible, 
  onClose, 
  onPhotosSelected, 
  onVinDetected,
  maxPhotos = 5 
}: PhotoAttachmentProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [cameraVisible, setCameraVisible] = useState(false)

  const handleTakePhoto = () => {
    setCameraVisible(true)
  }

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxPhotos - selectedPhotos.length,
        quality: 0.8,
        aspect: [4, 3],
      })

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri)
        const updatedPhotos = [...selectedPhotos, ...newPhotos].slice(0, maxPhotos)
        setSelectedPhotos(updatedPhotos)
      }
    } catch (error) {
      console.error('Gallery picker error:', error)
      Alert.alert('Error', 'Failed to pick photos from gallery')
    }
  }

  const handleCameraPhoto = (uri: string) => {
    const updatedPhotos = [...selectedPhotos, uri].slice(0, maxPhotos)
    setSelectedPhotos(updatedPhotos)
  }

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = selectedPhotos.filter((_, i) => i !== index)
    setSelectedPhotos(updatedPhotos)
  }

  const handleSendPhotos = () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please select at least one photo to send.')
      return
    }
    
    onPhotosSelected(selectedPhotos)
    setSelectedPhotos([])
    onClose()
  }

  const handleCancel = () => {
    setSelectedPhotos([])
    onClose()
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Photos</Text>
            <TouchableOpacity 
              onPress={handleSendPhotos}
              disabled={selectedPhotos.length === 0}
            >
              <Text style={[
                styles.sendText,
                selectedPhotos.length === 0 && styles.sendTextDisabled
              ]}>
                Send ({selectedPhotos.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Photo Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleTakePhoto}
              disabled={selectedPhotos.length >= maxPhotos}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.optionTitle}>Take Photo</Text>
              <Text style={styles.optionSubtitle}>
                Capture vehicle issue or VIN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handlePickFromGallery}
              disabled={selectedPhotos.length >= maxPhotos}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="images" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.optionTitle}>Choose from Gallery</Text>
              <Text style={styles.optionSubtitle}>
                Select existing photos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected Photos */}
          {selectedPhotos.length > 0 && (
            <View style={styles.selectedPhotosContainer}>
              <Text style={styles.selectedPhotosTitle}>
                Selected Photos ({selectedPhotos.length}/{maxPhotos})
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosScrollContainer}
              >
                {selectedPhotos.map((uri, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photoThumbnail} />
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Tips for Better Photos:</Text>
            <Text style={styles.helpText}>• Ensure good lighting</Text>
            <Text style={styles.helpText}>• Keep VIN numbers clear and readable</Text>
            <Text style={styles.helpText}>• Show the full problem area</Text>
            <Text style={styles.helpText}>• Take multiple angles if needed</Text>
          </View>
        </View>
      </Modal>

      {/* Camera Scanner */}
      <CameraScanner
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onVinDetected={(vin) => {
          onVinDetected?.(vin)
          setCameraVisible(false)
        }}
        onPhotoTaken={handleCameraPhoto}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  sendText: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  sendTextDisabled: {
    color: '#94a3b8',
  },
  optionsContainer: {
    padding: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
    flex: 1,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  selectedPhotosContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  selectedPhotosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  photosScrollContainer: {
    paddingRight: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpContainer: {
    padding: 16,
    backgroundColor: '#f8fafc',
    marginTop: 'auto',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
})
