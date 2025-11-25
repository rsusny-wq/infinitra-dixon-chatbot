/**
 * MessageBubble Component
 * Displays individual messages with automotive context and diagnostic information
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../stores/conversationStore';

// Import DOMPurify for secure HTML rendering on web
let DOMPurify: any = null;
if (Platform.OS === 'web') {
  try {
    DOMPurify = require('dompurify');
  } catch (error) {
    console.warn('DOMPurify not available for HTML sanitization');
  }
}

const { width } = Dimensions.get('window');

export interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
  onTimestampToggle?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showTimestamp = false,
  onTimestampToggle,
}) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  const isAI = message.type === 'ai';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50'; // Green
    if (confidence >= 0.6) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  // Check if message content contains HTML links
  const hasHtmlLinks = (content: string) => {
    return /<a\s+href=/.test(content);
  };

  // Render message text with HTML support for web
  const renderMessageText = () => {
    const textStyle = [
      styles.messageText,
      isUser && styles.userMessageText,
      isSystem && styles.systemMessageText,
    ];

    // For web platform and if content has HTML links, use secure HTML rendering
    if (Platform.OS === 'web' && hasHtmlLinks(message.content)) {
      let sanitizedHTML = message.content;
      
      // SECURITY: Sanitize HTML with DOMPurify if available
      if (DOMPurify) {
        sanitizedHTML = DOMPurify.sanitize(message.content, {
          ALLOWED_TAGS: ['a', 'strong', 'em', 'br', 'p', 'table', 'tr', 'td', 'th', 'h1', 'h2', 'h3'],
          ALLOWED_ATTR: ['href', 'target', 'rel'],
          // SECURITY: Only allow automotive retailer domains
          ALLOWED_URI_REGEXP: /^https?:\/\/(www\.)?(autozone|amazon|rockauto|partsgeek|napaonline|oreillyauto|advanceautoparts|pepboys|carparts|1aauto)\.com/
        });
      }
      
      // ENHANCEMENT: Add security attributes and styling to links
      const processedHTML = sanitizedHTML.replace(
        /<a href="([^"]*)"([^>]*)>/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #007AFF; text-decoration: underline; font-weight: 500; cursor: pointer;"$2>'
      );
      
      return (
        <div
          style={{
            fontSize: 16,
            lineHeight: '22px',
            color: isUser ? 'white' : isSystem ? '#666' : '#333',
            fontStyle: isSystem ? 'italic' : 'normal',
            fontFamily: 'inherit',
            margin: 0,
            padding: 0,
          }}
          dangerouslySetInnerHTML={{ __html: processedHTML }}
        />
      );
    }

    // For mobile or content without HTML links, use regular Text component
    return (
      <Text style={textStyle} selectable={true}>
        {message.content}
      </Text>
    );
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <View style={styles.attachmentsContainer}>
        {message.attachments.map((attachment) => (
          <View key={attachment.id} style={styles.attachment}>
            {attachment.type === 'image' ? (
              <View style={styles.imageAttachment} testID="attachment-image">
                <Ionicons name="image" size={20} color="#007AFF" />
                <Text style={styles.attachmentText}>{attachment.name}</Text>
              </View>
            ) : (
              <View style={styles.documentAttachment} testID="attachment-document">
                <Ionicons name="document" size={20} color="#007AFF" />
                <Text style={styles.attachmentText}>{attachment.name}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderAutomotiveContext = () => {
    if (!message.automotiveContext) return null;

    const { diagnosticConfidence, toolsUsed, vehicleInfo, repairRecommendations } = message.automotiveContext;

    return (
      <View style={styles.automotiveContext}>
        {/* Diagnostic Confidence */}
        {diagnosticConfidence !== undefined && (
          <View style={styles.confidenceContainer}>
            <View
              style={[
                styles.confidenceIndicator,
                { backgroundColor: getConfidenceColor(diagnosticConfidence) }
              ]}
              testID="confidence-indicator"
            />
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(diagnosticConfidence * 100)}%
            </Text>
          </View>
        )}

        {/* Tools Used */}
        {toolsUsed && toolsUsed.length > 0 && (
          <View style={styles.toolsContainer} testID="tools-used-indicator">
            <Ionicons name="build" size={14} color="#666" />
            <Text style={styles.toolsText}>Tools Used: {toolsUsed.length}</Text>
          </View>
        )}

        {/* Vehicle Information */}
        {vehicleInfo && (
          <View style={styles.vehicleContainer}>
            <Text style={styles.vehicleText}>
              {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
            </Text>
            {vehicleInfo.vin && (
              <Text style={styles.vinText}>VIN: {vehicleInfo.vin}</Text>
            )}
          </View>
        )}

        {/* Repair Recommendations */}
        {repairRecommendations && repairRecommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>Recommendations:</Text>
            {repairRecommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendation}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationName}>{recommendation.name}</Text>
                  <Text style={styles.recommendationCost}>${recommendation.estimatedCost}</Text>
                </View>
                <Text style={styles.recommendationDescription}>
                  {recommendation.description}
                </Text>
                <View style={styles.urgencyContainer}>
                  <View
                    style={[
                      styles.urgencyIndicator,
                      {
                        backgroundColor:
                          recommendation.urgency === 'high' ? '#F44336' :
                          recommendation.urgency === 'medium' ? '#FF9800' : '#4CAF50'
                      }
                    ]}
                  />
                  <Text style={styles.urgencyText}>
                    {recommendation.urgency === 'high' ? 'High Priority' :
                     recommendation.urgency === 'medium' ? 'Medium Priority' : 'Low Priority'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMessageContent = () => (
    <View style={styles.messageContent}>
      {renderMessageText()}
      
      {renderAttachments()}
      {renderAutomotiveContext()}
      
      {showTimestamp && (
        <Text style={styles.timestamp}>
          {formatTime(message.timestamp)}
        </Text>
      )}
    </View>
  );

  if (isSystem) {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemMessageBubble} testID="message-bubble-system">
          {renderMessageContent()}
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
      onPress={onTimestampToggle}
      activeOpacity={0.7}
      accessibilityLabel={
        isUser 
          ? `User message: ${message.content}`
          : `AI message${message.automotiveContext?.diagnosticConfidence 
              ? ` with ${Math.round(message.automotiveContext.diagnosticConfidence * 100)}% confidence`
              : ''}: ${message.content}`
      }
    >
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.aiMessageBubble,
        ]}
        testID={isUser ? 'message-bubble-user' : 'message-bubble-ai'}
      >
        {renderMessageContent()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 8,
    pointerEvents: 'box-none', // Allow touches to pass through to children
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  messageBubble: {
    maxWidth: width * 0.8,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
  },
  aiMessageBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  systemMessageBubble: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  messageContent: {
    // No additional styles needed
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  userMessageText: {
    color: 'white',
  },
  systemMessageText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachment: {
    marginBottom: 4,
  },
  imageAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 8,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
  },
  attachmentText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  automotiveContext: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toolsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  vehicleContainer: {
    marginBottom: 8,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  vinText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendation: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  recommendationCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  recommendationDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  urgencyText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default MessageBubble;

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 8,
    pointerEvents: 'box-none', // Allow touches to pass through to children
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  messageBubble: {
    maxWidth: width * 0.8,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
  },
  aiMessageBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  systemMessageBubble: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  messageContent: {
    // No additional styles needed
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  userMessageText: {
    color: 'white',
  },
  systemMessageText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachment: {
    marginBottom: 4,
  },
  imageAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 8,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
  },
  attachmentText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  automotiveContext: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toolsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  vehicleContainer: {
    marginBottom: 8,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  vinText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendation: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  recommendationCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  recommendationDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  urgencyText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default MessageBubble;
