import React, { useState } from 'react';
import { API } from './App';
import s from './styles';

export default function SubmitForm() {
  const [form, setForm] = useState({ title: '', desc: '', project: '', priority: 'Medium', due: '', submittedBy: '', submitterEmail: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');

  const PROJECTS = ['Halcyon MH — General', 'IT / Systems', 'Admin / HR', 'Showroom', 'Workshop', 'Velor Wear', 'Other'];

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.submittedBy.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/tickets/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error('Submission failed');
      const data = await r.json();
      setTicketId(data.ticket?.id || '');
      setDone(true);
    } catch {
      setError('Could not submit. Please try again or contact Benjamin directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3', padding: '1rem' }}>
        <div style={{ ...s.card, width: 'min(480px,100%)', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111', margin: '0 0 8px' }}>Request submitted!</h2>
          {ticketId && <p style={{ fontSize: 13, color: '#888', margin: '0 0 4px' }}>Ticket ID: <strong>{ticketId}</strong></p>}
          <p style={{ fontSize: 14, color: '#555', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
            Benjamin has been notified and will get back to you.
          </p>
          <button onClick={() => { setDone(false); setForm({ title: '', desc: '', project: '', priority: 'Medium', due: '', submittedBy: '', submitterEmail: '' }); }} style={s.btnSecondary}>
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <div style={{ width: 36, height: 36, background: '#CC1818', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>H</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>Halcyon MH</div>
            <div style={{ fontSize: 12, color: '#888' }}>Submit a task request to Benjamin</div>
          </div>
        </div>

        <div style={s.card}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 0 }}>
              <div>
                <label style={s.label}>Your name *</label>
                <input value={form.submittedBy} onChange={e => set('submittedBy', e.target.value)} placeholder="Full name" style={s.input} required />
              </div>
              <div>
                <label style={s.label}>Your email (optional)</label>
                <input type="email" value={form.submitterEmail} onChange={e => set('submitterEmail', e.target.value)} placeholder="For follow-up" style={s.input} />
              </div>
            </div>

            <label style={s.label}>Request title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Short description of what you need" style={s.input} required />

            <label style={s.label}>Details</label>
            <textarea value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="Any additional context, files needed, steps, etc." rows={4} style={{ ...s.input, resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={s.label}>Category</label>
                <select value={form.project} onChange={e => set('project', e.target.value)} style={s.select}>
                  <option value="">Select category</option>
                  {PROJECTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} style={s.select}>
                  <option value="Low">Low — whenever possible</option>
                  <option value="Medium">Medium — soon</option>
                  <option value="High">High — urgent</option>
                </select>
              </div>
            </div>

            <label style={s.label}>Needed by (optional)</label>
            <input type="date" value={form.due} onChange={e => set('due', e.target.value)} style={{ ...s.input, marginBottom: '1.25rem' }} />

            {error && <p style={{ color: '#A32D2D', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button type="submit" disabled={submitting || !form.title.trim() || !form.submittedBy.trim()} style={{ ...s.btnPrimary, width: '100%', padding: '10px', fontSize: 14 }}>
              {submitting ? 'Submitting…' : 'Submit request →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: '1rem' }}>
          Halcyon MH Limited · Internal request system
        </p>
      </div>
    </div>
  );
}
