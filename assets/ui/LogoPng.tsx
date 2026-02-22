import React from "react";
import { Image } from "react-native";
import useHeaderSizes from "./useHeaderSizes";

export default function LogoPng() {
  const { logoWidth, logoHeight } = useHeaderSizes();

  // prevent logo from becoming too large
  const maxWidth = 140;
  const finalWidth = Math.min(logoWidth, maxWidth);

  return (
    <Image
      source={require("../../assets/logo1.png")}
      style={{
        width: finalWidth,
        height: logoHeight,
      }}
      resizeMode="contain"
    />
  );
}