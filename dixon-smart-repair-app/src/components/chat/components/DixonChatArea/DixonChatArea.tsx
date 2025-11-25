import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Platform,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import Dixon components
import DixonMessageBubble from '../DixonMessageBubble/DixonMessageBubble';

// Import styles
import { styles } from './DixonChatArea.styles';
import { DesignSystem } from '../../../../styles/designSystem';

// Types
interface DixonMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface User {
  givenName?: string;
  email?: string;
}

interface DixonChatAreaProps {
  messages: DixonMessage[];
  isLoading: boolean;
  onMenuToggle?: () => void;
  user?: User | null;
  isAuthenticated?: boolean;
  onEnsureInputVisible?: () => void;
  communicationMode?: 'ai' | 'mechanic'; // New prop for showing mode indicator
}

const DixonChatArea: React.FC<DixonChatAreaProps> = ({
  messages,
  isLoading,
  onMenuToggle,
  user,
  isAuthenticated = false,
  onEnsureInputVisible,
  communicationMode = 'ai',
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        // Ensure input remains visible after scrolling
        if (onEnsureInputVisible) {
          setTimeout(onEnsureInputVisible, 100);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, isLoading, isNearBottom, onEnsureInputVisible]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
    setIsNearBottom(true);
    // Ensure input remains visible after manual scroll
    if (onEnsureInputVisible) {
      setTimeout(onEnsureInputVisible, 200);
    }
  }, [onEnsureInputVisible]);

  // Handle scroll events to show/hide scroll button
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= 
                      contentSize.height - paddingToBottom;
    
    setIsNearBottom(isAtBottom);
    // Only show scroll button if content is scrollable and user is not at bottom
    const isScrollable = contentSize.height > layoutMeasurement.height;
    setShowScrollButton(isScrollable && !isAtBottom);
  }, []);

  // Render individual message item
  const renderMessage: ListRenderItem<DixonMessage> = useCallback(({ item }) => (
    <DixonMessageBubble message={item} />
  ), []);

  // Key extractor for FlatList performance
  const keyExtractor = useCallback((item: DixonMessage) => item.id, []);

  // Loading footer component
  const renderFooter = useCallback(() => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
          <Text style={styles.loadingText}>Dixon is thinking...</Text>
        </View>
      </View>
    );
  }, [isLoading]);

  // Empty state component
  const renderEmptyState = useCallback(() => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeBubble}>
        <Text style={styles.welcomeText}>
          👋 Welcome to Dixon Smart Repair!
        </Text>
        <Text style={styles.welcomeSubtext}>
          {isAuthenticated && user?.givenName 
            ? `Hello ${user.givenName}! I'm here to help you with your vehicle needs.`
            : "I'm here to help you with your vehicle needs."
          } Ask me about repairs, diagnostics, cost estimates, or anything automotive!
        </Text>
      </View>
    </View>
  ), [isAuthenticated, user?.givenName]);

  return (
    <View style={styles.container}>
      {/* Header with menu button (mobile only) */}
      {onMenuToggle && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuToggle}
            activeOpacity={0.7}
          >
            <Ionicons
              name="menu"
              size={DesignSystem.components.iconSize.md}
              color={DesignSystem.colors.gray700}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dixon Smart Repair</Text>
          
          {/* Communication Mode Indicator */}
          <View style={styles.modeIndicator}>
            <Ionicons 
              name={communicationMode === 'ai' ? 'sparkles' : 'person'} 
              size={14} 
              color={communicationMode === 'ai' ? DesignSystem.colors.primary : DesignSystem.colors.success} 
            />
            <Text style={[
              styles.modeText,
              { color: communicationMode === 'ai' ? DesignSystem.colors.primary : DesignSystem.colors.success }
            ]}>
              {communicationMode === 'ai' ? 'AI' : 'Mechanic'}
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Messages Area with FlatList for Better Performance */}
      <View style={[
        styles.messagesContainer,
        // Web-specific height constraint
        Platform.OS === 'web' && { height: '100%', maxHeight: '100%' }
      ]}>
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messagesContent}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          // Performance optimizations
          removeClippedSubviews={Platform.OS !== 'web'}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          // Better scrolling
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          // Web-specific optimizations
          {...(Platform.OS === 'web' && {
            nestedScrollEnabled: true,
          })}
        />
      </View>

      {/* Scroll to bottom button (only show when not at bottom and content is scrollable) */}
      {showScrollButton && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chevron-down"
            size={DesignSystem.components.iconSize.sm}
            color={DesignSystem.colors.white}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(DixonChatArea);
