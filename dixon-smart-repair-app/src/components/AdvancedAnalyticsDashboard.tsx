/**
 * Advanced Analytics Dashboard Component
 * Displays comprehensive analytics and insights
 * Phase 4.7: Advanced Session Management Enhancements
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAdvancedSessionManagement from '../hooks/useAdvancedSessionManagement';

const { width } = Dimensions.get('window');

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <View style={[styles.metricCard, { borderLeftColor: color }]}>
    <View style={styles.metricHeader}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
    
    <Text style={styles.metricValue}>{value}</Text>
    
    {subtitle && (
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    )}
    
    {trend && (
      <View style={styles.trendContainer}>
        <Ionicons 
          name={trend.direction === 'up' ? 'trending-up' : trend.direction === 'down' ? 'trending-down' : 'remove'} 
          size={16} 
          color={trend.direction === 'up' ? '#10a37f' : trend.direction === 'down' ? '#ef4444' : '#6b7280'} 
        />
        <Text style={[
          styles.trendText,
          { color: trend.direction === 'up' ? '#10a37f' : trend.direction === 'down' ? '#ef4444' : '#6b7280' }
        ]}>
          {trend.value}
        </Text>
      </View>
    )}
  </View>
);

interface InsightCardProps {
  insight: {
    type: string;
    title: string;
    description: string;
    actionable: boolean;
    priority: 'low' | 'medium' | 'high';
  };
  onAction?: () => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onAction }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10a37f';
      default: return '#6b7280';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'accuracy_improvement': return 'trending-up';
      case 'common_issue': return 'warning';
      case 'vehicle_pattern': return 'car';
      case 'usage_tip': return 'bulb';
      default: return 'information-circle';
    }
  };

  return (
    <View style={[styles.insightCard, { borderLeftColor: getPriorityColor(insight.priority) }]}>
      <View style={styles.insightHeader}>
        <Ionicons 
          name={getInsightIcon(insight.type) as any} 
          size={20} 
          color={getPriorityColor(insight.priority)} 
        />
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) }]}>
          <Text style={styles.priorityText}>{insight.priority.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.insightDescription}>{insight.description}</Text>
      
      {insight.actionable && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>Take Action</Text>
          <Ionicons name="arrow-forward" size={16} color="#10a37f" />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface ChartData {
  label: string;
  value: number;
  color: string;
}

const SimpleBarChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartBars}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View 
              style={[
                styles.bar, 
                { 
                  height: (item.value / maxValue) * 100,
                  backgroundColor: item.color 
                }
              ]} 
            />
            <Text style={styles.barLabel}>{item.label}</Text>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [advancedState, advancedActions] = useAdvancedSessionManagement();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'insights' | 'patterns' | 'performance'>('overview');

  useEffect(() => {
    // Refresh insights when component mounts
    advancedActions.refreshInsights();
  }, []);

  const renderOverviewTab = () => {
    const metrics = advancedState.insights.performanceMetrics;
    if (!metrics) return <Text style={styles.loadingText}>Loading metrics...</Text>;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Sessions"
            value={metrics.totalSessions}
            subtitle="All time"
            icon="chatbubbles"
            color="#10a37f"
            trend={{
              direction: metrics.sessionGrowthRate > 0 ? 'up' : metrics.sessionGrowthRate < 0 ? 'down' : 'stable',
              value: `${Math.abs(metrics.sessionGrowthRate).toFixed(1)}%`
            }}
          />
          
          <MetricCard
            title="Vehicle Library"
            value={`${metrics.totalVehicles}/10`}
            subtitle={`${metrics.vinEnhancedSessions} VIN verified`}
            icon="car"
            color="#3b82f6"
          />
          
          <MetricCard
            title="Avg Accuracy"
            value={`${metrics.averageDiagnosticAccuracy.toFixed(1)}%`}
            subtitle="Diagnostic precision"
            icon="analytics"
            color="#f59e0b"
          />
          
          <MetricCard
            title="Success Rate"
            value={`${metrics.diagnosticSuccessRate.toFixed(1)}%`}
            subtitle="Completed diagnostics"
            icon="checkmark-circle"
            color="#10b981"
          />
        </View>

        {metrics.mostUsedVehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Used Vehicle</Text>
            <View style={styles.vehicleCard}>
              <Ionicons name="car" size={24} color="#10a37f" />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {metrics.mostUsedVehicle.year} {metrics.mostUsedVehicle.make} {metrics.mostUsedVehicle.model}
                </Text>
                <Text style={styles.vehicleUsage}>
                  {metrics.mostUsedVehicle.usageCount} sessions • {metrics.mostUsedVehicle.verified ? 'VIN Verified' : 'Basic Info'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderInsightsTab = () => {
    const insights = advancedState.insights.diagnosticInsights;
    
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Diagnostic Insights</Text>
        {insights.length === 0 ? (
          <Text style={styles.emptyText}>No insights available yet. Use the app more to generate insights!</Text>
        ) : (
          insights.map((insight, index) => (
            <InsightCard
              key={index}
              insight={insight}
              onAction={() => {
                // Handle insight action based on type
                console.log('Insight action:', insight.type);
              }}
            />
          ))
        )}
      </ScrollView>
    );
  };

  const renderPatternsTab = () => {
    const patterns = advancedState.insights.usagePatterns;
    if (!patterns) return <Text style={styles.loadingText}>Loading patterns...</Text>;

    const accuracyData = patterns.diagnosticAccuracyTrend.map((item: any, index: number) => ({
      label: `W${index + 1}`,
      value: item.accuracy,
      color: item.accuracy >= 80 ? '#10b981' : item.accuracy >= 65 ? '#f59e0b' : '#ef4444'
    }));

    const problemData = patterns.commonProblems.slice(0, 5).map((item: any, index: number) => ({
      label: item.problem.substring(0, 6),
      value: item.count,
      color: ['#10a37f', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index]
    }));

    return (
      <ScrollView style={styles.tabContent}>
        <SimpleBarChart data={accuracyData} title="Accuracy Trend (Last 8 Weeks)" />
        
        <SimpleBarChart data={problemData} title="Common Problems" />
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Patterns</Text>
          
          <View style={styles.patternItem}>
            <Ionicons name="time" size={20} color="#10a37f" />
            <View style={styles.patternInfo}>
              <Text style={styles.patternTitle}>Most Active Hours</Text>
              <Text style={styles.patternValue}>
                {patterns.mostActiveHours.map((hour: number) => `${hour}:00`).join(', ')}
              </Text>
            </View>
          </View>
          
          <View style={styles.patternItem}>
            <Ionicons name="calendar" size={20} color="#3b82f6" />
            <View style={styles.patternInfo}>
              <Text style={styles.patternTitle}>Most Active Days</Text>
              <Text style={styles.patternValue}>
                {patterns.mostActiveDays.join(', ')}
              </Text>
            </View>
          </View>
          
          <View style={styles.patternItem}>
            <Ionicons name="timer" size={20} color="#f59e0b" />
            <View style={styles.patternInfo}>
              <Text style={styles.patternTitle}>Avg Session Duration</Text>
              <Text style={styles.patternValue}>
                {Math.round(patterns.averageSessionDuration)} minutes
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPerformanceTab = () => {
    const syncStatus = advancedState.syncStatus;
    const notifications = advancedState.notifications;
    
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          
          <View style={styles.statusItem}>
            <Ionicons 
              name={syncStatus.isOnline ? "cloud-done" : "cloud-offline"} 
              size={20} 
              color={syncStatus.isOnline ? "#10b981" : "#ef4444"} 
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Sync Status</Text>
              <Text style={styles.statusValue}>
                {syncStatus.isOnline ? 'Online' : 'Offline'} • {syncStatus.pendingOperations} pending
              </Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons name="notifications" size={20} color="#3b82f6" />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Notifications</Text>
              <Text style={styles.statusValue}>
                {notifications.unreadCount} unread of {notifications.items.length} total
              </Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons name="phone-portrait" size={20} color="#f59e0b" />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Device ID</Text>
              <Text style={styles.statusValue}>
                {syncStatus.deviceId.substring(0, 16)}...
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <View style={styles.dataManagementActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => advancedActions.createBackup()}
            >
              <Ionicons name="save" size={24} color="#10a37f" />
              <Text style={styles.actionTitle}>Create Backup</Text>
              <Text style={styles.actionSubtitle}>
                Last: {advancedState.dataManagement.lastBackup?.toLocaleDateString() || 'Never'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                // Open export modal
                console.log('Open export modal');
              }}
            >
              <Ionicons name="download" size={24} color="#3b82f6" />
              <Text style={styles.actionTitle}>Export Data</Text>
              <Text style={styles.actionSubtitle}>JSON, CSV, PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverviewTab();
      case 'insights': return renderInsightsTab();
      case 'patterns': return renderPatternsTab();
      case 'performance': return renderPerformanceTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <TouchableOpacity onPress={() => advancedActions.refreshInsights()}>
          <Ionicons name="refresh" size={24} color="#10a37f" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: 'Overview', icon: 'analytics' },
          { key: 'insights', label: 'Insights', icon: 'bulb' },
          { key: 'patterns', label: 'Patterns', icon: 'trending-up' },
          { key: 'performance', label: 'System', icon: 'settings' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={selectedTab === tab.key ? '#10a37f' : '#6b7280'} 
            />
            <Text style={[
              styles.tabLabel,
              selectedTab === tab.key && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#10a37f',
  },
  tabLabel: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#10a37f',
  },
  tabContent: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    width: (width - 44) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  vehicleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  vehicleUsage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  insightDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10a37f',
  },
  actionButtonText: {
    color: '#10a37f',
    fontWeight: '600',
    marginRight: 4,
  },
  chartContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  patternInfo: {
    marginLeft: 12,
    flex: 1,
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  patternValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  dataManagementActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default AdvancedAnalyticsDashboard;
