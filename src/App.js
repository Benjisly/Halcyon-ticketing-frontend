import React, { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET || '';

export default function App() {
  const path = window.location.pathname;
  const isSubmit = path === '/submit';
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('hmh_authed') === '1');
  if (isSubmit) return <SubmitForm />;
  if (!authed) return <Login onLogin={() => { sessionStorage.setItem('hmh_authed', '1'); setAuthed(true); }} />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem('hmh_authed'); setAuthed(false); }} />;
}

function Login({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f3',fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',border:'0.5px solid #e5e5e3',borderRadius:12,padding:'2rem',width:340}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1.5rem'}}>
          <div style={{width:36,height:36,background:'#CC1818',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontWeight:700,fontSize:17}}>H</span>
          </div>
          <div>
            <div style={{fontWeight:600,fontSize:15}}>Halcyon MH</div>
            <div style={{fontSize:12,color:'#999'}}>Ticketing system</div>
          </div>
        </div>
        <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Admin password</label>
        <input
          type="password" value={pw}
          onChange={e => { setPw(e.target.value); setErr(''); }}
          placeholder="Enter password"
          style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'0.5px solid #d5d5d3',fontSize:13,marginBottom:err?6:16,display:'block',boxSizing:'border-box'}}
          autoFocus
        />
        {err && <p style={{color:'#A32D2D',fontSize:13,margin:'0 0 12px'}}>{err}</p>}
        <button
          onClick={() => pw === ADMIN_SECRET ? onLogin() : setErr('Incorrect password.')}
          style={{width:'100%',background:'#CC1818',color:'#fff',border:'none',borderRadius:8,padding:'9px',fontSize:13,fontWeight:600,cursor:'pointer'}}
        >Sign in</button>
        <p style={{textAlign:'center',fontSize:12,color:'#aaa',marginTop:'1rem'}}>
          Colleague? <a href="/submit" style={{color:'#CC1818',textDecoration:'none'}}>Submit a request</a>
        </p>
      </div>
    </div>
  );
}

const H = { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET };
const PRI = { High:{bg:'#FCEBEB',c:'#791F1F'}, Medium:{bg:'#FAEEDA',c:'#633806'}, Low:{bg:'#EAF3DE',c:'#27500A'} };
const ST = { 'To Do':{bg:'#E6F1FB',c:'#0C447C'}, 'In Progress':{bg:'#FAEEDA',c:'#633806'}, Done:{bg:'#EAF3DE',c:'#27500A'} };
const inp = {display:'block',width:'100%',fontSize:13,padding:'8px 10px',borderRadius:8,border:'0.5px solid #d5d5d3',marginBottom:12,fontFamily:'sans-serif',boxSizing:'border-box'};

function Badge({ label, bg, c }) {
  return <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,background:bg,color:c}}>{label}</span>;
}

