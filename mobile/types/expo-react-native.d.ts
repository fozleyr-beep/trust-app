declare module "expo-constants" {
  const Constants: {
    expoConfig?: {
      extra?: Record<string, unknown>;
    };
  };
  export default Constants;
}

declare const process: {
  env: Record<string, string | undefined>;
};

declare module "@clerk/expo" {
  import type { ComponentType, ReactNode } from "react";

  export const ClerkProvider: ComponentType<{
    children?: ReactNode;
    publishableKey: string;
    tokenCache?: unknown;
  }>;

  export function useAuth(): {
    isLoaded: boolean;
    isSignedIn: boolean;
    signOut: () => Promise<void>;
  };

  export function useUser(): {
    user?: {
      fullName?: string | null;
      primaryEmailAddress?: {
        emailAddress?: string | null;
      } | null;
    } | null;
  };
}

declare module "@clerk/expo/token-cache" {
  export const tokenCache: unknown;
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
