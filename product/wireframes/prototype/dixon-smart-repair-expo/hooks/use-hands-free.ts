import { useState, useCallback, useRef, useEffect } from 'react'
import { useVoice } from './use-voice-fixed'

interface HandsFreeState {
  isActive: boolean
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  lastActivity: Date | null
  error: string | null
}

interface UseHandsFreeProps {
  enabled: boolean
  onVoiceResult?: (transcript: string) => void
  onError?: (error: string) => void
  onToggle?: (enabled: boolean) => void
}

export function useHandsFree({
  enabled,
  onVoiceResult,
  onError,
  onToggle
}: UseHandsFreeProps) {
  const [state, setState] = useState<HandsFreeState>({
    isActive: false,
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    lastActivity: null,
    error: null
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onVoiceResultRef = useRef(onVoiceResult)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onVoiceResultRef.current = onVoiceResult
    onErrorRef.current = onError
  }, [onVoiceResult, onError])

  // Initialize voice with hands-free settings
  const voice = useVoice({
    automotiveMode: true,
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
        isProcessing: false,
        isActive: false
      }))
      onErrorRef.current?.(error)
    }, [])
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

    setState(prev => ({ 
      ...prev, 
      isActive: true, 
      error: null,
      lastActivity: new Date()
    }))

    const started = await voice.startListening()
    
    if (started) {
      console.log('🎛️ [HandsFree] Hands-free mode activated successfully')
    } else {
      console.error('🎛️ [HandsFree] Failed to start voice recognition')
      setState(prev => ({ ...prev, isActive: false }))
    }

    return started
  }, [voice.isSupported, voice.startListening]) // FIXED: Only depend on specific properties

  // Stop hands-free mode
  const stopHandsFree = useCallback(() => {
    console.log('🎛️ [HandsFree] Stopping hands-free mode...')
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    voice.stopListening()
    
    setState(prev => ({ 
      ...prev, 
      isActive: false,
      isListening: false,
      isProcessing: false
    }))

    console.log('🎛️ [HandsFree] Hands-free mode deactivated')
  }, [voice.stopListening]) // FIXED: Only depend on specific properties

  // Handle enabled prop changes
  useEffect(() => {
    if (enabled && !state.isActive) {
      console.log('🎛️ [HandsFree] Enabled prop changed to true, starting...')
      startHandsFree()
    } else if (!enabled && state.isActive) {
      console.log('🎛️ [HandsFree] Enabled prop changed to false, stopping...')
      stopHandsFree()
    }
  }, [enabled, state.isActive, startHandsFree, stopHandsFree])

  // Smart auto-restart with proper debouncing to prevent infinite loops
  const autoRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastRestartTimeRef = useRef<number>(0)
  const restartCountRef = useRef<number>(0)
  
  // Auto-restart logic with safeguards
  useEffect(() => {
    // Only auto-restart if hands-free is active but not listening/processing
    if (state.isActive && !voice.isListening && !voice.isProcessing && !voice.isSpeaking) {
      const now = Date.now()
      const timeSinceLastRestart = now - lastRestartTimeRef.current
      
      // Prevent too frequent restarts (minimum 2 seconds between restarts)
      if (timeSinceLastRestart < 2000) {
        return
      }
      
      // Reset restart count after 30 seconds of successful operation
      if (timeSinceLastRestart > 30000) {
        restartCountRef.current = 0
      }
      
      // Limit restart attempts to prevent infinite loops
      if (restartCountRef.current >= 5) {
        setState(prev => ({ 
          ...prev, 
          error: 'Voice recognition temporarily unavailable - please toggle voice to retry' 
        }))
        return
      }
      
      // Auto-restart after a short delay
      autoRestartTimeoutRef.current = setTimeout(() => {
        if (state.isActive && !voice.isListening) {
          lastRestartTimeRef.current = Date.now()
          restartCountRef.current += 1
          voice.startListening()
        }
      }, 1000)
    }
    
    // Cleanup timeout on dependency changes
    return () => {
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current)
        autoRestartTimeoutRef.current = null
      }
    }
  }, [state.isActive, voice.isListening, voice.isProcessing, voice.isSpeaking]) // Stable dependencies only

  // Reset restart counter when hands-free is toggled off/on
  useEffect(() => {
    if (!state.isActive) {
      restartCountRef.current = 0
      lastRestartTimeRef.current = 0
      if (autoRestartTimeoutRef.current) {
        clearTimeout(autoRestartTimeoutRef.current)
        autoRestartTimeoutRef.current = null
      }
    }
  }, [state.isActive])

  // DISABLED: Manual restart feature completely removed to prevent infinite loops
  // Manual restart is available via restartHandsFree() method

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (state.isActive) {
        voice.stopListening()
      }
    }
  }, []) // FIXED: Empty dependency array - only run on mount/unmount

  // Manual restart method for better control
  const restartHandsFree = useCallback(async () => {
    console.log('🎛️ [HandsFree] Manual restart requested...')
    
    if (!state.isActive) {
      console.warn('🎛️ [HandsFree] Not active, cannot restart')
      return false
    }

    // Stop current session
    voice.stopListening()
    
    // Wait a moment then restart
    setTimeout(async () => {
      if (state.isActive) {
        console.log('🎛️ [HandsFree] Executing manual restart...')
        await voice.startListening()
      }
    }, 500)
    
    return true
  }, [state.isActive, voice.stopListening, voice.startListening]) // FIXED: Only depend on specific properties

  return {
    ...state,
    isSupported: voice.isSupported,
    startHandsFree,
    stopHandsFree,
    restartHandsFree, // NEW: Manual restart method
    speak: voice.speak,
    stopSpeaking: voice.stopSpeaking
  }
}
