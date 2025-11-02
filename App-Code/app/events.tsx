// app/events.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const BRAND = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#0E1B26',
  sub: '#6E7C87',
  border: 'rgba(14,27,38,0.08)',
  primary: '#1E62D0',       // CTA blue
  chip: '#EEF3F7',
  accent: '#8EE07B',        // soft green
};

// Static demo events
const EVENTS = [
  {
    id: 'e1',
    title: 'Winter Fashion Parade',
    date: 'Sat, Dec 14 • 5:00 PM',
    venue: 'Atrium — Level 1',
    tag: 'Fashion',
    bg: ['#EAF3FF', '#FFFFFF'],
  },
  {
    id: 'e2',
    title: 'Kids Carnival & Magic Show',
    date: 'Sun, Dec 15 • 12:00 PM',
    venue: 'Play Zone — Level 3',
    tag: 'Family',
    bg: ['#FFF6E6', '#FFFFFF'],
  },
  {
    id: 'e3',
    title: 'Live Indie Night',
    date: 'Fri, Dec 20 • 7:30 PM',
    venue: 'Food Court Stage — L3',
    tag: 'Music',
    bg: ['#ECFFF6', '#FFFFFF'],
  },
];

export default function EventsScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Events</Text>
          <View style={styles.iconBtn}>
            <Ionicons name="calendar-outline" size={20} color={BRAND.text} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Featured banners (static) */}
        <Text style={styles.sectionTitle}>Featured</Text>
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.82 + 12}
          decelerationRate="fast"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {EVENTS.map((ev, idx) => (
            <View key={ev.id} style={[styles.banner, { width: width * 0.82 }]}>
              <View style={[styles.bannerArt, { backgroundColor: ev.bg[0] }]}>
                <Ionicons
                  name={idx === 0 ? 'shirt-outline' : idx === 1 ? 'sparkles-outline' : 'musical-notes-outline'}
                  size={28}
                  color={BRAND.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Tag label={ev.tag} />
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
                    <Ionicons name="bookmark-outline" size={16} color={BRAND.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.bannerTitle} numberOfLines={2}>{ev.title}</Text>
                <Text style={styles.bannerMeta} numberOfLines={1}>{ev.date}</Text>
                <Text style={styles.bannerVenue} numberOfLines={1}>{ev.venue}</Text>
                <TouchableOpacity style={styles.cta} activeOpacity={0.9}>
                  <Ionicons name="ticket-outline" size={18} color="#fff" />
                  <Text style={styles.ctaText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Animated.ScrollView>

        {/* Category pills (static) */}
        <View style={{ marginTop: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {['All', 'Music', 'Fashion', 'Food', 'Workshops', 'Kids'].map((c, i) => (
              <View
                key={c}
                style={[
                  styles.chip,
                  i === 0
                    ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary }
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    i === 0 ? { color: '#fff' } : null,
                  ]}
                >
                  {c}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming list (static) */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Upcoming</Text>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {EVENTS.concat(EVENTS).map((ev, k) => (
            <View key={`${ev.id}-${k}`} style={styles.card}>
              <View style={styles.dateCol}>
                <Ionicons name="calendar-outline" size={16} color={BRAND.text} />
                <Text style={styles.dateTxt} numberOfLines={1}>{ev.date}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{ev.title}</Text>
                <Text style={styles.meta} numberOfLines={1}>{ev.venue}</Text>
              </View>
              <TouchableOpacity style={styles.smallCta} activeOpacity={0.9}>
                <Text style={styles.smallCtaText}>Details</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ——— Tiny bits ——— */

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Ionicons name="pricetag-outline" size={12} color={BRAND.text} />
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

/* ——— Styles ——— */

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    height: 38, width: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', marginRight: 38, color: BRAND.text, fontSize: 18, fontWeight: '800' },

  sectionTitle: {
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 16,
    color: BRAND.text,
    fontSize: 16,
    fontWeight: '800',
  },

  /* Featured banners */
  banner: {
    flexDirection: 'row',
    backgroundColor: BRAND.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 12,
  },
  bannerArt: {
    height: 104, width: 86,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  saveBtn: {
    height: 32, width: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BRAND.chip, borderWidth: 1, borderColor: BRAND.border,
  },
  bannerTitle: { color: BRAND.text, fontSize: 16, fontWeight: '800' },
  bannerMeta: { color: BRAND.sub, marginTop: 6, fontSize: 12 },
  bannerVenue: { color: BRAND.sub, marginTop: 2, fontSize: 12 },

  cta: {
    marginTop: 10,
    height: 40,
    borderRadius: 12,
    backgroundColor: BRAND.primary,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  ctaText: { color: '#fff', fontWeight: '800' },

  /* Category chips */
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: BRAND.text, fontWeight: '800', fontSize: 12 },

  /* List */
  card: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateCol: {
    width: 120,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND.chip,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dateTxt: { color: BRAND.text, fontWeight: '800', fontSize: 12 },
  title: { color: BRAND.text, fontWeight: '800' },
  meta: { color: BRAND.sub, fontSize: 12, marginTop: 2 },

  /* Tag */
  tag: {
    paddingHorizontal: 8, height: 26, borderRadius: 999,
    backgroundColor: BRAND.chip, borderWidth: 1, borderColor: BRAND.border,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  tagText: { color: BRAND.text, fontSize: 12, fontWeight: '800' },

  /* Small CTA button */
  smallCta: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: BRAND.chip,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCtaText: { 
    color: BRAND.text,
    fontWeight: '800',
    fontSize: 12,
  },
});
