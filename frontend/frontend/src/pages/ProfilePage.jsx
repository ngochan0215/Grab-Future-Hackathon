import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { getMe } from '../services/auth.api';
import { updateProfile } from '../services/user.api';
import { MOBILITY_TYPES, mobilityLabel } from '../constants/labels';
import { Spinner, ErrorMsg, OkMsg } from '../components/ui';
import Header from '../components/layout/Header/Header';

// ── Collapsible section wrapper ──────────────────────────────────────────────
function Section({ title, icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <button
        className="row row--between"
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="title small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon} {title}
        </span>
        <span className="muted">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

// ── Labelled read-only row ────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="row row--between" style={{ padding: '5px 0' }}>
      <span className="muted">{label}</span>
      <span className="title small">{value || '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const storeUser = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);

  const [user, setLocalUser] = useState(storeUser);
  const [loading, setLoading] = useState(!storeUser);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // ── personal info edit ──
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({ name: '', phone_number: '', identification_number: '' });
  const [busyPersonal, setBusyPersonal] = useState(false);

  // ── mobility edit ──
  const [editingMobility, setEditingMobility] = useState(false);
  const [mobilityForm, setMobilityForm] = useState({ mobility_type: 'walking', max_walking_distance: 1000 });
  const [busyMobility, setBusyMobility] = useState(false);

  // ── bank account edit ──
  const [editingBank, setEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_name: '', account_number: '', account_holder: '' });
  const [busyBank, setBusyBank] = useState(false);

  // ── email / password (UI only) ──
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ new_email: '', current_password_email: '' });
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [securityNotice, setSecurityNotice] = useState('');

  useEffect(() => {
    getMe()
      .then((d) => {
        setLocalUser(d.user);
        setUser(d.user);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [setUser]);

  // ── helpers ──────────────────────────────────────────────────────────────
  function startPersonal() {
    setPersonalForm({
      name: user.name || '',
      phone_number: user.phone_number || '',
      identification_number: user.identification_number || '',
    });
    setNotice('');
    setEditingPersonal(true);
  }

  async function savePersonal() {
    setBusyPersonal(true);
    setError('');
    try {
      const d = await updateProfile({
        name: personalForm.name,
        phone_number: personalForm.phone_number,
        identification_number: personalForm.identification_number,
      });
      setLocalUser(d.user);
      setUser(d.user);
      setEditingPersonal(false);
      setNotice('Đã cập nhật thông tin cá nhân.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyPersonal(false);
    }
  }

  function startMobility() {
    setMobilityForm({
      mobility_type: user.mobility_type || 'walking',
      max_walking_distance: user.max_walking_distance ?? 1000,
    });
    setNotice('');
    setEditingMobility(true);
  }

  async function saveMobility() {
    setBusyMobility(true);
    setError('');
    try {
      const d = await updateProfile({
        mobility_type: mobilityForm.mobility_type,
        max_walking_distance: Number(mobilityForm.max_walking_distance),
      });
      setLocalUser(d.user);
      setUser(d.user);
      setEditingMobility(false);
      setNotice('Đã cập nhật thông tin di chuyển.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyMobility(false);
    }
  }

  function startBank() {
    setBankForm({
      bank_name: user.bank_name || '',
      account_number: user.account_number || '',
      account_holder: user.account_holder || '',
    });
    setNotice('');
    setEditingBank(true);
  }

  async function saveBank() {
    setBusyBank(true);
    setError('');
    try {
      const d = await updateProfile({
        bank_name: bankForm.bank_name,
        account_number: bankForm.account_number,
        account_holder: bankForm.account_holder,
      });
      setLocalUser(d.user);
      setUser(d.user);
      setEditingBank(false);
      setNotice('Đã cập nhật thông tin ngân hàng.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyBank(false);
    }
  }

  // UI-only handlers for email / password
  function handleChangeEmail(e) {
    e.preventDefault();
    setSecurityNotice('Yêu cầu đổi email đã được ghi nhận (chức năng đang phát triển).');
    setEditingEmail(false);
    setEmailForm({ new_email: '', current_password_email: '' });
  }

  function handleChangePassword(e) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setSecurityNotice('Mật khẩu mới không khớp.');
      return;
    }
    setSecurityNotice('Yêu cầu đổi mật khẩu đã được ghi nhận (chức năng đang phát triển).');
    setEditingPassword(false);
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (loading) return <main className="page"><Spinner /></main>;
  if (!user) return <main className="page"><ErrorMsg>Không tải được hồ sơ.</ErrorMsg></main>;

  return (
    <main className="page">
      <Header title="Hồ sơ" />

      <ErrorMsg>{error}</ErrorMsg>
      <OkMsg>{notice}</OkMsg>

      {/* ── Avatar / summary ─────────────────────────────────────────────── */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 52 }}>👤</div>
        <div className="title" style={{ fontSize: 20 }}>{user.name}</div>
        <div className="muted small">{user.email}</div>
      </div>

      {/* ── 1. Personal information ──────────────────────────────────────── */}
      <Section title="Thông tin cá nhân" icon="🪪">
        {!editingPersonal ? (
          <>
            <InfoRow label="Họ và tên" value={user.name} />
            <InfoRow label="Số điện thoại" value={user.phone_number} />
            <InfoRow label="Số CCCD / CMND" value={user.identification_number} />
            <button className="btn btn--primary btn--block" style={{ marginTop: 10 }} onClick={startPersonal}>
              ✏️ Chỉnh sửa
            </button>
          </>
        ) : (
          <>
            <div className="field">
              <label>Họ và tên</label>
              <input
                className="input"
                value={personalForm.name}
                onChange={(e) => setPersonalForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Số điện thoại</label>
              <input
                className="input"
                type="tel"
                value={personalForm.phone_number}
                onChange={(e) => setPersonalForm((f) => ({ ...f, phone_number: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Số CCCD / CMND</label>
              <input
                className="input"
                value={personalForm.identification_number}
                onChange={(e) => setPersonalForm((f) => ({ ...f, identification_number: e.target.value }))}
              />
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn--block" onClick={() => setEditingPersonal(false)} disabled={busyPersonal}>Huỷ</button>
              <button className="btn btn--primary btn--block" onClick={savePersonal} disabled={busyPersonal}>Lưu</button>
            </div>
          </>
        )}
      </Section>

      {/* ── 2. Mobility preferences ──────────────────────────────────────── */}
      <Section title="Thông tin di chuyển" icon="♿">
        {!editingMobility ? (
          <>
            <InfoRow label="Loại di chuyển" value={mobilityLabel(user.mobility_type)} />
            <InfoRow label="Khoảng cách đi bộ tối đa" value={user.max_walking_distance ? `${user.max_walking_distance} m` : null} />
            <button className="btn btn--primary btn--block" style={{ marginTop: 10 }} onClick={startMobility}>
              ✏️ Chỉnh sửa
            </button>
          </>
        ) : (
          <>
            <div className="field">
              <label>Loại di chuyển</label>
              <select
                className="select"
                value={mobilityForm.mobility_type}
                onChange={(e) => setMobilityForm((f) => ({ ...f, mobility_type: e.target.value }))}
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
                value={mobilityForm.max_walking_distance}
                onChange={(e) => setMobilityForm((f) => ({ ...f, max_walking_distance: e.target.value }))}
              />
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn--block" onClick={() => setEditingMobility(false)} disabled={busyMobility}>Huỷ</button>
              <button className="btn btn--primary btn--block" onClick={saveMobility} disabled={busyMobility}>Lưu</button>
            </div>
          </>
        )}
      </Section>

      {/* ── 3. Bank account ──────────────────────────────────────────────── */}
      <Section title="Tài khoản ngân hàng" icon="🏦">
        {!editingBank ? (
          <>
            <InfoRow label="Ngân hàng" value={user.bank_name} />
            <InfoRow label="Số tài khoản" value={user.account_number} />
            <InfoRow label="Chủ tài khoản" value={user.account_holder} />
            <button className="btn btn--primary btn--block" style={{ marginTop: 10 }} onClick={startBank}>
              ✏️ Chỉnh sửa
            </button>
          </>
        ) : (
          <>
            <div className="field">
              <label>Ngân hàng</label>
              <input
                className="input"
                placeholder="VD: Vietcombank, Techcombank…"
                value={bankForm.bank_name}
                onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Số tài khoản</label>
              <input
                className="input"
                value={bankForm.account_number}
                onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Chủ tài khoản</label>
              <input
                className="input"
                value={bankForm.account_holder}
                onChange={(e) => setBankForm((f) => ({ ...f, account_holder: e.target.value }))}
              />
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn--block" onClick={() => setEditingBank(false)} disabled={busyBank}>Huỷ</button>
              <button className="btn btn--primary btn--block" onClick={saveBank} disabled={busyBank}>Lưu</button>
            </div>
          </>
        )}
      </Section>

      {/* ── 4. Security (email / password — UI only) ─────────────────────── */}
      <Section title="Bảo mật" icon="🔒">
        <OkMsg>{securityNotice}</OkMsg>

        {/* Change email */}
        <div style={{ marginBottom: 14 }}>
          <div className="row row--between" style={{ marginBottom: 6 }}>
            <span className="muted">Email</span>
            <button
              className="btn"
              style={{ padding: '2px 10px', fontSize: 13 }}
              onClick={() => { setEditingEmail((v) => !v); setEditingPassword(false); setSecurityNotice(''); }}
            >
              {editingEmail ? 'Huỷ' : 'Đổi email'}
            </button>
          </div>
          {editingEmail && (
            <form onSubmit={handleChangeEmail}>
              <div className="field">
                <label>Email mới</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={emailForm.new_email}
                  onChange={(e) => setEmailForm((f) => ({ ...f, new_email: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Mật khẩu hiện tại</label>
                <input
                  className="input"
                  type="password"
                  required
                  value={emailForm.current_password_email}
                  onChange={(e) => setEmailForm((f) => ({ ...f, current_password_email: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn--primary btn--block">Xác nhận đổi email</button>
            </form>
          )}
        </div>

        <hr className="divider" />

        {/* Change password */}
        <div style={{ marginTop: 10 }}>
          <div className="row row--between" style={{ marginBottom: 6 }}>
            <span className="muted">Mật khẩu</span>
            <button
              className="btn"
              style={{ padding: '2px 10px', fontSize: 13 }}
              onClick={() => { setEditingPassword((v) => !v); setEditingEmail(false); setSecurityNotice(''); }}
            >
              {editingPassword ? 'Huỷ' : 'Đổi mật khẩu'}
            </button>
          </div>
          {editingPassword && (
            <form onSubmit={handleChangePassword}>
              <div className="field">
                <label>Mật khẩu hiện tại</label>
                <input
                  className="input"
                  type="password"
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Mật khẩu mới</label>
                <input
                  className="input"
                  type="password"
                  required
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  className="input"
                  type="password"
                  required
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn--primary btn--block">Xác nhận đổi mật khẩu</button>
            </form>
          )}
        </div>
      </Section>

      <button className="btn btn--danger btn--block" style={{ marginTop: 4 }} onClick={handleLogout}>
        Đăng xuất
      </button>
    </main>
  );
}
