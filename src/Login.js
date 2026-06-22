import React, { useState } from 'react';
import { ADMIN_SECRET } from './App';
import s from './styles';

export default function Login({ onLogin }) {
  const [secret, setSecret] = useState('');
  const [err, setErr] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (secret === ADMIN_SECRET) { onLogin(true); }
    else { setErr('Incorrect password. Try again.'); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3' }}>
      <div style={{ ...s.card, width: 340, padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <div style={{ width: 36, height: 36, background: '#CC1818', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>H</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>Halcyon MH</div>
            <div style={{ fontSize: 12, color: '#888' }}>Ticketing system</div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Admin password</label>
          <input
            type="password"
            value={secret}
            onChange={e => { setSecret(e.target.value); setErr(''); }}
            placeholder="Enter your password"
            style={{ ...s.input, marginBottom: err ? 6 : 16 }}
            autoFocus
          />
          {err && <p style={{ color: '#A32D2D', fontSize: 13, margin: '0 0 12px' }}>{err}</p>}
          <button type="submit" style={s.btnPrimary}>Sign in →</button>
        </form>
        <p style={{ marginTop: '1.25rem', fontSize: 12, color: '#aaa', textAlign: 'center' }}>
          Colleague? <a href="/submit" style={{ color: '#CC1818', textDecoration: 'none' }}>Submit a request →</a>
        </p>
      </div>
    </div>
  );
}
