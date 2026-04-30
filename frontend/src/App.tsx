import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import ShiftOverview from './pages/ShiftOverview'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import Leaves from './pages/Leaves'
import Swaps from './pages/Swaps'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import RoleGate from './components/RoleGate'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RoleGate><Dashboard /></RoleGate>} />
            <Route path="schedule" element={<RoleGate><Schedule /></RoleGate>} />
            <Route path="shift-overview" element={<RoleGate allowedRoles={['admin', 'manager']}><ShiftOverview /></RoleGate>} />
            <Route path="employees" element={<RoleGate allowedRoles={['admin', 'manager']}><Employees /></RoleGate>} />
            <Route path="attendance" element={<RoleGate><Attendance /></RoleGate>} />
            <Route path="leaves" element={<RoleGate><Leaves /></RoleGate>} />
            <Route path="swaps" element={<RoleGate><Swaps /></RoleGate>} />
            <Route path="reports" element={<RoleGate allowedRoles={['admin', 'manager']}><Reports /></RoleGate>} />
            <Route path="profile" element={<RoleGate><Profile /></RoleGate>} />
            <Route path="settings" element={<RoleGate><Settings /></RoleGate>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
