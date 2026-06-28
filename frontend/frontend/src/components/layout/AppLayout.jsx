import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Map, Bookmark, User } from 'lucide-react';
import BottomNav from './BottomNav/BottomNav';
import styles from './AppLayout.module.css';
import useAppStore from '../../store/useAppStore';

const NAV = [
  { label: 'Home',    icon: Home,     path: '/home'    },
  { label: 'Search',  icon: Search,   path: '/search'  },
  { label: 'Routes',  icon: Map,      path: '/routes'  },
  { label: 'Saved',   icon: Bookmark, path: '/saved'   },
  { label: 'Profile', icon: User,     path: '/profile' },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = NAV.find((n) => pathname.startsWith(n.path))?.label;
  const setDestination = useAppStore((s) => s.setDestination);

  return (
    <div className={styles.shell}>
      {children}
      <BottomNav
        items={NAV}
        activeLabel={active}
        onNavigate={(label) => {
          const item = NAV.find((n) => n.label === label);
          if (!item) return;
          if (item.path === '/search') setDestination(null);
          navigate(item.path);
        }}
      />
    </div>
  );
}
