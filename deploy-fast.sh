#!/bin/bash

# Fast deployment script for Lambda code-only changes
# Uses CDK hotswap to skip CloudFormation and directly update Lambda
# WARNING: Only use when you're certain no infrastructure changes are needed

set -e

echo "⚡ Fast Lambda Code Deployment"
echo "============================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check directory
if [ ! -f "cdk-infrastructure/package.json" ]; then
    echo "❌ Must run from dixon-smart-repair root directory"
    exit 1
fi

print_warning "🚨 FAST DEPLOYMENT MODE"
print_warning "This skips infrastructure validation and directly updates Lambda code"
print_warning "Only use when you're certain no infrastructure changes are needed"
echo ""

# Show what changed
print_status "📝 Recent changes in Lambda directory:"
if command -v git &> /dev/null; then
    git diff --name-only HEAD~1 cdk-infrastructure/lambda/ || echo "No git history or changes detected"
else
    echo "Git not available - showing recent files:"
    find cdk-infrastructure/lambda/ -name "*.py" -mtime -1 -exec basename {} \; 2>/dev/null || echo "No recent Python files"
fi
echo ""

# Quick confirmation
if [[ "$1" != "--yes" && "$1" != "-y" ]]; then
    read -p "Proceed with fast deployment? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi
fi

cd cdk-infrastructure

# Quick build (skip if no TypeScript changes)
if [ -f "lib/*.ts" ] && [ lib/*.ts -nt dist/ ] 2>/dev/null; then
    print_status "🔨 Building TypeScript..."
    npm run build
else
    print_status "⏭️  Skipping TypeScript build (no changes detected)"
fi

# Fast deployment with hotswap
print_status "🚀 Deploying with hotswap (bypassing CloudFormation)..."
start_time=$(date +%s)

if cdk deploy --profile dixonsmartrepair-dev --hotswap --require-approval never; then
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    print_success "✅ Fast deployment completed in ${duration} seconds!"
else
    echo "❌ Fast deployment failed"
    echo ""
    print_warning "💡 Try regular deployment if hotswap failed:"
    echo "./deploy.sh"
    exit 1
fi

# Quick verification
print_status "🔍 Verifying Lambda function update..."
FUNCTION_NAME="dixon-strands-chatbot"
LAST_MODIFIED=$(aws lambda get-function --function-name $FUNCTION_NAME --profile dixonsmartrepair-dev --query 'Configuration.LastModified' --output text 2>/dev/null || echo "Unknown")
print_success "Function last modified: $LAST_MODIFIED"

echo ""
print_success "🎉 Fast deployment complete!"
echo ""
print_status "🧪 Test your changes:"
echo "aws logs tail /aws/lambda/dixon-strands-chatbot --profile dixonsmartrepair-dev --follow"
echo ""
print_warning "⚠️  If you encounter issues, run full deployment:"
echo "./deploy.sh"

cd ..
