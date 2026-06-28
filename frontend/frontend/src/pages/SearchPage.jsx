import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { listAddresses } from '../services/address.api';
import { getPlaces } from '../services/map.api';
import AddressAutocomplete from '../components/AddressAutocomplete';
import Header from '../components/layout/Header/Header';
import MapView from '../components/map/MapView';

const TRAVEL_MODES = [
  { id: 'walk_only', label: 'Walking', icon: '🚶' },
  { id: 'wheelchair', label: 'Wheelchair', icon: '♿' },
  { id: 'mixed_transport', label: 'Mixed Transport', icon: '🚍' },
];

const ROUTE_PREFS = [
  { id: 'safety', label: 'Safest', icon: '🛡️' },
  { id: 'time', label: 'Fastest', icon: '⚡' },
  { id: 'cost', label: 'Cheapest', icon: '💰' },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const storeOrigin = useAppStore((s) => s.origin);
  const storeDest = useAppStore((s) => s.destination);
  const setOrigin = useAppStore((s) => s.setOrigin);
  const setDestination = useAppStore((s) => s.setDestination);
  const mode = useAppStore((s) => s.transportMode);
  const setMode = useAppStore((s) => s.setTransportMode);
  const priority = useAppStore((s) => s.priority);
  const setPri = useAppStore((s) => s.setPriority);

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

  const mapMarkers = [
    origin?.lat && { position: [origin.lat, origin.lng], label: origin.label, emoji: '🟢' },
    destination?.lat && { position: [destination.lat, destination.lng], label: destination.label, emoji: '🔴' }
  ].filter(Boolean);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      maxWidth: 430,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--page-bg)',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, zIndex: 10, padding: '0 16px' }}>
        <Header title="Plan Your Trip" back />
      </div>

      {/* Map fills remaining space between header and sheet */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', margin: '0 0' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <MapView markers={mapMarkers} height="100%" interactive />
        </div>
        {/* Gradient: top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to bottom, rgba(13,155,135,0.35), transparent)',
          pointerEvents: 'none', zIndex: 2
        }} />
        {/* Gradient: bottom fade into sheet */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to top, var(--page-bg) 10%, transparent)',
          pointerEvents: 'none', zIndex: 2
        }} />
        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.12) 100%)',
          pointerEvents: 'none', zIndex: 2
        }} />
      </div>

      {/* Bottom Sheet — sits naturally at bottom, height = content */}
      <div style={{
        flexShrink: 0,
        background: 'var(--page-bg)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: '12px 16px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        zIndex: 10,
      }}>
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 12px' }} />

        <div className="card" style={{ padding: '12px', marginBottom: '8px' }}>
          <div className="odRow">
            <div className="odDots">
              <span className="dot fill" />
              <span className="line" />
              <span className="dot" />
            </div>
            <div className="odFields">
              <div style={{ marginBottom: 8 }}>
                <AddressAutocomplete value={origin} onChange={setO} suggestions={suggestions} placeholder="Origin" />
              </div>
              <AddressAutocomplete value={destination} onChange={setD} suggestions={suggestions} placeholder="Destination" />
            </div>
          </div>
          <button className="link" style={{ marginTop: 8, fontSize: '13px' }} onClick={swap}>⇅ Swap Origin / Destination</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <div style={{ flex: 1 }}>
            <div className="sectionTitle" style={{ margin: '0 4px 6px' }}>Travel Mode</div>
            <div className="chips">
              {TRAVEL_MODES.map((m) => (
                <button key={m.id} className={`chip ${mode === m.id ? 'chip--active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setMode(m.id)}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="sectionTitle" style={{ margin: '0 4px 6px' }}>Preference</div>
            <div className="chips">
              {ROUTE_PREFS.map((p) => (
                <button key={p.id} className={`chip ${priority === p.id ? 'chip--active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setPri(p.id)}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn--primary btn--block" style={{ marginTop: 14 }} onClick={next} disabled={!ready}>
          Find Routes
        </button>
      </div>
    </div>
  );
}
