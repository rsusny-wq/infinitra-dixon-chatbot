const fs = require('fs');
const path = require('path');

function findTextNodes(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTextNodes(filePath);
    } else if (file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for lines that are just whitespace and a period
        if (/^\s*\.\s*$/.test(line)) {
          console.log(`${filePath}:${i + 1}: Found stray period: "${line}"`);
        }
        
        // Look for periods between JSX elements
        if (/>\s*\.\s*</.test(line)) {
          console.log(`${filePath}:${i + 1}: Found period between JSX elements: "${line}"`);
        }
        
        // Look for periods in JSX expressions
        if (/\{\s*\.\s*\}/.test(line)) {
          console.log(`${filePath}:${i + 1}: Found period in JSX expression: "${line}"`);
        }
      }
    }
  }
}

findTextNodes('./src/components');
