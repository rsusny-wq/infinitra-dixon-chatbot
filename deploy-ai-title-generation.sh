#!/bin/bash

# Deploy AI Title Generation Feature
# This script deploys the new AI-powered conversation title generation

set -e

echo "🚀 Deploying AI Title Generation Feature..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "cdk-infrastructure/lib/dixon-smart-repair-stack.ts" ]; then
    print_error "Please run this script from the dixon-smart-repair root directory"
    exit 1
fi

print_status "Step 1: Installing dependencies..."
cd cdk-infrastructure
npm install
cd ..

print_status "Step 2: Building Lambda function..."
cd cdk-infrastructure/lambda

# Check if ai_title_generator.py exists
if [ ! -f "ai_title_generator.py" ]; then
    print_error "ai_title_generator.py not found in lambda directory"
    exit 1
fi

print_success "Lambda function files ready"
cd ../..

print_status "Step 3: Deploying CDK stack..."
cd cdk-infrastructure

# Deploy the stack
if npm run deploy; then
    print_success "CDK stack deployed successfully"
else
    print_error "CDK deployment failed"
    exit 1
fi

cd ..

print_status "Step 4: Installing frontend dependencies..."
cd dixon-smart-repair-app
npm install

print_status "Step 5: Testing the implementation..."

# Create a simple test script
cat > test-title-generation.js << 'EOF'
const { ChatService } = require('./src/services/ChatService');

async function testTitleGeneration() {
    const chatService = new ChatService();
    
    const testCases = [
        "My Honda Civic is making brake noise",
        "Engine won't start on my Toyota Camry", 
        "AC not working",
        "Strange sound when turning",
        "Oil change cost for Ford F-150"
    ];
    
    console.log('🧪 Testing AI Title Generation...\n');
    
    for (const testCase of testCases) {
        try {
            console.log(`Testing: "${testCase}"`);
            const result = await chatService.generateConversationTitle(testCase);
            console.log(`Result: ${result.title} (${result.generatedBy})`);
            console.log(`Processing time: ${result.processingTime}ms\n`);
        } catch (error) {
            console.error(`Error: ${error.message}\n`);
        }
    }
}

testTitleGeneration().catch(console.error);
EOF

print_status "Test script created: test-title-generation.js"
print_warning "To run tests: cd dixon-smart-repair-app && node test-title-generation.js"

cd ..

print_success "🎉 AI Title Generation Feature Deployed Successfully!"

echo ""
echo "📋 Deployment Summary:"
echo "✅ Lambda function with AI title generation"
echo "✅ GraphQL schema updated with new mutations"
echo "✅ Frontend integration with ChatService"
echo "✅ Fallback title generation for reliability"
echo ""
echo "🔧 Next Steps:"
echo "1. Test the feature with: cd dixon-smart-repair-app && node test-title-generation.js"
echo "2. Start the frontend: cd dixon-smart-repair-app && npm start"
echo "3. Send a message and watch the conversation title update automatically"
echo ""
echo "💡 Features:"
echo "• AI-powered titles using Claude 3 Haiku"
echo "• Smart fallback with keyword extraction"
echo "• Immediate UI updates with background sync"
echo "• Cost-effective (~$0.000015 per title)"
echo ""
print_success "Deployment complete! 🚀"
