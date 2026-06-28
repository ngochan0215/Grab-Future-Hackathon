import styles from './AlertCard.module.css';

export default function AlertCard({ severity = 'warning', icon: Icon, title, desc, street, lat, lng }) {
  const hasCoords = lat != null && lng != null;
  return (
    <div className={`${styles.card} ${styles[severity]}`} role="status">
      <Icon size={20} className={styles.icon} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className={styles.title}>{title}</p>
        {street && <p className={styles.desc}>{street}</p>}
        <p className={styles.desc}>{desc}</p>
        {hasCoords && (
          <p className={styles.coords}>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
