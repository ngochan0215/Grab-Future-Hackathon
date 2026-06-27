import styles from './BottomNav.module.css';

export default function BottomNav({ items, activeLabel, onNavigate }) {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {items.map(({ icon: Icon, label }) => {
        const isActive = label === activeLabel;
        return (
          <button
            key={label}
            className={`${styles.btn} ${isActive ? styles.active : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate?.(label)}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              className={styles.icon}
            />
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
