import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react';

// ── Static mock data ──────────────────────────────────────────────────────────

const GRAB_SERVICES = [
  {
    id: 'grabBike',
    name: 'GrabBike',
    icon: '🏍️',
    desc: 'Xe máy tiết kiệm',
    eta: 3,
    pricePerKm: 11000,
    basePrice: 10000,
  },
  {
    id: 'grabCar',
    name: 'GrabCar',
    icon: '🚗',
    desc: 'Xe 4 bánh riêng tư',
    eta: 6,
    pricePerKm: 28000,
    basePrice: 25000,
  },
  {
    id: 'grabBikeXl',
    name: 'GrabBike XL',
    icon: '🛵',
    desc: 'Xe máy tải thêm hành lý',
    eta: 4,
    pricePerKm: 14000,
    basePrice: 12000,
  },
];

const BE_SERVICES = [
  {
    id: 'beBike',
    name: 'Be Bike',
    icon: '🏍️',
    desc: 'Xe máy be',
    eta: 3,
    pricePerKm: 10000,
    basePrice: 9000,
  },
  {
    id: 'beCar',
    name: 'Be Car',
    icon: '🚗',
    desc: 'Ô tô be',
    eta: 7,
    pricePerKm: 26000,
    basePrice: 22000,
  },
];

const MOCK_DRIVERS = {
  grabBike:   { name: 'Nguyễn Văn Hùng', plate: '51B-12345', rating: 4.9, trips: 1842 },
  grabCar:    { name: 'Trần Minh Tuấn',  plate: '51F-67890', rating: 4.8, trips: 3201 },
  grabBikeXl: { name: 'Lê Thành Đạt',   plate: '51B-54321', rating: 4.7, trips: 982  },
  beBike:     { name: 'Phạm Văn Bình',   plate: '51B-88888', rating: 4.8, trips: 1230 },
  beCar:      { name: 'Hoàng Anh Tuấn',  plate: '51F-99999', rating: 4.9, trips: 2104 },
};

function calcPrice(svc, distanceMeters) {
  const km = distanceMeters / 1000;
  return Math.round((svc.basePrice + svc.pricePerKm * km) / 1000) * 1000;
}

function fmtPrice(vnd) {
  return vnd.toLocaleString('vi-VN') + '₫';
}

function Stars({ value }) {
  return (
    <span style={{ color: '#FBBF24', letterSpacing: 1 }}>
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
    </span>
  );
}

