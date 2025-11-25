import { useState, useCallback, useRef, useEffect } from 'react'
import { Platform } from 'react-native'

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  continuous?: boolean
  interimResults?: boolean
}

interface SpeechRecognitionState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  error: string | null
}

// Web Speech API types
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
  start(): void
  stop(): void
  abort(): void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
}

// Remove the conflicting global declaration since it's already declared in use-web-speech-api.ts

export function useSpeechRecognition({
  onResult,
  onError,
  continuous = false,
  interimResults = true
}: UseSpeechRecognitionProps = {}) {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    error: null
  })

  const recognitionRef = useRef<WebSpeechRecognition | null>(null)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  // Check if speech recognition is supported
  useEffect(() => {
    console.log('🎤 Checking speech recognition support...')
    console.log('🎤 Platform:', Platform.OS)
    console.log('🎤 Window object available:', typeof window !== 'undefined')
    
    const checkSupport = () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        console.log('🎤 Checking window.SpeechRecognition:', !!window.SpeechRecognition)
        console.log('🎤 Checking window.webkitSpeechRecognition:', !!window.webkitSpeechRecognition)
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        console.log('🎤 SpeechRecognition constructor available:', !!SpeechRecognition)
        
        if (SpeechRecognition) {
          console.log('🎤 Speech recognition IS supported - initializing...')
          
          try {
            // Test if we can actually create an instance
            const testRecognition = new SpeechRecognition()
            console.log('🎤 Successfully created test recognition instance')
            
            // Initialize speech recognition
            const recognition = new SpeechRecognition()
            recognition.continuous = continuous
            recognition.interimResults = interimResults
            recognition.lang = 'en-US'

            recognition.onstart = () => {
              console.log('🎤 Speech recognition started')
              setState(prev => ({ ...prev, isListening: true, error: null }))
            }

            recognition.onend = () => {
              console.log('🎤 Speech recognition ended')
              setState(prev => ({ ...prev, isListening: false }))
            }

            recognition.onresult = (event: SpeechRecognitionEvent) => {
              let finalTranscript = ''
              let interimTranscript = ''

              for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result && result[0]) {
                  const transcript = result[0].transcript
                  if (result.isFinal) {
                    finalTranscript += transcript
                  } else {
                    interimTranscript += transcript
                  }
                }
              }

              const fullTranscript = finalTranscript || interimTranscript
              console.log('🎤 Speech result:', { finalTranscript, interimTranscript, fullTranscript })
              
              setState(prev => ({ ...prev, transcript: fullTranscript }))
              
              if (finalTranscript && onResultRef.current) {
                console.log('🎤 Calling onResult with final transcript:', finalTranscript.trim())
                onResultRef.current(finalTranscript.trim())
              }
            }

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
              console.error('🎤 Speech recognition error:', event.error, event.message)
              const errorMessage = `Speech recognition error: ${event.error}`
              setState(prev => ({ ...prev, error: errorMessage, isListening: false }))
              onErrorRef.current?.(errorMessage)
            }

            recognitionRef.current = recognition
            
            // Set supported to true AFTER successful initialization
            setState(prev => ({ ...prev, isSupported: true }))
            console.log('🎤 Speech recognition initialized successfully - isSupported set to true')
            
          } catch (error) {
            console.error('🎤 Failed to initialize speech recognition:', error)
            setState(prev => ({ ...prev, isSupported: false }))
          }
        } else {
          console.warn('🎤 Speech recognition NOT supported in this browser')
          console.log('🎤 User agent:', navigator.userAgent)
          setState(prev => ({ ...prev, isSupported: false }))
        }
      } else {
        // For mobile, we'd need to use a different approach
        console.warn('🎤 Speech recognition not implemented for mobile yet')
        setState(prev => ({ ...prev, isSupported: false }))
      }
    }
    
    // Check immediately
    checkSupport()
    
  }, [continuous, interimResults]) // Only depend on static configuration values

  const startListening = useCallback(() => {
    console.log('🎤 startListening called:', { 
      isSupported: state.isSupported, 
      isListening: state.isListening,
      hasRecognition: !!recognitionRef.current 
    })
    
    if (!state.isSupported) {
      console.warn('🎤 Cannot start - speech recognition not supported')
      onError?.('Speech recognition not supported')
      return
    }
    
    if (state.isListening) {
      console.warn('🎤 Already listening, ignoring start request')
      return
    }

    if (!recognitionRef.current) {
      console.error('🎤 No recognition instance available')
      onError?.('Speech recognition not initialized')
      return
    }

    try {
      console.log('🎤 Starting speech recognition...')
      recognitionRef.current.start()
    } catch (error) {
      console.error('🎤 Failed to start speech recognition:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start speech recognition'
      setState(prev => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
    }
  }, [state.isSupported, state.isListening, onError])

  const stopListening = useCallback(() => {
    if (!state.isListening) return

    try {
      recognitionRef.current?.stop()
    } catch (error) {
      console.error('🎤 Failed to stop speech recognition:', error)
    }
  }, [state.isListening])

  const abortListening = useCallback(() => {
    try {
      recognitionRef.current?.abort()
      setState(prev => ({ ...prev, isListening: false }))
    } catch (error) {
      console.error('🎤 Failed to abort speech recognition:', error)
    }
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    abortListening
  }
}
