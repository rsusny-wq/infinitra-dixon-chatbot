/**
 * GraphQL Service for Strands Conversational Chat
 * Real-time chat integration with AppSync and Strands Agent
 * FIXED: Using correct anonymous mutation for API key authentication
 */

// GraphQL Mutations as strings (no need for gql template literal)
export const SEND_ANONYMOUS_MESSAGE_MUTATION = `
  mutation SendAnonymousMessage($message: String!, $sessionId: String!) {
    sendAnonymousMessage(message: $message, sessionId: $sessionId) {
      conversationId
      message
      timestamp
      sender
      poweredBy
      processingTime
      success
      error
    }
  }
`;

// Authenticated mutation (supports both API key and Cognito)
export const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($message: String!, $conversationId: String, $userId: String, $diagnostic_context: String, $image_base64: String, $image_s3_key: String, $image_s3_bucket: String) {
    sendMessage(message: $message, conversationId: $conversationId, userId: $userId, diagnostic_context: $diagnostic_context, image_base64: $image_base64, image_s3_key: $image_s3_key, image_s3_bucket: $image_s3_bucket) {
      conversationId
      message
      timestamp
      sender
      poweredBy
      processingTime
      success
      error
      vin_enhanced
      diagnostic_accuracy
    }
  }
`;

// Phase 3.1: Cost Estimation Queries
export const GET_COST_ESTIMATE_QUERY = `
  query GetCostEstimate($conversationId: String!) {
    getCostEstimate(conversationId: $conversationId) {
      estimateId
      conversationId
      vehicleInfo
      diagnosticLevel
      selectedOption
      breakdown
      disclaimer
      validUntil
      confidence
      status
      createdAt
    }
  }
`;

// Phase 2.1: Customer Communication - Request Mechanic Mutation
export const REQUEST_MECHANIC_MUTATION = `
  mutation RequestMechanic($request: MechanicRequestInput!) {
    requestMechanic(request: $request) {
      id
      customerId
      customerName
      shopId
      conversationId
      requestMessage
      urgency
      status
      createdAt
      updatedAt
      estimatedResponseTime
    }
  }
`;

// Phase 2.2: Mechanic Cost Estimate Review Mutations
export const REVIEW_COST_ESTIMATE_MUTATION = `
  mutation ReviewCostEstimate($review: MechanicReviewInput!) {
    reviewCostEstimate(review: $review) {
      id
      sessionId
      mechanicId
      status
      mechanicNotes
      modifiedCost {
        description
        min
        max
      }
      modifiedDiagnosis {
        issue
        confidence
        description
      }
      recommendedUrgency
      additionalServices
      reviewedAt
    }
  }
`;

export const RESPOND_TO_ESTIMATE_REVIEW_MUTATION = `
  mutation RespondToEstimateReview($estimateId: String!, $response: String!, $customerComment: String) {
    respondToEstimateReview(estimateId: $estimateId, response: $response, customerComment: $customerComment) {
      success
      estimateId
      response
      customerComment
      respondedAt
      error
    }
  }
`;

export const SHARE_ESTIMATE_WITH_MECHANIC_MUTATION = `
  mutation ShareEstimateWithMechanic($estimateId: String!, $customerComment: String!, $shopId: String!) {
    shareEstimateWithMechanic(estimateId: $estimateId, customerComment: $customerComment, shopId: $shopId) {
      id
      customerId
      customerName
      shopId
      conversationId
      requestMessage
      urgency
      status
      createdAt
      updatedAt
      estimatedResponseTime
      sharedEstimateId
      customerComment
    }
  }
`;

export const AUTHORIZE_WORK_MUTATION = `
  mutation AuthorizeWork($costEstimateId: String!, $authorizationType: String!, $customerId: String!, $approvalData: String) {
    authorizeWork(costEstimateId: $costEstimateId, authorizationType: $authorizationType, customerId: $customerId, approvalData: $approvalData) {
      success
      authorizationId
      status
      message
      nextStep
      error
    }
  }
`;

// Get conversation messages query
export const GET_CONVERSATION_MESSAGES_QUERY = `
  query GetConversationMessages($conversationId: String!) {
    getConversationMessages(conversationId: $conversationId) {
      messages {
        id
        content
        role
        timestamp
        metadata
      }
      success
      error
    }
  }
`;

// Phase 3: User-Centric Cost Estimate Queries (NEW)
export const GET_USER_LABOUR_ESTIMATES_QUERY = `
  query GetUserLabourEstimates($userId: String!, $limit: Int) {
    getUserLabourEstimates(userId: $userId, limit: $limit) {
      success
      estimates {
        reportId
        userId
        conversationId
        repairType
        vehicleInfo {
          year
          make
          model
          trim
        }
        initialEstimate {
          labor_hours_low
          labor_hours_high
          labor_hours_average
          reasoning
        }
        modelResults {
          claude_estimate {
            labor_hours_low
            labor_hours_high
            labor_hours_average
            reason_for_low
            reason_for_high
            reason_for_average
          }
          web_validation {
            labor_hours_low
            labor_hours_high
            labor_hours_average
            confidence
            search_answer
            source
          }
        }
        finalEstimate {
          labor_hours_low
          labor_hours_high
          labor_hours_average
          reasoning
        }
        consensusReasoning
        dataQuality {
          score
          level
          factors
          model_count
        }
        createdAt
        version
      }
      count
      error
    }
  }
