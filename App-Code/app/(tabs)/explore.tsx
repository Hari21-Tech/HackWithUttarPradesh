// app/(tabs)/explore.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BRAND = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#0E1B26",
  sub: "#6E7C87",
  border: "rgba(14,27,38,0.08)",
  primary: "#1E62D0",
  chip: "#EEF3F7",
};

type Card = { id: string; title: string; subtitle: string; category: string; floor: string };

const DATA: Card[] = [
  { id: "nke", title: "Nike Flagship", subtitle: "Shoes & apparel", category: "Fashion", floor: "L2" },
  { id: "hm", title: "H&M", subtitle: "Latest collections", category: "Fashion", floor: "L1" },
  { id: "zx", title: "Zudio X", subtitle: "Budget fashion", category: "Fashion", floor: "L1" },
  { id: "bb", title: "BookBarn", subtitle: "Books & stationery", category: "Books", floor: "L2" },
  { id: "fc-biryani", title: "Biryani Hub", subtitle: "Food court", category: "Food", floor: "L3" },
  { id: "cine", title: "CineMax", subtitle: "Multiplex", category: "Entertainment", floor: "L4" },
];

const CATS = ["All", "Fashion", "Food", "Electronics", "Books", "Entertainment"];

export default function Explore() {
  const r = useRouter();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DATA.filter((c) => {
      const okCat = cat === "All" || c.category === cat;
      const okQ = !q || c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [query, cat]);

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="sparkles-outline" size={20} color={BRAND.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={BRAND.sub} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search stores, food, entertainment…"
            placeholderTextColor={BRAND.sub}
            style={styles.input}
            returnKeyType="search"
          />
        </View>
      </SafeAreaView>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {CATS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCat(c)}
            activeOpacity={0.85}
            style={[
              styles.chip,
              c === cat && { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
            ]}
          >
            <Text style={[styles.chipText, c === cat && { color: "#fff" }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid list */}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}>
        {list.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => r.push({ pathname: "/shop", params: { id: item.id } } as any)}
          >
            <View style={styles.logo}>
              <Ionicons
                name={
                  item.category === "Food"
                    ? "restaurant-outline"
                    : item.category === "Entertainment"
                    ? "film-outline"
                    : "bag-outline"
                }
                size={18}
                color={BRAND.text}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.subtitle} • Floor {item.floor}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={BRAND.sub} />
          </TouchableOpacity>
        ))}
        {list.length === 0 && (
          <Text style={{ color: BRAND.sub, textAlign: "center" }}>No results</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center",
  },
  iconBtn: {
    height: 38, width: 38, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
  },
  headerTitle: { flex: 1, color: BRAND.text, fontSize: 18, fontWeight: "800" },

  searchRow: {
    marginHorizontal: 16, marginTop: 8,
    height: 44, borderRadius: 14, backgroundColor: BRAND.card,
    borderWidth: 1, borderColor: BRAND.border, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  input: { flex: 1, color: BRAND.text, fontSize: 14 },

  chip: {
    height: 34, paddingHorizontal: 12, borderRadius: 999,
    backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
    alignItems: "center", justifyContent: "center",
  },
  chipText: { color: BRAND.text, fontWeight: "800", fontSize: 12 },

  card: {
    backgroundColor: BRAND.card, borderRadius: 16, borderWidth: 1, borderColor: BRAND.border,
    padding: 12, flexDirection: "row", alignItems: "center", gap: 12,
  },
  logo: {
    height: 36, width: 36, borderRadius: 10, backgroundColor: BRAND.chip,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BRAND.border,
  },
  title: { color: BRAND.text, fontWeight: "800" },
  meta: { color: BRAND.sub, fontSize: 12, marginTop: 2 },
});
