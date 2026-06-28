// filepath: src/components/common/AuthInput/AuthInput.jsx
import styles from './AuthInput.module.css';

export default function AuthInput({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
