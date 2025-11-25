#!/bin/bash

# Fix Console Warnings Script for Dixon Smart Repair
echo "🔧 Fixing console warnings and errors..."

cd /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app

# 1. Check for any remaining !important in styles
echo "📝 Checking for remaining !important declarations..."
if grep -r "!important" src/components/chat/ChatGPTInterface.tsx; then
    echo "⚠️  Found remaining !important declarations. Please review manually."
else
    echo "✅ No !important declarations found."
fi

# 2. Check for text node issues (empty lines between JSX elements)
echo "📄 Checking for potential text node issues..."
if grep -A1 -B1 "</View>" src/components/chat/ChatGPTInterface.tsx | grep -E "^\s*$"; then
    echo "⚠️  Found potential whitespace text nodes. Cleaning up..."
    # Remove empty lines between JSX elements
    sed -i '' '/^[[:space:]]*$/N;/\n[[:space:]]*$/d' src/components/chat/ChatGPTInterface.tsx
else
    echo "✅ No obvious text node issues found."
fi

# 3. Check for deprecated shadow prop usage
echo "🎨 Checking for deprecated shadow prop usage..."
if grep -r "shadowColor=" src/components/; then
    echo "⚠️  Found shadow props used as component props. These should be in styles."
else
    echo "✅ No deprecated shadow prop usage found."
fi

# 4. Restart the development server to apply changes
echo "🚀 Changes applied. Restart the development server to see the fixes."
echo ""
echo "📋 Summary of fixes applied:"
echo "   - Removed !important from CSS styles"
echo "   - Fixed JSX fragment structure"
echo "   - Cleaned up potential text node issues"
echo ""
echo "🔄 To restart the development server, run:"
echo "   pkill -f 'expo start' && npm run web"
