import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import MapView from '../components/map/MapView';

const SURFACE = {
  smooth:   { label: 'Bằng phẳng', color: '#065F46', bg: '#D1FAE5', emoji: '🟢' },
  moderate: { label: 'Trung bình', color: '#92400E', bg: '#FEF3C7', emoji: '🟡' },
  damaged:  { label: 'Hư hỏng',   color: '#991B1B', bg: '#FEE2E2', emoji: '🔴' },
};

function widthLabel(w) {
  if (!w) return 'Không rõ';
  if (w >= 1.8) return 'Rộng — phù hợp xe lăn';
  if (w >= 1.2) return 'Trung bình — vừa đủ';
  return 'Hẹp — khó đi xe lăn';
}
function widthColor(w) {
  if (!w) return '#9CA3AF';
  if (w >= 1.8) return '#10B981';
  if (w >= 1.2) return '#F59E0B';
  return '#EF4444';
}

export default function RoutePreviewPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const route     = useAppStore((s) => s.selectedRoute);
  const alerts    = location.state?.alerts || [];
  const segments  = route?.segments || [];

  const [step, setStep] = useState(0);

  if (!route || segments.length === 0) {
    navigate('/compare', { replace: true });
    return null;
  }

  const seg        = segments[step];
  const isFirst    = step === 0;
  const isLast     = step === segments.length - 1;
  const surf       = SURFACE[seg.surface_quality] || SURFACE.moderate;
  const segAlerts  = alerts.filter((a) => a.segment_id === seg.segment_id);

  const polylines = seg.path?.length >= 2
    ? [{ coords: seg.path, color: '#0d9b87', weight: 5 }]
    : [];
  const midpt = seg.path?.[Math.floor((seg.path?.length ?? 0) / 2)] || null;
  const mapMarkers = seg.path?.length
    ? [
        { position: seg.path[0],                     emoji: '🟢', label: 'Đầu đoạn' },
        { position: seg.path[seg.path.length - 1],   emoji: '🔴', label: 'Cuối đoạn' },
      ]
    : [];

  // summary (shown on last step)
  const rampCount = segments.filter((s) => s.has_sidewalk_ramp).length;
  const avgWidth  = segments.length
    ? (segments.reduce((s, x) => s + (x.sidewalk_width || 0), 0) / segments.length).toFixed(1)
    : 0;
  const routeAlertCount = new Set(
    alerts.filter((a) => segments.some((s) => s.segment_id === a.segment_id)).map((a) => a.alert_id)
  ).size;

  function go(i) { if (i >= 0 && i < segments.length) setStep(i); }

  return (
    <div style={{ minHeight: '100vh', background: '#F0FAF6', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* ── Gradient header ── */}
      <div style={{
        background: 'linear-gradient(140deg,#0d9b87 0%,#3dbfa8 100%)',
        padding: 'calc(env(safe-area-inset-top,0px) + 14px) 16px 20px',
        borderRadius: '0 0 28px 28px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} color="#fff" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Xem trước tuyến đường
            </div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 1 }}>
              {route.origin} → {route.destination}
            </div>
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
          {segments.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 4, border: 'none', padding: 0,
                background: i === step ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
          Đoạn {step + 1} / {segments.length}
        </div>
      </div>

      {/* ── Segment content ── */}
      <div style={{ flex: 1, padding: '14px 16px 0', overflowY: 'auto' }}>

        {/* Map thumbnail */}
        {polylines.length > 0 && midpt && (
          <div style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 12, boxShadow: '0 2px 14px rgba(0,0,0,0.1)' }}>
            <MapView height={150} polylines={polylines} markers={mapMarkers} center={midpt} zoom={17} />
          </div>
        )}

        {/* Alert banner */}
        {segAlerts.length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
              {segAlerts.length} cảnh báo đang xảy ra trên đoạn này
            </span>
          </div>
        )}

        {/* Info card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A2E', marginBottom: 4 }}>{seg.street_name}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
            📏 {seg.distance} m &nbsp;·&nbsp; An toàn {Math.round(((seg.safety_score ?? 0) / 5) * 100)}%
          </div>

          {/* Surface */}
          <Row label="Mặt đường">
            <Pill bg={surf.bg} color={surf.color}>{surf.emoji} {surf.label}</Pill>
          </Row>

          {/* Ramp */}
          <Row label="Lối dốc xe lăn">
            {seg.has_sidewalk_ramp
              ? <Pill bg="#D1FAE5" color="#065F46">♿ Có lối dốc</Pill>
              : <Pill bg="#FEE2E2" color="#991B1B">✗ Không có</Pill>}
          </Row>

          {/* Width */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Độ rộng vỉa hè</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{seg.sidewalk_width ?? '?'} m</span>
            </div>
            <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width 0.35s',
                width: `${Math.min(100, ((seg.sidewalk_width || 0) / 3) * 100)}%`,
                background: widthColor(seg.sidewalk_width),
              }} />
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{widthLabel(seg.sidewalk_width)}</div>
          </div>
        </div>

        {/* Summary (last step only) */}
        {isLast && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Tổng kết tuyến
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <Stat value={`${rampCount}/${segments.length}`} label="có lối dốc" ok={rampCount === segments.length} />
              <Stat value={`${avgWidth}m`} label="vỉa hè TB" ok={parseFloat(avgWidth) >= 1.2} />
              <Stat value={routeAlertCount} label="cảnh báo" ok={routeAlertCount === 0} danger={routeAlertCount > 0} />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer nav ── */}
      <div style={{ padding: '8px 16px calc(env(safe-area-inset-bottom,0px) + 16px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => go(step - 1)}
            disabled={isFirst}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 14, cursor: isFirst ? 'default' : 'pointer',
              border: '1.5px solid #E5E7EB', background: isFirst ? '#F9FAFB' : '#fff',
              fontWeight: 700, fontSize: 14, color: isFirst ? '#D1D5DB' : '#6B7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <ChevronLeft size={16} /> Trước
          </button>

          {isLast ? (
            <button
              onClick={() => navigate('/navigate')}
              style={{ flex: 2, padding: '13px 0', borderRadius: 14, border: 'none', background: '#0d9b87', fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer' }}
            >
              ▶ Bắt đầu điều hướng
            </button>
          ) : (
            <button
              onClick={() => go(step + 1)}
              style={{
                flex: 2, padding: '13px 0', borderRadius: 14, border: 'none', background: '#0d9b87',
                fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              Tiếp theo <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      {children}
    </div>
  );
}

function Pill({ bg, color, children }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, background: bg, borderRadius: 8, padding: '3px 10px' }}>
      {children}
    </span>
  );
}

function Stat({ value, label, ok, danger }) {
  const color = danger ? '#EF4444' : ok ? '#0d9b87' : '#F59E0B';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 800, fontSize: 20, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
    </div>
  );
}
