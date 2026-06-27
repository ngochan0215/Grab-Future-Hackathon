import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import HomePage from './pages/HomePage'
import RoutePage from './pages/RoutePage'
import DetailPage from './pages/DetailPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/route" element={<RoutePage />} />
      <Route path="/detail/:id" element={<DetailPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}
