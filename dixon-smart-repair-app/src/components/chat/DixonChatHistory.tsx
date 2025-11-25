/**
 * Dixon Chat History Component
 * ChatGPT-style session history for the new UI
 * Based on existing SessionHistory implementation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutomotiveUser } from '../../services/AuthService';
import { useSessionStore, SessionInfo } from '../../stores/sessionStore';
import { chatService } from '../../services/ChatService';
import { DesignSystem } from '../../styles/designSystem';

interface DixonChatHistoryProps {
  currentUser: AutomotiveUser | null;
  onBackToChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  currentSessionId: string | null;
}

export const DixonChatHistory: React.FC<DixonChatHistoryProps> = ({ 
  currentUser, 
  onBackToChat,
  onSessionSelect,
  currentSessionId
}) => {
  const {
    sessions,
    userProfile,
    deleteSession,
    updateSessionTitle,
    clearAllData
  } = useSessionStore();
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dynamoConversations, setDynamoConversations] = useState<SessionInfo[]>([]);

  // Load conversations from DynamoDB on component mount
  useEffect(() => {
    loadConversationsFromDynamoDB();
  }, [currentUser]);

  const loadConversationsFromDynamoDB = async () => {
    if (!currentUser?.userId) {
      console.log('💬 No authenticated user, skipping DynamoDB load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('💬 Loading last 10 conversations from DynamoDB for user:', currentUser.userId);
      
      const response = await chatService.getUserConversations(currentUser.userId, 10);
      
      if (response.success && response.conversations) {
        // Convert DynamoDB conversations to SessionInfo format
        const convertedConversations: SessionInfo[] = response.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title || 'New Chat',
          messages: [], // Don't load messages here for performance
          messageCount: conv.messageCount || 0,
          createdAt: new Date(conv.createdAt),
          lastAccessed: new Date(conv.lastAccessed),
          diagnosticLevel: conv.diagnosticLevel || 'quick',
          diagnosticAccuracy: conv.diagnosticAccuracy || '80%',
          vinEnhanced: conv.vinEnhanced || false,
          isActive: conv.isActive || false
        }));
        
        setDynamoConversations(convertedConversations);
        console.log('💬 Loaded', convertedConversations.length, 'conversations from DynamoDB');
      } else {
        console.error('💬 Failed to load conversations from DynamoDB:', response.error);
        // Show error but continue with local fallback
        Alert.alert(
          'Sync Issue',
          'Unable to load conversations from cloud. Showing local data instead.',
          [
            { text: 'Retry', onPress: () => loadConversationsFromDynamoDB() },
            { text: 'OK', style: 'cancel' }
          ]
        );
        setDynamoConversations([]);
      }
    } catch (error) {
      console.error('💬 Error loading conversations from DynamoDB:', error);
      // Show error but continue with local fallback
      Alert.alert(
        'Connection Error',
        'Unable to sync with cloud. Showing local conversations instead.',
        [
          { text: 'Retry', onPress: () => loadConversationsFromDynamoDB() },
          { text: 'OK', style: 'cancel' }
        ]
      );
      setDynamoConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversationsFromDynamoDB();
    setRefreshing(false);
  };

  // Use DynamoDB conversations if available, otherwise fall back to local sessions
  const displaySessions = dynamoConversations.length > 0 ? dynamoConversations : sessions;

  // Group sessions by date
  const groupSessionsByDate = (sessions: SessionInfo[]) => {
    const groups: { [key: string]: SessionInfo[] } = {};
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    sessions.forEach(session => {
      // Handle both Date objects and date strings (from localStorage persistence)
      const lastAccessedDate = session.lastAccessed instanceof Date 
        ? session.lastAccessed 
        : new Date(session.lastAccessed);
      
      const sessionDate = lastAccessedDate.toDateString();
      let groupKey: string;
      
      if (sessionDate === today) {
        groupKey = 'Today';
      } else if (sessionDate === yesterday) {
        groupKey = 'Yesterday';
      } else {
        const diffDays = Math.floor((now.getTime() - lastAccessedDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (diffDays <= 7) {
          groupKey = 'Previous 7 days';
        } else if (diffDays <= 30) {
          groupKey = 'Previous 30 days';
        } else {
          groupKey = lastAccessedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    });
    
    return groups;
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            // Check if this is a DynamoDB conversation or local session
            const isDynamoConversation = dynamoConversations.some(conv => conv.id === sessionId);
            
            if (isDynamoConversation) {
              try {
                console.log('💬 Deleting DynamoDB conversation:', sessionId);
                const result = await chatService.deleteConversation(sessionId);
                
                if (result.success) {
                  // Remove from local state
                  setDynamoConversations(prev => prev.filter(conv => conv.id !== sessionId));
                  Alert.alert('Success', 'Conversation deleted successfully');
                } else {
                  // Show the error message from the API
                  Alert.alert('Delete Failed', result.error || 'Failed to delete conversation');
                }
              } catch (error) {
                console.error('💬 Error deleting conversation:', error);
                Alert.alert('Error', 'An unexpected error occurred while deleting the conversation');
              }
            } else {
              // Delete local session normally
              deleteSession(sessionId);
            }
          }
        }
      ]
    );
  };

  const handleEditTitle = (session: SessionInfo) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveTitle = () => {
    if (editingSessionId && editTitle.trim()) {
      updateSessionTitle(editingSessionId, editTitle.trim());
    }
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your conversations, vehicles, and session data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            clearAllData();
            setShowClearConfirm(false);
            onBackToChat();
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversationsFromDynamoDB();
    setRefreshing(false);
  };

  const formatSessionTime = (date: Date | string): string => {
    try {
      const sessionDate = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - sessionDate.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return sessionDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: sessionDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getDiagnosticLevelIcon = (level: string) => {
    switch (level) {
      case 'quick':
        return 'flash';
      case 'vehicle':
        return 'car';
      case 'precision':
        return 'search';
      default:
        return 'chatbubble';
    }
  };

  const getDiagnosticLevelColor = (level: string) => {
    switch (level) {
      case 'quick':
        return DesignSystem.colors.orange500;
      case 'vehicle':
        return DesignSystem.colors.blue500;
      case 'precision':
        return DesignSystem.colors.green500;
      default:
        return DesignSystem.colors.gray500;
    }
  };

  const renderSessionCard = (session: SessionInfo) => (
    <TouchableOpacity
      key={session.id}
      style={[
        styles.sessionCard,
        session.id === currentSessionId && styles.activeSessionCard
      ]}
      onPress={() => onSessionSelect(session.id)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionMainInfo}>
          <Ionicons 
            name={getDiagnosticLevelIcon(session.diagnosticLevel)} 
            size={20} 
            color={getDiagnosticLevelColor(session.diagnosticLevel)} 
          />
          <View style={styles.sessionTextContainer}>
            {editingSessionId === session.id ? (
              <TextInput
                style={styles.editTitleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                onBlur={saveTitle}
                onSubmitEditing={saveTitle}
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <Text 
                style={[
                  styles.sessionTitle,
                  session.id === currentSessionId && styles.activeSessionTitle
                ]} 
                numberOfLines={2}
              >
                {session.title}
              </Text>
            )}
            <View style={styles.sessionMeta}>
              <Text style={styles.sessionTime}>
                {formatSessionTime(session.lastAccessed)}
              </Text>
              <Text style={styles.sessionMessages}>
                {session.messageCount} messages
              </Text>
              {session.vinEnhanced && (
                <View style={styles.vinBadge}>
                  <Text style={styles.vinBadgeText}>VIN</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.sessionMenuButton}
          onPress={() => handleEditTitle(session)}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={DesignSystem.colors.gray500} />
        </TouchableOpacity>
      </View>

      {session.diagnosticAccuracy && (
        <View style={styles.accuracyBadge}>
          <Text style={styles.accuracyText}>{session.diagnosticAccuracy} accuracy</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteSession(session.id)}
      >
        <Ionicons name="trash-outline" size={16} color={DesignSystem.colors.red500} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const sessionGroups = groupSessionsByDate(displaySessions);
  const groupKeys = Object.keys(sessionGroups).sort((a, b) => {
    // Sort groups by priority: Today, Yesterday, Previous 7 days, etc.
    const priority = ['Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days'];
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return b.localeCompare(a); // For month/year groups, sort reverse chronologically
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToChat} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DesignSystem.colors.gray600} />
          <Text style={styles.backText}>Back to Chat</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity 
          onPress={() => setShowClearConfirm(true)} 
          style={styles.clearButton}
        >
          <Ionicons name="trash" size={20} color={DesignSystem.colors.red500} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading recent conversations...</Text>
          </View>
        ) : displaySessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={DesignSystem.colors.gray400} />
            <Text style={styles.emptyTitle}>No Chat History</Text>
            <Text style={styles.emptyText}>
              Your conversation history will appear here as you chat with Dixon AI.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{displaySessions.length}</Text>
                <Text style={styles.statLabel}>Recent Chats</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {displaySessions.reduce((sum, session) => sum + session.messageCount, 0)}
                </Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {displaySessions.filter(s => s.vinEnhanced).length}
                </Text>
                <Text style={styles.statLabel}>VIN Enhanced</Text>
              </View>
            </View>

            {groupKeys.map(groupKey => (
              <View key={groupKey} style={styles.sessionGroup}>
                <Text style={styles.groupTitle}>{groupKey}</Text>
                {sessionGroups[groupKey].map(renderSessionCard)}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={showClearConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowClearConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Ionicons name="warning" size={48} color={DesignSystem.colors.red500} />
            <Text style={styles.confirmTitle}>Clear All Data?</Text>
            <Text style={styles.confirmText}>
              This will permanently delete all your conversations, vehicles, and session data. This action cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowClearConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleClearAllData}
              >
                <Text style={styles.confirmButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.gray200,
    backgroundColor: DesignSystem.colors.white,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: DesignSystem.colors.gray600,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    flex: 1,
    textAlign: 'center' as const,
  },
  clearButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
    minHeight: 400,
  },
  loadingText: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
    textAlign: 'center' as const,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: DesignSystem.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: DesignSystem.colors.gray600,
    marginTop: 4,
  },
  sessionGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray700,
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sessionCard: {
    backgroundColor: DesignSystem.colors.white,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
    position: 'relative' as const,
  },
  activeSessionCard: {
    borderColor: DesignSystem.colors.primary,
    borderWidth: 2,
  },
  sessionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  sessionMainInfo: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    flex: 1,
  },
  sessionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    lineHeight: 22,
  },
  activeSessionTitle: {
    color: DesignSystem.colors.primary,
  },
  editTitleInput: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sessionMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
  },
  sessionMessages: {
    fontSize: 12,
    color: DesignSystem.colors.gray500,
    marginLeft: 12,
  },
  vinBadge: {
    backgroundColor: DesignSystem.colors.green100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  vinBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: DesignSystem.colors.green700,
  },
  sessionMenuButton: {
    padding: 4,
  },
  accuracyBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: DesignSystem.colors.blue100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: DesignSystem.colors.blue700,
  },
  deleteButton: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  confirmModal: {
    backgroundColor: DesignSystem.colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center' as const,
    maxWidth: 320,
    width: '100%',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 16,
    color: DesignSystem.colors.gray600,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray300,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.gray700,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: DesignSystem.colors.red500,
    alignItems: 'center' as const,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: DesignSystem.colors.white,
  },
};
