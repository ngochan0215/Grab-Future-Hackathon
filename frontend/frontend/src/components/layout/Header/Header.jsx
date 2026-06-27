import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import styles from './Header.module.css';

export default function Header({ title }) {
  const location = useLocation();

  // Do not render Header on the home page
  if (location.pathname === '/home') {
    return null;
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
