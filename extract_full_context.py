#!/usr/bin/env python3
"""
Extract full conversation context from Q Chat terminal output.
Includes user messages, Q responses, AND Q's internal dialogue/tool usage.
Excludes file content diffs, command outputs, and system UI elements.
"""

import re
import sys

def is_file_diff_content(line):
    """Check if line is file diff content that should be excluded."""
    stripped = line.strip()
    
    # File diff markers with line numbers
    if (stripped.startswith('- ') and ':' in stripped and 
        re.match(r'^\s*-\s+\d+', stripped)):
        return True
    
    if (stripped.startswith('+ ') and ':' in stripped and 
        re.match(r'^\s*\+\s+\d+', stripped)):
        return True
    
    # Line number ranges like "11, 12:" or "- 21    :"
    if re.match(r'^\s*\d+[,\s]+\d+:', stripped):
        return True
    
    if re.match(r'^\s*[-+]\s*\d+\s*:', stripped):
        return True
    
    return False

def is_command_output(line):
    """Check if line is command output that should be excluded."""
    stripped = line.strip()
    
    # AWS CLI command outputs
    if (stripped.startswith('Service name:') or
        stripped.startswith('Operation name:') or
        stripped.startswith('Parameters:') or
        stripped.startswith('Profile name:') or
        stripped.startswith('Region:') or
        stripped.startswith('Label:') or
        stripped.startswith('↳ Purpose:')):
        return True
    
    # Command parameter lines
    if stripped.startswith('- ') and any(param in stripped for param in [
        'username:', 'user-pool-id:', 'client-id:', 'function-name:', 
        'payload:', 'bucket:', 'email-identity:', 'id:', 'password:']):
        return True
    
    # Test output patterns - Jest and npm test
    if any(marker in stripped for marker in [
        'dixon-smart-repair@1.0.0 test', 'jest --testPathPattern', 'npm test --',
        'console.log', 'console.warn', 'console.error', 'at Object.log',
        'FAIL src/', 'PASS src/', '✕ should', '✓ should', 'describe(', 'it(',
        'Test Suites:', 'Tests:', 'Snapshots:', 'Time:', 'Ran all test suites',
        '🧪 Dixon Smart Repair test environment configured',
        'Element type is invalid:', 'You likely forgot to export',
        'Check the render method', 'There seems to be an issue',
        'Please check if you are using compatible versions',
        'at detectHostComponentNames', 'at renderInternal', 'at Object.<anonymous>',
        'node_modules/@testing-library', 'src/components/', '__tests__/',
        'expect(screen.getByText', 'expect(screen.getByPlaceholderText',
        'render(<', 'toBeTruthy()', 'toBeNull()', 'toHaveBeenCalled']):
        return True
    
    # Test file paths and line numbers
    if (('src/' in stripped and '__tests__/' in stripped) or
        (stripped.startswith('>') and '|' in stripped and 'expect(' in stripped) or
        (re.match(r'^\s*\d+\s*\|', stripped)) or
        (stripped.startswith('at ') and ('node_modules' in stripped or 'src/' in stripped))):
        return True
    
    # CDK deployment outputs and warnings
    if any(marker in stripped for marker in [
        'DixonSmartRepairStack |', 'UPDATE_IN_PROGRESS', 'UPDATE_COMPLETE',
        'CREATE_IN_PROGRESS', 'CREATE_COMPLETE', 'DELETE_IN_PROGRESS',
        'DELETE_COMPLETE', 'AWS::', 'CloudFormation', 'Bundling asset',
        'esbuild cannot run locally', 'WARNING: The requested image',
        'asset-output/', '⚡ Done in', '✨ Synthesis time:', 'NOTICES',
        'There are expired AWS credentials', 'The CDK app will synth',
        '[WARNING]', 'aws-cdk-lib.', 'is deprecated', 'This API will be removed',
        'use `pointInTimeRecoverySpecification`', 'instead', 'next major release']):
        return True
    
    # NPM/build outputs
    if any(marker in stripped for marker in [
        'npm warn', 'npm error', 'added ', 'audited ', 'packages',
        'found 0 vulnerabilities', 'Web Bundled', 'Starting Metro',
        'Exported:', 'upload:', 'to s3://', 'Attempting to automatically',
        'Successfully logged into', 'Enter the code:', 'open the following URL']):
        return True
    
    # Docker build outputs - more comprehensive patterns
    if any(marker in stripped for marker in [
        '#0 building', '#1 [internal]', '#2 [internal]', '#3 [internal]', 
        '#4 [', '#5 [', '#6 [', '#7 [', '#8 [', '#9 [', '#10 [', '#11 [', '#12 [',
        '#13 [', '#14 [', '#15 [', '#16 [', 'FROM public.ecr.aws',
        'RUN npm install', 'CACHED', 'exporting to image', 'DONE 0.0s', 'DONE 0.5s',
        'naming to docker.io', 'transferring dockerfile', 'load build definition',
        'transferring context:', 'load .dockerignore', 'load metadata']):
        return True
    
    # Long JSON responses or configuration blocks
    if (stripped.startswith('{') and len(stripped) > 100) or (stripped.startswith('"') and len(stripped) > 100):
        return True
    
    # Environment variable exports and credentials
    if (stripped.startswith('export AWS_') or 'AWS_SESSION_TOKEN=' in stripped or
        'AWS_ACCESS_KEY_ID=' in stripped or 'AWS_SECRET_ACCESS_KEY=' in stripped):
        return True
    
    # CDK notices and help text
    if any(marker in stripped for marker in [
        'NOTICES', 'What\'s this?', 'github.com/aws/aws-cdk', 'cdk acknowledge',
        'More information at:', 'If you don\'t want to see', 'Overview:',
        'Affected versions:', 'cli:', 'We do not collect']):
        return True
    
    # Test execution patterns
    if any(marker in stripped for marker in [
        'chmod +x', 'make test script executable', 'Run comprehensive',
        'Function:', 'Region:', 'Starting Test Execution', 'Test Results Summary',
        'Total Tests:', 'Passed:', 'Failed:', 'Running:', 'health-check',
        'tools-status', 'vin-validation', 'cors-preflight', 'invalid-endpoint']):
        return True
    
    # Stack ARN and deployment completion messages
    if any(marker in stripped for marker in [
        'Stack ARN:', 'arn:aws:cloudformation:', '✨ Total time:', 
        '✨ Deployment time:', '✅ DixonSmartRepairStack']):
        return True
    
    return False

