// app/modal.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BRAND = {
  card: "#FFFFFF",
  text: "#0E1B26",
  sub: "#6E7C87",
  border: "rgba(14,27,38,0.08)",
  primary: "#1E62D0",
};

export default function ModalScreen() {
  const r = useRouter();
  const { title, message } = useLocalSearchParams<{ title?: string; message?: string }>();

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="checkmark-circle-outline" size={24} color={BRAND.primary} />
        </View>
        <Text style={styles.title}>{title || "Done"}</Text>
        <Text style={styles.message}>{message || "Action completed successfully."}</Text>

        <TouchableOpacity onPress={() => r.back()} activeOpacity={0.9} style={styles.btn}>
          <Text style={styles.btnText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", borderRadius: 18, backgroundColor: BRAND.card, padding: 16, borderWidth: 1, borderColor: BRAND.border, alignItems: "center" },
  icon: { height: 46, width: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF3F7" },
  title: { color: BRAND.text, fontWeight: "800", fontSize: 16, marginTop: 10 },
  message: { color: BRAND.sub, textAlign: "center", marginTop: 6 },
  btn: { marginTop: 14, height: 44, borderRadius: 12, backgroundColor: BRAND.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, alignSelf: "stretch" },
  btnText: { color: "#fff", fontWeight: "800" },
});
