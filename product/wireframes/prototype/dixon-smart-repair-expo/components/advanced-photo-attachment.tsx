import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface PhotoAttachment {
  id: string
  uri: string
  type: 'damage' | 'part' | 'symptom' | 'general'
  description: string
  timestamp: Date
  analysis?: {
    confidence: number
    findings: string[]
    recommendations: string[]
  }
}

interface AdvancedPhotoAttachmentProps {
  onPhotosUpdated: (photos: PhotoAttachment[]) => void
  maxPhotos?: number
  allowedTypes?: ('damage' | 'part' | 'symptom' | 'general')[]
}

export function AdvancedPhotoAttachment({
  onPhotosUpdated,
  maxPhotos = 6,
  allowedTypes = ['damage', 'part', 'symptom', 'general']
}: AdvancedPhotoAttachmentProps) {
  const [photos, setPhotos] = useState<PhotoAttachment[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAttachment | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null)

  // Mock photo URIs for demonstration
  const mockPhotoUris = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1562141961-4c8d29ce1fb3?w=400&h=300&fit=crop'
  ]

  const getTypeInfo = (type: PhotoAttachment['type']) => {
    switch (type) {
      case 'damage':
        return { icon: 'warning', color: '#dc2626', label: 'Damage' }
      case 'part':
        return { icon: 'construct', color: '#ea580c', label: 'Part' }
      case 'symptom':
        return { icon: 'medical', color: '#3b82f6', label: 'Symptom' }
      case 'general':
        return { icon: 'camera', color: '#16a34a', label: 'General' }
    }
  }

  const simulatePhotoCapture = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Photo Limit', `Maximum ${maxPhotos} photos allowed`)
      return
    }

    // Simulate camera/gallery selection
    const randomUri = mockPhotoUris[Math.floor(Math.random() * mockPhotoUris.length)]
    setPendingPhotoUri(randomUri)
    setShowTypeSelector(true)
  }

  const handlePhotoTypeSelected = (type: PhotoAttachment['type']) => {
    if (!pendingPhotoUri) return

    const newPhoto: PhotoAttachment = {
      id: `photo_${Date.now()}`,
      uri: pendingPhotoUri,
      type,
      description: generatePhotoDescription(type),
      timestamp: new Date(),
      analysis: generatePhotoAnalysis(type)
    }

    const updatedPhotos = [...photos, newPhoto]
    setPhotos(updatedPhotos)
    onPhotosUpdated(updatedPhotos)
    
    setPendingPhotoUri(null)
    setShowTypeSelector(false)
  }

  const generatePhotoDescription = (type: PhotoAttachment['type']): string => {
    switch (type) {
      case 'damage':
        return 'Visible damage or wear on vehicle component'
      case 'part':
        return 'Close-up view of specific vehicle part'
      case 'symptom':
        return 'Visual evidence of reported symptom'
      case 'general':
        return 'General vehicle photo for reference'
    }
  }

  const generatePhotoAnalysis = (type: PhotoAttachment['type']) => {
    const analyses = {
      damage: {
        confidence: 85,
        findings: [
          'Surface scratches visible',
          'Minor paint damage detected',
          'No structural damage apparent'
        ],
        recommendations: [
          'Consider touch-up paint repair',
          'Monitor for rust development',
          'Professional assessment recommended'
        ]
      },
      part: {
        confidence: 92,
        findings: [
          'Component appears worn',
          'Normal wear patterns observed',
          'Part identification confirmed'
        ],
        recommendations: [
          'Replacement may be needed soon',
          'Monitor performance closely',
          'Consider preventive maintenance'
        ]
      },
      symptom: {
        confidence: 78,
        findings: [
          'Visual symptoms match description',
          'Consistent with reported issue',
          'Additional inspection needed'
        ],
        recommendations: [
          'Correlates with diagnostic findings',
          'Professional inspection advised',
          'Document progression over time'
        ]
      },
      general: {
        confidence: 70,
        findings: [
          'Overall vehicle condition noted',
          'Context for diagnostic process',
          'Reference documentation'
        ],
        recommendations: [
          'Useful for service history',
          'Provides diagnostic context',
          'Keep for maintenance records'
        ]
      }
    }
    
    return analyses[type]
  }

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = photos.filter(p => p.id !== photoId)
            setPhotos(updatedPhotos)
            onPhotosUpdated(updatedPhotos)
            setShowPhotoModal(false)
          }
        }
      ]
    )
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Photo Documentation</Text>
          <Text style={styles.headerSubtitle}>
            {photos.length}/{maxPhotos} photos • AI analysis enabled
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.addButton, photos.length >= maxPhotos && styles.addButtonDisabled]}
          onPress={simulatePhotoCapture}
          disabled={photos.length >= maxPhotos}
        >
          <Ionicons name="camera" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      <ScrollView style={styles.photoGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {photos.map((photo) => {
            const typeInfo = getTypeInfo(photo.type)
            return (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoCard}
                onPress={() => {
                  setSelectedPhoto(photo)
                  setShowPhotoModal(true)
                }}
              >
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                
                <View style={styles.photoOverlay}>
                  <View style={[styles.typeIndicator, { backgroundColor: typeInfo.color }]}>
                    <Ionicons name={typeInfo.icon as any} size={12} color="#ffffff" />
                    <Text style={styles.typeText}>{typeInfo.label}</Text>
                  </View>
                  
                  {photo.analysis && (
                    <View style={styles.analysisIndicator}>
                      <Ionicons name="analytics" size={12} color="#ffffff" />
                      <Text style={styles.analysisText}>{photo.analysis.confidence}%</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.photoInfo}>
                  <Text style={styles.photoDescription} numberOfLines={2}>
                    {photo.description}
                  </Text>
                  <Text style={styles.photoTimestamp}>
                    {formatTimestamp(photo.timestamp)}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
          
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, maxPhotos - photos.length) }).map((_, index) => (
            <View key={`empty_${index}`} style={styles.emptySlot}>
              <Ionicons name="camera-outline" size={24} color="#d1d5db" />
              <Text style={styles.emptySlotText}>Add Photo</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Photo Type Selector Modal */}
      <Modal visible={showTypeSelector} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.typeSelectorModal}>
            <Text style={styles.typeSelectorTitle}>What type of photo is this?</Text>
            
            <View style={styles.typeOptions}>
              {allowedTypes.map((type) => {
                const typeInfo = getTypeInfo(type)
                return (
                  <TouchableOpacity
                    key={type}
                    style={styles.typeOption}
                    onPress={() => handlePhotoTypeSelected(type)}
                  >
                    <View style={[styles.typeOptionIcon, { backgroundColor: typeInfo.color }]}>
                      <Ionicons name={typeInfo.icon as any} size={20} color="#ffffff" />
                    </View>
                    <Text style={styles.typeOptionLabel}>{typeInfo.label}</Text>
                    <Text style={styles.typeOptionDescription}>
                      {generatePhotoDescription(type)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            
            <TouchableOpacity 
              style={styles.cancelTypeButton}
              onPress={() => {
                setPendingPhotoUri(null)
                setShowTypeSelector(false)
              }}
            >
              <Text style={styles.cancelTypeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Detail Modal */}
      <Modal visible={showPhotoModal} animationType="slide" presentationStyle="pageSheet">
        {selectedPhoto && (
          <View style={styles.photoDetailModal}>
            <View style={styles.photoDetailHeader}>
              <TouchableOpacity 
                style={styles.closeDetailButton}
                onPress={() => setShowPhotoModal(false)}
              >
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
              
              <Text style={styles.photoDetailTitle}>Photo Details</Text>
              
              <TouchableOpacity 
                style={styles.deletePhotoButton}
                onPress={() => handleDeletePhoto(selectedPhoto.id)}
              >
                <Ionicons name="trash" size={20} color="#dc2626" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.photoDetailContent}>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.fullPhoto} />
              
              <View style={styles.photoDetailInfo}>
                <View style={styles.photoDetailRow}>
                  <Text style={styles.photoDetailLabel}>Type:</Text>
                  <View style={styles.photoDetailType}>
                    <View style={[
                      styles.typeIndicator, 
                      { backgroundColor: getTypeInfo(selectedPhoto.type).color }
                    ]}>
                      <Ionicons 
                        name={getTypeInfo(selectedPhoto.type).icon as any} 
                        size={12} 
                        color="#ffffff" 
                      />
                      <Text style={styles.typeText}>
                        {getTypeInfo(selectedPhoto.type).label}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.photoDetailRow}>
                  <Text style={styles.photoDetailLabel}>Captured:</Text>
                  <Text style={styles.photoDetailValue}>
                    {selectedPhoto.timestamp.toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.photoDetailRow}>
                  <Text style={styles.photoDetailLabel}>Description:</Text>
                  <Text style={styles.photoDetailValue}>{selectedPhoto.description}</Text>
                </View>
              </View>
              
              {selectedPhoto.analysis && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>AI Analysis</Text>
                  
                  <View style={styles.analysisConfidence}>
                    <Text style={styles.analysisConfidenceLabel}>Confidence:</Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceFill, 
                          { width: `${selectedPhoto.analysis.confidence}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.confidenceText}>
                      {selectedPhoto.analysis.confidence}%
                    </Text>
                  </View>
                  
                  <View style={styles.analysisFindings}>
                    <Text style={styles.analysisFindingsTitle}>Findings:</Text>
                    {selectedPhoto.analysis.findings.map((finding, index) => (
                      <View key={index} style={styles.findingItem}>
                        <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                        <Text style={styles.findingText}>{finding}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.analysisRecommendations}>
                    <Text style={styles.analysisRecommendationsTitle}>Recommendations:</Text>
                    {selectedPhoto.analysis.recommendations.map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <Ionicons name="bulb" size={14} color="#f59e0b" />
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  photoGrid: {
    flex: 1,
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f1f5f9',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  analysisIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  analysisText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  photoInfo: {
    padding: 8,
  },
  photoDescription: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 4,
  },
  photoTimestamp: {
    fontSize: 10,
    color: '#64748b',
  },
  emptySlot: {
    width: '47%',
    height: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSelectorModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  typeSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 20,
  },
  typeOptions: {
    gap: 12,
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 12,
  },
  typeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    minWidth: 60,
  },
  typeOptionDescription: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  cancelTypeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelTypeButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  photoDetailModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  photoDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeDetailButton: {
    padding: 4,
  },
  photoDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  deletePhotoButton: {
    padding: 4,
  },
  photoDetailContent: {
    flex: 1,
  },
  fullPhoto: {
    width: '100%',
    height: 300,
    backgroundColor: '#f1f5f9',
  },
  photoDetailInfo: {
    padding: 16,
    gap: 12,
  },
  photoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    minWidth: 80,
  },
  photoDetailValue: {
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  photoDetailType: {
    flex: 1,
  },
  analysisSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 12,
  },
  analysisConfidence: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  analysisConfidenceLabel: {
    fontSize: 14,
    color: '#64748b',
    minWidth: 80,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  confidenceText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
  analysisFindings: {
    marginBottom: 16,
  },
  analysisFindingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 8,
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  findingText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  analysisRecommendations: {
    marginBottom: 8,
  },
  analysisRecommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
})
