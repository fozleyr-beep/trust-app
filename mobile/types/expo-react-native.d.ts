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

  export function useSignIn(): {
    signIn: {
      password(input: {
        emailAddress: string;
        password: string;
      }): Promise<{
        createdSessionId?: string | null;
        error?: { message?: string | null } | null;
      }>;
    };
    setActive(input: { session: string }): Promise<void>;
  };

  export function useSignUp(): {
    signUp: {
      password(input: {
        emailAddress: string;
        password: string;
      }): Promise<{
        error?: { message?: string | null } | null;
      }>;
      verifications: {
        sendEmailCode(): Promise<void>;
        verifyEmailCode(input: { code: string }): Promise<{
          createdSessionId?: string | null;
          error?: { message?: string | null } | null;
        }>;
      };
    };
    setActive(input: { session: string }): Promise<void>;
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
  export const TextInput: ComponentType<{
    autoCapitalize?: string;
    keyboardType?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    style?: unknown;
    value?: string;
  }>;
  export const Pressable: ComponentType<{
    accessibilityRole?: string;
    accessibilityState?: Record<string, unknown>;
    children?: ReactNode;
    disabled?: boolean;
    onPress?: () => void;
    style?: unknown;
  }>;

  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
  };
}
