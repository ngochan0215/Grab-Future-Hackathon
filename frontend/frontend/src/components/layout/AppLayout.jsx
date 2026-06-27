import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Bookmark, Navigation, AlertTriangle, User } from 'lucide-react';
import BottomNav from './BottomNav/BottomNav';
import styles from './AppLayout.module.css';

const NAV = [
  { label: 'Home', icon: Home, path: '/home' },
  { label: 'Saved', icon: Bookmark, path: '/saved' },
  { label: 'Trips', icon: Navigation, path: '/trips' },
  { label: 'Report', icon: AlertTriangle, path: '/report' },
  { label: 'Profile', icon: User, path: '/profile' },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = NAV.find((n) => pathname.startsWith(n.path))?.label;

  return (
    <div className={styles.shell}>
      {children}
      <BottomNav
        items={NAV}
        activeLabel={active}
        onNavigate={(label) => {
          const item = NAV.find((n) => n.label === label);
          if (item) navigate(item.path);
        }}
      />
    </div>
  );
}
