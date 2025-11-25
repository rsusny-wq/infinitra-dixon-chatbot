#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DixonSmartRepairStack } from '../lib/dixon-smart-repair-stack';

const app = new cdk.App();

new DixonSmartRepairStack(app, 'DixonSmartRepairStack', {
  env: {
    account: '041063310146', // Our verified account
    region: 'us-west-2',     // Our verified region
  },
  description: 'Dixon Smart Repair - Automotive Diagnostic & Quote System',
  tags: {
    Project: 'DixonSmartRepair',
    Environment: 'Development',
    Owner: 'AgileAI-PDD-System',
  },
});