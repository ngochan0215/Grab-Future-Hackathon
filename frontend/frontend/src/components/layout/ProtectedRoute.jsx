import { Navigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';
import AppLayout from './AppLayout';

// Guards authenticated pages and wraps them in the app shell (bottom nav).
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}
