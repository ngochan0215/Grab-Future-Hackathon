// filepath: src/components/common/RoundButton/RoundButton.jsx
import styles from './RoundButton.module.css';

export default function RoundButton({ onClick, isLoading }) {
  return (
    <button
      className={styles.btn}
      onClick={onClick}
      type="button"
      disabled={isLoading}
      aria-label="Continue"
    >
      {isLoading ? <span className={styles.spinner} /> : '→'}
    </button>
  );
}
