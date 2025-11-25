/**
 * Real-time Session Synchronization Service
 * Handles cross-device session synchronization using AWS AppSync
 * Phase 4.1: Advanced Session Management Enhancements
 */

import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { useSessionStore } from '../stores/sessionStore';

interface SessionSyncEvent {
  type: 'SESSION_CREATED' | 'SESSION_UPDATED' | 'SESSION_DELETED' | 'VEHICLE_ADDED' | 'VEHICLE_UPDATED' | 'VEHICLE_DELETED';
  sessionId?: string;
  vehicleId?: string;
  userId: string;
  timestamp: string;
  data: any;
  deviceId: string;
}

interface SyncConflict {
  type: 'session' | 'vehicle';
  localData: any;
  remoteData: any;
  timestamp: string;
}

class SessionSyncService {
  private client = generateClient();
  private subscriptions: any[] = [];
  private deviceId: string;
  private isOnline: boolean = true;
  private pendingSync: SessionSyncEvent[] = [];
  private conflictResolver: ((conflicts: SyncConflict[]) => Promise<any[]>) | null = null;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.setupNetworkMonitoring();
  }

  /**
   * Initialize real-time synchronization for authenticated user
   */
  async initializeSync(userId: string): Promise<void> {
    try {
      // Subscribe to session changes for this user
      await this.subscribeToSessionChanges(userId);
      
      // Subscribe to vehicle library changes
      await this.subscribeToVehicleChanges(userId);
      
      // Perform initial sync
      await this.performInitialSync(userId);
      
      console.log('✅ Real-time session sync initialized for user:', userId);
    } catch (error) {
      console.error('❌ Failed to initialize session sync:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time session changes
   */
  private async subscribeToSessionChanges(userId: string): Promise<void> {
    const subscription = `
      subscription OnSessionChange($userId: String!) {
        onSessionChange(userId: $userId) {
          type
          sessionId
          userId
          timestamp
          data
          deviceId
        }
      }
    `;

    try {
      const sub = this.client.graphql({
        query: subscription,
        variables: { userId }
      }).subscribe({
        next: (event: any) => {
          this.handleSessionSyncEvent(event.data.onSessionChange);
        },
        error: (error: any) => {
          console.error('Session sync subscription error:', error);
          // Attempt to reconnect after delay
          setTimeout(() => this.subscribeToSessionChanges(userId), 5000);
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Failed to subscribe to session changes:', error);
    }
  }

  /**
   * Subscribe to real-time vehicle library changes
   */
  private async subscribeToVehicleChanges(userId: string): Promise<void> {
    const subscription = `
      subscription OnVehicleChange($userId: String!) {
        onVehicleChange(userId: $userId) {
          type
          vehicleId
          userId
          timestamp
          data
          deviceId
        }
      }
    `;

    try {
      const sub = this.client.graphql({
        query: subscription,
        variables: { userId }
      }).subscribe({
        next: (event: any) => {
          this.handleVehicleSyncEvent(event.data.onVehicleChange);
        },
        error: (error: any) => {
          console.error('Vehicle sync subscription error:', error);
          // Attempt to reconnect after delay
          setTimeout(() => this.subscribeToVehicleChanges(userId), 5000);
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Failed to subscribe to vehicle changes:', error);
    }
  }

  /**
   * Handle incoming session sync events
   */
  private handleSessionSyncEvent(event: SessionSyncEvent): void {
    // Ignore events from this device
    if (event.deviceId === this.deviceId) return;

    const sessionStore = useSessionStore.getState();

    switch (event.type) {
      case 'SESSION_CREATED':
        sessionStore.sessions.unshift(event.data);
        break;
        
      case 'SESSION_UPDATED':
        const sessionIndex = sessionStore.sessions.findIndex(s => s.id === event.sessionId);
        if (sessionIndex !== -1) {
          sessionStore.sessions[sessionIndex] = { ...sessionStore.sessions[sessionIndex], ...event.data };
        }
        break;
        
      case 'SESSION_DELETED':
        sessionStore.sessions = sessionStore.sessions.filter(s => s.id !== event.sessionId);
        break;
    }

    // Update the store
    useSessionStore.setState({ sessions: sessionStore.sessions });
    
    console.log('🔄 Session synced from remote device:', event.type, event.sessionId);
  }

  /**
   * Handle incoming vehicle sync events
   */
  private handleVehicleSyncEvent(event: SessionSyncEvent): void {
    // Ignore events from this device
    if (event.deviceId === this.deviceId) return;

    const sessionStore = useSessionStore.getState();

    switch (event.type) {
      case 'VEHICLE_ADDED':
        if (sessionStore.vehicles.length < 10) {
          sessionStore.vehicles.unshift(event.data);
        }
        break;
        
      case 'VEHICLE_UPDATED':
        const vehicleIndex = sessionStore.vehicles.findIndex(v => v.id === event.vehicleId);
        if (vehicleIndex !== -1) {
          sessionStore.vehicles[vehicleIndex] = { ...sessionStore.vehicles[vehicleIndex], ...event.data };
        }
        break;
        
      case 'VEHICLE_DELETED':
        sessionStore.vehicles = sessionStore.vehicles.filter(v => v.id !== event.vehicleId);
        break;
    }

    // Update the store
    useSessionStore.setState({ vehicles: sessionStore.vehicles });
    
    console.log('🚗 Vehicle synced from remote device:', event.type, event.vehicleId);
  }

  /**
   * Broadcast session change to other devices
   */
  async broadcastSessionChange(
    type: SessionSyncEvent['type'],
    sessionId: string,
    data: any
  ): Promise<void> {
    if (!this.isOnline) {
      this.pendingSync.push({
        type,
        sessionId,
        userId: await this.getCurrentUserId(),
        timestamp: new Date().toISOString(),
        data,
        deviceId: this.deviceId
      });
      return;
    }

    const mutation = `
      mutation BroadcastSessionChange($input: SessionChangeInput!) {
        broadcastSessionChange(input: $input) {
          success
          timestamp
        }
      }
    `;

    try {
      await this.client.graphql({
        query: mutation,
        variables: {
          input: {
            type,
            sessionId,
            userId: await this.getCurrentUserId(),
            timestamp: new Date().toISOString(),
            data: JSON.stringify(data),
            deviceId: this.deviceId
          }
        }
      });
    } catch (error) {
      console.error('Failed to broadcast session change:', error);
      // Add to pending sync for retry
      this.pendingSync.push({
        type,
        sessionId,
        userId: await this.getCurrentUserId(),
        timestamp: new Date().toISOString(),
        data,
        deviceId: this.deviceId
      });
    }
  }

  /**
   * Broadcast vehicle change to other devices
   */
  async broadcastVehicleChange(
    type: SessionSyncEvent['type'],
    vehicleId: string,
    data: any
  ): Promise<void> {
    if (!this.isOnline) {
      this.pendingSync.push({
        type,
        vehicleId,
        userId: await this.getCurrentUserId(),
        timestamp: new Date().toISOString(),
        data,
        deviceId: this.deviceId
      });
      return;
    }

    const mutation = `
      mutation BroadcastVehicleChange($input: VehicleChangeInput!) {
        broadcastVehicleChange(input: $input) {
          success
          timestamp
        }
      }
    `;

    try {
      await this.client.graphql({
        query: mutation,
        variables: {
          input: {
            type,
            vehicleId,
            userId: await this.getCurrentUserId(),
            timestamp: new Date().toISOString(),
            data: JSON.stringify(data),
            deviceId: this.deviceId
          }
        }
      });
    } catch (error) {
      console.error('Failed to broadcast vehicle change:', error);
      // Add to pending sync for retry
      this.pendingSync.push({
        type,
        vehicleId,
        userId: await this.getCurrentUserId(),
        timestamp: new Date().toISOString(),
        data,
        deviceId: this.deviceId
      });
    }
  }

  /**
   * Perform initial sync when coming online
   */
  private async performInitialSync(userId: string): Promise<void> {
    const query = `
      query GetUserSyncData($userId: String!) {
        getUserSyncData(userId: $userId) {
          sessions {
            id
            title
            lastAccessed
            messageCount
            diagnosticLevel
            diagnosticAccuracy
            vinEnhanced
            vehicleInfo
            isActive
            createdAt
          }
          vehicles {
            id
            make
            model
            year
            vin
            nickname
            lastUsed
            usageCount
            verified
          }
          lastSyncTimestamp
        }
      }
    `;

    try {
      const result = await this.client.graphql({
        query,
        variables: { userId }
      });

      const syncData = result.data.getUserSyncData;
      const sessionStore = useSessionStore.getState();

      // Merge remote data with local data
      const conflicts = this.detectConflicts(sessionStore, syncData);
      
      if (conflicts.length > 0 && this.conflictResolver) {
        const resolvedData = await this.conflictResolver(conflicts);
        this.applyResolvedData(resolvedData);
      } else {
        // No conflicts, apply remote data
        useSessionStore.setState({
          sessions: syncData.sessions,
          vehicles: syncData.vehicles
        });
      }

      console.log('✅ Initial sync completed');
    } catch (error) {
      console.error('Failed to perform initial sync:', error);
    }
  }

  /**
   * Detect conflicts between local and remote data
   */
  private detectConflicts(localData: any, remoteData: any): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    // Check session conflicts
    localData.sessions.forEach((localSession: any) => {
      const remoteSession = remoteData.sessions.find((s: any) => s.id === localSession.id);
      if (remoteSession && new Date(remoteSession.lastAccessed) > new Date(localSession.lastAccessed)) {
        conflicts.push({
          type: 'session',
          localData: localSession,
          remoteData: remoteSession,
          timestamp: remoteSession.lastAccessed
        });
      }
    });

    // Check vehicle conflicts
    localData.vehicles.forEach((localVehicle: any) => {
      const remoteVehicle = remoteData.vehicles.find((v: any) => v.id === localVehicle.id);
      if (remoteVehicle && new Date(remoteVehicle.lastUsed) > new Date(localVehicle.lastUsed)) {
        conflicts.push({
          type: 'vehicle',
          localData: localVehicle,
          remoteData: remoteVehicle,
          timestamp: remoteVehicle.lastUsed
        });
      }
    });

    return conflicts;
  }

  /**
   * Apply resolved conflict data
   */
  private applyResolvedData(resolvedData: any[]): void {
    const sessionStore = useSessionStore.getState();
    
    resolvedData.forEach(item => {
      if (item.type === 'session') {
        const index = sessionStore.sessions.findIndex(s => s.id === item.id);
        if (index !== -1) {
          sessionStore.sessions[index] = item;
        }
      } else if (item.type === 'vehicle') {
        const index = sessionStore.vehicles.findIndex(v => v.id === item.id);
        if (index !== -1) {
          sessionStore.vehicles[index] = item;
        }
      }
    });

    useSessionStore.setState({
      sessions: sessionStore.sessions,
      vehicles: sessionStore.vehicles
    });
  }

  /**
   * Setup network monitoring for offline/online handling
   */
  private setupNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processPendingSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      this.isOnline = navigator.onLine;
    }
  }

  /**
   * Process pending sync operations when coming back online
   */
  private async processPendingSync(): Promise<void> {
    if (this.pendingSync.length === 0) return;

    console.log(`🔄 Processing ${this.pendingSync.length} pending sync operations`);

    const operations = [...this.pendingSync];
    this.pendingSync = [];

    for (const operation of operations) {
      try {
        if (operation.sessionId) {
          await this.broadcastSessionChange(operation.type, operation.sessionId, operation.data);
        } else if (operation.vehicleId) {
          await this.broadcastVehicleChange(operation.type, operation.vehicleId, operation.data);
        }
      } catch (error) {
        console.error('Failed to process pending sync operation:', error);
        // Re-add to pending if it fails again
        this.pendingSync.push(operation);
      }
    }
  }

  /**
   * Set conflict resolver function
   */
  setConflictResolver(resolver: (conflicts: SyncConflict[]) => Promise<any[]>): void {
    this.conflictResolver = resolver;
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    const stored = localStorage.getItem('dixon-device-id');
    if (stored) return stored;

    const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('dixon-device-id', deviceId);
    return deviceId;
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const user = await getCurrentUser();
      return user.userId;
    } catch {
      return 'anonymous';
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    pendingOperations: number;
    deviceId: string;
  } {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.pendingSync.length,
      deviceId: this.deviceId
    };
  }
}

export default new SessionSyncService();
