import { PlatformPressable } from "expo-router/react-navigation";
import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import type { ReactNode } from "react";

export function HapticTab({ children, ...rest }: Record<string, any>) {
  return (
    <PlatformPressable
      {...rest}
      onPressIn={(ev: any) => {
        if (process.env.EXPO_OS === "ios") {
          impactAsync(ImpactFeedbackStyle.Light);
        }
        rest.onPressIn?.(ev);
      }}
    >
      {children as ReactNode}
    </PlatformPressable>
  );
}
