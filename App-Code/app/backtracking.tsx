// app/backtracking.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const BRAND = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#0E1B26',
  sub: '#6E7C87',
  primary: '#5A67D8',
  primarySoft: '#EEF0FF',
  border: 'rgba(14,27,38,0.08)',
  accent: '#FFD966',
};

export default function LostFoundScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const mockLostItems = [
    {
      id: 1,
      title: 'Black Wallet',
      place: 'Food Court',
      time: '2h ago',
      image: 'https://cdn-icons-png.flaticon.com/512/665/665939.png',
    },
    {
      id: 2,
      title: 'Red Backpack',
      place: 'Cinema Area',
      time: '5h ago',
      image: 'https://cdn-icons-png.flaticon.com/512/809/809957.png',
    },
    {
      id: 3,
      title: 'Apple AirPods',
      place: 'Level 2 Restroom',
      time: '1 day ago',
      image: 'https://cdn-icons-png.flaticon.com/512/1153/1153066.png',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView style={{ backgroundColor: BRAND.bg }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lost & Found</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="help-circle-outline" size={22} color={BRAND.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={BRAND.sub} />
          <TextInput
            placeholder="Search lost items..."
            placeholderTextColor={BRAND.sub}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* Banner */}
        <View style={styles.heroCard}>
          <Ionicons name="alert-circle-outline" size={32} color={BRAND.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Lost something?</Text>
            <Text style={styles.heroSub}>We’re here to help you find it</Text>
          </View>
          <TouchableOpacity
            style={styles.reportBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/modal')}
          >
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.reportText}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Reported</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Item cards */}
        <View style={{ paddingHorizontal: 18 }}>
          {mockLostItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image source={{ uri: item.image }} style={styles.itemImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{item.place}</Text>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>
              <TouchableOpacity
                style={styles.foundBtn}
                onPress={() => router.push('/modal')}
              >
                <Text style={styles.foundText}>Claim</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* CTA Card */}
        <View style={styles.ctaCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Found something valuable?</Text>
            <Text style={styles.ctaSub}>Report it to help others</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/modal')}
          >
            <Ionicons name="megaphone-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    height: 38,
    width: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 38,
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.text,
  },
  searchRow: {
    height: 44,
    marginHorizontal: 18,
    marginBottom: 8,
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

  heroCard: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: BRAND.primarySoft,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroTitle: { color: BRAND.text, fontWeight: '800', fontSize: 16 },
  heroSub: { color: BRAND.sub, fontSize: 12 },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reportText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  sectionHeader: {
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: { flex: 1, color: BRAND.text, fontSize: 16, fontWeight: '800' },
  seeAll: { color: BRAND.sub, fontSize: 12, fontWeight: '700' },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: BRAND.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  itemImg: { width: 52, height: 52, borderRadius: 12 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: BRAND.text },
  itemSub: { fontSize: 12, color: BRAND.sub },
  itemTime: { fontSize: 11, color: BRAND.sub, marginTop: 2 },
  foundBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: BRAND.primary,
  },
  foundText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  divider: {
    height: 1,
    backgroundColor: BRAND.border,
    marginVertical: 18,
    marginHorizontal: 18,
  },

  ctaCard: {
    marginHorizontal: 18,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FFE0A3',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaTitle: { fontSize: 15, fontWeight: '800', color: BRAND.text },
  ctaSub: { fontSize: 12, color: BRAND.sub },
  ctaBtn: {
    height: 42,
    width: 42,
    borderRadius: 12,
    backgroundColor: BRAND.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
