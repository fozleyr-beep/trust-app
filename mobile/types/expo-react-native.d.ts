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
    getToken: () => Promise<string | null>;
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

declare module "expo-crypto" {
  export function getRandomBytesAsync(length: number): Promise<Uint8Array>;
}

declare module "expo-secure-store" {
  export function deleteItemAsync(key: string): Promise<void>;
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
}

declare module "tweetnacl" {
  const nacl: {
    box: {
      (
        message: Uint8Array,
        nonce: Uint8Array,
        publicKey: Uint8Array,
        secretKey: Uint8Array,
      ): Uint8Array;
      keyPair: {
        fromSecretKey(secretKey: Uint8Array): {
          publicKey: Uint8Array;
          secretKey: Uint8Array;
        };
      };
      nonceLength: number;
      open(
        ciphertext: Uint8Array,
        nonce: Uint8Array,
        publicKey: Uint8Array,
        secretKey: Uint8Array,
      ): Uint8Array | null;
    };
  };
  export default nacl;
}

declare module "tweetnacl-util" {
  const naclUtil: {
    decodeBase64(value: string): Uint8Array;
    decodeUTF8(value: string): Uint8Array;
    encodeBase64(bytes: Uint8Array): string;
    encodeUTF8(bytes: Uint8Array): string;
  };
  export default naclUtil;
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
