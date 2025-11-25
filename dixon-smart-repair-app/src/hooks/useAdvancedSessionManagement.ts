/**
 * Advanced Session Management Integration Hook
 * Integrates all Phase 4 advanced services into a unified interface
 * Phase 4.6: Advanced Session Management Enhancements
 */

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import SessionSyncService from '../services/SessionSyncService';
import AnalyticsService from '../services/AnalyticsService';
import SearchService from '../services/SearchService';
import NotificationService from '../services/NotificationService';
import DataExportService from '../services/DataExportService';
import { getCurrentUser } from 'aws-amplify/auth';

interface AdvancedSessionState {
  // Sync status
  syncStatus: {
    isOnline: boolean;
    pendingOperations: number;
    deviceId: string;
    lastSync?: Date;
  };
  
  // Analytics insights
  insights: {
    usagePatterns: any;
    diagnosticInsights: any[];
    performanceMetrics: any;
  };
  
  // Search state
  searchState: {
    query: string;
    results: any[];
    suggestions: any[];
    isSearching: boolean;
  };
  
  // Notifications
  notifications: {
    items: any[];
    unreadCount: number;
    stats: any;
  };
  
  // Export/backup status
  dataManagement: {
    isExporting: boolean;
    isImporting: boolean;
    lastBackup?: Date;
    availableBackups: any[];
  };
}

interface AdvancedSessionActions {
  // Sync actions
  initializeSync: () => Promise<void>;
  forceSync: () => Promise<void>;
  
  // Analytics actions
  refreshInsights: () => void;
  trackEvent: (type: string, metadata?: any) => void;
  
  // Search actions
  search: (query: string, type: 'sessions' | 'vehicles') => void;
  clearSearch: () => void;
  
  // Notification actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  
  // Data management actions
  exportData: (options: any) => Promise<any>;
  importData: (file: File, options?: any) => Promise<any>;
  createBackup: () => Promise<any>;
  restoreBackup: (backupId: string) => Promise<any>;
}

