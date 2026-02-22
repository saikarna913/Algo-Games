import React from "react";
import { Image } from "react-native";
import useHeaderSizes from "./useHeaderSizes";

export default function SettingsPng() {
  const { iconSize } = useHeaderSizes();

  return (
    <Image
      source={require("../../assets/settings.png")}
      style={{ width: iconSize, height: iconSize }}
      resizeMode="contain"
    />
  );
}