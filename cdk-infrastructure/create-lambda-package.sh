#!/bin/bash

# Create Lambda deployment package without Docker
set -e

echo "🔧 Creating Lambda deployment package..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
LAMBDA_DIR="$(pwd)/lambda"
PACKAGE_DIR="$TEMP_DIR/package"

echo "📦 Installing dependencies to $PACKAGE_DIR"

# Create package directory
mkdir -p "$PACKAGE_DIR"

# Install Python dependencies
pip3 install -r "$LAMBDA_DIR/requirements.txt" -t "$PACKAGE_DIR" --no-cache-dir --disable-pip-version-check

# Copy Lambda code
echo "📋 Copying Lambda code..."
cp -r "$LAMBDA_DIR"/*.py "$PACKAGE_DIR/"

# Create zip file
echo "🗜️ Creating deployment package..."
cd "$PACKAGE_DIR"
zip -r "$LAMBDA_DIR/function.zip" . -q

echo "✅ Lambda package created: $LAMBDA_DIR/function.zip"
echo "📊 Package size: $(du -h "$LAMBDA_DIR/function.zip" | cut -f1)"

# Cleanup
rm -rf "$TEMP_DIR"

echo "🎉 Lambda package ready for deployment!"