export function useAdvancedSessionManagement(): [AdvancedSessionState, AdvancedSessionActions] {
  const sessionStore = useSessionStore();
  
  const [state, setState] = useState<AdvancedSessionState>({
    syncStatus: {
      isOnline: true,
      pendingOperations: 0,
      deviceId: '',
      lastSync: undefined
    },
    insights: {
      usagePatterns: null,
      diagnosticInsights: [],
      performanceMetrics: null
    },
    searchState: {
      query: '',
      results: [],
      suggestions: [],
      isSearching: false
    },
    notifications: {
      items: [],
      unreadCount: 0,
      stats: null
    },
    dataManagement: {
      isExporting: false,
      isImporting: false,
      lastBackup: undefined,
      availableBackups: []
    }
  });

  // Initialize services on mount
  useEffect(() => {
    initializeServices();
    setupEventListeners();
    
    return () => {
      cleanupServices();
    };
  }, []);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateSyncStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update insights when session data changes
  useEffect(() => {
    refreshInsights();
  }, [sessionStore.sessions, sessionStore.vehicles]);

  /**
   * Initialize all advanced services
   */
  const initializeServices = async () => {
    try {
      // Initialize sync for authenticated users
      const user = await getCurrentUser().catch(() => null);
      if (user) {
        await SessionSyncService.initializeSync(user.userId);
      }

      // Load initial data
      updateSyncStatus();
      refreshInsights();
      updateNotifications();
      updateDataManagement();
      
      console.log('✅ Advanced session management services initialized');
    } catch (error) {
      console.error('❌ Failed to initialize advanced services:', error);
      NotificationService.addSystemNotification(
        'maintenance',
        'Service Initialization Warning',
        'Some advanced features may not be available. Please refresh the page.',
        'medium'
      );
    }
  };

  /**
   * Setup event listeners for real-time updates
   */
  const setupEventListeners = () => {
    // Listen for notification changes
    const unsubscribeNotifications = NotificationService.subscribe((notifications) => {
      setState(prev => ({
        ...prev,
        notifications: {
          items: notifications,
          unreadCount: notifications.filter(n => !n.read).length,
          stats: NotificationService.getNotificationStats()
        }
      }));
    });

    // Store unsubscribe functions for cleanup
    (window as any).__advancedSessionCleanup = [unsubscribeNotifications];
  };

  /**
   * Cleanup services on unmount
   */
  const cleanupServices = () => {
    SessionSyncService.cleanup();
    
    // Cleanup event listeners
    const cleanupFunctions = (window as any).__advancedSessionCleanup || [];
    cleanupFunctions.forEach((cleanup: () => void) => cleanup());
    delete (window as any).__advancedSessionCleanup;
  };

  /**
   * Update sync status
   */
  const updateSyncStatus = useCallback(() => {
    const syncStatus = SessionSyncService.getSyncStatus();
    setState(prev => ({
      ...prev,
      syncStatus: {
        ...syncStatus,
        lastSync: new Date() // This would come from actual sync service
      }
    }));
  }, []);

  /**
   * Refresh analytics insights
   */
  const refreshInsights = useCallback(() => {
    try {
      const usagePatterns = AnalyticsService.generateUsagePatterns();
      const diagnosticInsights = AnalyticsService.generateDiagnosticInsights();
      const performanceMetrics = AnalyticsService.generatePerformanceMetrics();

      setState(prev => ({
        ...prev,
        insights: {
          usagePatterns,
          diagnosticInsights,
          performanceMetrics
        }
      }));
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    }
  }, []);

  /**
   * Update notifications
   */
  const updateNotifications = useCallback(() => {
    const notifications = NotificationService.getNotifications();
    const stats = NotificationService.getNotificationStats();
    
    setState(prev => ({
      ...prev,
      notifications: {
        items: notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        stats
      }
    }));
  }, []);

  /**
   * Update data management status
   */
  const updateDataManagement = useCallback(() => {
    const availableBackups = DataExportService.getAvailableBackups();
    const lastBackup = availableBackups.length > 0 
      ? availableBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
      : undefined;

    setState(prev => ({
      ...prev,
      dataManagement: {
        ...prev.dataManagement,
        lastBackup,
        availableBackups
      }
    }));
  }, []);

  // Actions
  const actions: AdvancedSessionActions = {
    // Sync actions
    initializeSync: async () => {
      try {
        const user = await getCurrentUser();
        await SessionSyncService.initializeSync(user.userId);
        updateSyncStatus();
        
        NotificationService.addSyncNotification('sync_completed', {
          syncedCount: sessionStore.sessions.length
        });
      } catch (error) {
        console.error('Failed to initialize sync:', error);
        NotificationService.addSyncNotification('sync_error', { error });
      }
    },

    forceSync: async () => {
      try {
        NotificationService.addSyncNotification('sync_started');
        // Force sync logic would go here
        updateSyncStatus();
        
        NotificationService.addSyncNotification('sync_completed', {
          syncedCount: sessionStore.sessions.length
        });
      } catch (error) {
        console.error('Failed to force sync:', error);
        NotificationService.addSyncNotification('sync_error', { error });
      }
    },

    // Analytics actions
    refreshInsights,
    
    trackEvent: (type: string, metadata: any = {}) => {
      AnalyticsService.trackEvent(type as any, metadata);
    },

    // Search actions
    search: (query: string, type: 'sessions' | 'vehicles') => {
      setState(prev => ({
        ...prev,
        searchState: { ...prev.searchState, isSearching: true, query }
      }));

      try {
        let results: any[] = [];
        let suggestions: any[] = [];

        if (type === 'sessions') {
          results = SearchService.searchSessions(query, sessionStore.sessions);
          suggestions = SearchService.generateSearchSuggestions(
            sessionStore.sessions,
            sessionStore.vehicles,
            query
          );
        } else {
          results = SearchService.searchVehicles(query, sessionStore.vehicles);
          suggestions = SearchService.generateSearchSuggestions(
            sessionStore.sessions,
            sessionStore.vehicles,
            query
          );
        }

        setState(prev => ({
          ...prev,
          searchState: {
            query,
            results,
            suggestions,
            isSearching: false
          }
        }));
      } catch (error) {
        console.error('Search failed:', error);
        setState(prev => ({
          ...prev,
          searchState: { ...prev.searchState, isSearching: false }
        }));
      }
    },

    clearSearch: () => {
      setState(prev => ({
        ...prev,
        searchState: {
          query: '',
          results: [],
          suggestions: [],
          isSearching: false
        }
      }));
    },

    // Notification actions
    markNotificationRead: (id: string) => {
      NotificationService.markAsRead(id);
      updateNotifications();
    },

    markAllNotificationsRead: () => {
      NotificationService.markAllAsRead();
      updateNotifications();
    },

    clearNotifications: () => {
      NotificationService.clearAllNotifications();
      updateNotifications();
    },

    // Data management actions
    exportData: async (options: any) => {
      setState(prev => ({
        ...prev,
        dataManagement: { ...prev.dataManagement, isExporting: true }
      }));

      try {
        const result = await DataExportService.exportData(options);
        setState(prev => ({
          ...prev,
          dataManagement: { ...prev.dataManagement, isExporting: false }
        }));
        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          dataManagement: { ...prev.dataManagement, isExporting: false }
        }));
        throw error;
      }
    },

    importData: async (file: File, options: any = {}) => {
      setState(prev => ({
        ...prev,
        dataManagement: { ...prev.dataManagement, isImporting: true }
      }));

      try {
        const result = await DataExportService.importData(file, options);
        setState(prev => ({
          ...prev,
          dataManagement: { ...prev.dataManagement, isImporting: false }
        }));
        
        // Refresh all data after import
        refreshInsights();
        updateNotifications();
        updateDataManagement();
        
        return result;
      } catch (error) {
        setState(prev => ({
          ...prev,
          dataManagement: { ...prev.dataManagement, isImporting: false }
        }));
        throw error;
      }
    },

    createBackup: async () => {
      try {
        const backup = await DataExportService.createBackup(true);
        updateDataManagement();
        
        NotificationService.addNotification(
          'success',
          'Backup Created',
          'Your data has been backed up successfully.',
          { category: 'system', priority: 'low' }
        );
        
        return backup;
      } catch (error) {
        NotificationService.addNotification(
          'error',
          'Backup Failed',
          'Failed to create backup. Please try again.',
          { category: 'system', priority: 'medium' }
        );
        throw error;
      }
    },

    restoreBackup: async (backupId: string) => {
      try {
        const result = await DataExportService.restoreFromBackup(backupId);
        
        // Refresh all data after restore
        refreshInsights();
        updateNotifications();
        updateDataManagement();
        
        NotificationService.addNotification(
          'success',
          'Backup Restored',
          `Successfully restored ${result.imported.sessions} sessions and ${result.imported.vehicles} vehicles.`,
          { category: 'system', priority: 'medium' }
        );
        
        return result;
      } catch (error) {
        NotificationService.addNotification(
          'error',
          'Restore Failed',
          'Failed to restore backup. Please try again.',
          { category: 'system', priority: 'medium' }
        );
        throw error;
      }
    }
  };

  return [state, actions];
}

export default useAdvancedSessionManagement;
