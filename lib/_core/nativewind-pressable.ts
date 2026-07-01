// NativeWind + Pressable: className can swallow onPress. Disable className mapping on native only.
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  try {
    const { Pressable } = require("react-native");
    const { remapProps } = require("nativewind");
    remapProps(Pressable, { className: false });
  } catch (e) {
    // Silently fail if nativewind is not available
  }
}
