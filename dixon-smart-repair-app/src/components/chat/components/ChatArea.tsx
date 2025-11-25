import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../../styles/designSystem';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onMenuToggle?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onMenuToggle,
}) => {
  return (
    <View style={styles.container}>
      {/* Header with menu toggle for mobile */}
      {onMenuToggle && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onMenuToggle} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={DesignSystem.colors.gray600} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dixon AI</Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Start a conversation with Dixon AI</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
              ]}>
                {message.content}
              </Text>
            </View>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantMessage]}>
            <Text style={styles.assistantMessageText}>Typing...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.white,
  },
  
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
  },
  
  menuButton: {
    marginRight: DesignSystem.spacing.md,
  },
  
  headerTitle: {
    fontSize: DesignSystem.typography.lg,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
  },
  
  messagesContainer: {
    flex: 1,
  },
  
  messagesContent: {
    padding: DesignSystem.spacing.lg,
    minHeight: '100%',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  emptyStateText: {
    fontSize: DesignSystem.typography.base,
    color: DesignSystem.colors.gray500,
    textAlign: 'center' as const,
  },
  
  messageBubble: {
    maxWidth: '80%',
    marginVertical: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
  },
  
  userMessage: {
    alignSelf: 'flex-end' as const,
    backgroundColor: DesignSystem.colors.primary,
  },
  
  assistantMessage: {
    alignSelf: 'flex-start' as const,
    backgroundColor: DesignSystem.colors.gray100,
  },
  
  messageText: {
    fontSize: DesignSystem.typography.base,
    lineHeight: DesignSystem.typography.base * 1.4,
  },
  
  userMessageText: {
    color: DesignSystem.colors.white,
  },
  
  assistantMessageText: {
    color: DesignSystem.colors.gray800,
  },
};

export default React.memo(ChatArea);
