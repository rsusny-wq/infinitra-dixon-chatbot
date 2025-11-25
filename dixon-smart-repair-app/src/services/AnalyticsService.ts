/**
 * Advanced Analytics & Insights Service
 * Tracks usage patterns and provides diagnostic insights
 * Phase 4.2: Advanced Session Management Enhancements
 */

import { useSessionStore, SessionInfo, VehicleInfo } from '../stores/sessionStore';

interface AnalyticsEvent {
  type: 'session_created' | 'session_accessed' | 'vehicle_added' | 'vehicle_selected' | 'diagnostic_completed' | 'vin_processed';
  timestamp: Date;
  sessionId?: string;
  vehicleId?: string;
  metadata: Record<string, any>;
}

interface UsagePattern {
  mostActiveHours: number[];
  mostActiveDays: string[];
  averageSessionDuration: number;
  diagnosticAccuracyTrend: { date: string; accuracy: number }[];
  commonProblems: { problem: string; count: number; accuracy: number }[];
  vehicleUsageDistribution: { make: string; model: string; count: number }[];
}

interface DiagnosticInsight {
  type: 'accuracy_improvement' | 'common_issue' | 'vehicle_pattern' | 'usage_tip';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

interface PerformanceMetrics {
  totalSessions: number;
  totalVehicles: number;
  averageDiagnosticAccuracy: number;
  vinEnhancedSessions: number;
  mostUsedVehicle?: VehicleInfo;
  sessionGrowthRate: number;
  diagnosticSuccessRate: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 1000; // Keep last 1000 events

  constructor() {
    this.loadStoredEvents();
  }

