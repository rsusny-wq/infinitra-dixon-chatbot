/**
 * Admin Service - Dixon Smart Repair
 * Handles admin-specific operations separate from authentication
 * Proper separation of concerns from AuthService
 */

import { generateClient } from 'aws-amplify/api';
import AuthService, { AutomotiveUser } from './AuthService';

// Initialize GraphQL client
const client = generateClient();

export interface MechanicRecord {
  mechanicId: string;
  userId: string; // Cognito user ID
  shopId: string;
  email: string;
  givenName: string;
  familyName: string;
  phoneNumber?: string;
  specialties: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  totalRequestsHandled: number;
  averageRating: number;
  displayName: string;
  isActive: boolean;
  lastActivityText: string;
}

export interface ShopAnalytics {
  shopId: string;
  timeRange: string;
  mechanics: {
    total: number;
    active: number;
    inactive: number;
  };
  requests: {
    total: number;
    pending: number;
    completed: number;
    averageResponseTime: string;
  };
  performance: {
    customerSatisfaction: number;
    completionRate: number;
    averageRating: number;
  };
  generatedAt: string;
}

// GraphQL queries and mutations for admin operations
const CREATE_MECHANIC_RECORD_MUTATION = `
  mutation CreateMechanicRecord($input: CreateMechanicRecordInput!) {
    createMechanicRecord(input: $input) {
      success
      data {
        mechanicId
        userId
        shopId
        email
        givenName
        familyName
        phoneNumber
        status
        createdAt
        displayName
        isActive
      }
      error
    }
  }
`;

const GET_SHOP_MECHANICS_QUERY = `
  query GetShopMechanics($shopId: String!) {
    getShopMechanics(shopId: $shopId) {
      success
      data {
        mechanicId
        userId
        shopId
        email
        givenName
        familyName
        phoneNumber
        specialties
        status
        createdAt
        updatedAt
        lastLoginAt
        totalRequestsHandled
        averageRating
        displayName
        isActive
        lastActivityText
      }
      count
      error
    }
  }
`;

const UPDATE_MECHANIC_STATUS_MUTATION = `
  mutation UpdateMechanicStatus($mechanicId: String!, $shopId: String!, $status: String!) {
    updateMechanicStatus(mechanicId: $mechanicId, shopId: $shopId, status: $status) {
      success
      data {
        mechanicId
        status
        updatedAt
        displayName
        isActive
      }
      error
    }
  }
`;

const GET_SHOP_ANALYTICS_QUERY = `
  query GetShopAnalytics($shopId: String!, $timeRange: String) {
    getShopAnalytics(shopId: $shopId, timeRange: $timeRange) {
      success
      data {
        shopId
        timeRange
        mechanics {
          total
          active
          inactive
        }
        requests {
          total
          pending
          completed
          averageResponseTime
        }
        performance {
          customerSatisfaction
          completionRate
          averageRating
        }
        generatedAt
      }
      error
    }
  }
`;

export class AdminService {
  /**
   * Create a mechanic record in the backend after Cognito user creation
   * This should be called after AuthService.createMechanicUser() succeeds
   */
  static async createMechanicRecord(mechanicData: {
    userId: string; // Cognito user ID
    email: string;
    givenName: string;
    familyName: string;
    phoneNumber?: string;
    shopId: string;
    specialties?: string[];
  }): Promise<{ success: boolean; data?: MechanicRecord; error?: string }> {
    try {
      // Verify admin permissions
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Only admin users can create mechanic records',
        };
      }

      console.log('📝 Creating mechanic record for:', mechanicData.email);

      const input = {
        userId: mechanicData.userId,
        email: mechanicData.email,
        givenName: mechanicData.givenName,
        familyName: mechanicData.familyName,
        phoneNumber: mechanicData.phoneNumber,
        shopId: mechanicData.shopId,
        specialties: mechanicData.specialties || [],
        createdBy: currentUser.userId,
      };

      const response = await client.graphql({
        query: CREATE_MECHANIC_RECORD_MUTATION,
        variables: { input },
        authMode: 'userPool' // Explicitly use Cognito authentication
      });

