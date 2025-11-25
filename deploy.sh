#!/bin/bash

# Dixon Smart Repair - Unified Deployment Script
# Deploys infrastructure changes first, then frontend
# Uses dynamic AWS credential retrieval for security

set -e  # Exit on any error

echo "🚗 Dixon Smart Repair - Unified Deployment"
echo "=========================================="

# Configuration
AWS_PROFILE="dixonsmartrepair-dev"
REGION="us-west-2"
S3_BUCKET="dixon-smart-repair-web-041063310146"
CLOUDFRONT_DISTRIBUTION_ID="E3M90OK3DMB2D0"
FRONTEND_DIR="dixon-smart-repair-app"
CDK_DIR="cdk-infrastructure"

# Function to get AWS credentials dynamically
get_aws_credentials() {
    echo "🔐 Retrieving AWS credentials dynamically..."
    
    # Check if SSO session is valid
    if ! aws sts get-caller-identity --profile "$AWS_PROFILE" > /dev/null 2>&1; then
        echo "🔄 AWS SSO session expired. Logging in..."
        aws sso login --profile "$AWS_PROFILE"
        
        # Wait a moment for SSO to complete
        sleep 2
    fi
    
    # Get temporary credentials from SSO with retry logic
    echo "🎫 Getting temporary credentials..."
    local retry_count=0
    local max_retries=3
    
    while [ $retry_count -lt $max_retries ]; do
        CREDS=$(aws configure export-credentials --profile "$AWS_PROFILE" --format env 2>/dev/null)
        
        if [ $? -eq 0 ] && [ -n "$CREDS" ]; then
            break
        fi
        
        retry_count=$((retry_count + 1))
        echo "⚠️ Credential retrieval failed. Retry $retry_count/$max_retries..."
        
        if [ $retry_count -eq $max_retries ]; then
            echo "❌ Error: Failed to get AWS credentials after $max_retries attempts"
            echo "Please run: aws sso login --profile $AWS_PROFILE"
            exit 1
        fi
        
        sleep 2
    done
    
    # Export credentials as environment variables
    eval "$CREDS"
    
    # Verify credentials work
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
    if [ $? -ne 0 ] || [ -z "$ACCOUNT_ID" ]; then
        echo "❌ Error: Credentials verification failed"
        echo "Please run: aws sso login --profile $AWS_PROFILE"
        exit 1
    fi
    
    echo "✅ Successfully authenticated as account: $ACCOUNT_ID"
    
    # Export additional required variables
    export AWS_REGION="$REGION"
    export AWS_DEFAULT_REGION="$REGION"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo ""
    echo "🏗️ PHASE 1: Infrastructure Deployment"
    echo "====================================="
    
    # Check if CDK directory exists
    if [ ! -d "$CDK_DIR" ]; then
        echo "❌ Error: CDK directory '$CDK_DIR' not found"
        exit 1
    fi
    
    cd "$CDK_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing CDK dependencies..."
        npm install
    fi
    
    # Compile TypeScript
    echo "🔨 Compiling TypeScript..."
    npm run build
    
    # CRITICAL: Check what will change before deploying
    echo "🔍 Checking infrastructure changes..."
    echo "Looking for dangerous resource deletions..."
    
    # Run cdk diff and capture output
    DIFF_OUTPUT=$(cdk diff 2>&1 || true)
    
    # Parse the diff output more intelligently
    echo "🔍 Analyzing deployment changes..."
    
    # Look for actual S3 bucket destruction (not policy or auto-delete changes)
    # Pattern: [-] AWS::S3::Bucket WebAppBucket WebAppBucket8F6FA179 destroy
    BUCKET_DESTRUCTION=$(echo "$DIFF_OUTPUT" | grep -E "\[-\] AWS::S3::Bucket\s+WebAppBucket\s+WebAppBucket[A-Z0-9]+\s+destroy" || true)
    if [ -n "$BUCKET_DESTRUCTION" ]; then
        echo "🚨 DANGER: S3 Bucket will be DELETED!"
        echo "This could cause data loss. Deployment STOPPED."
        echo ""
        echo "Dangerous change detected:"
        echo "$BUCKET_DESTRUCTION"
        exit 1
    fi
    
    # Look for CloudFront distribution destruction
    CLOUDFRONT_DESTRUCTION=$(echo "$DIFF_OUTPUT" | grep -E "\[-\] AWS::CloudFront::Distribution.*destroy" || true)
    if [ -n "$CLOUDFRONT_DESTRUCTION" ]; then
        echo "🚨 DANGER: CloudFront Distribution will be DELETED!"
        echo "This will change your web app URL. Deployment STOPPED."
        echo ""
        echo "Dangerous change detected:"
        echo "$CLOUDFRONT_DESTRUCTION"
        exit 1
    fi
    
    # Check for auto-delete resource removal (this is actually good!)
    AUTO_DELETE_REMOVAL=$(echo "$DIFF_OUTPUT" | grep -E "\[-\] Custom::S3AutoDeleteObjects" || true)
    if [ -n "$AUTO_DELETE_REMOVAL" ]; then
        echo "✅ GOOD: Removing dangerous auto-delete resources (this protects your bucket)"
    fi
    
    # Check for bucket policy removal (also good when removing auto-delete)
    BUCKET_POLICY_REMOVAL=$(echo "$DIFF_OUTPUT" | grep -E "\[-\] AWS::S3::BucketPolicy.*WebAppBucket/Policy" || true)
    if [ -n "$BUCKET_POLICY_REMOVAL" ]; then
        echo "✅ GOOD: Removing auto-delete bucket policy (this protects your bucket)"
    fi
    
    # Check for security-related changes and inform user
    SECURITY_CHANGES=$(echo "$DIFF_OUTPUT" | grep -E "\[+\].*AWS::S3::BucketPolicy|\[+\].*AWS::CloudFront::OriginAccessControl" || true)
    if [ -n "$SECURITY_CHANGES" ]; then
        echo "🔒 SECURITY CHANGES DETECTED:"
        echo "  • S3 Bucket Policy: Allows CloudFront access via Origin Access Control"
        echo "  • Origin Access Control: Secure connection between CloudFront and S3"
        echo "  • These changes IMPROVE security by making S3 bucket private"
        echo ""
    fi
    
    # Show the diff output
    echo "📋 Infrastructure changes:"
    echo "$DIFF_OUTPUT"
    
    # Check if there are any changes
    if echo "$DIFF_OUTPUT" | grep -q "There were no differences"; then
        echo "✅ No infrastructure changes detected. Skipping CDK deployment."
        INFRA_DEPLOYED=false
    else
        # Confirm deployment
        echo ""
        echo "🤔 Do you want to proceed with infrastructure deployment? (y/N)"
        read -r CONFIRM
        
        if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
            echo "❌ Infrastructure deployment cancelled by user"
            exit 0
        fi
        
        # Deploy with safety checks
        echo "🚀 Deploying infrastructure changes..."
        echo "📋 Note: Security changes (bucket policies, OAC) will be auto-approved"
        
        # FIXED: Use --require-approval never to handle security changes in automated deployment
        # Also handle potential credential expiration during deployment
        if ! cdk deploy --require-approval never; then
            echo "❌ CDK deployment failed. Checking for credential issues..."
            
            # Check if credentials expired during deployment
            if ! aws sts get-caller-identity > /dev/null 2>&1; then
                echo "🔄 Credentials expired during deployment. Refreshing..."
                get_aws_credentials
                echo "🔄 Retrying deployment with fresh credentials..."
                cdk deploy --require-approval never
            else
                echo "❌ Deployment failed for reasons other than credentials"
                exit 1
            fi
        fi
        
        echo "✅ Infrastructure deployment completed!"
        INFRA_DEPLOYED=true
    fi
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo ""
    echo "🌐 PHASE 2: Frontend Deployment"
    echo "==============================="
    
    # Check if frontend directory exists
    if [ ! -d "$FRONTEND_DIR" ]; then
        echo "❌ Error: Frontend directory '$FRONTEND_DIR' not found"
        exit 1
    fi
    
    # Check if S3 bucket exists
    echo "🪣 Checking S3 bucket..."
    if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
        echo "❌ Error: S3 bucket '$S3_BUCKET' not accessible"
        echo "Make sure the bucket exists and you have permissions"
        exit 1
    fi
    
    # Build the frontend
    echo "🔨 Building Expo React Native app for web..."
    cd "$FRONTEND_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    # Check if this is an Expo app
    if [ -f "app.json" ] && command -v npx >/dev/null 2>&1; then
        echo "🏗️ Exporting Expo app for web deployment..."
        
        # Clean previous builds
        rm -rf dist web-build
        
        # Export for web using Expo
        npx expo export --platform web --output-dir dist
        
        # Check if export was successful
        if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
            echo "❌ Error: Expo web export failed - 'dist' directory is empty"
            echo "Trying alternative build method..."
            
            # Try using expo build:web if available
            if npx expo --help | grep -q "build:web"; then
                npx expo build:web
                BUILD_DIR="web-build"
            else
                echo "❌ Error: Unable to build Expo app for web"
                echo "Please ensure Expo CLI is properly configured"
                exit 1
            fi
        else
            BUILD_DIR="dist"
        fi
    else
        echo "❌ Error: This appears to be an Expo app but Expo CLI is not available"
        echo "Please install Expo CLI: npm install -g @expo/cli"
        exit 1
    fi
    
    # Deploy to S3
    echo "📤 Deploying to S3 bucket: $S3_BUCKET"
    echo "Using build directory: $BUILD_DIR"
    
    # Sync files with appropriate cache headers
    aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" --delete \
        --cache-control "max-age=31536000" --exclude "*.html" --exclude "*.json"
    
    # HTML and JSON files with no-cache headers
    aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" \
        --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
        --include "*.html" --include "*.json"
    
    # Invalidate CloudFront cache
    echo "🔄 Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
    
    cd ..
}

