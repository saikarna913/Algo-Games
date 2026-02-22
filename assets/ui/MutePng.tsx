import React, { useState } from "react";
import { Pressable, Image, StyleSheet } from "react-native";
import useHeaderSizes from "./useHeaderSizes";

export default function MutePng() {
  const { iconSize } = useHeaderSizes();
  const [muted, setMuted] = useState(false);

  return (
    <Pressable
      onPress={() => setMuted(!muted)}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={
          muted
            ? require("../../assets/mute1.png")
            : require("../../assets/unmute1.png")
        }
        style={{ width: iconSize, height: iconSize }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 20 },
  pressed: { transform: [{ scale: 0.95 }] },
});