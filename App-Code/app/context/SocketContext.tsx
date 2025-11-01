// app/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

type SocketContextType = { socket: Socket | null; connected: boolean };
const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });
export const useSocket = () => useContext(SocketContext);

type Props = { children: React.ReactNode; origin?: string };

export const SocketProvider: React.FC<Props> = ({ children, origin }) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const wsOrigin =
    origin ??
    (process.env.EXPO_PUBLIC_WS_ORIGIN as string | undefined) ??
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_WS_ORIGIN as string | undefined) ??
    '';

  useEffect(() => {
    if (!wsOrigin) {
      console.warn('[SocketProvider] No WS origin set. Configure EXPO_PUBLIC_WS_ORIGIN.');
      setConnected(false);
      return;
    }

    const s = io(wsOrigin, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
    }) as Socket;

    socketRef.current = s;

    const onConnect = () => {
      setConnected(true);
      console.log('[Socket] connected', s.id);
    };
    const onDisconnect = (reason?: any) => {
      setConnected(false);
      console.log('[Socket] disconnected', reason);
    };
    const onConnectError = (err: any) => {
      console.warn('[Socket] connect_error', err?.message ?? err);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    // s.onAny((event, ...args) => console.debug('[Socket] event', event, args));

    return () => {
      try {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
        s.off('connect_error', onConnectError);
        s.disconnect();
      } finally {
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [wsOrigin]);

  return <SocketContext.Provider value={{ socket: socketRef.current, connected }}>{children}</SocketContext.Provider>;
};