// ── Provider header config ────────────────────────────────────────────────────
const PROVIDERS = {
  grab: { label: 'Grab', color: '#00B14F', textColor: '#fff', services: GRAB_SERVICES },
  be:   { label: 'Be',   color: '#FCD008', textColor: '#1A1A2E', services: BE_SERVICES  },
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GrabBookingPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const leg       = location.state?.leg       || {};
  const fullRoute = location.state?.fullRoute || {};

  const distanceM = leg.distance || 650;

  const [provider,  setProvider]  = useState('grab');
  const [selected,  setSelected]  = useState('grabBike');
  const [phase,     setPhase]     = useState('pick');   // pick | confirm | booked
  const [countdown, setCountdown] = useState(null);

  const prov     = PROVIDERS[provider];
  const services = prov.services;

  // Make sure selectedId is valid for the current provider
  const validId  = services.find((s) => s.id === selected)?.id ?? services[0].id;

  function handleProviderChange(id) {
    setProvider(id);
    setSelected(PROVIDERS[id].services[0].id);
  }

  function handleBook() {
    setPhase('confirm');
  }

  function handleConfirm() {
    setPhase('booked');
    // Mock countdown
    let secs = PROVIDERS[provider].services.find((s) => s.id === validId)?.eta * 60 ?? 180;
    setCountdown(secs);
    const iv = setInterval(() => {
      secs -= 1;
      if (secs <= 0) { clearInterval(iv); setCountdown(0); }
      else setCountdown(secs);
    }, 1000);
  }

  function handleDone() {
    navigate('/navigate');
  }

  // ── Booked screen ─────────────────────────────────────────────────────────
  if (phase === 'booked') {
    const svc    = services.find((s) => s.id === validId) || services[0];
    const driver = MOCK_DRIVERS[validId] || MOCK_DRIVERS.grabBike;
    const mins   = countdown != null ? Math.ceil(countdown / 60) : svc.eta;

    return (
      <div style={{ minHeight: '100vh', background: '#F0FAF6', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 430, margin: '0 auto' }}>
        {/* Green top */}
        <div style={{ width: '100%', background: prov.color, padding: '32px 20px 24px', borderRadius: '0 0 32px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>{svc.icon}</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: prov.textColor, marginTop: 8 }}>
            Đã đặt xe thành công!
          </div>
          <div style={{ color: prov.textColor, opacity: 0.8, fontSize: 14, marginTop: 4 }}>
            Tài xế đang đến · ETA ~{mins} phút
          </div>
        </div>

        <div style={{ width: '100%', padding: '20px 16px', flex: 1 }}>
          {/* Driver card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: prov.color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}>
                {svc.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A2E' }}>{driver.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                  {svc.icon} {driver.plate}
                </div>
                <div style={{ marginTop: 3 }}>
                  <Stars value={driver.rating} />
                  <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 6 }}>
                    {driver.rating} · {driver.trips.toLocaleString()} chuyến
                  </span>
                </div>
              </div>
              <div style={{
                textAlign: 'right',
              }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: prov.color }}>
                  {mins}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>phút</div>
              </div>
            </div>
          </div>

          {/* Trip summary */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E', marginBottom: 12 }}>Chi tiết chuyến đi</div>
            <OdRow pickup={leg.pickup_label || fullRoute.origin} dropoff={leg.dropoff_label} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Tổng cước</span>
              <span style={{ fontWeight: 700, color: '#1A1A2E' }}>{fmtPrice(calcPrice(svc, distanceM))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Thanh toán</span>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Tiền mặt</span>
            </div>
          </div>

          {/* Contact actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[['📞', 'Gọi tài xế'], ['💬', 'Nhắn tin'], ['📍', 'Theo dõi']].map(([ic, lb]) => (
              <button key={lb} style={{
                flex: 1, padding: '10px 0', background: '#fff', border: '1.5px solid #E5E7EB',
                borderRadius: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#4B5563',
              }}>
                <span style={{ fontSize: 20 }}>{ic}</span>
                {lb}
              </button>
            ))}
          </div>

          <button
            onClick={handleDone}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 16,
              background: prov.color, border: 'none',
              fontWeight: 700, fontSize: 15, color: prov.textColor, cursor: 'pointer',
            }}
          >
            Quay lại điều hướng
          </button>
        </div>
      </div>
    );
  }

  // ── Confirm screen ────────────────────────────────────────────────────────
  if (phase === 'confirm') {
    const svc = services.find((s) => s.id === validId) || services[0];
    return (
      <div style={{ minHeight: '100vh', background: '#F0FAF6', maxWidth: 430, margin: '0 auto' }}>
        <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setPhase('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={22} color="#1A1A2E" />
          </button>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1A1A2E' }}>Xác nhận đặt xe</span>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 32 }}>{svc.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{prov.label} · {svc.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{svc.desc} · ~{svc.eta} phút</div>
              </div>
              <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 18, color: prov.color }}>
                {fmtPrice(calcPrice(svc, distanceM))}
              </div>
            </div>
            <OdRow pickup={leg.pickup_label || fullRoute.origin} dropoff={leg.dropoff_label} />
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Phương thức thanh toán</div>
            {[['💵', 'Tiền mặt', true], ['💳', 'Thẻ ngân hàng', false], ['📱', 'Ví điện tử', false]].map(([ic, lb, active]) => (
              <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}>
                <span style={{ fontSize: 20 }}>{ic}</span>
                <span style={{ flex: 1, fontSize: 14, color: '#1A1A2E' }}>{lb}</span>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? prov.color : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: prov.color }} />}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px', marginBottom: 4 }}>
            <span style={{ fontSize: 15, color: '#1A1A2E' }}>Tổng cộng</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#1A1A2E' }}>{fmtPrice(calcPrice(svc, distanceM))}</span>
          </div>

          <button
            onClick={handleConfirm}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 16,
              background: prov.color, border: 'none',
              fontWeight: 700, fontSize: 15, color: prov.textColor, cursor: 'pointer',
            }}
          >
            Xác nhận đặt {svc.name}
          </button>
        </div>
      </div>
    );
  }

  // ── Pick service screen ───────────────────────────────────────────────────
  const currentSvc = services.find((s) => s.id === validId) || services[0];

  return (
    <div style={{ minHeight: '100vh', background: '#F0FAF6', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ background: prov.color, padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 0', borderRadius: '0 0 28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} color={prov.textColor} />
          </button>
          <span style={{ fontWeight: 800, fontSize: 18, color: prov.textColor, flex: 1 }}>Đặt xe</span>

          {/* Provider tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', borderRadius: 20, padding: 3, gap: 2 }}>
            {Object.entries(PROVIDERS).map(([id, p]) => (
              <button
                key={id}
                onClick={() => handleProviderChange(id)}
                style={{
                  padding: '4px 14px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                  background: provider === id ? '#fff' : 'transparent',
                  color: provider === id ? p.color : prov.textColor,
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* O-D strip */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: '12px 14px', marginBottom: -20 }}>
          <OdRow pickup={leg.pickup_label || fullRoute.origin} dropoff={leg.dropoff_label} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>📏 {distanceM} m</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>⏱ ~{leg.duration ?? 5} phút xe máy</span>
          </div>
        </div>
      </div>

      {/* Service list */}
      <div style={{ padding: '28px 16px 0', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Chọn dịch vụ
        </div>

        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 14 }}>
          {services.map((svc, i) => {
            const price   = calcPrice(svc, distanceM);
            const isActive = validId === svc.id;
            return (
              <div
                key={svc.id}
                onClick={() => setSelected(svc.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  borderBottom: i < services.length - 1 ? '1px solid #F3F4F6' : 'none',
                  cursor: 'pointer',
                  background: isActive ? prov.color + '10' : 'transparent',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: isActive ? prov.color + '22' : '#F9FAFB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, flexShrink: 0,
                }}>
                  {svc.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>{svc.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{svc.desc} · ~{svc.eta} phút</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: isActive ? prov.color : '#1A1A2E' }}>
                    {fmtPrice(price)}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>~{svc.eta} phút</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isActive ? prov.color : '#D1D5DB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isActive && <div style={{ width: 10, height: 10, borderRadius: '50%', background: prov.color }} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Promo / note */}
        <div style={{ background: prov.color + '15', border: `1px solid ${prov.color}44`, borderRadius: 14, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🎁</span>
          <span style={{ fontSize: 13, color: '#1A1A2E' }}>
            Chuyến đi được tích hợp với hành trình của bạn — điểm đón & điểm trả đã được điền sẵn.
          </span>
        </div>
      </div>

      {/* Book button */}
      <div style={{ padding: '0 16px calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
          <span style={{ fontSize: 14, color: '#6B7280' }}>{currentSvc.name}</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#1A1A2E' }}>
            {fmtPrice(calcPrice(currentSvc, distanceM))}
          </span>
        </div>
        <button
          onClick={handleBook}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 18,
            background: prov.color, border: 'none',
            fontWeight: 800, fontSize: 16, color: prov.textColor, cursor: 'pointer',
            boxShadow: `0 6px 20px ${prov.color}55`,
          }}
        >
          Đặt {currentSvc.name} ngay →
        </button>
      </div>
    </div>
  );
}

// ── Shared O-D row ────────────────────────────────────────────────────────────
function OdRow({ pickup, dropoff }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 3, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00B14F' }} />
        <div style={{ width: 2, height: 22, background: '#D1D5DB' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pickup || '—'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {dropoff || '—'}
        </div>
      </div>
    </div>
  );
}
