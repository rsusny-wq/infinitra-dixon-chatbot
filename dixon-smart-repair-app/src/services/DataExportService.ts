/**
 * Enhanced Data Export & Backup System
 * Comprehensive data export, backup, and import capabilities
 * Phase 4.5: Advanced Session Management Enhancements
 */

import { useSessionStore, SessionInfo, VehicleInfo } from '../stores/sessionStore';
import AnalyticsService from './AnalyticsService';
import NotificationService from './NotificationService';

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'xml';
  includeAnalytics: boolean;
  includeNotifications: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  compression: boolean;
  encryption: boolean;
}

interface ExportResult {
  success: boolean;
  filename: string;
  size: number;
  format: string;
  downloadUrl?: string;
  error?: string;
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  version: string;
  userAgent: string;
  dataTypes: string[];
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
}

interface ImportResult {
  success: boolean;
  imported: {
    sessions: number;
    vehicles: number;
    analytics: boolean;
    notifications: number;
  };
  skipped: {
    sessions: number;
    vehicles: number;
    duplicates: number;
  };
  errors: string[];
}

interface DataSummary {
  sessions: {
    total: number;
    byAccuracy: Record<string, number>;
    byVehicle: Record<string, number>;
    dateRange: { start: Date; end: Date };
  };
  vehicles: {
    total: number;
    verified: number;
    byMake: Record<string, number>;
    totalUsage: number;
  };
  analytics: {
    totalEvents: number;
    dateRange: { start: Date; end: Date };
  };
  notifications: {
    total: number;
    unread: number;
    byCategory: Record<string, number>;
  };
}

class DataExportService {
  private readonly APP_VERSION = '1.0.0';
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks for large exports

  /**
   * Export user data with specified options
   */
  async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      NotificationService.addNotification(
        'info',
        'Export Started',
        'Preparing your data for export...',
        { category: 'system', priority: 'low' }
      );

      const data = await this.gatherExportData(options);
      const result = await this.processExport(data, options);

