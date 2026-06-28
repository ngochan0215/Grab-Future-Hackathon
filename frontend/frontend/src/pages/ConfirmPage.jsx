import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import MapView from '../components/map/MapView';
import Header from '../components/layout/Header/Header';

export default function ConfirmPage() {
  const navigate = useNavigate();
  const origin = useAppStore((s) => s.origin);
  const destination = useAppStore((s) => s.destination);

  if (!origin || !destination) {
    navigate('/search', { replace: true });
    return null;
  }

  const oPt = origin.lat ? [origin.lat, origin.lng] : null;
  const dPt = destination.lat ? [destination.lat, destination.lng] : null;
  const markers = [];
  if (oPt) markers.push({ position: oPt, emoji: '🟢', label: origin.label });
  if (dPt) markers.push({ position: dPt, emoji: '🏁', label: destination.label });
  const polylines = oPt && dPt ? [{ coords: [oPt, dPt], color: '#0d9b87', dashArray: '4 8', weight: 3 }] : [];

  return (
    <main className="page">
      <Header title="Xác nhận hành trình" back />

      {markers.length > 0 ? (
        <MapView height={240} markers={markers} polylines={polylines} />
      ) : (
        <div className="card card--flat muted center">
          Địa điểm tự nhập (không có toạ độ) — bỏ qua xem trước bản đồ.
        </div>
      )}

      <div className="card">
        <div className="odRow">
          <div className="odDots">
            <span className="dot fill" />
            <span className="line" />
            <span className="dot" />
          </div>
          <div className="odFields">
            <div style={{ marginBottom: 16 }}>
              <div className="muted small">Điểm đi</div>
              <div className="title">{origin.label}</div>
            </div>
            <div>
              <div className="muted small">Điểm đến</div>
              <div className="title">{destination.label}</div>
            </div>
          </div>
        </div>
        <button className="link" style={{ marginTop: 12 }} onClick={() => navigate('/search')}>✏️ Edit</button>
      </div>

      <button
        className="btn btn--primary btn--block"
        style={{ marginTop: 8 }}
        onClick={() => navigate('/options')}
      >Confirm & Personalize</button>
    </main>
  );
}
