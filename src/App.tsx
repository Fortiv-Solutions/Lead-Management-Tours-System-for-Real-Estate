import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import LeadPipeline from './pages/LeadPipeline'
import Dashboard from './pages/Dashboard'
import ConversationsPage from './pages/ConversationsPage'
import FollowUpPage from './pages/FollowUpPage'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="pipeline" element={<LeadPipeline />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="followup" element={<FollowUpPage />} />
      </Route>
    </Routes>
  )
}

export default App
