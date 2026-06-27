// filepath: src/components/common/AuthLogo/AuthLogo.jsx
import styles from './AuthLogo.module.css';

export default function AuthLogo() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.logoText}>
        <span className={styles.left}>GRAB</span>
        <span className={styles.separator}>|</span>
        <span className={styles.right}>UNDP</span>
      </div>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
