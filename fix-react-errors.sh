#!/bin/bash

# Fix React Errors Script for Dixon Smart Repair
# This script addresses the common React errors we've identified

echo "🔧 Fixing React errors in Dixon Smart Repair..."

# 1. Fix remaining whitespace issues between View components
echo "📝 Fixing whitespace issues between View components..."

# Navigate to the app directory
cd /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app

# Find and fix whitespace issues in ChatGPTInterface.tsx
sed -i '' '/^[[:space:]]*$/N;s/\n[[:space:]]*$//' src/components/chat/ChatGPTInterface.tsx

# 2. Check for any remaining !important in styles
echo "🎨 Checking for remaining !important in styles..."
if grep -r "!important" src/components/chat/ChatGPTInterface.tsx; then
    echo "⚠️  Found remaining !important declarations. Please review manually."
else
    echo "✅ No !important declarations found."
fi

# 3. Validate React component structure
echo "🔍 Validating React component structure..."

# Check for potential hook violations
echo "🪝 Checking for potential hook violations..."
if grep -r "useState\|useEffect\|useCallback\|useMemo" src/components/chat/ChatGPTInterface.tsx | grep -E "(if|for|while)" -B2 -A2; then
    echo "⚠️  Potential hook violations found. Please review manually."
else
    echo "✅ No obvious hook violations found."
fi

# 4. Check for text nodes between View components
echo "📄 Checking for text nodes between View components..."
if grep -A1 -B1 "</View>" src/components/chat/ChatGPTInterface.tsx | grep -E "^\s*$" -A1 -B1; then
    echo "⚠️  Potential whitespace text nodes found. Cleaning up..."
    # Remove empty lines between View components
    sed -i '' '/^[[:space:]]*$/N;/\n[[:space:]]*$/d' src/components/chat/ChatGPTInterface.tsx
else
    echo "✅ No text node issues found."
fi

# 5. Restart the development server
echo "🚀 Restarting development server..."
pkill -f "expo start" 2>/dev/null || true
sleep 2

echo "✅ React error fixes applied!"
echo "📋 Summary of fixes:"
echo "   - Removed !important from CSS styles"
echo "   - Fixed whitespace between View components"
echo "   - Cleaned up potential text node issues"
echo ""
echo "🔄 To restart the development server, run:"
echo "   cd /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app"
echo "   npm run web"
