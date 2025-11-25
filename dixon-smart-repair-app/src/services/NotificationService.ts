/**
 * Comprehensive Notification System
 * Real-time notifications and alerts for session management
 * Phase 4.4: Advanced Session Management Enhancements
 */

import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'diagnostic' | 'sync' | 'vehicle';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'diagnostic' | 'vehicle' | 'session' | 'sync' | 'security';
  expiresAt?: Date;
}

interface NotificationPreferences {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableInAppNotifications: boolean;
  categories: {
    system: boolean;
    diagnostic: boolean;
    vehicle: boolean;
    session: boolean;
    sync: boolean;
    security: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
  frequency: 'immediate' | 'batched' | 'daily';
}

interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  recentActivity: { date: string; count: number }[];
}

class NotificationService {
  private notifications: Notification[] = [];
  private preferences: NotificationPreferences;
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private client = generateClient();
  private readonly MAX_NOTIFICATIONS = 100;

  constructor() {
    this.preferences = this.loadPreferences();
    this.loadNotifications();
    this.setupPushNotifications();
  }

  /**
   * Add a new notification
   */
  addNotification(
    type: Notification['type'],
    title: string,
    message: string,
    options: Partial<Pick<Notification, 'actionable' | 'action' | 'metadata' | 'priority' | 'category' | 'expiresAt'>> = {}
  ): string {
    const notification: Notification = {
      id: this.generateNotificationId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      actionable: options.actionable || false,
      action: options.action,
      metadata: options.metadata || {},
      priority: options.priority || 'medium',
      category: options.category || 'system',
      expiresAt: options.expiresAt
    };

    // Check if notifications are enabled for this category
    if (!this.preferences.categories[notification.category]) {
      return notification.id;
    }

    // Check quiet hours
    if (this.isQuietHours() && notification.priority !== 'urgent') {
      // Store but don't show immediately
      this.notifications.unshift(notification);
      this.persistNotifications();
      return notification.id;
    }

    this.notifications.unshift(notification);

    // Keep only recent notifications
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }

    this.persistNotifications();
    this.notifyListeners();

    // Show push notification if enabled
    if (this.preferences.enablePushNotifications) {
      this.showPushNotification(notification);
    }