def is_code_content(line):
    """Check if line is code content that should be excluded."""
    stripped = line.strip()
    
    # Import/export statements
    if (stripped.startswith('import ') or 
        stripped.startswith('from ') or
        stripped.startswith('export ') or
        '} from ' in stripped):
        return True
    
    # JSX/React components
    if (stripped.startswith('<Route ') or 
        stripped.startswith('</Route') or
        stripped.startswith('<') and stripped.endswith('>')):
        return True
    
    # Function definitions and code blocks
    if (stripped.startswith('const ') or 
        stripped.startswith('function ') or
        stripped.startswith('return (')):
        return True
    
    return False

def extract_conversation(input_file, output_file):
    """Extract full conversation context from Q Chat terminal output."""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    conversation_lines = []
    in_conversation = False
    current_speaker = None
    current_content = []
    in_file_diff = False
    
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        
        # Start conversation when we see first user prompt
        if not in_conversation and line.startswith('> '):
            in_conversation = True
        
        if not in_conversation:
            i += 1
            continue
        
        # User input (lines starting with "> ")
        if line.startswith('> '):
            # Save previous content
            if current_speaker and current_content:
                conversation_lines.append(f"**{current_speaker}:**")
                conversation_lines.extend(current_content)
                conversation_lines.append("")
            
            # Start new user input
            user_input = line[2:].strip()
            if user_input:
                current_speaker = "User"
                current_content = [user_input]
                in_file_diff = False
            else:
                current_speaker = None
                current_content = []
        
        # Q's tool usage and internal dialogue - KEEP THESE BUT FILTER COMMAND OUTPUTS
        elif ("🛠️" in line or 
              line.strip().startswith("⋮") or 
              line.strip().startswith("●") or 
              line.strip().startswith("✔") or
              line.strip().startswith("✘") or
              line.strip().startswith("↳") or
              "Using tool:" in line or
              "Completed in" in line or
              "Found:" in line):
            
            if current_speaker != "Q":
                # Save previous content
                if current_speaker and current_content:
                    conversation_lines.append(f"**{current_speaker}:**")
                    conversation_lines.extend(current_content)
                    conversation_lines.append("")
                
                # Start Q's internal dialogue
                current_speaker = "Q"
                current_content = [line]
            else:
                current_content.append(line)
        
        # Skip command outputs
        elif is_command_output(line):
            if not in_file_diff:
                in_file_diff = True
                # Don't add marker for command outputs - just skip silently
        
        # Skip system UI elements but keep tool-related content
        elif (line.startswith("Allow this action?") or 
              line.startswith("Current context window") or
              line.startswith("█") or
              line.startswith("💡") or
              line.startswith("Run /") or
              "tokens used" in line or
              line.startswith("(To exit") or
              line.startswith("/help") or
              "━━━" in line or
              "🤖 You are chatting" in line or
              line.startswith("╭─") or
              line.startswith("│") or
              line.startswith("╰─")):
            pass  # Skip these lines
        
        # Check for file diff sections or command outputs
        elif is_file_diff_content(line) or is_code_content(line):
            if not in_file_diff:
                in_file_diff = True
                # Add a marker only for file content, not command outputs
                if current_speaker == "Q" and current_content:
                    current_content.append("[File content/diff details omitted for brevity]")
        
        # Skip file diff content and command outputs
        elif in_file_diff:
            # Check if we're out of the file diff/command output section
            if (line.startswith('> ') or 
                line.startswith('**') or
                ("🛠️" in line or line.strip().startswith("⋮") or line.strip().startswith("●")) or
                (line and not line.startswith(' ') and not is_file_diff_content(line) and 
                 not is_code_content(line) and not is_command_output(line))):
                in_file_diff = False
                # Process this line normally
                i -= 1  # Back up to reprocess this line
            # else: skip this line (it's part of file diff or command output)
        
        # Regular Q response content
        elif in_conversation and line:
            if current_speaker != "Q":
                # Save previous content
                if current_speaker and current_content:
                    conversation_lines.append(f"**{current_speaker}:**")
                    conversation_lines.extend(current_content)
                    conversation_lines.append("")
                
                # Start Q's response
                current_speaker = "Q"
                current_content = [line]
            else:
                current_content.append(line)
        
        # Empty lines - add to current content if we have a speaker
        elif current_speaker and not in_file_diff:
            current_content.append(line)
        
        i += 1
    
    # Add final content
    if current_speaker and current_content:
        conversation_lines.append(f"**{current_speaker}:**")
        conversation_lines.extend(current_content)
    
    # Clean up - remove excessive empty lines
    cleaned_lines = []
    prev_empty = False
    for line in conversation_lines:
        if not line.strip():
            if not prev_empty:
                cleaned_lines.append(line)
            prev_empty = True
        else:
            cleaned_lines.append(line)
            prev_empty = False
    
    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        for line in cleaned_lines:
            f.write(line + '\n')
    
    print(f"Full conversation context extracted to: {output_file}")
    print(f"Total lines: {len(cleaned_lines)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 extract_full_context.py <input_file> <output_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    extract_conversation(input_file, output_file)
