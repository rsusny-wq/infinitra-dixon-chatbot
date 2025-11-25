#!/bin/bash

# Fix MIME types for Dixon Smart Repair S3 bucket
BUCKET_NAME="dixon-smart-repair-web-041063310146-us-west-2"
DISTRIBUTION_ID="E3O9SWERBC1LGV"

echo "🔧 Fixing MIME types for Dixon Smart Repair web assets..."

# Set correct content-type for JavaScript files
echo "Setting content-type for JavaScript files..."
aws s3 cp s3://$BUCKET_NAME/_expo/static/js/ s3://$BUCKET_NAME/_expo/static/js/ \
  --recursive \
  --exclude "*" \
  --include "*.js" \
  --content-type "application/javascript" \
  --metadata-directive REPLACE \
  --profile dixonsmartrepair-dev

# Set correct content-type for CSS files
echo "Setting content-type for CSS files..."
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --recursive \
  --exclude "*" \
  --include "*.css" \
  --content-type "text/css" \
  --metadata-directive REPLACE \
  --profile dixonsmartrepair-dev

# Set correct content-type for HTML files
echo "Setting content-type for HTML files..."
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --recursive \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html" \
  --metadata-directive REPLACE \
  --profile dixonsmartrepair-dev

# Set correct content-type for JSON files
echo "Setting content-type for JSON files..."
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --recursive \
  --exclude "*" \
  --include "*.json" \
  --content-type "application/json" \
  --metadata-directive REPLACE \
  --profile dixonsmartrepair-dev

# Set correct content-type for font files
echo "Setting content-type for font files..."
aws s3 cp s3://$BUCKET_NAME/assets/ s3://$BUCKET_NAME/assets/ \
  --recursive \
  --exclude "*" \
  --include "*.ttf" \
  --content-type "font/ttf" \
  --metadata-directive REPLACE \
  --profile dixonsmartrepair-dev

# Set correct content-type for PNG files
echo "Setting content-type for PNG files..."
aws s3 cp s3://$BUCKET_NAME/assets/ s3://$BUCKET_NAME/assets/ \
  --recursive \
  --exclude "*" \
  --include "*.png" \
  --content-type "image/png" \
  --metadata-directive REPLACE \
  --profile dixonsmartrepair-dev

# Set correct content-type for ICO files
echo "Setting content-type for ICO files..."
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --recursive \
  --exclude "*" \
  --include "*.ico" \
  --content-type "image/x-icon" \
  --metadata-directive REPLACE \
  --profile dixonsmartrepair-dev

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --profile dixonsmartrepair-dev

echo "✅ MIME types fixed! Please wait 5-10 minutes for CloudFront cache to clear."
echo "🌐 Your app should work at: https://d3atyhyv8oqgqj.cloudfront.net"
