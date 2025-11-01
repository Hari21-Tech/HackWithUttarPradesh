// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import { useRouter } from 'expo-router';

type NavItem = {
  label: string;
  subtitle?: string;
  icon?: string;
  route: string; // plain string in our data model
};

const items: NavItem[] = [
  // ✅ Put demo first so it's obvious for judges
  { label: 'Safety Alerts Demo', subtitle: 'Trigger alert & TTS', icon: 'alert-circle-outline', route: '/safety-alerts-demo' },
  { label: 'Queuing', subtitle: 'Manage queues easily', icon: 'time-outline', route: '/queuing' },
  { label: 'Backtracking', subtitle: 'Trace last positions', icon: 'walk-outline', route: '/backtracking' },
  { label: 'Parking', subtitle: 'Find nearby parking', icon: 'car-outline', route: '/parking' },
];

export default function Home() {
  const router = useRouter();

  // Helper wrapper to satisfy Expo Router's strict types with string routes.
  const pushPath = (path: string) => {
    router.push(path as any);
  };

  return (
    <LinearGradient colors={['#071A2A', '#0F3B66', '#2B6AD6']} style={styles.bg}>
      <StatusBar translucent barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.sub}>Choose a helper to begin</Text>
        </View>

        <View style={styles.list}>
          {items.map((it) => (
            <GlassCard
              key={it.label}
              icon={it.icon}
              title={it.label}
              subtitle={it.subtitle}
              ctaLabel="Open"
              onPress={() => pushPath(it.route)}
            />
          ))}
        </View>

        <Text style={styles.footer}>v1.0 • Glassmorphic UI</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: { width: '100%', marginTop: 36, marginBottom: 18, alignItems: 'center' },
  title: { color: '#EAF6FF', fontSize: 34, fontWeight: '800' },
  sub: { color: '#CFE7FF', marginTop: 6, fontSize: 14 },
  list: { width: '100%', marginTop: 12 },
  footer: { color: '#AAC8EE', opacity: 0.75, fontSize: 12, marginTop: 28 },
});