# Function to show deployment summary
show_summary() {
    echo ""
    echo "🎉 Unified Deployment Completed Successfully!"
    echo "============================================"
    
    # Get the CloudFront URL
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name DixonSmartRepairStack \
        --query 'Stacks[0].Outputs[?OutputKey==`WebAppURL`].OutputValue' \
        --output text)
    
    echo ""
    echo "📋 Deployment Summary:"
    echo "  • Infrastructure: ${INFRA_DEPLOYED:-false}"
    echo "  • Frontend: ✅ Deployed"
    echo "  • S3 Bucket: $S3_BUCKET"
    echo "  • CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    echo "  • Web App URL: $CLOUDFRONT_URL"
    echo "  • Cache Invalidation: $INVALIDATION_ID"
    echo ""
    echo "🌐 Your app is available at: $CLOUDFRONT_URL"
    echo "⏱️ Cache invalidation may take 5-15 minutes to complete"
    echo "🔒 Security: Credentials were retrieved dynamically and are temporary"
    echo ""
    echo "💡 Next Steps:"
    echo "  • Test your application at the URL above"
    echo "  • For future deployments, run: ./deploy.sh"
    echo "  • For Lambda-only updates, use: cd cdk-infrastructure && cdk deploy"
}

# Main execution
main() {
    echo "🚀 Starting unified deployment process..."
    echo ""
    
    # Get AWS credentials
    get_aws_credentials
    
    # Deploy infrastructure first
    deploy_infrastructure
    
    # Deploy frontend second
    deploy_frontend
    
    # Show summary
    show_summary
}

