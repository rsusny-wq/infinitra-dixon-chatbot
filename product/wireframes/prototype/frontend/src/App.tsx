import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/routes'
import { useDiagnosticStore } from '@/store/diagnostic-store'
import { useEffect } from 'react'

export default function App() {
  const { initializeApp } = useDiagnosticStore()
  
  useEffect(() => {
    // Initialize app state on startup
    initializeApp()
  }, [initializeApp])
  
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
