import { useState, useCallback, useRef, useEffect } from 'react'
import * as Speech from 'expo-speech'
import { useWebSpeechAPI } from './use-web-speech-api'

interface UseVoiceOptions {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  automotiveMode?: boolean
  continuous?: boolean
  timeout?: number
}

interface VoiceState {
  isListening: boolean
  isSupported: boolean
  isSpeaking: boolean
  isProcessing: boolean
  error: string | null
  transcript: string
}

/**
 * Production-ready voice hook for Dixon Smart Repair
 * Combines Web Speech API for recognition with Expo Speech for TTS
 */
export function useVoice(options: UseVoiceOptions = {}) {
  const { 
    onResult, 
    onError, 
    automotiveMode = true, 
    continuous = false,
    timeout = 10000 
  } = options
  
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSupported: false,
    isSpeaking: false,
    isProcessing: false,
    error: null,
    transcript: ''
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  // Update callback refs
  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
  }, [onResult, onError])

  // Initialize Web Speech API with proper callback handling
  const speechAPI = useWebSpeechAPI({
    continuous,
    interimResults: true,
    language: 'en-US',
    onResult: useCallback((transcript: string, isFinal: boolean) => {
      console.log('🎤 [Voice] Speech result:', { transcript, isFinal })
      
      setState(prev => ({ 
        ...prev, 
        transcript,
        isProcessing: !isFinal 
      }))
      
      if (isFinal) {
        // Clear timeout when we get a final result
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        
        // Call result callback
        onResultRef.current?.(transcript)
      }
    }, [continuous]),
    
    onError: useCallback((error: string) => {
      console.error('🎤 [Voice] Speech error:', error)
      setState(prev => ({ 
        ...prev, 
        error, 
        isListening: false, 
        isProcessing: false 
      }))
      onErrorRef.current?.(error)
    }, []),
    
    onStart: useCallback(() => {
      console.log('🎤 [Voice] Speech started')
      setState(prev => ({ ...prev, isListening: true, error: null }))
    }, []),
    
    onEnd: useCallback(() => {
      console.log('🎤 [Voice] Speech ended')
      setState(prev => ({ ...prev, isListening: false, isProcessing: false }))
    }, [])
  })

  // Update support status from speech API
  useEffect(() => {
    setState(prev => ({ 
      ...prev, 
      isSupported: speechAPI.isSupported,
      error: speechAPI.error || prev.error
    }))
  }, [speechAPI.isSupported, speechAPI.error])

  // Start voice recognition
  const startListening = useCallback(async () => {
    console.log('🎤 [Voice] Start listening requested')
    
    if (!speechAPI.isSupported) {
      const error = 'Speech recognition not supported in this browser'
      console.error('🎤 [Voice]', error)
      setState(prev => ({ ...prev, error }))
      onErrorRef.current?.(error)
      return false
    }

    if (speechAPI.isListening) {
      console.warn('🎤 [Voice] Already listening')
      return false
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Reset state
    setState(prev => ({ 
      ...prev, 
      error: null, 
      transcript: '',
      isProcessing: false 
    }))
    speechAPI.resetTranscript()

    // Start recognition
    const started = speechAPI.startListening()
    
    if (started && timeout > 0 && !continuous) {
      // Set timeout to stop listening (only in non-continuous mode)
      timeoutRef.current = setTimeout(() => {
        console.log('🎤 [Voice] Timeout reached, stopping')
        speechAPI.stopListening()
        timeoutRef.current = null
      }, timeout)
    }

    return started
  }, [speechAPI, timeout, continuous])

  // Stop voice recognition
  const stopListening = useCallback(() => {
    console.log('🎤 [Voice] Stop listening requested')
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    speechAPI.stopListening()
  }, [speechAPI])

  // Text-to-speech with automotive optimization
  const speak = useCallback(async (text: string, options: any = {}) => {
    try {
      setState(prev => ({ ...prev, isSpeaking: true, error: null }))
      
      const speechOptions = {
        language: 'en-US',
        pitch: automotiveMode ? 1.1 : 1.0,  // Slightly higher pitch for car environments
        rate: automotiveMode ? 0.8 : 0.9,   // Slower rate for car environments
        volume: automotiveMode ? 1.0 : 0.8, // Louder for car environments
        ...options,
        onDone: () => {
          setState(prev => ({ ...prev, isSpeaking: false }))
          options.onDone?.()
        },
        onError: (error: any) => {
          console.error('🎤 [Voice] TTS error:', error)
          const errorMessage = 'Text-to-speech failed'
          setState(prev => ({ ...prev, isSpeaking: false, error: errorMessage }))
          onErrorRef.current?.(errorMessage)
          options.onError?.(error)
        }
      }
      
      await Speech.speak(text, speechOptions)
    } catch (error) {
      console.error('🎤 [Voice] TTS error:', error)
      const errorMessage = 'Text-to-speech failed'
      setState(prev => ({ ...prev, isSpeaking: false, error: errorMessage }))
      onErrorRef.current?.(errorMessage)
    }
  }, [automotiveMode])

  // Stop text-to-speech
  const stopSpeaking = useCallback(async () => {
    try {
      await Speech.stop()
      setState(prev => ({ ...prev, isSpeaking: false }))
    } catch (error) {
      console.error('🎤 [Voice] Failed to stop TTS:', error)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      speechAPI.abortListening()
      Speech.stop().catch(() => {}) // Ignore errors on cleanup
    }
  }, [speechAPI])

  return {
    // State
    ...state,
    isSupported: speechAPI.isSupported,
    isInitializing: speechAPI.isInitializing,
    
    // Actions
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    
    // Additional info
    confidence: speechAPI.confidence,
    hasTranscript: speechAPI.hasTranscript,
    
    // Debug info
    debugInfo: {
      speechAPISupported: speechAPI.isSupported,
      speechAPIError: speechAPI.error,
      speechAPIListening: speechAPI.isListening,
      platform: 'web'
    }
  }
}
