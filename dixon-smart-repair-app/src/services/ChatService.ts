/**
 * Real Chat Service - Connects to deployed Strands Lambda function
 * FIXED: Uses sendMessage mutation with API key authentication
 */

import { generateClient } from 'aws-amplify/api';
import {
  SEND_MESSAGE_MUTATION,
  GET_COST_ESTIMATE_QUERY,
  AUTHORIZE_WORK_MUTATION,
  GET_USER_COST_ESTIMATES_QUERY,
  GET_USER_LABOUR_ESTIMATES_QUERY,
  GET_COST_ESTIMATE_BY_ID_QUERY,
  REQUEST_MECHANIC_MUTATION,
  REVIEW_COST_ESTIMATE_MUTATION,
  RESPOND_TO_ESTIMATE_REVIEW_MUTATION,
  SHARE_ESTIMATE_WITH_MECHANIC_MUTATION,
  GET_USER_CONVERSATIONS_QUERY,
  GET_CONVERSATION_MESSAGES_QUERY,
  GENERATE_CONVERSATION_TITLE_MUTATION,
  UPDATE_CONVERSATION_TITLE_MUTATION
} from './GraphQLService';
import AuthService from './AuthService';

// Initialize GraphQL client
const client = generateClient();

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  diagnostic_context?: {
    mode: string;
    accuracy: string;
    user_selection: string;
    vehicle_details_required: boolean;
  };
  image_base64?: string;      // Keep for backward compatibility
  image_s3_key?: string;      // NEW: S3 key
  image_s3_bucket?: string;   // NEW: S3 bucket
  imageFile?: File;           // NEW: For direct upload
}

export interface SendMessageResponse {
  conversationId: string;
  message: any; // Can be string or structured response from Nova Pro
  timestamp: string;
  sender: string;
  poweredBy: string;
  processingTime?: number;
  success: boolean;
  error?: string;
  vehicleContext?: string;
}

