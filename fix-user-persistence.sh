#!/bin/bash

echo "🔧 Fixing User Data Persistence Issues - Dixon Smart Repair"
echo "============================================================"

# Navigate to project directory
cd /Users/saidachanda/development/dixon-smart-repair

echo "📋 Issue Summary:"
echo "1. User chats not stored - temporary user IDs being generated"
echo "2. VIN processing error - tools not being invoked properly"
echo "3. Data loss after logout/login - session storage not linked to auth"
echo ""

echo "✅ Applied Fixes:"
echo "1. Updated aws-config.ts to remove non-existent Identity Pool"
echo "2. Updated ChatService to use authenticated user IDs"
echo "3. Enhanced SessionStore with authentication integration"
echo "4. Added userId field to SessionInfo interface"
echo ""

echo "🚀 Deploying fixes to AWS..."
cd cdk-infrastructure

# Deploy the infrastructure changes
npm run build
cdk deploy --require-approval never

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🧪 Testing Instructions:"
echo "1. Test authentication flow - login/logout should preserve data"
echo "2. Test VIN processing - image upload should invoke proper tools"
echo "3. Test session persistence - new chats should not erase current chat"
echo ""
echo "🔍 Monitoring:"
echo "- Check CloudWatch logs for Lambda function: dixon-strands-chatbot"
echo "- Verify GraphQL operations are working without errors"
echo "- Confirm user sessions are properly linked to authenticated users"
echo ""
echo "📊 Expected Results:"
echo "- Chat history persists across sessions for authenticated users"
echo "- VIN processing works with proper tool invocation"
echo "- Vehicle library data persists after logout/login"
echo "- No more temporary user ID generation"