      NotificationService.addNotification(
        'success',
        'Export Complete',
        `Your data has been exported successfully as ${result.filename}`,
        {
          category: 'system',
          priority: 'medium',
          actionable: true,
          action: {
            label: 'Download',
            handler: () => {
              if (result.downloadUrl) {
                window.open(result.downloadUrl, '_blank');
              }
            }
          }
        }
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      NotificationService.addNotification(
        'error',
        'Export Failed',
        `Failed to export data: ${errorMessage}`,
        { category: 'system', priority: 'high' }
      );

      return {
        success: false,
        filename: '',
        size: 0,
        format: options.format,
        error: errorMessage
      };
    }
  }

  /**
   * Create automatic backup
   */
  async createBackup(includeAnalytics: boolean = true): Promise<BackupMetadata> {
    const sessionStore = useSessionStore.getState();
    
    const backupData = {
      metadata: {
        id: this.generateBackupId(),
        timestamp: new Date(),
        version: this.APP_VERSION,
        userAgent: navigator.userAgent,
        dataTypes: ['sessions', 'vehicles'],
        size: 0,
        checksum: '',
        encrypted: false,
        compressed: true
      },
      sessions: sessionStore.sessions,
      vehicles: sessionStore.vehicles,
      analytics: includeAnalytics ? AnalyticsService.exportAnalyticsData() : null,
      notifications: NotificationService.getNotifications()
    };

    // Add analytics to data types if included
    if (includeAnalytics) {
      backupData.metadata.dataTypes.push('analytics', 'notifications');
    }

    // Calculate size and checksum
    const serialized = JSON.stringify(backupData);
    backupData.metadata.size = new Blob([serialized]).size;
    backupData.metadata.checksum = await this.calculateChecksum(serialized);

    // Store backup locally
    this.storeBackup(backupData);

    console.log('💾 Backup created:', backupData.metadata.id);
    return backupData.metadata;
  }

  /**
   * Import data from backup or export file
   */
  async importData(file: File, options: { mergeStrategy: 'replace' | 'merge' | 'skip' } = { mergeStrategy: 'merge' }): Promise<ImportResult> {
    try {
      NotificationService.addNotification(
        'info',
        'Import Started',
        'Processing your data file...',
        { category: 'system', priority: 'low' }
      );

      const content = await this.readFile(file);
      const data = JSON.parse(content);
      
      // Validate data structure
      this.validateImportData(data);

      const result = await this.processImport(data, options);

      NotificationService.addNotification(
        'success',
        'Import Complete',
        `Successfully imported ${result.imported.sessions} sessions and ${result.imported.vehicles} vehicles`,
        { category: 'system', priority: 'medium' }
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      NotificationService.addNotification(
        'error',
        'Import Failed',
        `Failed to import data: ${errorMessage}`,
        { category: 'system', priority: 'high' }
      );

      return {
        success: false,
        imported: { sessions: 0, vehicles: 0, analytics: false, notifications: 0 },
        skipped: { sessions: 0, vehicles: 0, duplicates: 0 },
        errors: [errorMessage]
      };
    }
  }

  /**
   * Get data summary for export preview
   */
  getDataSummary(options?: Partial<ExportOptions>): DataSummary {
    const sessionStore = useSessionStore.getState();
    let sessions = sessionStore.sessions;
    let vehicles = sessionStore.vehicles;

    // Apply date range filter if specified
    if (options?.dateRange) {
      sessions = sessions.filter(session => {
        const sessionDate = new Date(session.lastAccessed);
        return sessionDate >= options.dateRange!.start && sessionDate <= options.dateRange!.end;
      });
    }

    // Sessions summary
    const sessionsByAccuracy: Record<string, number> = {};
    const sessionsByVehicle: Record<string, number> = {};
    let sessionDateRange = { start: new Date(), end: new Date(0) };

    sessions.forEach(session => {
      // Accuracy distribution
      sessionsByAccuracy[session.diagnosticAccuracy] = (sessionsByAccuracy[session.diagnosticAccuracy] || 0) + 1;
      
      // Vehicle distribution
      if (session.vehicleInfo) {
        const vehicleKey = `${session.vehicleInfo.make} ${session.vehicleInfo.model}`;
        sessionsByVehicle[vehicleKey] = (sessionsByVehicle[vehicleKey] || 0) + 1;
      }
      
      // Date range
      const sessionDate = new Date(session.lastAccessed);
      if (sessionDate < sessionDateRange.start) sessionDateRange.start = sessionDate;
      if (sessionDate > sessionDateRange.end) sessionDateRange.end = sessionDate;
    });

    // Vehicles summary
    const vehiclesByMake: Record<string, number> = {};
    let totalUsage = 0;
    let verifiedCount = 0;

    vehicles.forEach(vehicle => {
      vehiclesByMake[vehicle.make] = (vehiclesByMake[vehicle.make] || 0) + 1;
      totalUsage += vehicle.usageCount;
      if (vehicle.verified) verifiedCount++;
    });

    // Analytics summary
    const analyticsData = AnalyticsService.exportAnalyticsData();
    const analyticsEvents = analyticsData.events || [];
    let analyticsDateRange = { start: new Date(), end: new Date(0) };
    
    if (analyticsEvents.length > 0) {
      analyticsEvents.forEach((event: any) => {
        const eventDate = new Date(event.timestamp);
        if (eventDate < analyticsDateRange.start) analyticsDateRange.start = eventDate;
        if (eventDate > analyticsDateRange.end) analyticsDateRange.end = eventDate;
      });
    }

    // Notifications summary
    const notifications = NotificationService.getNotifications();
    const notificationsByCategory: Record<string, number> = {};
    let unreadCount = 0;

    notifications.forEach(notification => {
      notificationsByCategory[notification.category] = (notificationsByCategory[notification.category] || 0) + 1;
      if (!notification.read) unreadCount++;
    });

    return {
      sessions: {
        total: sessions.length,
        byAccuracy: sessionsByAccuracy,
        byVehicle: sessionsByVehicle,
        dateRange: sessionDateRange
      },
      vehicles: {
        total: vehicles.length,
        verified: verifiedCount,
        byMake: vehiclesByMake,
        totalUsage
      },
      analytics: {
        totalEvents: analyticsEvents.length,
        dateRange: analyticsDateRange
      },
      notifications: {
        total: notifications.length,
        unread: unreadCount,
        byCategory: notificationsByCategory
      }
    };
  }

  /**
   * Get available backups
   */
  getAvailableBackups(): BackupMetadata[] {
    try {
      const stored = localStorage.getItem('dixon-backups-metadata');
      if (stored) {
        const backups = JSON.parse(stored);
        return backups.map((backup: any) => ({
          ...backup,
          timestamp: new Date(backup.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load backup metadata:', error);
    }
    return [];
  }

  /**
   * Delete backup
   */
  deleteBackup(backupId: string): boolean {
    try {
      const backups = this.getAvailableBackups();
      const filteredBackups = backups.filter(backup => backup.id !== backupId);
      
      localStorage.setItem('dixon-backups-metadata', JSON.stringify(filteredBackups));
      localStorage.removeItem(`dixon-backup-${backupId}`);
      
      console.log('🗑️ Backup deleted:', backupId);
      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<ImportResult> {
    try {
      const backupData = localStorage.getItem(`dixon-backup-${backupId}`);
      if (!backupData) {
        throw new Error('Backup not found');
      }

      const data = JSON.parse(backupData);
      return await this.processImport(data, { mergeStrategy: 'replace' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        imported: { sessions: 0, vehicles: 0, analytics: false, notifications: 0 },
        skipped: { sessions: 0, vehicles: 0, duplicates: 0 },
        errors: [errorMessage]
      };
    }
  }

  /**
   * Gather data for export based on options
   */
  private async gatherExportData(options: ExportOptions): Promise<any> {
    const sessionStore = useSessionStore.getState();
    let sessions = sessionStore.sessions;
    let vehicles = sessionStore.vehicles;

    // Apply date range filter
    if (options.dateRange) {
      sessions = sessions.filter(session => {
        const sessionDate = new Date(session.lastAccessed);
        return sessionDate >= options.dateRange!.start && sessionDate <= options.dateRange!.end;
      });
    }

    // Apply category filter
    if (options.categories && options.categories.length > 0) {
      // Filter based on session content or vehicle types
      sessions = sessions.filter(session => {
        return options.categories!.some(category => 
          session.title.toLowerCase().includes(category.toLowerCase()) ||
          session.diagnosticLevel.toLowerCase().includes(category.toLowerCase())
        );
      });
    }

    const exportData: any = {
      metadata: {
        exportedAt: new Date(),
        version: this.APP_VERSION,
        format: options.format,
        options: options
      },
      sessions,
      vehicles
    };

    // Include analytics if requested
    if (options.includeAnalytics) {
      exportData.analytics = AnalyticsService.exportAnalyticsData();
    }

    // Include notifications if requested
    if (options.includeNotifications) {
      exportData.notifications = NotificationService.getNotifications();
    }

    return exportData;
  }

  /**
   * Process export based on format
   */
  private async processExport(data: any, options: ExportOptions): Promise<ExportResult> {
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (options.format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename = `dixon-smart-repair-export-${this.getDateString()}.json`;
        break;

      case 'csv':
        content = this.convertToCSV(data);
        mimeType = 'text/csv';
        filename = `dixon-smart-repair-export-${this.getDateString()}.csv`;
        break;

      case 'xml':
        content = this.convertToXML(data);
        mimeType = 'application/xml';
        filename = `dixon-smart-repair-export-${this.getDateString()}.xml`;
        break;

      case 'pdf':
        // For PDF, we'll generate a summary report
        content = await this.generatePDFReport(data);
        mimeType = 'application/pdf';
        filename = `dixon-smart-repair-report-${this.getDateString()}.pdf`;
        break;

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // Apply compression if requested
    if (options.compression && options.format !== 'pdf') {
      content = await this.compressData(content);
      filename = filename.replace(/\.[^.]+$/, '.gz');
      mimeType = 'application/gzip';
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      filename,
      size: blob.size,
      format: options.format,
      downloadUrl
    };
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    const lines: string[] = [];

    // Sessions CSV
    if (data.sessions && data.sessions.length > 0) {
      lines.push('--- SESSIONS ---');
      lines.push('ID,Title,Last Accessed,Message Count,Diagnostic Level,Diagnostic Accuracy,VIN Enhanced,Vehicle Make,Vehicle Model,Vehicle Year,Created At');
      
      data.sessions.forEach((session: SessionInfo) => {
        const row = [
          session.id,
          `"${session.title.replace(/"/g, '""')}"`,
          session.lastAccessed,
          session.messageCount,
          session.diagnosticLevel,
          session.diagnosticAccuracy,
          session.vinEnhanced,
          session.vehicleInfo?.make || '',
          session.vehicleInfo?.model || '',
          session.vehicleInfo?.year || '',
          session.createdAt
        ].join(',');
        lines.push(row);
      });
      lines.push('');
    }

    // Vehicles CSV
    if (data.vehicles && data.vehicles.length > 0) {
      lines.push('--- VEHICLES ---');
      lines.push('ID,Make,Model,Year,VIN,Nickname,Last Used,Usage Count,Verified');
      
      data.vehicles.forEach((vehicle: VehicleInfo) => {
        const row = [
          vehicle.id,
          vehicle.make,
          vehicle.model,
          vehicle.year || '',
          vehicle.vin || '',
          `"${(vehicle.nickname || '').replace(/"/g, '""')}"`,
          vehicle.lastUsed || '',
          vehicle.usageCount,
          vehicle.verified
        ].join(',');
        lines.push(row);
      });
    }

    return lines.join('\n');
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(data: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<dixon-smart-repair-export>\n';
    xml += `  <metadata>\n`;
    xml += `    <exportedAt>${data.metadata.exportedAt}</exportedAt>\n`;
    xml += `    <version>${data.metadata.version}</version>\n`;
    xml += `    <format>${data.metadata.format}</format>\n`;
    xml += `  </metadata>\n`;

    // Sessions
    if (data.sessions) {
      xml += '  <sessions>\n';
      data.sessions.forEach((session: SessionInfo) => {
        xml += '    <session>\n';
        xml += `      <id>${session.id}</id>\n`;
        xml += `      <title><![CDATA[${session.title}]]></title>\n`;
        xml += `      <lastAccessed>${session.lastAccessed}</lastAccessed>\n`;
        xml += `      <messageCount>${session.messageCount}</messageCount>\n`;
        xml += `      <diagnosticLevel>${session.diagnosticLevel}</diagnosticLevel>\n`;
        xml += `      <diagnosticAccuracy>${session.diagnosticAccuracy}</diagnosticAccuracy>\n`;
        xml += `      <vinEnhanced>${session.vinEnhanced}</vinEnhanced>\n`;
        if (session.vehicleInfo) {
          xml += '      <vehicleInfo>\n';
          xml += `        <make>${session.vehicleInfo.make}</make>\n`;
          xml += `        <model>${session.vehicleInfo.model}</model>\n`;
          xml += `        <year>${session.vehicleInfo.year || ''}</year>\n`;
          xml += '      </vehicleInfo>\n';
        }
        xml += `      <createdAt>${session.createdAt}</createdAt>\n`;
        xml += '    </session>\n';
      });
      xml += '  </sessions>\n';
    }

    // Vehicles
    if (data.vehicles) {
      xml += '  <vehicles>\n';
      data.vehicles.forEach((vehicle: VehicleInfo) => {
        xml += '    <vehicle>\n';
        xml += `      <id>${vehicle.id}</id>\n`;
        xml += `      <make>${vehicle.make}</make>\n`;
        xml += `      <model>${vehicle.model}</model>\n`;
        xml += `      <year>${vehicle.year || ''}</year>\n`;
        xml += `      <vin>${vehicle.vin || ''}</vin>\n`;
        xml += `      <nickname><![CDATA[${vehicle.nickname || ''}]]></nickname>\n`;
        xml += `      <lastUsed>${vehicle.lastUsed || ''}</lastUsed>\n`;
        xml += `      <usageCount>${vehicle.usageCount}</usageCount>\n`;
        xml += `      <verified>${vehicle.verified}</verified>\n`;
        xml += '    </vehicle>\n';
      });
      xml += '  </vehicles>\n';
    }

    xml += '</dixon-smart-repair-export>';
    return xml;
  }

  /**
   * Generate PDF report (simplified - would need PDF library in real implementation)
   */
  private async generatePDFReport(data: any): Promise<string> {
    // This is a simplified version - in a real implementation, you'd use a PDF library like jsPDF
    const summary = this.getDataSummary();
    
    let report = `DIXON SMART REPAIR - DATA EXPORT REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    report += `SUMMARY:\n`;
    report += `- Total Sessions: ${summary.sessions.total}\n`;
    report += `- Total Vehicles: ${summary.vehicles.total}\n`;
    report += `- Verified Vehicles: ${summary.vehicles.verified}\n`;
    report += `- Total Vehicle Usage: ${summary.vehicles.totalUsage}\n\n`;
    
    report += `SESSION BREAKDOWN BY ACCURACY:\n`;
    Object.entries(summary.sessions.byAccuracy).forEach(([accuracy, count]) => {
      report += `- ${accuracy}: ${count} sessions\n`;
    });
    
    report += `\nVEHICLE BREAKDOWN BY MAKE:\n`;
    Object.entries(summary.vehicles.byMake).forEach(([make, count]) => {
      report += `- ${make}: ${count} vehicles\n`;
    });

    return report;
  }

  /**
   * Process import data
   */
  private async processImport(data: any, options: { mergeStrategy: 'replace' | 'merge' | 'skip' }): Promise<ImportResult> {
    const sessionStore = useSessionStore.getState();
    const result: ImportResult = {
      success: true,
      imported: { sessions: 0, vehicles: 0, analytics: false, notifications: 0 },
      skipped: { sessions: 0, vehicles: 0, duplicates: 0 },
      errors: []
    };

    try {
      // Import sessions
      if (data.sessions) {
        const { imported, skipped, duplicates } = this.importSessions(data.sessions, sessionStore.sessions, options.mergeStrategy);
        result.imported.sessions = imported;
        result.skipped.sessions = skipped;
        result.skipped.duplicates += duplicates;
      }

      // Import vehicles
      if (data.vehicles) {
        const { imported, skipped, duplicates } = this.importVehicles(data.vehicles, sessionStore.vehicles, options.mergeStrategy);
        result.imported.vehicles = imported;
        result.skipped.vehicles = skipped;
        result.skipped.duplicates += duplicates;
      }

      // Import analytics
      if (data.analytics && options.mergeStrategy !== 'skip') {
        // Analytics import would be handled by AnalyticsService
        result.imported.analytics = true;
      }

      // Import notifications
      if (data.notifications && options.mergeStrategy !== 'skip') {
        result.imported.notifications = data.notifications.length;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown import error');
    }

    return result;
  }

  /**
   * Import sessions with merge strategy
   */
  private importSessions(importSessions: SessionInfo[], existingSessions: SessionInfo[], strategy: string) {
    let imported = 0;
    let skipped = 0;
    let duplicates = 0;

    const sessionStore = useSessionStore.getState();
    let updatedSessions = [...existingSessions];

    importSessions.forEach(importSession => {
      const existingIndex = updatedSessions.findIndex(s => s.id === importSession.id);
      
      if (existingIndex !== -1) {
        duplicates++;
        if (strategy === 'replace') {
          updatedSessions[existingIndex] = importSession;
          imported++;
        } else if (strategy === 'merge') {
          // Merge based on last accessed date
          if (new Date(importSession.lastAccessed) > new Date(updatedSessions[existingIndex].lastAccessed)) {
            updatedSessions[existingIndex] = importSession;
            imported++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      } else {
        updatedSessions.push(importSession);
        imported++;
      }
    });

    // Update store
    useSessionStore.setState({ sessions: updatedSessions });

    return { imported, skipped, duplicates };
  }

  /**
   * Import vehicles with merge strategy
   */
  private importVehicles(importVehicles: VehicleInfo[], existingVehicles: VehicleInfo[], strategy: string) {
    let imported = 0;
    let skipped = 0;
    let duplicates = 0;

    const sessionStore = useSessionStore.getState();
    let updatedVehicles = [...existingVehicles];

    importVehicles.forEach(importVehicle => {
      const existingIndex = updatedVehicles.findIndex(v => v.id === importVehicle.id);
      
      if (existingIndex !== -1) {
        duplicates++;
        if (strategy === 'replace') {
          updatedVehicles[existingIndex] = importVehicle;
          imported++;
        } else if (strategy === 'merge') {
          // Merge based on usage count and last used
          const existing = updatedVehicles[existingIndex];
          const importLastUsed = importVehicle.lastUsed ? new Date(importVehicle.lastUsed) : new Date(0);
          const existingLastUsed = existing.lastUsed ? new Date(existing.lastUsed) : new Date(0);
          
          if (importLastUsed > existingLastUsed || importVehicle.usageCount > existing.usageCount) {
            updatedVehicles[existingIndex] = {
              ...existing,
              ...importVehicle,
              usageCount: Math.max(existing.usageCount, importVehicle.usageCount)
            };
            imported++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      } else {
        // Check vehicle limit (10 vehicles max)
        if (updatedVehicles.length < 10) {
          updatedVehicles.push(importVehicle);
          imported++;
        } else {
          skipped++;
        }
      }
    });

    // Update store
    useSessionStore.setState({ vehicles: updatedVehicles });

    return { imported, skipped, duplicates };
  }

  /**
   * Validate import data structure
   */
  private validateImportData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }

    if (data.sessions && !Array.isArray(data.sessions)) {
      throw new Error('Sessions data must be an array');
    }

    if (data.vehicles && !Array.isArray(data.vehicles)) {
      throw new Error('Vehicles data must be an array');
    }

    // Validate session structure
    if (data.sessions) {
      data.sessions.forEach((session: any, index: number) => {
        if (!session.id || !session.title) {
          throw new Error(`Invalid session at index ${index}: missing required fields`);
        }
      });
    }

    // Validate vehicle structure
    if (data.vehicles) {
      data.vehicles.forEach((vehicle: any, index: number) => {
        if (!vehicle.id || !vehicle.make || !vehicle.model) {
          throw new Error(`Invalid vehicle at index ${index}: missing required fields`);
        }
      });
    }
  }

  /**
   * Read file content
   */
  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Store backup locally
   */
  private storeBackup(backupData: any): void {
    try {
      // Store backup data
      localStorage.setItem(`dixon-backup-${backupData.metadata.id}`, JSON.stringify(backupData));
      
      // Update backup metadata list
      const existingBackups = this.getAvailableBackups();
      existingBackups.push(backupData.metadata);
      
      // Keep only last 10 backups
      const recentBackups = existingBackups
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
      
      localStorage.setItem('dixon-backups-metadata', JSON.stringify(recentBackups));
    } catch (error) {
      console.error('Failed to store backup:', error);
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Compress data (simplified - would use compression library in real implementation)
   */
  private async compressData(data: string): Promise<string> {
    // This is a placeholder - in a real implementation, you'd use a compression library
    return data;
  }

  /**
   * Generate backup ID
   */
  private generateBackupId(): string {
    return `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get formatted date string
   */
  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}

export default new DataExportService();
