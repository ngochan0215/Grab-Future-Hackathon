import { NavLink } from 'react-router-dom';
import styles from './AppLayout.module.css';

const NAV = [
  { to: '/home', icon: '🏠', label: 'Trang chủ' },
  { to: '/saved', icon: '🔖', label: 'Đã lưu' },
  { to: '/trips', icon: '🧭', label: 'Chuyến đi' },
  { to: '/report', icon: '⚠️', label: 'Báo cáo' },
  { to: '/profile', icon: '👤', label: 'Hồ sơ' },
];

export default function AppLayout({ children }) {
  return (
    <div className={styles.shell}>
      {children}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
