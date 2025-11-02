// admin/pages/SafetyAlertsAdmin.jsx (or .tsx)
import React, { useEffect, useState } from 'react';
import { useSocketApi } from '../lib/SocketApi.js';

const demoAlert = {
  site: 'Mall A',
  zone: 'L2 Food Court',
  dangerCamera: 'Cam-12 East',
  safeCamera: 'Corridor B',
  safeExit: 'East Gate',
  instruction: 'Evacuate immediately following the green signage.',
};

export default function SafetyAlertsAdmin() {
  const { socket, safety } = useSocketApi();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [silencing, setSilencing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(demoAlert);
  const [includeDemoFlag, setIncludeDemoFlag] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await safety.listRecent(); // GET /api/safety/recent
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Failed to load recent alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onUpd = () => load();

    socket.on('safety:updated', onUpd);
    window.addEventListener('safety:updated', onUpd);
    const onStorage = (e) => { if (e.key === 'safety:updated') onUpd(); };
    window.addEventListener('storage', onStorage);

    return () => {
      socket.off('safety:updated', onUpd);
      window.removeEventListener('safety:updated', onUpd);
      window.removeEventListener('storage', onStorage);
    };
  }, [socket]);

  const broadcastChange = () => {
    try { socket?.emit?.('safety:updated'); } catch {}
    window.dispatchEvent(new Event('safety:updated'));
    try { localStorage.setItem('safety:updated', Date.now().toString()); } catch {}
  };

  const sendTest = async () => {
    setSending(true);
    setError(null);
    try {
      const payload = {
        type: 'FIRE_ALERT',
        ...form,
        ...(includeDemoFlag ? { demo: true } : {}),
      };
      await safety.startAlert(payload); // POST /api/safety/start
      broadcastChange();
      await load();
    } catch (e) {
      console.error(e);
      setError('Failed to send test alert');
    } finally {
      setSending(false);
    }
  };

  const silenceAll = async () => {
    setSilencing(true);
    setError(null);
    try {
      await safety.silenceAlert(); // POST /api/safety/silence  → backend broadcasts { type: 'FIRE_SILENCE' }
      broadcastChange();
      await load();
    } catch (e) {
      console.error(e);
      setError('Failed to silence announcements');
    } finally {
      setSilencing(false);
    }
  };

  const sendAllClear = async () => {
    setClearing(true);
    setError(null);
    try {
      await safety.stopAlert(); // POST /api/safety/clear → broadcasts { type: 'FIRE_CLEAR' }
      broadcastChange();
      await load();
    } catch (e) {
      console.error(e);
      setError('Failed to send all clear');
    } finally {
      setClearing(false);
    }
  };

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Safety Alerts</h2>
          <button className="button" onClick={load}>Refresh</button>
        </div>

        {/* Composer */}
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="input" placeholder="Site (e.g., Mall A)"
              value={form.site || ''} onChange={e => setField('site', e.target.value)} />
            <input className="input" placeholder="Zone (e.g., L2 Food Court)"
              value={form.zone || ''} onChange={e => setField('zone', e.target.value)} />
            <input className="input" placeholder="Danger camera (optional)"
              value={form.dangerCamera || ''} onChange={e => setField('dangerCamera', e.target.value)} />
            <input className="input" placeholder="Safe camera (optional)"
              value={form.safeCamera || ''} onChange={e => setField('safeCamera', e.target.value)} />
            <input className="input" placeholder="Safe exit (e.g., East Gate)"
              value={form.safeExit || ''} onChange={e => setField('safeExit', e.target.value)} />
            <input className="input" placeholder="Instruction"
              value={form.instruction || ''} onChange={e => setField('instruction', e.target.value)} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={includeDemoFlag}
              onChange={e => setIncludeDemoFlag(e.target.checked)}
            />
            <span className="help">Mark as <b>demo</b> (ignored by headless runner; only the demo page reacts)</span>
          </label>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="button primary" onClick={sendTest} disabled={sending}>
              {sending ? 'Sending…' : 'Send Test Alert'}
            </button>
            <button className="button" onClick={silenceAll} disabled={silencing}>
              {silencing ? 'Working…' : 'Silence Announcements'}
            </button>
            <button className="button" onClick={sendAllClear} disabled={clearing}>
              {clearing ? 'Working…' : 'Send All Clear'}
            </button>
            <button className="button" onClick={() => setForm(demoAlert)}>Fill Demo</button>
            <button className="button" onClick={() => setForm({})}>Clear</button>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          {loading ? (
            <div className="help">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="help">No recent alerts.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12 }}>
              {rows.map((r) => (
                <div key={r.id} className="card" style={{ padding: 10 }}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div style={{ fontWeight: 700 }}>{r.site || '—'}{r.zone ? ` — ${r.zone}` : ''}</div>
                    <div className="help">{new Date(r.ts || Date.now()).toLocaleString()}</div>
                    {r.safeExit && <div className="help">Exit: {r.safeExit}</div>}
                    {r.dangerCamera && <div className="help">Danger: {r.dangerCamera}</div>}
                    {r.safeCamera && <div className="help">Safe route: {r.safeCamera}</div>}
                    <div className="help">Status: <b>{r.status || 'sent'}</b></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
  