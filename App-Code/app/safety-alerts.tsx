// app/safety-alerts.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

type FireAlertPayload = {
  type: 'FIRE_ALERT';
  site?: string; zone?: string; dangerCamera?: string; safeCamera?: string; safeExit?: string; instruction?: string;
  demo?: boolean; // <-- demo flag to avoid rescheduling
};

function tryParse<T>(s?: string | null): T | null { if (!s) return null; try { return JSON.parse(s) as T; } catch { return null; } }

export default function SafetyAlertsHeadless() {
  const [, setToken] = useState<string | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => { (async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) { console.warn('Audio mode config failed:', e); }
  })(); }, []);

  useEffect(() => { (async () => {
    const granted = await requestPermissions(); if (!granted) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
    try { const devToken = await Notifications.getDevicePushTokenAsync(); setToken(devToken.data); }
    catch { const expoToken = (await Notifications.getExpoPushTokenAsync()).data; setToken(expoToken); }
  })(); }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notif) => {
      try { const data = notif?.request?.content?.data ?? {}; handleIncomingPayload(data as Record<string, unknown>); }
      catch (e) { console.warn('Notification parse error:', e); }
    });
    const respSub = Notifications.addNotificationResponseReceivedListener(() => {});
    const appStateSub = AppState.addEventListener('change', (next) => { appState.current = next; });
    return () => { sub.remove(); respSub.remove(); appStateSub.remove(); };
  }, []);

  const handleIncomingPayload = (data: Record<string, unknown>) => {
    const meta = tryParse<FireAlertPayload>(String((data as any)?.meta ?? '')) ?? (data as unknown as FireAlertPayload);
    if (meta?.type !== 'FIRE_ALERT') return;

    // *** CRITICAL: if this came from demo page, do NOT reschedule another notification ***
    if (meta.demo === true) {
      // Let the demo page handle its own TTS loop; do nothing here to avoid feedback loops
      return;
    }

    const title = 'FIRE ALERT';
    const site = meta.site ? ` at ${meta.site}` : '';
    const zone = meta.zone ? `, zone ${meta.zone}` : '';
    const danger = meta.dangerCamera ? `Detected near ${meta.dangerCamera}.` : '';
    const safe = meta.safeCamera ? `Safe route via ${meta.safeCamera}.` : '';
    const exit = meta.safeExit ? `Use ${meta.safeExit}.` : '';
    const instruction = meta.instruction ?? 'Please proceed calmly to the indicated safe exit.';
    const displayBody = `${danger} ${safe} ${exit}`.trim();

    // Mirror to system tray / notification center (one-time)
    Notifications.scheduleNotificationAsync({
      content: { title: `${title}${site}${zone}`, body: displayBody.length > 0 ? displayBody : instruction, sound: 'default', data },
      trigger: null,
    });

    // Single TTS pass for real push (no loop here)
    speakEvac(instruction, { site: meta.site, zone: meta.zone, safeExit: meta.safeExit });
  };

  const speakEvac = (instruction: string, extra: { site?: string; zone?: string; safeExit?: string } = {}) => {
    try { Speech.stop(); } catch {}
    const head = 'Attention. Fire alert.';
    const site = extra.site ? ` Location: ${extra.site}.` : '';
    const zone = extra.zone ? ` Zone: ${extra.zone}.` : '';
    const exit = extra.safeExit ? ` Use exit: ${extra.safeExit}.` : '';
    const message = `${head}${site}${zone} ${instruction}.${exit}`.replace(/\s+/g, ' ').trim();
    Speech.speak(message, { language: 'en-US', pitch: 1.0, rate: Platform.OS === 'ios' ? 0.52 : 0.9 });
  };

  return null; // Headless
}

async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) return true;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') { const { status } = await Notifications.requestPermissionsAsync(); final = status; }
  return final === 'granted';
}
