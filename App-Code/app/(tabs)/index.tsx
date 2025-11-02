// app/(tabs)/index.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BRAND = {
  bg: '#F7F9FB',
  card: '#FFFFFF',
  text: '#0E1B26',
  sub: '#6E7C87',
  accent: '#8EE07B', // soft green accent from moodboard
  accentDark: '#3BAA5C',
  border: 'rgba(14,27,38,0.08)',
  chip: '#F0F4F7',
};

export default function HomeScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const animX = useRef(new Animated.Value(-width * 0.8)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(animX, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  };
  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(animX, { toValue: -width * 0.8, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => finished && setDrawerOpen(false));
  };

  const go = (path: string) => router.push(path as any);

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />

      {/* Header */}
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={styles.iconBtn}>
            <Ionicons name="menu" size={22} color={BRAND.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.locationWrap} activeOpacity={0.8}>
            <Ionicons name="location" size={16} color={BRAND.accentDark} />
            <Text style={styles.locationText}>Mumbai</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconAvatar} activeOpacity={0.8}>
            <Ionicons name="person-circle-outline" size={28} color={BRAND.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={BRAND.sub} />
          <TextInput
            placeholder="Search stores, deals, food…"
            placeholderTextColor={BRAND.sub}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <TouchableOpacity>
            <Ionicons name="options-outline" size={20} color={BRAND.sub} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Promo / Ads */}
        <View style={styles.promoCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Good regulation</Text>
            <Text style={styles.promoSubtitle}>For Jan 2025 • 50% OFF</Text>
            <TouchableOpacity activeOpacity={0.85} style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>I discover</Text>
              <Ionicons name="arrow-forward" size={16} color="#0F1A14" />
            </TouchableOpacity>
          </View>
          <View style={styles.promoImgPlaceholder}>
            <Ionicons name="pricetags-outline" size={32} color="#98E896" />
          </View>
        </View>

        {/* Brands carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Brands & Sales</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, gap: 12 }}
        >
          {['Nike', 'Adidas', 'Puma', 'H&M', 'Zara', 'Fila', 'Uniqlo'].map((b) => (
            <View key={b} style={styles.brandDot}>
              <Text style={styles.brandDotText}>{b[0]}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 18, marginTop: 14, gap: 12 }}>
          <CTA
            title="Your Parking, Just a Tap Away"
            icon="car-outline"
            onPress={() => go('/parking')}
          />
          <CTA
            title="Find What You Lost, Fast"
            icon="search-circle-outline"
            onPress={() => go('/backtracking')}
          />
          <CTA
            title="See the Queue, Save Your Spot"
            icon="time-outline"
            onPress={() => go('/queuing')}
          />
        </View>
      </ScrollView>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <Animated.View
          pointerEvents={drawerOpen ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFillObject, {
            backgroundColor: 'rgba(0,0,0,0.35)',
            opacity: backdrop,
          }]}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
        </Animated.View>
      )}

      {/* Drawer Panel */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: animX }] },
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Mall Menu</Text>
        </View>

        <DrawerItem icon="home-outline" label="Home" onPress={() => { closeDrawer(); }} />
        <DrawerItem icon="sparkles-outline" label="Events" onPress={() => { closeDrawer(); /* route later */ }} />
        <DrawerItem icon="time-outline" label="Queue" onPress={() => { closeDrawer(); go('/queuing'); }} />
        <DrawerItem icon="car-outline" label="Parking" onPress={() => { closeDrawer(); go('/parking'); }} />
        <DrawerItem icon="search-outline" label="Find your lost" onPress={() => { closeDrawer(); go('/backtracking'); }} />
        <DrawerItem icon="map-outline" label="Mall Map" onPress={() => { closeDrawer(); /* route later */ }} />

        <View style={styles.drawerFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="person-circle-outline" size={28} color={BRAND.text} />
            <Text style={styles.username}>Username</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={BRAND.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

/* ---------- Small components ---------- */

function CTA({ title, icon, onPress }: { title: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.ctaCard}>
      <View style={styles.ctaLeft}>
        <Ionicons name={icon} size={22} color={BRAND.accentDark} />
      </View>
      <Text style={styles.ctaText}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={BRAND.sub} />
    </TouchableOpacity>
  );
}

function DrawerItem({
  icon, label, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.drawerItem}>
      <Ionicons name={icon} size={20} color={BRAND.text} />
      <Text style={styles.drawerItemText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={BRAND.sub} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { paddingHorizontal: 18, backgroundColor: BRAND.bg },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
  },
  locationWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: { color: BRAND.text, fontSize: 16, fontWeight: '800' },
  iconAvatar: {
    height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
    borderRadius: 19, backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
  },

  searchRow: {
    height: 44,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  searchInput: { flex: 1, color: BRAND.text, fontSize: 14 },

  promoCard: {
    marginTop: 8,
    marginHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#E8F8E6',
    borderWidth: 1,
    borderColor: 'rgba(59,170,92,0.18)',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  promoTitle: { color: '#0F1A14', fontWeight: '800', fontSize: 18 },
  promoSubtitle: { color: '#335241', marginTop: 2, marginBottom: 10, fontSize: 12 },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#9EF08F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promoBtnText: { color: '#0F1A14', fontWeight: '800', fontSize: 12 },
  promoImgPlaceholder: {
    height: 64, width: 64, borderRadius: 16,
    backgroundColor: '#D9F7D6',
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHeader: {
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: { flex: 1, color: BRAND.text, fontSize: 16, fontWeight: '800' },
  seeAll: { color: BRAND.sub, fontSize: 12, fontWeight: '700' },

  brandDot: {
    height: 58, width: 58, borderRadius: 29,
    backgroundColor: BRAND.card,
    borderWidth: 1, borderColor: BRAND.border,
    alignItems: 'center', justifyContent: 'center',
  },
  brandDotText: { color: BRAND.text, fontWeight: '800' },

  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BRAND.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  ctaLeft: {
    height: 36, width: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BRAND.chip,
  },
  ctaText: { flex: 1, color: BRAND.text, fontSize: 14, fontWeight: '700' },

  /* Drawer */
  drawer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: width * 0.78,
    backgroundColor: BRAND.card,
    paddingTop: Platform.select({ ios: 56, android: 38 }),
    borderRightWidth: 1,
    borderRightColor: BRAND.border,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  drawerHeader: { paddingHorizontal: 16, marginBottom: 6 },
  drawerTitle: { fontSize: 18, fontWeight: '800', color: BRAND.text },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND.border,
  },
  drawerItemText: { fontSize: 15, color: BRAND.text, fontWeight: '700' },
  drawerFooter: {
    marginTop: 'auto',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: { color: BRAND.text, fontWeight: '800' },
  logoutBtn: {
    marginLeft: 'auto',
    height: 34, width: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BRAND.chip,
  },
});
