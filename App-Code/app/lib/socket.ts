// app/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

let s: Socket | null = null;

export function getSocket(): Socket {
  if (!s) {
    const origin =
      (process.env.EXPO_PUBLIC_WS_ORIGIN as string | undefined) ??
      (Constants?.expoConfig?.extra?.EXPO_PUBLIC_WS_ORIGIN as string | undefined) ??
      '';
    s = io(origin, { transports: ['websocket'] });
  }
  return s!;
}
