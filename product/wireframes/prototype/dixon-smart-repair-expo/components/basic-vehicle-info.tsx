import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface BasicVehicleInfoProps {
  visible: boolean
  onClose: () => void
  onVehicleInfoCollected: (vehicleInfo: BasicVehicleInfo) => void
}

export interface BasicVehicleInfo {
  make: string
  model: string
  year: number
  confidence: 'high' | 'medium' | 'low'
  source: 'exact_match' | 'similar_match' | 'user_input'
  specifications?: {
    engine?: string
    transmission?: string
    drivetrain?: string
  }
}

export function BasicVehicleInfo({ visible, onClose, onVehicleInfoCollected }: BasicVehicleInfoProps) {
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState<{
    makes: string[]
    models: string[]
  }>({
    makes: [],
    models: []
  })

  // Mock vehicle database for realistic suggestions
  const vehicleDatabase = {
    makes: [
      'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 
      'Subaru', 'Mazda', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 
      'Lexus', 'Acura', 'Infiniti', 'Jeep', 'Ram', 'GMC', 'Cadillac'
    ],
    models: {
      'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Tacoma', 'Tundra', '4Runner'],
      'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Fit', 'HR-V', 'Passport', 'Ridgeline'],
      'Ford': ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang', 'Edge', 'Expedition', 'Ranger'],
      'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Tahoe', 'Suburban', 'Camaro', 'Corvette'],
      'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Frontier', 'Titan', 'Murano', 'Versa'],
      'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent', 'Kona', 'Palisade', 'Genesis'],
      'Kia': ['Forte', 'Optima', 'Sorento', 'Sportage', 'Rio', 'Soul', 'Telluride', 'Stinger']
    }
  }

  const mockVehicleLookup = async (make: string, model: string, year: number): Promise<BasicVehicleInfo> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    const makeKey = make as keyof typeof vehicleDatabase.models
    const availableModels = vehicleDatabase.models[makeKey] || []
    
    // Check for exact match
    if (availableModels.includes(model)) {
      return {
        make,
        model,
        year,
        confidence: 'high',
        source: 'exact_match',
        specifications: {
          engine: getCommonEngine(make, model),
          transmission: getCommonTransmission(make, model),
          drivetrain: getCommonDrivetrain(make, model)
        }
      }
    }

    // Check for similar match
    const similarModel = availableModels.find(m => 
      m.toLowerCase().includes(model.toLowerCase()) || 
      model.toLowerCase().includes(m.toLowerCase())
    )

    if (similarModel) {
      return {
        make,
        model: similarModel,
        year,
        confidence: 'medium',
        source: 'similar_match',
        specifications: {
          engine: getCommonEngine(make, similarModel),
          transmission: getCommonTransmission(make, similarModel)
        }
      }
    }

    // Return user input with low confidence
    return {
      make,
      model,
      year,
      confidence: 'low',
      source: 'user_input'
    }
  }

  const getCommonEngine = (make: string, model: string): string => {
    // Mock engine specifications based on common configurations
    const engineMap: Record<string, Record<string, string>> = {
      'Toyota': {
        'Camry': '2.5L 4-Cylinder',
        'Corolla': '2.0L 4-Cylinder',
        'RAV4': '2.5L 4-Cylinder',
        'Highlander': '3.5L V6'
      },
      'Honda': {
        'Civic': '2.0L 4-Cylinder',
        'Accord': '1.5L Turbo 4-Cylinder',
        'CR-V': '1.5L Turbo 4-Cylinder',
        'Pilot': '3.5L V6'
      },
      'Ford': {
        'F-150': '3.3L V6',
        'Escape': '1.5L Turbo 4-Cylinder',
        'Explorer': '2.3L Turbo 4-Cylinder',
        'Mustang': '2.3L Turbo 4-Cylinder'
      }
    }

    return engineMap[make]?.[model] || '2.5L 4-Cylinder'
  }

  const getCommonTransmission = (make: string, model: string): string => {
    // Mock transmission types
    const transmissionMap: Record<string, string> = {
      'Civic': 'CVT',
      'Accord': 'CVT',
      'Camry': '8-Speed Automatic',
      'F-150': '10-Speed Automatic',
      'Mustang': '6-Speed Manual'
    }

    return transmissionMap[model] || 'Automatic'
  }

  const getCommonDrivetrain = (make: string, model: string): string => {
    const drivetrainMap: Record<string, string> = {
      'F-150': '4WD',
      'RAV4': 'AWD',
      'CR-V': 'AWD',
      'Explorer': 'AWD'
    }

    return drivetrainMap[model] || 'FWD'
  }

  const handleMakeChange = (text: string) => {
    setMake(text)
    if (text.length > 1) {
      const filteredMakes = vehicleDatabase.makes.filter(make =>
        make.toLowerCase().includes(text.toLowerCase())
      )
      setSuggestions(prev => ({ ...prev, makes: filteredMakes.slice(0, 5) }))
    } else {
      setSuggestions(prev => ({ ...prev, makes: [] }))
    }
  }

  const handleModelChange = (text: string) => {
    setModel(text)
    if (text.length > 1 && make) {
      const makeKey = make as keyof typeof vehicleDatabase.models
      const availableModels = vehicleDatabase.models[makeKey] || []
      const filteredModels = availableModels.filter(model =>
        model.toLowerCase().includes(text.toLowerCase())
      )
      setSuggestions(prev => ({ ...prev, models: filteredModels.slice(0, 5) }))
    } else {
      setSuggestions(prev => ({ ...prev, models: [] }))
    }
  }

  const handleSubmit = async () => {
    if (!make.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Missing Information', 'Please fill in your vehicle\'s make, model, and year.')
      return
    }

    const yearNum = parseInt(year)
    if (yearNum < 1990 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year between 1990 and ' + (new Date().getFullYear() + 1))
      return
    }

    setIsProcessing(true)

    try {
      const vehicleInfo = await mockVehicleLookup(make.trim(), model.trim(), yearNum)
      onVehicleInfoCollected(vehicleInfo)
      onClose()
    } catch (error) {
      Alert.alert('Error', 'Unable to process vehicle information. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuggestionSelect = (suggestion: string, type: 'make' | 'model') => {
    if (type === 'make') {
      setMake(suggestion)
      setSuggestions(prev => ({ ...prev, makes: [] }))
      // Clear model when make changes
      setModel('')
    } else {
      setModel(suggestion)
      setSuggestions(prev => ({ ...prev, models: [] }))
    }
  }

  const currentYear = new Date().getFullYear()

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
          <Text style={styles.headerTitle}>Vehicle Information</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={styles.introduction}>
            <Text style={styles.introTitle}>Tell me about your vehicle</Text>
            <Text style={styles.introText}>
              Just your vehicle's basic information will help me provide more accurate guidance than generic advice.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Make Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Make *</Text>
              <TextInput
                style={styles.textInput}
                value={make}
                onChangeText={handleMakeChange}
                placeholder="e.g., Toyota, Honda, Ford..."
                autoCapitalize="words"
                autoCorrect={false}
              />
              {suggestions.makes.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.makes.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(suggestion, 'make')}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Model Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Model *</Text>
              <TextInput
                style={styles.textInput}
                value={model}
                onChangeText={handleModelChange}
                placeholder="e.g., Camry, Civic, F-150..."
                autoCapitalize="words"
                autoCorrect={false}
              />
              {suggestions.models.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.models.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(suggestion, 'model')}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Year Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Year *</Text>
              <TextInput
                style={styles.textInput}
                value={year}
                onChangeText={setYear}
                placeholder={`e.g., ${currentYear - 5}`}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>This will help me provide:</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.benefitText}>Vehicle-specific diagnostic advice</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.benefitText}>More accurate cost estimates</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.benefitText}>Known issues for your vehicle type</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.benefitText}>Better repair recommendations</Text>
              </View>
            </View>
          </View>

          {/* Upgrade Option */}
          <View style={styles.upgradeOption}>
            <Ionicons name="arrow-up-circle" size={20} color="#7c3aed" />
            <Text style={styles.upgradeText}>
              Want even more accuracy? You can upgrade to VIN scanning later for the most precise guidance.
            </Text>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (make && model && year) ? styles.submitButtonActive : styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!make || !model || !year || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={[
                styles.submitButtonText,
                (make && model && year) ? styles.submitButtonTextActive : styles.submitButtonTextDisabled
              ]}>
                Get Vehicle-Specific Guidance
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    fontSize: 16,
    color: '#374151',
  },
  benefitsContainer: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#16a34a',
    marginLeft: 8,
    flex: 1,
  },
  upgradeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  upgradeText: {
    fontSize: 14,
    color: '#7c3aed',
    marginLeft: 8,
    flex: 1,
  },
  actionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#ea580c',
  },
  submitButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextActive: {
    color: '#ffffff',
  },
  submitButtonTextDisabled: {
    color: '#94a3b8',
  },
})
