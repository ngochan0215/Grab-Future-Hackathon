import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { getMe } from '../services/auth.api';
import { updateProfile } from '../services/user.api';
import { MOBILITY_TYPES, mobilityLabel } from '../constants/labels';
import { Spinner, ErrorMsg, OkMsg } from '../components/ui';

export default function ProfilePage() {
  const navigate = useNavigate();
  const storeUser = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);

  const [user, setLocalUser] = useState(storeUser);
  const [loading, setLoading] = useState(!storeUser);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', mobility_type: 'walking', max_walking_distance: 1000 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Always refresh from the server for the source of truth.
  useEffect(() => {
    getMe()
      .then((d) => { setLocalUser(d.user); setUser(d.user); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setUser]);

  function startEdit() {
    setForm({
      name: user.name || '',
      mobility_type: user.mobility_type || 'walking',
      max_walking_distance: user.max_walking_distance ?? 1000,
    });
    setNotice('');
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const d = await updateProfile({
        name: form.name,
        mobility_type: form.mobility_type,
        max_walking_distance: Number(form.max_walking_distance),
      });
      setLocalUser(d.user);
      setUser(d.user);
      setEditing(false);
      setNotice('Đã cập nhật hồ sơ.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (loading) return <main className="page"><Spinner /></main>;
  if (!user) return <main className="page"><ErrorMsg>Không tải được hồ sơ.</ErrorMsg></main>;

  return (
    <main className="page">
      <header className="pageHeader">
        <h1>Hồ sơ</h1>
      </header>

      <ErrorMsg>{error}</ErrorMsg>
      <OkMsg>{notice}</OkMsg>

      {!editing ? (
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 48 }}>👤</div>
            <div className="title" style={{ fontSize: 20 }}>{user.name}</div>
            <div className="muted small">{user.email}</div>
          </div>
          <hr className="divider" />
          <div className="row row--between" style={{ padding: '6px 0' }}>
            <span className="muted">Loại di chuyển</span>
            <span className="title small">{mobilityLabel(user.mobility_type)}</span>
          </div>
          <div className="row row--between" style={{ padding: '6px 0' }}>
            <span className="muted">Khoảng cách đi bộ tối đa</span>
            <span className="title small">{user.max_walking_distance} m</span>
          </div>
          <button className="btn btn--primary btn--block" style={{ marginTop: 12 }} onClick={startEdit}>
            ✏️ Chỉnh sửa hồ sơ
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="field">
            <label>Họ và tên</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Loại di chuyển</label>
            <select
              className="select"
              value={form.mobility_type}
              onChange={(e) => setForm((f) => ({ ...f, mobility_type: e.target.value }))}
            >
              {MOBILITY_TYPES.map((m) => (
                <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Khoảng cách đi bộ tối đa (m)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.max_walking_distance}
              onChange={(e) => setForm((f) => ({ ...f, max_walking_distance: e.target.value }))}
            />
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn--block" onClick={() => setEditing(false)} disabled={busy}>
              Huỷ
            </button>
            <button className="btn btn--primary btn--block" onClick={save} disabled={busy}>
              Lưu
            </button>
          </div>
        </div>
      )}

      <button className="btn btn--danger btn--block" style={{ marginTop: 8 }} onClick={handleLogout}>
        Đăng xuất
      </button>
    </main>
  );
}
