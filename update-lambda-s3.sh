#!/bin/bash

# Dixon Smart Repair - S3-based Lambda Update (For Large Packages)
# Fixes connection timeout issues by uploading to S3 first

set -e

# Configuration
LAMBDA_FUNCTION_NAME="dixon-strands-chatbot"
LAMBDA_DIR="cdk-infrastructure/lambda"
AWS_PROFILE="dixonsmartrepair-dev"
AWS_REGION="us-west-2"
S3_BUCKET="dixon-smart-repair-sessions-041063310146"  # Using existing bucket

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Dixon Smart Repair - S3-based Lambda Update${NC}"
echo -e "${BLUE}📋 Fixes connection timeouts for large packages${NC}"
echo "=================================================="

# Check lambda directory exists
if [ ! -d "$LAMBDA_DIR" ]; then
    echo -e "${RED}❌ Error: $LAMBDA_DIR not found${NC}"
    exit 1
fi

# Check requirements.txt exists
if [ ! -f "$LAMBDA_DIR/requirements.txt" ]; then
    echo -e "${RED}❌ Error: requirements.txt not found in $LAMBDA_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Step 1: Creating build directory...${NC}"
BUILD_DIR="$HOME/.lambda-build/lambda-build-$(date +%s)"
mkdir -p "$BUILD_DIR"

echo -e "${BLUE}📋 Step 2: Copying lambda folder...${NC}"
# Use -a flag to preserve all attributes and handle hidden files
cp -a "$LAMBDA_DIR"/. "$BUILD_DIR/"

echo -e "${BLUE}🐍 Step 3: Installing dependencies with Docker (CDK-compatible)...${NC}"
cd "$BUILD_DIR"

# Debug: Show current directory and files
echo -e "${BLUE}🔍 Debug: Current directory: $(pwd)${NC}"
echo -e "${BLUE}🔍 Debug: Files in directory:${NC}"
ls -la | head -5

echo -e "${BLUE}📦 Step 4: Installing dependencies with Python 3.11 Docker bundling...${NC}"

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is required for CDK-compatible dependency installation${NC}"
    echo -e "${YELLOW}💡 Please install Docker or use CDK deployment: cd cdk-infrastructure && cdk deploy${NC}"
    exit 1
fi

# Debug: Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: requirements.txt not found in build directory${NC}"
    ls -la
    exit 1
fi

# Use the exact same Docker approach as CDK bundling
# CDK uses: lambda.Runtime.PYTHON_3_11.bundlingImage = public.ecr.aws/sam/build-python3.11
echo -e "${BLUE}🔍 Debug: Using exact CDK bundling image and pattern${NC}"

# Create a temporary output directory in user home (Docker can access this)
TEMP_OUTPUT="$HOME/.lambda-build/asset-output-$(date +%s)"
mkdir -p "$TEMP_OUTPUT"

# Use the exact CDK bundling image and command pattern
docker run --rm \
    --platform linux/amd64 \
    -v "$(pwd)":/asset-input \
    -v "$TEMP_OUTPUT":/asset-output \
    -w /asset-input \
    public.ecr.aws/sam/build-python3.11 \
    bash -c "pip install -r requirements.txt -t /asset-output --no-cache-dir --disable-pip-version-check && cp -au . /asset-output"

# Move the bundled result back to current directory
rm -rf ./*
cp -r "$TEMP_OUTPUT"/* .
rm -rf "$TEMP_OUTPUT"

echo -e "${BLUE}🧹 Step 5: CDK-compatible Docker bundling complete...${NC}"

echo -e "${BLUE}📦 Step 6: Creating deployment package...${NC}"
DEPLOYMENT_ZIP="/tmp/lambda-deployment-$(date +%s).zip"
zip -r "$DEPLOYMENT_ZIP" . -x "*.pyc" "*/__pycache__/*" "*.git*" "*.DS_Store" > /dev/null

PACKAGE_SIZE=$(du -h "$DEPLOYMENT_ZIP" | cut -f1)
PACKAGE_SIZE_BYTES=$(stat -f%z "$DEPLOYMENT_ZIP" 2>/dev/null || stat -c%s "$DEPLOYMENT_ZIP" 2>/dev/null)
echo -e "${BLUE}📊 Package size: $PACKAGE_SIZE${NC}"

# Check if package is large (>10MB) and use S3 upload
if [ "$PACKAGE_SIZE_BYTES" -gt 10485760 ]; then
    echo -e "${YELLOW}⚠️ Large package detected ($PACKAGE_SIZE) - using S3 upload method${NC}"
    
    # Step 7a: Upload to S3
    S3_KEY="lambda-deployments/$(basename "$DEPLOYMENT_ZIP")"
    echo -e "${BLUE}📤 Step 7a: Uploading to S3...${NC}"
    aws s3 cp "$DEPLOYMENT_ZIP" "s3://$S3_BUCKET/$S3_KEY" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE"
    
    # Step 7b: Update Lambda from S3
    echo -e "${BLUE}🚀 Step 7b: Updating Lambda from S3...${NC}"
    aws lambda update-function-code \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --s3-bucket "$S3_BUCKET" \
        --s3-key "$S3_KEY" \
        --output table \
        --query '{FunctionName:FunctionName,LastModified:LastModified,CodeSize:CodeSize}'
    
    # Cleanup S3 object
    echo -e "${BLUE}🧹 Cleaning up S3 object...${NC}"
    aws s3 rm "s3://$S3_BUCKET/$S3_KEY" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE"
        
else
    # Step 7: Direct upload for small packages
    echo -e "${BLUE}🚀 Step 7: Direct Lambda update...${NC}"
    aws lambda update-function-code \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --zip-file "fileb://$DEPLOYMENT_ZIP" \
        --output table \
        --query '{FunctionName:FunctionName,LastModified:LastModified,CodeSize:CodeSize}'
fi

echo -e "${BLUE}🧹 Step 8: Cleanup...${NC}"
rm -f "$DEPLOYMENT_ZIP"
rm -rf "$BUILD_DIR"
rm -rf "$HOME/.lambda-build"

echo -e "${GREEN}✅ Lambda update completed successfully!${NC}"
echo -e "${BLUE}💡 S3 method prevents connection timeouts for large packages${NC}"
