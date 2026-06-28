import { ScoreBar } from './ui';
import { formatDuration, formatDistance } from '../utils/formatRoute';
import { issueLabel, formatWarning } from '../constants/labels';

// Compact card for one ranked route option.
export default function RouteCard({ route, onClick }) {
  const isOpt = route.route_type === 'optimized';
  return (
    <div className="card card--tap" onClick={onClick}>
      <div className="row row--between">
        {route.recommended ? (
          <span className="recoTag">👍 Đề xuất</span>
        ) : (
          <span className={`badge ${isOpt ? 'badge--ok' : 'badge--muted'}`}>{route.label}</span>
        )}
        <span className="badge badge--accent">Điểm {route.priority_score}</span>
      </div>

      <div className="row" style={{ gap: 16, margin: '12px 0' }}>
        <div className="col">
          <span className="muted small">Thời gian</span>
          <span className="title">{formatDuration(route.total_duration)}</span>
        </div>
        <div className="col">
          <span className="muted small">Quãng đường</span>
          <span className="title">{formatDistance(route.total_distance)}</span>
        </div>
      </div>

      <ScoreBar label="An toàn" value={route.safety_score} />
      <div style={{ height: 8 }} />
      <ScoreBar label="Dễ tiếp cận" value={route.accessibility_score} />

      {route.avoids?.length > 0 && (
        <div className="chips" style={{ marginTop: 12 }}>
          {route.avoids.map((a, i) => (
            <span key={i} className="badge badge--ok small">✓ Tránh {issueLabel(a)}</span>
          ))}
        </div>
      )}
      {route.warnings?.length > 0 && (
        <div className="chips" style={{ marginTop: 8 }}>
          {route.warnings.map((w, i) => (
            <span key={i} className="badge badge--warn small">⚠ {formatWarning(w)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
