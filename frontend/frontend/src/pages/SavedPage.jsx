import { useEffect, useState } from 'react';
import { Navigation, Timer, Route, MapPin, Trash2 } from 'lucide-react';
import {
  listSavedRoutes,
  deleteSavedRoute,
} from '../services/savedRoute.api';
import {
  listAddresses,
  createAddress,
  deleteAddress,
} from '../services/address.api';
import { getPlaces } from '../services/map.api';
import { Spinner, EmptyState, ErrorMsg } from '../components/ui';
import { formatDuration, formatDistance } from '../utils/formatRoute';
import TripCard from '../components/common/TripCard/TripCard';
import RouteDetailView from '../components/common/RouteDetailView/RouteDetailView';
import AddressAutocomplete from '../components/AddressAutocomplete';
import styles from '../styles/SavedPage.module.css';
import Header from '../components/layout/Header/Header';

const modeLabel = (m) => (m === 'walk_and_bus' ? 'Bus + Walk' : 'Walk');

export default function SavedPage() {
  const [tab, setTab] = useState('routes');
  const [selectedRoute, setSelectedRoute] = useState(null);

  if (selectedRoute) {
    const stats = [
      { label: 'Mode', value: modeLabel(selectedRoute.transport_mode) },
      selectedRoute.total_distance != null && {
        label: 'Distance',
        value: formatDistance(selectedRoute.total_distance),
      },
      selectedRoute.total_duration != null && {
        label: 'Duration',
        value: formatDuration(selectedRoute.total_duration),
      },
    ].filter(Boolean);

    return (
      <main className="page page--plain">
        <RouteDetailView
          origin={selectedRoute.origin}
          destination={selectedRoute.destination}
          savedRouteId={selectedRoute.route_id}
          stats={stats}
          onBack={() => setSelectedRoute(null)}
        />
      </main>
    );
  }

  return (
    <main className="page">
      <Header title="Saved" />
      <div className="chips" style={{ marginBottom: 12 }}>
        <button
          className={`chip ${tab === 'routes' ? 'chip--active' : ''}`}
          onClick={() => setTab('routes')}
        >
          Routes
        </button>
        <button
          className={`chip ${tab === 'addresses' ? 'chip--active' : ''}`}
          onClick={() => setTab('addresses')}
        >
          Places
        </button>
      </div>
      {tab === 'routes'
        ? <SavedRoutes onSelect={setSelectedRoute} />
        : <SavedAddresses />}
    </main>
  );
}

function SavedRoutes({ onSelect }) {
  const [routes, setRoutes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listSavedRoutes()
      .then(setRoutes)
      .catch((e) => { setError(e.message); setRoutes([]); });
  }, []);

  async function remove(id) {
    try {
      await deleteSavedRoute(id);
      setRoutes((r) => r.filter((x) => x.route_id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (routes === null) return <Spinner />;

  return (
    <>
      <ErrorMsg>{error}</ErrorMsg>
      {routes.length === 0 ? (
        <EmptyState icon="🛣️">No saved routes yet.</EmptyState>
      ) : (
        routes.map((r) => {
          const stats = [
            { icon: Route, label: modeLabel(r.transport_mode) },
            r.total_distance != null && { icon: Navigation, label: formatDistance(r.total_distance) },
            r.total_duration != null && { icon: Timer, label: formatDuration(r.total_duration) },
          ].filter(Boolean);

          return (
            <TripCard
              key={r.route_id}
              origin={r.origin}
              destination={r.destination}
              stats={stats}
              onDelete={() => remove(r.route_id)}
              onClick={() => onSelect(r)}
            />
          );
        })
      )}
    </>
  );
}

const QUICK_LABELS = ['Home', 'Work', 'School', 'Gym'];

function SavedAddresses() {
  const [addresses, setAddresses] = useState(null);
  const [error, setError] = useState('');
  const [label, setLabel] = useState('');
  const [addrVal, setAddrVal] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listAddresses()
      .then(setAddresses)
      .catch((e) => { setError(e.message); setAddresses([]); });

    getPlaces()
      .then((places) =>
        setSuggestions(
          places.map((p) => ({
            key: `p-${p.place_id}`,
            label: p.place_name,
            address: p.category,
            lat: p.latitude,
            lng: p.longitude,
            icon: p.has_ramp_entrance ? '♿' : '📍',
          }))
        )
      )
      .catch(() => {});
  }, []);

  async function add() {
    if (!addrVal?.address?.trim()) return;
    setBusy(true);
    setError('');
    try {
      const created = await createAddress({
        label: label.trim() || addrVal.label,
        address: addrVal.address.trim(),
        latitude: addrVal.lat ?? undefined,
        longitude: addrVal.lng ?? undefined,
      });
      setAddresses((a) => [...a, created]);
      setLabel('');
      setAddrVal(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await deleteAddress(id);
      setAddresses((a) => a.filter((x) => x.address_id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <ErrorMsg>{error}</ErrorMsg>

      <div className={styles.addForm}>
        <p className={styles.formTitle}>Add new place</p>

        <div className={styles.quickChips}>
          {QUICK_LABELS.map((q) => (
            <button
              key={q}
              className={`${styles.quickChip} ${label === q ? styles.quickChipActive : ''}`}
              onClick={() => setLabel((prev) => (prev === q ? '' : q))}
            >
              {q}
            </button>
          ))}
        </div>

        <div className={styles.fieldGroup}>
          <div>
            <span className={styles.fieldLabel}>Label</span>
            <input
              className={styles.fieldInput}
              placeholder="e.g. Home, Gym, Library…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>Address</span>
            <div className={styles.addressWrap}>
              <AddressAutocomplete
                value={addrVal}
                onChange={setAddrVal}
                suggestions={suggestions}
                placeholder="Search or type an address…"
              />
            </div>
          </div>
        </div>

        <button
          className={styles.submitBtn}
          onClick={add}
          disabled={busy || !addrVal?.address?.trim()}
        >
          {busy ? 'Saving…' : 'Save place'}
        </button>
      </div>

      {addresses === null ? (
        <Spinner />
      ) : addresses.length === 0 ? (
        <EmptyState icon="📍">No saved places yet.</EmptyState>
      ) : (
        addresses.map((a) => (
          <div key={a.address_id} className={styles.placeCard}>
            <div className={styles.placeIcon}>
              <MapPin size={20} strokeWidth={2} />
            </div>
            <div className={styles.placeInfo}>
              <p className={styles.placeLabel}>{a.label || 'Place'}</p>
              <p className={styles.placeAddress}>{a.address}</p>
            </div>
            <button
              className={styles.deleteBtn}
              aria-label="Delete place"
              onClick={() => remove(a.address_id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </>
  );
}
