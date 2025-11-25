import React from 'react'
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useVoice } from '../hooks/use-voice'
import { shadows } from '../constants/styles'

interface VoiceButtonProps {
  onVoiceResult: (transcript: string) => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function VoiceButton({ onVoiceResult, disabled = false, size = 'medium' }: VoiceButtonProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current
  
  const voice = useVoice({
    onResult: onVoiceResult,
    onError: (error) => {
      console.error('Voice error:', error)
    },
    automotiveMode: false // Use regular mode to avoid mock responses
  })

  const { 
    isListening, 
    isProcessing, 
    isSpeaking,
    startListening, 
    stopListening,
    error,
    isSupported
  } = voice

  // Animate button when listening
  React.useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: false, // Disabled for web compatibility
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false, // Disabled for web compatibility
          }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isListening, pulseAnim])

  const handlePress = () => {
    if (disabled || isProcessing) return
    
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // ChatGPT-style voice button states
  const getVoiceState = () => {
    if (isProcessing) {
      return {
        icon: <MaterialIcons name="hourglass-empty" size={18} color="#ffffff" />,
        color: '#3b82f6', // Blue for processing
        animated: true,
        label: 'Processing...'
      }
    }
    if (isListening) {
      return {
        icon: <MaterialIcons name="fiber-manual-record" size={14} color="#ffffff" />,
        color: '#ef4444', // Red for recording like ChatGPT
        animated: true,
        label: isSupported ? '🎤 Listening to your voice...' : '🎤 Mock listening...'
      }
    }
    return {
      icon: <MaterialIcons name="mic" size={18} color="#64748b" />,
      color: '#f1f5f9', // Gray for idle
      animated: false,
      label: isSupported ? '🎤 Tap to speak' : '🎤 Tap for demo'
    }
  }

  // ChatGPT-style button styling based on state
  const getButtonStyle = () => {
    const voiceState = getVoiceState()
    const baseStyle = {
      ...styles.button,
      backgroundColor: voiceState.color,
    }

    if (size === 'small') {
      return { ...baseStyle, ...styles.small }
    }
    if (size === 'large') {
      return { ...baseStyle, ...styles.large }
    }
    return baseStyle
  }

  const getStatusText = () => {
    const voiceState = getVoiceState()
    return voiceState.label
  }

  if (error) {
    return null
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={handlePress}
          disabled={disabled || isProcessing}
          activeOpacity={0.7}
        >
          {getVoiceState().icon}
        </TouchableOpacity>
      </Animated.View>
      
      {getStatusText() && (
        <Text style={styles.statusText}>{getStatusText()}</Text>
      )}
      
      {error && (
        <Text style={styles.errorText}>Voice unavailable</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9', // Default gray like ChatGPT
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.medium,
  },
  small: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  large: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  disabled: {
    backgroundColor: '#e2e8f0',
    opacity: 0.6,
  },
  statusText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
})
