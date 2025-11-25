/**
 * Workflow Kanban Board Component - Phase 2.2
 * Displays work authorization items in Kanban columns with time tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkAuthorization {
  id: string;
  mechanicRequestId: string;
  customerId: string;
  customerName: string;
  mechanicId: string;
  shopId: string;
  serviceType: string;
  urgency: 'low' | 'medium' | 'high';
  workflowStatus: 'assigned' | 'authorized' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  previousStatus: string;
  timeTracking: TimeTracking;
  estimatedDuration: number;
  estimatedCompletion: string;
  actualDuration?: number;
  actualCompletion?: string;
  customerNotified: boolean;
  lastCustomerUpdate?: string;
  originalRequestMessage: string;
  mechanicNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimeTracking {
  queued?: TimeStage;
  assigned?: TimeStage;
  authorized?: TimeStage;
  in_progress?: TimeStage;
  completed?: TimeStage;
}

interface TimeStage {
  startTime?: string;
  endTime?: string;
  duration?: number; // duration in minutes
}

interface KanbanColumn {
  status: string;
  items: WorkAuthorization[];
  count: number;
}

interface WorkflowStatistics {
  averageCompletionTime: number;
  completionRate: number;
  onTimeCompletionRate: number;
  totalCompleted: number;
  totalActive: number;
}

interface MechanicWorkflow {
  kanbanColumns: KanbanColumn[];
  statistics: WorkflowStatistics;
  totalItems: number;
}

interface WorkflowKanbanBoardProps {
  mechanicId: string;
  shopId: string;
  onWorkItemPress: (workItem: WorkAuthorization) => void;
  onStatusUpdate: (workItemId: string, newStatus: string, notes?: string) => void;
}

const WorkflowKanbanBoard: React.FC<WorkflowKanbanBoardProps> = ({
  mechanicId,
  shopId,
  onWorkItemPress,
  onStatusUpdate,
}) => {
  const [workflow, setWorkflow] = useState<MechanicWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflow();
  }, [mechanicId, shopId]);

  const loadWorkflow = async () => {
    try {
      setError(null);
      
      // TODO: Replace with actual GraphQL call when data is available
      // const result = await GraphQLService.getMechanicWorkflow(mechanicId, shopId);
      
      // Mock data for demonstration - shows the complete workflow structure
      const mockWorkflow: MechanicWorkflow = {
        kanbanColumns: [
          {
            status: 'assigned',
            count: 2,
            items: [
              {
                id: 'work_001',
                mechanicRequestId: 'req_001',
                customerId: 'customer_001',
                customerName: 'John Doe',
                mechanicId: mechanicId,
                shopId: shopId,
                serviceType: 'diagnostic',
                urgency: 'high',
                workflowStatus: 'assigned',
                previousStatus: 'queued',
                timeTracking: {
                  assigned: {
                    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    endTime: undefined,
                    duration: undefined,
                  },
                },
                estimatedDuration: 120,
                estimatedCompletion: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
                customerNotified: true,
                originalRequestMessage: 'My brakes are making a squealing noise when I stop',
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              },
              {
                id: 'work_002',
                mechanicRequestId: 'req_002',
                customerId: 'customer_002',
                customerName: 'Jane Smith',
                mechanicId: mechanicId,
                shopId: shopId,
                serviceType: 'repair',
                urgency: 'medium',
                workflowStatus: 'assigned',
                previousStatus: 'queued',
                timeTracking: {
                  assigned: {
                    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    endTime: undefined,
                    duration: undefined,
                  },
                },
                estimatedDuration: 180,
                estimatedCompletion: new Date(Date.now() + 165 * 60 * 1000).toISOString(),
                customerNotified: true,
                originalRequestMessage: 'Engine making strange rattling sound when accelerating',
                createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              },
            ],
          },
          {
            status: 'authorized',
            count: 1,
            items: [
              {
                id: 'work_003',
                mechanicRequestId: 'req_003',
                customerId: 'customer_003',
                customerName: 'Bob Johnson',
                mechanicId: mechanicId,
                shopId: shopId,
                serviceType: 'diagnostic',
                urgency: 'low',
                workflowStatus: 'authorized',
                previousStatus: 'assigned',
                timeTracking: {
                  assigned: {
                    startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    endTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    duration: 15,
                  },
                  authorized: {
                    startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    endTime: undefined,
                    duration: undefined,
                  },
                },
                estimatedDuration: 90,
                estimatedCompletion: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
                customerNotified: true,
                originalRequestMessage: 'Check engine light is on, car feels sluggish',
                createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              },
            ],
          },
          {
            status: 'in_progress',
            count: 1,
            items: [
              {
                id: 'work_004',
                mechanicRequestId: 'req_004',
                customerId: 'customer_004',
                customerName: 'Alice Brown',
                mechanicId: mechanicId,
                shopId: shopId,
                serviceType: 'repair',
                urgency: 'high',
                workflowStatus: 'in_progress',
                previousStatus: 'authorized',
                timeTracking: {
                  assigned: {
                    startTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
                    endTime: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
                    duration: 15,
                  },
                  authorized: {
                    startTime: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
                    endTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
                    duration: 15,
                  },
                  in_progress: {
                    startTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
                    endTime: undefined,
                    duration: undefined,
                  },
                },
                estimatedDuration: 150,
                estimatedCompletion: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                customerNotified: true,
                originalRequestMessage: 'Car won\'t start this morning, battery seems dead',
                mechanicNotes: 'Battery tested - needs replacement. Customer approved new battery installation.',
                createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
              },
            ],
          },
          {
            status: 'completed',
            count: 1,
            items: [
              {
                id: 'work_005',
                mechanicRequestId: 'req_005',
                customerId: 'customer_005',
                customerName: 'Mike Wilson',
                mechanicId: mechanicId,
                shopId: shopId,
                serviceType: 'diagnostic',
                urgency: 'medium',
                workflowStatus: 'completed',
                previousStatus: 'in_progress',
                timeTracking: {
                  assigned: {
                    startTime: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
                    endTime: new Date(Date.now() - 165 * 60 * 1000).toISOString(),
                    duration: 15,
                  },
                  authorized: {
                    startTime: new Date(Date.now() - 165 * 60 * 1000).toISOString(),
                    endTime: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
                    duration: 15,
                  },
                  in_progress: {
                    startTime: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
                    endTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    duration: 90,
                  },
                  completed: {
                    startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    endTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    duration: 0,
                  },
                },
                estimatedDuration: 120,
                estimatedCompletion: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                actualDuration: 120,
                actualCompletion: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                customerNotified: true,
                originalRequestMessage: 'Oil change and general inspection needed',
                mechanicNotes: 'Completed oil change and 21-point inspection. All systems normal.',
                createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              },
            ],
          },
          {
            status: 'on_hold',
            count: 0,
            items: [],
          },
          {
            status: 'cancelled',
            count: 0,
            items: [],
          },
        ],
        statistics: {
          averageCompletionTime: 135,
          completionRate: 85.5,
          onTimeCompletionRate: 92.3,
          totalCompleted: 12,
          totalActive: 4,
        },
        totalItems: 5,
      };

      setWorkflow(mockWorkflow);
    } catch (err: any) {
      console.error('Error loading workflow:', err);
      setError(err.message || 'Failed to load workflow');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkflow();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF4444';
      case 'medium': return '#FF8800';
      case 'low': return '#00AA00';
      default: return '#666666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#3498db';
      case 'authorized': return '#f39c12';
      case 'in_progress': return '#e74c3c';
      case 'completed': return '#27ae60';
      case 'on_hold': return '#95a5a6';
      case 'cancelled': return '#7f8c8d';
      default: return '#666666';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'authorized': return 'Authorized';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return `${Math.floor(diffMins / 1440)}d ago`;
    }
  };

  const renderWorkItem = (item: WorkAuthorization) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.workItem, { borderLeftColor: getUrgencyColor(item.urgency) }]}
      onPress={() => onWorkItemPress(item)}
    >
      <View style={styles.workItemHeader}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
          <Text style={styles.urgencyText}>{item.urgency.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.serviceType}>{item.serviceType}</Text>
      <Text style={styles.requestMessage} numberOfLines={2}>
        {item.originalRequestMessage}
      </Text>
      
      <View style={styles.workItemFooter}>
        <Text style={styles.timeInfo}>
          Created {formatTimeAgo(item.createdAt)}
        </Text>
        <Text style={styles.estimatedTime}>
          Est: {formatDuration(item.estimatedDuration)}
        </Text>
      </View>
      
      {item.mechanicNotes && (
        <View style={styles.notesContainer}>
          <Ionicons name="document-text" size={12} color="#666" />
          <Text style={styles.notesText} numberOfLines={1}>
            {item.mechanicNotes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderKanbanColumn = (column: KanbanColumn) => (
    <View key={column.status} style={styles.kanbanColumn}>
      <View style={[styles.columnHeader, { backgroundColor: getStatusColor(column.status) }]}>
        <Text style={styles.columnTitle}>{getStatusDisplayName(column.status)}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{column.count}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.columnContent} showsVerticalScrollIndicator={false}>
        {column.items.map(renderWorkItem)}
        {column.items.length === 0 && (
          <View style={styles.emptyColumn}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#ccc" />
            <Text style={styles.emptyText}>No items</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading workflow...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWorkflow}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!workflow) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No workflow data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Statistics Header */}
      <View style={styles.statisticsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workflow.statistics.totalActive}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workflow.statistics.totalCompleted}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(workflow.statistics.averageCompletionTime)}</Text>
          <Text style={styles.statLabel}>Avg Time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workflow.statistics.onTimeCompletionRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>On Time</Text>
        </View>
      </View>

      {/* Kanban Board */}
      <ScrollView
        horizontal
        style={styles.kanbanBoard}
        showsHorizontalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {workflow.kanbanColumns.map(renderKanbanColumn)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statisticsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  kanbanBoard: {
    flex: 1,
    paddingVertical: 16,
  },
  kanbanColumn: {
    width: 280,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  columnContent: {
    maxHeight: 500,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  workItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  workItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  urgencyBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  serviceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  requestMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  workItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    fontSize: 12,
    color: '#666',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  emptyColumn: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});

export default WorkflowKanbanBoard;
