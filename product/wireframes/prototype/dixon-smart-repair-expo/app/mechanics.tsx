import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface Mechanic {
  id: string
  name: string
  shop: string
  address: string
  phone: string
  email?: string
  website?: string
  rating: number
  reviewCount: number
  distance: number // miles
  specialties: string[]
  certifications: string[]
  services: string[]
  hours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  pricing: 'budget' | 'moderate' | 'premium'
  isPreferred: boolean
  lastVisit?: Date
  totalVisits: number
  averageCost: number
}

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([
    {
      id: '1',
      name: 'Mike Johnson',
      shop: 'AutoCare Plus',
      address: '123 Main St, Anytown, ST 12345',
      phone: '(555) 123-4567',
      email: 'mike@autocareplus.com',
      website: 'www.autocareplus.com',
      rating: 4.8,
      reviewCount: 127,
      distance: 2.3,
      specialties: ['Brakes', 'Engine Repair', 'Transmission'],
      certifications: ['ASE Master Technician', 'Honda Certified'],
      services: ['Oil Change', 'Brake Service', 'Engine Diagnostics', 'Transmission Repair'],
      hours: {
        monday: '8:00 AM - 6:00 PM',
        tuesday: '8:00 AM - 6:00 PM',
        wednesday: '8:00 AM - 6:00 PM',
        thursday: '8:00 AM - 6:00 PM',
        friday: '8:00 AM - 6:00 PM',
        saturday: '8:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      pricing: 'moderate',
      isPreferred: true,
      lastVisit: new Date('2024-06-15'),
      totalVisits: 3,
      averageCost: 285
    },
    {
      id: '2',
      name: 'Sarah Chen',
      shop: 'Quick Lube Express',
      address: '456 Oak Ave, Anytown, ST 12345',
      phone: '(555) 987-6543',
      rating: 4.5,
      reviewCount: 89,
      distance: 1.8,
      specialties: ['Oil Changes', 'Basic Maintenance'],
      certifications: ['ASE Certified'],
      services: ['Oil Change', 'Filter Replacement', 'Fluid Top-off', 'Basic Inspection'],
      hours: {
        monday: '7:00 AM - 7:00 PM',
        tuesday: '7:00 AM - 7:00 PM',
        wednesday: '7:00 AM - 7:00 PM',
        thursday: '7:00 AM - 7:00 PM',
        friday: '7:00 AM - 7:00 PM',
        saturday: '8:00 AM - 6:00 PM',
        sunday: '9:00 AM - 5:00 PM'
      },
      pricing: 'budget',
      isPreferred: true,
      lastVisit: new Date('2024-03-10'),
      totalVisits: 2,
      averageCost: 65
    },
    {
      id: '3',
      name: 'Tom Rodriguez',
      shop: 'Ford Service Center',
      address: '789 Industrial Blvd, Anytown, ST 12345',
      phone: '(555) 456-7890',
      website: 'www.fordservice.com',
      rating: 4.9,
      reviewCount: 203,
      distance: 4.1,
      specialties: ['Ford Vehicles', 'Warranty Service', 'Engine Repair'],
      certifications: ['Ford Master Technician', 'ASE Master Technician'],
      services: ['Engine Repair', 'Transmission Service', 'Brake Service', 'Warranty Work'],
      hours: {
        monday: '7:00 AM - 6:00 PM',
        tuesday: '7:00 AM - 6:00 PM',
        wednesday: '7:00 AM - 6:00 PM',
        thursday: '7:00 AM - 6:00 PM',
        friday: '7:00 AM - 6:00 PM',
        saturday: '8:00 AM - 5:00 PM',
        sunday: 'Closed'
      },
      pricing: 'premium',
      isPreferred: false,
      totalVisits: 1,
      averageCost: 195
    },
    {
      id: '4',
      name: 'Lisa Park',
      shop: 'Precision Auto Repair',
      address: '321 Elm St, Anytown, ST 12345',
      phone: '(555) 234-5678',
      email: 'info@precisionauto.com',
      rating: 4.7,
      reviewCount: 156,
      distance: 3.2,
      specialties: ['European Cars', 'Diagnostics', 'Electrical'],
      certifications: ['ASE Master Technician', 'BMW Certified', 'Mercedes Certified'],
      services: ['Engine Diagnostics', 'Electrical Repair', 'AC Service', 'Brake Service'],
      hours: {
        monday: '8:00 AM - 5:00 PM',
        tuesday: '8:00 AM - 5:00 PM',
        wednesday: '8:00 AM - 5:00 PM',
        thursday: '8:00 AM - 5:00 PM',
        friday: '8:00 AM - 5:00 PM',
        saturday: 'By Appointment',
        sunday: 'Closed'
      },
      pricing: 'premium',
      isPreferred: false,
      totalVisits: 0,
      averageCost: 0
    }
  ])

  const [viewMode, setViewMode] = useState<'preferred' | 'all'>('preferred')
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance')

  const filteredMechanics = mechanics
    .filter(mechanic => viewMode === 'all' || mechanic.isPreferred)
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance': return a.distance - b.distance
        case 'rating': return b.rating - a.rating
        case 'price': return a.averageCost - b.averageCost
        default: return 0
      }
    })

  const togglePreferred = (mechanicId: string) => {
    setMechanics(prev => prev.map(mechanic => 
      mechanic.id === mechanicId 
        ? { ...mechanic, isPreferred: !mechanic.isPreferred }
        : mechanic
    ))
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`)
  }

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`)
  }

  const handleWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`
    Linking.openURL(url)
  }

  const handleDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    Linking.openURL(`maps://app?daddr=${encodedAddress}`)
  }

  const handleBookAppointment = (mechanic: Mechanic) => {
    Alert.alert(
      'Book Appointment',
      `Book service with ${mechanic.shop}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Shop', onPress: () => handleCall(mechanic.phone) },
        { text: 'Start Diagnosis', onPress: () => router.push('/') }
      ]
    )
  }

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'budget': return '#16a34a'
      case 'moderate': return '#ea580c'
      case 'premium': return '#7c3aed'
      default: return '#64748b'
    }
  }

  const getPricingLabel = (pricing: string) => {
    switch (pricing) {
      case 'budget': return '$'
      case 'moderate': return '$$'
      case 'premium': return '$$$'
      default: return '?'
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.titleText}>Mechanics</Text>
          <Text style={styles.subtitleText}>
            {filteredMechanics.length} {viewMode === 'preferred' ? 'preferred' : 'nearby'} shop{filteredMechanics.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => Alert.alert('Search', 'Mechanic search would be implemented here')}
        >
          <Ionicons name="search" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* View Toggle & Sort */}
      <View style={styles.controlsContainer}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'preferred' && styles.toggleButtonActive]}
            onPress={() => setViewMode('preferred')}
          >
            <Text style={[styles.toggleText, viewMode === 'preferred' && styles.toggleTextActive]}>
              Preferred
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'all' && styles.toggleButtonActive]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>
              All Nearby
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => {
            const options = ['distance', 'rating', 'price']
            const currentIndex = options.indexOf(sortBy)
            const nextIndex = (currentIndex + 1) % options.length
            setSortBy(options[nextIndex] as any)
          }}
        >
          <Ionicons name="funnel" size={16} color="#64748b" />
          <Text style={styles.sortText}>
            {sortBy === 'distance' ? 'Distance' : sortBy === 'rating' ? 'Rating' : 'Price'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mechanics List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredMechanics.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Mechanics Found</Text>
            <Text style={styles.emptyDescription}>
              {viewMode === 'preferred' 
                ? 'Add mechanics to your preferred list for quick access'
                : 'No mechanics found in your area'
              }
            </Text>
          </View>
        ) : (
          filteredMechanics.map((mechanic) => (
            <View key={mechanic.id} style={styles.mechanicCard}>
              {/* Mechanic Header */}
              <View style={styles.mechanicHeader}>
                <View style={styles.mechanicInfo}>
                  <View style={styles.mechanicTitleRow}>
                    <Text style={styles.mechanicName}>{mechanic.name}</Text>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => togglePreferred(mechanic.id)}
                    >
                      <Ionicons 
                        name={mechanic.isPreferred ? "heart" : "heart-outline"} 
                        size={20} 
                        color={mechanic.isPreferred ? "#dc2626" : "#64748b"} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.shopName}>{mechanic.shop}</Text>
                  <Text style={styles.address}>{mechanic.address}</Text>
                </View>
              </View>

              {/* Rating & Distance */}
              <View style={styles.mechanicStats}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.statText}>
                    {mechanic.rating} ({mechanic.reviewCount} reviews)
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="location" size={16} color="#64748b" />
                  <Text style={styles.statText}>{mechanic.distance} miles</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.pricingBadge, { color: getPricingColor(mechanic.pricing) }]}>
                    {getPricingLabel(mechanic.pricing)}
                  </Text>
                </View>
              </View>

              {/* Specialties */}
              <View style={styles.specialties}>
                <Text style={styles.specialtiesTitle}>Specialties:</Text>
                <View style={styles.specialtyTags}>
                  {mechanic.specialties.slice(0, 3).map((specialty, index) => (
                    <View key={index} style={styles.specialtyTag}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                  {mechanic.specialties.length > 3 && (
                    <Text style={styles.moreSpecialties}>
                      +{mechanic.specialties.length - 3} more
                    </Text>
                  )}
                </View>
              </View>

              {/* Visit History */}
              {mechanic.totalVisits > 0 && (
                <View style={styles.visitHistory}>
                  <Text style={styles.visitText}>
                    {mechanic.totalVisits} visit{mechanic.totalVisits !== 1 ? 's' : ''} • 
                    Avg cost: ${mechanic.averageCost}
                    {mechanic.lastVisit && ` • Last: ${mechanic.lastVisit.toLocaleDateString()}`}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={() => handleCall(mechanic.phone)}
                >
                  <Ionicons name="call" size={16} color="#1e40af" />
                  <Text style={styles.secondaryActionText}>Call</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={() => handleDirections(mechanic.address)}
                >
                  <Ionicons name="navigate" size={16} color="#1e40af" />
                  <Text style={styles.secondaryActionText}>Directions</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => handleBookAppointment(mechanic)}
                >
                  <Ionicons name="calendar" size={16} color="#ffffff" />
                  <Text style={styles.primaryActionText}>Book</Text>
                </TouchableOpacity>
              </View>

              {/* Contact Options */}
              <View style={styles.contactOptions}>
                {mechanic.email && (
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleEmail(mechanic.email!)}
                  >
                    <Ionicons name="mail" size={14} color="#64748b" />
                  </TouchableOpacity>
                )}
                
                {mechanic.website && (
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleWebsite(mechanic.website!)}
                  >
                    <Ionicons name="globe" size={14} color="#64748b" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#1e40af',
  },
  toggleText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  sortText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  mechanicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mechanicHeader: {
    marginBottom: 12,
  },
  mechanicInfo: {
    flex: 1,
  },
  mechanicTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mechanicName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  shopName: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#64748b',
  },
  mechanicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  pricingBadge: {
    fontSize: 16,
    fontWeight: '600',
  },
  specialties: {
    marginBottom: 12,
  },
  specialtiesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  specialtyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  visitHistory: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  visitText: {
    fontSize: 12,
    color: '#16a34a',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 40,
  },
  primaryAction: {
    backgroundColor: '#1e40af',
  },
  secondaryAction: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  secondaryActionText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  contactOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  contactButton: {
    padding: 8,
  },
})
