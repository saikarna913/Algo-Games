import { useWindowDimensions } from "react-native";

export default function useHeaderSizes() {
  const { width } = useWindowDimensions();

  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  // ---------- NEW BALANCED SIZES ----------

  // square icons (settings + mute)
  const iconSize = clamp(width * 0.065, 24, 48);

  // donate button (rectangular)
  const buttonWidth = clamp(width * 0.14, 50, 110);
  const buttonHeight = clamp(width * 0.06, 28, 56);

  // logo (slightly larger than icons)
  const logoWidth = clamp(width * 0.22, 80, 160);
  const logoHeight = buttonHeight;

  return {
    iconSize,
    buttonWidth,
    buttonHeight,
    logoWidth,
    logoHeight,
  };
}