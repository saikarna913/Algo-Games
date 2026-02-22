import React from "react";
import { Pressable, Image, StyleSheet, ImageSourcePropType } from "react-native";

interface DonatePngProps {
  width?: number;
  height?: number;
  onPress?: () => void;
  source?: ImageSourcePropType;
}

export default function DonateSVG({
  width = 150,
  height = 70,
  onPress,
  source = require("../../assets/donate.png"), // your PNG path
}: DonatePngProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={source}
        style={{
          width,
          height,
          resizeMode: "contain",
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    overflow: "hidden",
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
});