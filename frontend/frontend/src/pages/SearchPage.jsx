import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { listAddresses } from '../services/address.api';
import { getPlaces } from '../services/map.api';
import AddressAutocomplete from '../components/AddressAutocomplete';

export default function SearchPage() {
  const navigate = useNavigate();
  const storeOrigin = useAppStore((s) => s.origin);
  const storeDest = useAppStore((s) => s.destination);
  const setOrigin = useAppStore((s) => s.setOrigin);
  const setDestination = useAppStore((s) => s.setDestination);

  const [origin, setO] = useState(storeOrigin);
  const [destination, setD] = useState(storeDest);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    Promise.all([listAddresses().catch(() => []), getPlaces().catch(() => [])]).then(
      ([addresses, places]) => {
        const a = addresses.map((x) => ({
          key: `a-${x.address_id}`,
          label: x.label || x.address,
          address: x.address,
          lat: x.latitude,
          lng: x.longitude,
          icon: '⭐',
        }));
        const p = places.map((x) => ({
          key: `p-${x.place_id}`,
          label: x.place_name,
          address: x.category,
          lat: x.latitude,
          lng: x.longitude,
          icon: x.has_ramp_entrance ? '♿' : '📍',
        }));
        setSuggestions([...a, ...p]);
      }
    );
  }, []);

  function swap() {
    setO(destination);
    setD(origin);
  }

  function next() {
    if (!origin?.label?.trim() || !destination?.label?.trim()) return;
    setOrigin(origin);
    setDestination(destination);
    navigate('/confirm');
  }

  const ready = origin?.label?.trim() && destination?.label?.trim();

  return (
    <main className="page">
      <header className="pageHeader">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/home')}>←</button>
        <h1>Bạn muốn đi đâu?</h1>
      </header>

      <div className="card">
        <div className="odRow">
          <div className="odDots">
            <span className="dot fill" />
            <span className="line" />
            <span className="dot" />
          </div>
          <div className="odFields">
            <div style={{ marginBottom: 10 }}>
              <AddressAutocomplete
                value={origin}
                onChange={setO}
                suggestions={suggestions}
                placeholder="Điểm đi"
              />
            </div>
            <AddressAutocomplete
              value={destination}
              onChange={setD}
              suggestions={suggestions}
              placeholder="Điểm đến"
            />
          </div>
        </div>
        <button className="link" style={{ marginTop: 12 }} onClick={swap}>
          ⇅ Đổi chiều điểm đi / đến
        </button>
      </div>

      <div className="sectionTitle">Gợi ý nhanh</div>
      <div className="chips">
        {suggestions.slice(0, 6).map((s) => (
          <button
            key={s.key}
            className="chip"
            onClick={() => (origin?.label ? setD(s) : setO(s))}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <button
        className="btn btn--primary btn--block"
        style={{ marginTop: 20 }}
        onClick={next}
        disabled={!ready}
      >
        Tiếp tục
      </button>
    </main>
  );
}
