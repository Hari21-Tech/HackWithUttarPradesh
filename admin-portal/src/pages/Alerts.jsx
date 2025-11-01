import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function Alerts() {
  const { socket } = useSocket();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const onAlert = (payload) => setItems(prev => [payload, ...prev].slice(0, 50));
    socket.on('alert:new', onAlert);
    socket.emit('alert:list'); // optional: ask server to send backlog
    return () => socket.off('alert:new', onAlert);
  }, [socket]);

  const borderFor = (lvl) =>
    lvl === 'danger' ? 'border-danger'
    : lvl === 'warn' ? 'border-warn'
    : 'border-info';

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Live Alerts</h2>
        <span className="pill">LIVE</span>
      </div>

      <div className="grid gap-3 mt-3">
        {items.length === 0 && (
          <div className="help">No alerts yet. Waiting for socket events…</div>
        )}
        {items.map((a, i) => (
          <div key={a.id || a.ts || i} className={`card ${borderFor(a.level)}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {a.message || 'Alert'}
              </div>
              <div className="help">
                {new Date(a.ts || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
