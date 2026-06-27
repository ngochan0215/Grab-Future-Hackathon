import { useEffect, useState } from 'react';
import { getSegments, reportAlert } from '../services/map.api';
import { ISSUE_TYPES, SURFACE_LABEL } from '../constants/labels';
import { Spinner, ErrorMsg, OkMsg } from '../components/ui';
import Header from '../components/layout/Header/Header';

export default function ReportPage() {
  const [segments, setSegments] = useState(null);
  const [form, setForm] = useState({ segment_id: '', issues: [], description: '' });
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

  const toggleIssue = (id) =>
    setForm((f) => ({
      ...f,
      issues: f.issues.includes(id) ? f.issues.filter((x) => x !== id) : [...f.issues, id],
    }));

  async function submit() {
    if (!form.segment_id) return setError('Vui lòng chọn đoạn đường.');
    if (form.issues.length === 0) return setError('Vui lòng chọn ít nhất một loại sự cố.');
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await reportAlert({
        segment_id: Number(form.segment_id),
        issue_type: form.issues, // mảng token
        description: form.description,
      });
      setNotice('Đã gửi báo cáo. Cảm ơn bạn đã đóng góp!');
      setForm((f) => ({ ...f, issues: [], description: '' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (segments === null) return <main className="page"><Spinner /></main>;

  return (
    <main className="page">
      <Header title="Báo cáo sự cố" />

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
          <label>Loại sự cố (chọn một hoặc nhiều)</label>
          <div className="chips">
            {ISSUE_TYPES.map((i) => (
              <button
                key={i.id}
                type="button"
                className={`chip ${form.issues.includes(i.id) ? 'chip--active' : ''}`}
                onClick={() => toggleIssue(i.id)}
              >
                {i.label}
              </button>
            ))}
          </div>
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
          {busy ? 'Sending...' : '⚠️ Submit Report'}
        </button>
      </div>
    </main>
  );
}
