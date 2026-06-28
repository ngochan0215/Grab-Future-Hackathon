import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import styles from './Header.module.css';

/**
 * Shared page header.
 *   back  – true  → navigate(-1)
 *         – fn    → call fn()
 *         – omit  → no back button
 */
export default function Header({ title, back }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/home') return null;

  const handleBack = back === true ? () => navigate(-1) : back;

  return (
    <header className={styles.header}>
      {/* Left zone — back button or spacer */}
      <div className={styles.side}>
        {handleBack && (
          <button className={styles.backBtn} onClick={handleBack} aria-label="Quay lại">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <h1 className={styles.title}>{title}</h1>

      {/* Right zone — spacer keeps title centred */}
      <div className={styles.side} />
    </header>
  );
}
