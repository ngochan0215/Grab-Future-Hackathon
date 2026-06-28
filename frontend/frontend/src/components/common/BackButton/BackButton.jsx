import { ArrowLeft } from 'lucide-react';
import styles from './BackButton.module.css';

export default function BackButton({ onClick, label = 'Back' }) {
  return (
    <button className={styles.btn} onClick={onClick} aria-label={label}>
      <ArrowLeft size={20} strokeWidth={2.5} />
    </button>
  );
}
