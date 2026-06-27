import { useEffect, useState } from 'react';
import { getSegments, reportAlert } from '../services/map.api';
import { ISSUE_TYPES, SURFACE_LABEL } from '../constants/labels';
import { Spinner, ErrorMsg, OkMsg } from '../components/ui';

export default function ReportPage() {
  const [segments, setSegments] = useState(null);
  const [form, setForm] = useState({ segment_id: '', issue_type: 'obstacle', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getSegments()
      .then((s) => {
        setSegments(s);
        if (s[0]) setForm((f) => ({ ...f, segment_id: String(s[0].segment_id) }));
      })
      .catch((e) => { setError(e.message); setSegments([]); });
  }, []);

  async function submit() {
    if (!form.segment_id) return setError('Vui lòng chọn đoạn đường.');
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await reportAlert({
        segment_id: Number(form.segment_id),
        issue_type: form.issue_type,
        description: form.description,
      });
      setNotice('Đã gửi báo cáo. Cảm ơn bạn đã đóng góp!');
      setForm((f) => ({ ...f, description: '' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (segments === null) return <main className="page"><Spinner /></main>;

  return (
    <main className="page">
      <header className="pageHeader">
        <div className="col">
          <h1>Báo cáo sự cố</h1>
          <span className="sub">Giúp cộng đồng tránh các đoạn đường nguy hiểm</span>
        </div>
      </header>

      <ErrorMsg>{error}</ErrorMsg>
      <OkMsg>{notice}</OkMsg>

      <div className="card">
        <div className="field">
          <label>Đoạn đường</label>
          <select
            className="select"
            value={form.segment_id}
            onChange={(e) => setForm((f) => ({ ...f, segment_id: e.target.value }))}
          >
            {segments.map((s) => (
              <option key={s.segment_id} value={s.segment_id}>
                {s.street_name} ({SURFACE_LABEL[s.surface_quality] || s.surface_quality})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Loại sự cố</label>
          <select
            className="select"
            value={form.issue_type}
            onChange={(e) => setForm((f) => ({ ...f, issue_type: e.target.value }))}
          >
            {ISSUE_TYPES.map((i) => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Mô tả (tuỳ chọn)</label>
          <textarea
            className="textarea"
            placeholder="Mô tả chi tiết tình trạng…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <button className="btn btn--primary btn--block" onClick={submit} disabled={busy}>
          {busy ? 'Đang gửi…' : '⚠️ Gửi báo cáo'}
        </button>
      </div>
    </main>
  );
}