export class ChatService {
  /**
   * Upload image to S3 using pre-signed URL and return S3 key and bucket
   */
  async uploadImageToS3(imageFile: File, userId?: string): Promise<{ s3Key: string, s3Bucket: string }> {
    try {
      console.log('ChatService: Uploading image to S3', imageFile.name);

      // Determine authentication mode (same logic as sendMessage)
      const currentUser = await AuthService.getCurrentUser();
      const isAnonymous = !currentUser;
      const authMode = isAnonymous ? 'apiKey' : 'userPool';

      console.log(`ChatService: Using auth mode for image upload: ${authMode} (anonymous: ${isAnonymous})`);

      // Step 1: Get pre-signed upload URL from Lambda
      const uploadUrlResponse = await client.graphql({
        query: `
          mutation GenerateImageUploadUrl($fileName: String!, $contentType: String!, $userId: String) {
            generateImageUploadUrl(fileName: $fileName, contentType: $contentType, userId: $userId) {
              uploadUrl
              s3Key
              s3Bucket
              expiresIn
            }
          }
        `,
        variables: {
          fileName: imageFile.name,
          contentType: imageFile.type,
          userId: userId || 'anonymous'
        },
        authMode: authMode as any
      });

      const uploadData = uploadUrlResponse.data?.generateImageUploadUrl;
      if (!uploadData || !uploadData.uploadUrl) {
        throw new Error('Failed to get upload URL from server');
      }

      console.log('ChatService: Got pre-signed URL, uploading to S3...');

      // Step 2: Upload directly to S3 using pre-signed URL
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: imageFile,
        headers: {
          'Content-Type': imageFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      console.log('ChatService: Image uploaded successfully to S3:', uploadData.s3Key);
      return {
        s3Key: uploadData.s3Key,
        s3Bucket: uploadData.s3Bucket
      };

    } catch (error) {
      console.error('ChatService: Error uploading image to S3', error);
      throw error;
    }
  }

  /**
   * Send message to Strands Lambda function via GraphQL
   * Uses API key authentication for anonymous users
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const startTime = performance.now();
    try {
      console.log('ChatService: Sending message to Lambda', request);

      // 🔍 DEBUG: Log all request parameters
      // console.log('🔍 DEBUG: ChatService request parameters:');
      // console.log('  - message:', request.message);
      // console.log('  - conversationId:', request.conversationId);
      // console.log('  - userId:', request.userId);
      // console.log('  - imageFile:', request.imageFile ? `${request.imageFile.name} (${request.imageFile.size} bytes)` : 'None');
      // console.log('  - image_base64:', request.image_base64 ? 'Present' : 'None');
      // console.log('  - image_s3_key:', request.image_s3_key);
      // console.log('  - image_s3_bucket:', request.image_s3_bucket);

      // Get authenticated user ID or use provided userId
      let userId = request.userId;
      let currentUser = null;

      const authStartTime = performance.now();
      if (!userId) {
        currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          userId = currentUser.userId;
          console.log('ChatService: Using authenticated user ID:', userId);
        } else {
          // For anonymous users, create a consistent session-based ID
          userId = `anonymous-${Date.now()}`;
          console.log('ChatService: Using anonymous user ID:', userId);
        }
      } else {
        // If userId was provided, still check if user is authenticated for auth mode
        currentUser = await AuthService.getCurrentUser();
      }
      console.log(`⏱️ ChatService: Auth check took ${(performance.now() - authStartTime).toFixed(2)}ms`);

      // Determine if user is anonymous
      const isAnonymous = !currentUser;

      // Use appropriate auth mode based on user status
      const authMode = isAnonymous ? 'apiKey' : 'userPool';
      console.log(`ChatService: Using auth mode: ${authMode} (anonymous: ${isAnonymous})`);

      // Handle image upload if imageFile is provided
      let imageS3Key: string | undefined;
      let imageS3Bucket: string | undefined;

      if (request.imageFile) {
        const uploadStartTime = performance.now();
        console.log('🔍 DEBUG: Processing image file for S3 upload');
        console.log('🔍 DEBUG: Image file details:', {
          name: request.imageFile.name,
          size: request.imageFile.size,
          type: request.imageFile.type
        });

        const uploadResult = await this.uploadImageToS3(request.imageFile, userId);
        imageS3Key = uploadResult.s3Key;
        imageS3Bucket = uploadResult.s3Bucket;
        console.log(`⏱️ ChatService: Image upload took ${(performance.now() - uploadStartTime).toFixed(2)}ms`);
        console.log('🔍 DEBUG: Image uploaded to S3 successfully:', {
          s3Key: imageS3Key,
          s3Bucket: imageS3Bucket
        });
      } else if (request.image_s3_key && request.image_s3_bucket) {
        imageS3Key = request.image_s3_key;
        imageS3Bucket = request.image_s3_bucket;
        console.log('🔍 DEBUG: Using provided S3 parameters:', {
          s3Key: imageS3Key,
          s3Bucket: imageS3Bucket
        });
      } else {
        console.log('🔍 DEBUG: No image provided');
      }

      // 🔍 DEBUG: Log final GraphQL variables
      const graphqlVariables = {
        message: request.message,
        conversationId: request.conversationId || `conv-${Date.now()}`,
        userId: userId,
        diagnostic_context: request.diagnostic_context ? JSON.stringify(request.diagnostic_context) : undefined,
        image_base64: request.image_base64,    // Keep for backward compatibility
        image_s3_key: imageS3Key,             // NEW: S3 approach
        image_s3_bucket: imageS3Bucket,       // NEW: S3 approach
      };

      console.log('🔍 DEBUG: Final GraphQL variables being sent:', graphqlVariables);

      const apiStartTime = performance.now();
      const response = await client.graphql({
        query: SEND_MESSAGE_MUTATION,
        variables: graphqlVariables,
        authMode: authMode as any, // Explicitly set auth mode
      });
      console.log(`⏱️ ChatService: API call took ${(performance.now() - apiStartTime).toFixed(2)}ms`);

      console.log('ChatService: Raw GraphQL response', response);

      // Check if there are GraphQL errors
      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: GraphQL errors', response.errors);
        console.error('ChatService: Full error details:', JSON.stringify(response.errors, null, 2));

        // Log each error individually for better debugging
        response.errors.forEach((error, index) => {
          console.error(`ChatService: Error ${index + 1}:`, error.message);
          if (error.extensions) {
            console.error(`ChatService: Error ${index + 1} extensions:`, error.extensions);
          }
        });

        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      const result = response.data?.sendMessage;

      if (!result) {
        throw new Error('No data returned from GraphQL mutation');
      }

      console.log('ChatService: Received response from Lambda', result);
      console.log(`⏱️ ChatService: Total sendMessage execution took ${(performance.now() - startTime).toFixed(2)}ms`);

      // Handle the response format from your Lambda function
      if (result.success) {
        return {
          conversationId: result.conversationId,
          message: result.message,
          timestamp: result.timestamp,
          sender: result.sender || 'ASSISTANT',
          poweredBy: result.poweredBy || 'Strands AI',
          processingTime: result.processingTime,
          success: true,
          vehicleContext: result.vehicleContext,
        };
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('ChatService: Error sending message', error);
      console.log(`⏱️ ChatService: Total sendMessage execution (failed) took ${(performance.now() - startTime).toFixed(2)}ms`);

      // Return error response
      return {
        conversationId: request.conversationId || `conv-${Date.now()}`,
        message: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        sender: 'SYSTEM',
        poweredBy: 'Error Handler',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extract text content from Nova Pro response
   */
  extractMessageContent(message: any): string {
    console.log('🔍 Raw message received:', JSON.stringify(message, null, 2));

    // Handle string responses (direct text)
    if (typeof message === 'string') {
      // Check if it's a JSON string that needs parsing
      try {
        const parsed = JSON.parse(message);
        return this.extractMessageContent(parsed);
      } catch {
        return message;
      }
    }

    // Handle Nova Pro response format: {role: 'assistant', content: [{text: '...'}]}
    if (message?.role === 'assistant' && message?.content) {
      if (Array.isArray(message.content)) {
        return message.content
          .filter(item => item.text)
          .map(item => item.text)
          .join('\n');
      }
      return message.content;
    }

    // Handle direct content array: [{text: '...'}]
    if (Array.isArray(message)) {
      return message
        .filter(item => item.text)
        .map(item => item.text)
        .join('\n');
    }

    // Handle direct text content
    if (message?.text) {
      return message.text;
    }

    // Handle message property
    if (message?.message) {
      return this.extractMessageContent(message.message);
    }

    // Handle response wrapper (common Lambda response format)
    if (message?.body) {
      try {
        const parsed = JSON.parse(message.body);
        return this.extractMessageContent(parsed);
      } catch {
        return message.body;
      }
    }

    // Fallback - return clean string representation
    return typeof message === 'object' ? JSON.stringify(message) : String(message);
  }

  /**
   * Format message for display in UI
   */
  formatMessageForUI(response: SendMessageResponse): string {
    // console.log('🎨 Formatting response:', JSON.stringify(response, null, 2));

    const content = this.extractMessageContent(response.message);

    // Clean up any artifacts and format for display
    let cleanContent = content
      .replace(/<thinking>.*?<\/thinking>/gs, '') // Remove thinking tags
      .replace(/^\{.*?"text":\s*"/, '') // Remove JSON wrapper start
      .replace(/"\}.*?$/, '') // Remove JSON wrapper end
      .replace(/\\n/g, '\n') // Convert escaped newlines
      .replace(/\\"/g, '"') // Convert escaped quotes
      .trim();

    // If it still looks like JSON, try to extract the text content
    if (cleanContent.startsWith('{') && cleanContent.includes('"text"')) {
      try {
        const parsed = JSON.parse(cleanContent);
        if (parsed.text) {
          cleanContent = parsed.text;
        }
      } catch (e) {
        console.warn('Failed to parse JSON content:', e);
      }
    }

    return cleanContent;
  }


  /**
   * Phase 3.1: Get all cost estimates for a user (NEW: User-centric approach)
   */
  async getUserCostEstimates(userId: string, limit: number = 10): Promise<any> {
    try {
      console.log('ChatService: Getting cost estimates for user', userId);

      // Check if user is properly authenticated for Cognito-protected query
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || !currentUser.userId) {
        console.log('ChatService: User not authenticated for getUserCostEstimates');
        return {
          success: false,
          error: 'Authentication required to access cost estimates',
          estimates: [],
          count: 0
        };
      }

      const response = await client.graphql({
        query: GET_USER_COST_ESTIMATES_QUERY,
        variables: { userId, limit }
      });

      if (response.errors) {
        console.error('ChatService: getUserCostEstimates GraphQL errors', response.errors);
        console.error('ChatService: getUserCostEstimates Full error details:', JSON.stringify(response.errors, null, 2));

        // Check for authorization errors specifically
        const authError = response.errors.find(error =>
          error.errorType === 'Unauthorized' ||
          error.message.includes('Not Authorized')
        );

        if (authError) {
          console.log('ChatService: Authorization error detected for getUserCostEstimates');
          return {
            success: false,
            error: 'Please log in to view your cost estimates',
            estimates: [],
            count: 0
          };
        }

        // Log each error individually for better debugging
        response.errors.forEach((error, index) => {
          console.error(`ChatService: getUserCostEstimates Error ${index + 1}:`, error.message);
          if (error.extensions) {
            console.error(`ChatService: getUserCostEstimates Error ${index + 1} extensions:`, error.extensions);
          }
        });

        return { success: false, error: response.errors[0]?.message || 'GraphQL error', estimates: [], count: 0 };
      }

      const result = response.data?.getUserCostEstimates;

      if (!result) {
        console.log('ChatService: No user cost estimates data returned');
        return { success: false, error: 'No data returned', estimates: [], count: 0 };
      }

      console.log('ChatService: User cost estimates retrieved successfully', result);
      return result;
    } catch (error) {
      console.error('ChatService: Error getting user cost estimates', error);

      // If it's a GraphQL error, log the details
      if (error && typeof error === 'object' && 'graphQLErrors' in error) {
        console.error('ChatService: getUserCostEstimates GraphQL errors', error.graphQLErrors);
        console.error('ChatService: getUserCostEstimates Full error details:', JSON.stringify(error.graphQLErrors, null, 2));
      }

      // If it's a network error, log the details
      if (error && typeof error === 'object' && 'networkError' in error) {
        console.error('ChatService: getUserCostEstimates Network error', error.networkError);
      }

      // Log the full error object for debugging
      console.error('ChatService: getUserCostEstimates Full error object:', JSON.stringify(error, null, 2));

      // Check if it's an authentication/authorization error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('Not Authorized')) {
        return {
          success: false,
          error: 'Please log in to view your cost estimates',
          estimates: [],
          count: 0
        };
      }

      return { success: false, error: errorMessage, estimates: [], count: 0 };
    }
  }

  /**
   * Get all labour estimates for a user
   */
  async getUserLabourEstimates(userId: string, limit: number = 10): Promise<any> {
    try {
      console.log('ChatService: Getting labour estimates for user', userId);

      // Check authentication
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || !currentUser.userId) {
        console.log('ChatService: User not authenticated for getUserLabourEstimates');
        return {
          success: false,
          error: 'User not authenticated',
          estimates: [],
          count: 0
        };
      }

      const response = await client.graphql({
        query: GET_USER_LABOUR_ESTIMATES_QUERY,
        variables: { userId, limit }
      });

      if (response.errors) {
        console.error('ChatService: getUserLabourEstimates GraphQL errors', response.errors);

        // Check for authorization errors
        const authError = response.errors.some(error =>
          error.message.includes('Unauthorized') ||
          error.message.includes('Access denied') ||
          error.message.includes('Not authorized')
        );

        if (authError) {
          console.log('ChatService: Authorization error detected for getUserLabourEstimates');
          return {
            success: false,
            error: 'Please log in to view your labour estimates',
            estimates: [],
            count: 0
          };
        }

        return {
          success: false,
          error: response.errors[0]?.message || 'Failed to fetch labour estimates',
          estimates: [],
          count: 0
        };
      }

      const result = response.data?.getUserLabourEstimates;

      if (!result) {
        console.error('ChatService: No data returned from getUserLabourEstimates');
        return { success: false, error: 'No data returned', estimates: [], count: 0 };
      }

      console.log('ChatService: Successfully retrieved labour estimates', result);
      return result;

    } catch (error) {
      console.error('ChatService: Error in getUserLabourEstimates', error);

      // Check if it's an authentication/authorization error
      const errorMessage = error?.message || 'Unknown error occurred';
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('Access denied')) {
        return {
          success: false,
          error: 'Please log in to view your labour estimates',
          estimates: [],
          count: 0
        };
      }

      return { success: false, error: errorMessage, estimates: [], count: 0 };
    }
  }

  /**
   * Phase 3.1: Get specific cost estimate by ID (NEW: User-centric approach)
   */
  async getCostEstimateById(estimateId: string): Promise<any> {
    try {
      console.log('ChatService: Getting cost estimate by ID', estimateId);

      const response = await client.graphql({
        query: GET_COST_ESTIMATE_BY_ID_QUERY,
        variables: { estimateId }
      });

      if (response.errors) {
        console.error('ChatService: Error getting cost estimate by ID', response.errors);
        return null;
      }

      const result = response.data?.getCostEstimateById;

      if (!result) {
        console.log('ChatService: No cost estimate found for ID', estimateId);
        return null;
      }

      console.log('ChatService: Cost estimate retrieved successfully', result);
      return result;
    } catch (error) {
      console.error('ChatService: Error getting cost estimate by ID', error);
      return null;
    }
  }

  /**
   * Phase 3.1: Get cost estimate (LEGACY: for backward compatibility)
   */
  async getCostEstimate(conversationId: string): Promise<any> {
    try {
      console.log('ChatService: Getting cost estimate for conversation', conversationId);

      const response = await client.graphql({
        query: GET_COST_ESTIMATE_QUERY,
        variables: { conversationId }
      });

      console.log('ChatService: Get cost estimate response', response);

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: GraphQL errors', response.errors);
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      const result = response.data?.getCostEstimate;

      if (!result) {
        return {
          success: false,
          error: 'No estimate found for conversation'
        };
      }

      // Parse JSON fields if they're strings
      const costEstimate = {
        ...result,
        vehicleInfo: typeof result.vehicleInfo === 'string' ? JSON.parse(result.vehicleInfo) : result.vehicleInfo,
        breakdown: typeof result.breakdown === 'string' ? JSON.parse(result.breakdown) : result.breakdown,
        authorizationStatus: typeof result.authorizationStatus === 'string' ? JSON.parse(result.authorizationStatus) : result.authorizationStatus
      };

      return {
        success: true,
        costEstimate: costEstimate
      };
    } catch (error) {
      console.error('ChatService: Error getting cost estimate', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Phase 3.1: Authorize work
   */
  async authorizeWork(request: {
    costEstimateId: string;
    authorizationType: string;
    customerId: string;
    approvalData?: any;
  }): Promise<any> {
    try {
      console.log('ChatService: Authorizing work', request);

      const response = await client.graphql({
        query: AUTHORIZE_WORK_MUTATION,
        variables: {
          costEstimateId: request.costEstimateId,
          authorizationType: request.authorizationType,
          customerId: request.customerId,
          approvalData: JSON.stringify(request.approvalData || {})
        },
      });

      console.log('ChatService: Authorize work response', response);

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: GraphQL errors', response.errors);
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      const result = response.data?.authorizeWork;

      if (!result) {
        throw new Error('No data returned from authorize work mutation');
      }

      return {
        success: result.success,
        authorizationId: result.authorizationId,
        status: result.status,
        message: result.message,
        error: result.error
      };
    } catch (error) {
      console.error('ChatService: Error authorizing work', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Request mechanic assistance - Phase 2.1 Customer Communication
   */
  async requestMechanic(request: {
    conversationId: string;
    requestMessage: string;
    urgency: 'low' | 'medium' | 'high';
    shopId: string;
    conversationHistory?: any[]; // Add conversation context
    userType?: 'authenticated' | 'anonymous'; // Add user type
    userId?: string; // Add user ID
  }): Promise<{
    success: boolean;
    mechanicRequest?: any;
    error?: string;
  }> {
    try {
      console.log('ChatService: Requesting mechanic assistance', request);

      // Try GraphQL mutation first
      try {
        const response = await client.graphql({
          query: REQUEST_MECHANIC_MUTATION,
          variables: {
            request: {
              conversationId: request.conversationId,
              requestMessage: request.requestMessage,
              urgency: request.urgency,
              shopId: request.shopId,
              conversationHistory: request.conversationHistory || [], // Include conversation context
              userType: request.userType || 'anonymous', // Include user type
              userId: request.userId || 'anonymous', // Include user ID
            }
          },
        });

        console.log('ChatService: Request mechanic response', response);

        if (response.errors && response.errors.length > 0) {
          console.error('ChatService: GraphQL errors', response.errors);
          throw new Error(`GraphQL Error: ${response.errors[0].message}`);
        }

        const result = response.data?.requestMechanic;

        if (!result) {
          throw new Error('No data returned from request mechanic mutation');
        }

        return {
          success: true,
          mechanicRequest: {
            id: result.id,
            customerId: result.customerId,
            customerName: result.customerName,
            shopId: result.shopId,
            conversationId: result.conversationId,
            requestMessage: result.requestMessage,
            urgency: result.urgency,
            status: result.status,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            estimatedResponseTime: result.estimatedResponseTime
          }
        };
      } catch (graphqlError) {
        // GraphQL backend not fully implemented yet - use fallback silently
        console.log('ChatService: Using fallback mechanic service (backend not ready)');

        // Fallback: Create a mock mechanic request for development/testing
        const mockMechanicRequest = {
          id: `mechanic-request-${Date.now()}`,
          customerId: request.userId || 'anonymous',
          customerName: 'Customer',
          shopId: request.shopId,
          conversationId: request.conversationId,
          requestMessage: request.requestMessage,
          urgency: request.urgency,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedResponseTime: request.urgency === 'high' ? '15 minutes' : request.urgency === 'medium' ? '30 minutes' : '1 hour'
        };

        console.log('ChatService: Fallback mechanic request created', mockMechanicRequest.id);

        return {
          success: true,
          mechanicRequest: mockMechanicRequest
        };
      }
    } catch (error) {
      console.error('ChatService: Error requesting mechanic', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send message to mechanic - Phase 2.1 Customer Communication
   */
  async sendMechanicMessage(request: {
    mechanicRequestId?: string;
    message: string;
    senderId: string;
    senderName: string;
    senderType: 'customer' | 'mechanic';
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      console.log('ChatService: Sending message to mechanic (fallback mode)');

      // For now, simulate successful message sending
      // In production, this would send to a real mechanic communication system
      const mockMessageId = `mechanic-message-${Date.now()}`;

      return {
        success: true,
        messageId: mockMessageId
      };
    } catch (error) {
      console.error('ChatService: Error sending mechanic message', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Review cost estimate - Phase 2.2 Mechanic Interface
   */
  async reviewCostEstimate(review: {
    estimateId: string;
    sessionId: string;
    status: 'approved' | 'rejected' | 'modified';
    mechanicNotes: string;
    modifiedCost?: any;
    modifiedDiagnosis?: any;
    recommendedUrgency?: 'low' | 'medium' | 'high' | 'critical';
    additionalServices?: string[];
  }): Promise<{
    success: boolean;
    review?: any;
    error?: string;
  }> {
    try {
      console.log('ChatService: Reviewing cost estimate', review);

      const response = await client.graphql({
        query: REVIEW_COST_ESTIMATE_MUTATION,
        variables: { review },
      });

      console.log('ChatService: Review cost estimate response', response);

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: GraphQL errors', response.errors);
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      const result = response.data?.reviewCostEstimate;

      if (!result) {
        throw new Error('No data returned from review cost estimate mutation');
      }

      return {
        success: true,
        review: result
      };
    } catch (error) {
      console.error('ChatService: Error reviewing cost estimate', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Respond to estimate review - Phase 2.2 Customer Response
   */
  async respondToEstimateReview(request: {
    estimateId: string;
    response: 'approved' | 'rejected' | 'needs_clarification';
    customerComment?: string;
  }): Promise<{
    success: boolean;
    response?: any;
    error?: string;
  }> {
    try {
      console.log('ChatService: Responding to estimate review', request);

      const response = await client.graphql({
        query: RESPOND_TO_ESTIMATE_REVIEW_MUTATION,
        variables: {
          estimateId: request.estimateId,
          response: request.response,
          customerComment: request.customerComment
        },
      });

      console.log('ChatService: Respond to estimate review response', response);

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: GraphQL errors', response.errors);
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      const result = response.data?.respondToEstimateReview;

      if (!result) {
        throw new Error('No data returned from respond to estimate review mutation');
      }

      return {
        success: result.success,
        response: result,
        error: result.error
      };
    } catch (error) {
      console.error('ChatService: Error responding to estimate review', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share cost estimate with mechanic - Phase 2.2 Customer Communication
   */
  async shareEstimateWithMechanic(request: {
    estimateId: string;
    customerComment: string;
    shopId: string;
  }): Promise<{
    success: boolean;
    mechanicRequest?: any;
    error?: string;
  }> {
    try {
      console.log('ChatService: Sharing estimate with mechanic', request);

      const response = await client.graphql({
        query: SHARE_ESTIMATE_WITH_MECHANIC_MUTATION,
        variables: {
          estimateId: request.estimateId,
          customerComment: request.customerComment,
          shopId: request.shopId
        },
      });

      console.log('ChatService: Share estimate response', response);

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: GraphQL errors', response.errors);
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      const result = response.data?.shareEstimateWithMechanic;

      if (!result) {
        throw new Error('No data returned from share estimate mutation');
      }

      return {
        success: true,
        mechanicRequest: result
      };
    } catch (error) {
      console.error('ChatService: Error sharing estimate with mechanic', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all shop visits for a user
   */
  async getUserShopVisits(userId: string, limit: number = 10): Promise<any> {
    try {
      console.log('🏪 ChatService: Getting shop visits for user', userId);

      // Check if user is properly authenticated
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || !currentUser.userId) {
        console.log('🏪 ChatService: User not authenticated for getUserShopVisits');
        return {
          success: false,
          error: 'User not authenticated',
          visits: [],
          count: 0
        };
      }

      const response = await client.graphql({
        query: `
          query GetUserVisits($userId: String!, $limit: Int) {
            getUserVisits(userId: $userId, limit: $limit) {
              visitId
              userId
              shopId
              customerName
              serviceType
              status
              timestamp
              createdAt
              updatedAt
              estimatedServiceTime
              actualServiceTime
              mechanicNotes
            }
          }
        `,
        variables: { userId, limit }
      });

      if (response.errors) {
        console.error('🏪 ChatService: getUserShopVisits GraphQL errors', response.errors);
        console.error('🏪 ChatService: Full error details:', JSON.stringify(response.errors, null, 2));

        // Log each error individually for better debugging
        response.errors.forEach((error, index) => {
          console.error(`🏪 GraphQL Error ${index + 1}:`, error.message);
          if (error.extensions) {
            console.error(`🏪 Error Extensions:`, error.extensions);
          }
        });

        return {
          success: false,
          error: `GraphQL Error: ${response.errors[0]?.message || 'Unknown error'}`,
          visits: [],
          count: 0
        };
      }

      const visits = response.data?.getUserVisits;

      if (!visits) {
        console.log('🏪 ChatService: No shop visits data returned');
        return { success: true, visits: [], count: 0 };
      }

      console.log('🏪 ChatService: Shop visits retrieved successfully', visits);
      return {
        success: true,
        visits: Array.isArray(visits) ? visits : [],
        count: Array.isArray(visits) ? visits.length : 0
      };
    } catch (error) {
      console.error('🏪 ChatService: Error getting user shop visits', error);
      return {
        success: false,
        error: 'Failed to load shop visits',
        visits: [],
        count: 0
      };
    }
  }

  /**
   * Get all conversations for a user from DynamoDB
   */
  async getUserConversations(userId: string, limit: number = 50): Promise<any> {
    try {
      console.log('💬 ChatService: Getting conversations for user', userId);

      // Check if user is properly authenticated
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || !currentUser.userId) {
        console.log('💬 ChatService: User not authenticated for getUserConversations');
        return {
          success: false,
          error: 'User not authenticated',
          conversations: [],
          count: 0
        };
      }

      const response = await client.graphql({
        query: GET_USER_CONVERSATIONS_QUERY,
        variables: { userId, limit }
      });

      if (response.errors) {
        console.error('💬 ChatService: getUserConversations GraphQL errors', response.errors);
        console.error('💬 ChatService: Full error details:', JSON.stringify(response.errors, null, 2));

        // Log each error individually for better debugging
        response.errors.forEach((error, index) => {
          console.error(`💬 GraphQL Error ${index + 1}:`, error.message);
          if (error.extensions) {
            console.error(`💬 Error Extensions:`, error.extensions);
          }
        });

        return {
          success: false,
          error: `GraphQL Error: ${response.errors[0]?.message || 'Unknown error'}`,
          conversations: [],
          count: 0
        };
      }

      const result = response.data?.getUserConversations;

      if (!result) {
        console.log('💬 ChatService: No conversations data returned');
        return { success: true, conversations: [], count: 0 };
      }

      console.log('💬 ChatService: Conversations retrieved successfully', result);
      return {
        success: result.success || true,
        conversations: result.conversations || [],
        count: result.count || 0,
        error: result.error
      };
    } catch (error) {
      console.error('💬 ChatService: Error getting user conversations', error);
      return {
        success: false,
        error: 'Failed to load conversations',
        conversations: [],
        count: 0
      };
    }
  }
  /**
   * AI-Powered Title Generation
   */
  async generateConversationTitle(content: string): Promise<{
    success: boolean;
    title?: string;
    error?: string;
    generatedBy?: 'ai' | 'fallback';
    processingTime?: number;
  }> {
    try {
      console.log('ChatService: Generating AI title for content:', content.slice(0, 100));

      const startTime = Date.now();

      const response = await client.graphql({
        query: GENERATE_CONVERSATION_TITLE_MUTATION,
        variables: { content: content.slice(0, 200) } // Limit content length
      });

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: Title generation GraphQL errors', response.errors);

        // Fallback to local title generation
        const fallbackTitle = this.generateFallbackTitle(content);
        return {
          success: true,
          title: fallbackTitle,
          generatedBy: 'fallback',
          processingTime: Date.now() - startTime
        };
      }

      const result = response.data?.generateConversationTitle;

      if (!result) {
        throw new Error('No data returned from title generation');
      }

      console.log('ChatService: AI title generated successfully:', result.title);

      return {
        success: result.success,
        title: result.title,
        error: result.error,
        generatedBy: result.generatedBy || 'ai',
        processingTime: result.processingTime || (Date.now() - startTime)
      };

    } catch (error) {
      console.error('ChatService: Error generating title:', error);

      // Always provide a fallback title
      const fallbackTitle = this.generateFallbackTitle(content);

      return {
        success: true, // Still successful with fallback
        title: fallbackTitle,
        generatedBy: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<{
    success: boolean;
    title?: string;
    error?: string;
  }> {
    try {
      console.log('ChatService: Updating conversation title:', conversationId, title);

      const response = await client.graphql({
        query: UPDATE_CONVERSATION_TITLE_MUTATION,
        variables: { conversationId, title }
      });

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: Update title GraphQL errors', response.errors);
        return {
          success: false,
          error: response.errors[0]?.message || 'GraphQL error'
        };
      }

      const result = response.data?.updateConversationTitle;

      if (!result) {
        throw new Error('No data returned from title update');
      }

      console.log('ChatService: Title updated successfully');

      return {
        success: result.success,
        title: result.title,
        error: result.error
      };

    } catch (error) {
      console.error('ChatService: Error updating title:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fallback title generation using keyword extraction
   */
  private generateFallbackTitle(content: string): string {
    try {
      const words = content.toLowerCase().split(/\s+/);

      // Car brands (most common)
      const carBrands = ['honda', 'toyota', 'ford', 'chevrolet', 'chevy', 'nissan', 'bmw', 'mercedes', 'audi', 'volkswagen', 'vw', 'subaru', 'mazda', 'hyundai', 'kia'];
      const foundBrand = words.find(word => carBrands.includes(word));

      // Car models (common ones)
      const carModels = ['civic', 'accord', 'camry', 'corolla', 'prius', 'rav4', 'f150', 'f-150', 'mustang', 'explorer', 'silverado', 'malibu', 'altima', 'sentra', 'rogue'];
      const foundModel = words.find(word => carModels.includes(word));

      // Problems/issues - Fixed: include 'noises' plural and better sound detection
      const problems = ['brake', 'brakes', 'engine', 'transmission', 'battery', 'tire', 'tires', 'oil', 'noise', 'noises', 'sound', 'sounds', 'vibration', 'leak', 'light', 'warning', 'alternator', 'starter', 'ac', 'air', 'conditioning', 'filter', 'repair', 'fix', 'problem', 'issue'];
      const foundProblem = words.find(word => problems.includes(word));

      // Build title from found keywords
      const titleParts = [];

      if (foundBrand) {
        titleParts.push(foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1));
      }

      if (foundModel) {
        titleParts.push(foundModel.toUpperCase());
      }

      if (foundProblem) {
        const problemWord = foundProblem.charAt(0).toUpperCase() + foundProblem.slice(1);
        // Fixed: Better problem word mapping
        const problemMapping = {
          'Brake': 'Brake Issue',
          'Brakes': 'Brake Issue',
          'Engine': 'Engine Problem',
          'Oil': 'Oil Service',
          'Noise': 'Noise Issue',
          'Noises': 'Noise Issue',
          'Sound': 'Sound Issue',
          'Sounds': 'Sound Issue',
          'Ac': 'AC Issue',
          'Air': 'AC Issue'
        };

        titleParts.push(problemMapping[problemWord] || problemWord);
      }

      // If we have a good combination, use it
      if (titleParts.length >= 2) {
        return titleParts.join(' ');
      }

      // If we have at least one keyword, add generic suffix only if it doesn't already have one
      if (titleParts.length === 1) {
        const lastPart = titleParts[0];
        if (!lastPart.includes('Issue') && !lastPart.includes('Problem') && !lastPart.includes('Service')) {
          return titleParts[0] + ' Issue';
        }
        return titleParts[0];
      }

      // Fallback to first few words - Fixed: Better word extraction
      const meaningfulWords = content.split(' ').filter(word =>
        word.length > 2 && !['the', 'and', 'for', 'with', 'when', 'that', 'this', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'].includes(word.toLowerCase())
      );

      const firstWords = meaningfulWords.slice(0, 4).join(' ');
      if (firstWords.length > 3) {
        return firstWords.length > 25 ? firstWords.slice(0, 25) + '...' : firstWords;
      }

      // Final fallback
      return 'Automotive Issue';

    } catch (error) {
      console.error('Error in fallback title generation:', error);
      return 'New Chat';
    }
  }
  async deleteConversation(conversationId: string): Promise<any> {
    try {
      console.log('💬 ChatService: Deleting conversation:', conversationId);

      // Check if user is properly authenticated
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || !currentUser.userId) {
        console.log('💬 ChatService: User not authenticated for deleteConversation');
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // TODO: Replace with proper GraphQL mutation when schema is deployed
      // For now, return a placeholder response
      console.log('💬 ChatService: deleteConversation not yet implemented in GraphQL schema');
      return {
        success: false,
        error: 'Delete functionality will be available in a future update',
        message: 'Conversation deletion is not yet implemented'
      };

      /* 
      // This will be enabled once the GraphQL schema is deployed:
      const response = await client.graphql({
        query: `
          mutation DeleteConversation($conversationId: String!) {
            deleteConversation(conversationId: $conversationId) {
              success
              message
              deletedItems
              error
            }
          }
        `,
        variables: { conversationId }
      });

      if (response.errors) {
        console.error('💬 ChatService: deleteConversation GraphQL errors', response.errors);
        return { 
          success: false, 
          error: `GraphQL Error: ${response.errors[0]?.message || 'Unknown error'}`
        };
      }

      const result = response.data?.deleteConversation;
      console.log('💬 ChatService: Conversation deleted successfully', result);
      return result;
      */
    } catch (error) {
      console.error('💬 ChatService: Error deleting conversation', error);
      return {
        success: false,
        error: 'Failed to delete conversation'
      };
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string): Promise<{
    success: boolean;
    messages?: any[];
    error?: string;
  }> {
    try {
      console.log('💬 ChatService: Getting messages for conversation', conversationId);

      const response = await client.graphql({
        query: GET_CONVERSATION_MESSAGES_QUERY,
        variables: {
          conversationId: conversationId
        }
      });

      const result = response.data?.getConversationMessages;

      if (result?.success) {
        console.log('✅ ChatService: Messages retrieved successfully', {
          success: result.success,
          messageCount: result.messages?.length || 0
        });

        return {
          success: true,
          messages: result.messages || [],
          error: null
        };
      } else {
        console.error('❌ ChatService: Failed to get messages:', result?.error);
        return {
          success: false,
          error: result?.error || 'Failed to get conversation messages'
        };
      }
    } catch (error) {
      console.error('❌ ChatService: Error getting conversation messages:', error);
      return {
        success: false,
        error: 'Network error while getting conversation messages'
      };
    }
  }

  /**
   * Approve modified estimate - Phase 2.3 Customer Approval
   */
  async approveModifiedEstimate(estimateId: string, customerNotes?: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('ChatService: Approving modified estimate', { estimateId, customerNotes });

      const response = await client.graphql({
        query: `
          mutation ApproveModifiedEstimate($estimateId: String!, $customerNotes: String) {
            approveModifiedEstimate(estimateId: $estimateId, customerNotes: $customerNotes) {
              id
              status
              updatedAt
              customerApprovalNotes
              approvedAt
            }
          }
        `,
        variables: {
          estimateId,
          customerNotes: customerNotes || null
        },
      });

      console.log('ChatService: Approve estimate response', response);

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: GraphQL errors', response.errors);
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      const result = response.data?.approveModifiedEstimate;

      if (!result) {
        throw new Error('No data returned from approve estimate mutation');
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('ChatService: Error approving modified estimate', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reject modified estimate - Phase 2.3 Customer Approval
   */
  async rejectModifiedEstimate(estimateId: string, customerNotes: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('ChatService: Rejecting modified estimate', { estimateId, customerNotes });

      const response = await client.graphql({
        query: `
          mutation RejectModifiedEstimate($estimateId: String!, $customerNotes: String!) {
            rejectModifiedEstimate(estimateId: $estimateId, customerNotes: $customerNotes) {
              id
              status
              updatedAt
              customerRejectionNotes
              rejectedAt
            }
          }
        `,
        variables: {
          estimateId,
          customerNotes
        },
      });

      console.log('ChatService: Reject estimate response', response);

      if (response.errors && response.errors.length > 0) {
        console.error('ChatService: GraphQL errors', response.errors);
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      const result = response.data?.rejectModifiedEstimate;

      if (!result) {
        throw new Error('No data returned from reject estimate mutation');
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('ChatService: Error rejecting modified estimate', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const chatService = new ChatService();
