// src/lib/socketApi.js
import { useSocket } from '../context/SocketContext';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function http(method, path, body, isForm = false) {
  const opts = { method, headers: {} };
  if (body) {
    if (isForm) opts.body = body;
    else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text();
}

// Convert File → base64 (for socket upload)
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file); // includes data:<mime>;base64,
  });
}

// Hook returning API functions
export function useSocketApi() {
  const { socket, connected, call } = useSocket();

  // ------- Blacklist -------
  const blacklist = {
  list: async () => {
    if (connected) {
      try { return await call('blacklist:list'); } catch {}
    }
    return http('GET', '/api/list_blacklist'); // <-- FIXED
  },

    addViaSocket: async ({ name, notes, file }) => {
      const b64 = file ? await fileToBase64(file) : null;
      const res = await call('blacklist:add', { name, notes, imageBase64: b64, filename: file?.name });
      return res;
    },

    addViaHttp: async ({ name, notes, file }) => {
      const fd = new FormData();
      fd.append('name', name);
      if (notes) fd.append('notes', notes);
      if (file) fd.append('image', file);
      return http('POST', '/api/blacklist', fd, true);
    },

    remove: async (id) => {
      if (connected) {
        try { return await call('blacklist:delete', { id }); } catch {}
      }
      return http('DELETE', `/api/blacklist/${encodeURIComponent(id)}`);
    }
  };

  // ------- Backtracing -------
  const backtrace = {
    list: async () => {
      if (connected) {
        try { return await call('backtrace:request:list'); } catch {}
      }
      return http('GET', '/api/backtracing/requests');
    },

    approve: async (id) => {
      if (connected) {
        try { return await call('backtrace:request:approve', { id }); } catch {}
      }
      return http('POST', `/api/backtracing/requests/${id}/approve`);
    },

    reject: async (id) => {
      if (connected) {
        try { return await call('backtrace:request:reject', { id }); } catch {}
      }
      return http('POST', `/api/backtracing/requests/${id}/reject`);
    },

    notify: async (id) => {
      if (connected) {
        try { return await call('backtrace:request:notify', { id }); } catch {}
      }
      return http('POST', `/api/backtracing/requests/${id}/notify`);
    },
  };

  return { socket, connected, call, blacklist, backtrace };
}