  /**
   * Track an analytics event
   */
  trackEvent(
    type: AnalyticsEvent['type'],
    metadata: Record<string, any> = {},
    sessionId?: string,
    vehicleId?: string
  ): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: new Date(),
      sessionId,
      vehicleId,
      metadata
    };

    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    this.persistEvents();
    console.log('📊 Analytics event tracked:', type, metadata);
  }

  /**
   * Generate usage patterns analysis
   */
  generateUsagePatterns(): UsagePattern {
    const sessionStore = useSessionStore.getState();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter recent events
    const recentEvents = this.events.filter(e => e.timestamp >= thirtyDaysAgo);

    // Most active hours (0-23)
    const hourCounts = new Array(24).fill(0);
    recentEvents.forEach(event => {
      hourCounts[event.timestamp.getHours()]++;
    });
    const mostActiveHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    // Most active days
    const dayCounts: Record<string, number> = {};
    recentEvents.forEach(event => {
      const day = event.timestamp.toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const mostActiveDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

    // Average session duration (estimated from session access patterns)
    const sessionDurations = this.calculateSessionDurations();
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    // Diagnostic accuracy trend
    const diagnosticAccuracyTrend = this.calculateAccuracyTrend();

    // Common problems analysis
    const commonProblems = this.analyzeCommonProblems();

    // Vehicle usage distribution
    const vehicleUsageDistribution = this.analyzeVehicleUsage();

    return {
      mostActiveHours,
      mostActiveDays,
      averageSessionDuration,
      diagnosticAccuracyTrend,
      commonProblems,
      vehicleUsageDistribution
    };
  }

  /**
   * Generate diagnostic insights
   */
  generateDiagnosticInsights(): DiagnosticInsight[] {
    const insights: DiagnosticInsight[] = [];
    const sessionStore = useSessionStore.getState();
    const patterns = this.generateUsagePatterns();

    // VIN enhancement insight
    const vinEnhancedCount = sessionStore.sessions.filter(s => s.vinEnhanced).length;
    const totalSessions = sessionStore.sessions.length;
    const vinEnhancementRate = totalSessions > 0 ? vinEnhancedCount / totalSessions : 0;

    if (vinEnhancementRate < 0.3 && sessionStore.vehicles.length > 0) {
      insights.push({
        type: 'accuracy_improvement',
        title: 'Boost Your Diagnostic Accuracy',
        description: `You have ${sessionStore.vehicles.length} vehicles saved but only ${Math.round(vinEnhancementRate * 100)}% of your sessions use VIN data. Select a vehicle before starting diagnostics to get 95% accuracy instead of 65%.`,
        actionable: true,
        priority: 'high',
        data: { vinEnhancementRate, vehicleCount: sessionStore.vehicles.length }
      });
    }

    // Common issue pattern insight
    if (patterns.commonProblems.length > 0) {
      const topProblem = patterns.commonProblems[0];
      insights.push({
        type: 'common_issue',
        title: `Your Most Common Issue: ${topProblem.problem}`,
        description: `You've asked about "${topProblem.problem}" ${topProblem.count} times with ${topProblem.accuracy}% average accuracy. Consider saving this vehicle's VIN for more precise diagnostics.`,
        actionable: true,
        priority: 'medium',
        data: topProblem
      });
    }

    // Vehicle pattern insight
    if (patterns.vehicleUsageDistribution.length > 0) {
      const topVehicle = patterns.vehicleUsageDistribution[0];
      insights.push({
        type: 'vehicle_pattern',
        title: `${topVehicle.make} ${topVehicle.model} Expert`,
        description: `You frequently work on ${topVehicle.make} ${topVehicle.model} vehicles (${topVehicle.count} sessions). Consider exploring our ${topVehicle.make}-specific diagnostic guides.`,
        actionable: false,
        priority: 'low',
        data: topVehicle
      });
    }

    // Usage tip based on active hours
    if (patterns.mostActiveHours.length > 0) {
      const peakHour = patterns.mostActiveHours[0];
      const timeOfDay = peakHour < 12 ? 'morning' : peakHour < 17 ? 'afternoon' : 'evening';
      insights.push({
        type: 'usage_tip',
        title: `Peak ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Usage`,
        description: `You're most active around ${peakHour}:00. Consider scheduling complex diagnostics during your peak hours for better focus.`,
        actionable: false,
        priority: 'low',
        data: { peakHour, timeOfDay }
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate performance metrics
   */
  generatePerformanceMetrics(): PerformanceMetrics {
    const sessionStore = useSessionStore.getState();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Basic counts
    const totalSessions = sessionStore.sessions.length;
    const totalVehicles = sessionStore.vehicles.length;

    // Average diagnostic accuracy
    const accuracyValues = sessionStore.sessions
      .map(s => parseFloat(s.diagnosticAccuracy.replace('%', '')))
      .filter(acc => !isNaN(acc));
    const averageDiagnosticAccuracy = accuracyValues.length > 0
      ? accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length
      : 65;

    // VIN enhanced sessions
    const vinEnhancedSessions = sessionStore.sessions.filter(s => s.vinEnhanced).length;

    // Most used vehicle
    const vehicleUsage = sessionStore.vehicles
      .sort((a, b) => b.usageCount - a.usageCount);
    const mostUsedVehicle = vehicleUsage.length > 0 ? vehicleUsage[0] : undefined;

    // Session growth rate (last 30 days vs previous 30 days)
    const recentSessions = sessionStore.sessions.filter(s => 
      new Date(s.createdAt) >= thirtyDaysAgo
    ).length;
    const previousSessions = sessionStore.sessions.filter(s => {
      const createdAt = new Date(s.createdAt);
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;
    const sessionGrowthRate = previousSessions > 0 
      ? ((recentSessions - previousSessions) / previousSessions) * 100
      : 0;

    // Diagnostic success rate (sessions with messages > 2)
    const successfulSessions = sessionStore.sessions.filter(s => s.messageCount > 2).length;
    const diagnosticSuccessRate = totalSessions > 0 
      ? (successfulSessions / totalSessions) * 100
      : 0;

    return {
      totalSessions,
      totalVehicles,
      averageDiagnosticAccuracy,
      vinEnhancedSessions,
      mostUsedVehicle,
      sessionGrowthRate,
      diagnosticSuccessRate
    };
  }

  /**
   * Calculate session durations from events
   */
  private calculateSessionDurations(): number[] {
    const sessionDurations: number[] = [];
    const sessionEvents = this.events.filter(e => e.type === 'session_accessed');
    
    // Group events by session
    const sessionGroups: Record<string, AnalyticsEvent[]> = {};
    sessionEvents.forEach(event => {
      if (event.sessionId) {
        if (!sessionGroups[event.sessionId]) {
          sessionGroups[event.sessionId] = [];
        }
        sessionGroups[event.sessionId].push(event);
      }
    });

    // Calculate duration for each session
    Object.values(sessionGroups).forEach(events => {
      if (events.length >= 2) {
        events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const duration = events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime();
        sessionDurations.push(duration / 1000 / 60); // Convert to minutes
      }
    });

    return sessionDurations;
  }

  /**
   * Calculate diagnostic accuracy trend over time
   */
  private calculateAccuracyTrend(): { date: string; accuracy: number }[] {
    const sessionStore = useSessionStore.getState();
    const now = new Date();
    const trend: { date: string; accuracy: number }[] = [];

    // Group sessions by week for the last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekSessions = sessionStore.sessions.filter(s => {
        const sessionDate = new Date(s.createdAt);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });

      if (weekSessions.length > 0) {
        const weekAccuracy = weekSessions.reduce((sum, session) => {
          return sum + parseFloat(session.diagnosticAccuracy.replace('%', ''));
        }, 0) / weekSessions.length;

        trend.push({
          date: weekStart.toLocaleDateString(),
          accuracy: Math.round(weekAccuracy)
        });
      }
    }

    return trend;
  }

  /**
   * Analyze common problems from session titles
   */
  private analyzeCommonProblems(): { problem: string; count: number; accuracy: number }[] {
    const sessionStore = useSessionStore.getState();
    const problemCounts: Record<string, { count: number; totalAccuracy: number }> = {};

    sessionStore.sessions.forEach(session => {
      const title = session.title.toLowerCase();
      const accuracy = parseFloat(session.diagnosticAccuracy.replace('%', ''));

      // Extract problem keywords
      const keywords = ['brake', 'engine', 'transmission', 'battery', 'tire', 'oil', 'noise', 'vibration', 'leak', 'light'];
      keywords.forEach(keyword => {
        if (title.includes(keyword)) {
          if (!problemCounts[keyword]) {
            problemCounts[keyword] = { count: 0, totalAccuracy: 0 };
          }
          problemCounts[keyword].count++;
          problemCounts[keyword].totalAccuracy += accuracy;
        }
      });
    });

    return Object.entries(problemCounts)
      .map(([problem, data]) => ({
        problem: problem.charAt(0).toUpperCase() + problem.slice(1),
        count: data.count,
        accuracy: Math.round(data.totalAccuracy / data.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Analyze vehicle usage distribution
   */
  private analyzeVehicleUsage(): { make: string; model: string; count: number }[] {
    const sessionStore = useSessionStore.getState();
    const vehicleUsage: Record<string, number> = {};

    sessionStore.vehicles.forEach(vehicle => {
      const key = `${vehicle.make} ${vehicle.model}`;
      vehicleUsage[key] = vehicle.usageCount;
    });

    return Object.entries(vehicleUsage)
      .map(([vehicle, count]) => {
        const [make, model] = vehicle.split(' ');
        return { make, model, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Load stored events from localStorage
   */
  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('dixon-analytics-events');
      if (stored) {
        const events = JSON.parse(stored);
        this.events = events.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load stored analytics events:', error);
    }
  }

  /**
   * Persist events to localStorage
   */
  private persistEvents(): void {
    try {
      localStorage.setItem('dixon-analytics-events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to persist analytics events:', error);
    }
  }

  /**
   * Clear all analytics data
   */
  clearAnalyticsData(): void {
    this.events = [];
    localStorage.removeItem('dixon-analytics-events');
    console.log('🗑️ Analytics data cleared');
  }

  /**
   * Export analytics data
   */
  exportAnalyticsData(): any {
    return {
      events: this.events,
      usagePatterns: this.generateUsagePatterns(),
      insights: this.generateDiagnosticInsights(),
      performanceMetrics: this.generatePerformanceMetrics(),
      exportedAt: new Date().toISOString()
    };
  }
}

export default new AnalyticsService();
