// app/parking.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Slot = {
  id: string;
  label: string;
  taken?: boolean;
  ev?: boolean;
};

const BRAND = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#0E1B26',
  sub: '#6E7C87',
  primary: '#6B5AED', // purple
  primarySoft: '#EEEAFE',
  success: '#2DBE7E',
  border: 'rgba(14,27,38,0.08)',
};

const BUILDINGS = ['AltOza', 'Burbun', 'Choco', 'Dalian'];
const FLOORS = ['B2', 'B1', 'G', 'P1', 'P2'];

export default function ParkingScreen() {
  const router = useRouter();
  const [building, setBuilding] = useState('Choco');
  const [floor, setFloor] = useState('P2');
  const [selected, setSelected] = useState<string | null>(null);

  const slots: Slot[] = useMemo(() => {
    const ids: Slot[] = Array.from({ length: 36 }).map((_, i) => {
      const label = `${floor}-${(i + 1).toString().padStart(3, '0')}`;
      return { id: label, label };
    });
    ids[2].taken = true;
    ids[5].ev = true;
    ids[8].taken = true;
    ids[9].taken = true;
    ids[12].ev = true;
    ids[18].taken = true;
    ids[23].ev = true;
    ids[28].taken = true;
    return ids;
  }, [floor]);

  const availableCount = slots.filter(s => !s.taken).length;

  const onSelect = (s: Slot) => {
    if (s.taken) return;
    setSelected(prev => (prev === s.id ? null : s.id));
  };

  const onContinue = () => {
    if (!selected) return;
    router.push({
      pathname: '/modal',
      params: { title: 'Slot reserved', message: `Parking slot ${selected} reserved for 15 minutes.` },
    } as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={22} color={BRAND.text} />
          </TouchableOpacity>
        </View>

        {/* Greeting card */}
        <View style={styles.heroCard}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.heroTitle}>Need parking?</Text>
            <Text style={styles.heroSub}>Book in any building</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <PillButton
                label="Book now"
                icon="flash-outline"
                filled
                onPress={() => {}}
              />
              <PillButton
                label="Explore"
                icon="navigate-outline"
                onPress={() => {}}
              />
            </View>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="car-sport-outline" size={22} color={BRAND.primary} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            title={`${availableCount} slots`}
            subtitle={`Available in ${building} ${floor}`}
            icon="checkmark-circle-outline"
            tone="success"
          />
          <StatCard
            title={selected ? `Selected ${selected}` : 'No slot selected'}
            subtitle="Tap a slot below"
            icon="calendar-outline"
            tone="primary"
          />
        </View>

        {/* Building selector */}
        <SectionHeader title="Select building & floor" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {BUILDINGS.map(b => (
            <Chip
              key={b}
              label={b}
              active={b === building}
              onPress={() => setBuilding(b)}
            />
          ))}
        </ScrollView>

        {/* Floor selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.hScroll, { marginTop: -6 }]}
        >
          {FLOORS.map(f => (
            <Chip
              key={f}
              label={f}
              active={f === floor}
              onPress={() => setFloor(f)}
              small
            />
          ))}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <LegendDot color={BRAND.card} label="Available" border />
          <LegendDot color="#EFEFF7" label="Selected" border />
          <LegendDot color="#EAECEF" label="Taken" />
          <LegendDot color="#E6FFF2" label="EV" border />
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {slots.map((s) => {
            const isSelected = s.id === selected;
            return (
              <TouchableOpacity
                key={s.id}
                activeOpacity={s.taken ? 1 : 0.8}
                onPress={() => onSelect(s)}
                style={[
                  styles.slot,
                  s.taken && styles.slotTaken,
                  isSelected && styles.slotSelected,
                  s.ev && styles.slotEV,
                ]}
              >
                <Ionicons
                  name="car-outline"
                  size={18}
                  color={s.taken ? '#98A1A8' : BRAND.text}
                />
                <Text
                  style={[
                    styles.slotLabel,
                    s.taken && { color: '#98A1A8' },
                  ]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
                {s.ev && (
                  <Ionicons name="flash-outline" size={14} color={BRAND.success} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue button */}
        <View style={{ paddingHorizontal: 18, marginTop: 8 }}>
          <TouchableOpacity
            onPress={onContinue}
            activeOpacity={selected ? 0.85 : 1}
            style={[styles.cta, !selected && { opacity: 0.5 }]}
          >
            <Text style={styles.ctaText}>
              {selected ? `Continue • ${selected}` : 'Select a slot to continue'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Small components ---------- */

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ paddingHorizontal: 18, marginTop: 14, marginBottom: 6 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: BRAND.text }}>{title}</Text>
    </View>
  );
}

function StatCard({
  title, subtitle, icon, tone,
}: {
  title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; tone: 'primary' | 'success';
}) {
  const color = tone === 'primary' ? BRAND.primary : BRAND.success;
  const bg = tone === 'primary' ? '#F2F0FF' : '#ECFFF6';
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSub}>{subtitle}</Text>
    </View>
  );
}

function PillButton({
  label, icon, onPress, filled,
}: {
  label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; filled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.pill,
        filled ? { backgroundColor: BRAND.primary } : { backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border },
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={filled ? '#fff' : BRAND.text}
      />
      <Text style={[styles.pillText, filled && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Chip({
  label, active, small, onPress,
}: {
  label: string; active?: boolean; small?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.chip,
        small && { height: 34, paddingHorizontal: 12 },
        active
          ? { backgroundColor: BRAND.primary, borderColor: BRAND.primary }
          : { backgroundColor: BRAND.card, borderColor: BRAND.border },
      ]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function LegendDot({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }, border && { borderWidth: 1, borderColor: BRAND.border }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    height: 38, width: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: BRAND.card,
    borderWidth: 1, borderColor: BRAND.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', marginRight: 38, fontSize: 18, fontWeight: '800', color: BRAND.text },

  heroCard: {
    marginHorizontal: 18,
    marginTop: 8,
    backgroundColor: BRAND.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: { fontSize: 16, fontWeight: '800', color: BRAND.text },
  heroSub: { fontSize: 12, color: BRAND.sub },
  heroBadge: {
    height: 44, width: 44, borderRadius: 12,
    backgroundColor: BRAND.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },

  statsRow: {
    paddingHorizontal: 18,
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  statIcon: {
    height: 28, width: 28, borderRadius: 8, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statTitle: { fontSize: 16, fontWeight: '800', color: BRAND.text },
  statSub: { fontSize: 12, color: BRAND.sub, marginTop: 4 },

  hScroll: { paddingHorizontal: 18, gap: 10, paddingVertical: 10 },

  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '700', color: BRAND.text },

  // 🔧 Added these to fix the error
  pill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillText: { fontSize: 12, fontWeight: '800', color: BRAND.text },

  legend: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    marginTop: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { height: 14, width: 22, borderRadius: 6 },
  legendText: { fontSize: 12, color: BRAND.sub },

  grid: {
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slot: {
    width: (width - 12 * 2 - 10 * 3) / 4,
    margin: 5,
    height: 68,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  slotTaken: {
    backgroundColor: '#EAECEF',
  },
  slotSelected: {
    backgroundColor: '#EFEFF7',
    borderColor: '#D6D1FF',
  },
  slotEV: {
    shadowColor: '#2DBE7E',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  slotLabel: { fontSize: 11, fontWeight: '700', color: BRAND.text },

  cta: {
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
