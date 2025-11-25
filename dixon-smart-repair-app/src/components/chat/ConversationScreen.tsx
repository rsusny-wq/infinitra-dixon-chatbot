/**
 * ConversationScreen Component
 * ChatGPT-style conversation interface with automotive context
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConversationStore, VehicleInfo } from '../../stores/conversationStore';
import MessageBubble from './MessageBubble';
import HamburgerMenu from './HamburgerMenu';
import TypingIndicator from './TypingIndicator';
import VehicleSelector from './VehicleSelector';

const { width, height } = Dimensions.get('window');

export interface ConversationScreenProps {
  conversationId?: string;
  vehicleContext?: VehicleInfo;
  onVehicleSelect?: (vehicle: VehicleInfo) => void;
}

const ConversationScreen: React.FC<ConversationScreenProps> = ({
  conversationId,
  vehicleContext,
  onVehicleSelect,
}) => {
  // State
  const [inputText, setInputText] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentMenuSection, setCurrentMenuSection] = useState<string>('chat_history');
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Store
  const {
    messages,
    isTyping,
    attachments,
    currentVehicle,
    diagnosticContext,
    sendMessage,
    addAttachment,
    setCurrentVehicle,
    clearConversation,
    loadConversation,
  } = useConversationStore();

  // Effects
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  useEffect(() => {
    if (vehicleContext) {
      setCurrentVehicle(vehicleContext);
    }
  }, [vehicleContext, setCurrentVehicle]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isTyping]);

  // Handlers
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      await sendMessage(messageText, attachments.length > 0 ? attachments : undefined);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send message. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAttachmentPress = () => {
    const options = ['Take Photo', 'Choose from Gallery', 'Upload Document', 'Cancel'];
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          handleAttachmentOption(buttonIndex);
        }
      );
    } else {
      // Android implementation would use a modal or bottom sheet
      Alert.alert(
        'Add Attachment',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: () => handleAttachmentOption(0) },
          { text: 'Choose from Gallery', onPress: () => handleAttachmentOption(1) },
          { text: 'Upload Document', onPress: () => handleAttachmentOption(2) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleAttachmentOption = (index: number) => {
    switch (index) {
      case 0:
        // Take Photo - would integrate with camera
        console.log('Take Photo selected');
        break;
      case 1:
        // Choose from Gallery - would integrate with image picker
        console.log('Choose from Gallery selected');
        break;
      case 2:
        // Upload Document - would integrate with document picker
        console.log('Upload Document selected');
        break;
    }
  };

  const handleVehicleSelect = (vehicle: VehicleInfo) => {
    setCurrentVehicle(vehicle);
    setShowVehicleSelector(false);
    onVehicleSelect?.(vehicle);
  };

  const handleMenuSectionChange = (section: string) => {
    setCurrentMenuSection(section);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsMenuOpen(true)}
        testID="menu-button"
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Dixon Smart Repair</Text>
        {currentVehicle && (
          <TouchableOpacity
            style={styles.vehicleInfo}
            onPress={() => setShowVehicleSelector(true)}
            testID="vehicle-selector"
          >
            <Text style={styles.vehicleText}>
              {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
            </Text>
            {currentVehicle.vin && (
              <Text style={styles.vinText}>VIN: {currentVehicle.vin}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={clearConversation}
        testID="clear-conversation"
        accessibilityLabel="Clear conversation"
      >
        <Ionicons name="refresh" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderMessages = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesContainer}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-sport" size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>Welcome to Dixon Smart Repair</Text>
          <Text style={styles.emptyStateText}>
            Ask me about your vehicle issues, maintenance, or repairs.
            I can help diagnose problems and provide recommendations.
          </Text>
        </View>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showTimestamp={showTimestamps}
            onTimestampToggle={() => setShowTimestamps(!showTimestamps)}
          />
        ))
      )}
      
      {isTyping && <TypingIndicator />}
    </ScrollView>
  );

  const renderInput = () => (
    <View style={styles.inputContainer}>
      {attachments.length > 0 && (
        <View style={styles.attachmentsPreview}>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentPreview} testID="attachment-preview">
              <Text style={styles.attachmentName}>{attachment.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  // Remove attachment logic would go here
                }}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={handleAttachmentPress}
          testID="attachment-button"
          accessibilityLabel="Add attachment"
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about your vehicle..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          testID="message-input"
          accessibilityLabel="Message input field"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            { opacity: inputText.trim() ? 1 : 0.5 }
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
          testID="send-button"
          accessibilityLabel="Send message"
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}
        {renderMessages()}
        {renderInput()}
      </KeyboardAvoidingView>

      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentSection={currentMenuSection}
        onSectionChange={handleMenuSectionChange}
      />

      {showVehicleSelector && (
        <VehicleSelector
          isVisible={showVehicleSelector}
          onClose={() => setShowVehicleSelector(false)}
          onVehicleSelect={handleVehicleSelect}
          currentVehicle={currentVehicle}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    pointerEvents: 'box-none', // Allow touches to pass through to children
  },
  keyboardAvoidingView: {
    flex: 1,
    pointerEvents: 'box-none', // Allow touches to pass through to children
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  vehicleInfo: {
    marginTop: 4,
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  vinText: {
    fontSize: 12,
    color: '#666',
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: height * 0.6,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachmentsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  attachmentName: {
    fontSize: 12,
    color: '#333',
    marginRight: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachmentButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: 'white',
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ConversationScreen;
