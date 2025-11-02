// app/map.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
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

const FLOORS = ["B1", "L1", "L2", "L3", "F.C"]; // F.C = food court

export default function MallMap() {
  const router = useRouter();
  const [floor, setFloor] = useState("L1");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const storePress = (id: string) => {
    setSelectedStore(id);
    setTimeout(() => {
      setSelectedStore(null);
    }, 1800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mall Map</Text>
          <View style={styles.iconBtn}>
            <Ionicons name="map-outline" size={20} color={BRAND.text} />
          </View>
        </View>
      </SafeAreaView>

      {/* Floor chips */}
      <View style={{ marginTop: 8 }}>
        <View style={{ paddingHorizontal: 16, flexDirection: "row", gap: 8 }}>
          {FLOORS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFloor(f)}
              activeOpacity={0.85}
              style={[
                styles.chip,
                f === floor && { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  f === floor && { color: "#fff" },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* simple map art */}
      <View style={styles.mapArea}>
        <View style={styles.col}>
          <TouchableOpacity onPress={() => storePress("A1")} style={styles.storeBox}>
            <Text style={styles.storeTxt}>A1</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => storePress("A2")} style={styles.storeBox}>
            <Text style={styles.storeTxt}>A2</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.col, { marginLeft: 14 }]}>
          <TouchableOpacity onPress={() => storePress("B1")} style={styles.storeBoxTall}>
            <Text style={styles.storeTxt}>B1</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => storePress("B2")} style={styles.storeBoxTall}>
            <Text style={styles.storeTxt}>B2</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!!selectedStore && (
        <View style={styles.toast}>
          <Ionicons name="information-circle-outline" size={18} color={BRAND.text} />
          <Text style={styles.toastText}>Store {selectedStore} → Details coming soon</Text>
        </View>
      )}
    </View>
  );
}

/* styles */
const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    height: 38,
    width: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  headerTitle: { flex: 1, textAlign: "center", marginRight: 38, color: BRAND.text, fontSize: 18, fontWeight: "800" },

  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { color: BRAND.text, fontWeight: "800", fontSize: 12 },

  mapArea: {
    marginTop: 22,
    paddingHorizontal: 40,
    flexDirection: "row",
  },
  col: { gap: 14 },

  storeBox: {
    height: 70,
    width: 70,
    backgroundColor: BRAND.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: "center",
    justifyContent: "center",
  },
  storeBoxTall: {
    height: 102,
    width: 70,
    backgroundColor: BRAND.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: "center",
    justifyContent: "center",
  },
  storeTxt: { fontWeight: "800", color: BRAND.text },

  toast: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toastText: { color: BRAND.text, fontWeight: "700" },
});
