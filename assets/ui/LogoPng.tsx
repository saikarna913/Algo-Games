import React from "react";
import { Image } from "react-native";
import useHeaderSizes from "./useHeaderSizes";

export default function LogoPng() {
  const { logoWidth, logoHeight } = useHeaderSizes();

  return (
    <Image
      source={require("../../assets/logo1.png")}
      style={{ width: logoWidth, height: logoHeight }}
      resizeMode="contain"
    />
  );
}