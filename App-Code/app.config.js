// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  // Helpful in dev: if you’re using http:// for API/WS, relax ATS on iOS
  const WS = process.env.EXPO_PUBLIC_WS_ORIGIN || '';
  const API = process.env.EXPO_PUBLIC_API_URL || '';
  const isHttpDev = (WS + API).includes('http://');

  return {
    ...config,

    scheme: config.scheme ?? 'myapp', // optional: deep links

    ios: {
      ...(config.ios ?? {}),
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        UIBackgroundModes: [
          ...(config.ios?.infoPlist?.UIBackgroundModes ?? []),
          'audio',   // TTS + siren allowed in background
          'fetch',   // optional, future background tasks
        ],
        ...(isHttpDev
          ? {
              // DEV ONLY: allow http to LAN during development
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
              },
            }
          : {}),
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
            // Helpful for local dev over http://
            usesCleartextTraffic: true,
            enableProguardInReleaseBuilds: false,
          },
        },
      ],
    ],

    extra: {
      ...(config.extra ?? {}),
      // Make these available at runtime (Constants.expoConfig.extra.*)
      EXPO_PUBLIC_WS_ORIGIN: process.env.EXPO_PUBLIC_WS_ORIGIN ?? '',
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? '',
    },
  };
};
