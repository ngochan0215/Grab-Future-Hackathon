import { useState } from 'react';
import { formatDuration } from '../utils/formatRoute';

export default function BuddyInviteSheet({ route, current, onSave, onClear, onClose }) {
  const [name,  setName]  = useState(current?.name  || '');
  const [phone, setPhone] = useState(current?.phone || '');
  const [sent,  setSent]  = useState(false);

  function handleSend() {
    if (!name.trim() || !phone.trim()) return;
    // Mock: in production this would fire an SMS/push
    setSent(true);
    setTimeout(() => onSave({ name: name.trim(), phone: phone.trim() }), 1400);
  }

  const eta = route?.total_duration ? formatDuration(route.total_duration) : '?';

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50 }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '20px 20px 36px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        zIndex: 51,
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 18px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            👁️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A2E' }}>Transit Buddy</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              Họ sẽ nhận thông báo khi bạn lên đường và khi bạn đến nơi
            </div>
          </div>
        </div>

        {/* Trip summary */}
        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            📍 {route?.origin} → {route?.destination}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
            ⏱ ETA ~{eta}
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, color: '#065F46' }}>Đã gửi thông báo cho {name}!</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Họ sẽ nhận được link theo dõi hành trình của bạn.
            </div>
          </div>
        ) : (
          <>
            <div className="field">
              <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Tên buddy</label>
              <input
                className="input"
                placeholder="VD: Mẹ, Bạn Lan, Anh Tuấn..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Số điện thoại</label>
              <input
                className="input"
                type="tel"
                placeholder="0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {current && (
                <button
                  onClick={onClear}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1.5px solid #FECACA', background: '#FEF2F2', fontWeight: 700, fontSize: 13, color: '#EF4444', cursor: 'pointer' }}
                >
                  Xoá buddy
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!name.trim() || !phone.trim()}
                style={{
                  flex: 2, padding: '12px 0', borderRadius: 14, border: 'none',
                  background: (!name.trim() || !phone.trim()) ? '#E5E7EB' : '#7C3AED',
                  fontWeight: 700, fontSize: 14,
                  color: (!name.trim() || !phone.trim()) ? '#9CA3AF' : '#fff',
                  cursor: (!name.trim() || !phone.trim()) ? 'default' : 'pointer',
                }}
              >
                📲 Gửi thông báo cho Buddy
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
