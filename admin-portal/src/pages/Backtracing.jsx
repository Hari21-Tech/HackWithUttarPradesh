import React, { useEffect, useMemo, useState } from 'react';
import { useSocketApi } from '../lib/SocketApi.js';

function Chip({ kind = 'pending', children }) {
  const map = {
    pending:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.35)' },
    approved:  { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.35)' },
    tracking:  { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.35)' },
    completed: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.35)' },
    rejected:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.35)' },
  };
  const c = map[kind] || map.pending;
  return <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{children}</span>;
}

export default function Backtracing() {
  const { socket, backtrace } = useSocketApi();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await backtrace.list();
      setList(Array.isArray(data) ? data : []);
      if (!selected && Array.isArray(data) && data.length) setSelected(data[0]);
    } catch (e) {
      setErr('Failed to load requests');
      setList([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (item) => setList(prev => [item, ...prev]);
    const onUpd = (item) => setList(prev => prev.map(x => x.id === item.id ? item : x));
    socket.on('backtrace:request:new', onNew);
    socket.on('backtrace:request:updated', onUpd);
    return () => {
      socket.off('backtrace:request:new', onNew);
      socket.off('backtrace:request:updated', onUpd);
    };
  }, [socket]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return list
      .filter(x => (tab === 'all' ? true : x.status === tab))
      .filter(x => !t || x.userName?.toLowerCase().includes(t) || x.itemName?.toLowerCase().includes(t) || x.itemColor?.toLowerCase().includes(t))
      .sort((a,b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [list, tab, q]);

  async function action(id, kind) {
    setBusy(true);
    try {
      let updated;
      if (kind === 'approve') updated = await backtrace.approve(id);
      if (kind === 'reject')  updated = await backtrace.reject(id);
      if (kind === 'notify')  updated = await backtrace.notify(id);
      if (updated?.id) {
        setList(cur => cur.map(x => x.id === updated.id ? updated : x));
        if (selected?.id === updated.id) setSelected(updated);
      }
    } catch (e) {
      setErr('Action failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Backtracing Requests</h2>
            <p className="help">Review & approve user requests. Live updates stream over sockets.</p>
          </div>
          <button className="button" onClick={load}>Reload</button>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <div className="tabs">
            {['pending','approved','tracking','completed','rejected','all'].map(s=>(
              <button key={s} className={`tab ${tab===s?'active':''}`} onClick={()=>setTab(s)}>{s[0].toUpperCase()+s.slice(1)}</button>
            ))}
          </div>
          <input className="input" placeholder="Search by user, item, color" value={q} onChange={e=>setQ(e.target.value)} style={{ marginLeft:'auto', width:320 }} />
        </div>

        <div className="bt-split">
          <div className="bt-left card" style={{ margin:0 }}>
            {loading ? <div className="help">Loading…</div> :
             filtered.length===0 ? <div className="help">No requests.</div> :
             <div className="bt-list">
               {filtered.map(item=>(
                 <button key={item.id} className={`bt-row ${selected?.id===item.id?'selected':''}`} onClick={()=>setSelected(item)}>
                   <div className="bt-thumb"><img src={item.userImageUrl} alt={item.userName} /></div>
                   <div className="bt-meta">
                     <div className="bt-title">
                       <strong>{item.userName}</strong><span className="sep">•</span>{item.itemName}
                       {item.itemColor && <span className="chip chip-color">{item.itemColor}</span>}
                     </div>
                     <div className="help">{new Date(item.createdAt||Date.now()).toLocaleString()}</div>
                   </div>
                   <div className="bt-status"><Chip kind={item.status}>{item.status}</Chip></div>
                 </button>
               ))}
             </div>}
          </div>

          <div className="bt-right card" style={{ margin:0 }}>
            {!selected ? <div className="help">Select a request</div> :
            <div className="bt-detail">
              <div className="bt-detail-head">
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div className="bt-thumb lg"><img src={selected.userImageUrl} alt={selected.userName} /></div>
                  <div>
                    <div className="bt-title" style={{ fontSize:16 }}>
                      <strong>{selected.userName}</strong> <span className="sep">•</span> {selected.itemName}
                      {selected.itemColor && <span className="chip chip-color">{selected.itemColor}</span>}
                    </div>
                    <div className="help">
                      Created: {new Date(selected.createdAt||Date.now()).toLocaleString()}
                      {selected.updatedAt && <> · Updated: {new Date(selected.updatedAt).toLocaleString()}</>}
                    </div>
                  </div>
                </div>
                <Chip kind={selected.status}>{selected.status}</Chip>
              </div>

              <div className="bt-actions">
                {selected.status==='pending' && (
                  <>
                    <button className="button primary" disabled={busy} onClick={()=>action(selected.id,'approve')}>Approve</button>
                    <button className="button" disabled={busy} onClick={()=>action(selected.id,'reject')}>Reject</button>
                  </>
                )}
                {selected.status==='approved' && <div className="help">Tracking will begin…</div>}
                {selected.status==='tracking' && <div className="help">Tracking in progress…</div>}
                {selected.status==='completed' && (
                  <>
                    {selected.resultUrl && <a className="button" href={selected.resultUrl} target="_blank" rel="noreferrer">View Result</a>}
                    <button className="button primary" disabled={busy} onClick={()=>action(selected.id,'notify')}>Send to User</button>
                  </>
                )}
                {selected.status==='rejected' && <div className="help">Request rejected.</div>}
              </div>
              {err && <div style={{ color:'var(--danger)' }}>{err}</div>}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
