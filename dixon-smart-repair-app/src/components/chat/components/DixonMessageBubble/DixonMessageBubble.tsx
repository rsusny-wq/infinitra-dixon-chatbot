import React from 'react';
import {
  View,
  Text,
} from 'react-native';

// Import styles
import { styles } from './DixonMessageBubble.styles';

// Types
interface DixonMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface DixonMessageBubbleProps {
  message: DixonMessage;
}

const DixonMessageBubble: React.FC<DixonMessageBubbleProps> = ({
  message,
}) => {
  const isUser = message.role === 'user';
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={[
      styles.messageWrapper,
      isUser ? styles.userMessageWrapper : styles.assistantMessageWrapper
    ]}>
      {/* Message Bubble */}
      <View style={[
        styles.messageBubble,
        isUser ? styles.userMessageBubble : styles.assistantMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.assistantMessageText
        ]}>
          {message.content}
        </Text>
      </View>

      {/* Timestamp */}
      <Text style={[
        styles.messageTimestamp,
        isUser ? styles.userTimestamp : styles.assistantTimestamp
      ]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
};

export default React.memo(DixonMessageBubble);
