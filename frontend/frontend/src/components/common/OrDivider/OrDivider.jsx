// filepath: src/components/common/OrDivider/OrDivider.jsx
import styles from './OrDivider.module.css';

export default function OrDivider() {
  return (
    <div className={styles.wrapper}>
      <span className={styles.line} />
      <span className={styles.text}>OR</span>
      <span className={styles.line} />
    </div>
  );
}