      if (response.data?.createMechanicRecord) {
        const result = response.data.createMechanicRecord;
        if (result.success) {
          console.log('✅ Mechanic record created:', result.data?.mechanicId);
          return {
            success: true,
            data: result.data,
          };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to create mechanic record',
          };
        }
      } else {
        return {
          success: false,
          error: 'GraphQL request failed',
        };
      }
    } catch (error: any) {
      console.error('❌ Error creating mechanic record:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get all mechanics for the current admin's shop
   */
  static async getShopMechanics(): Promise<{ success: boolean; data?: MechanicRecord[]; count?: number; error?: string }> {
    try {
      // Verify admin permissions and get shop ID
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Only admin users can view shop mechanics',
        };
      }

      const shopId = currentUser.shopId;
      if (!shopId) {
        return {
          success: false,
          error: 'No shop associated with admin account',
        };
      }

      console.log('👥 Fetching mechanics for shop:', shopId);

      const response = await client.graphql({
        query: GET_SHOP_MECHANICS_QUERY,
        variables: { shopId },
        authMode: 'userPool' // Explicitly use Cognito authentication
      });

      if (response.data?.getShopMechanics) {
        const result = response.data.getShopMechanics;
        if (result.success) {
          console.log('✅ Loaded mechanics:', result.count || 0);
          return {
            success: true,
            data: result.data || [],
            count: result.count || 0,
          };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to load mechanics',
          };
        }
      } else {
        return {
          success: false,
          error: 'GraphQL request failed',
        };
      }
    } catch (error: any) {
      console.error('❌ Error fetching shop mechanics:', error);
      
      // Check if it's an authentication error
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        if (firstError.errorType === 'Unauthorized' || firstError.message?.includes('Not Authorized')) {
          return {
            success: false,
            error: 'Authentication expired. Please log out and log back in.',
          };
        }
        return {
          success: false,
          error: firstError.message || 'GraphQL error occurred',
        };
      }
      
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update mechanic status (active/inactive/suspended)
   */
  static async updateMechanicStatus(
    mechanicId: string,
    status: 'active' | 'inactive' | 'suspended'
  ): Promise<{ success: boolean; data?: Partial<MechanicRecord>; error?: string }> {
    try {
      // Verify admin permissions
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Only admin users can update mechanic status',
        };
      }

      const shopId = currentUser.shopId;
      if (!shopId) {
        return {
          success: false,
          error: 'No shop associated with admin account',
        };
      }

      console.log('🔄 Updating mechanic status:', mechanicId, '->', status);

      const response = await client.graphql({
        query: UPDATE_MECHANIC_STATUS_MUTATION,
        variables: {
          mechanicId,
          shopId,
          status,
        },
        authMode: 'userPool' // Explicitly use Cognito authentication
      });

      if (response.data?.updateMechanicStatus) {
        const result = response.data.updateMechanicStatus;
        if (result.success) {
          console.log('✅ Mechanic status updated:', mechanicId);
          return {
            success: true,
            data: result.data,
          };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to update mechanic status',
          };
        }
      } else {
        return {
          success: false,
          error: 'GraphQL request failed',
        };
      }
    } catch (error: any) {
      console.error('❌ Error updating mechanic status:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get shop analytics and metrics
   */
  static async getShopAnalytics(timeRange: string = '30d'): Promise<{ success: boolean; data?: ShopAnalytics; error?: string }> {
    try {
      // Verify admin permissions
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Only admin users can view shop analytics',
        };
      }

      const shopId = currentUser.shopId;
      if (!shopId) {
        return {
          success: false,
          error: 'No shop associated with admin account',
        };
      }

      console.log('📊 Fetching analytics for shop:', shopId);

      const response = await client.graphql({
        query: GET_SHOP_ANALYTICS_QUERY,
        variables: { shopId, timeRange },
        authMode: 'userPool' // Explicitly use Cognito authentication
      });

      if (response.data?.getShopAnalytics) {
        const result = response.data.getShopAnalytics;
        if (result.success) {
          console.log('✅ Analytics loaded for shop:', shopId);
          return {
            success: true,
            data: result.data,
          };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to load analytics',
          };
        }
      } else {
        return {
          success: false,
          error: 'GraphQL request failed',
        };
      }
    } catch (error: any) {
      console.error('❌ Error fetching shop analytics:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Enhanced mechanic creation that handles both Cognito and DynamoDB
   */
  static async createMechanicAccount(mechanicData: {
    email: string;
    givenName: string;
    familyName: string;
    phoneNumber?: string;
    temporaryPassword: string;
    specialties?: string[];
  }): Promise<{ success: boolean; mechanicRecord?: MechanicRecord; error?: string }> {
    try {
      console.log('🔧 Creating complete mechanic account for:', mechanicData.email);

      // Step 1: Create Cognito user
      const cognitoResult = await AuthService.createMechanicUser({
        email: mechanicData.email,
        givenName: mechanicData.givenName,
        familyName: mechanicData.familyName,
        phoneNumber: mechanicData.phoneNumber,
        temporaryPassword: mechanicData.temporaryPassword,
      });

      if (!cognitoResult.success) {
        return {
          success: false,
          error: cognitoResult.message,
        };
      }

      // Step 2: Create DynamoDB record
      const currentUser = await AuthService.getCurrentUser();
      const recordResult = await this.createMechanicRecord({
        userId: cognitoResult.userId!,
        email: mechanicData.email,
        givenName: mechanicData.givenName,
        familyName: mechanicData.familyName,
        phoneNumber: mechanicData.phoneNumber,
        shopId: currentUser?.shopId || 'shop_001',
        specialties: mechanicData.specialties,
      });

      if (!recordResult.success) {
        // TODO: Consider rolling back Cognito user creation
        console.warn('⚠️ Cognito user created but DynamoDB record failed');
        return {
          success: false,
          error: `Account created but record failed: ${recordResult.error}`,
        };
      }

      console.log('✅ Complete mechanic account created:', mechanicData.email);

      return {
        success: true,
        mechanicRecord: recordResult.data,
      };
    } catch (error: any) {
      console.error('❌ Error creating complete mechanic account:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }
}
