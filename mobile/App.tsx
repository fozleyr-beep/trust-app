import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ClerkProvider,
  useAuth,
  useSignIn,
  useSignUp,
  useUser,
} from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import Constants from "expo-constants";
import {
  registerMobileDeviceKey,
  rotateMobileDeviceKey,
} from "./src/crypto/deviceKeys";
import {
  agentActionBaselines,
  agentName,
  sakinahAgents,
  serviceStages,
  type AgentStageState,
} from "../lib/agents/registry";

const colors = {
  ink: "#2a2722",
  inkSoft: "#5a5448",
  inkMuted: "#7a6e5c",
  inkFaint: "#a89d87",
  paper: "#f5efe6",
  paperSoft: "#eae2d2",
  surface: "#fffaf1",
  rule: "rgba(42, 39, 34, 0.12)",
  accent: "#8a9a7b",
};

const stateCopy: Record<AgentStageState, string> = {
  live: "Live",
  ready: "Designed",
  gate: "Launch gate",
};

type TabName = "start" | "path" | "agents" | "account" | "store";
type AuthMode = "sign-in" | "sign-up";
type Intent = "seeker" | "family";

const intakeSteps = [
  {
    agent: "Hafiz",
    title: "Intent",
    body: "Choose seeker or family path, then capture city and contact readiness.",
  },
  {
    agent: "Hafiz",
    title: "Verification",
    body: "Prepare identity and family-link checks before matching widens.",
  },
  {
    agent: "Watim",
    title: "Preferences",
    body: "Capture values, boundaries, non-negotiables, and family involvement.",
  },
  {
    agent: "Adil",
    title: "Consent",
    body: "Confirm who may witness, who may speak, and when a salaam can open.",
  },
  {
    agent: "Sabr",
    title: "Safety",
    body: "Mark pressure risks, pause rules, and expiry expectations.",
  },
] as const;

const readinessChecks = [
  "Profile intent saved",
  "Privacy consent accepted",
  "Verification path prepared",
  "Family boundary selected",
] as const;

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <AppShell nativeAuthReady={false} />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AppShell nativeAuthReady />
    </ClerkProvider>
  );
}

