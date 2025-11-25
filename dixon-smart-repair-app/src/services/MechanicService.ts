/**
 * Mechanic Service - Dixon Smart Repair
 * Handles mechanic interface operations and shop management
 */

import { generateClient } from 'aws-amplify/api';
import { 
  GET_QUEUED_REQUESTS_SIMPLE_QUERY,
  GET_QUEUED_REQUESTS_QUERY,
  ASSIGN_MECHANIC_REQUEST_MUTATION,
  UPDATE_REQUEST_STATUS_MUTATION,
  UPDATE_MODIFIED_ESTIMATE_MUTATION
} from './GraphQLService';

// Initialize GraphQL client
const client = generateClient();

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Mechanic {
  id: string;
  userId: string;
  shopId: string;
  name: string;
  email: string;
  specialties: string[];
  certifications: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticSession {
  id: string;
  conversationId: string;
  customerId: string;
  shopId?: string;
  vehicleInfo?: {
    year?: number;
    make?: string;
    model?: string;
    vin?: string;
  };
  symptoms: string[];
  aiDiagnosis: {
    primaryDiagnosis: {
      issue: string;
      confidence: number;
      description: string;
    };
    alternativeDiagnoses: Array<{
      issue: string;
      confidence: number;
      description: string;
    }>;
    recommendedActions: string[];
    confidence: number;
  };
  estimatedCost: {
    min: number;
    max: number;
    description: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'modified';
  createdAt: string;
  updatedAt: string;
}

export interface MechanicReview {
  id: string;
  sessionId: string;
  mechanicId: string;
  status: 'approved' | 'rejected' | 'modified';
  modifiedDiagnosis?: {
    issue: string;
    confidence: number;
    description: string;
  };
  modifiedCost?: {
    min: number;
    max: number;
    description: string;
  };
  mechanicNotes: string;
  recommendedUrgency?: 'low' | 'medium' | 'high' | 'critical';
  additionalServices?: string[];
  reviewedAt: string;
}

export interface InfoRequest {
  id: string;
  sessionId: string;
  mechanicId: string;
  requestType: 'vehicle_info' | 'symptoms' | 'photos' | 'diagnostic_data';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'sent' | 'responded';
  createdAt: string;
}

export interface ShopStatistics {
  totalPendingReviews: number;
  totalCompletedToday: number;
  highPriorityCount: number;
  averageResponseTime?: number;
}

export class MechanicService {
  /**
   * Get pending diagnostic sessions for a shop
   */
  static async getPendingDiagnoses(shopId: string): Promise<{ success: boolean; data?: DiagnosticSession[]; error?: string }> {
    try {
      console.log('🔧 Fetching pending diagnoses for shop:', shopId);
      
      const query = `
        query GetPendingDiagnoses($shopId: String!) {
          getPendingDiagnoses(shopId: $shopId) {
            id
            conversationId
            customerId
            shopId
            vehicleInfo {
              year
              make
              model
              vin
            }
            symptoms
            aiDiagnosis {
              primaryDiagnosis {
                issue
                confidence
                description
              }
              alternativeDiagnoses {
                issue
                confidence
                description
              }
              recommendedActions
              confidence
            }
            estimatedCost {
              min
              max
              description
            }
            urgency
            status
            createdAt
            updatedAt
          }
        }
      `;

      const response = await client.graphql({
        query: query,
        variables: { shopId },
        authMode: 'userPool'
      });
      
      if (response.data?.getPendingDiagnoses) {
        return {
          success: true,
          data: response.data.getPendingDiagnoses,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to fetch pending diagnoses',
        };
      }
    } catch (error: any) {
      console.error('❌ Error fetching pending diagnoses:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get shop statistics
   */
  static async getShopStatistics(shopId: string): Promise<{ success: boolean; data?: ShopStatistics; error?: string }> {
    try {
      console.log('📊 Fetching shop statistics for:', shopId);
      
      const query = `
        query GetShopStatistics($shopId: String!) {
          getShopStatistics(shopId: $shopId) {
            totalPendingReviews
            totalCompletedToday
            highPriorityCount
            averageResponseTime
          }
        }
      `;

      const response = await client.graphql({
        query: query,
        variables: { shopId },
        authMode: 'userPool'
      });
      
      if (response.data?.getShopStatistics) {
        return {
          success: true,
          data: response.data.getShopStatistics,
        };
      } else {
        return {
          success: false,
          error: 'Failed to fetch shop statistics',
        };
      }
    } catch (error: any) {
      console.error('❌ Error fetching shop statistics:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Submit mechanic review for a diagnostic session
   */
  static async reviewDiagnosis(review: {
    sessionId: string;
    status: 'approved' | 'rejected' | 'modified';
    modifiedDiagnosis?: {
      issue: string;
      confidence: number;
      description: string;
    };
    modifiedCost?: {
      min: number;
      max: number;
      description: string;
    };
    mechanicNotes: string;
    recommendedUrgency?: 'low' | 'medium' | 'high' | 'critical';
    additionalServices?: string[];
  }): Promise<{ success: boolean; data?: MechanicReview; error?: string }> {
    try {
      console.log('✅ Submitting mechanic review for session:', review.sessionId);
      
      const mutation = `
        mutation ReviewDiagnosis($review: MechanicReviewInput!) {
          reviewDiagnosis(review: $review) {
            id
            sessionId
            mechanicId
            status
            modifiedDiagnosis {
              issue
              confidence
              description
            }
            modifiedCost {
              min
              max
              description
            }
            mechanicNotes
            recommendedUrgency
            additionalServices
            reviewedAt
          }
        }
      `;

      const response = await client.graphql({
        query: mutation,
        variables: { review },
        authMode: 'userPool'
      });
      
      if (response.data?.reviewDiagnosis) {
        return {
          success: true,
          data: result.data.reviewDiagnosis,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to submit review',
        };
      }
    } catch (error: any) {
      console.error('❌ Error submitting review:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Request additional information from customer
   */
  static async requestMoreInfo(request: {
    sessionId: string;
    requestType: 'vehicle_info' | 'symptoms' | 'photos' | 'diagnostic_data';
    message: string;
    urgency: 'low' | 'medium' | 'high';
  }): Promise<{ success: boolean; data?: InfoRequest; error?: string }> {
    try {
      console.log('📝 Requesting more info for session:', request.sessionId);
      
      const mutation = `
        mutation RequestMoreInfo($request: InfoRequestInput!) {
          requestMoreInfo(request: $request) {
            id
            sessionId
            mechanicId
            requestType
            message
            urgency
            status
            createdAt
          }
        }
      `;

      const response = await client.graphql({
        query: mutation,
        variables: { request },
        authMode: 'userPool'
      });
      
      if (response.data?.requestMoreInfo) {
        return {
          success: true,
          data: result.data.requestMoreInfo,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send info request',
        };
      }
    } catch (error: any) {
      console.error('❌ Error requesting more info:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update quote for a diagnostic session
   */
  static async updateQuote(sessionId: string, quote: {
    min: number;
    max: number;
    description: string;
  }): Promise<{ success: boolean; data?: DiagnosticSession; error?: string }> {
    try {
      console.log('💰 Updating quote for session:', sessionId);
      
      const mutation = `
        mutation UpdateQuote($sessionId: String!, $quote: CostEstimateInput!) {
          updateQuote(sessionId: $sessionId, quote: $quote) {
            id
            conversationId
            customerId
            estimatedCost {
              min
              max
              description
            }
            updatedAt
          }
        }
      `;

      const response = await client.graphql({
        query: mutation,
        variables: { sessionId, quote },
        authMode: 'userPool'
      });
      
      if (response.data?.updateQuote) {
        return {
          success: true,
          data: response.data.updateQuote,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update quote',
        };
      }
    } catch (error: any) {
      console.error('❌ Error updating quote:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get detailed diagnostic session
   */
  static async getDiagnosticSession(sessionId: string): Promise<{ success: boolean; data?: DiagnosticSession; error?: string }> {
    try {
      console.log('🔍 Fetching diagnostic session:', sessionId);
      
      const query = `
        query GetDiagnosticSession($sessionId: String!) {
          getDiagnosticSession(sessionId: $sessionId) {
            id
            conversationId
            customerId
            shopId
            vehicleInfo {
              year
              make
              model
              vin
            }
            symptoms
            aiDiagnosis {
              primaryDiagnosis {
                issue
                confidence
                description
              }
              alternativeDiagnoses {
                issue
                confidence
                description
              }
              recommendedActions
              confidence
            }
            estimatedCost {
              min
              max
              description
            }
            urgency
            status
            createdAt
            updatedAt
          }
        }
      `;

      const response = await client.graphql({
        query: query,
        variables: { sessionId },
        authMode: 'userPool'
      });
      
      if (response.data?.getDiagnosticSession) {
        return {
          success: true,
          data: response.data.getDiagnosticSession,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to fetch diagnostic session',
        };
      }
    } catch (error: any) {
      console.error('❌ Error fetching diagnostic session:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get queued mechanic requests for a shop
   */
  static async getQueuedRequests(shopId: string): Promise<{ success: boolean; data?: MechanicRequest[]; error?: string }> {
    try {
      console.log('🔍 Getting queued requests for shop:', shopId);

      const response = await client.graphql({
        query: GET_QUEUED_REQUESTS_QUERY, // Back to full query with cost details
        variables: { shopId },
        authMode: 'userPool'
      });

      console.log('🔍 GraphQL Response:', response);
      
      if (response.data?.getQueuedRequests) {
        console.log('✅ Queued requests data:', response.data.getQueuedRequests);
        return {
          success: true,
          data: response.data.getQueuedRequests,
        };
      } else {
        console.error('❌ GraphQL response error:', response);
        return {
          success: false,
          error: 'Failed to fetch queued requests - no data returned',
        };
      }
    } catch (error: any) {
      console.error('❌ Error fetching queued requests:', error);
      console.error('❌ Error details:', error.errors || error.message);
      if (error.errors) {
        console.error('❌ GraphQL Errors JSON:', JSON.stringify(error.errors, null, 2));
      }
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Assign a mechanic request to a mechanic
   */
  static async assignMechanicRequest(mechanicId: string, requestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔧 Assigning request:', requestId, 'to mechanic:', mechanicId);

      const response = await client.graphql({
        query: ASSIGN_MECHANIC_REQUEST_MUTATION,
        variables: { mechanicId, requestId },
        authMode: 'userPool'
      });

      if (response.data?.assignMechanicRequest) {
        return {
          success: true,
          data: response.data.assignMechanicRequest,
        };
      } else {
        return {
          success: false,
          error: 'Failed to assign mechanic request',
        };
      }
    } catch (error: any) {
      console.error('❌ Error assigning mechanic request:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update the status of a mechanic request
   */
  static async updateRequestStatus(requestId: string, status: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('📝 Updating request status:', requestId, 'to:', status);

      const response = await client.graphql({
        query: UPDATE_REQUEST_STATUS_MUTATION,
        variables: { requestId, status },
        authMode: 'userPool'
      });

      if (response.data?.updateRequestStatus) {
        return {
          success: true,
          data: response.data.updateRequestStatus,
        };
      } else {
        return {
          success: false,
          error: 'Failed to update request status',
        };
      }
    } catch (error: any) {
      console.error('❌ Error updating request status:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update modified estimate - NEW: Phase 2.3 Estimate Editing
   */
  static async updateModifiedEstimate(
    requestId: string,
    modifiedEstimate: any,
    mechanicNotes: string,
    mechanicId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔧 Updating modified estimate:', { requestId, mechanicId });

      const response = await client.graphql({
        query: UPDATE_MODIFIED_ESTIMATE_MUTATION,
        variables: {
          requestId,
          modifiedEstimate: JSON.stringify(modifiedEstimate),
          mechanicNotes,
          mechanicId,
        },
      });

      console.log('✅ Update modified estimate response:', response);

      if (response.data?.updateModifiedEstimate) {
        return {
          success: true,
          data: response.data.updateModifiedEstimate,
        };
      } else {
        return {
          success: false,
          error: 'Failed to update modified estimate',
        };
      }
    } catch (error: any) {
      console.error('❌ Error updating modified estimate:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }
}

// NEW: MechanicRequest interface
export interface MechanicRequest {
  id: string;
  customerId: string;
  customerName: string;
  shopId: string;
  conversationId: string;
  requestMessage: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'queued' | 'assigned' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  estimatedResponseTime?: string;
  sharedEstimateId?: string;
  customerComment?: string;
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  sharedEstimate?: {
    estimateId: string;
    vehicleInfo: {
      year: string;
      make: string;
      model: string;
      trim?: string;
    };
    breakdown: {
      total: number;
      parts: {
        total: number;
        items: Array<{
          description: string;
          cost: number;
          warranty: string;
          url?: string;
        }>;
      };
      labor: {
        total: number;
        totalHours: number;
        hourlyRate: number;
      };
      shopFees: {
        total: number;
      };
    };
    repairDescription: string;
    selectedOption: string;
    status: string;
    createdAt: string;
  };
}

export default MechanicService;
