// app/safety-alerts.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Switch, TouchableOpacity } from "react-native";
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

export default function SafetyAlertsSettings() {
  const r = useRouter();
  const [muteMobile, setMuteMobile] = useState(false);
  const [vibrate, setVibrate] = useState(true);
  const [showBanners, setShowBanners] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => r.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={BRAND.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Alerts</Text>
          <View style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={BRAND.text} />
          </View>
        </View>
      </SafeAreaView>

      <View style={{ padding: 16, gap: 12 }}>
        <Card title="Mute announcements on mobile">
          <Row>
            <Text style={styles.rowText}>Mute TTS announcements</Text>
            <Switch value={muteMobile} onValueChange={setMuteMobile} />
          </Row>
          <Text style={styles.help}>If enabled, you’ll still see alerts as banners.</Text>
        </Card>

        <Card title="Notification options">
          <Row>
            <Text style={styles.rowText}>Banners</Text>
            <Switch value={showBanners} onValueChange={setShowBanners} />
          </Row>
          <Row>
            <Text style={styles.rowText}>Vibrate</Text>
            <Switch value={vibrate} onValueChange={setVibrate} />
          </Row>
        </Card>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.testBtn}
          onPress={() => r.push("/safety-alerts-demo")}
        >
          <Ionicons name="megaphone-outline" size={18} color="#fff" />
          <Text style={styles.testText}>Open Demo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
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
  cardTitle: { color: BRAND.text, fontWeight: "800", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  rowText: { color: BRAND.text, fontWeight: "700" },
  help: { color: BRAND.sub, fontSize: 12, marginTop: 6 },

  testBtn: {
    marginTop: 4, height: 48, borderRadius: 14, backgroundColor: BRAND.primary,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
  },
  testText: { color: "#fff", fontWeight: "800" },
});
