// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  ios: {
    ...(config.ios ?? {}),
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      UIBackgroundModes: [
        ...(config.ios?.infoPlist?.UIBackgroundModes ?? []),
        'audio',          // TTS + siren allowed in background
        'fetch',          // optional, future background tasks
      ],
    },
  },

  android: {
    ...(config.android ?? {}),
    permissions: [
      ...(config.android?.permissions ?? []),
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.WAKE_LOCK',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK', // keeps siren alive
    ],
    foregroundService: {
      ...(config.android?.foregroundService ?? {}),
      notificationTitle: 'Safety Alerts Running',
      notificationText: 'Continuing alert audio + voice in background.',
    },
  },

  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
        android: {
          enableProguardInReleaseBuilds: false,
        },
      },
    ],
  ],

  extra: {
    ...(config.extra ?? {}),
    EXPO_PUBLIC_WS_ORIGIN: process.env.EXPO_PUBLIC_WS_ORIGIN ?? null,
  },
});
