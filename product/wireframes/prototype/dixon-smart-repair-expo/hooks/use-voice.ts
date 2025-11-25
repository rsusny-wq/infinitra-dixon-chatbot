import { useState, useCallback, useRef, useEffect } from 'react'
import * as Speech from 'expo-speech'
// Note: For prototype, we'll use a mock audio implementation
// In production, replace with proper expo-audio implementation
import { Platform } from 'react-native'
import { useSpeechRecognition } from './use-speech-recognition'

interface UseVoiceProps {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  automotiveMode?: boolean
}

interface VoiceState {
  isListening: boolean
  isSupported: boolean
  isSpeaking: boolean
  isProcessing: boolean
  error: string | null
}

export function useVoice(props: UseVoiceProps = {}) {
  const { onResult, onError, automotiveMode = true } = props
  
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSupported: true, // Will be updated based on actual support
    isSpeaking: false,
    isProcessing: false,
    error: null,
  })

  const recordingRef = useRef<any | null>(null) // Mock recording ref for prototype
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialized = useRef(false)
  const voiceRef = useRef<any>(null)

  // Stable callback refs to prevent infinite loops
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  // Use real speech recognition for web
  const speechRecognition = useSpeechRecognition({
    onResult: useCallback((transcript: string) => {
      console.log('🎤 Real speech result:', transcript)
      setState(prev => ({ ...prev, isProcessing: false, isListening: false }))
      onResultRef.current?.(transcript)
    }, []),
    
    onError: useCallback((error: string) => {
      console.error('🎤 Speech recognition error:', error)
      setState(prev => ({ ...prev, isListening: false, isProcessing: false, error }))
      onErrorRef.current?.(error)
    }, []),
    
    continuous: false,
    interimResults: true
  })

  // Update isSupported based on direct Web Speech API detection
  useEffect(() => {
    const checkDirectSupport = () => {
      // Use direct Web Speech API detection to bypass library issues
      const directSupport = Platform.OS === 'web' && typeof window !== 'undefined' 
        ? !!(window.SpeechRecognition || window.webkitSpeechRecognition) 
        : false;
      
      console.log('🎤 Direct speech recognition support check:', {
        platform: Platform.OS,
        directWebSpeechAPI: directSupport,
        speechRecognitionSupported: speechRecognition.isSupported,
        currentVoiceState: state.isSupported
      })
      
      // Always use direct API detection as the source of truth
      setState(prev => {
        if (prev.isSupported !== directSupport) {
          console.log('🎤 Updating useVoice state based on direct API check:', {
            previousSupported: prev.isSupported,
            newSupported: directSupport,
            directAPICheck: directSupport
          })
          return { ...prev, isSupported: directSupport }
        }
        return prev
      })
    }
    
    // Check immediately and after a delay to ensure window is loaded
    checkDirectSupport()
    const timeoutId = setTimeout(checkDirectSupport, 500)
    
    return () => clearTimeout(timeoutId)
  }, []) // Remove dependencies to avoid re-checking loops

  // Initialize audio permissions (mock for prototype)
  const initializeAudio = useCallback(async () => {
    try {
      // For prototype, we'll simulate audio permission request
      // In production, use expo-audio for proper audio handling
      if (!isInitialized.current) {
        console.log('Audio permissions initialized (mock)')
        isInitialized.current = true
      }
      return true
    } catch (error) {
      console.error('Audio initialization error:', error)
      onErrorRef.current?.('Failed to initialize audio permissions')
      return false
    }
  }, [])

  // Start voice recognition (REAL speech recognition only)
  const startListening = useCallback(async () => {
    console.log('🎤 startListening called - state check:', {
      isListening: state.isListening,
      stateIsSupported: state.isSupported,
      speechRecognitionIsSupported: speechRecognition.isSupported,
      platform: Platform.OS
    })
    
    if (state.isListening) return

    const audioInitialized = await initializeAudio()
    if (!audioInitialized) return

    setState(prev => ({ ...prev, isListening: true, error: null }))

    try {
      // Use state.isSupported (which is based on direct API detection) instead of speechRecognition.isSupported
      if (state.isSupported) {
        console.log('🎤 Starting REAL speech recognition - state.isSupported:', state.isSupported)
        speechRecognition.startListening()
        
        // Set a timeout to stop listening after 10 seconds
        timeoutRef.current = setTimeout(() => {
          console.log('🎤 Speech recognition timeout - stopping')
          speechRecognition.stopListening()
          setState(prev => ({ ...prev, isListening: false }))
        }, 10000)
        
      } else {
        // If speech recognition is not supported, show error
        console.error('🎤 Speech recognition NOT supported - direct API check failed')
        console.error('🎤 Debug values:', {
          'state.isSupported': state.isSupported,
          'speechRecognition.isSupported': speechRecognition.isSupported,
          'typeof speechRecognition': typeof speechRecognition,
          'speechRecognition keys': Object.keys(speechRecognition)
        })
        
        // Double-check the Web Speech API directly
        const directCheck = typeof window !== 'undefined' ? !!(window.SpeechRecognition || window.webkitSpeechRecognition) : false
        console.error('🎤 Direct Web Speech API check:', directCheck)
        
        const errorMessage = 'Speech recognition not supported in this browser'
        setState(prev => ({ 
          ...prev, 
          isListening: false, 
          isProcessing: false,
          error: errorMessage 
        }))
        onErrorRef.current?.(errorMessage)
      }
      
    } catch (error) {
      console.error('Voice recognition error:', error)
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        isProcessing: false,
        error: 'Voice recognition failed' 
      }))
      onErrorRef.current?.('Voice recognition failed')
    }
  }, [state.isListening, state.isSupported, initializeAudio, speechRecognition])

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (Platform.OS === 'web' && speechRecognition.isSupported) {
      speechRecognition.stopListening()
    }
    
    setState(prev => ({ 
      ...prev, 
      isListening: false, 
      isProcessing: false 
    }))
  }, [speechRecognition])

  // Text-to-speech functionality
  const speak = useCallback(async (text: string, options?: any) => {
    try {
      setState(prev => ({ ...prev, isSpeaking: true, error: null }))
      
      // Use Expo Speech for text-to-speech
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        ...options,
        onDone: () => {
          setState(prev => ({ ...prev, isSpeaking: false }))
        },
        onError: (error: any) => {
          console.error('Speech synthesis error:', error)
          setState(prev => ({ ...prev, isSpeaking: false, error: 'Speech synthesis failed' }))
          onErrorRef.current?.('Speech synthesis failed')
        }
      })
    } catch (error) {
      console.error('Speech synthesis error:', error)
      setState(prev => ({ ...prev, isSpeaking: false, error: 'Speech synthesis failed' }))
      onErrorRef.current?.('Speech synthesis failed')
    }
  }, [])

  // Stop text-to-speech
  const stopSpeaking = useCallback(async () => {
    try {
      await Speech.stop()
      setState(prev => ({ ...prev, isSpeaking: false }))
    } catch (error) {
      console.error('Failed to stop speech:', error)
    }
  }, [])

  // Get available voices (mock for prototype)
  const getAvailableVoices = useCallback(async () => {
    try {
      // In production, use Speech.getAvailableVoicesAsync()
      return [
        { identifier: 'en-US-default', name: 'English (US)', language: 'en-US' },
        { identifier: 'en-GB-default', name: 'English (UK)', language: 'en-GB' },
      ]
    } catch (error) {
      console.error('Failed to get voices:', error)
      return []
    }
  }, [])

  return {
    ...state,
    isSupported: state.isSupported, // Use our direct detection instead of speechRecognition.isSupported
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    getAvailableVoices,
  }
}
