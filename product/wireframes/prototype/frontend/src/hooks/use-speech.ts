import { useState, useEffect, useRef, useCallback } from 'react'

interface UseSpeechProps {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  continuous?: boolean
  interimResults?: boolean
}

export function useSpeech(props: UseSpeechProps = {}) {
  const { onResult, onError, continuous = true, interimResults = true } = props
  
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1
      
      // Better settings for automotive context
      if ('webkitSpeechRecognition' in window) {
        // @ts-ignore - webkit specific properties
        recognition.webkitSpeechRecognition = true;
      }

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')

        if (onResult) {
          onResult(transcript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (onError) {
          onError(event.error)
        }
      }
    }

    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [onResult, onError, continuous, interimResults])

  const startListening = useCallback((callback?: (transcript: string) => void) => {
    if (recognitionRef.current && !isListening) {
      // If a callback is provided, use it temporarily
      if (callback) {
        const recognition = recognitionRef.current
        const originalOnResult = recognition.onresult
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('')
          
          callback(transcript)
          recognition.onresult = originalOnResult // Restore original handler
        }
      }
      
      recognitionRef.current.start()
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const speak = useCallback((text: string) => {
    if (synthRef.current) {
      // Cancel any ongoing speech
      synthRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85 // Slightly slower for better comprehension
      utterance.pitch = 1
      utterance.volume = 0.9 // Louder for automotive environment
      
      // Try to use a more natural voice if available
      const voices = synthRef.current.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Alex'))
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      utterance.onstart = () => {
        setIsSpeaking(true)
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
      }
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        setIsSpeaking(false)
      }
      
      synthRef.current.speak(utterance)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    isListening,
    isSupported,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  }
}

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
  
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
  }
  
  interface SpeechRecognitionErrorEvent extends Event {
    error: string
  }
}
