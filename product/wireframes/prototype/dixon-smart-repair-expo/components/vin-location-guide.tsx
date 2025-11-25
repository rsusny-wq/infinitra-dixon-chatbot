import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface VinLocationGuideProps {
  visible: boolean
  onClose: () => void
  vehicleInfo?: {
    make?: string
    model?: string
    year?: number
  }
}

interface VinLocation {
  id: string
  location: string
  title: string
  description: string
  image: string
  commonFor: string[]
  instructions: string[]
  tips: string[]
}

export function VinLocationGuide({ visible, onClose, vehicleInfo }: VinLocationGuideProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [imageZoomed, setImageZoomed] = useState(false)

  const vinLocations: VinLocation[] = [
    {
      id: 'dashboard',
      location: 'Dashboard',
      title: 'Dashboard (Most Common)',
      description: 'Located on the driver\'s side dashboard, visible through the windshield',
      image: 'dashboard-vin',
      commonFor: ['Most vehicles', 'Cars', 'SUVs', 'Trucks'],
      instructions: [
        'Stand outside the vehicle on the driver\'s side',
        'Look through the windshield at the dashboard',
        'The VIN is usually on a metal plate near the windshield base',
        'May be partially covered by the dashboard edge'
      ],
      tips: [
        'Use a flashlight if lighting is poor',
        'Clean the windshield for better visibility',
        'The VIN plate is usually riveted to the dashboard'
      ]
    },
    {
      id: 'door',
      location: 'Driver Door',
      title: 'Driver\'s Door Frame',
      description: 'On a sticker or plate attached to the driver\'s door frame',
      image: 'door-vin',
      commonFor: ['All vehicles', 'Alternative location', 'When dashboard VIN is unclear'],
      instructions: [
        'Open the driver\'s side door completely',
        'Look at the door frame where the door latches',
        'Check for a white or silver sticker/plate',
        'VIN is usually at the top of the information'
      ],
      tips: [
        'Also contains other vehicle information',
        'Usually easier to read than dashboard VIN',
        'May have multiple stickers - look for 17-character code'
      ]
    },
    {
      id: 'engine',
      location: 'Engine Bay',
      title: 'Engine Compartment',
      description: 'Stamped or on a plate somewhere in the engine bay',
      image: 'engine-vin',
      commonFor: ['Older vehicles', 'Some trucks', 'Classic cars'],
      instructions: [
        'Open the hood safely',
        'Look for stamped numbers on the engine block',
        'Check for metal plates attached to the firewall',
        'May be on the radiator support or strut tower'
      ],
      tips: [
        'Engine must be cool before checking',
        'May be dirty or hard to read',
        'Bring a flashlight and cleaning cloth'
      ]
    },
    {
      id: 'registration',
      location: 'Registration/Title',
      title: 'Vehicle Documents',
      description: 'Listed on your vehicle registration, title, or insurance documents',
      image: 'documents-vin',
      commonFor: ['When physical VIN is inaccessible', 'Verification', 'All vehicles'],
      instructions: [
        'Check your vehicle registration document',
        'Look at your vehicle title',
        'Check insurance documents',
        'May be on maintenance records'
      ],
      tips: [
        'Always matches the physical VIN on the vehicle',
        'Useful for verification',
        'Keep documents in a safe place'
      ]
    }
  ]

  const getRecommendedLocation = () => {
    if (!vehicleInfo?.make) return vinLocations[0] // Default to dashboard
    
    const make = vehicleInfo.make.toLowerCase()
    const year = vehicleInfo.year || new Date().getFullYear()
    
    // Vehicle-specific recommendations
    if (year < 1981) {
      return vinLocations.find(loc => loc.id === 'engine') || vinLocations[0]
    }
    
    if (['ford', 'chevrolet', 'gmc'].includes(make)) {
      return vinLocations[0] // Dashboard usually clear
    }
    
    return vinLocations[0] // Dashboard is most common
  }

  const recommendedLocation = getRecommendedLocation()

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(selectedLocation === locationId ? null : locationId)
  }

  const renderLocationCard = (location: VinLocation, isRecommended: boolean = false) => (
    <TouchableOpacity
      key={location.id}
      style={[
        styles.locationCard,
        selectedLocation === location.id && styles.selectedCard,
        isRecommended && styles.recommendedCard
      ]}
      onPress={() => handleLocationSelect(location.id)}
    >
      <View style={styles.locationHeader}>
        <View style={styles.locationTitleRow}>
          <Ionicons 
            name={getLocationIcon(location.id)} 
            size={24} 
            color={isRecommended ? '#16a34a' : '#1e40af'} 
          />
          <Text style={[
            styles.locationTitle,
            isRecommended && styles.recommendedTitle
          ]}>
            {location.title}
          </Text>
          {isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          )}
        </View>
        <Ionicons 
          name={selectedLocation === location.id ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#64748b" 
        />
      </View>
      
      <Text style={styles.locationDescription}>{location.description}</Text>
      
      {selectedLocation === location.id && (
        <View style={styles.expandedContent}>
          {/* Mock Image Placeholder */}
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => setImageZoomed(true)}
          >
            <View style={styles.mockImage}>
              <Ionicons name="image" size={48} color="#cbd5e1" />
              <Text style={styles.mockImageText}>VIN Location Image</Text>
              <Text style={styles.mockImageSubtext}>Tap to zoom</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>Instructions:</Text>
            {location.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Tips:</Text>
            {location.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name="bulb" size={14} color="#f59e0b" />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.commonForSection}>
            <Text style={styles.sectionTitle}>Common for:</Text>
            <View style={styles.tagContainer}>
              {location.commonFor.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  )

  const getLocationIcon = (locationId: string) => {
    switch (locationId) {
      case 'dashboard': return 'speedometer'
      case 'door': return 'car'
      case 'engine': return 'hardware-chip'
      case 'registration': return 'document-text'
      default: return 'location'
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Where to Find Your VIN</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introduction}>
            <Text style={styles.introTitle}>Vehicle Identification Number (VIN)</Text>
            <Text style={styles.introText}>
              Your VIN is a unique 17-character code that identifies your specific vehicle. 
              Here are the most common places to find it:
            </Text>
            {vehicleInfo?.make && (
              <Text style={styles.vehicleSpecific}>
                For your {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}, 
                we recommend checking the {recommendedLocation.location.toLowerCase()} first.
              </Text>
            )}
          </View>

          {/* Recommended Location First */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Recommended for Your Vehicle</Text>
            {renderLocationCard(recommendedLocation, true)}
          </View>

          {/* Other Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Other Common Locations</Text>
            {vinLocations
              .filter(loc => loc.id !== recommendedLocation.id)
              .map(location => renderLocationCard(location))
            }
          </View>

          {/* General Tips */}
          <View style={styles.generalTips}>
            <Text style={styles.sectionHeader}>General Tips</Text>
            <View style={styles.tipsList}>
              <View style={styles.generalTip}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.generalTipText}>
                  VIN is always exactly 17 characters (letters and numbers)
                </Text>
              </View>
              <View style={styles.generalTip}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.generalTipText}>
                  Letters I, O, and Q are never used in VINs
                </Text>
              </View>
              <View style={styles.generalTip}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.generalTipText}>
                  Clean the area before reading for better visibility
                </Text>
              </View>
              <View style={styles.generalTip}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.generalTipText}>
                  Use your phone's flashlight in dark areas
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Image Zoom Modal */}
        <Modal
          visible={imageZoomed}
          transparent
          animationType="fade"
          onRequestClose={() => setImageZoomed(false)}
        >
          <TouchableOpacity 
            style={styles.imageZoomOverlay}
            activeOpacity={1}
            onPress={() => setImageZoomed(false)}
          >
            <View style={styles.zoomedImageContainer}>
              <View style={styles.zoomedMockImage}>
                <Ionicons name="image" size={120} color="#cbd5e1" />
                <Text style={styles.zoomedImageText}>Zoomed VIN Location</Text>
                <Text style={styles.zoomedImageSubtext}>Tap anywhere to close</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introduction: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 12,
  },
  vehicleSpecific: {
    fontSize: 14,
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#1e40af',
    borderWidth: 2,
  },
  recommendedCard: {
    borderColor: '#16a34a',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
    flex: 1,
  },
  recommendedTitle: {
    color: '#16a34a',
  },
  recommendedBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  locationDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  imageContainer: {
    marginBottom: 16,
  },
  mockImage: {
    height: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockImageText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '500',
  },
  mockImageSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  instructionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  tipsSection: {
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  commonForSection: {
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  generalTips: {
    marginBottom: 24,
  },
  tipsList: {
    gap: 12,
  },
  generalTip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generalTipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  imageZoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedImageContainer: {
    width: '90%',
    maxWidth: 400,
  },
  zoomedMockImage: {
    height: 300,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedImageText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 12,
    fontWeight: '500',
  },
  zoomedImageSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
})
