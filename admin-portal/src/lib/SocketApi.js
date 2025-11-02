// src/lib/socketApi.js
import { useSocket } from '../context/SocketContext';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function http(method, path, body, isForm = false) {
  const opts = { method, headers: {} };
  if (body) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text();
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function normalize(r) {
  if (!r) return r;
  return {
    id: r.id,
    status: mapStatus(r.status),
    userName: r.person_id || r.userName || 'User',
    itemName: r.object_name || r.itemName || 'Object',
    itemColor: r.itemColor || '',
    userImageUrl: r.image_path ? withBase(r.image_path) : r.userImageUrl || '',
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || null,
    resultUrl: r.result?.url || null,
    result: r.result || null,
  };
}
function mapStatus(s) {
  if (!s) return 'pending';
  if (s === 'pending') return 'pending';
  if (s === 'approved') return 'tracking'; // show tracking while model runs
  if (s === 'failed') return 'rejected';
  if (s === 'rejected') return 'rejected';
  if (s === 'completed') return 'completed';
  return s;
}
function withBase(p) {
  if (!p) return p;
  if (p.startsWith('http')) return p;
  return `${API_BASE}${p}`;
}

export function useSocketApi() {
  const { socket, connected } = useSocket();

  // Bridge backend events -> UI events Backtracing.jsx already listens for
  if (socket) {
    const onNew = (item) => socket.emit('backtrace:request:new', normalize(item));
    const onResult = ({ req_id, result }) =>
      socket.emit('backtrace:request:updated', {
        id: req_id,
        status: 'completed',
        result,
        updatedAt: new Date().toISOString(),
      });
    const onRejected = ({ req_id }) =>
      socket.emit('backtrace:request:updated', {
        id: req_id,
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });

    socket.off('new_backtrack_request', onNew);
    socket.off('backtrack_result_ready', onResult);
    socket.off('backtrack_rejected', onRejected);
    socket.on('new_backtrack_request', onNew);
    socket.on('backtrack_result_ready', onResult);
    socket.on('backtrack_rejected', onRejected);
  }

  // ------- Blacklist -------
  const blacklist = {
    list: async () => http('GET', '/api/list_blacklist'),
    addViaSocket: async ({ name, notes, file }) => {
      const b64 = file ? await fileToBase64(file) : null;
      // implement a server socket handler if you need this later
      return { name, notes, imageBase64: b64, filename: file?.name };
    },
    addViaHttp: async ({ name, notes, file }) => {
      const fd = new FormData();
      fd.append('name', name);
      if (notes) fd.append('notes', notes);
      if (file) fd.append('image', file);
      return http('POST', '/api/blacklist', fd, true);
    },
    remove: async () => {
      throw new Error('DELETE /api/blacklist/:id not implemented on server');
    },
  };

  // ------- Backtracing -------
  const backtrace = {
    list: async () => {
      const arr = await http('GET', '/api/admin/requests');
      return Array.isArray(arr) ? arr.map(normalize) : [];
    },
    approve: async (id) => {
      const res = await http('POST', `/api/admin/requests/${encodeURIComponent(id)}/approve`);
      return {
        ...(res?.request ? normalize(res.request) : { id }),
        id,
        status: 'tracking',
        updatedAt: new Date().toISOString(),
      };
    },
    reject: async (id) => {
      await http('POST', `/api/admin/requests/${encodeURIComponent(id)}/reject`);
      return { id, status: 'rejected', updatedAt: new Date().toISOString() };
    },
    notify: async (id) => {
      // no server endpoint yet; keep UI responsive
      return { id, status: 'completed', updatedAt: new Date().toISOString() };
    },
  };

  return { socket, connected, blacklist, backtrace };
}
