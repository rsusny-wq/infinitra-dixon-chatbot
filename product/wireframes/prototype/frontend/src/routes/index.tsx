import { Route, Routes } from 'react-router'
import { ChatLayout } from '@/layouts/chat-layout'
import { NotFoundPage } from '@/pages/not-found'

// Main chat page
import ChatPage from '@/pages/chat'

// Automotive section pages
import VehiclesPage from '@/pages/vehicles'
import ServiceHistoryPage from '@/pages/service-history'
import InvoicesPage from '@/pages/invoices'
import MechanicsPage from '@/pages/mechanics'
import RemindersPage from '@/pages/reminders'
import SettingsPage from '@/pages/settings'
import ProfilePage from '@/pages/profile'

export function AppRoutes() {
  return (
    <Routes>
      {/* ChatGPT-style routes with chat layout */}
      <Route element={<ChatLayout />}>
        {/* Main chat - fresh conversation */}
        <Route index element={<ChatPage />} />
        
        {/* Specific conversation by ID */}
        <Route path="/c/:conversationId" element={<ChatPage />} />
        
        {/* Automotive sections */}
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/service-history" element={<ServiceHistoryPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/mechanics" element={<MechanicsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        
        {/* Account sections */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 404 page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
} 