function Dashboard({ onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fP, setFP] = useState('');
  const [fPri, setFPri] = useState('');
  const [fSt, setFSt] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(API + '/api/tickets', { headers: H });
      setTickets(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const projs = [...new Set(tickets.map(t => t.project).filter(Boolean))];
  const filtered = tickets.filter(t => {
    if (search && !(t.title + ' ' + (t.desc||'') + ' ' + (t.project||'') + ' ' + (t.submittedBy||'')).toLowerCase().includes(search.toLowerCase())) return false;
    if (fP && t.project !== fP) return false;
    if (fPri && t.priority !== fPri) return false;
    if (fSt && t.status !== fSt) return false;
    return true;
  }).sort((a, b) => {
    const so = { 'To Do':0, 'In Progress':1, Done:2 };
    const po = { High:0, Medium:1, Low:2 };
    return (so[a.status] - so[b.status]) || (po[a.priority] - po[b.priority]);
  });

  async function saveTicket() {
    if (!form.title || !form.title.trim()) return;
    setSaving(true);
    try {
      if (modal === 'new') {
        await fetch(API + '/api/tickets/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.assign({}, form, {submittedBy:'Benjamin (Admin)'})) });
      } else {
        await fetch(API + '/api/tickets/' + modal.id, { method:'PATCH', headers:H, body:JSON.stringify(form) });
      }
      await load();
      setModal(null);
    } catch (e) { alert('Save failed.'); }
    finally { setSaving(false); }
  }

  async function deleteTicket() {
    if (!modal || modal === 'new') return;
    if (!window.confirm('Delete this ticket?')) return;
    await fetch(API + '/api/tickets/' + modal.id, { method:'DELETE', headers:H });
    await load();
    setModal(null);
  }

  function openNew() {
    setForm({ title:'', desc:'', project:'', priority:'Medium', status:'To Do', due:'' });
    setModal('new');
  }

  return (
    <div style={{maxWidth:860,margin:'0 auto',padding:'1.25rem 1rem',fontFamily:'sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:'#CC1818',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontWeight:700,fontSize:15}}>H</span>
          </div>
          <div>
            <div style={{fontWeight:600,fontSize:15}}>Halcyon MH Tickets</div>
            <div style={{fontSize:11,color:'#999'}}>Admin dashboard</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/submit'); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{fontSize:12,padding:'6px 12px',borderRadius:8,border:'0.5px solid #d5d5d3',background:'#fff',cursor:'pointer'}}>
            {copied ? '✓ Copied!' : '🔗 Share link'}
          </button>
          <button onClick={openNew}
            style={{fontSize:13,padding:'6px 14px',borderRadius:8,border:'none',background:'#CC1818',color:'#fff',fontWeight:600,cursor:'pointer'}}>
            + New ticket
          </button>
          <button onClick={onLogout}
            style={{fontSize:12,padding:'6px 12px',borderRadius:8,border:'0.5px solid #d5d5d3',background:'#fff',cursor:'pointer'}}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:'1rem'}}>
        {[['Total',tickets.length,'#111'],['To do',tickets.filter(t=>t.status==='To Do').length,'#0C447C'],['In progress',tickets.filter(t=>t.status==='In Progress').length,'#633806'],['Done',tickets.filter(t=>t.status==='Done').length,'#27500A']].map(function(item) {
          return (
            <div key={item[0]} style={{background:'#f5f5f3',borderRadius:10,padding:'0.75rem 1rem'}}>
              <div style={{fontSize:11,color:'#888',marginBottom:4}}>{item[0]}</div>
              <div style={{fontSize:22,fontWeight:600,color:item[2]}}>{item[1]}</div>
            </div>
          );
        })}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={Object.assign({}, inp, {flex:1,minWidth:140,marginBottom:0})} />
        <select value={fP} onChange={e=>setFP(e.target.value)} style={Object.assign({}, inp, {marginBottom:0})}>
          <option value="">All projects</option>
          {projs.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={fPri} onChange={e=>setFPri(e.target.value)} style={Object.assign({}, inp, {marginBottom:0})}>
          <option value="">All priorities</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select value={fSt} onChange={e=>setFSt(e.target.value)} style={Object.assign({}, inp, {marginBottom:0})}>
          <option value="">All statuses</option>
          <option>To Do</option><option>In Progress</option><option>Done</option>
        </select>
        <button onClick={load} style={{padding:'6px 10px',borderRadius:8,border:'0.5px solid #d5d5d3',background:'#fff',cursor:'pointer'}}>↻</button>
      </div>

      {loading && <p style={{color:'#888',textAlign:'center',padding:'2rem'}}>Loading...</p>}
      {!loading && filtered.length === 0 && <div style={{textAlign:'center',padding:'3rem',color:'#aaa'}}>No tickets found</div>}

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.map(t => {
          var over = t.due && t.status !== 'Done' && new Date(t.due) < new Date(new Date().toDateString());
          var stStyle = ST[t.status] || ST['To Do'];
          var priStyle = PRI[t.priority] || PRI.Medium;
          return (
            <div key={t.id} onClick={() => { setForm(Object.assign({}, t)); setModal(t); }}
              style={{background:'#fff',border:'0.5px solid #e5e5e3',borderRadius:12,padding:'0.875rem 1rem',cursor:'pointer'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:6}}>
                <span style={{fontSize:11,color:'#aaa',fontFamily:'monospace',minWidth:56,paddingTop:2}}>{t.id}</span>
                <span style={{fontSize:14,fontWeight:600,flex:1,lineHeight:1.4}}>{t.title}</span>
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',paddingLeft:64,alignItems:'center'}}>
                <Badge label={t.status} bg={stStyle.bg} c={stStyle.c} />
                <Badge label={t.priority} bg={priStyle.bg} c={priStyle.c} />
                {t.project && <Badge label={t.project} bg="#EEEDFE" c="#3C3489" />}
                {t.submittedBy && <span style={{fontSize:11,color:'#999'}}>by {t.submittedBy}</span>}
                {t.due && <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:over?'#FCEBEB':'#f0f0ee',color:over?'#791F1F':'#666'}}>Due: {t.due}{over?' (overdue)':''}</span>}
              </div>
              {t.desc && <div style={{fontSize:12,color:'#777',marginTop:6,paddingLeft:64,lineHeight:1.5}}>{t.desc.substring(0,130)}{t.desc.length>130?'...':''}</div>}
            </div>
          );
        })}
      </div>

      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #e5e5e3',padding:'1.25rem',width:'min(540px,94vw)',maxHeight:'88vh',overflowY:'auto'}}>
            <h3 style={{fontSize:16,fontWeight:600,margin:'0 0 1rem'}}>{modal === 'new' ? 'New ticket' : 'Edit ' + modal.id}</h3>
            <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Title</label>
            <input value={form.title||''} onChange={e=>setForm(f=>Object.assign({},f,{title:e.target.value}))} placeholder="What needs to be done?" style={inp} />
            <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Description</label>
            <textarea value={form.desc||''} onChange={e=>setForm(f=>Object.assign({},f,{desc:e.target.value}))} rows={3} style={Object.assign({},inp,{resize:'vertical'})} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Project</label>
                <input value={form.project||''} onChange={e=>setForm(f=>Object.assign({},f,{project:e.target.value}))} style={inp} />
              </div>
              <div>
                <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Priority</label>
                <select value={form.priority||'Medium'} onChange={e=>setForm(f=>Object.assign({},f,{priority:e.target.value}))} style={inp}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Status</label>
                <select value={form.status||'To Do'} onChange={e=>setForm(f=>Object.assign({},f,{status:e.target.value}))} style={inp}>
                  <option>To Do</option><option>In Progress</option><option>Done</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Due date</label>
                <input type="date" value={form.due||''} onChange={e=>setForm(f=>Object.assign({},f,{due:e.target.value}))} style={inp} />
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1rem',paddingTop:'0.75rem',borderTop:'0.5px solid #e5e5e3'}}>

              <button onClick={() => setModal(null)} style={{fontSize:13,padding:'7px 14px',borderRadius:8,border:'0.5px solid #d5d5d3',background:'#fff',cursor:'pointer'}}>Cancel</button>
              <button onClick={saveTicket} disabled={saving} style={{fontSize:13,padding:'7px 14px',borderRadius:8,border:'none',background:'#CC1818',color:'#fff',fontWeight:600,cursor:'pointer'}}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitForm() {
  var emptyForm = { title:'', desc:'', project:'', priority:'Medium', due:'', submittedBy:'', submitterEmail:'' };
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');
  var PROJECTS = ['Halcyon MH — General','IT / Systems','Admin / HR','Stores','Showroom','Workshop','Other'];

  function set(k, v) { setForm(function(f) { return Object.assign({}, f, { [k]: v }); }); }

  async function submit() {
    if (!form.title.trim() || !form.submittedBy.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      var r = await fetch(API + '/api/tickets/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      if (!r.ok) throw new Error('Failed');
      var d = await r.json();
      setTicketId(d.ticket ? d.ticket.id : '');
      setDone(true);
    } catch (e) {
      setError('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f3',padding:'1rem',fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',border:'0.5px solid #e5e5e3',borderRadius:12,padding:'2rem',width:'min(480px,100%)',textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>✅</div>
        <h2 style={{fontSize:20,fontWeight:600,margin:'0 0 8px'}}>Request submitted!</h2>
        {ticketId && <p style={{fontSize:13,color:'#888',margin:'0 0 4px'}}>Ticket ID: <strong>{ticketId}</strong></p>}
        <p style={{fontSize:14,color:'#555',margin:'0 0 1.5rem',lineHeight:1.6}}>Benjamin has been notified and will get back to you.</p>
        <button onClick={() => { setDone(false); setForm(emptyForm); }}
          style={{fontSize:13,padding:'7px 14px',borderRadius:8,border:'0.5px solid #d5d5d3',background:'#fff',cursor:'pointer'}}>
          Submit another
        </button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f3',padding:'1.5rem 1rem',fontFamily:'sans-serif'}}>
      <div style={{maxWidth:520,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1.5rem'}}>
          <div style={{width:36,height:36,background:'#CC1818',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontWeight:700,fontSize:17}}>H</span>
          </div>
          <div>
            <div style={{fontWeight:600,fontSize:15}}>Halcyon MH</div>
            <div style={{fontSize:12,color:'#888'}}>Submit a task request to Benjamin</div>
          </div>
        </div>
        <div style={{background:'#fff',border:'0.5px solid #e5e5e3',borderRadius:12,padding:'1.25rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Your name *</label>
              <input value={form.submittedBy} onChange={e=>set('submittedBy',e.target.value)} placeholder="Full name" style={inp} />
            </div>
            <div>
              <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Your email (optional)</label>
              <input type="email" value={form.submitterEmail} onChange={e=>set('submitterEmail',e.target.value)} placeholder="For follow-up" style={inp} />
            </div>
          </div>
          <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Request title *</label>
          <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Short description of what you need" style={inp} />
          <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Details</label>
          <textarea value={form.desc} onChange={e=>set('desc',e.target.value)} placeholder="Any additional context..." rows={4} style={Object.assign({},inp,{resize:'vertical'})} />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Category</label>
              <select value={form.project} onChange={e=>set('project',e.target.value)} style={inp}>
                <option value="">Select category</option>
                {PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Priority</label>
              <select value={form.priority} onChange={e=>set('priority',e.target.value)} style={inp}>
                <option value="Low">Low - whenever possible</option>
                <option value="Medium">Medium - soon</option>
                <option value="High">High - urgent</option>
              </select>
            </div>
          </div>
          <label style={{fontSize:12,color:'#666',display:'block',marginBottom:4}}>Needed by (optional)</label>
          <input type="date" value={form.due} onChange={e=>set('due',e.target.value)} style={Object.assign({},inp,{marginBottom:'1.25rem'})} />
          {error && <p style={{color:'#A32D2D',fontSize:13,marginBottom:12}}>{error}</p>}
          <button onClick={submit} disabled={submitting || !form.title.trim() || !form.submittedBy.trim()}
            style={{width:'100%',background:'#CC1818',color:'#fff',border:'none',borderRadius:8,padding:'10px',fontSize:14,fontWeight:600,cursor:'pointer'}}>
            {submitting ? 'Submitting...' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  );
}
