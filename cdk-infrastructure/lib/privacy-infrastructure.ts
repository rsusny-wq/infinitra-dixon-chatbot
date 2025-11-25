/**
 * Privacy Infrastructure - Phase 5: Privacy & Data Management
 * CDK infrastructure for GDPR/CCPA compliant privacy management
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface PrivacyInfrastructureProps {
  sessionBucket: s3.Bucket;
  conversationTable: dynamodb.Table;
  messageTable: dynamodb.Table;
  vehicleTable: dynamodb.Table;
  sessionContextTable: dynamodb.Table;
}

export class PrivacyInfrastructure extends Construct {
  public readonly privacyCleanupFunction: lambda.Function;
  public readonly privacyCleanupRole: iam.Role;

  constructor(scope: Construct, id: string, props: PrivacyInfrastructureProps) {
    super(scope, id);

    // Create IAM role for privacy cleanup Lambda
    this.privacyCleanupRole = new iam.Role(this, 'PrivacyCleanupRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for privacy cleanup Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions to access DynamoDB tables
    props.conversationTable.grantReadWriteData(this.privacyCleanupRole);
    props.messageTable.grantReadWriteData(this.privacyCleanupRole);
    props.vehicleTable.grantReadWriteData(this.privacyCleanupRole);
    props.sessionContextTable.grantReadWriteData(this.privacyCleanupRole);

    // Grant permissions to access S3 session bucket
    props.sessionBucket.grantReadWrite(this.privacyCleanupRole);

    // Grant additional permissions for privacy management
    this.privacyCleanupRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:Scan',
        'dynamodb:Query',
        'dynamodb:BatchWriteItem',
        'dynamodb:BatchGetItem',
        's3:ListBucket',
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: [
        props.conversationTable.tableArn,
        props.messageTable.tableArn,
        props.vehicleTable.tableArn,
        props.sessionContextTable.tableArn,
        `${props.conversationTable.tableArn}/index/*`,
        `${props.messageTable.tableArn}/index/*`,
        `${props.vehicleTable.tableArn}/index/*`,
        `${props.sessionContextTable.tableArn}/index/*`,
        props.sessionBucket.bucketArn,
        `${props.sessionBucket.bucketArn}/*`,
        'arn:aws:logs:*:*:*'
      ],
    }));

    // Create privacy cleanup Lambda function
    this.privacyCleanupFunction = new lambda.Function(this, 'PrivacyCleanupFunction', {
      functionName: 'dixon-privacy-cleanup',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'privacy_cleanup_handler.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(15), // Allow time for comprehensive cleanup
      memorySize: 1024,
      role: this.privacyCleanupRole,
      environment: {
        CONVERSATION_TABLE: props.conversationTable.tableName,
        MESSAGE_TABLE: props.messageTable.tableName,
        VEHICLE_TABLE: props.vehicleTable.tableName,
        SESSION_CONTEXT_TABLE: props.sessionContextTable.tableName,
        SESSION_BUCKET: props.sessionBucket.bucketName,
      },
      description: 'GDPR/CCPA compliant privacy data cleanup function',
    });

    // Create EventBridge rules for scheduled cleanup

    // Daily cleanup rule (every day at 2 AM UTC)
    const dailyCleanupRule = new events.Rule(this, 'DailyPrivacyCleanup', {
      ruleName: 'dixon-daily-privacy-cleanup',
      description: 'Daily privacy cleanup for anonymous sessions and expired data',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2'
      }),
    });

    dailyCleanupRule.addTarget(new targets.LambdaFunction(this.privacyCleanupFunction, {
      event: events.RuleTargetInput.fromObject({
        cleanup_type: 'daily',
        source: 'eventbridge-daily'
      })
    }));

    // Weekly cleanup rule (every Sunday at 3 AM UTC)
    const weeklyCleanupRule = new events.Rule(this, 'WeeklyPrivacyCleanup', {
      ruleName: 'dixon-weekly-privacy-cleanup',
      description: 'Weekly privacy cleanup for user data retention policies',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '3',
        weekDay: 'SUN'
      }),
    });

    weeklyCleanupRule.addTarget(new targets.LambdaFunction(this.privacyCleanupFunction, {
      event: events.RuleTargetInput.fromObject({
        cleanup_type: 'weekly',
        source: 'eventbridge-weekly'
      })
    }));

    // Monthly compliance check rule (first day of month at 4 AM UTC)
    const monthlyComplianceRule = new events.Rule(this, 'MonthlyComplianceCheck', {
      ruleName: 'dixon-monthly-compliance-check',
      description: 'Monthly privacy compliance report generation',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '4',
        day: '1'
      }),
    });

    monthlyComplianceRule.addTarget(new targets.LambdaFunction(this.privacyCleanupFunction, {
      event: events.RuleTargetInput.fromObject({
        cleanup_type: 'monthly',
        source: 'eventbridge-monthly'
      })
    }));

    // Grant EventBridge permission to invoke the Lambda function
    this.privacyCleanupFunction.addPermission('AllowEventBridgeInvoke', {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: dailyCleanupRule.ruleArn,
    });

    this.privacyCleanupFunction.addPermission('AllowEventBridgeInvokeWeekly', {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: weeklyCleanupRule.ruleArn,
    });

    this.privacyCleanupFunction.addPermission('AllowEventBridgeInvokeMonthly', {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: monthlyComplianceRule.ruleArn,
    });

    // Output important information
    new cdk.CfnOutput(this, 'PrivacyCleanupFunctionName', {
      value: this.privacyCleanupFunction.functionName,
      description: 'Privacy cleanup Lambda function name',
    });

    new cdk.CfnOutput(this, 'PrivacyCleanupFunctionArn', {
      value: this.privacyCleanupFunction.functionArn,
      description: 'Privacy cleanup Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'DailyCleanupRuleName', {
      value: dailyCleanupRule.ruleName!,
      description: 'Daily privacy cleanup EventBridge rule name',
    });

    new cdk.CfnOutput(this, 'WeeklyCleanupRuleName', {
      value: weeklyCleanupRule.ruleName!,
      description: 'Weekly privacy cleanup EventBridge rule name',
    });

    new cdk.CfnOutput(this, 'MonthlyComplianceRuleName', {
      value: monthlyComplianceRule.ruleName!,
      description: 'Monthly compliance check EventBridge rule name',
    });
  }
}
