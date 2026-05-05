declare module "expo-constants" {
  const Constants: {
    expoConfig?: {
      extra?: Record<string, unknown>;
    };
  };
  export default Constants;
}

declare module "react-native" {
  import type { ComponentType, ReactNode } from "react";

  export const Linking: {
    openURL(url: string): Promise<unknown>;
  };

  export const Platform: {
    OS: "android" | "ios" | "web" | string;
    select<T>(specifics: Record<string, T> & { default?: T }): T | undefined;
  };

  export const StatusBar: ComponentType<{ barStyle?: string }>;
  export const SafeAreaView: ComponentType<{ children?: ReactNode; style?: unknown }>;
  export const ScrollView: ComponentType<{
    children?: ReactNode;
    contentContainerStyle?: unknown;
  }>;
  export const View: ComponentType<{ children?: ReactNode; style?: unknown }>;
  export const Text: ComponentType<{ children?: ReactNode; style?: unknown }>;
  export const Pressable: ComponentType<{
    accessibilityRole?: string;
    accessibilityState?: Record<string, unknown>;
    children?: ReactNode;
    onPress?: () => void;
    style?: unknown;
  }>;

  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
  };
}
