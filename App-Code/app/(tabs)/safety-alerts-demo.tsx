// app/(tabs)/safety-alerts-demo.tsx
import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from "react-native";
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
  danger: "#FF5D5D",
};

export default function SafetyAlertsDemo() {
  const r = useRouter();
  const [active, setActive] = useState(false);
  const slide = useRef(new Animated.Value(-120)).current;

  const trigger = () => {
    setActive(true);
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(slide, { toValue: -120, duration: 220, useNativeDriver: true }).start(() => setActive(false));
      }, 1600);
    });
  };

  const stop = () => {
    Animated.timing(slide, { toValue: -120, duration: 160, useNativeDriver: true }).start(() => setActive(false));
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => r.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alerts Demo</Text>
          <View style={styles.iconBtn}>
            <Ionicons name="megaphone-outline" size={20} color={BRAND.text} />
          </View>
        </View>
      </SafeAreaView>

      <View style={{ padding: 16, gap: 12 }}>
        <View style={styles.card}>
          <Text style={styles.title}>Test a banner alert</Text>
          <Text style={styles.help}>Shows a slide-down banner. Use “Stop” to dismiss immediately.</Text>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity onPress={trigger} activeOpacity={0.9} style={styles.primaryBtn}>
              <Ionicons name="play-circle-outline" size={18} color="#fff" />
              <Text style={styles.primaryText}>Trigger</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stop} activeOpacity={0.9} style={styles.stopBtn}>
              <Ionicons name="hand-left-outline" size={18} color={BRAND.danger} />
              <Text style={styles.stopText}>Stop announcements</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Banner */}
      <Animated.View style={[styles.banner, { transform: [{ translateY: slide }] }]}>
        <Ionicons name="warning-outline" size={18} color="#fff" />
        <Text style={styles.bannerText}>Fire drill in progress near L3—this is a demo.</Text>
      </Animated.View>
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

  card: {
    backgroundColor: BRAND.card, borderRadius: 16, borderWidth: 1, borderColor: BRAND.border, padding: 12,
  },
  title: { color: BRAND.text, fontWeight: "800" },
  help: { color: BRAND.sub, marginTop: 4, fontSize: 12 },

  primaryBtn: {
    flex: 1, height: 44, borderRadius: 12, backgroundColor: BRAND.primary,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
  },
  primaryText: { color: "#fff", fontWeight: "800" },

  stopBtn: {
    flex: 1, height: 44, borderRadius: 12, backgroundColor: "#FFF6F6",
    borderWidth: 1, borderColor: "rgba(255,93,93,0.25)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
  },
  stopText: { color: BRAND.danger, fontWeight: "800" },

  banner: {
    position: "absolute", left: 12, right: 12, top: 10,
    height: 48, borderRadius: 12, backgroundColor: "#FF7A00",
    elevation: 2, paddingHorizontal: 12,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  bannerText: { color: "#fff", fontWeight: "800" },
});
