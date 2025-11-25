import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface DiagnosticFlowProps {
  symptoms: string[]
  vehicleInfo?: VehicleInfo
  onDiagnosisComplete: (diagnosis: DiagnosisResult) => void
}

interface VehicleInfo {
  vin: string
  year: number
  make: string
  model: string
  engine?: string
  transmission?: string
}

interface DiagnosisResult {
  primaryDiagnosis: Diagnosis
  alternativeDiagnoses: Diagnosis[]
  recommendedActions: string[]
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost: {
    min: number
    max: number
    description: string
  }
}

interface Diagnosis {
  issue: string
  confidence: number
  description: string
  commonCauses: string[]
  symptoms: string[]
}

interface ClarificationQuestion {
  id: string
  question: string
  type: 'yes_no' | 'multiple_choice' | 'scale'
  options?: string[]
  importance: 'high' | 'medium' | 'low'
}

export function DiagnosticFlow({ symptoms, vehicleInfo, onDiagnosisComplete }: DiagnosticFlowProps) {
  const [currentStage, setCurrentStage] = useState<'analyzing' | 'clarifying' | 'diagnosing' | 'complete'>('analyzing')
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    startDiagnosticFlow()
  }, [symptoms, vehicleInfo])

  const startDiagnosticFlow = async () => {
    setIsProcessing(true)
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate clarification questions based on symptoms
    const questions = generateClarificationQuestions(symptoms, vehicleInfo)
    setClarificationQuestions(questions)
    
    if (questions.length > 0) {
      setCurrentStage('clarifying')
    } else {
      setCurrentStage('diagnosing')
      await performDiagnosis()
    }
    
    setIsProcessing(false)
  }

  const generateClarificationQuestions = (symptoms: string[], vehicle?: VehicleInfo): ClarificationQuestion[] => {
    const questions: ClarificationQuestion[] = []
    const symptomsText = symptoms.join(' ').toLowerCase()

    // Brake-related questions
    if (symptomsText.includes('brake') || symptomsText.includes('stop')) {
      questions.push({
        id: 'brake_noise_timing',
        question: 'When do you hear the brake noise?',
        type: 'multiple_choice',
        options: ['When first applying brakes', 'Throughout braking', 'Only when stopping completely', 'Randomly'],
        importance: 'high'
      })
      
      questions.push({
        id: 'brake_pedal_feel',
        question: 'How does the brake pedal feel?',
        type: 'multiple_choice',
        options: ['Normal', 'Soft/Spongy', 'Hard to press', 'Vibrates'],
        importance: 'high'
      })
    }

    // Engine-related questions
    if (symptomsText.includes('engine') || symptomsText.includes('motor')) {
      questions.push({
        id: 'engine_noise_timing',
        question: 'When do you notice the engine issue?',
        type: 'multiple_choice',
        options: ['At startup', 'While idling', 'During acceleration', 'At highway speeds'],
        importance: 'high'
      })
      
      questions.push({
        id: 'check_engine_light',
        question: 'Is your check engine light on?',
        type: 'yes_no',
        importance: 'high'
      })
    }

    // General noise questions
    if (symptomsText.includes('noise') || symptomsText.includes('sound')) {
      questions.push({
        id: 'noise_description',
        question: 'How would you describe the noise?',
        type: 'multiple_choice',
        options: ['Squealing/Screeching', 'Grinding', 'Knocking/Tapping', 'Rattling', 'Humming/Whining'],
        importance: 'high'
      })
    }

    // Limit to 5 questions maximum
    return questions.slice(0, 5)
  }

  const handleAnswerQuestion = (answer: string) => {
    const currentQuestion = clarificationQuestions[currentQuestionIndex]
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))

    if (currentQuestionIndex < clarificationQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setCurrentStage('diagnosing')
      performDiagnosis()
    }
  }

  const performDiagnosis = async () => {
    setIsProcessing(true)
    
    // Simulate diagnosis processing
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const diagnosis = generateDiagnosis(symptoms, answers, vehicleInfo)
    onDiagnosisComplete(diagnosis)
    
    setCurrentStage('complete')
    setIsProcessing(false)
  }

  const generateDiagnosis = (symptoms: string[], answers: Record<string, string>, vehicle?: VehicleInfo): DiagnosisResult => {
    const symptomsText = symptoms.join(' ').toLowerCase()
    
    // Brake diagnosis
    if (symptomsText.includes('brake') || symptomsText.includes('squealing')) {
      return {
        primaryDiagnosis: {
          issue: 'Brake Pad Wear',
          confidence: 85,
          description: 'Your brake pads are likely worn and need replacement. The squealing sound is from the wear indicator.',
          commonCauses: ['Normal wear and tear', 'Aggressive braking', 'Poor quality brake pads'],
          symptoms: ['Squealing noise when braking', 'Reduced braking performance', 'Brake pedal vibration']
        },
        alternativeDiagnoses: [
          {
            issue: 'Brake Rotor Issues',
            confidence: 60,
            description: 'Brake rotors may be warped or damaged, causing noise and vibration.',
            commonCauses: ['Overheating', 'Worn brake pads', 'Poor installation'],
            symptoms: ['Vibration when braking', 'Grinding noise', 'Uneven braking']
          }
        ],
        recommendedActions: [
          'Schedule brake inspection immediately',
          'Avoid aggressive braking until repaired',
          'Check brake fluid level',
          'Get quotes from certified mechanics'
        ],
        urgencyLevel: 'high',
        estimatedCost: {
          min: 150,
          max: 400,
          description: 'Brake pad replacement for front axle'
        }
      }
    }

    // Engine diagnosis
    if (symptomsText.includes('engine') || symptomsText.includes('noise')) {
      return {
        primaryDiagnosis: {
          issue: 'Engine Belt Issues',
          confidence: 75,
          description: 'A worn or loose belt is likely causing the engine noise. This could be the serpentine belt or timing belt.',
          commonCauses: ['Belt wear', 'Improper tension', 'Pulley misalignment'],
          symptoms: ['Squealing from engine bay', 'Loss of power steering', 'Battery not charging']
        },
        alternativeDiagnoses: [
          {
            issue: 'Engine Mount Problems',
            confidence: 45,
            description: 'Worn engine mounts can cause vibration and noise.',
            commonCauses: ['Age and wear', 'Excessive vibration', 'Oil contamination'],
            symptoms: ['Vibration at idle', 'Clunking noises', 'Excessive engine movement']
          }
        ],
        recommendedActions: [
          'Visual inspection of belts',
          'Check belt tension',
          'Inspect pulleys and tensioners',
          'Schedule professional diagnosis'
        ],
        urgencyLevel: 'medium',
        estimatedCost: {
          min: 80,
          max: 250,
          description: 'Belt replacement and labor'
        }
      }
    }

    // Default diagnosis
    return {
      primaryDiagnosis: {
        issue: 'General Maintenance Required',
        confidence: 60,
        description: 'Based on your symptoms, your vehicle may need routine maintenance or inspection.',
        commonCauses: ['Normal wear', 'Lack of maintenance', 'Age-related issues'],
        symptoms: ['Various symptoms reported']
      },
      alternativeDiagnoses: [],
      recommendedActions: [
        'Schedule comprehensive vehicle inspection',
        'Review maintenance history',
        'Check fluid levels',
        'Consult with certified mechanic'
      ],
      urgencyLevel: 'low',
      estimatedCost: {
        min: 100,
        max: 300,
        description: 'Diagnostic fee and basic maintenance'
      }
    }
  }

  if (currentStage === 'analyzing' && isProcessing) {
    return (
      <View style={styles.card}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.processingText}>Analyzing your symptoms...</Text>
          <Text style={styles.processingSubtext}>
            Considering {vehicleInfo ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : 'vehicle'} specifications
          </Text>
        </View>
      </View>
    )
  }

  if (currentStage === 'clarifying' && !isProcessing) {
    const currentQuestion = clarificationQuestions[currentQuestionIndex]
    
    return (
      <View style={styles.card}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionTitle}>Diagnostic Questions</Text>
          <Text style={styles.questionProgress}>
            {currentQuestionIndex + 1} of {clarificationQuestions.length}
          </Text>
        </View>
        
        <Text style={styles.question}>{currentQuestion.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQuestion.type === 'yes_no' ? (
            <>
              <TouchableOpacity 
                style={styles.option} 
                onPress={() => handleAnswerQuestion('yes')}
              >
                <Text style={styles.optionText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.option} 
                onPress={() => handleAnswerQuestion('no')}
              >
                <Text style={styles.optionText}>No</Text>
              </TouchableOpacity>
            </>
          ) : (
            currentQuestion.options?.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.option} 
                onPress={() => handleAnswerQuestion(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    )
  }

  if (currentStage === 'diagnosing' && isProcessing) {
    return (
      <View style={styles.card}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.processingText}>Generating diagnosis...</Text>
          <Text style={styles.processingSubtext}>
            Analyzing symptoms and vehicle data
          </Text>
        </View>
      </View>
    )
  }

  return null
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
  processingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  processingText: {
    fontSize: 16,
    color: '#1e40af',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
  },
  questionProgress: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  question: {
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionText: {
    fontSize: 16,
    color: '#0f172a',
    textAlign: 'center',
  },
})