# Frontend-only deployment
frontend_only() {
    echo "🌐 Starting frontend-only deployment process..."
    echo ""
    
    # Get AWS credentials
    get_aws_credentials
    
    # Deploy frontend only
    deploy_frontend
    
    # Show frontend-only summary
    echo ""
    echo "🎉 Frontend-Only Deployment Completed Successfully!"
    echo "================================================="
    echo ""
    echo "📋 Deployment Summary:"
    echo "  • Infrastructure: ⏭️ Skipped"
    echo "  • Frontend: ✅ Deployed"
    echo "  • S3 Bucket: $S3_BUCKET"
    echo "  • CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    echo ""
    echo "🌐 Your application is available at:"
    echo "  https://d37f64klhjdi5b.cloudfront.net"
    echo ""
    echo "⏰ Note: CloudFront cache invalidation may take 5-15 minutes to propagate globally"
    echo ""
}

# Check for flags
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Dixon Smart Repair - Unified Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [OPTIONS]"
    echo ""
    echo "This script will:"
    echo "  1. Get AWS credentials dynamically from SSO"
    echo "  2. Deploy infrastructure changes (if any)"
    echo "  3. Build and deploy the React frontend"
    echo "  4. Invalidate CloudFront cache"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  --frontend-only      Deploy only the frontend (skip infrastructure)"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh                    # Full deployment (infrastructure + frontend)"
    echo "  ./deploy.sh --frontend-only    # Frontend-only deployment"
    echo ""
    echo "Prerequisites:"
    echo "  • AWS CLI configured with SSO profile 'dixonsmartrepair-dev'"
    echo "  • Node.js and npm installed"
    echo "  • CDK CLI installed (for full deployment)"
    echo ""
    exit 0
elif [[ "$1" == "--frontend-only" ]]; then
    # Run frontend-only deployment
    frontend_only
else
    # Run main function (full deployment)
    main
fi
