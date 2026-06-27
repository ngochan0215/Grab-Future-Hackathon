import { useEffect, useState } from 'react';
import {
  listSavedRoutes,
  deleteSavedRoute,
} from '../services/savedRoute.api';
import {
  listAddresses,
  createAddress,
  deleteAddress,
} from '../services/address.api';
import { Spinner, EmptyState, ErrorMsg } from '../components/ui';
import { formatDuration, formatDistance } from '../utils/formatRoute';

export default function SavedPage() {
  const [tab, setTab] = useState('routes');
  return (
    <main className="page">
      <header className="pageHeader">
        <h1>Đã lưu</h1>
      </header>
      <div className="chips" style={{ marginBottom: 12 }}>
        <button
          className={`chip ${tab === 'routes' ? 'chip--active' : ''}`}
          onClick={() => setTab('routes')}
        >
          🛣️ Tuyến đường
        </button>
        <button
          className={`chip ${tab === 'addresses' ? 'chip--active' : ''}`}
          onClick={() => setTab('addresses')}
        >
          📍 Địa chỉ
        </button>
      </div>
      {tab === 'routes' ? <SavedRoutes /> : <SavedAddresses />}
    </main>
  );
}

function SavedRoutes() {
  const [routes, setRoutes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listSavedRoutes().then(setRoutes).catch((e) => { setError(e.message); setRoutes([]); });
  }, []);

  async function remove(id) {
    try {
      await deleteSavedRoute(id);
      setRoutes((r) => r.filter((x) => x.route_id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (routes === null) return <Spinner />;
  return (
    <>
      <ErrorMsg>{error}</ErrorMsg>
      {routes.length === 0 ? (
        <EmptyState icon="🛣️">Chưa có tuyến nào được lưu.</EmptyState>
      ) : (
        routes.map((r) => (
          <div className="card" key={r.route_id}>
            <div className="row row--between">
              <div className="col">
                <span className="title">{r.origin} → {r.destination}</span>
                <span className="muted small">
                  {formatDistance(r.total_distance || 0)} · {formatDuration(r.total_duration || 0)} · {r.transport_mode}
                </span>
              </div>
              <button className="btn btn--danger btn--sm" onClick={() => remove(r.route_id)}>
                Xoá
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
}

function SavedAddresses() {
  const [addresses, setAddresses] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ label: '', address: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listAddresses().then(setAddresses).catch((e) => { setError(e.message); setAddresses([]); });
  }, []);

  async function add() {
    if (!form.address.trim()) return;
    setBusy(true);
    setError('');
    try {
      const created = await createAddress({ label: form.label, address: form.address.trim() });
      setAddresses((a) => [...a, created]);
      setForm({ label: '', address: '' });
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
      <div className="card">
        <div className="field">
          <label>Nhãn (vd: Nhà, Trường)</label>
          <input
            className="input"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Địa chỉ</label>
          <input
            className="input"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        <button className="btn btn--primary btn--block" onClick={add} disabled={busy}>
          + Thêm địa chỉ
        </button>
      </div>

      {addresses === null ? (
        <Spinner />
      ) : addresses.length === 0 ? (
        <EmptyState icon="📍">Chưa lưu địa chỉ nào.</EmptyState>
      ) : (
        addresses.map((a) => (
          <div className="card" key={a.address_id}>
            <div className="row row--between">
              <div className="col">
                {a.label && <span className="badge badge--accent">{a.label}</span>}
                <span className="title small">{a.address}</span>
              </div>
              <button className="btn btn--danger btn--sm" onClick={() => remove(a.address_id)}>
                Xoá
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
}
