import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange, placeholder = 'Search...', ...rest }) {
  return (
    <div className={styles.wrap}>
      <Search size={18} className={styles.icon} aria-hidden="true" />
      <input
        className={styles.input}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        {...rest}
      />
    </div>
  );
}
