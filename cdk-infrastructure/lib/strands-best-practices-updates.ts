import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * CDK Infrastructure Updates for Strands Best Practices Implementation
 * 
 * This file contains the necessary infrastructure changes to support
 * the refactored Dixon Smart Repair implementation following Strands best practices.
 */

export class StrandsBestPracticesUpdates extends Construct {
  public readonly sessionBucket: s3.Bucket;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: {
    existingLambdaFunction?: lambda.Function;
  }) {
    super(scope, id);

    // 1. Create S3 Bucket for Session Storage
    this.sessionBucket = new s3.Bucket(this, 'SessionBucket', {
      bucketName: `dixon-smart-repair-sessions-${cdk.Aws.ACCOUNT_ID}`,
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
    });

    // 2. Create or Update Lambda Function with Strands Best Practices
    if (props.existingLambdaFunction) {
      // Update existing Lambda function
      this.lambdaFunction = props.existingLambdaFunction;
      this.updateExistingLambda();
    } else {
      // Create new Lambda function
      this.lambdaFunction = this.createNewLambda();
    }

    // 3. Add S3 Permissions to Lambda
    this.addS3Permissions();

    // 4. Add CloudWatch Permissions for Enhanced Monitoring
    this.addCloudWatchPermissions();

    // 5. Output important values
    new cdk.CfnOutput(this, 'SessionBucketName', {
      value: this.sessionBucket.bucketName,
      description: 'S3 bucket for Strands session storage',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda function ARN for Strands best practices implementation',
    });
  }

  private createNewLambda(): lambda.Function {
    return new lambda.Function(this, 'StrandsLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'strands-best-practices-handler.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(5), // Increased timeout for tool execution
      memorySize: 1024, // Increased memory for better performance
      environment: {
        // Core environment variables
        S3_SESSION_BUCKET: this.sessionBucket.bucketName,
        AWS_REGION: cdk.Aws.REGION,
        
        // Existing environment variables (maintain compatibility)
        CONVERSATION_TABLE: process.env.CONVERSATION_TABLE || 'dixon-conversations',
        MESSAGE_TABLE: process.env.MESSAGE_TABLE || 'dixon-messages',
        TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
        
        // Strands configuration
        STRANDS_IMPLEMENTATION: 'best-practices',
        SESSION_MANAGER_TYPE: 's3',
        CONVERSATION_MANAGER_TYPE: 'sliding-window',
        CONVERSATION_WINDOW_SIZE: '20',
      },
      layers: [
        // Add Strands Agents layer if available
        // lambda.LayerVersion.fromLayerVersionArn(this, 'StrandsLayer', 'arn:aws:lambda:region:account:layer:strands-agents:version')
      ],
      deadLetterQueue: new cdk.aws_sqs.Queue(this, 'StrandsLambdaDLQ', {
        queueName: 'dixon-smart-repair-strands-dlq',
        retentionPeriod: cdk.Duration.days(14),
      }),
      reservedConcurrentExecutions: 10, // Limit concurrent executions
    });
  }

  private updateExistingLambda(): void {
    // Add Strands-specific environment variables
    this.lambdaFunction.addEnvironment('S3_SESSION_BUCKET', this.sessionBucket.bucketName);
    this.lambdaFunction.addEnvironment('STRANDS_IMPLEMENTATION', 'best-practices');
    this.lambdaFunction.addEnvironment('SESSION_MANAGER_TYPE', 's3');
    this.lambdaFunction.addEnvironment('CONVERSATION_MANAGER_TYPE', 'sliding-window');
    this.lambdaFunction.addEnvironment('CONVERSATION_WINDOW_SIZE', '20');
  }

  private addS3Permissions(): void {
    // Grant S3 permissions for session management
    this.sessionBucket.grantReadWrite(this.lambdaFunction);
    
    // Additional specific permissions for Strands session management
    this.lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
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
        this.sessionBucket.bucketArn,
        `${this.sessionBucket.bucketArn}/*`,
      ],
    }));
  }

  private addCloudWatchPermissions(): void {
    // Enhanced CloudWatch permissions for Strands monitoring
    this.lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
        'logs:DescribeLogGroups',
      ],
      resources: ['*'],
    }));
  }

  // Method to create CloudWatch Dashboard for monitoring
  public createMonitoringDashboard(): cdk.aws_cloudwatch.Dashboard {
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, 'StrandsMonitoringDashboard', {
      dashboardName: 'Dixon-Smart-Repair-Strands-Monitoring',
    });

    // Lambda function metrics
    const lambdaWidget = new cdk.aws_cloudwatch.GraphWidget({
      title: 'Lambda Function Metrics',
      left: [
        this.lambdaFunction.metricDuration(),
        this.lambdaFunction.metricInvocations(),
        this.lambdaFunction.metricErrors(),
      ],
    });

    // S3 session storage metrics
    const s3Widget = new cdk.aws_cloudwatch.GraphWidget({
      title: 'S3 Session Storage Metrics',
      left: [
        new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'NumberOfObjects',
          dimensionsMap: {
            BucketName: this.sessionBucket.bucketName,
            StorageType: 'AllStorageTypes',
          },
        }),
        new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'BucketSizeBytes',
          dimensionsMap: {
            BucketName: this.sessionBucket.bucketName,
            StorageType: 'StandardStorage',
          },
        }),
      ],
    });

    // Custom metrics for Strands performance
    const strandsWidget = new cdk.aws_cloudwatch.GraphWidget({
      title: 'Strands Performance Metrics',
      left: [
        new cdk.aws_cloudwatch.Metric({
          namespace: 'Dixon/Strands',
          metricName: 'SessionCreated',
        }),
        new cdk.aws_cloudwatch.Metric({
          namespace: 'Dixon/Strands',
          metricName: 'ToolExecutions',
        }),
        new cdk.aws_cloudwatch.Metric({
          namespace: 'Dixon/Strands',
          metricName: 'ConversationContextPreserved',
        }),
      ],
    });

    dashboard.addWidgets(lambdaWidget, s3Widget, strandsWidget);
    return dashboard;
  }

  // Method to create alarms for monitoring
  public createAlarms(): void {
    // Lambda error rate alarm
    new cdk.aws_cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: this.lambdaFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function error rate is too high',
    });

    // Lambda duration alarm
    new cdk.aws_cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      metric: this.lambdaFunction.metricDuration({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 30000, // 30 seconds
      evaluationPeriods: 3,
      alarmDescription: 'Lambda function duration is too high',
    });

    // S3 bucket size alarm (to monitor session storage growth)
    new cdk.aws_cloudwatch.Alarm(this, 'S3BucketSizeAlarm', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: 'BucketSizeBytes',
        dimensionsMap: {
          BucketName: this.sessionBucket.bucketName,
          StorageType: 'StandardStorage',
        },
        period: cdk.Duration.hours(24),
      }),
      threshold: 1000000000, // 1GB
      evaluationPeriods: 1,
      alarmDescription: 'S3 session bucket size is growing too large',
    });
  }
}

// Usage example in main stack:
/*
export class DixonSmartRepairStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ... existing stack resources ...

    // Add Strands best practices updates
    const strandsUpdates = new StrandsBestPracticesUpdates(this, 'StrandsUpdates', {
      existingLambdaFunction: existingLambdaFunction, // optional
    });

    // Create monitoring dashboard
    strandsUpdates.createMonitoringDashboard();

    // Create alarms
    strandsUpdates.createAlarms();

    // Update AppSync resolvers to use new Lambda function
    // ... resolver updates ...
  }
}
*/
