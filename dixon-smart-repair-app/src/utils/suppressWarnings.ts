/**
 * Suppress known development warnings that come from dependencies
 * These are not critical and don't affect functionality
 */

const originalWarn = console.warn;
const originalError = console.error;

// List of warning patterns to suppress
const suppressedWarnings = [
  'props.pointerEvents is deprecated. Use style.pointerEvents',
  '"shadow*" style props are deprecated. Use "boxShadow"',
  'Slow network is detected',
  'fontfaceobserver.standalone.js',
];

// Override console.warn to filter out known dependency warnings
console.warn = (...args: any[]) => {
  const message = args.join(' ');
  
  // Check if this warning should be suppressed
  const shouldSuppress = suppressedWarnings.some(pattern => 
    message.includes(pattern)
  );
  
  if (!shouldSuppress) {
    originalWarn.apply(console, args);
  }
};

// Override console.error to filter out known dependency warnings
console.error = (...args: any[]) => {
  const message = args.join(' ');
  
  // Check if this error should be suppressed (only for known non-critical warnings)
  const shouldSuppress = suppressedWarnings.some(pattern => 
    message.includes(pattern)
  );
  
  if (!shouldSuppress) {
    originalError.apply(console, args);
  }
};

export default {};
