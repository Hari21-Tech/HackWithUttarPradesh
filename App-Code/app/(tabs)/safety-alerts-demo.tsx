// app/safety-alerts-demo.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// ✅ Adjust if different
const SIREN_FILE = require('../../assets/siren.mp3');

type FireAlertPayload = {
  type: 'FIRE_ALERT';
  fireLocation?: string;
  safeLocation?: string;
};

const PRESETS: FireAlertPayload[] = [
  {
    type: 'FIRE_ALERT',
    fireLocation: 'Mall A — L2 Food Court',
    safeLocation: 'East Gate via Corridor B',
  },
];

export default function SafetyAlertsDemo() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(false);

  // Only two credentials now
  const [fireLocation, setFireLocation] = useState('Demo Block — Floor 2');
  const [safeLocation, setSafeLocation] = useState('Assembly Point A — East Gate');

  const soundRef = useRef<Audio.Sound | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMsgRef = useRef<string>('');

  // ---- Audio mode: allow mixing + ducking so TTS is clear over siren
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch {}
    })();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      stopEverything();
    };
  }, []);

  // ---- Utility: stop all audio + loops
  const stopEverything = async () => {
    try {
      Speech.stop();
    } catch {}
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current as any);
      loopTimerRef.current = null;
    }
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch {}
  };

  // ---- Utility: stop only the siren (keep announcements if desired)
  const stopSirenOnly = async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
  };

  const buildMessage = (p: FireAlertPayload) => {
    // Clear, simple, and complete with just two inputs
    const where = p.fireLocation?.trim();
    const safe = p.safeLocation?.trim();
    const segs: string[] = [];

    segs.push('Attention. Fire alert.');
    if (where) segs.push(`Fire detected at ${where}.`);
    if (safe) segs.push(`Move immediately to ${safe}.`);
    segs.push('Proceed calmly. Assist others if required.');

    return segs.join(' ').replace(/\s+/g, ' ').trim();
  };

  // ---- Loop announcer: speak → wait → speak again. Ducks siren during TTS.
  const ANNOUNCE_PAUSE_MS = 3500; // wait BEFORE starting the next round (after onDone)

  const startAnnouncementLoop = (msg: string) => {
    currentMsgRef.current = msg;
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current as any);
      loopTimerRef.current = null;
    }
    speakOnceThenSchedule();
  };

  const speakOnceThenSchedule = async () => {
    // Lower siren volume while speaking
    if (soundRef.current) {
      try { await soundRef.current.setVolumeAsync(0.25); } catch {}
    }

    Speech.stop();
    Speech.speak(currentMsgRef.current, {
      language: 'en-IN',
      pitch: 1.0,
      rate: Platform.OS === 'ios' ? 0.52 : 0.92,

      onDone: () => {
        (async () => {
          if (soundRef.current) {
            try { await soundRef.current.setVolumeAsync(1.0); } catch {}
          }
          if (loopTimerRef.current) clearTimeout(loopTimerRef.current as any);
          loopTimerRef.current = setTimeout(() => {
            speakOnceThenSchedule();
          }, ANNOUNCE_PAUSE_MS);
        })();
      },

      onStopped: () => {
        (async () => {
          if (soundRef.current) {
            try { await soundRef.current.setVolumeAsync(1.0); } catch {}
          }
        })();
      },

      onError: () => {
        (async () => {
          if (soundRef.current) {
            try { await soundRef.current.setVolumeAsync(1.0); } catch {}
          }
        })();
      },
    });
  };

  const startSiren = async () => {
    try {
      if (soundRef.current) {
        try { await soundRef.current.stopAsync(); } catch {}
        try { await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(SIREN_FILE, {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      });
      soundRef.current = sound;
    } catch {}
  };

  const ensureNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {}
  };

  const trigger = async (payload: FireAlertPayload) => {
    setLoading(true);
    try {
      await ensureNotificationPermission();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `FIRE ALERT`,
          body:
            `Fire at ${payload.fireLocation ?? 'specified area'}. Move to ${payload.safeLocation ?? 'the designated safe point'}.`,
          sound: 'default',
          data: { demo: true },
        },
        trigger: null,
      });

      const msg = buildMessage(payload);
      await startSiren();
      startAnnouncementLoop(msg);
    } finally {
      setLoading(false);
    }
  };

  const demoPayload: FireAlertPayload = {
    type: 'FIRE_ALERT',
    fireLocation: PRESETS[0].fireLocation,
    safeLocation: PRESETS[0].safeLocation,
  };

  const customPayload: FireAlertPayload = {
    type: 'FIRE_ALERT',
    fireLocation,
    safeLocation,
  };

  return (
    <LinearGradient colors={['#071A2A', '#0F3B66', '#2B6AD6']} style={styles.gradient}>
      <StatusBar translucent barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <Text style={styles.title}>Safety Alerts — Demo</Text>
          <Text style={styles.subtitle}>Fire location + Safe route announcement</Text>

          {/* DEMO QUICK ACTIONS */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Demo Scenario</Text>
            <Text style={styles.cardNote}>Fire: {demoPayload.fireLocation}{'\n'}Safe: {demoPayload.safeLocation}</Text>

            <View style={styles.row}>
              <PrimaryButton
                icon="alert-circle-outline"
                text={loading ? 'Starting…' : 'Start Demo'}
                onPress={() => trigger(demoPayload)}
                disabled={loading}
                gradient={['#4C89FF', '#1E62D0']}
              />
              <DangerButton
                icon="stop-circle-outline"
                text="Stop"
                onPress={stopEverything}
              />
            </View>
          </View>

          {/* CUSTOM PAYLOAD */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Custom Payload</Text>

            <Field
              label="Fire Location"
              value={fireLocation}
              onChangeText={setFireLocation}
              placeholder="e.g., Block B — Floor 3"
            />
            <Field
              label="Safe Location"
              value={safeLocation}
              onChangeText={setSafeLocation}
              placeholder="e.g., Assembly Point — North Gate"
            />

            {/* Announcement Preview */}
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>Announcement Preview</Text>
              <Text style={styles.previewText}>
                {buildMessage(customPayload)}
              </Text>
            </View>

            <View style={[styles.row, { marginTop: 4 }]}>
              <PrimaryButton
                icon="play-outline"
                text="Start Custom Alert"
                onPress={() => trigger(customPayload)}
                gradient={['#52C17E', '#2AA66A']}
              />
              <DangerButton
                icon="stop-circle-outline"
                text="Stop"
                onPress={stopEverything}
              />
            </View>
          </View>

          {/* Optional quick action: stop only siren */}
          <View style={{ marginTop: 10 }}>
            <GhostButton
              icon="volume-mute-outline"
              text="Stop Siren Only"
              onPress={stopSirenOnly}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------- Small UI helpers ---------- */
function PrimaryButton({
  text,
  icon,
  onPress,
  disabled,
  gradient = ['#4C89FF', '#1E62D0'],
}: {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  gradient?: [string, string];
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={[styles.buttonFlex, disabled && { opacity: 0.7 }]}
    >
      <LinearGradient colors={gradient} style={styles.buttonGradientBig}>
        <Ionicons name={icon} size={20} color="#fff" />
        <Text style={styles.buttonTextBig}>{text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function DangerButton({
  text,
  icon,
  onPress,
}: {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.buttonFlex}>
      <LinearGradient colors={['#FF5B5B', '#C91818']} style={styles.buttonGradientBig}>
        <Ionicons name={icon} size={20} color="#fff" />
        <Text style={styles.buttonTextBig}>{text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function GhostButton({
  text,
  icon,
  onPress,
}: {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.ghostBtn}>
      <Ionicons name={icon} size={18} color="#EAF6FF" />
      <Text style={styles.ghostBtnText}>{text}</Text>
    </TouchableOpacity>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 10, width: '100%' }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(234,246,255,0.5)"
        style={styles.input}
      />
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 30 },
  title: { fontSize: 26, fontWeight: '800', color: '#EAF6FF', marginBottom: 6, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: '#CFE7FF', marginBottom: 16 },

  row: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },

  /* Cards */
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: { color: '#EAF6FF', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  cardNote: { color: '#CFE7FF', fontSize: 12, marginBottom: 10 },

  /* Buttons */
  buttonFlex: { flex: 1 },
  buttonGradientBig: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    // soft shadow
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonTextBig: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Ghost action
  ghostBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ghostBtnText: { color: '#EAF6FF', fontSize: 13, fontWeight: '700' },

  /* Inputs */
  inputLabel: { color: '#CFE7FF', fontSize: 12, marginBottom: 6, fontWeight: '700' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },

  // Preview
  previewBox: {
    marginTop: 6,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  previewTitle: {
    color: '#CFE7FF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  previewText: {
    color: '#EAF6FF',
    fontSize: 13,
    lineHeight: 18,
  },
});