`;

export const GET_USER_COST_ESTIMATES_QUERY = `
  query GetUserCostEstimates($userId: String!, $limit: Int) {
    getUserCostEstimates(userId: $userId, limit: $limit) {
      success
      estimates {
        id
        estimateId
        userId
        conversationId
        vehicleInfo {
          year
          make
          model
          trim
        }
        selectedOption
        breakdown {
          total
          labor {
            total
          }
          parts {
            total
          }
          tax
        }
        status
        createdAt
        validUntil
        confidence
      }
      count
      error
    }
  }
`;

export const GET_COST_ESTIMATE_BY_ID_QUERY = `
  query GetCostEstimateById($estimateId: String!) {
    getCostEstimateById(estimateId: $estimateId) {
      success
      estimate {
        id
        estimateId
        userId
        conversationId
        vehicleInfo {
          year
          make
          model
          trim
        }
        selectedOption
        breakdown {
          total
          labor {
            total
          }
          parts {
            total
            urls
          }
          tax
        }
        partUrls
        status
        createdAt
        validUntil
        confidence
      }
      error
    }
  }
`;

// GraphQL Subscriptions for Real-time Updates
export const MESSAGE_SUBSCRIPTION = `
  subscription OnMessageAdded($conversationId: String!) {
    onMessageAdded(conversationId: $conversationId) {
      id
      conversationId
      content
      sender
      timestamp
      messageType
      poweredBy
      metadata
    }
  }
`;

export const ANONYMOUS_MESSAGE_SUBSCRIPTION = `
  subscription OnAnonymousMessageAdded($sessionId: String!) {
    onAnonymousMessageAdded(sessionId: $sessionId) {
      conversationId
      message
      timestamp
      sender
      poweredBy
      success
    }
  }
`;

// Type definitions
export interface ChatResponse {
  conversationId: string;
  message: string;
  timestamp: string;
  sender: string;
  poweredBy: string;
  processingTime?: number;
  success: boolean;
  error?: string;
  vehicleContext?: string;
}

// Shop Visits Queries
export const GET_USER_VISITS_QUERY = `
  query GetUserVisits($userId: String!) {
    getUserVisits(userId: $userId) {
      visitId
      shopId
      serviceType
      status
      createdAt
      updatedAt
      estimatedServiceTime
      actualServiceTime
      customerName
      mechanicNotes
      vehicleInfo {
        make
        model
        year
        trim
        vin
      }
    }
  }
`;

export const GET_VISIT_BY_ID_QUERY = `
  query GetVisitById($visitId: String!) {
    getVisitById(visitId: $visitId) {
      visitId
      shopId
      shopName
      serviceType
      status
      createdAt
      updatedAt
      estimatedServiceTime
      actualServiceTime
      customerName
      mechanicNotes
      vehicleInfo {
        make
        model
        year
        trim
        vin
      }
    }
  }
`;

export const RECORD_SHOP_VISIT_MUTATION = `
  mutation RecordShopVisit($visit: ShopVisitInput!) {
    recordShopVisit(visit: $visit) {
      visitId
      shopId
      serviceType
      status
      createdAt
      estimatedServiceTime
    }
  }
`;

// Vehicle Management Queries
export const GET_USER_VEHICLES_QUERY = `
  query GetUserVehicles($userId: String!) {
    getUserVehicles(userId: $userId) {
      vehicleId
      userId
      make
      model
      year
      trim
      vin
      color
      mileage
      createdAt
      updatedAt
      lastUsed
    }
  }
`;

export const GET_VEHICLE_BY_ID_QUERY = `
  query GetVehicleById($vehicleId: String!) {
    getVehicleById(vehicleId: $vehicleId) {
      vehicleId
      userId
      make
      model
      year
      trim
      vin
      color
      mileage
      createdAt
      updatedAt
      lastUsed
    }
  }
`;

export const ADD_USER_VEHICLE_MUTATION = `
  mutation AddUserVehicle($vehicle: VehicleInput!) {
    addUserVehicle(vehicle: $vehicle) {
      vehicleId
      userId
      make
      model
      year
      trim
      vin
      color
      mileage
      createdAt
      updatedAt
      lastUsed
    }
  }
`;

export const UPDATE_USER_VEHICLE_MUTATION = `
  mutation UpdateUserVehicle($vehicleId: String!, $vehicle: VehicleInput!) {
    updateUserVehicle(vehicleId: $vehicleId, vehicle: $vehicle) {
      vehicleId
      userId
      make
      model
      year
      trim
      vin
      color
      mileage
      createdAt
      updatedAt
      lastUsed
    }
  }
