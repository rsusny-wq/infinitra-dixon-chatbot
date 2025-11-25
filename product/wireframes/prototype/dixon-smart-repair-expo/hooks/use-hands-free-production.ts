import { useState, useCallback, useRef, useEffect } from 'react'
import { useVoice } from './use-voice-production'

interface HandsFreeState {
  isActive: boolean
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  lastActivity: Date | null
  error: string | null
  sessionCount: number
}

interface UseHandsFreeOptions {
  enabled: boolean
  onVoiceResult?: (transcript: string) => void
  onError?: (error: string) => void
  onToggle?: (enabled: boolean) => void
  continuous?: boolean
  autoRestart?: boolean
  restartDelay?: number
}

/**
 * Production-ready hands-free hook for Dixon Smart Repair
 * Provides Siri-style continuous voice interaction
 */
export function useHandsFree(options: UseHandsFreeOptions) {
  const {
    enabled,
    onVoiceResult,
    onError,
    onToggle,
    continuous = true,
    autoRestart = true,
    restartDelay = 1000
  } = options

  const [state, setState] = useState<HandsFreeState>({
    isActive: false,
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    lastActivity: null,
    error: null,
    sessionCount: 0
  })

  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onVoiceResultRef = useRef(onVoiceResult)
  const onErrorRef = useRef(onError)
  const onToggleRef = useRef(onToggle)
  const isUnmountedRef = useRef(false)

  // Update callback refs
  useEffect(() => {
    onVoiceResultRef.current = onVoiceResult
    onErrorRef.current = onError
    onToggleRef.current = onToggle
  }, [onVoiceResult, onError, onToggle])

  // Initialize voice with hands-free optimized settings
  const voice = useVoice({
    continuous,
    automotiveMode: true,
    timeout: continuous ? 0 : 10000, // No timeout in continuous mode
    
    onResult: useCallback((transcript: string) => {
      console.log('🎛️ [HandsFree] Voice result received:', transcript)
      
      setState(prev => ({ 
        ...prev, 
        lastActivity: new Date(),
        isProcessing: false
      }))
      
      onVoiceResultRef.current?.(transcript)
    }, []),
    
    onError: useCallback((error: string) => {
      console.error('🎛️ [HandsFree] Voice error:', error)
      
      setState(prev => ({ 
        ...prev, 
        error,
        isProcessing: false
      }))
      
      onErrorRef.current?.(error)
      
      // Auto-restart on error if enabled and still active
      if (autoRestart && state.isActive && !isUnmountedRef.current) {
        console.log('🎛️ [HandsFree] Auto-restarting after error...')
        restartTimeoutRef.current = setTimeout(() => {
          if (state.isActive && !isUnmountedRef.current) {
            startHandsFree()
          }
        }, restartDelay)
      }
    }, [autoRestart, state.isActive, restartDelay])
  })

  // Update state based on voice hook
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isListening: voice.isListening,
      isSpeaking: voice.isSpeaking,
      isProcessing: voice.isProcessing,
      error: voice.error || prev.error
    }))
  }, [voice.isListening, voice.isSpeaking, voice.isProcessing, voice.error])

  // Start hands-free mode
  const startHandsFree = useCallback(async () => {
    console.log('🎛️ [HandsFree] Starting hands-free mode...')
    
    if (!voice.isSupported) {
      const error = 'Speech recognition not supported in this browser'
      console.error('🎛️ [HandsFree]', error)
      setState(prev => ({ ...prev, error }))
      onErrorRef.current?.(error)
      return false
    }

    if (state.isActive) {
      console.warn('🎛️ [HandsFree] Already active')
      return true
    }

    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    // Update state
    setState(prev => ({ 
      ...prev, 
      isActive: true, 
      error: null,
      sessionCount: prev.sessionCount + 1,
      lastActivity: new Date()
    }))

    // Start voice recognition
    const started = await voice.startListening()
    
    if (started) {
      console.log('🎛️ [HandsFree] Hands-free mode activated successfully')
    } else {
      console.error('🎛️ [HandsFree] Failed to start voice recognition')
      setState(prev => ({ ...prev, isActive: false }))
    }

    return started
  }, [voice, state.isActive])

  // Stop hands-free mode
  const stopHandsFree = useCallback(() => {
    console.log('🎛️ [HandsFree] Stopping hands-free mode...')
    
    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    // Stop voice recognition
    voice.stopListening()
    
    // Update state
    setState(prev => ({ 
      ...prev, 
      isActive: false,
      isListening: false,
      isProcessing: false
    }))

    console.log('🎛️ [HandsFree] Hands-free mode deactivated')
  }, [voice])

  // Toggle hands-free mode
  const toggleHandsFree = useCallback(async () => {
    const newEnabled = !state.isActive
    console.log('🎛️ [HandsFree] Toggling hands-free:', newEnabled ? 'ON' : 'OFF')
    
    if (newEnabled) {
      await startHandsFree()
    } else {
      stopHandsFree()
    }
    
    onToggleRef.current?.(newEnabled)
  }, [state.isActive, startHandsFree, stopHandsFree])

  // Handle enabled prop changes
  useEffect(() => {
    if (enabled && !state.isActive) {
      startHandsFree()
    } else if (!enabled && state.isActive) {
      stopHandsFree()
    }
  }, [enabled, state.isActive, startHandsFree, stopHandsFree])

  // Auto-restart when voice recognition ends unexpectedly
  useEffect(() => {
    if (state.isActive && !voice.isListening && !voice.isProcessing && autoRestart) {
      console.log('🎛️ [HandsFree] Voice recognition ended unexpectedly, restarting...')
      
      restartTimeoutRef.current = setTimeout(() => {
        if (state.isActive && !isUnmountedRef.current) {
          console.log('🎛️ [HandsFree] Executing auto-restart...')
          voice.startListening()
        }
      }, restartDelay)
    }
  }, [state.isActive, voice.isListening, voice.isProcessing, autoRestart, restartDelay, voice])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      
      if (state.isActive) {
        voice.stopListening()
      }
    }
  }, [state.isActive, voice])

  // Get status text for UI
  const getStatusText = useCallback(() => {
    if (!voice.isSupported) return '❌ Speech recognition not supported'
    if (!state.isActive) return '🎤 Tap to enable Siri-style hands-free'
    if (voice.isSpeaking) return '🔊 Speaking response...'
    if (state.isProcessing || voice.isProcessing) return '⚡ Processing your request...'
    if (voice.isListening) return '🎤 Listening - speak naturally...'
    return '👂 Ready - start speaking anytime'
  }, [voice.isSupported, state.isActive, voice.isSpeaking, state.isProcessing, voice.isProcessing, voice.isListening])

  // Get status color for UI
  const getStatusColor = useCallback(() => {
    if (!voice.isSupported) return '#ef4444' // Red for unsupported
    if (!state.isActive) return '#64748b' // Gray for inactive
    if (voice.isSpeaking) return '#8b5cf6' // Purple for speaking
    if (state.isProcessing || voice.isProcessing) return '#3b82f6' // Blue for processing
    if (voice.isListening) return '#ef4444' // Red for listening
    return '#16a34a' // Green for active/ready
  }, [voice.isSupported, state.isActive, voice.isSpeaking, state.isProcessing, voice.isProcessing, voice.isListening])

  return {
    // State
    ...state,
    isSupported: voice.isSupported,
    isInitializing: voice.isInitializing,
    
    // Actions
    startHandsFree,
    stopHandsFree,
    toggleHandsFree,
    
    // UI helpers
    getStatusText,
    getStatusColor,
    
    // Voice controls
    speak: voice.speak,
    stopSpeaking: voice.stopSpeaking,
    
    // Debug info
    debugInfo: {
      ...voice.debugInfo,
      sessionCount: state.sessionCount,
      lastActivity: state.lastActivity,
      autoRestart,
      continuous
    }
  }
}
