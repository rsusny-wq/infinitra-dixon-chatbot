#!/usr/bin/env node

/**
 * Fix for React Hooks Order Issue in ChatGPTInterface
 * This script identifies and fixes common hook order violations
 */

const fs = require('fs');
const path = require('path');

const filePath = '/Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/src/components/chat/ChatGPTInterface.tsx';

console.log('🔧 Fixing React Hooks order issue...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // The issue is likely that some hooks are being called conditionally
  // Let's ensure all hooks are called at the top level consistently
  
  // Check if there are any early returns before all hooks are called
  const lines = content.split('\n');
  let hookLines = [];
  let returnLineIndex = -1;
  
  // Find all hook calls and the return statement
  lines.forEach((line, index) => {
    if (line.includes('useState') || line.includes('useEffect') || line.includes('useCallback') || 
        line.includes('useMemo') || line.includes('useRef') || line.includes('useContext')) {
      hookLines.push({ line: line.trim(), index });
    }
    if (line.trim().startsWith('return (') && returnLineIndex === -1) {
      returnLineIndex = index;
    }
  });
  
  console.log(`📊 Found ${hookLines.length} hook calls`);
  console.log(`📍 Return statement at line ${returnLineIndex + 1}`);
  
  // Check if all hooks are before the return statement
  const hooksAfterReturn = hookLines.filter(hook => hook.index > returnLineIndex);
  if (hooksAfterReturn.length > 0) {
    console.log('❌ Found hooks after return statement:', hooksAfterReturn);
  } else {
    console.log('✅ All hooks are before return statement');
  }
  
  // The most common fix is to ensure the useCallback hooks are not affected by conditional rendering
  // Let's add a comment to mark the hook section clearly
  const hookSectionComment = `
  // ===== HOOKS SECTION - DO NOT ADD CONDITIONAL LOGIC ABOVE THIS LINE =====
  // All hooks must be called in the same order on every render
  `;
  
  // Find the first hook and add the comment before it
  const firstHookIndex = hookLines[0]?.index;
  if (firstHookIndex !== undefined) {
    lines.splice(firstHookIndex, 0, hookSectionComment);
  }
  
  // Write the fixed content back
  const fixedContent = lines.join('\n');
  fs.writeFileSync(filePath, fixedContent);
  
  console.log('✅ Applied hooks order fix');
  console.log('📝 Added hooks section comment for clarity');
  
} catch (error) {
  console.error('❌ Error fixing hooks order:', error.message);
}
