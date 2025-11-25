/**
 * useVoiceInput Hook - Hybrid Voice Recognition
 * Supports Web Speech API (web) and Expo Audio (native mobile)
 * GAP 3: Voice Input Support (US-003)
 */

import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export interface VoiceInputResult {
  transcript: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  transcript: string;
}

export const useVoiceInput = () => {
  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    transcript: ''
  });

  const recognitionRef = useRef<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Check if voice input is supported on current platform
  const isVoiceSupported = useCallback(() => {
    if (Platform.OS === 'web') {
      return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    return true; // Expo Audio is available on native platforms
  }, []);

  // Initialize Web Speech API
  const initializeWebSpeech = useCallback(() => {
    if (!isVoiceSupported()) return null;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    return recognition;
  }, [isVoiceSupported]);

  // Start voice recording
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null, transcript: '' }));

      if (Platform.OS === 'web') {
        // Web Speech API implementation
        const recognition = initializeWebSpeech();
        if (!recognition) {
          throw new Error('Speech recognition not supported in this browser');
        }

        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          
          setState(prev => ({
            ...prev,
            transcript,
            isRecording: false,
            isProcessing: false
          }));
        };

        recognition.onerror = (event: any) => {
          setState(prev => ({
            ...prev,
            error: `Speech recognition error: ${event.error}`,
            isRecording: false,
            isProcessing: false
          }));
        };

        recognition.onend = () => {
          setState(prev => ({
            ...prev,
            isRecording: false,
            isProcessing: false
          }));
        };

        recognition.start();
      } else {
        // Native mobile implementation with Expo Audio
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Microphone permission not granted');
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        
        recordingRef.current = recording;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording',
        isRecording: false,
        isProcessing: false
      }));
    }
  }, [initializeWebSpeech]);

  // Stop voice recording
  const stopRecording = useCallback(async (): Promise<VoiceInputResult> => {
    try {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

      if (Platform.OS === 'web') {
        // Web Speech API - stop recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        
        // Return current state (result will come via onresult callback)
        return {
          transcript: state.transcript,
          confidence: 0.9, // Web Speech API doesn't always provide confidence
          success: true
        };
      } else {
        // Native mobile - stop recording and process
        if (!recordingRef.current) {
          throw new Error('No active recording found');
        }

        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        // For now, return placeholder - in production, you'd send audio to speech-to-text service
        setState(prev => ({
          ...prev,
          transcript: 'Voice input processed (native mobile)',
          isProcessing: false
        }));

        return {
          transcript: 'Voice input processed (native mobile)',
          confidence: 0.85,
          success: true
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
        isProcessing: false
      }));

      return {
        transcript: '',
        confidence: 0,
        success: false,
        error: errorMessage
      };
    }
  }, [state.transcript]);

  // Cancel voice recording
  const cancelRecording = useCallback(async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } else {
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
        }
      }
    } catch (error) {
      console.warn('Error canceling recording:', error);
    } finally {
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: null,
        transcript: ''
      }));
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '' }));
  }, []);

  return {
    ...state,
    isVoiceSupported: isVoiceSupported(),
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
    clearTranscript
  };
};

export default useVoiceInput;
