import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage/LoginPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import RoutesPage from './pages/RoutesPage'
import ComparePage from './pages/ComparePage'
import NavigationPage from './pages/NavigationPage'
import SavedPage from './pages/SavedPage'
import TripsPage from './pages/TripsPage'
import ProfilePage from './pages/ProfilePage'
import AlertsPage from './pages/AlertsPage'
import GrabBookingPage from './pages/GrabBookingPage'
import RoutePreviewPage from './pages/RoutePreviewPage'

const protectedPages = [
  { path: '/home',     element: <AppLayout><HomePage /></AppLayout>       },
  { path: '/search',   element: <AppLayout><SearchPage /></AppLayout>     },
  { path: '/routes',   element: <AppLayout><RoutesPage /></AppLayout>     },
  { path: '/compare',  element: <ComparePage />                           },
  { path: '/navigate', element: <NavigationPage />                        },
  { path: '/saved',    element: <AppLayout><SavedPage /></AppLayout>      },
  { path: '/trips',    element: <TripsPage />                             },
  { path: '/profile',  element: <AppLayout><ProfilePage /></AppLayout>    },
  { path: '/alerts',        element: <AppLayout><AlertsPage /></AppLayout>        },
  { path: '/grab-booking',   element: <GrabBookingPage />                        },
  { path: '/route-preview', element: <RoutePreviewPage />                        },
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
