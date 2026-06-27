import styles from './AlertCard.module.css';

export default function AlertCard({ severity = 'warning', icon: Icon, title, desc }) {
  return (
    <div className={`${styles.card} ${styles[severity]}`} role="status">
      <Icon size={20} className={styles.icon} aria-hidden="true" />
      <div>
        <p className={styles.title}>{title}</p>
        <p className={styles.desc}>{desc}</p>
      </div>
    </div>
  );
}