    console.log('🔔 Notification added:', notification.title);
    return notification.id;
  }

  /**
   * Add diagnostic completion notification
   */
  addDiagnosticNotification(
    sessionTitle: string,
    accuracy: string,
    vinEnhanced: boolean,
    vehicleInfo?: any
  ): void {
    const vehicleText = vehicleInfo 
      ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
      : 'your vehicle';

    this.addNotification(
      'diagnostic',
      'Diagnostic Complete',
      `${sessionTitle} analysis finished with ${accuracy} accuracy for ${vehicleText}`,
      {
        category: 'diagnostic',
        priority: 'medium',
        actionable: true,
        action: {
          label: 'View Results',
          handler: () => {
            // Navigate to session
            console.log('Navigate to diagnostic results');
          }
        },
        metadata: {
          sessionTitle,
          accuracy,
          vinEnhanced,
          vehicleInfo
        }
      }
    );
  }

  /**
   * Add VIN processing notification
   */
  addVinProcessingNotification(
    status: 'processing' | 'success' | 'error',
    vehicleInfo?: any,
    error?: string
  ): void {
    switch (status) {
      case 'processing':
        this.addNotification(
          'info',
          'Processing VIN',
          'Scanning and verifying your vehicle information...',
          {
            category: 'vehicle',
            priority: 'low'
          }
        );
        break;

      case 'success':
        const vehicle = vehicleInfo 
          ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
          : 'Vehicle';
        
        this.addNotification(
          'success',
          'VIN Verified Successfully',
          `${vehicle} has been verified and added to your library. Diagnostic accuracy upgraded to 95%!`,
          {
            category: 'vehicle',
            priority: 'medium',
            actionable: true,
            action: {
              label: 'View Vehicle',
              handler: () => {
                console.log('Navigate to vehicle library');
              }
            },
            metadata: { vehicleInfo }
          }
        );
        break;

      case 'error':
        this.addNotification(
          'error',
          'VIN Processing Failed',
          error || 'Unable to process VIN. Please try again or enter vehicle information manually.',
          {
            category: 'vehicle',
            priority: 'medium',
            actionable: true,
            action: {
              label: 'Try Again',
              handler: () => {
                console.log('Retry VIN processing');
              }
            }
          }
        );
        break;
    }
  }

  /**
   * Add session sync notification
   */
  addSyncNotification(
    type: 'sync_started' | 'sync_completed' | 'sync_conflict' | 'sync_error',
    details?: any
  ): void {
    switch (type) {
      case 'sync_started':
        this.addNotification(
          'info',
          'Syncing Sessions',
          'Synchronizing your sessions across devices...',
          {
            category: 'sync',
            priority: 'low'
          }
        );
        break;

      case 'sync_completed':
        const count = details?.syncedCount || 0;
        this.addNotification(
          'success',
          'Sync Complete',
          `Successfully synchronized ${count} sessions across your devices.`,
          {
            category: 'sync',
            priority: 'low',
            metadata: details
          }
        );
        break;

      case 'sync_conflict':
        this.addNotification(
          'warning',
          'Sync Conflict Detected',
          'Some sessions have conflicts between devices. Please review and resolve.',
          {
            category: 'sync',
            priority: 'high',
            actionable: true,
            action: {
              label: 'Resolve Conflicts',
              handler: () => {
                console.log('Navigate to conflict resolution');
              }
            },
            metadata: details
          }
        );
        break;

      case 'sync_error':
        this.addNotification(
          'error',
          'Sync Failed',
          details?.error || 'Unable to sync sessions. Check your connection and try again.',
          {
            category: 'sync',
            priority: 'medium',
            actionable: true,
            action: {
              label: 'Retry Sync',
              handler: () => {
                console.log('Retry sync');
              }
            }
          }
        );
        break;
    }
  }

  /**
   * Add vehicle library notification
   */
  addVehicleLibraryNotification(
    type: 'limit_reached' | 'vehicle_added' | 'vehicle_updated' | 'usage_milestone',
    details?: any
  ): void {
    switch (type) {
      case 'limit_reached':
        this.addNotification(
          'warning',
          'Vehicle Library Full',
          'You\'ve reached the 10-vehicle limit. Remove unused vehicles to add new ones.',
          {
            category: 'vehicle',
            priority: 'medium',
            actionable: true,
            action: {
              label: 'Manage Vehicles',
              handler: () => {
                console.log('Navigate to vehicle library');
              }
            }
          }
        );
        break;

      case 'vehicle_added':
        const vehicle = details?.vehicle;
        this.addNotification(
          'success',
          'Vehicle Added',
          `${vehicle?.year} ${vehicle?.make} ${vehicle?.model} has been added to your library.`,
          {
            category: 'vehicle',
            priority: 'low',
            metadata: { vehicle }
          }
        );
        break;

      case 'vehicle_updated':
        this.addNotification(
          'info',
          'Vehicle Updated',
          'Vehicle information has been updated successfully.',
          {
            category: 'vehicle',
            priority: 'low'
          }
        );
        break;

      case 'usage_milestone':
        const count = details?.usageCount || 0;
        const vehicleName = details?.vehicleName || 'Vehicle';
        this.addNotification(
          'info',
          'Usage Milestone',
          `${vehicleName} has been used ${count} times! Consider upgrading to VIN verification for better accuracy.`,
          {
            category: 'vehicle',
            priority: 'low',
            actionable: !details?.vinVerified,
            action: details?.vinVerified ? undefined : {
              label: 'Add VIN',
              handler: () => {
                console.log('Navigate to VIN verification');
              }
            }
          }
        );
        break;
    }
  }

  /**
   * Add system notification
   */
  addSystemNotification(
    type: 'maintenance' | 'update' | 'security' | 'performance',
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium'
  ): void {
    this.addNotification(
      type === 'security' ? 'warning' : 'info',
      title,
      message,
      {
        category: 'system',
        priority
      }
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.persistNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    let hasChanges = false;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.persistNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Remove notification
   */
  removeNotification(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.persistNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notifications = [];
    this.persistNotifications();
    this.notifyListeners();
  }

  /**
   * Clear expired notifications
   */
  clearExpiredNotifications(): void {
    const now = new Date();
    const initialCount = this.notifications.length;
    
    this.notifications = this.notifications.filter(notification => 
      !notification.expiresAt || notification.expiresAt > now
    );

    if (this.notifications.length !== initialCount) {
      this.persistNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    this.clearExpiredNotifications();
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Get notifications by category
   */
  getNotificationsByCategory(category: Notification['category']): Notification[] {
    return this.notifications.filter(n => n.category === category);
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): NotificationStats {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.read).length;

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    this.notifications.forEach(notification => {
      byCategory[notification.category] = (byCategory[notification.category] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });

    // Recent activity (last 7 days)
    const recentActivity: { date: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString();
      const count = this.notifications.filter(n => 
        n.timestamp.toLocaleDateString() === dateStr
      ).length;
      
      recentActivity.push({ date: dateStr, count });
    }

    return {
      total,
      unread,
      byCategory,
      byPriority,
      recentActivity
    };
  }

  /**
   * Update notification preferences
   */
  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.persistPreferences();
    console.log('🔔 Notification preferences updated');
  }

  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const startTime = this.parseTime(this.preferences.quietHours.start);
    const endTime = this.parseTime(this.preferences.quietHours.end);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 100 + minutes;
  }

  /**
   * Setup push notifications
   */
  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window)) return;

    if (this.preferences.enablePushNotifications) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.preferences.enablePushNotifications = false;
        this.persistPreferences();
      }
    }
  }

  /**
   * Show push notification
   */
  private showPushNotification(notification: Notification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      silent: notification.priority === 'low'
    };

    const pushNotification = new Notification(notification.title, options);
    
    pushNotification.onclick = () => {
      window.focus();
      if (notification.action) {
        notification.action.handler();
      }
      pushNotification.close();
    };

    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => pushNotification.close(), 5000);
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load default preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enablePushNotifications: true,
      enableEmailNotifications: false,
      enableInAppNotifications: true,
      categories: {
        system: true,
        diagnostic: true,
        vehicle: true,
        session: true,
        sync: true,
        security: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      frequency: 'immediate'
    };
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem('dixon-notification-preferences');
      if (stored) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
    return this.getDefaultPreferences();
  }

  /**
   * Persist preferences to localStorage
   */
  private persistPreferences(): void {
    try {
      localStorage.setItem('dixon-notification-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to persist notification preferences:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('dixon-notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        this.notifications = notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  /**
   * Persist notifications to localStorage
   */
  private persistNotifications(): void {
    try {
      localStorage.setItem('dixon-notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to persist notifications:', error);
    }
  }
}

export default new NotificationService();
