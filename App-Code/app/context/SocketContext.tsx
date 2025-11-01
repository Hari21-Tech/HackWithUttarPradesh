// app/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';


type SocketContextType = {
    socket: Socket | null;
    connected: boolean;
};

const defaultContext: SocketContextType = {
    socket: null,
    connected: false,
};

const SocketContext = createContext<SocketContextType>(defaultContext);

export const useSocket = (): SocketContextType => useContext(SocketContext);

type Props = {
    children: React.ReactNode;
    // optional override (useful for testing)
    origin?: string;
};

export const SocketProvider: React.FC<Props> = ({ children, origin }) => {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState<boolean>(false);

    // prefer explicit prop, then environment variable, then fallback
    const wsOrigin = origin ?? process.env.EXPO_PUBLIC_WS_ORIGIN ?? Constants.expoConfig?.extra?.EXPO_PUBLIC_WS_ORIGIN ?? null;
    if (!wsOrigin) {
        console.warn('[SocketProvider] No WS origin found. Set EXPO_PUBLIC_WS_ORIGIN in .env or pass origin prop.');
        return;
    }

    useEffect(() => {
        if (!wsOrigin) {
            console.warn(
                '[SocketProvider] No WebSocket origin provided. Set EXPO_PUBLIC_WS_ORIGIN in your environment or pass `origin` prop to SocketProvider.'
            );
            return;
        }

        // create socket (websocket transport). options tuned for mobile reconnection stability.
        socketRef.current = io(wsOrigin, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: true,
        }) as Socket;

        const s = socketRef.current;

        const onConnect = () => {
            setConnected(true);
            console.log('[Socket] connected', s.id);
        };
        const onDisconnect = (reason?: any) => {
            setConnected(false);
            console.log('[Socket] disconnected', reason);
        };
        const onConnectError = (err: any) => {
            console.warn('[Socket] connect_error', err);
        };

        s.on('connect', onConnect);
        s.on('disconnect', onDisconnect);
        s.on('connect_error', onConnectError);

        // optional: debug incoming events (comment out in production)
        // s.onAny((event, ...args) => console.debug('[Socket] event', event, args));

        return () => {
            // cleanup listeners and disconnect
            if (!socketRef.current) return;
            socketRef.current.off('connect', onConnect);
            socketRef.current.off('disconnect', onDisconnect);
            socketRef.current.off('connect_error', onConnectError);
            socketRef.current.disconnect();
            socketRef.current = null;
        };
    }, [wsOrigin]);

    return <SocketContext.Provider value={{ socket: socketRef.current, connected }}>{children}</SocketContext.Provider>;
};
