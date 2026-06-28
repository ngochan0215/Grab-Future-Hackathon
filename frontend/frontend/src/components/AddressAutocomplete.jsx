import { useState, useRef, useEffect } from 'react';

// Grab/Google-style autocomplete: type to filter suggestions, click to pick.
// Emits the full location object { label, address, lat, lng } on every change
// (free-typed text becomes a coord-less location).
export default function AddressAutocomplete({ value, onChange, suggestions, placeholder }) {
  const [query, setQuery] = useState(value?.label || '');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Keep the visible text in sync if the value is set from outside (e.g. swap).
  useEffect(() => {
    setQuery(value?.label || '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = !q
    ? suggestions
    : suggestions
        .filter(
          (s) =>
            s.label.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q)
        )
        // prefix matches first ("similar alphabet letters" feel)
        .sort((a, b) => {
          const ap = a.label.toLowerCase().startsWith(q) ? 0 : 1;
          const bp = b.label.toLowerCase().startsWith(q) ? 0 : 1;
          return ap - bp;
        });

  function handleType(e) {
    const text = e.target.value;
    setQuery(text);
    setOpen(true);
    onChange({ label: text, address: text, lat: null, lng: null });
  }

  function pick(s) {
    setQuery(s.label);
    setOpen(false);
    onChange({ label: s.label, address: s.address, lat: s.lat, lng: s.lng });
  }

  return (
    <div className="combo" ref={boxRef}>
      <input
        className="input"
        value={query}
        placeholder={placeholder}
        onChange={handleType}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 && (
        <div className="comboList">
          {matches.slice(0, 8).map((s) => (
            <div key={s.key} className="comboItem" onClick={() => pick(s)}>
              <span className="ic">{s.icon}</span>
              <span className="tx">
                <b>{s.label}</b>
                {s.address && s.address !== s.label && <small>{s.address}</small>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
