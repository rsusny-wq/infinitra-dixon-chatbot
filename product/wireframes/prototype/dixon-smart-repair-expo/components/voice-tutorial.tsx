import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useVoice } from '../hooks/use-voice'
import { shadows } from '../constants/styles'

interface VoiceTutorialProps {
  visible: boolean
  onClose: () => void
  onComplete: () => void
}

interface TutorialStep {
  id: string
  title: string
  description: string
  example: string
  voiceExample?: string
  icon: string
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Voice Diagnostics',
    description: 'Dixon Smart Repair uses advanced voice recognition optimized for automotive symptoms. Speak naturally about your vehicle issues.',
    example: 'Just like talking to a mechanic',
    icon: 'record-voice-over'
  },
  {
    id: 'basic-voice',
    title: 'Basic Voice Input',
    description: 'Tap the microphone button and describe your vehicle problem. Our AI understands automotive terminology.',
    example: '"My car won\'t start" or "The brakes are squeaking"',
    voiceExample: 'My car won\'t start',
    icon: 'mic'
  },
  {
    id: 'hands-free',
    title: 'Hands-Free Mode',
    description: 'Enable hands-free mode for continuous voice interaction. Perfect for when you\'re working on your vehicle.',
    example: 'Say "Hey Dixon" to start a conversation',
    voiceExample: 'Hey Dixon, my engine is making a rattling noise',
    icon: 'voice-over-off'
  },
  {
    id: 'automotive-examples',
    title: 'Automotive Voice Examples',
    description: 'Here are common ways to describe vehicle problems using voice:',
    example: 'Speak naturally - our AI understands context',
    icon: 'directions-car'
  },
  {
    id: 'tips',
    title: 'Voice Recognition Tips',
    description: 'For best results with automotive voice recognition:',
    example: 'Optimized for car environments',
    icon: 'tips-and-updates'
  }
]

const automotiveExamples = [
  { category: 'Engine Issues', examples: [
    'My engine won\'t start',
    'The engine is making a knocking sound',
    'Engine overheating warning light is on',
    'Car stalls when I stop at red lights'
  ]},
  { category: 'Brake Problems', examples: [
    'Brakes are squeaking when I stop',
    'Brake pedal feels spongy',
    'Car pulls to one side when braking',
    'Grinding noise when I brake'
  ]},
  { category: 'Transmission', examples: [
    'Car won\'t shift into gear',
    'Transmission is slipping',
    'Rough shifting between gears',
    'Delayed engagement when shifting'
  ]},
  { category: 'Electrical', examples: [
    'Battery keeps dying',
    'Headlights are dim',
    'Check engine light is on',
    'Radio and lights flickering'
  ]}
]

const voiceTips = [
  'Speak clearly and at normal pace',
  'Use specific automotive terms when possible',
  'Describe sounds, feelings, and visual symptoms',
  'Mention when the problem occurs (startup, driving, braking)',
  'Include your vehicle make, model, and year if known'
]

export function VoiceTutorial({ visible, onClose, onComplete }: VoiceTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const fadeAnim = React.useRef(new Animated.Value(0)).current

  const { speak, isSpeaking } = useVoice({ automotiveMode: true })

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false, // Disabled for web compatibility
      }).start()
    }
  }, [visible, fadeAnim])

  const handlePlayExample = async (text: string) => {
    if (isSpeaking) return
    
    setIsPlaying(true)
    try {
      await speak(text)
    } catch (error) {
      console.error('Failed to play voice example:', error)
    } finally {
      setIsPlaying(false)
    }
  }

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
    onClose()
  }

  const renderStepContent = () => {
    const step = tutorialSteps[currentStep]

    switch (step.id) {
      case 'automotive-examples':
        return (
          <ScrollView style={styles.examplesContainer} showsVerticalScrollIndicator={false}>
            {automotiveExamples.map((category, index) => (
              <View key={index} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{category.category}</Text>
                {category.examples.map((example, exampleIndex) => (
                  <TouchableOpacity
                    key={exampleIndex}
                    style={styles.exampleItem}
                    onPress={() => handlePlayExample(example)}
                    disabled={isPlaying}
                  >
                    <MaterialIcons name="play-arrow" size={16} color="#3b82f6" />
                    <Text style={styles.exampleText}>{example}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        )

      case 'tips':
        return (
          <View style={styles.tipsContainer}>
            {voiceTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <MaterialIcons name="check-circle" size={16} color="#16a34a" />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )

      default:
        return (
          <View style={styles.defaultContent}>
            <Text style={styles.stepDescription}>{step.description}</Text>
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={styles.exampleText}>{step.example}</Text>
            </View>
            {step.voiceExample && (
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => handlePlayExample(step.voiceExample!)}
                disabled={isPlaying}
              >
                <MaterialIcons 
                  name={isPlaying ? "volume-up" : "play-arrow"} 
                  size={20} 
                  color="#ffffff" 
                />
                <Text style={styles.playButtonText}>
                  {isPlaying ? 'Playing...' : 'Play Example'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name={tutorialSteps[currentStep].icon as any} size={24} color="#1e40af" />
              <Text style={styles.title}>{tutorialSteps[currentStep].title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {tutorialSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted
                ]}
              />
            ))}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {renderStepContent()}
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, styles.secondaryButton]}
              onPress={handleSkip}
            >
              <Text style={styles.secondaryButtonText}>Skip Tutorial</Text>
            </TouchableOpacity>

            <View style={styles.navButtonGroup}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.secondaryButton]}
                  onPress={handlePrevious}
                >
                  <Text style={styles.secondaryButtonText}>Previous</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.navButton, styles.primaryButton]}
                onPress={handleNext}
              >
                <Text style={styles.primaryButtonText}>
                  {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    ...shadows.modal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#1e40af',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotCompleted: {
    backgroundColor: '#16a34a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  defaultContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 20,
  },
  exampleContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
    marginBottom: 20,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  examplesContainer: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    marginBottom: 8,
  },
  tipsContainer: {
    flex: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1e40af',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
})
