import { useState } from 'react';

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Đang tải" />;
}

export function EmptyState({ icon = '📭', children }) {
  return (
    <div className="empty">
      <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>
      <div>{children}</div>
    </div>
  );
}

export function ErrorMsg({ children }) {
  if (!children) return null;
  return <div className="alertMsg alertMsg--error">{children}</div>;
}

export function OkMsg({ children }) {
  if (!children) return null;
  return <div className="alertMsg alertMsg--ok">{children}</div>;
}

// Read-only star display (0–5)
export function Stars({ value = 0 }) {
  const v = Math.round(value);
  return (
    <span className="stars" aria-label={`${v} trên 5 sao`}>
      {'★'.repeat(v)}
      {'☆'.repeat(5 - v)}
    </span>
  );
}

// Interactive 1–5 star picker
export function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ fontSize: 28, cursor: 'pointer', userSelect: 'none' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ color: (hover || value) >= n ? '#f5a623' : 'var(--border)' }}
          role="button"
          aria-label={`${n} sao`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// Labelled 0–100 score with a coloured bar.
export function ScoreBar({ label, value }) {
  const tone = value >= 70 ? 'ok' : value >= 40 ? 'warn' : '';
  return (
    <div className="score">
      <div className="scoreTop">
        <span className="muted">{label}</span>
        <span className="scoreVal">{value}</span>
      </div>
      <div className={`bar ${tone ? `bar--${tone}` : ''}`}>
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
