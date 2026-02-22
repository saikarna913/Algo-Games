import React, { useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LogoPng from "../../../assets/ui/LogoPng";
import DonatePng from "../../../assets/ui/DonatePng";
import MutePng from "../../../assets/ui/MutePng";
import DonateModal from "../DonateModal";

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [showDonate, setShowDonate] = useState(false);

  // ---------- Responsive Sizes ----------
  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  const donateWidth = clamp(width * 0.18, 60, 140);
  const donateHeight = clamp(width * 0.08, 30, 70);

  // ---------- Open YouTube Channel ----------
  const openYouTube = async () => {
    const url = "https://www.youtube.com/@DrukenCoder";
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 10 },
        ]}
      >
        {/* LEFT — LOGO */}
        <View style={styles.left}>
          <Pressable onPress={openYouTube}>
            <LogoPng />
          </Pressable>
        </View>

        {/* RIGHT — DONATE + MUTE */}
        <View style={styles.right}>
          <DonatePng
            width={donateWidth}
            height={donateHeight}
            onPress={() => setShowDonate(true)}
          />
          <MutePng />
        </View>
      </View>

      {/* DONATE POPUP */}
      <DonateModal
        visible={showDonate}
        onClose={() => setShowDonate(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});