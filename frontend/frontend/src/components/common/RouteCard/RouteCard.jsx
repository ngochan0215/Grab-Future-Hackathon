import { ArrowRight } from 'lucide-react';
import styles from './RouteCard.module.css';

export default function RouteCard({ duration, mode, score, from, to, highlights, onStart }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <p className={styles.duration}>{duration}</p>
          <p className={styles.mode}>{mode}</p>
        </div>
        <div className={styles.scorePill} aria-label={`Accessibility score ${score} out of 100`}>
          <p className={styles.scoreLabel}>Accessibility</p>
          <p className={styles.scoreValue}>
            <strong>{score}</strong><span>/100</span>
          </p>
        </div>
      </div>

      <div className={styles.path}>
        <span>{from}</span>
        <ArrowRight size={14} className={styles.arrow} aria-hidden="true" />
        <span>{to}</span>
      </div>

      {highlights?.length > 0 && (
        <div className={styles.tags}>
          {highlights.map(h => (
            <span key={h} className={styles.tag}>{h}</span>
          ))}
        </div>
      )}

      <button className={styles.startBtn} onClick={onStart}>
        Start Navigation
      </button>
    </div>
  );
}
