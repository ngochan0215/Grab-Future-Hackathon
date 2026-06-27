import { Trash2 } from 'lucide-react';
import styles from './TripCard.module.css';

/**
 * Shared card for trip history and saved routes.
 * stats: [{ icon: LucideComponent, label: string }]
 * onDelete: optional — shows trash icon button when provided
 */
export default function TripCard({ origin, destination, stats = [], onDelete, onClick }) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.route}>
        <div className={styles.timeline}>
          <div className={styles.dotOrigin} />
          <div className={styles.connector} />
          <div className={styles.dotDest} />
        </div>

        <div className={styles.routeLabels}>
          <span className={styles.placeName}>{origin}</span>
          <span className={styles.placeName}>{destination}</span>
        </div>

        {onDelete && (
          <button
            className={styles.deleteBtn}
            aria-label="Delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {stats.length > 0 && (
        <div className={styles.stats}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <span key={i} className={styles.stat}>
                {Icon && <Icon size={11} />}
                {s.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
