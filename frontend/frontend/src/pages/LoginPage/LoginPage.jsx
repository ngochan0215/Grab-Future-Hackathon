// filepath: src/pages/LoginPage/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import AuthCard from '../../components/common/AuthCard/AuthCard';
import AuthLogo from '../../components/common/AuthLogo/AuthLogo';
import AuthInput from '../../components/common/AuthInput/AuthInput';
import RoundButton from '../../components/common/RoundButton/RoundButton';
import { MOBILITY_TYPES } from '../../constants/labels';
import { login as apiLogin, register as apiRegister } from '../../services/auth.api';
import useAppStore from '../../store/useAppStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobility_type: 'walking',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit() {
    setError('');
    setIsLoading(true);
    try {
      const data =
        mode === 'login'
          ? await apiLogin(form.email, form.password)
          : await apiRegister({
              name: form.name,
              email: form.email,
              password: form.password,
              mobility_type: form.mobility_type,
            });
      setAuth({ token: data.token, user: data.user });
      navigate('/home');
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  const isRegister = mode === 'register';

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.cardContainer}>
        <AuthCard>
          <AuthLogo />
          <h2 className={styles.title}>
            {isRegister ? 'Create Account' : 'Log In'}
          </h2>

          {error && <div className={styles.error}>{error}</div>}

          {isRegister && (
            <AuthInput
              label="Họ và tên"
              type="text"
              value={form.name}
              onChange={set('name')}
            />
          )}
          <AuthInput
            label="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
          />
          <AuthInput
            label="Mật khẩu"
            type="password"
            value={form.password}
            onChange={set('password')}
          />

          {isRegister && (
            <div className={styles.selectWrap}>
              <label className={styles.selectLabel}>Loại di chuyển</label>
              <select
                className={styles.select}
                value={form.mobility_type}
                onChange={set('mobility_type')}
              >
                {MOBILITY_TYPES.filter((m) => m.id !== 'other').map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.actions}>
            <RoundButton onClick={handleSubmit} isLoading={isLoading} />
          </div>

          <button
            type="button"
            className={styles.toggle}
            onClick={() => {
              setError('');
              setMode(isRegister ? 'login' : 'register');
            }}
          >
            {isRegister
              ? 'Already have an account? Log In'
              : "Don't have an account? Sign Up"}
          </button>
        </AuthCard>
      </div>
    </div>
  );
}
