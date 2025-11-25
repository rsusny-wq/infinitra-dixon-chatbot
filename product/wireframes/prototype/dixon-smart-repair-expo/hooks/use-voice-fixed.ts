import { useState, useCallback, useRef, useEffect } from 'react'
import * as Speech from 'expo-speech'
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
    isSupported: false, // Will be updated based on direct detection
    isSpeaking: false,
    isProcessing: false,
    error: null,
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
  }, [onResult, onError])

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

  // FIXED: Use direct Web Speech API detection as single source of truth
  useEffect(() => {
    const checkDirectSupport = () => {
      // Direct browser API check - this is what actually works
      const directSupport = Platform.OS === 'web' && typeof window !== 'undefined' 
        ? !!(window.SpeechRecognition || window.webkitSpeechRecognition) 
        : false

      console.log('🎤 [FIXED] Direct support check:', {
        platform: Platform.OS,
        windowAvailable: typeof window !== 'undefined',
        SpeechRecognition: typeof window !== 'undefined' ? !!window.SpeechRecognition : false,
        webkitSpeechRecognition: typeof window !== 'undefined' ? !!window.webkitSpeechRecognition : false,
        directSupport,
        speechRecognitionHookSupport: speechRecognition.isSupported
      })

      // Always use direct detection as source of truth
      setState(prev => {
        if (prev.isSupported !== directSupport) {
          return { ...prev, isSupported: directSupport }
        }
        return prev // FIXED: Only update if value actually changed
      })
    }

    // Check immediately and after a short delay
    checkDirectSupport()
    const timeoutId = setTimeout(checkDirectSupport, 100)
    
    return () => clearTimeout(timeoutId)
  }, []) // FIXED: Remove speechRecognition.isSupported dependency to prevent loops

  // Start voice recognition
  const startListening = useCallback(async () => {
    console.log('🎤 [FIXED] startListening called - state check:', {
      isListening: state.isListening,
      isSupported: state.isSupported,
      speechRecognitionSupported: speechRecognition.isSupported,
      platform: Platform.OS
    })
    
    if (state.isListening) return false

    setState(prev => ({ ...prev, isListening: true, error: null }))

    try {
      // FIXED: Use state.isSupported (direct detection) instead of speechRecognition.isSupported
      if (state.isSupported) {
        console.log('🎤 [FIXED] Starting REAL speech recognition - direct support confirmed')
        speechRecognition.startListening()
        
        // Set a timeout to stop listening after 10 seconds
        timeoutRef.current = setTimeout(() => {
          console.log('🎤 Speech recognition timeout - stopping')
          speechRecognition.stopListening()
          setState(prev => ({ ...prev, isListening: false }))
        }, 10000)
        
        return true
        
      } else {
        console.error('🎤 [FIXED] Speech recognition NOT supported - direct API check failed')
        const errorMessage = 'Speech recognition not supported in this browser'
        setState(prev => ({ 
          ...prev, 
          isListening: false, 
          isProcessing: false,
          error: errorMessage 
        }))
        onErrorRef.current?.(errorMessage)
        return false
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
      return false
    }
  }, [state.isListening, state.isSupported, speechRecognition])

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (Platform.OS === 'web') {
      speechRecognition.stopListening()
    }
    
    setState(prev => ({ 
      ...prev, 
      isListening: false, 
      isProcessing: false 
    }))
  }, [speechRecognition]) // FIXED: Removed state.isSupported dependency

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

  return {
    ...state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