function AppShell({ nativeAuthReady }: { nativeAuthReady: boolean }) {
  const [tab, setTab] = useState<TabName>("start");
  const apiBaseUrl = useMemo(() => {
    const extra = Constants.expoConfig?.extra as
      | { apiBaseUrl?: string }
      | undefined;
    return extra?.apiBaseUrl ?? "https://trust-app-three.vercel.app";
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>sakinah</Text>
            <Text style={styles.subtitle}>mobile private build</Text>
          </View>
          <TrustDot label={Platform.OS === "android" ? "Android" : "iOS"} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Zero-human service</Text>
          <Text style={styles.title}>
            The app should feel like the service, not a website in a frame.
          </Text>
          <Text style={styles.body}>
            Mobile is the primary surface for seekers and families. Web remains
            the trust contract, brand proof, and account deletion fallback.
          </Text>
        </View>

        <View style={styles.tabs}>
          <Tab
            label="Start"
            active={tab === "start"}
            onPress={() => setTab("start")}
          />
          <Tab label="Path" active={tab === "path"} onPress={() => setTab("path")} />
          <Tab
            label="Agents"
            active={tab === "agents"}
            onPress={() => setTab("agents")}
          />
          <Tab
            label="Account"
            active={tab === "account"}
            onPress={() => setTab("account")}
          />
          <Tab
            label="Store"
            active={tab === "store"}
            onPress={() => setTab("store")}
          />
        </View>

        {tab === "start" && (
          <View style={styles.stack}>
            <ServiceIntakeFlow />
            <MatchReadinessCard />
          </View>
        )}

        {tab === "path" && (
          <View style={styles.stack}>
            {serviceStages.map((stage) => (
              <Card key={stage.href}>
                <View style={styles.cardTopline}>
                  <Text style={styles.step}>{stage.n}</Text>
                  <Pill state={stage.state} />
                </View>
                <Text style={styles.cardTitle}>{stage.title}</Text>
                <Text style={styles.cardAgent}>{agentName(stage.agentId)}</Text>
                <Text style={styles.cardBody}>{stage.body}</Text>
              </Card>
            ))}
          </View>
        )}

        {tab === "agents" && (
          <View style={styles.stack}>
            <AgentLedgerCards />
            {sakinahAgents.map((agent) => (
              <Card key={agent.id}>
                <View style={styles.cardTopline}>
                  <Text style={styles.cardTitle}>{agent.name}</Text>
                  <Text style={styles.arabic}>{agent.arabic}</Text>
                </View>
                <Text style={styles.cardAgent}>{agent.role}</Text>
                <Text style={styles.cardBody}>{agent.promise}</Text>
                <Text style={styles.boundary}>{agent.boundary}</Text>
              </Card>
            ))}
          </View>
        )}

        {tab === "account" && (
          <AccountTab apiBaseUrl={apiBaseUrl} nativeAuthReady={nativeAuthReady} />
        )}

        {tab === "store" && (
          <View style={styles.stack}>
            <Card>
              <Text style={styles.cardTitle}>Android launch track</Text>
              <Text style={styles.cardBody}>
                Expo/EAS is configured for internal APK testing and production
                Android App Bundle builds. iOS uses the same codebase later.
              </Text>
            </Card>
            <Card>
              <Text style={styles.cardTitle}>Policy gates</Text>
              <Text style={styles.cardBody}>
                Account deletion, privacy policy, Data safety, payments, and
                permission minimization must be handled before Play review.
              </Text>
            </Card>
            <Pressable
              style={styles.primaryButton}
              onPress={() => Linking.openURL(`${apiBaseUrl}/trust`)}
            >
              <Text style={styles.primaryButtonText}>Open trust contract</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceIntakeFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const step = intakeSteps[activeStep];

  function nextStep() {
    setActiveStep((current) => Math.min(current + 1, intakeSteps.length - 1));
  }

  function previousStep() {
    setActiveStep((current) => Math.max(current - 1, 0));
  }

  return (
    <Card>
      <View style={styles.cardTopline}>
        <Text style={styles.step}>
          {String(activeStep + 1).padStart(2, "0")} / {intakeSteps.length}
        </Text>
        <Text style={styles.cardAgent}>{step.agent}</Text>
      </View>
      <Text style={styles.cardTitle}>{step.title}</Text>
      <Text style={styles.cardBody}>{step.body}</Text>
      <View style={styles.buttonRow}>
        <Pressable
          disabled={activeStep === 0}
          style={[
            styles.secondaryButton,
            styles.rowButton,
            activeStep === 0 && styles.buttonDisabled,
          ]}
          onPress={previousStep}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable
          disabled={activeStep === intakeSteps.length - 1}
          style={[
            styles.primaryButton,
            styles.rowButton,
            activeStep === intakeSteps.length - 1 && styles.buttonDisabled,
          ]}
          onPress={nextStep}
        >
          <Text style={styles.primaryButtonText}>Next</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function MatchReadinessCard() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const readyCount = readinessChecks.filter((item) => checked[item]).length;
  const isReady = readyCount === readinessChecks.length;

  return (
    <Card>
      <Text style={styles.cardTitle}>Match readiness</Text>
      <Text style={styles.cardBody}>
        {isReady
          ? "Watim may prepare an explainable shortlist."
          : `${readyCount}/${readinessChecks.length} consent gates ready.`}
      </Text>
      {readinessChecks.map((item) => (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: Boolean(checked[item]) }}
          key={item}
          style={styles.consentRow}
          onPress={() =>
            setChecked((current) => ({ ...current, [item]: !current[item] }))
          }
        >
          <View
            style={[styles.checkbox, checked[item] && styles.checkboxActive]}
          />
          <Text style={styles.consentText}>{item}</Text>
        </Pressable>
      ))}
    </Card>
  );
}

function AgentLedgerCards() {
  return (
    <Card>
      <Text style={styles.cardTitle}>Agent ledger</Text>
      <Text style={styles.cardBody}>
        Product-state actions visible to the user before any human coordinator
        exists.
      </Text>
      {agentActionBaselines.map((item) => (
        <View style={styles.ledgerRow} key={item.key}>
          <View style={styles.ledgerTopline}>
            <Text style={styles.cardAgent}>{agentName(item.agentId)}</Text>
            <Pill state={item.status} />
          </View>
          <Text style={styles.ledgerAction}>{item.action}</Text>
          <Text style={styles.ledgerDetail}>{item.detail}</Text>
        </View>
      ))}
    </Card>
  );
}

function AccountTab({
  apiBaseUrl,
  nativeAuthReady,
}: {
  apiBaseUrl: string;
  nativeAuthReady: boolean;
}) {
  if (!nativeAuthReady) {
    return (
      <View style={styles.stack}>
        <Card>
          <Text style={styles.cardTitle}>Native auth gate</Text>
          <Text style={styles.cardBody}>
            Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY before running a device build.
            Until then, hosted sign-in stays available for review and QA.
          </Text>
        </Card>
        <AccountLinks apiBaseUrl={apiBaseUrl} />
      </View>
    );
  }

  return <AuthenticatedAccountTab apiBaseUrl={apiBaseUrl} />;
}

function AuthenticatedAccountTab({ apiBaseUrl }: { apiBaseUrl: string }) {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");

  if (!isLoaded) {
    return (
      <View style={styles.stack}>
        <Card>
          <Text style={styles.cardTitle}>Checking session</Text>
          <Text style={styles.cardBody}>
            Sakinah is reading the encrypted Clerk session from native secure
            storage.
          </Text>
        </Card>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View style={styles.stack}>
        <View style={styles.authSwitch}>
          <Tab
            label="Sign in"
            active={authMode === "sign-in"}
            onPress={() => setAuthMode("sign-in")}
          />
          <Tab
            label="Sign up"
            active={authMode === "sign-up"}
            onPress={() => setAuthMode("sign-up")}
          />
        </View>
        {authMode === "sign-in" ? <SignInForm /> : <SignUpForm />}
        <AccountLinks apiBaseUrl={apiBaseUrl} />
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <Card>
        <Text style={styles.cardTitle}>Signed in</Text>
        <Text style={styles.cardBody}>
          {user?.primaryEmailAddress?.emailAddress ??
            user?.fullName ??
            "Private Sakinah account"}
        </Text>
      </Card>
      <OnboardingGate />
      <DeviceKeyCard apiBaseUrl={apiBaseUrl} getToken={getToken} />
      <Pressable style={styles.primaryButton} onPress={() => void signOut()}>
        <Text style={styles.primaryButtonText}>Sign out</Text>
      </Pressable>
      <AccountLinks apiBaseUrl={apiBaseUrl} hideSignIn />
    </View>
  );
}

function DeviceKeyCard({
  apiBaseUrl,
  getToken,
}: {
  apiBaseUrl: string;
  getToken: () => Promise<string | null>;
}) {
  const [status, setStatus] = useState("No device key registered yet.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function register() {
    setIsSubmitting(true);
    setStatus("Registering this device...");
    try {
      const result = await registerMobileDeviceKey({ apiBaseUrl, getToken });
      setStatus(`Device ${result.fingerprint} registered.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Device registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function rotate() {
    setIsSubmitting(true);
    setStatus("Rotating local key...");
    try {
      await rotateMobileDeviceKey();
      const result = await registerMobileDeviceKey({ apiBaseUrl, getToken });
      setStatus(`Rotated to ${result.fingerprint}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Device rotation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>Device key</Text>
      <Text style={styles.cardBody}>{status}</Text>
      <View style={styles.buttonRow}>
        <Pressable
          disabled={isSubmitting}
          style={[styles.primaryButton, styles.rowButton, isSubmitting && styles.buttonDisabled]}
          onPress={() => void register()}
        >
          <Text style={styles.primaryButtonText}>Register</Text>
        </Pressable>
        <Pressable
          disabled={isSubmitting}
          style={[styles.secondaryButton, styles.rowButton, isSubmitting && styles.buttonDisabled]}
          onPress={() => void rotate()}
        >
          <Text style={styles.secondaryButtonText}>Rotate</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function OnboardingGate() {
  const [intent, setIntent] = useState<Intent>("seeker");
  const [location, setLocation] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("Tell the agents where to begin.");

  function onSave() {
    if (!location.trim()) {
      setStatus("City or region is required.");
      return;
    }
    if (!consent) {
      setStatus("Privacy consent is required before agents can start.");
      return;
    }
    setStatus(
      intent === "seeker"
        ? "Seeker path ready. Hafiz can begin verification."
        : "Family path ready. Adil can prepare consent boundaries.",
    );
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>Start Sakinah</Text>
      <Text style={styles.cardBody}>{status}</Text>
      <View style={styles.choiceRow}>
        <Choice
          active={intent === "seeker"}
          label="Seeker"
          onPress={() => setIntent("seeker")}
        />
        <Choice
          active={intent === "family"}
          label="Family"
          onPress={() => setIntent("family")}
        />
      </View>
      <AuthInput
        onChangeText={setLocation}
        placeholder="City or region"
        value={location}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        style={styles.consentRow}
        onPress={() => setConsent((current) => !current)}
      >
        <View style={[styles.checkbox, consent && styles.checkboxActive]} />
        <Text style={styles.consentText}>
          I agree Sakinah agents may use this profile state to prepare service
          steps.
        </Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={onSave}>
        <Text style={styles.primaryButtonText}>Save onboarding</Text>
      </Pressable>
    </Card>
  );
}

function Choice({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.choice, active && styles.choiceActive]}
      onPress={onPress}
    >
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SignInForm() {
  const { signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Use the same email you use on web.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    if (!emailAddress.trim() || !password) {
      setStatus("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Checking credentials...");

    try {
      const result = await signIn.password({
        emailAddress: emailAddress.trim(),
        password,
      });

      if (result.error) {
        setStatus(result.error.message ?? "Sign-in failed.");
        return;
      }

      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        setStatus("Signed in.");
        return;
      }

      setStatus("Additional verification is required.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>Sign in</Text>
      <Text style={styles.cardBody}>{status}</Text>
      <AuthInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmailAddress}
        placeholder="Email"
        value={emailAddress}
      />
      <AuthInput
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        value={password}
      />
      <Pressable
        disabled={isSubmitting}
        style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
        onPress={() => void onSubmit()}
      >
        <Text style={styles.primaryButtonText}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Text>
      </Pressable>
    </Card>
  );
}

function SignUpForm() {
  const { signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [status, setStatus] = useState("Create the private Sakinah account.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    if (!emailAddress.trim() || !password) {
      setStatus("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Creating account...");

    try {
      const result = await signUp.password({
        emailAddress: emailAddress.trim(),
        password,
      });

      if (result.error) {
        setStatus(result.error.message ?? "Sign-up failed.");
        return;
      }

      await signUp.verifications.sendEmailCode();
      setPendingVerification(true);
      setStatus("Enter the verification code sent to your email.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onVerify() {
    if (!code.trim()) {
      setStatus("Verification code is required.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Verifying email...");

    try {
      const result = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (result.error) {
        setStatus(result.error.message ?? "Verification failed.");
        return;
      }

      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        setStatus("Account verified.");
        return;
      }

      setStatus("Verification complete. Please sign in.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>Sign up</Text>
      <Text style={styles.cardBody}>{status}</Text>
      {!pendingVerification ? (
        <>
          <AuthInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmailAddress}
            placeholder="Email"
            value={emailAddress}
          />
          <AuthInput
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            value={password}
          />
          <Pressable
            disabled={isSubmitting}
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={() => void onSubmit()}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Creating..." : "Create account"}
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <AuthInput
            keyboardType="number-pad"
            onChangeText={setCode}
            placeholder="Email code"
            value={code}
          />
          <Pressable
            disabled={isSubmitting}
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={() => void onVerify()}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Verifying..." : "Verify email"}
            </Text>
          </Pressable>
        </>
      )}
    </Card>
  );
}

function AuthInput({
  autoCapitalize = "sentences",
  keyboardType = "default",
  onChangeText,
  placeholder,
  secureTextEntry = false,
  value,
}: {
  autoCapitalize?: "none" | "sentences";
  keyboardType?: "default" | "email-address" | "number-pad";
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  return (
    <TextInput
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.inkFaint}
      secureTextEntry={secureTextEntry}
      style={styles.input}
      value={value}
    />
  );
}

function AccountLinks({
  apiBaseUrl,
  hideSignIn = false,
}: {
  apiBaseUrl: string;
  hideSignIn?: boolean;
}) {
  return (
    <>
      {!hideSignIn && (
        <Pressable
          style={styles.primaryButton}
          onPress={() => Linking.openURL(`${apiBaseUrl}/sign-in`)}
        >
          <Text style={styles.primaryButtonText}>Open sign in</Text>
        </Pressable>
      )}
      <Pressable
        style={styles.secondaryButton}
        onPress={() => Linking.openURL(`${apiBaseUrl}/account/delete`)}
      >
        <Text style={styles.secondaryButtonText}>Delete account</Text>
      </Pressable>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => Linking.openURL(`${apiBaseUrl}/privacy`)}
      >
        <Text style={styles.secondaryButtonText}>Privacy policy</Text>
      </Pressable>
    </>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Pill({ state }: { state: AgentStageState }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{stateCopy[state]}</Text>
    </View>
  );
}

function TrustDot({ label }: { label: string }) {
  return (
    <View style={styles.trustDot}>
      <View style={styles.dot} />
      <Text style={styles.trustDotText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  page: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  wordmark: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
    fontSize: 34,
    fontStyle: "italic",
  },
  subtitle: {
    color: colors.inkFaint,
    fontSize: 11,
    letterSpacing: 0,
    marginTop: 2,
    textTransform: "uppercase",
  },
  trustDot: {
    alignItems: "center",
    backgroundColor: colors.paperSoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  trustDotText: {
    color: colors.inkMuted,
    fontSize: 12,
  },
  hero: {
    paddingVertical: 34,
  },
  eyebrow: {
    color: colors.inkFaint,
    fontSize: 12,
    letterSpacing: 0,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
    fontSize: 38,
    lineHeight: 43,
  },
  body: {
    color: colors.inkSoft,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 16,
  },
  tabs: {
    backgroundColor: colors.paperSoft,
    borderRadius: 14,
    flexDirection: "row",
    gap: 6,
    padding: 6,
  },
  authSwitch: {
    backgroundColor: colors.paperSoft,
    borderRadius: 14,
    flexDirection: "row",
    gap: 6,
    padding: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  rowButton: {
    flex: 1,
  },
  tab: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.ink,
  },
  stack: {
    gap: 12,
    paddingTop: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.rule,
    borderRadius: 10,
    borderWidth: 1,
    padding: 18,
  },
  cardTopline: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  step: {
    color: colors.inkFaint,
    fontSize: 13,
  },
  pill: {
    borderColor: colors.rule,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: colors.inkMuted,
    fontSize: 11,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
    fontSize: 25,
    lineHeight: 30,
    marginTop: 14,
  },
  cardAgent: {
    color: colors.inkFaint,
    fontSize: 12,
    marginTop: 8,
    textTransform: "uppercase",
  },
  cardBody: {
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  choice: {
    alignItems: "center",
    borderColor: colors.rule,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  choiceActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  choiceText: {
    color: colors.inkMuted,
    fontSize: 14,
  },
  choiceTextActive: {
    color: colors.paper,
  },
  consentRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  checkbox: {
    borderColor: colors.inkMuted,
    borderRadius: 5,
    borderWidth: 1,
    height: 20,
    marginTop: 1,
    width: 20,
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  consentText: {
    color: colors.inkMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  ledgerRow: {
    borderColor: colors.rule,
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 14,
  },
  ledgerTopline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  ledgerAction: {
    color: colors.ink,
    fontSize: 15,
    marginTop: 8,
  },
  ledgerDetail: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  arabic: {
    color: colors.inkMuted,
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
    fontSize: 22,
    fontStyle: "italic",
  },
  boundary: {
    borderColor: colors.rule,
    borderTopWidth: 1,
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
    paddingTop: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 10,
    marginTop: 2,
    paddingVertical: 15,
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  primaryButtonText: {
    color: colors.paper,
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.ink,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 15,
  },
});
