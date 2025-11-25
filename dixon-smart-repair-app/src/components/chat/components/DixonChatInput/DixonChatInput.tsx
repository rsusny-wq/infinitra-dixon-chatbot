import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

// Import hooks
import { useVoiceInput } from '../../../../hooks/useVoiceInput';

// Import styles
import { styles } from './DixonChatInput.styles';
import { DesignSystem } from '../../../../styles/designSystem';

// Import options menu
import ChatInputOptionsMenu from './ChatInputOptionsMenu';

// Types
interface User {
  givenName?: string;
  email?: string;
}

interface DixonChatInputProps {
  onSendMessage: (message: string, imageFile?: File) => void; // Changed from imageBase64 to imageFile
  disabled?: boolean;
  placeholder?: string;
  user?: User | null;
  isAuthenticated?: boolean;
  autoFocus?: boolean; // New prop for auto-focusing
  onCommunicationModeChange?: (mode: 'ai' | 'mechanic') => void; // New prop for communication mode
  initialCommunicationMode?: 'ai' | 'mechanic'; // New prop for initial mode
}

const DixonChatInput: React.FC<DixonChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Ask Dixon about your vehicle...",
  user,
  isAuthenticated = false,
  autoFocus = false,
  onCommunicationModeChange,
  initialCommunicationMode = 'ai',
}) => {
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(20);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [communicationMode, setCommunicationMode] = useState<'ai' | 'mechanic'>(initialCommunicationMode);
  
  // Image preview states
  const [selectedImage, setSelectedImage] = useState<{uri: string, file: File} | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const voiceInput = useVoiceInput();

  // Auto-focus input when requested
  useEffect(() => {
    if (autoFocus && textInputRef.current) {
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Expose focus method for parent components
  useEffect(() => {
    const inputElement = textInputRef.current;
    if (inputElement && Platform.OS === 'web') {
      // Add a custom method to the DOM element for external focus
      (inputElement as any).focusInput = () => {
        inputElement.focus();
      };
    }
  }, []);

  // Handle communication mode change
  const handleCommunicationModeChange = useCallback((newMode: 'ai' | 'mechanic') => {
    console.log('🔄 Communication mode changing from', communicationMode, 'to', newMode);
    setCommunicationMode(newMode);
    
    // Notify parent component of the mode change
    if (onCommunicationModeChange) {
      onCommunicationModeChange(newMode);
    }
  }, [communicationMode, onCommunicationModeChange]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if ((inputText.trim() || selectedImage) && !disabled) {
      setIsProcessingImage(true);
      
      // If there's an image but no text, provide VIN context
      const messageText = inputText.trim() || (selectedImage ? 'Here is the VIN' : '');
      
      // 🔍 DEBUG: Log what's being sent
      console.log('🔍 DEBUG: DixonChatInput handleSend called:');
      console.log('  - messageText:', messageText);
      console.log('  - selectedImage:', selectedImage ? {
        uri: selectedImage.uri,
        fileName: selectedImage.file.name,
        fileSize: selectedImage.file.size,
        fileType: selectedImage.file.type
      } : 'None');
      
      try {
        await onSendMessage(messageText, selectedImage?.file); // Changed from base64 to file
        setInputText('');
        setSelectedImage(null); // Clear image after sending
        setInputHeight(20); // Reset height after sending
        voiceInput.clearTranscript(); // Clear voice transcript
        
        console.log('🔍 DEBUG: DixonChatInput message sent successfully');
      } catch (error) {
        console.error('🔍 DEBUG: DixonChatInput send error:', error);
      } finally {
        setIsProcessingImage(false);
      }
    } else {
      console.log('🔍 DEBUG: DixonChatInput handleSend - conditions not met:', {
        inputText: inputText.trim(),
        selectedImage: !!selectedImage,
        disabled
      });
    }
  }, [inputText, selectedImage, disabled, onSendMessage, voiceInput]);

  // Handle text change
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  // Handle content size change for dynamic height
  const handleContentSizeChange = useCallback((event: any) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.max(20, Math.min(84, height));
    setInputHeight(newHeight);
  }, []);

  // Handle voice input
  const handleVoiceInput = useCallback(async () => {
    if (!voiceInput.isVoiceSupported) {
      Alert.alert(
        'Voice Input Not Supported',
        'Voice input is not supported on this device or browser. Please use text input instead.',
        [{ text: 'OK', onPress: () => textInputRef.current?.focus() }]
      );
      return;
    }

    if (voiceInput.isRecording) {
      // Stop recording
      const result = await voiceInput.stopRecording();
      if (result.success && result.transcript.trim()) {
        setInputText(result.transcript);
        // Auto-send the voice message
        setTimeout(async () => {
          onSendMessage(result.transcript.trim());
          setInputText('');
          voiceInput.clearTranscript();
        }, 100);
      }
    } else {
      // Start recording
      await voiceInput.startRecording();
    }
  }, [voiceInput, onSendMessage]);

  // Handle voice input transcript updates
  useEffect(() => {
    if (voiceInput.transcript && 
        !voiceInput.isRecording && 
        !voiceInput.isProcessing && 
        voiceInput.transcript !== inputText && 
        voiceInput.transcript.trim()) {
      setInputText(voiceInput.transcript);
    }
  }, [voiceInput.transcript, voiceInput.isRecording, voiceInput.isProcessing, inputText]);

  // Clear voice transcript when input is cleared
  useEffect(() => {
    if (!inputText && voiceInput.transcript) {
      voiceInput.clearTranscript();
    }
  }, [inputText, voiceInput.transcript, voiceInput]);

  // Handle Enter key to send message
  const handleKeyPress = useCallback((e: any) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle options menu
  const handleOptionsPress = useCallback(() => {
    setShowOptionsMenu(true);
  }, []);

  const handleOptionsClose = useCallback(() => {
    setShowOptionsMenu(false);
  }, []);

  // Handle image upload with preview
  const handleImageUpload = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false, // Don't need base64 anymore
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('📷 Image selected for S3 upload:', asset.uri);
        
        try {
          // Convert to File object for S3 upload
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const file = new File([blob], `image_${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          setSelectedImage({
            uri: asset.uri,
            file: file
          });
        } catch (fileError) {
          console.error('❌ Error creating File object:', fileError);
          Alert.alert('Error', 'Could not process the selected image. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  }, []);

  // Handle removing selected image
  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Handle option selection
  const handleOptionSelect = useCallback((optionId: string) => {
    console.log('Option selected:', optionId);
    
    switch (optionId) {
      case 'ai_mode':
        handleCommunicationModeChange('ai');
        break;
      case 'human_mode':
        handleCommunicationModeChange('mechanic');
        break;
      case 'camera':
        // Handle camera attachment
        console.log('Camera selected');
        break;
      case 'photos':
        // Handle photo library
        console.log('Photos selected');
        break;
      case 'files':
        // Handle file selection
        console.log('Files selected');
        break;
      case 'upload':
        // Handle web/mobile upload
        console.log('Upload selected');
        handleImageUpload();
        break;
      default:
        console.log('Unknown option:', optionId);
    }
  }, [handleCommunicationModeChange, handleImageUpload]);

  const canSend = (inputText.trim().length > 0 || selectedImage) && !disabled && !isProcessingImage;
  const hasText = inputText.trim().length > 0;

  return (
    <>      
      <View style={styles.container}>
        <View style={styles.inputWrapper}>
          {/* Options Button (+ symbol) */}
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={handleOptionsPress}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Ionicons
              name="add"
              size={20}
              color={disabled ? DesignSystem.colors.gray300 : DesignSystem.colors.gray600}
            />
          </TouchableOpacity>

          {/* Enhanced Text Input Container with Image Preview */}
          <View style={[
            styles.textInputContainer,
            isInputFocused && styles.textInputContainerFocused,
            selectedImage && styles.textInputContainerWithImage
          ]}>
            {/* Image Preview inside text input area */}
            {selectedImage && (
              <View style={styles.inlineImagePreview}>
                <View style={styles.inlineImageWrapper}>
                  <Image 
                    source={{ uri: selectedImage.uri }} 
                    style={[styles.inlineImage, isProcessingImage && styles.imagePreviewProcessing]}
                    resizeMode="cover"
                  />
                  {isProcessingImage && (
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator size="small" color={DesignSystem.colors.white} />
                    </View>
                  )}
                  {!isProcessingImage && (
                    <TouchableOpacity
                      style={styles.inlineRemoveButton}
                      onPress={handleRemoveImage}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={20} color={DesignSystem.colors.white} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.inlineImageText}>
                  {isProcessingImage ? 'Processing...' : 'Image attached'}
                </Text>
              </View>
            )}

            {/* Text Input */}
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                { height: Math.max(40, inputHeight + (selectedImage ? 20 : 0)) },
                isInputFocused && styles.textInputFocused,
                disabled && styles.textInputDisabled,
                selectedImage && styles.textInputWithImage,
              ]}
              value={inputText}
              onChangeText={handleTextChange}
              onContentSizeChange={handleContentSizeChange}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onKeyPress={handleKeyPress}
              placeholder={selectedImage ? "Add a message (optional) and press Enter to send..." : placeholder}
              placeholderTextColor={DesignSystem.colors.gray400}
              multiline={true}
              textAlignVertical="top"
              maxLength={1000}
              editable={!disabled}
              returnKeyType="send"
              blurOnSubmit={false}
              scrollEnabled={false}
            />
          </View>

          {/* Clear Button - shows when there's text */}
          {hasText && !disabled && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setInputText('');
                voiceInput.clearTranscript();
                textInputRef.current?.clear();
                textInputRef.current?.focus();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={DesignSystem.colors.gray400} />
            </TouchableOpacity>
          )}

          {/* Voice/Send Button */}
          <TouchableOpacity
            style={[
              (hasText || selectedImage) ? styles.sendButton : styles.voiceButton,
              (hasText || selectedImage) ? styles.sendButtonActive : (voiceInput.isRecording ? styles.voiceButtonRecording : {}),
              !hasText && !selectedImage && !canSend && styles.sendButtonDisabled
            ]}
            onPress={(hasText || selectedImage) ? handleSend : handleVoiceInput}
            disabled={disabled || voiceInput.isProcessing}
            activeOpacity={0.8}
          >
            {voiceInput.isProcessing ? (
              <Ionicons name="hourglass" size={18} color={DesignSystem.colors.white} />
            ) : (hasText || selectedImage) ? (
              <Ionicons name="send" size={18} color={DesignSystem.colors.white} />
            ) : (
              <Ionicons 
                name={voiceInput.isRecording ? "stop" : "mic"} 
                size={18} 
                color={voiceInput.isRecording ? DesignSystem.colors.error : DesignSystem.colors.gray600} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Menu */}
      <ChatInputOptionsMenu
        visible={showOptionsMenu}
        onClose={handleOptionsClose}
        onOptionSelect={handleOptionSelect}
        communicationMode={communicationMode}
      />
    </>
  );
};

export default React.memo(DixonChatInput);
