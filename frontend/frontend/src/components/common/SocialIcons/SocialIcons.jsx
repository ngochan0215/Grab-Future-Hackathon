// filepath: src/components/common/SocialIcons/SocialIcons.jsx
import styles from './SocialIcons.module.css';

const SOCIALS = [
  { label: '𝕏', title: 'Twitter' },
  { label: 'f', title: 'Facebook' },
  { label: 'G', title: 'Google' },
];

export default function SocialIcons() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.hint}>Sign in with social media</p>
      <div className={styles.row}>
        {SOCIALS.map(({ label, title }) => (
          <button key={title} className={styles.icon} title={title} type="button">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
