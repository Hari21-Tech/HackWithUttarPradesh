// app/_layout.tsx
import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { SocketProvider } from './context/SocketContext';
import { QueueProvider } from './queuecontext';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ✅ Headless (renders nothing) — moved to a dedicated file
import HeadlessAlerts from './headless-alerts';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SocketProvider>
      <QueueProvider>
        <SafeAreaProvider>
          {/* Headless listener lives here, but renders nothing */}
          <HeadlessAlerts />
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              {/* Keep demo as a stack screen, accessible from settings page */}
              <Stack.Screen name="safety-alerts-demo" options={{ title: 'Safety Alerts Demo' }} />
              <Stack.Screen name="safety-alerts" options={{ title: 'Safety Alerts' }} />
            </Stack>
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueueProvider>
    </SocketProvider>
  );
}
