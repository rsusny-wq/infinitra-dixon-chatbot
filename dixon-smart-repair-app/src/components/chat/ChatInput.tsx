import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../styles/designSystem';

interface ChatInputProps {
  initialValue?: string;
  onSubmit: (text: string) => void;
  onAttachmentPress: () => void;
  onSendMessage?: () => void; // Optional callback to trigger parent send logic
  disabled?: boolean;
  placeholder?: string;
  attachmentsCount?: number;
  style?: any;
  inputStyle?: any;
  sendButtonStyle?: any;
  attachButtonStyle?: any;
}

const ChatInput: React.FC<ChatInputProps> = ({
  initialValue = '',
  onSubmit,
  onAttachmentPress,
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  attachmentsCount = 0,
  style,
  inputStyle,
  sendButtonStyle,
  attachButtonStyle,
}) => {
  // Completely independent local state
  const [localValue, setLocalValue] = useState(initialValue);
  const textInputRef = useRef<TextInput>(null);

  // Clear input when parent requests it
  useEffect(() => {
    if (initialValue === '' && localValue !== '') {
      setLocalValue('');
    }
  }, [initialValue, localValue]);

  // Handle local input changes - NO parent updates
  const handleLocalChange = useCallback((text: string) => {
    setLocalValue(text);
    // NO parent updates here - only on submit!
  }, []);

  // Handle submit - this is the ONLY time we update the parent
  const handleSubmit = useCallback(() => {
    if (!disabled && (localValue.trim() || attachmentsCount > 0)) {
      onSubmit(localValue.trim());
      setLocalValue(''); // Clear local input after submit
      // Also trigger parent send logic if provided
      if (onSendMessage) {
        setTimeout(() => {
          onSendMessage();
        }, 0);
      }
    }
  }, [disabled, localValue, attachmentsCount, onSubmit, onSendMessage]);

  // Focus the input
  const focus = useCallback(() => {
    textInputRef.current?.focus();
  }, []);

  const isInputEmpty = !localValue.trim() && attachmentsCount === 0;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={[styles.attachButton, attachButtonStyle]}
        onPress={onAttachmentPress}
        disabled={disabled}
      >
        <Ionicons name="add" size={20} color={DesignSystem.colors.gray400} />
      </TouchableOpacity>
      
      <TextInput
        ref={textInputRef}
        style={[
          styles.textInput,
          disabled && styles.textInputDisabled,
          inputStyle
        ]}
        value={localValue}
        onChangeText={handleLocalChange}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={DesignSystem.colors.gray400}
        multiline={true}
        numberOfLines={1}
        maxLength={1000}
        editable={!disabled}
        blurOnSubmit={false}
        returnKeyType="send"
        enablesReturnKeyAutomatically={true}
      />
      
      <TouchableOpacity 
        style={[
          styles.sendButton, 
          isInputEmpty && styles.sendButtonDisabled,
          disabled && styles.sendButtonDisabled,
          sendButtonStyle
        ]}
        onPress={handleSubmit}
        disabled={disabled || isInputEmpty}
      >
        <Ionicons 
          name="send" 
          size={18} 
          color={
            disabled || isInputEmpty 
              ? DesignSystem.colors.gray400 
              : DesignSystem.colors.white
          } 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DesignSystem.colors.white,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray200,
    minHeight: 144, // Increased from 96 to 144 to accommodate larger input
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignSystem.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    minHeight: 120, // Significantly increased from 72 to 120
    maxHeight: 180, // Increased proportionally
    paddingHorizontal: 12, // Back to reasonable horizontal padding
    paddingVertical: 8, // Back to reasonable vertical padding
    backgroundColor: DesignSystem.colors.gray50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    fontSize: 18, // Increased font size from 16 to 18
    color: DesignSystem.colors.gray900,
    marginRight: 8,
    textAlignVertical: 'top',
    lineHeight: 24, // Increased line height proportionally
    includeFontPadding: false,
  },
  textInputDisabled: {
    backgroundColor: DesignSystem.colors.gray100,
    color: DesignSystem.colors.gray500,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignSystem.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: DesignSystem.colors.gray300,
  },
});

export default ChatInput;
