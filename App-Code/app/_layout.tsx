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

// Headless (renders nothing)
import SafetyAlertsHeadless from './safety-alerts';

// Global handler: tray/center only (no in-app banner)
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
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
          <SafetyAlertsHeadless />
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              {/* (Optional) keep if you also want to access this screen outside tabs */}
              <Stack.Screen
                name="safety-alerts-demo"
                options={{ title: 'Safety Alerts Demo', headerShown: true }}
              />
            </Stack>
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueueProvider>
    </SocketProvider>
  );
}
