import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MechanicReview } from './mechanic-review'
import MechanicService, { DiagnosticSession, ShopStatistics, MechanicRequest } from '../services/MechanicService'
import AuthService from '../services/AuthService'
// NEW: Phase 2.2 - Import workflow components
import WorkflowKanbanBoard from './WorkflowKanbanBoard'
import WorkItemDetailModal from './WorkItemDetailModal'
import SharedEstimateDetailModal from './SharedEstimateDetailModal'
import EstimateEditingModal from './EstimateEditingModal'

// NEW: Phase 2.2 - Add tab type including shared estimates
type TabType = 'reviews' | 'workflow' | 'shared-estimates'

export default function MechanicDashboard() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [reviewedSessions, setReviewedSessions] = useState<string[]>([])
  const [diagnosticSessions, setDiagnosticSessions] = useState<DiagnosticSession[]>([])
  const [shopStatistics, setShopStatistics] = useState<ShopStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // NEW: Shared estimates state
  const [mechanicRequests, setMechanicRequests] = useState<MechanicRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<MechanicRequest | null>(null)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [showEstimateModal, setShowEstimateModal] = useState(false)
  
  // NEW: Estimate editing state
  const [showEditingModal, setShowEditingModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState<MechanicRequest | null>(null)
  
  // NEW: Phase 2.2 - Workflow tab state
  const [activeTab, setActiveTab] = useState<TabType>('shared-estimates') // Default to shared estimates
  const [selectedWorkItem, setSelectedWorkItem] = useState<any>(null)
  const [showWorkItemModal, setShowWorkItemModal] = useState(false)
  const [mechanicId, setMechanicId] = useState<string>('')
  const [shopId, setShopId] = useState<string>('')

  // Load data on component mount
  useEffect(() => {
    loadMechanicData()
  }, [])

  // Load shared estimates when tab changes
  useEffect(() => {
    if (activeTab === 'shared-estimates' && shopId) {
      loadSharedEstimates()
    }
  }, [activeTab, shopId])

  const loadMechanicData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if user is authenticated and has mechanic/admin role
      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser) {
        setError('Please sign in to access the mechanic dashboard')
        return
      }

      if (currentUser.role !== 'mechanic' && currentUser.role !== 'admin') {
        setError('Access denied. Only mechanics and shop owners can access this dashboard.')
        return
      }

      // Get user's shop ID
      const userShopId = currentUser.shopId
      if (!userShopId) {
        setError('No shop associated with your account')
        return
      }

      // Update shop ID and mechanic ID state
      setShopId(userShopId)
      setMechanicId(currentUser.userId)

      // Load pending diagnoses and shop statistics
      const [diagnosesResult, statsResult] = await Promise.all([
        MechanicService.getPendingDiagnoses(userShopId),
        MechanicService.getShopStatistics(userShopId)
      ])

      if (diagnosesResult.success && diagnosesResult.data) {
        setDiagnosticSessions(diagnosesResult.data)
      } else {
        console.error('Failed to load diagnoses:', diagnosesResult.error)
      }

      if (statsResult.success && statsResult.data) {
        setShopStatistics(statsResult.data)
      } else {
        console.error('Failed to load statistics:', statsResult.error)
      }

      // Load shared estimates with the correct shop ID (avoid race condition)
      await loadSharedEstimates()

    } catch (err: any) {
      console.error('Error loading mechanic data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // NEW: Load shared estimates
  const loadSharedEstimates = async () => {
    if (!shopId) {
      console.warn('⚠️ No shopId available, skipping shared estimates load')
      return
    }
    
    try {
      setRequestsLoading(true)
      console.log('🔍 Loading shared estimates for shop:', shopId)

      const result = await MechanicService.getQueuedRequests(shopId)
      
      if (result.success && result.data) {
        console.log('✅ Loaded shared estimates:', result.data.length)
        setMechanicRequests(result.data)
      } else {
        console.error('❌ Failed to load shared estimates:', result.error)
        console.error('❌ Full result object:', result)
        setMechanicRequests([])
      }
    } catch (err: any) {
      console.error('❌ Error loading shared estimates:', err)
      console.error('❌ Error details:', err.errors || err.message)
      setMechanicRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }

  // NEW: Assign request to current mechanic
  const handleAssignRequest = async (request: MechanicRequest) => {
    try {
      console.log('🔧 Assigning request:', request.id)
      
      const result = await MechanicService.assignMechanicRequest(mechanicId, request.id)
      
      if (result.success) {
        Alert.alert('Success', 'Request assigned successfully!')
        loadSharedEstimates() // Reload to update status
      } else {
        Alert.alert('Error', result.error || 'Failed to assign request')
      }
    } catch (err: any) {
      console.error('Error assigning request:', err)
      Alert.alert('Error', 'Failed to assign request')
    }
  }

  // NEW: Update request status
  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      console.log('📝 Updating request status:', requestId, 'to:', status)
      
      const result = await MechanicService.updateRequestStatus(requestId, status)
      
      if (result.success) {
        Alert.alert('Success', 'Status updated successfully!')
        loadSharedEstimates() // Reload to update status
      } else {
        Alert.alert('Error', result.error || 'Failed to update status')
      }
    } catch (err: any) {
      console.error('Error updating status:', err)
      Alert.alert('Error', 'Failed to update status')
    }
  }

  const handleReviewApprove = async (review: any) => {
    try {
      console.log('Approved review:', review)
      
      const result = await MechanicService.reviewDiagnosis({
        sessionId: review.sessionId,
        status: review.status,
        modifiedDiagnosis: review.modifiedDiagnosis,
        modifiedCost: review.modifiedCost,
        mechanicNotes: review.mechanicNotes,
        recommendedUrgency: review.recommendedUrgency,
        additionalServices: review.additionalServices
      })

      if (result.success) {
        setReviewedSessions(prev => [...prev, review.sessionId])
        setSelectedSession(null)
        Alert.alert('Success', 'Review submitted successfully')
        // Reload data to reflect changes
        loadMechanicData()
      } else {
        Alert.alert('Error', result.error || 'Failed to submit review')
      }
    } catch (error: any) {
      console.error('Error submitting review:', error)
      Alert.alert('Error', error.message || 'Failed to submit review')
    }
  }

  const handleReviewReject = async (review: any) => {
    try {
      console.log('Rejected review:', review)
      
      const result = await MechanicService.reviewDiagnosis({
        sessionId: review.sessionId,
        status: 'rejected',
        mechanicNotes: review.mechanicNotes
      })

      if (result.success) {
        setReviewedSessions(prev => [...prev, review.sessionId])
        setSelectedSession(null)
        Alert.alert('Success', 'Review rejected successfully')
        // Reload data to reflect changes
        loadMechanicData()
      } else {
        Alert.alert('Error', result.error || 'Failed to reject review')
      }
    } catch (error: any) {
      console.error('Error rejecting review:', error)
      Alert.alert('Error', error.message || 'Failed to reject review')
    }
  }

  const handleRequestMoreInfo = async (request: any) => {
    try {
      console.log('Info request:', request)
      
      const result = await MechanicService.requestMoreInfo({
        sessionId: request.sessionId,
        requestType: request.requestType,
        message: request.message,
        urgency: request.urgency
      })

      if (result.success) {
        Alert.alert('Success', 'Information request sent to customer')
      } else {
        Alert.alert('Error', result.error || 'Failed to send request')
      }
    } catch (error: any) {
      console.error('Error requesting info:', error)
      Alert.alert('Error', error.message || 'Failed to send request')
    }
  }

  // NEW: Phase 2.2 - Workflow handlers
  const handleWorkItemPress = (workItem: any) => {
    setSelectedWorkItem(workItem)
    setShowWorkItemModal(true)
  }

  // NEW: Estimate editing handlers
  const handleEditEstimate = (request: MechanicRequest) => {
    setEditingRequest(request)
    setShowEditingModal(true)
    setShowEstimateModal(false) // Close detail modal
  }

  const handleSaveEditedEstimate = async (modifiedEstimate: any, mechanicNotes: string) => {
    try {
      console.log('Saving edited estimate:', { modifiedEstimate, mechanicNotes })
      
      if (!editingRequest) {
        throw new Error('No request selected for editing')
      }

      const result = await MechanicService.updateModifiedEstimate(
        editingRequest.id,
        modifiedEstimate,
        mechanicNotes,
        mechanicId
      )

      if (result.success) {
        Alert.alert(
          'Estimate Updated',
          'The estimate has been modified and sent back to the customer for approval.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowEditingModal(false)
                setEditingRequest(null)
                // Reload estimates to show updated status
                loadSharedEstimates()
              }
            }
          ]
        )
      } else {
        throw new Error(result.error || 'Failed to save estimate changes')
      }
      
    } catch (error: any) {
      console.error('Error saving edited estimate:', error)
      Alert.alert('Error', error.message || 'Failed to save estimate changes')
    }
  }

  const handleStatusUpdate = async (workItemId: string, newStatus: string, notes?: string) => {
    try {
      console.log('Updating work item status:', { workItemId, newStatus, notes })
      
      // In production, would call GraphQL mutation
      // For now, simulate success
      Alert.alert('Success', `Status updated to ${newStatus}`)
      
      // Close modal
      setShowWorkItemModal(false)
      setSelectedWorkItem(null)
      
    } catch (error: any) {
      console.error('Error updating status:', error)
      throw error
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return '#6b7280'
      case 'assigned': return '#2563eb'
      case 'active': return '#ea580c'
      case 'completed': return '#16a34a'
      case 'cancelled': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getGuidanceLevelInfo = (level: string) => {
    switch (level) {
      case 'generic':
        return { icon: 'flash', label: 'Generic', color: '#16a34a' }
      case 'basic':
        return { icon: 'car', label: 'Basic Info', color: '#ea580c' }
      case 'vin':
        return { icon: 'scan', label: 'VIN-Based', color: '#7c3aed' }
      default:
        return { icon: 'help-circle', label: 'Unknown', color: '#6b7280' }
    }
  }

  if (selectedSession) {
    const session = diagnosticSessions.find(s => s.id === selectedSession)
    if (session) {
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setSelectedSession(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
              <Text style={styles.backText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
          
          <MechanicReview
            diagnosticSession={session}
            onApprove={handleReviewApprove}
            onReject={handleReviewReject}
            onRequestMoreInfo={handleRequestMoreInfo}
          />
        </View>
      )
    }
  }

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#10a37f" />
        <Text style={styles.loadingText}>Loading mechanic dashboard...</Text>
      </View>
    )
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle" size={48} color="#dc2626" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMechanicData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mechanic Dashboard</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'reviews' ? 'Diagnostic Reviews Pending' : 
           activeTab === 'workflow' ? 'Work Authorization Workflow' :
           'Shared Cost Estimates'}
        </Text>
      </View>

      {/* NEW: Phase 2.2 - Tab Navigation with Shared Estimates */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shared-estimates' && styles.activeTab]}
          onPress={() => setActiveTab('shared-estimates')}
        >
          <Ionicons 
            name="receipt" 
            size={20} 
            color={activeTab === 'shared-estimates' ? '#007AFF' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'shared-estimates' && styles.activeTabText]}>
            Estimates
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Ionicons 
            name="document-text" 
            size={20} 
            color={activeTab === 'reviews' ? '#007AFF' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Reviews
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workflow' && styles.activeTab]}
          onPress={() => setActiveTab('workflow')}
        >
          <Ionicons 
            name="git-network" 
            size={20} 
            color={activeTab === 'workflow' ? '#007AFF' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'workflow' && styles.activeTabText]}>
            Workflow
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'shared-estimates' ? (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{mechanicRequests.length}</Text>
              <Text style={styles.statLabel}>Shared Estimates</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {mechanicRequests.filter(r => r.status === 'queued').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {mechanicRequests.filter(r => r.urgency === 'high').length}
              </Text>
              <Text style={styles.statLabel}>High Priority</Text>
            </View>
          </View>

          {/* Shared Estimates List */}
          <ScrollView style={styles.sessionsList}>
            {requestsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading shared estimates...</Text>
              </View>
            ) : mechanicRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No shared estimates</Text>
                <Text style={styles.emptySubtext}>
                  Customers haven't shared any cost estimates yet
                </Text>
              </View>
            ) : (
              mechanicRequests.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={[
                    styles.sessionCard,
                    request.status === 'assigned' && styles.assignedCard
                  ]}
                  onPress={() => {
                    setSelectedRequest(request);
                    setShowEstimateModal(true);
                  }}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>
                        {request.sharedEstimate?.repairDescription || 'Cost Estimate Review'}
                      </Text>
                      <Text style={styles.sessionVehicle}>
                        {request.sharedEstimate?.vehicleInfo ? 
                          `${request.sharedEstimate.vehicleInfo.year} ${request.sharedEstimate.vehicleInfo.make} ${request.sharedEstimate.vehicleInfo.model}` :
                          'Vehicle info not available'
                        }
                      </Text>
                      <Text style={styles.sessionTime}>
                        {new Date(request.createdAt).toLocaleString()} - {request.customerName}
                      </Text>
                      {request.customerComment && (
                        <Text style={styles.customerComment}>
                          💬 "{request.customerComment}"
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.sessionBadges}>
                      <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(request.urgency) }]}>
                        <Text style={styles.urgencyText}>{request.urgency.toUpperCase()}</Text>
                      </View>
                      
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                        <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>

                  {request.sharedEstimate && (
                    <View style={styles.sessionDetails}>
                      <View style={styles.estimateContainer}>
                        <Text style={styles.estimateLabel}>Total Cost:</Text>
                        <Text style={styles.estimateText}>
                          ${request.sharedEstimate.breakdown.total.toFixed(2)}
                        </Text>
                      </View>
                      
                      <View style={styles.estimateBreakdown}>
                        <Text style={styles.breakdownItem}>
                          Parts: ${request.sharedEstimate.breakdown.parts.total.toFixed(2)}
                        </Text>
                        <Text style={styles.breakdownItem}>
                          Labor: ${request.sharedEstimate.breakdown.labor.total.toFixed(2)} 
                          ({request.sharedEstimate.breakdown.labor.totalHours}h)
                        </Text>
                        <Text style={styles.breakdownItem}>
                          Shop Fees: ${request.sharedEstimate.breakdown.shopFees.total.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.actionButtons}>
                        {request.status === 'queued' && (
                          <TouchableOpacity
                            style={styles.assignButton}
                            onPress={() => handleAssignRequest(request)}
                          >
                            <Ionicons name="person-add" size={16} color="#fff" />
                            <Text style={styles.assignButtonText}>Assign to Me</Text>
                          </TouchableOpacity>
                        )}
                        
                        {request.status === 'assigned' && request.assignedMechanicId === mechanicId && (
                          <>
                            <TouchableOpacity
                              style={styles.activeButton}
                              onPress={() => handleUpdateStatus(request.id, 'active')}
                            >
                              <Ionicons name="play" size={16} color="#fff" />
                              <Text style={styles.activeButtonText}>Start Work</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={styles.completeButton}
                              onPress={() => handleUpdateStatus(request.id, 'completed')}
                            >
                              <Ionicons name="checkmark" size={16} color="#fff" />
                              <Text style={styles.completeButtonText}>Complete</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      ) : activeTab === 'reviews' ? (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{diagnosticSessions.length}</Text>
              <Text style={styles.statLabel}>Pending Reviews</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{shopStatistics?.totalCompletedToday || 0}</Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {shopStatistics?.highPriorityCount || 0}
              </Text>
              <Text style={styles.statLabel}>High Priority</Text>
            </View>
          </View>

          {/* Diagnostic Sessions List */}
          <ScrollView style={styles.sessionsList}>
            {diagnosticSessions.map((session) => {
              const isReviewed = reviewedSessions.includes(session.id)
              const guidanceInfo = getGuidanceLevelInfo(session.vehicleInfo?.vin ? 'vin' : 'basic')
              
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, isReviewed && styles.reviewedCard]}
                  onPress={() => !isReviewed && setSelectedSession(session.id)}
                  disabled={isReviewed}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>
                        {session.aiDiagnosis.primaryDiagnosis.issue}
                      </Text>
                      <Text style={styles.sessionVehicle}>
                        {session.vehicleInfo ? 
                          `${session.vehicleInfo.year} ${session.vehicleInfo.make} ${session.vehicleInfo.model}` :
                          'Vehicle info limited'
                        }
                      </Text>
                      <Text style={styles.sessionTime}>
                        {new Date(session.createdAt).toLocaleTimeString()} - Customer: {session.customerId}
                      </Text>
                    </View>
                    
                    <View style={styles.sessionBadges}>
                      <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(session.urgency) }]}>
                        <Text style={styles.urgencyText}>{session.urgency.toUpperCase()}</Text>
                      </View>
                      
                      <View style={[styles.guidanceBadge, { backgroundColor: guidanceInfo.color }]}>
                        <Ionicons name={guidanceInfo.icon as any} size={12} color="#ffffff" />
                        <Text style={styles.guidanceText}>{guidanceInfo.label}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.sessionDetails}>
                    <View style={styles.confidenceContainer}>
                      <Text style={styles.confidenceLabel}>AI Confidence:</Text>
                      <View style={styles.confidenceBar}>
                        <View 
                          style={[
                            styles.confidenceFill, 
                            { width: `${session.aiDiagnosis.primaryDiagnosis.confidence}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.confidenceText}>
                        {session.aiDiagnosis.primaryDiagnosis.confidence}%
                      </Text>
                    </View>

                    <View style={styles.costContainer}>
                      <Text style={styles.costLabel}>Estimated Cost:</Text>
                      <Text style={styles.costText}>
                        ${session.estimatedCost.min} - ${session.estimatedCost.max}
                      </Text>
                    </View>
                  </View>

                  {isReviewed && (
                    <View style={styles.reviewedBanner}>
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                      <Text style={styles.reviewedText}>Reviewed</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}

            {diagnosticSessions.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptyText}>No pending diagnostic reviews at this time.</Text>
              </View>
            )}
          </ScrollView>
        </>
      ) : activeTab === 'workflow' ? (
        /* NEW: Phase 2.2 - Workflow Tab Content */
        <WorkflowKanbanBoard
          mechanicId={mechanicId}
          shopId={shopId}
          onWorkItemPress={handleWorkItemPress}
          onStatusUpdate={handleStatusUpdate}
        />
      ) : null}

      {/* NEW: Phase 2.2 - Work Item Detail Modal */}
      <WorkItemDetailModal
        visible={showWorkItemModal}
        workItem={selectedWorkItem}
        onClose={() => {
          setShowWorkItemModal(false)
          setSelectedWorkItem(null)
        }}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* NEW: Shared Estimate Detail Modal */}
      <SharedEstimateDetailModal
        visible={showEstimateModal}
        request={selectedRequest}
        mechanicId={mechanicId}
        onClose={() => {
          setShowEstimateModal(false);
          setSelectedRequest(null);
        }}
        onAssign={handleAssignRequest}
        onUpdateStatus={handleUpdateStatus}
        onEditEstimate={handleEditEstimate}
      />

      {/* NEW: Estimate Editing Modal */}
      <EstimateEditingModal
        visible={showEditingModal}
        request={editingRequest!}
        mechanicId={mechanicId}
        onClose={() => {
          setShowEditingModal(false);
          setEditingRequest(null);
        }}
        onSave={handleSaveEditedEstimate}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#10a37f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  sessionsList: {
    flex: 1,
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  reviewedCard: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  sessionVehicle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: '#64748b',
  },
  sessionBadges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  guidanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  guidanceText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 80,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  confidenceText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    width: 35,
    textAlign: 'right',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  costLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 80,
  },
  costText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  // NEW: Phase 2.2 - Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // NEW: Shared estimates styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  assignedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  customerComment: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  estimateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  estimateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  estimateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  estimateBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownItem: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  assignButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  assignButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeButton: {
    backgroundColor: '#ea580c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  activeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Missing styles for the reviews tab
  reviewedBanner: {
    backgroundColor: '#f0f9ff',
    borderTopWidth: 1,
    borderTopColor: '#e0f2fe',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
})
