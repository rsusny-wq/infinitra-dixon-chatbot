import { useState, useEffect, useCallback, useRef } from 'react'
import { Platform } from 'react-native'

// Web Speech API types (comprehensive)
interface SpeechRecognitionResult {
  [index: number]: {
    transcript: string
    confidence: number
  }
  isFinal: boolean
  length: number
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface WebSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string
  grammars: any
  start(): void
  stop(): void
  abort(): void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onaudiostart: ((event: Event) => void) | null
  onaudioend: ((event: Event) => void) | null
  onsoundstart: ((event: Event) => void) | null
  onsoundend: ((event: Event) => void) | null
  onspeechstart: ((event: Event) => void) | null
  onspeechend: ((event: Event) => void) | null
  onnomatch: ((event: Event) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => WebSpeechRecognition
    webkitSpeechRecognition: new () => WebSpeechRecognition
  }
}

interface UseWebSpeechAPIOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  maxAlternatives?: number
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

interface WebSpeechAPIState {
  isSupported: boolean
  isListening: boolean
  isInitializing: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  confidence: number
}

/**
 * Production-ready Web Speech API hook following React best practices
 * Handles browser compatibility, proper initialization, and state management
 */
export function useWebSpeechAPI(options: UseWebSpeechAPIOptions = {}) {
  const {
    continuous = false,
    interimResults = true,
    language = 'en-US',
    maxAlternatives = 1,
    onResult,
    onError,
    onStart,
    onEnd
  } = options

  // State management
  const [state, setState] = useState<WebSpeechAPIState>({
    isSupported: false,
    isListening: false,
    isInitializing: true,
    transcript: '',
    interimTranscript: '',
    error: null,
    confidence: 0
  })

  // Refs for stable references
  const recognitionRef = useRef<WebSpeechRecognition | null>(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  const onStartRef = useRef(onStart)
  const onEndRef = useRef(onEnd)
  const isInitializedRef = useRef(false)

  // Update callback refs
  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
    onStartRef.current = onStart
    onEndRef.current = onEnd
  }, [onResult, onError, onStart, onEnd])

  // Browser support detection and initialization
  useEffect(() => {
    let mounted = true

    const initializeSpeechRecognition = async () => {
      console.log('🎤 [WebSpeechAPI] Starting initialization...')
      
      // Only initialize on web platform
      if (Platform.OS !== 'web') {
        console.log('🎤 [WebSpeechAPI] Not web platform, skipping')
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            isSupported: false, 
            isInitializing: false,
            error: 'Web Speech API only available on web platform'
          }))
        }
        return
      }

      // Check if window is available
      if (typeof window === 'undefined') {
        console.log('🎤 [WebSpeechAPI] Window not available')
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            isSupported: false, 
            isInitializing: false,
            error: 'Window object not available'
          }))
        }
        return
      }

      // Wait for document to be ready
      if (document.readyState !== 'complete') {
        console.log('🎤 [WebSpeechAPI] Waiting for document ready...')
        await new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve(void 0)
          } else {
            const handler = () => {
              if (document.readyState === 'complete') {
                document.removeEventListener('readystatechange', handler)
                resolve(void 0)
              }
            }
            document.addEventListener('readystatechange', handler)
          }
        })
      }

      // Check for Speech Recognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        console.log('🎤 [WebSpeechAPI] Speech Recognition API not available')
        console.log('🎤 [WebSpeechAPI] User Agent:', navigator.userAgent)
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            isSupported: false, 
            isInitializing: false,
            error: 'Speech Recognition API not supported in this browser'
          }))
        }
        return
      }

      try {
        // Test if we can create an instance
        const testRecognition = new SpeechRecognition()
        console.log('🎤 [WebSpeechAPI] Test instance created successfully')
        
        // Create the actual recognition instance
        const recognition = new SpeechRecognition()
        
        // Configure recognition
        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.lang = language
        recognition.maxAlternatives = maxAlternatives

        // Set up event handlers
        recognition.onstart = () => {
          console.log('🎤 [WebSpeechAPI] Recognition started')
          if (mounted) {
            setState(prev => ({ ...prev, isListening: true, error: null }))
            onStartRef.current?.()
          }
        }

        recognition.onend = () => {
          console.log('🎤 [WebSpeechAPI] Recognition ended')
          if (mounted) {
            setState(prev => ({ ...prev, isListening: false }))
            onEndRef.current?.()
          }
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interimTranscript = ''
          let maxConfidence = 0

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result && result[0]) {
              const transcript = result[0].transcript
              const confidence = result[0].confidence || 0
              
              if (result.isFinal) {
                finalTranscript += transcript
                maxConfidence = Math.max(maxConfidence, confidence)
              } else {
                interimTranscript += transcript
              }
            }
          }

          console.log('🎤 [WebSpeechAPI] Result:', { 
            final: finalTranscript, 
            interim: interimTranscript,
            confidence: maxConfidence
          })

          if (mounted) {
            setState(prev => ({
              ...prev,
              transcript: finalTranscript || prev.transcript,
              interimTranscript,
              confidence: maxConfidence || prev.confidence
            }))

            // Call result callback
            if (finalTranscript) {
              onResultRef.current?.(finalTranscript.trim(), true)
            } else if (interimTranscript) {
              onResultRef.current?.(interimTranscript.trim(), false)
            }
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('🎤 [WebSpeechAPI] Error:', event.error, event.message)
          const errorMessage = `Speech recognition error: ${event.error}`
          
          if (mounted) {
            setState(prev => ({ 
              ...prev, 
              error: errorMessage, 
              isListening: false 
            }))
            onErrorRef.current?.(errorMessage)
          }
        }

        // Additional event handlers for debugging
        recognition.onaudiostart = () => console.log('🎤 [WebSpeechAPI] Audio start')
        recognition.onaudioend = () => console.log('🎤 [WebSpeechAPI] Audio end')
        recognition.onsoundstart = () => console.log('🎤 [WebSpeechAPI] Sound start')
        recognition.onsoundend = () => console.log('🎤 [WebSpeechAPI] Sound end')
        recognition.onspeechstart = () => console.log('🎤 [WebSpeechAPI] Speech start')
        recognition.onspeechend = () => console.log('🎤 [WebSpeechAPI] Speech end')

        // Store recognition instance
        recognitionRef.current = recognition
        isInitializedRef.current = true

        console.log('🎤 [WebSpeechAPI] Initialization complete - API is supported')
        
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            isSupported: true, 
            isInitializing: false,
            error: null
          }))
        }

      } catch (error) {
        console.error('🎤 [WebSpeechAPI] Initialization failed:', error)
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            isSupported: false, 
            isInitializing: false,
            error: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`
          }))
        }
      }
    }

    // Start initialization
    initializeSpeechRecognition()

    // Cleanup
    return () => {
      mounted = false
      if (recognitionRef.current && isInitializedRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (error) {
          console.warn('🎤 [WebSpeechAPI] Cleanup error:', error)
        }
      }
    }
  }, [continuous, interimResults, language, maxAlternatives])

  // Start listening
  const startListening = useCallback(() => {
    console.log('🎤 [WebSpeechAPI] Start listening requested')
    
    if (!state.isSupported) {
      const error = 'Speech recognition not supported'
      console.error('🎤 [WebSpeechAPI]', error)
      onErrorRef.current?.(error)
      return false
    }

    if (state.isListening) {
      console.warn('🎤 [WebSpeechAPI] Already listening')
      return false
    }

    if (!recognitionRef.current) {
      const error = 'Recognition not initialized'
      console.error('🎤 [WebSpeechAPI]', error)
      onErrorRef.current?.(error)
      return false
    }

    try {
      console.log('🎤 [WebSpeechAPI] Starting recognition...')
      recognitionRef.current.start()
      return true
    } catch (error) {
      const errorMessage = `Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('🎤 [WebSpeechAPI]', errorMessage)
      setState(prev => ({ ...prev, error: errorMessage }))
      onErrorRef.current?.(errorMessage)
      return false
    }
  }, [state.isSupported, state.isListening])

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('🎤 [WebSpeechAPI] Stop listening requested')
    
    if (!state.isListening) {
      console.warn('🎤 [WebSpeechAPI] Not currently listening')
      return
    }

    if (!recognitionRef.current) {
      console.warn('🎤 [WebSpeechAPI] No recognition instance to stop')
      return
    }

    try {
      recognitionRef.current.stop()
    } catch (error) {
      console.error('🎤 [WebSpeechAPI] Stop error:', error)
    }
  }, [state.isListening])

  // Abort listening
  const abortListening = useCallback(() => {
    console.log('🎤 [WebSpeechAPI] Abort listening requested')
    
    if (!recognitionRef.current) {
      return
    }

    try {
      recognitionRef.current.abort()
      setState(prev => ({ ...prev, isListening: false }))
    } catch (error) {
      console.error('🎤 [WebSpeechAPI] Abort error:', error)
    }
  }, [])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      interimTranscript: '', 
      confidence: 0 
    }))
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
    
    // Computed values
    hasTranscript: state.transcript.length > 0 || state.interimTranscript.length > 0,
    fullTranscript: state.transcript + state.interimTranscript
  }
}
