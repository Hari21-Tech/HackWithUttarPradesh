import React, { useEffect, useRef, useState } from 'react';
import { useSocketApi } from '../lib/SocketApi.js';

const demo = [{
  id: 'demo-x',
  name: 'Demo Person',
  notes: 'Example entry – real data will stream via socket.',
  imageUrl: 'https://i.pravatar.cc/240?img=15',
  ts: new Date().toISOString(),
}];

export default function Blacklist() {
  const { socket, blacklist } = useSocketApi();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await blacklist.list();
      setList(Array.isArray(data) && data.length ? data : demo);
    } catch (e) {
      setError('Failed to load blacklist');
      setList(demo);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // live refresh
  useEffect(() => {
    if (!socket) return;
    const onUpd = () => load();
    socket.on('blacklist:updated', onUpd);
    return () => socket.off('blacklist:updated', onUpd);
  }, [socket]);

  function onPick(f) {
    if (!f?.type?.startsWith('image/')) return setError('Only images allowed');
    setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function onUpload() {
    if (!file || !name.trim()) { setError('Name and image required'); return; }
    setError(null); setUploading(true);
    try {
      // try socket first
      try {
        await blacklist.addViaSocket({ name, notes, file });
      } catch {
        // fallback to HTTP multipart
        await blacklist.addViaHttp({ name, notes, file });
      }
      setFile(null); setPreview(null); setName(''); setNotes('');
      await load();
    } catch (e) {
      setError('Upload failed');
    } finally { setUploading(false); }
  }

  async function onDelete(id) {
    const ok = confirm('Remove this person from blacklist?');
    if (!ok) return;
    try {
      await blacklist.remove(id);
      setList(prev => prev.filter(x => x.id !== id));
    } catch { setError('Delete failed'); }
  }

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Blacklist</h2>
          <button className="button" onClick={load}>Refresh</button>
        </div>

        {/* Uploader */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 120, height: 96, borderRadius: 10, overflow: 'hidden', border: '1px dashed rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', background: '#0c121a' }}
               onClick={() => inputRef.current?.click()}>
            {preview ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="help">Select image</div>}
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onPick(e.target.files?.[0])} />
          <div style={{ display: 'grid', gap: 8 }}>
            <input className="input" placeholder="Name (required)" value={name} onChange={e => setName(e.target.value)} />
            <input className="input" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button primary" onClick={onUpload} disabled={uploading}>{uploading ? 'Uploading…' : 'Add'}</button>
            <button className="button" onClick={() => { setFile(null); setPreview(null); setName(''); setNotes(''); }}>Clear</button>
          </div>
        </div>

        {/* Grid */}
        <div className="card">
          {loading ? (
            <div className="help">Loading…</div>
          ) : list.length === 0 ? (
            <div className="help">No entries.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12 }}>
              {list.map(item => (
                <div key={item.id} className="card" style={{ padding: 8 }}>
                  <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                    <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div className="help">{new Date(item.ts || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <button className="button" onClick={() => onDelete(item.id)}>Remove</button>
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
