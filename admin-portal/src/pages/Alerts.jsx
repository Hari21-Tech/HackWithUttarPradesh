import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSocketApi } from '../lib/SocketApi.js';

/**
 * alerts.jsx — Blacklist Alerts (designed to match your Blacklist UI)
 * - Listens to Flask-SocketIO event: "blacklist_alert" { person_id, camera, timestamp }
 * - Looks up name & image via /api/list_blacklist (through useSocketApi().blacklist.list)
 * - Simple, clean cards using your existing utility classes: card, button, input, help
 */
export default function Alerts() {
  const { socket, connected, blacklist } = useSocketApi();

  const [alerts, setAlerts] = useState([]); // {id, person_id, camera, timestamp, name, image_url, unread}
  const [peopleMap, setPeopleMap] = useState({}); // pid -> { name, image_url }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [query, setQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [cameraFilter, setCameraFilter] = useState('all');
  const [playSound, setPlaySound] = useState(true);
  const [paused, setPaused] = useState(false);

  const audioRef = useRef(null);
  const nextLocalId = useRef(1);

  // One-time tiny beep for new alerts
  useEffect(() => {
    audioRef.current = new Audio(beepDataUrl);
  }, []);

  // Load blacklist directory to resolve names & images
  async function loadPeople() {
    setLoading(true);
    setError(null);
    try {
      const list = await blacklist.list();
      const map = {};
      (Array.isArray(list) ? list : []).forEach((r) => {
        map[r.id] = { name: r.name || `Person ${r.id}`, image_url: r.image_url || r.imageUrl };
      });
      setPeopleMap(map);
    } catch (e) {
      setError('Failed to load blacklist directory');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeople();
  }, []);

  // Live alerts from socket: event name from your backend is "blacklist_alert"
  useEffect(() => {
    if (!socket) return;

    const onAlert = (data) => {
      if (paused) return;
      const { person_id, camera, timestamp } = data || {};
      const p = peopleMap[person_id] || {};
      const id = `a_${Date.now()}_${nextLocalId.current++}`;
      const alert = {
        id,
        person_id,
        camera: camera ?? 'Unknown Camera',
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        name: p.name || `ID: ${person_id}`,
        image_url: p.image_url || null,
        unread: true,
        raw: data,
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 500));
      if (playSound && audioRef.current) {
        try {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        } catch {}
      }
    };

    socket.on('blacklist_alert', onAlert);
    return () => socket.off('blacklist_alert', onAlert);
  }, [socket, paused, playSound, peopleMap]);

  // Derive camera options and filtered list
  const cameras = useMemo(() => {
    const s = new Set(alerts.map((a) => a.camera).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [alerts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter((a) => {
      if (onlyUnread && !a.unread) return false;
      if (cameraFilter !== 'all' && a.camera !== cameraFilter) return false;
      if (q) {
        const hay = `${a.name || ''} ${a.camera || ''} ${a.person_id || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [alerts, onlyUnread, cameraFilter, query]);

  // Actions
  const acknowledge = (id) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, unread: false } : a)));
  const dismiss = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));
  const markAllRead = () => setAlerts((prev) => prev.map((a) => ({ ...a, unread: false })));
  const clearAll = () => setAlerts([]);

  const exportCsv = () => {
    const rows = [['id', 'person_id', 'name', 'camera', 'timestamp']];
    filtered.forEach((a) => rows.push([a.id, a.person_id, a.name || '', a.camera || '', new Date(a.timestamp).toISOString()]));
    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Blacklist Alerts</h2>
          <StatusPill connected={connected} paused={paused} count={alerts.length} />
        </div>
        <div className="flex items-center gap-2">
          <input className="input" placeholder="Search name / camera / id" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 220 }} />
          <label className="help" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} /> Unread only
          </label>
          <select className="input" value={cameraFilter} onChange={(e) => setCameraFilter(e.target.value)}>
            {cameras.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All cameras' : c}
              </option>
            ))}
          </select>
          <button className="button" onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
          <button className="button" onClick={() => setPlaySound((s) => !s)}>{playSound ? '🔊' : '🔇'}</button>
          <button className="button" onClick={markAllRead}>Mark all read</button>
          <button className="button" onClick={exportCsv}>Export CSV</button>
          <button className="button" onClick={clearAll}>Clear</button>
        </div>
      </div>

      {/* Content */}
      <div className="card">
        {loading ? (
          <div className="help">Loading directory…</div>
        ) : filtered.length === 0 ? (
          <div className="help">No alerts yet… Move in front of a camera with a blacklisted face to test.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {filtered.map((a) => (
              <div key={a.id} className="card" style={{ padding: 8 }}>
                <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000', position: 'relative' }}>
                  {a.image_url ? (
                    <img src={a.image_url} alt={a.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                  ) : (
                    <div className="help" style={{ height: 140, display: 'grid', placeItems: 'center' }}>No image</div>
                  )}
                  {/* badge */}
                  <span style={{ position: 'absolute', top: 8, left: 8 }} className="help">📛 Blacklist</span>
                  {a.unread && <span title="Unread" style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 9999, background: '#3b82f6' }} />}
                </div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{a.name}</span>
                    </div>
                    <div className="help">📷 {a.camera} • {timeAgo(a.timestamp)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="button" onClick={() => acknowledge(a.id)}>Ack</button>
                    <button className="button" onClick={() => dismiss(a.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
}

function StatusPill({ connected, paused, count }) {
  return (
    <div className="help" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} title={connected ? 'Socket connected' : 'Socket disconnected'}>
      <span style={{ width: 8, height: 8, borderRadius: 9999, background: connected ? '#22c55e' : '#9ca3af' }} />
      {connected ? 'Live' : 'Offline'} • <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      {paused && <span className="help" style={{ marginLeft: 6 }}>(Paused)</span>}
    </div>
  );
}

// ---------- utils ----------
function timeAgo(ts) {
  const now = Date.now();
  const d = new Date(ts).getTime();
  const diff = Math.max(0, now - d);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleString();
}

function csvEscape(cell) {
  const s = String(cell ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const beepDataUrl = 'data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAgAAACaW1wbwAAAAAAAACAgICAf39/AAAAPz8/PwAAAEFBQUEAAABoaGhoaAAAgICAgIAAAJCQkJCAAADHx8fHwAAgICAgIAAABERERERAAB/f39/fwA=';
