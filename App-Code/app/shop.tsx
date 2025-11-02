// app/shop.tsx
import React from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const BRAND = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#0E1B26",
  sub: "#6E7C87",
  border: "rgba(14,27,38,0.08)",
  primary: "#1E62D0",
  chip: "#EEF3F7",
  success: "#2DBE7E",
};

export default function Shop() {
  const r = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const name = (id && String(id)) || "Store";

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => r.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="heart-outline" size={20} color={BRAND.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Hero / banner */}
        <View style={styles.hero}>
          <View style={styles.heroLogo}>
            <Ionicons name="bag-outline" size={22} color={BRAND.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopName} numberOfLines={1}>{name}</Text>
            <Text style={styles.shopMeta}>Fashion • Floor L2</Text>
          </View>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#FFC24B" />
            <Text style={styles.ratingText}>4.6</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.row}>
          <Action label="Queue" icon="time-outline" onPress={() => r.push("/queuing")} />
          <Action label="Directions" icon="map-outline" onPress={() => r.push("./map")} />
          <Action label="Call" icon="call-outline" onPress={() => {}} />
        </View>

        {/* Info cards */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Card title="About" icon="information-circle-outline">
            Top brand with latest collections and seasonal offers. Visit today!
          </Card>
          <Card title="Timings" icon="calendar-outline">
            Mon–Sun • 10:00 AM – 10:00 PM
          </Card>
          <Card title="Offers" icon="pricetags-outline">
            Flat 30% off on select items
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function Action({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.action}>
      <Ionicons name={icon} size={18} color={BRAND.primary} />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Card({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Ionicons name={icon} size={16} color={BRAND.text} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    height: 38, width: 38, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
  },
  headerTitle: { flex: 1, textAlign: "center", marginRight: 38, color: BRAND.text, fontSize: 18, fontWeight: "800" },

  hero: {
    margin: 16, backgroundColor: BRAND.card, borderRadius: 18, borderWidth: 1, borderColor: BRAND.border,
    padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
  },
  heroLogo: {
    height: 44, width: 44, borderRadius: 12, backgroundColor: BRAND.chip, borderWidth: 1, borderColor: BRAND.border,
    alignItems: "center", justifyContent: "center",
  },
  shopName: { color: BRAND.text, fontWeight: "800", fontSize: 16 },
  shopMeta: { color: BRAND.sub, fontSize: 12, marginTop: 2 },
  rating: {
    marginLeft: "auto", height: 32, paddingHorizontal: 10, borderRadius: 10, backgroundColor: "#FFF7E9",
    borderWidth: 1, borderColor: "rgba(255,194,75,0.25)", flexDirection: "row", alignItems: "center", gap: 6,
  },
  ratingText: { fontWeight: "800", color: BRAND.text },

  row: { paddingHorizontal: 16, flexDirection: "row", gap: 8, marginBottom: 6 },
  action: {
    flex: 1, height: 44, borderRadius: 12, backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
  },
  actionText: { color: BRAND.text, fontWeight: "800" },

  card: {
    backgroundColor: BRAND.card, borderRadius: 16, borderWidth: 1, borderColor: BRAND.border, padding: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  cardTitle: { color: BRAND.text, fontWeight: "800" },
  cardBody: { color: BRAND.sub },
});
