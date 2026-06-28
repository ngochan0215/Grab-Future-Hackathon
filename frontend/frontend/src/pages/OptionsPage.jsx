import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { TRANSPORT_MODES, PRIORITIES } from '../constants/labels';
import Header from '../components/layout/Header/Header';

export default function OptionsPage() {
  const navigate = useNavigate();
  const origin = useAppStore((s) => s.origin);
  const destination = useAppStore((s) => s.destination);
  const storeMode = useAppStore((s) => s.transportMode);
  const storePriority = useAppStore((s) => s.priority);
  const setTransportMode = useAppStore((s) => s.setTransportMode);
  const setPriority = useAppStore((s) => s.setPriority);

  const [mode, setMode] = useState(storeMode);
  const [priority, setPri] = useState(storePriority);

  if (!origin || !destination) {
    navigate('/search', { replace: true });
    return null;
  }

  function findRoutes() {
    setTransportMode(mode);
    setPriority(priority);
    navigate('/compare');
  }

  return (
    <main className="page">
      <Header title="Cá nhân hoá lộ trình" />

      <div className="sectionTitle">Phương tiện</div>
      {TRANSPORT_MODES.map((m) => (
        <div
          key={m.id}
          className={`optionRow ${mode === m.id ? 'sel' : ''}`}
          onClick={() => setMode(m.id)}
        >
          <span className="oIcon">{m.icon}</span>
          <span className="oText"><b>{m.label}</b></span>
          {mode === m.id && <span className="oCheck">✓</span>}
        </div>
      ))}

      <div className="sectionTitle">Ưu tiên theo</div>
      {PRIORITIES.map((p) => (
        <div
          key={p.id}
          className={`optionRow ${priority === p.id ? 'sel' : ''}`}
          onClick={() => setPri(p.id)}
        >
          <span className="oIcon">{p.icon}</span>
          <span className="oText">
            <b>{p.label}</b>
            <small>{p.desc}</small>
          </span>
          {priority === p.id && <span className="oCheck">✓</span>}
        </div>
      ))}

      <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} onClick={findRoutes}>🔍 Find Routes</button>
    </main>
  );
}
