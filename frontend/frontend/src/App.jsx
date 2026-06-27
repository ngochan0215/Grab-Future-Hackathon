import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage/LoginPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ConfirmPage from './pages/ConfirmPage'
import OptionsPage from './pages/OptionsPage'
import RoutesPage from './pages/RoutesPage'
import ComparePage from './pages/ComparePage'
import NavigationPage from './pages/NavigationPage'
import SavedPage from './pages/SavedPage'
import TripsPage from './pages/TripsPage'
import ProfilePage from './pages/ProfilePage'
import ReportPage from './pages/ReportPage'

const protectedPages = [
  { path: '/home', element: <HomePage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/confirm', element: <ConfirmPage /> },
  { path: '/options', element: <OptionsPage /> },
  { path: '/routes', element: <RoutesPage /> },
  { path: '/compare', element: <ComparePage /> },
  { path: '/navigate', element: <NavigationPage /> },
  { path: '/saved', element: <SavedPage /> },
  { path: '/trips', element: <TripsPage /> },
  { path: '/report', element: <ReportPage /> },
  { path: '/profile', element: <ProfilePage /> },
]

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      {protectedPages.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<ProtectedRoute>{element}</ProtectedRoute>}
        />
      ))}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
