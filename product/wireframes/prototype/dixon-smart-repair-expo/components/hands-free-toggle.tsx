import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useHandsFree } from '../hooks/use-hands-free'

interface HandsFreeToggleProps {
  onVoiceResult: (transcript: string, isHandsFree?: boolean) => void
}

export function HandsFreeToggle({ onVoiceResult }: HandsFreeToggleProps) {
  const [enabled, setEnabled] = useState(false)
  const pulseAnim = React.useRef(new Animated.Value(1)).current

  const handsFree = useHandsFree({
    enabled,
    onVoiceResult: (transcript: string) => {
      onVoiceResult(transcript, true) // Pass isHandsFree=true
    },
    onError: (error) => {
      console.error('Voice error:', error)
    }
  })

  const handleToggle = React.useCallback(() => {
    // Simple toggle - no manual restart needed since auto-restart is active
    const newEnabled = !enabled
    setEnabled(newEnabled)
  }, [enabled])

  const getStatusText = React.useMemo(() => {
    if (!enabled) return '🎤 Tap to enable voice conversation'
    if (handsFree.isSpeaking) return '🔊 Speaking...'
    if (handsFree.isProcessing) return '💭 Thinking...'
    if (handsFree.isListening) return '👂 Listening...'
    return '✅ Voice conversation active'
  }, [enabled, handsFree.isListening, handsFree.isProcessing, handsFree.isSpeaking])

  const getStatusColor = React.useMemo(() => {
    if (!enabled) return '#64748b'
    if (handsFree.isSpeaking) return '#8b5cf6' // Purple for speaking
    if (handsFree.isProcessing) return '#3b82f6' // Blue for processing  
    if (handsFree.isListening) return '#16a34a' // Green for listening
    return '#16a34a' // Green for active
  }, [enabled, handsFree.isListening, handsFree.isProcessing, handsFree.isSpeaking])

  // Animate when active
  React.useEffect(() => {
    if ((handsFree.isActive || handsFree.isListening || handsFree.isProcessing || handsFree.isSpeaking) && enabled) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [handsFree.isActive, handsFree.isListening, handsFree.isProcessing, handsFree.isSpeaking, enabled])

  // Show error state
  if (handsFree.error) {
    return (
      <View style={styles.container}>
        <View style={[styles.toggleButton, styles.toggleButtonError]}>
          <View style={styles.toggleContent}>
            <MaterialIcons name="mic-off" size={20} color="#ef4444" />
            <Text style={[styles.toggleText, styles.toggleTextError]}>
              Not Supported
            </Text>
          </View>
        </View>
        <Text style={styles.errorText}>
          {handsFree.error}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            enabled && styles.toggleButtonActive,
            handsFree.isListening && styles.toggleButtonListening,
            handsFree.isProcessing && styles.toggleButtonProcessing,
            handsFree.isSpeaking && styles.toggleButtonSpeaking,
          ]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <View style={styles.toggleContent}>
            <View style={styles.iconContainer}>
              {enabled ? (
                handsFree.isSpeaking ? (
                  <MaterialIcons name="volume-up" size={20} color="#8b5cf6" />
                ) : handsFree.isProcessing ? (
                  <MaterialIcons name="hourglass-empty" size={20} color="#3b82f6" />
                ) : handsFree.isListening ? (
                  <MaterialIcons name="fiber-manual-record" size={16} color="#ef4444" />
                ) : (
                  <MaterialIcons name="record-voice-over" size={20} color="#16a34a" />
                )
              ) : (
                <MaterialIcons name="mic-off" size={20} color="#64748b" />
              )}
            </View>
            <Text style={[
              styles.toggleText,
              enabled && styles.toggleTextActive
            ]}>
              {enabled ? 'Voice ON' : 'Voice OFF'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={[styles.statusText, { color: getStatusColor }]}>
        {getStatusText}
      </Text>
      
      {/* Simple user message */}
      {enabled && (
        <Text style={styles.helpText}>
          Just speak naturally - I'll listen and respond
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minWidth: 140,
  },
  toggleButtonActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  toggleButtonListening: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  toggleButtonProcessing: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  toggleButtonSpeaking: {
    backgroundColor: '#faf5ff',
    borderColor: '#8b5cf6',
  },
  toggleButtonError: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  toggleButtonLoading: {
    backgroundColor: '#f8fafc',
    borderColor: '#94a3b8',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#16a34a',
  },
  toggleTextError: {
    color: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  supportText: {
    fontSize: 10,
    color: '#16a34a',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  debugText: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
})
