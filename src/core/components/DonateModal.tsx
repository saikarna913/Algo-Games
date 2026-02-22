import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Linking,
  StyleSheet,
} from "react-native";

interface DonateModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DonateModal({
  visible,
  onClose,
}: DonateModalProps) {
  // ---------- UPI PAYMENT ----------
  const handleDonate = async () => {
    const upiId = "yourupi@okaxis";

    const url = `upi://pay?pa=${upiId}&pn=AlgoGames&am=10&cu=INR&tn=Support%20AlgoGames`;

    const supported = await Linking.canOpenURL(url);

    if (supported) await Linking.openURL(url);
    else alert("No UPI app found");
  };

  // ---------- YOUTUBE ----------
  const openYouTube = async () => {
    await Linking.openURL("https://www.youtube.com/@DrukenCoder");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.popup}>

          {/* FLOATING CLOSE BUTTON */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Text style={styles.title}>Support Development ❤️</Text>

          <Text style={styles.message}>
            Help us keep improving the app.
            {"\n\n"}Donate or support by subscribing.
          </Text>

          {/* DONATE BUTTON — PRIMARY */}
          <Pressable
            onPress={handleDonate}
            style={({ pressed }) => [
              styles.donateButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.donateText}>Donate ₹10</Text>
          </Pressable>

          {/* YOUTUBE BUTTON — SECONDARY */}
          <Pressable
            onPress={openYouTube}
            style={({ pressed }) => [
              styles.youtubeButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.youtubeText}>Subscribe on YouTube</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 26,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  /* ---------- FLOATING CLOSE BUTTON ---------- */

  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,

    // blur-like translucent background
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  /* ---------- TEXT ---------- */

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  message: {
    textAlign: "center",
    marginBottom: 28,
    color: "#666",
    lineHeight: 20,
  },

  /* ---------- PRIMARY BUTTON (DONATE) ---------- */

  donateButton: {
    width: "100%",
    backgroundColor: "#2563EB", // modern blue
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
    elevation: 3,
  },

  donateText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  /* ---------- SECONDARY BUTTON (YOUTUBE) ---------- */

  youtubeButton: {
    width: "100%",
    backgroundColor: "#f3f4f6",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  youtubeText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 16,
  },

  /* ---------- PRESS FEEDBACK ---------- */

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});