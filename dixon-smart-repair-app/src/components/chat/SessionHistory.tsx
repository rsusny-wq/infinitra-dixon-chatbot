/**
 * Session History Component
 * ChatGPT-style session history for the sidebar
 * Phase 3: Frontend Session Management UI
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore, SessionInfo } from '../../stores/sessionStore';

interface SessionHistoryProps {
  onSessionSelect: (sessionId: string) => void;
  currentSessionId: string | null;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ onSessionSelect, currentSessionId }) => {
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

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteSession(sessionId)
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
      'This will permanently delete all your conversations and vehicle data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            clearAllData();
            setShowClearConfirm(false);
          }
        }
      ]
    );
  };

  const renderSessionItem = ({ item: session }: { item: SessionInfo }) => {
    const isActive = session.id === currentSessionId;
    const isEditing = editingSessionId === session.id;
    
    return (
      <TouchableOpacity
        style={[styles.sessionItem, isActive && styles.activeSession]}
        onPress={() => !isEditing && onSessionSelect(session.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionContent}>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editTitle}
              onChangeText={setEditTitle}
              onSubmitEditing={saveTitle}
              onBlur={saveTitle}
              autoFocus
              maxLength={50}
            />
          ) : (
            <>
              <Text style={[styles.sessionTitle, isActive && styles.activeSessionTitle]} numberOfLines={2}>
                {session.title}
              </Text>
              <View style={styles.sessionMeta}>
                <View style={styles.sessionStats}>
                  <Ionicons 
                    name="chatbubble-outline" 
                    size={12} 
                    color={isActive ? '#10a37f' : '#8e8ea0'} 
                  />
                  <Text style={[styles.sessionMetaText, isActive && styles.activeSessionMeta]}>
                    {session.messageCount}
                  </Text>
                  <Ionicons 
                    name="speedometer-outline" 
                    size={12} 
                    color={isActive ? '#10a37f' : '#8e8ea0'} 
                    style={{ marginLeft: 8 }}
                  />
                  <Text style={[styles.sessionMetaText, isActive && styles.activeSessionMeta]}>
                    {session.diagnosticAccuracy}
                  </Text>
                  {session.vinEnhanced && (
                    <Ionicons 
                      name="car-outline" 
                      size={12} 
                      color={isActive ? '#10a37f' : '#8e8ea0'} 
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </View>
                <Text style={[styles.sessionTime, isActive && styles.activeSessionMeta]}>
                  {(session.lastAccessed instanceof Date 
                    ? session.lastAccessed 
                    : new Date(session.lastAccessed)
                  ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </>
          )}
        </View>
        
        {!isEditing && (
          <View style={styles.sessionActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditTitle(session)}
            >
              <Ionicons name="pencil-outline" size={16} color="#8e8ea0" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteSession(session.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#8e8ea0" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGroupHeader = (groupName: string) => (
    <View style={styles.groupHeader}>
      <Text style={styles.groupHeaderText}>{groupName}</Text>
    </View>
  );

  if (!userProfile?.isAuthenticated) {
    return (
      <View style={styles.unauthenticatedContainer}>
        <Ionicons name="lock-closed-outline" size={48} color="#8e8ea0" />
        <Text style={styles.unauthenticatedTitle}>Sign in to save conversations</Text>
        <Text style={styles.unauthenticatedText}>
          Your conversations will be automatically saved and synced across devices when you sign in.
        </Text>
      </View>
    );
  }

  const groupedSessions = groupSessionsByDate(sessions);
  const groupNames = Object.keys(groupedSessions);

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={48} color="#8e8ea0" />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptyText}>
          Start a new conversation to see your chat history here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Conversations</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setShowClearConfirm(true)}
        >
          <Ionicons name="trash-outline" size={16} color="#8e8ea0" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={groupNames}
        keyExtractor={(item) => item}
        renderItem={({ item: groupName }) => (
          <View>
            {renderGroupHeader(groupName)}
            {groupedSessions[groupName].map(session => (
              <View key={session.id}>
                {renderSessionItem({ item: session })}
              </View>
            ))}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Clear confirmation modal */}
      <Modal
        visible={showClearConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear All Data</Text>
            <Text style={styles.modalText}>
              This will permanently delete all your conversations and vehicle data. This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowClearConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleClearAllData}
              >
                <Text style={styles.deleteButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  groupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f7f7f8',
  },
  groupHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8ea0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  activeSession: {
    backgroundColor: '#10a37f',
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  activeSessionTitle: {
    color: 'white',
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionMetaText: {
    fontSize: 11,
    color: '#8e8ea0',
    marginLeft: 4,
  },
  activeSessionMeta: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sessionTime: {
    fontSize: 11,
    color: '#8e8ea0',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  editInput: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    backgroundColor: 'white',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#10a37f',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8ea0',
    textAlign: 'center',
    lineHeight: 20,
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  unauthenticatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthenticatedText: {
    fontSize: 14,
    color: '#8e8ea0',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});

export default SessionHistory;
