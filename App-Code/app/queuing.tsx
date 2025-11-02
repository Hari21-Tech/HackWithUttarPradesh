// app/queuing.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BRAND = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#0E1B26',
  sub: '#6E7C87',
  border: 'rgba(14,27,38,0.08)',
  primary: '#1E62D0',      // blue CTA
  success: '#2DBE7E',      // green
  warn: '#F4A100',         // amber
  danger: '#FF5D5D',
  chip: '#EEF3F7',
};

type Shop = {
  id: string;
  name: string;
  floor: string;
  category: string;
  queueLength: number;   // people ahead
  etaMins: number;       // estimated wait
  isPaused?: boolean;    // when shop temporarily stops issuing tokens
};

type Ticket = {
  shopId: string;
  token: string;
  position: number;
  etaMins: number;
};

const DEMO: Shop[] = [
  { id: 'ni-001', name: 'Nike Flagship', floor: 'L2', category: 'Sportswear', queueLength: 7, etaMins: 18 },
  { id: 'hm-110', name: 'H&M', floor: 'L1', category: 'Fashion', queueLength: 3, etaMins: 9 },
  { id: 'fc-210', name: 'Food Court – Biryani Hub', floor: 'L3', category: 'Dining', queueLength: 12, etaMins: 26 },
];

export default function QueuingScreen() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>(DEMO);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  // Fake refresh: mutate counts a bit to look live
  const fetchQueues = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: replace with your backend call:
      // const res = await fetch(`${API_BASE}/queues`);
      // const data = await res.json();
      // setShops(data);
      await new Promise(r => setTimeout(r, 500));
      setShops(prev =>
        prev.map(s => {
          const drift = Math.max(0, s.queueLength + (Math.random() > 0.5 ? 1 : -1));
          const eta = Math.max(1, s.etaMins + (Math.random() > 0.5 ? 2 : -2));
          return { ...s, queueLength: drift, etaMins: eta };
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onJoin = async (shop: Shop) => {
    if (shop.isPaused) return;
    setJoining(shop.id);
    try {
      await new Promise(r => setTimeout(r, 450));
      const token = `Q-${shop.id.split('-')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      setTicket({
        shopId: shop.id,
        token,
        position: shop.queueLength + 1,
        etaMins: shop.etaMins + 3,
      });
    } finally {
      setJoining(null);
    }
  };

  const onLeave = () => setTicket(null);

  const currentShop = useMemo(
    () => shops.find(s => s.id === ticket?.shopId) || null,
    [shops, ticket],
  );

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Queues</Text>
          <View style={styles.iconBtn}>
            <Ionicons name="time-outline" size={20} color={BRAND.text} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchQueues} />
        }
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* Your spot (shows only if joined) */}
        {ticket && currentShop && (
          <View style={styles.spotCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenText}>{ticket.token}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.spotTitle}>You’re in line at {currentShop.name}</Text>
                <Text style={styles.spotMeta}>
                  Position: <Text style={styles.bold}>{ticket.position}</Text> • ETA: <Text style={styles.bold}>{ticket.etaMins} min</Text>
                </Text>
              </View>
            </View>

            <View style={styles.spotFooter}>
              <InfoChip icon="location-outline" text={`Floor ${currentShop.floor}`} />
              <InfoChip icon="pricetag-outline" text={currentShop.category} />
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={onLeave} style={styles.leaveBtn} activeOpacity={0.85}>
                <Ionicons name="close-circle" size={18} color={BRAND.danger} />
                <Text style={[styles.leaveText]}>Leave queue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Nearby queues (no total section) */}
        <SectionHeader title="Nearby queues" />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {shops.map((s) => {
            const busy = s.queueLength >= 10;
            const tone = busy ? 'busy' : s.queueLength <= 3 ? 'light' : 'normal';
            return (
              <View key={s.id} style={styles.shopCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.logo, tone === 'busy' && { backgroundColor: '#FFE9EA' }, tone === 'light' && { backgroundColor: '#E9FFF4' }]}>
                    <Ionicons
                      name={s.category === 'Dining' ? 'restaurant-outline' : 'shirt-outline'}
                      size={18}
                      color={tone === 'busy' ? BRAND.danger : tone === 'light' ? BRAND.success : BRAND.text}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shopName}>{s.name}</Text>
                    <Text style={styles.shopMeta}>
                      Floor {s.floor} • {s.category}
                    </Text>
                  </View>
                  <Badge
                    label={`${s.queueLength} ahead`}
                    tone={busy ? 'danger' : 'ok'}
                    icon={busy ? 'flame-outline' : 'checkmark-circle-outline'}
                  />
                </View>

                <View style={styles.row}>
                  <InfoChip icon="time-outline" text={`${s.etaMins} min ETA`} />
                  {s.isPaused ? (
                    <Badge label="Paused" tone="warn" icon="pause-outline" />
                  ) : (
                    <TouchableOpacity
                      onPress={() => onJoin(s)}
                      activeOpacity={0.9}
                      style={[styles.joinBtn, joining === s.id && { opacity: 0.6 }]}
                      disabled={joining === s.id}
                    >
                      {joining === s.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="add-circle-outline" size={18} color="#fff" />
                          <Text style={styles.joinText}>Join queue</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Little components ---------- */

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 6 }}>
      <Text style={{ color: BRAND.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
    </View>
  );
}

function Badge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: 'ok' | 'danger' | 'warn';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const map = {
    ok: { bg: '#ECFFF6', fg: BRAND.success },
    danger: { bg: '#FFE9EA', fg: BRAND.danger },
    warn: { bg: '#FFF6E6', fg: BRAND.warn },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      {icon && <Ionicons name={icon} size={14} color={map.fg} />}
      <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

function InfoChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={icon} size={14} color={BRAND.sub} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

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

  /* Your spot */
  spotCard: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: BRAND.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
  },
  tokenBadge: {
    paddingHorizontal: 10, height: 28, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BRAND.chip, borderWidth: 1, borderColor: BRAND.border,
  },
  tokenText: { fontSize: 12, fontWeight: '800', color: BRAND.text },
  spotTitle: { color: BRAND.text, fontWeight: '800' },
  spotMeta: { color: BRAND.sub, marginTop: 4 },
  bold: { fontWeight: '800', color: BRAND.text },
  spotFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  leaveBtn: {
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,93,93,0.25)',
    paddingHorizontal: 12, height: 38, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
    backgroundColor: '#FFF6F6',
  },
  leaveText: { color: BRAND.danger, fontWeight: '800' },

  /* Shops */
  shopCard: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 12,
  },
  logo: {
    height: 36, width: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BRAND.chip,
  },
  shopName: { color: BRAND.text, fontWeight: '800', fontSize: 15 },
  shopMeta: { color: BRAND.sub, fontSize: 12, marginTop: 2 },
  row: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },

  joinBtn: {
    marginLeft: 'auto',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  joinText: { color: '#fff', fontWeight: '800' },

  badge: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexDirection: 'row',
  },
  badgeText: { fontSize: 12, fontWeight: '800' },

  infoChip: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: BRAND.chip,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  infoText: { color: BRAND.sub, fontSize: 12, fontWeight: '700' },
});