`;

export const DELETE_USER_VEHICLE_MUTATION = `
  mutation DeleteUserVehicle($vehicleId: String!) {
    deleteUserVehicle(vehicleId: $vehicleId)
  }
`;

// Chat History Queries - Database Implementation
export const LIST_USER_CONVERSATIONS_QUERY = `
  query ListUserConversations($userId: String!) {
    listUserConversations(userId: $userId) {
      id
      title
      createdAt
      updatedAt
      status
      enhanced
      chatbot
      userId
      messages {
        id
        content
        sender
        messageType
        timestamp
        conversationId
        poweredBy
      }
    }
  }
`;

export const GET_CONVERSATION_QUERY = `
  query GetConversation($conversationId: String!) {
    getConversation(conversationId: $conversationId) {
      conversationId
      count
      success
      error
      messages {
        id
        content
        sender
        messageType
        timestamp
        conversationId
        poweredBy
      }
    }
  }
`;

export const GET_USER_CONVERSATIONS_QUERY = `
  query GetUserConversations($userId: String!, $limit: Int) {
    getUserConversations(userId: $userId, limit: $limit) {
      success
      error
      count
      conversations {
        id
        title
        createdAt
        lastAccessed
        messageCount
        diagnosticLevel
        diagnosticAccuracy
        vinEnhanced
        isActive
      }
    }
  }
`;

export const CREATE_CONVERSATION_MUTATION = `
  mutation CreateConversation($userId: String!, $title: String) {
    createConversation(userId: $userId, title: $title) {
      conversationId
      createdAt
      success
      error
    }
  }
`;

// AI-Powered Title Generation Mutation
export const GENERATE_CONVERSATION_TITLE_MUTATION = `
  mutation GenerateConversationTitle($content: String!) {
    generateConversationTitle(content: $content) {
      success
      title
      error
      generatedBy
      processingTime
    }
  }
`;

export const UPDATE_CONVERSATION_TITLE_MUTATION = `
  mutation UpdateConversationTitle($conversationId: String!, $title: String!) {
    updateConversationTitle(conversationId: $conversationId, title: $title) {
      success
      title
      error
    }
  }
`;

// NEW: Mechanic Request Queries
// Simplified query for debugging
export const GET_QUEUED_REQUESTS_SIMPLE_QUERY = `
  query GetQueuedRequestsSimple($shopId: String!) {
    getQueuedRequests(shopId: $shopId) {
      id
      customerId
      customerName
      conversationId
      requestMessage
      urgency
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_QUEUED_REQUESTS_QUERY = `
  query GetQueuedRequests($shopId: String!) {
    getQueuedRequests(shopId: $shopId) {
      id
      customerId
      customerName
      conversationId
      requestMessage
      urgency
      status
      createdAt
      updatedAt
      estimatedResponseTime
      sharedEstimateId
      customerComment
      sharedEstimate {
        estimateId
        vehicleInfo {
          year
          make
          model
          trim
        }
        breakdown {
          total
          parts {
            total
          }
          labor {
            total
          }
          shopFees {
            total
          }
        }
        selectedOption
        status
        createdAt
      }
    }
  }
`;

export const GET_MECHANIC_REQUESTS_QUERY = `
  query GetMechanicRequests($customerId: String!) {
    getMechanicRequests(customerId: $customerId) {
      id
      customerId
      customerName
      shopId
      conversationId
      requestMessage
      urgency
      status
      createdAt
      updatedAt
      estimatedResponseTime
      sharedEstimateId
      customerComment
      assignedMechanicId
      assignedMechanicName
    }
  }
`;

export const ASSIGN_MECHANIC_REQUEST_MUTATION = `
  mutation AssignMechanicRequest($mechanicId: String!, $requestId: String!) {
    assignMechanicRequest(mechanicId: $mechanicId, requestId: $requestId) {
      id
      assignedMechanicId
      assignedMechanicName
      status
      updatedAt
    }
  }
`;

export const UPDATE_REQUEST_STATUS_MUTATION = `
  mutation UpdateRequestStatus($requestId: String!, $status: String!) {
    updateRequestStatus(requestId: $requestId, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

export const UPDATE_MODIFIED_ESTIMATE_MUTATION = `
  mutation UpdateModifiedEstimate(
    $requestId: String!
    $modifiedEstimate: String!
    $mechanicNotes: String!
    $mechanicId: String!
  ) {
    updateModifiedEstimate(
      requestId: $requestId
      modifiedEstimate: $modifiedEstimate
      mechanicNotes: $mechanicNotes
      mechanicId: $mechanicId
    ) {
      id
      status
      modifiedEstimate {
        estimateId
        breakdown {
          total
          parts {
            total
            items {
              description
              cost
              warranty
              url
            }
          }
          labor {
            total
            totalHours
            hourlyRate
          }
          shopFees {
            total
          }
          tax
        }
        confidence
        mechanicNotes
        modifiedAt
      }
      updatedAt
    }
  }
`;
