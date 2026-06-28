import { useEffect, useRef, useState } from 'react';

const HOLD_MS = 2000;

/**
 * Hold-to-activate SOS button.
 * Renders as a floating red button over the map.
 * Pressing and holding for HOLD_MS fires onActivate().
 * Releasing early resets the radial progress.
 */
export default function SosButton({ onActivate }) {
  const [holding,  setHolding]  = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const startRef  = useRef(null);
  const rafRef    = useRef(null);

  function beginHold(e) {
    e.preventDefault();
    setHolding(true);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }

  function endHold() {
    setHolding(false);
    setProgress(0);
    cancelAnimationFrame(rafRef.current);
  }

  function tick(now) {
    const f = Math.min(1, (now - startRef.current) / HOLD_MS);
    setProgress(f);
    if (f >= 1) {
      onActivate();
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // SVG radial progress ring
  const SIZE  = 64;
  const R     = 26;
  const CIRC  = 2 * Math.PI * R;
  const dash  = CIRC * progress;

  return (
    <div style={{
      position: 'absolute',
      bottom: 90,
      left: 16,
      zIndex: 20,
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      <button
        onPointerDown={beginHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        style={{
          width: SIZE, height: SIZE,
          borderRadius: '50%',
          background: holding ? '#DC2626' : '#EF4444',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: holding
            ? '0 0 0 6px rgba(239,68,68,0.3), 0 4px 16px rgba(239,68,68,0.5)'
            : '0 4px 16px rgba(239,68,68,0.45)',
          transition: 'background 0.1s, box-shadow 0.1s',
          touchAction: 'none',
        }}
        aria-label="SOS — nhấn giữ để kích hoạt"
      >
        {/* Ring progress */}
        <svg
          width={SIZE} height={SIZE}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={4}
          />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke="#fff"
            strokeWidth={4}
            strokeDasharray={`${dash} ${CIRC}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.05s linear' }}
          />
        </svg>

        {/* Label */}
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: 1, position: 'relative', zIndex: 1 }}>
          SOS
        </span>
      </button>

      {/* Instruction hint (only while not holding) */}
      {!holding && (
        <div style={{
          position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
          fontSize: 9, fontWeight: 600, color: '#fff',
          background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 5px',
          whiteSpace: 'nowrap',
        }}>
          Nhấn giữ
        </div>
      )}
    </div>
  );
}

// ── SOS Triggered Screen (rendered inside NavigationPage's navSheet) ──────────
export function SosTriggeredScreen({ contacts, position, route, onDismiss }) {
  const lat = position?.[0]?.toFixed(5) ?? '—';
  const lng = position?.[1]?.toFixed(5) ?? '—';

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Pulsing icon */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, animation: 'sosPulse 1.2s ease-in-out infinite',
        }}>
          🆘
        </div>
      </div>

      <style>{`@keyframes sosPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 16px rgba(239,68,68,0)} }`}</style>

      <div style={{ fontWeight: 800, fontSize: 18, color: '#991B1B', marginBottom: 4 }}>
        Tín hiệu SOS đã được gửi
      </div>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
        {contacts.length > 0
          ? `Đã thông báo tới: ${contacts.map((c) => c.name).join(', ')}`
          : 'Chưa có liên hệ khẩn cấp — hãy thêm trong Hồ sơ'}
      </div>

      {/* Location */}
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', marginBottom: 14, textAlign: 'left' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>📍 Vị trí hiện tại</div>
        <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{lat}, {lng}</div>
        {route && (
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
            Đang đi: {route.origin} → {route.destination}
          </div>
        )}
      </div>

      {/* Contacts notified */}
      {contacts.length > 0 && (
        <div style={{ marginBottom: 14, textAlign: 'left' }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A2E' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{c.phone}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '2px 6px', fontWeight: 700 }}>Đã gửi</span>
            </div>
          ))}
        </div>
      )}

      {/* Emergency call button */}
      <a
        href="tel:113"
        style={{
          display: 'block', width: '100%', padding: '13px 0', borderRadius: 14,
          background: '#DC2626', textAlign: 'center',
          fontWeight: 800, fontSize: 15, color: '#fff',
          textDecoration: 'none', marginBottom: 10,
          boxShadow: '0 4px 14px rgba(220,38,38,0.4)',
        }}
      >
        📞 Gọi 113 — Cảnh sát
      </a>

      <button
        onClick={onDismiss}
        style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', fontWeight: 700, fontSize: 14, color: '#6B7280', cursor: 'pointer' }}
      >
        Tôi ổn — Quay về trang chủ
      </button>
    </div>
  );
}
