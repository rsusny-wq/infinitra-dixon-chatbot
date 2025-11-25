// Web-specific configuration to suppress React Native Web warnings
if (typeof window !== 'undefined') {
  // Suppress specific React Native Web deprecation warnings
  const originalWarn = console.warn
  console.warn = (...args) => {
    const message = args[0]
    if (typeof message === 'string') {
      // Suppress shadow deprecation warnings from React Native Web
      if (message.includes('shadow*" style props are deprecated')) {
        return
      }
      // Suppress pointerEvents deprecation warnings
      if (message.includes('props.pointerEvents is deprecated')) {
        return
      }
    }
    originalWarn.apply(console, args)
  }
}
