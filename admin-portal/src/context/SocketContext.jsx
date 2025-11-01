import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, connected: false, call: async () => {} });
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { isAuthed, email } = useAuth();
  const [connected, setConnected] = useState(false);

  const socket = useMemo(() => {
    const s = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { email },
    });
    return s;
  }, [email]);

  useEffect(() => {
    if (isAuthed) socket.connect();
    else socket.disconnect();
    return () => socket.disconnect();
  }, [isAuthed, socket]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  // Ack-based RPC with timeout
  const call = (event, payload = {}, { timeout = 8000 } = {}) =>
    new Promise((resolve, reject) => {
      let timer = setTimeout(() => {
        timer = null;
        reject(new Error(`Socket call timeout for '${event}'`));
      }, timeout);

      try {
        socket.timeout(timeout).emit(event, payload, (err, res) => {
          if (!timer) return;
          clearTimeout(timer);
          if (err) reject(err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Socket error'));
          else resolve(res);
        });
      } catch (e) {
        if (timer) clearTimeout(timer);
        reject(e);
      }
    });

  return (
    <SocketContext.Provider value={{ socket, connected, call }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
