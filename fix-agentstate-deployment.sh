#!/bin/bash

# Dixon Smart Repair - Fix AgentState API Issues Deployment
# This script deploys the fixed versions of the Lambda handler and atomic tools

set -e

echo "🔧 Dixon Smart Repair - Fixing AgentState API Issues"
echo "=================================================="

# Change to project directory
cd "$(dirname "$0")"

# Backup current files
echo "📦 Creating backup of current files..."
BACKUP_DIR="backup-agentstate-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp cdk-infrastructure/lambda/strands_best_practices_handler.py "$BACKUP_DIR/"
cp cdk-infrastructure/lambda/automotive_tools_atomic.py "$BACKUP_DIR/"

echo "✅ Backup created in: $BACKUP_DIR"

# Replace with fixed versions
echo "🔄 Deploying fixed versions..."

# Replace the main handler with fixed version
cp cdk-infrastructure/lambda/strands_best_practices_handler_fixed.py cdk-infrastructure/lambda/strands_best_practices_handler.py

# Replace atomic tools with fixed version
cp cdk-infrastructure/lambda/automotive_tools_atomic_fixed.py cdk-infrastructure/lambda/automotive_tools_atomic.py

echo "✅ Fixed files deployed locally"

# Deploy to AWS
echo "🚀 Deploying to AWS Lambda..."

# Change to CDK directory
cd cdk-infrastructure

# Build and deploy
echo "📦 Building CDK infrastructure..."
npm run build

echo "🚀 Deploying to AWS..."
cdk deploy --require-approval never

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "✅ Fixed AgentState API issues:"
echo "   - Removed TTL parameters from agent.state.set() calls"
echo "   - Fixed agent.state.get() calls to not use default value parameter"
echo "   - Added safe_agent_state_get() helper function"
echo ""
echo "🔍 Issues resolved:"
echo "   1. AgentState.get() takes from 1 to 2 positional arguments but 3 were given"
echo "   2. AgentState.set() got an unexpected keyword argument 'ttl'"
echo "   3. Repair procedure lookup error with TTL parameter"
echo "   4. Session metadata update errors with default values"
echo ""
echo "📊 Expected improvements:"
echo "   - Tools will execute without AgentState errors"
echo "   - Tavily web search integration should work properly"
echo "   - Session metadata updates will work correctly"
echo "   - No more <thinking> error messages in responses"
echo ""
echo "🧪 Test the deployment:"
echo "   aws lambda invoke --function-name dixon-strands-chatbot --payload file://test-atomic-success-final.json response.json"
echo ""
echo "📋 Monitor CloudWatch logs:"
echo "   aws logs filter-log-events --log-group-name /aws/lambda/dixon-strands-chatbot --start-time \$(date -d '5 minutes ago' +%s)000"
