import React, { useState, useEffect, useCallback } from 'react';
import { API, ADMIN_SECRET } from './App';
import s from './styles';

const HEADERS = { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET };
const PRI_COLORS = { High: { bg: '#FCEBEB', text: '#791F1F' }, Medium: { bg: '#FAEEDA', text: '#633806' }, Low: { bg: '#EAF3DE', text: '#27500A' } };
const ST_COLORS = { 'To Do': { bg: '#E6F1FB', text: '#0C447C' }, 'In Progress': { bg: '#FAEEDA', text: '#633806' }, 'Done': { bg: '#EAF3DE', text: '#27500A' } };

function badge(label, colors) {
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: colors.bg, color: colors.text }}>{label}</span>;
}

function isOverdue(due, status) {
  if (!due || status === 'Done') return false;
  return new Date(due) < new Date(new Date().toDateString());
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function AdminDashboard({ onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fProj, setFProj] = useState('');
  const [fPri, setFPri] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | ticket object
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/tickets`, { headers: HEADERS });
      if (!r.ok) throw new Error('Failed to load');
      setTickets(await r.json());
    } catch (e) { setError('Could not connect to server.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const projects = [...new Set(tickets.map(t => t.project).filter(Boolean))];

  const filtered = tickets
    .filter(t => {
      if (search && !(`${t.title} ${t.desc} ${t.project} ${t.submittedBy}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (fProj && t.project !== fProj) return false;
      if (fPri && t.priority !== fPri) return false;
      if (fStatus && t.status !== fStatus) return false;
      return true;
    })
    .sort((a, b) => {
      const so = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
      const po = { High: 0, Medium: 1, Low: 2 };
      return (so[a.status] - so[b.status]) || (po[a.priority] - po[b.priority]);
    });

  function openNew() {
    setForm({ title: '', desc: '', project: '', priority: 'Medium', status: 'To Do', due: '' });
    setModal('new');
  }
  function openEdit(t) {
    setForm({ ...t });
    setModal(t);
  }
  function closeModal() { setModal(null); }

  async function saveTicket() {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      if (modal === 'new') {
        await fetch(`${API}/api/tickets/submit`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, submittedBy: 'Benjamin (Admin)' }),
        });
      } else {
        await fetch(`${API}/api/tickets/${modal.id}`, {
          method: 'PATCH', headers: HEADERS,
          body: JSON.stringify(form),
        });
      }
      await fetchTickets();
      closeModal();
    } catch { alert('Save failed. Check connection.'); }
    finally { setSaving(false); }
  }

  async function deleteTicket() {
    if (!modal || modal === 'new') return;
    if (!window.confirm('Delete this ticket?')) return;
    await fetch(`${API}/api/tickets/${modal.id}`, { method: 'DELETE', headers: HEADERS });
    await fetchTickets();
    closeModal();
  }

  function copySubmitLink() {
    const url = `${window.location.origin}/submit`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const total = tickets.length;
  const todo = tickets.filter(t => t.status === 'To Do').length;
  const prog = tickets.filter(t => t.status === 'In Progress').length;
  const done = tickets.filter(t => t.status === 'Done').length;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.25rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#CC1818', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>H</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>Halcyon MH — Tickets</div>
            <div style={{ fontSize: 11, color: '#999' }}>Admin dashboard</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copySubmitLink} style={{ ...s.btnSecondary, fontSize: 12 }}>
            {copied ? '✓ Copied!' : '🔗 Share submit link'}
          </button>
          <button onClick={openNew} style={{ ...s.btnPrimary, fontSize: 13, padding: '6px 14px' }}>+ New ticket</button>
          <button onClick={onLogout} style={{ ...s.btnSecondary, fontSize: 12 }}>Sign out</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: '1rem' }}>
        {[['Total', total, '#111'], ['To do', todo, '#0C447C'], ['In progress', prog, '#633806'], ['Done', done, '#27500A']].map(([label, val, color]) => (
          <div key={label} style={{ background: '#fff', border: '0.5px solid #e5e5e3', borderRadius: 10, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…" style={{ ...s.input, flex: 1, minWidth: 140, margin: 0 }} />
        <select value={fProj} onChange={e => setFProj(e.target.value)} style={s.select}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={fPri} onChange={e => setFPri(e.target.value)} style={s.select}>
          <option value="">All priorities</option>
          {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={s.select}>
          <option value="">All statuses</option>
          {['To Do','In Progress','Done'].map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={fetchTickets} style={s.btnSecondary} title="Refresh">↻</button>
      </div>

      {/* Ticket list */}
      {loading && <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>Loading…</p>}
      {error && <p style={{ color: '#A32D2D', textAlign: 'center', padding: '2rem' }}>{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 14 }}>No tickets found</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(t => {
          const over = isOverdue(t.due, t.status);
          return (
            <div key={t.id} onClick={() => openEdit(t)} style={{ ...s.card, cursor: 'pointer', padding: '0.875rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace', minWidth: 56, paddingTop: 2 }}>{t.id}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111', flex: 1, lineHeight: 1.4 }}>{t.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 64, alignItems: 'center' }}>
                {badge(t.status, ST_COLORS[t.status] || ST_COLORS['To Do'])}
                {badge(t.priority, PRI_COLORS[t.priority] || PRI_COLORS['Medium'])}
                {t.project && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EEEDFE', color: '#3C3489', fontWeight: 600 }}>{t.project}</span>}
                {t.submittedBy && <span style={{ fontSize: 11, color: '#999' }}>by {t.submittedBy}</span>}
                {t.due && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: over ? '#FCEBEB' : '#f0f0ee', color: over ? '#791F1F' : '#666', fontWeight: over ? 600 : 400 }}>
                    📅 {fmtDate(t.due)}{over ? ' · overdue' : ''}
                  </span>
                )}
              </div>
              {t.desc && <div style={{ fontSize: 12, color: '#777', marginTop: 6, paddingLeft: 64, lineHeight: 1.5 }}>{t.desc.substring(0, 130)}{t.desc.length > 130 ? '…' : ''}</div>}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...s.card, width: 'min(540px,94vw)', maxHeight: '88vh', overflowY: 'auto', padding: '1.25rem' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 1rem', color: '#111' }}>
              {modal === 'new' ? 'New ticket' : `Edit · ${modal.id}`}
            </h3>
            <label style={s.label}>Title *</label>
            <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" style={s.input} />
            <label style={s.label}>Description</label>
            <textarea value={form.desc || ''} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="More details…" rows={3} style={{ ...s.input, resize: 'vertical' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={s.label}>Project / Context</label>
                <input value={form.project || ''} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="e.g. Halcyon, Velor Wear" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Priority</label>
                <select value={form.priority || 'Medium'} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={s.select}>
                  {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Status</label>
                <select value={form.status || 'To Do'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={s.select}>
                  {['To Do','In Progress','Done'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Due date</label>
                <input type="date" value={form.due || ''} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} style={s.input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '0.5px solid #e5e5e3' }}>
              {modal !== 'new' && (
                <button onClick={deleteTicket} style={{ ...s.btnSecondary, color: '#A32D2D', borderColor: '#F09595' }}>Delete</button>
              )}
              <button onClick={closeModal} style={s.btnSecondary}>Cancel</button>
              <button onClick={saveTicket} disabled={saving} style={s.btnPrimary}>{saving ? 'Saving…' : 'Save ticket'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
