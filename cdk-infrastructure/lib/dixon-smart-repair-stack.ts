import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';
// PHASE 5: Import privacy infrastructure
import { PrivacyInfrastructure } from './privacy-infrastructure';

export class DixonSmartRepairStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🚗 Dixon Smart Repair - Strands Conversational Chatbot Infrastructure
    // 
    // CRITICAL FIXES APPLIED (Jan 17, 2025):
    // 1. S3 Bucket: Fixed dynamic bucket name causing recreation
    // 2. Removal Policy: Changed to RETAIN to prevent accidental deletion
    // 3. CloudFront: Stabilized configuration to prevent recreation
    // 4. Resource Protection: Added versioning and safety measures

    // 1. 🔐 Authentication - Cognito User Pool (Enhanced with Role Support)
    const userPool = new cognito.UserPool(this, 'DixonUserPoolV2', {
      userPoolName: 'dixon-smart-repair-users-v2',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      // NEW: Disable email verification for admin-created users
      autoVerify: {
        email: false, // Don't require email verification
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // NEW: Custom attributes for role-based authentication
      customAttributes: {
        'role': new cognito.StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }),
        'shop_id': new cognito.StringAttribute({
          minLen: 1,
          maxLen: 50,
          mutable: true,
        }),
        'shop_name': new cognito.StringAttribute({
          minLen: 1,
          maxLen: 100,
          mutable: true,
        }),
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'DixonUserPoolClient', {
      userPool,
      userPoolClientName: 'dixon-smart-repair-app',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // 2. 💾 Enhanced DynamoDB Tables for Session Management
    // Phase 1b: Add TTL to existing tables for anonymous user cleanup
    const conversationTable = new dynamodb.Table(this, 'ConversationTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // TTL for anonymous user sessions (1 hour)
      timeToLiveAttribute: 'ttl',
    });

    conversationTable.addGlobalSecondaryIndex({
      indexName: 'UserConversationsIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add new GSI for sorting by last activity (updatedAt)
    conversationTable.addGlobalSecondaryIndex({
      indexName: 'UserConversationsByActivityIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
    });

    // NEW: Mechanics management table for admin dashboard
    const mechanicsTable = new dynamodb.Table(this, 'MechanicsTable', {
      tableName: 'dixon-mechanics',
      partitionKey: { name: 'mechanicId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    // Add GSI for querying mechanics by shop
    mechanicsTable.addGlobalSecondaryIndex({
      indexName: 'ShopMechanicsIndex',
      partitionKey: { name: 'shopId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const messageTable = new dynamodb.Table(this, 'MessageTable', {
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // TTL for anonymous user messages (1 hour)
      timeToLiveAttribute: 'ttl',
    });

    // GSI for loading conversation messages
    messageTable.addGlobalSecondaryIndex({
      indexName: 'ConversationMessagesIndex',
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    const vehicleTable = new dynamodb.Table(this, 'VehicleTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // Add point-in-time recovery for data protection
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    vehicleTable.addGlobalSecondaryIndex({
      indexName: 'UserVehiclesIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    // Add new GSI for sorting vehicles by creation time
    vehicleTable.addGlobalSecondaryIndex({
      indexName: 'UserVehiclesByDateIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // SessionContext Table (already deployed)
    const sessionContextTable = new dynamodb.Table(this, 'SessionContextTable', {
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl', // 1-hour TTL for anonymous users
    });

    // v0.2 ENHANCEMENT: Labor Estimate Reports Table
    const laborEstimateReportsTable = new dynamodb.Table(this, 'LaborEstimateReportsTable', {
      tableName: 'LaborEstimateReports',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'reportId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    // Add GSI for querying reports by conversation
    laborEstimateReportsTable.addGlobalSecondaryIndex({
      indexName: 'ConversationReportsIndex',
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for querying reports by user with proper time-based sorting
    laborEstimateReportsTable.addGlobalSecondaryIndex({
      indexName: 'UserReportsIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // NEW: Shop Management Tables for Mechanic Interface
    const shopTable = new dynamodb.Table(this, 'ShopTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    shopTable.addGlobalSecondaryIndex({
      indexName: 'OwnerShopsIndex',
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING },
    });

    const mechanicTable = new dynamodb.Table(this, 'MechanicTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    mechanicTable.addGlobalSecondaryIndex({
      indexName: 'ShopMechanicsIndex',
      partitionKey: { name: 'shopId', type: dynamodb.AttributeType.STRING },
    });

    const diagnosisReviewTable = new dynamodb.Table(this, 'DiagnosisReviewTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    diagnosisReviewTable.addGlobalSecondaryIndex({
      indexName: 'ConversationReviewsIndex',
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    diagnosisReviewTable.addGlobalSecondaryIndex({
      indexName: 'ShopPendingReviewsIndex',
      partitionKey: { name: 'shopId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
    });

    // NEW: Shop Visits Table for Phase 1.1 - Shop Visit Recognition
    const shopVisitsTable = new dynamodb.Table(this, 'ShopVisitsTable', {
      partitionKey: { name: 'visitId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // No TTL - permanent storage for 10-year retention as requested
    });

    // GSI for querying visits by user (authenticated users only)
    shopVisitsTable.addGlobalSecondaryIndex({
      indexName: 'UserVisitsIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // GSI for querying visits by shop (for shop interface)
    shopVisitsTable.addGlobalSecondaryIndex({
      indexName: 'ShopVisitsIndex',
      partitionKey: { name: 'shopId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // GSI for querying visits by service type (for analytics)
    shopVisitsTable.addGlobalSecondaryIndex({
      indexName: 'ServiceTypeVisitsIndex',
      partitionKey: { name: 'serviceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // NEW: Phase 2.1 - Customer Communication Tables
    const mechanicRequestTable = new dynamodb.Table(this, 'MechanicRequestTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // 10-year retention for compliance and audit requirements
      timeToLiveAttribute: 'ttl',
    });

    // GSI for customer requests
    mechanicRequestTable.addGlobalSecondaryIndex({
      indexName: 'CustomerRequestsIndex',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // GSI for shop queue
    mechanicRequestTable.addGlobalSecondaryIndex({
      indexName: 'ShopQueueIndex',
      partitionKey: { name: 'shopId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
    });

    // GSI for mechanic assignments
    mechanicRequestTable.addGlobalSecondaryIndex({
      indexName: 'MechanicAssignmentsIndex',
      partitionKey: { name: 'assignedMechanicId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
    });

    const mechanicMessageTable = new dynamodb.Table(this, 'MechanicMessageTable', {
      partitionKey: { name: 'mechanicRequestId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // 10-year retention for compliance and audit requirements
      timeToLiveAttribute: 'ttl',
    });

    // GSI for sender messages
    mechanicMessageTable.addGlobalSecondaryIndex({
      indexName: 'SenderMessagesIndex',
      partitionKey: { name: 'senderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    const mechanicNotificationTable = new dynamodb.Table(this, 'MechanicNotificationTable', {
      partitionKey: { name: 'mechanicId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // 30-day retention for notifications
      timeToLiveAttribute: 'ttl',
    });

    // GSI for notification types
    mechanicNotificationTable.addGlobalSecondaryIndex({
      indexName: 'NotificationTypeIndex',
      partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // NEW: Phase 2.2 - Work Authorization Tracking Table
    const workAuthorizationTable = new dynamodb.Table(this, 'WorkAuthorizationTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // 10-year retention for compliance and audit requirements
      timeToLiveAttribute: 'ttl',
    });

    // GSI for mechanic workflow view
    workAuthorizationTable.addGlobalSecondaryIndex({
      indexName: 'MechanicWorkflowIndex',
      partitionKey: { name: 'mechanicId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'workflowStatus', type: dynamodb.AttributeType.STRING },
    });

    // GSI for shop workflow overview
    workAuthorizationTable.addGlobalSecondaryIndex({
      indexName: 'ShopWorkflowIndex',
      partitionKey: { name: 'shopId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'workflowStatus', type: dynamodb.AttributeType.STRING },
    });

    // GSI for customer work tracking
    workAuthorizationTable.addGlobalSecondaryIndex({
      indexName: 'CustomerWorkIndex',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
    });

    // NEW: Phase 3.1 - Cost Estimation Tables
    const costEstimatesTable = new dynamodb.Table(this, 'CostEstimatesTable', {
      partitionKey: { name: 'estimateId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // 10-year retention for compliance and audit requirements
      timeToLiveAttribute: 'ttl',
    });

    // GSI for conversation-based estimate lookup (legacy)
    costEstimatesTable.addGlobalSecondaryIndex({
      indexName: 'ConversationIndex',
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // NEW: GSI for user-based estimate lookup (primary approach)
    costEstimatesTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // GSI for mechanic approval workflow
    costEstimatesTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const mechanicReviewsTable = new dynamodb.Table(this, 'MechanicReviewsTable', {
      partitionKey: { name: 'approvalId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // 10-year retention for compliance and audit requirements
      timeToLiveAttribute: 'ttl',
    });

    // GSI for estimate-based review lookup
    mechanicReviewsTable.addGlobalSecondaryIndex({
      indexName: 'EstimateIndex',
      partitionKey: { name: 'estimateId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // GSI for mechanic assignment workflow
    mechanicReviewsTable.addGlobalSecondaryIndex({
      indexName: 'MechanicWorkflowIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const workAuthorizationsTable = new dynamodb.Table(this, 'WorkAuthorizationsTable', {
      partitionKey: { name: 'authorizationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // 10-year retention for compliance and audit requirements
      timeToLiveAttribute: 'ttl',
    });

    // GSI for estimate-based authorization lookup
    workAuthorizationsTable.addGlobalSecondaryIndex({
      indexName: 'EstimateAuthIndex',
      partitionKey: { name: 'estimateId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // GSI for customer authorization tracking
    workAuthorizationsTable.addGlobalSecondaryIndex({
      indexName: 'CustomerAuthIndex',
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // GSI for authorization status workflow
    workAuthorizationsTable.addGlobalSecondaryIndex({
      indexName: 'StatusAuthIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // 3. 📦 S3 Bucket for Strands Session Storage (NEW - Best Practices)
    const sessionBucket = new s3.Bucket(this, 'SessionBucket', {
      bucketName: `dixon-smart-repair-sessions-${this.account}`,
      versioned: true,
      lifecycleRules: [
        {
          id: 'CleanupOldSessions',
          enabled: true,
          expiration: cdk.Duration.days(30), // Clean up sessions after 30 days
          noncurrentVersionExpiration: cdk.Duration.days(7), // Clean up old versions after 7 days
        }
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 4. 📦 S3 Bucket for Image Storage (NEW - For VIN extraction and image processing)
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `dixon-smart-repair-images-${this.account}`,
      versioned: false, // Images don't need versioning
      lifecycleRules: [
        {
          id: 'DeleteOldImages',
          enabled: true,
          expiration: cdk.Duration.days(30), // Auto-delete images after 30 days
        }
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'], // Restrict this to your domain in production
          allowedHeaders: ['*'],
          maxAge: 3000,
        }
      ],
    });

    // 5. 🤖 Python Strands Agent Lambda Function (UPDATED - Best Practices)
    const strandsLambda = new lambda.Function(this, 'StrandsChatbot', {
      functionName: 'dixon-strands-chatbot',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'strands_best_practices_handler.lambda_handler', // FIXED: Use correct handler
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_11.bundlingImage,
          platform: 'linux/amd64', // Ensure x86_64 architecture
          command: [
            'bash', '-c',
            [
              'pip install -r requirements.txt -t /asset-output --no-cache-dir --disable-pip-version-check',
              'cp -au . /asset-output'
            ].join(' && ')
          ],
        },
      }),
      timeout: cdk.Duration.minutes(5), // UPDATED: Increased for tool execution
      memorySize: 3008, // OPTIMIZED: 1.7 vCPU for faster vehicle processing (was 1024)
      architecture: lambda.Architecture.X86_64,
      environment: {
        // Enhanced DynamoDB tables for session management
        CONVERSATION_TABLE: conversationTable.tableName,
        MESSAGE_TABLE: messageTable.tableName,
        VEHICLE_TABLE: vehicleTable.tableName,
        SESSION_CONTEXT_TABLE: sessionContextTable.tableName, // NEW: Anonymous user sessions
        
        // v0.2 ENHANCEMENT: Labor Estimate Reports table
        LABOR_ESTIMATE_REPORTS_TABLE: laborEstimateReportsTable.tableName,
        
        // NEW: Mechanic interface tables
        SHOP_TABLE: shopTable.tableName,
        MECHANIC_TABLE: mechanicTable.tableName,
        DIAGNOSIS_REVIEW_TABLE: diagnosisReviewTable.tableName,
        SHOP_VISITS_TABLE: shopVisitsTable.tableName, // NEW: Phase 1.1 - Shop Visit Recognition
        
        // NEW: Phase 2.1 - Customer Communication tables
        MECHANIC_REQUEST_TABLE: mechanicRequestTable.tableName,
        MECHANIC_MESSAGE_TABLE: mechanicMessageTable.tableName,
        MECHANIC_NOTIFICATION_TABLE: mechanicNotificationTable.tableName,
        
        // NEW: Phase 2.2 - Work Authorization Tracking table
        WORK_AUTHORIZATION_TABLE: workAuthorizationTable.tableName,
        
        // NEW: Phase 3.1 - Cost Estimation table
        COST_ESTIMATES_TABLE: costEstimatesTable.tableName,
        
        TAVILY_API_KEY: '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',
        
        // v0.2 FEATURE FLAGS - Control gradual migration
        USE_V2_HANDLER: 'true',            // Full v0.2 handler (ENABLED - matches deployed)
        USE_V2_LABOR_ESTIMATION: 'true',   // Multi-model labor estimation (ENABLED - matches deployed)
        USE_V2_ONBOARDING: 'true',         // Enhanced onboarding flow (ENABLED - matches deployed)
        
        // Strands best practices environment variables
        S3_SESSION_BUCKET: sessionBucket.bucketName,
        IMAGES_S3_BUCKET: imagesBucket.bucketName,
        STRANDS_IMPLEMENTATION: 'best-practices',
        SESSION_MANAGER_TYPE: 's3',
        CONVERSATION_MANAGER_TYPE: 'sliding-window',
        CONVERSATION_WINDOW_SIZE: '20',
        
        // Session management configuration
        ANONYMOUS_SESSION_TTL: '3600', // 1 hour in seconds
        MAX_VEHICLES_PER_USER: '10',
        DIXON_AWS_REGION: this.region, // Use custom name to avoid reserved AWS_REGION
      },
      description: 'Dixon Smart Repair - Strands Best Practices Implementation with S3 Session Management + v0.2 Features',
    });

    // Grant permissions to Lambda for all tables
    conversationTable.grantReadWriteData(strandsLambda);
    messageTable.grantReadWriteData(strandsLambda);
    vehicleTable.grantReadWriteData(strandsLambda);
    
    // Grant explicit permissions for vehicleTable GSI queries
    strandsLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:Query',
        'dynamodb:GetItem'
      ],
      resources: [
        vehicleTable.tableArn,
        `${vehicleTable.tableArn}/index/UserVehiclesIndex`,
        `${vehicleTable.tableArn}/index/UserVehiclesByDateIndex`
      ]
    }));
    
    sessionContextTable.grantReadWriteData(strandsLambda); // NEW: Session context table
    
    // v0.2 ENHANCEMENT: Grant permissions for new labor estimate reports table
    laborEstimateReportsTable.grantReadWriteData(strandsLambda);
    
    // Grant explicit permissions for laborEstimateReportsTable GSI queries
    strandsLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:Query',
        'dynamodb:GetItem'
      ],
      resources: [
        laborEstimateReportsTable.tableArn,
        `${laborEstimateReportsTable.tableArn}/index/ConversationReportsIndex`,
        `${laborEstimateReportsTable.tableArn}/index/UserReportsIndex`
      ]
    }));
    
    // NEW: Grant permissions for mechanic interface tables
    shopTable.grantReadWriteData(strandsLambda);
    mechanicTable.grantReadWriteData(strandsLambda);
    diagnosisReviewTable.grantReadWriteData(strandsLambda);
    shopVisitsTable.grantReadWriteData(strandsLambda); // NEW: Phase 1.1 - Shop Visit Recognition
    
    // NEW: Phase 2.1 - Grant permissions for customer communication tables
    mechanicRequestTable.grantReadWriteData(strandsLambda);
    mechanicMessageTable.grantReadWriteData(strandsLambda);
    mechanicNotificationTable.grantReadWriteData(strandsLambda);
    
    // NEW: Phase 2.2 - Grant permissions for work authorization tracking table
    workAuthorizationTable.grantReadWriteData(strandsLambda);
    
    // NEW: Phase 3.1 - Grant permissions for cost estimation tables
    costEstimatesTable.grantReadWriteData(strandsLambda);
    
    // Grant explicit permissions for GSI queries on all costEstimatesTable indexes
    strandsLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:Query',
        'dynamodb:GetItem'
      ],
      resources: [
        costEstimatesTable.tableArn,
        `${costEstimatesTable.tableArn}/index/ConversationIndex`,
        `${costEstimatesTable.tableArn}/index/UserIndex`,
        `${costEstimatesTable.tableArn}/index/StatusIndex`
      ]
    }));
    
    mechanicReviewsTable.grantReadWriteData(strandsLambda);
    workAuthorizationsTable.grantReadWriteData(strandsLambda);
    
    // NEW: Grant S3 permissions for session storage (Strands best practices)
    sessionBucket.grantReadWrite(strandsLambda);
    
    // NEW: Grant S3 permissions for image storage and processing
    imagesBucket.grantReadWrite(strandsLambda);
    
    // NEW: Admin Management Lambda Function
    const adminLambda = new lambda.Function(this, 'AdminManagementService', {
      functionName: 'dixon-admin-management',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'admin_management_service.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_11.bundlingImage,
          command: [
            'bash', '-c',
            'pip install --no-cache-dir -r requirements.txt -t /asset-output && cp -au . /asset-output'
          ],
        },
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        MECHANICS_TABLE: mechanicsTable.tableName,
        SHOP_TABLE: shopTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        LOG_LEVEL: 'INFO',
      },
      description: 'Dixon Smart Repair - Admin Management Service for shop owner functions',
    });

    // Grant permissions to admin Lambda
    mechanicsTable.grantReadWriteData(adminLambda);
    shopTable.grantReadWriteData(adminLambda);
    
    // Additional S3 permissions for Strands session management
    strandsLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetObjectVersion',
        's3:PutObjectVersion',
      ],
      resources: [
        sessionBucket.bucketArn,
        `${sessionBucket.bucketArn}/*`,
      ],
    }));

    strandsLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
        'bedrock:Converse',
        'bedrock:ConverseStream',
      ],
      resources: [
        // Comprehensive Bedrock access for all regions where Claude is available
        'arn:aws:bedrock:*::foundation-model/anthropic.claude-*',
        'arn:aws:bedrock:*:*:inference-profile/*',
        // Nova Pro model access
        'arn:aws:bedrock:*::foundation-model/amazon.nova-*',
        'arn:aws:bedrock:us-west-2::foundation-model/amazon.nova-*',
        // Specific regions for Claude models
        'arn:aws:bedrock:us-east-1::foundation-model/*',
        'arn:aws:bedrock:us-east-2::foundation-model/*', 
        'arn:aws:bedrock:us-west-2::foundation-model/*',
        'arn:aws:bedrock:eu-west-1::foundation-model/*',
        'arn:aws:bedrock:ap-southeast-1::foundation-model/*',
      ],
    }));

    // NEW: Amazon Textract permissions for VIN OCR processing
    strandsLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'textract:DetectDocumentText',
        'textract:AnalyzeDocument',
        'textract:GetDocumentAnalysis',
        'textract:GetDocumentTextDetection',
      ],
      resources: ['*'], // Textract doesn't support resource-level permissions
    }));

    // 4. 📡 AppSync GraphQL API
    const graphqlApi = new appsync.GraphqlApi(this, 'DixonGraphQLAPI', {
      name: 'dixon-smart-repair-api',
      definition: appsync.Definition.fromFile(path.join(__dirname, '../schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              // FIXED: Use fixed expiration date to prevent replacement
              expires: cdk.Expiration.atDate(new Date('2026-01-17')),
            },
          },
        ],
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      },
    });

    // Lambda Data Source
    const strandsDataSource = graphqlApi.addLambdaDataSource('StrandsDataSource', strandsLambda, {
      description: 'Strands Conversational Agent Data Source',
    });

    // GraphQL Resolvers
    strandsDataSource.createResolver('SendMessageResolver', {
      typeName: 'Mutation',
      fieldName: 'sendMessage',
    });

    strandsDataSource.createResolver('GetConversationResolver', {
      typeName: 'Query',
      fieldName: 'getConversation',
    });

    strandsDataSource.createResolver('CreateConversationResolver', {
      typeName: 'Mutation',
      fieldName: 'createConversation',
    });

    // NEW: Image Upload URL Generation Resolver
    strandsDataSource.createResolver('GenerateImageUploadUrlResolver', {
      typeName: 'Mutation',
      fieldName: 'generateImageUploadUrl',
    });

    // NEW: Phase 3.1 - All cost estimation resolvers use strands Lambda
    strandsDataSource.createResolver('GenerateEstimateResolver', {
      typeName: 'Mutation',
      fieldName: 'generateCostEstimate',
    });

    strandsDataSource.createResolver('GetEstimateResolver', {
      typeName: 'Query',
      fieldName: 'getCostEstimate',
    });

    // NEW: Add missing getUserCostEstimates resolver - points to strands Lambda where the handler exists
    strandsDataSource.createResolver('GetUserCostEstimatesResolver', {
      typeName: 'Query',
      fieldName: 'getUserCostEstimates',
    });

    // NEW: Add getUserLabourEstimates resolver - points to strands Lambda where the handler exists
    strandsDataSource.createResolver('GetUserLabourEstimatesResolver', {
      typeName: 'Query',
      fieldName: 'getUserLabourEstimates',
    });

    // NEW: Add getCostEstimateById resolver for completeness - points to strands Lambda where the handler exists
    strandsDataSource.createResolver('GetCostEstimateByIdResolver', {
      typeName: 'Query',
      fieldName: 'getCostEstimateById',
    });

    // NEW: Vehicle Management Resolvers - points to strands Lambda where the handlers exist
    strandsDataSource.createResolver('GetUserVehiclesResolver', {
      typeName: 'Query',
      fieldName: 'getUserVehicles',
    });

    strandsDataSource.createResolver('GetVehicleByIdResolver', {
      typeName: 'Query',
      fieldName: 'getVehicleById',
    });

    // NEW: Shop Visit Resolvers - points to strands Lambda where the handlers exist
    strandsDataSource.createResolver('GetUserVisitsResolver', {
      typeName: 'Query',
      fieldName: 'getUserVisits',
    });

    // NEW: User Conversations Resolver - points to strands Lambda where the handler exists
    strandsDataSource.createResolver('GetUserConversationsResolver', {
      typeName: 'Query',
      fieldName: 'getUserConversations',
    });

    // NEW: Title Generation Resolvers - points to strands Lambda where the handlers exist
    strandsDataSource.createResolver('GenerateConversationTitleResolver', {
      typeName: 'Mutation',
      fieldName: 'generateConversationTitle',
    });

    strandsDataSource.createResolver('UpdateConversationTitleResolver', {
      typeName: 'Mutation',
      fieldName: 'updateConversationTitle',
    });

    // NEW: Get Conversation Messages Resolver
    strandsDataSource.createResolver('GetConversationMessagesResolver', {
      typeName: 'Query',
      fieldName: 'getConversationMessages',
    });

    // 🔧 PHASE 1: CORE CUSTOMER-MECHANIC COMMUNICATION RESOLVERS
    // These resolvers connect the GraphQL schema to existing Lambda functions
    // Backend functions already exist in customer_communication_service.py
    
    // Phase 1.1: Customer creates mechanic request (first message)
    strandsDataSource.createResolver('RequestMechanicResolver', {
      typeName: 'Mutation',
      fieldName: 'requestMechanic',
    });

    // Phase 1.2: Customer sends follow-up messages to mechanic
    strandsDataSource.createResolver('SendMechanicMessageResolver', {
      typeName: 'Mutation',
      fieldName: 'sendMechanicMessage',
    });

    // 🔧 PHASE 2: MECHANIC DASHBOARD & RESPONSE FLOW RESOLVERS
    // These resolvers enable mechanics to see and respond to customer requests
    // Backend functions already exist in customer_communication_service.py and mechanic_service.py

    // Phase 2.1: Mechanic Dashboard Query Resolvers
    strandsDataSource.createResolver('GetQueuedRequestsResolver', {
      typeName: 'Query',
      fieldName: 'getQueuedRequests',
    });

    strandsDataSource.createResolver('GetMechanicMessagesResolver', {
      typeName: 'Query',
      fieldName: 'getMechanicMessages',
    });

    strandsDataSource.createResolver('GetShopStatisticsResolver', {
      typeName: 'Query',
      fieldName: 'getShopStatistics',
    });

    strandsDataSource.createResolver('GetPendingDiagnosesResolver', {
      typeName: 'Query',
      fieldName: 'getPendingDiagnoses',
    });

    strandsDataSource.createResolver('GetMechanicRequestByIdResolver', {
      typeName: 'Query',
      fieldName: 'getMechanicRequestById',
    });

    strandsDataSource.createResolver('GetMechanicRequestsResolver', {
      typeName: 'Query',
      fieldName: 'getMechanicRequests',
    });

    // Phase 2.2: Mechanic Response Resolvers
    strandsDataSource.createResolver('AssignMechanicRequestResolver', {
      typeName: 'Mutation',
      fieldName: 'assignMechanicRequest',
    });

    strandsDataSource.createResolver('UpdateRequestStatusResolver', {
      typeName: 'Mutation',
      fieldName: 'updateRequestStatus',
    });

    strandsDataSource.createResolver('UpdateModifiedEstimateResolver', {
      typeName: 'Mutation',
      fieldName: 'updateModifiedEstimate',
    });

    strandsDataSource.createResolver('ApproveModifiedEstimateResolver', {
      typeName: 'Mutation',
      fieldName: 'approveModifiedEstimate',
    });

    strandsDataSource.createResolver('RejectModifiedEstimateResolver', {
      typeName: 'Mutation',
      fieldName: 'rejectModifiedEstimate',
    });

    strandsDataSource.createResolver('ReviewDiagnosisResolver', {
      typeName: 'Mutation',
      fieldName: 'reviewDiagnosis',
    });

    // NEW: Phase 4 - Cost Estimation Review Flow Resolvers
    strandsDataSource.createResolver('ShareEstimateWithMechanicResolver', {
      typeName: 'Mutation',
      fieldName: 'shareEstimateWithMechanic',
    });

    strandsDataSource.createResolver('ReviewCostEstimateResolver', {
      typeName: 'Mutation',
      fieldName: 'reviewCostEstimate',
    });

    strandsDataSource.createResolver('RespondToEstimateReviewResolver', {
      typeName: 'Mutation',
      fieldName: 'respondToEstimateReview',
    });

    // 5. 🌐 S3 Bucket for Web App (SECURE: Private bucket with CloudFront access)
    const webAppBucket = new s3.Bucket(this, 'WebAppBucket', {
      // CRITICAL: Use existing bucket name to prevent recreation
      bucketName: 'dixon-smart-repair-web-041063310146',
      // SECURE: Keep bucket private (no website hosting needed)
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // CRITICAL: Protect bucket from deletion
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false, // Prevent accidental data loss
      versioned: true, // Enable versioning for safety
    });

    // SECURE: Create Origin Access Control for CloudFront (CDK v2 syntax)
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'WebAppOAC', {
      description: 'OAC for Dixon Smart Repair S3 bucket',
    });

    // CloudFront Distribution (SECURE: Uses OAC instead of public bucket)
    const distribution = new cloudfront.Distribution(this, 'WebAppDistribution', {
      // CRITICAL: Don't change this construct ID!
      defaultBehavior: {
        // SECURE: Use factory method for S3BucketOrigin with OAC
        origin: origins.S3BucketOrigin.withOriginAccessControl(webAppBucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true, // Enable compression
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5), // Short TTL for SPA routing
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5), // Handle S3 access denied for SPA routes
        },
      ],
      // Stable configuration to prevent recreation
      comment: 'Dixon Smart Repair - Web Application Distribution',
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // 5. 🔒 PHASE 5: Privacy & Data Management Infrastructure
    const privacyInfrastructure = new PrivacyInfrastructure(this, 'PrivacyInfrastructure', {
      sessionBucket,
      conversationTable,
      messageTable,
      vehicleTable,
      sessionContextTable,
    });

    // Create data source for admin Lambda
    const adminDataSource = graphqlApi.addLambdaDataSource('AdminDataSource', adminLambda);

    // NEW: Admin Management Resolvers
    adminDataSource.createResolver('CreateMechanicRecordResolver', {
      typeName: 'Mutation',
      fieldName: 'createMechanicRecord',
    });

    adminDataSource.createResolver('GetShopMechanicsResolver', {
      typeName: 'Query',
      fieldName: 'getShopMechanics',
    });

    adminDataSource.createResolver('UpdateMechanicStatusResolver', {
      typeName: 'Mutation',
      fieldName: 'updateMechanicStatus',
    });

    adminDataSource.createResolver('GetShopAnalyticsResolver', {
      typeName: 'Query',
      fieldName: 'getShopAnalytics',
    });

    // 6. 📤 Stack Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: graphqlApi.graphqlUrl,
      description: 'AppSync GraphQL API URL',
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: graphqlApi.apiKey || 'N/A',
      description: 'AppSync API Key',
    });

    new cdk.CfnOutput(this, 'StrandsLambdaArn', {
      value: strandsLambda.functionArn,
      description: 'Strands Chatbot Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'WebAppURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Web Application URL',
    });

    new cdk.CfnOutput(this, 'ConversationTableName', {
      value: conversationTable.tableName,
      description: 'DynamoDB Conversation Table Name',
    });

    new cdk.CfnOutput(this, 'MessageTableName', {
      value: messageTable.tableName,
      description: 'DynamoDB Message Table Name',
    });

    new cdk.CfnOutput(this, 'VehicleTableName', {
      value: vehicleTable.tableName,
      description: 'DynamoDB Vehicle Table Name',
    });

    new cdk.CfnOutput(this, 'SessionContextTableName', {
      value: sessionContextTable.tableName,
      description: 'DynamoDB Session Context Table Name (Anonymous Users)',
    });

    // Session management bucket output (Strands best practices)
    new cdk.CfnOutput(this, 'SessionBucketName', {
      value: sessionBucket.bucketName,
      description: 'S3 bucket for Strands session storage',
    });

    // Images bucket output
    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: imagesBucket.bucketName,
      description: 'S3 bucket for image storage and processing',
    });
  }
}
