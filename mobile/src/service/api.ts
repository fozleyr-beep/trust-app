type GetToken = () => Promise<string | null>;

export type MobileAgentAction = {
  action: string;
  agentName: string;
  detail: string | null;
  key: string;
  status: "live" | "ready" | "gate";
  subject: string | null;
};

export type MobileMatchSuggestion = {
  context: string;
  id: string;
  label: string;
  reason: string;
  status: string;
};

export async function saveMobileServiceProfile({
  apiBaseUrl,
  getToken,
  intent,
  location,
  privacyConsent,
  role,
}: {
  apiBaseUrl: string;
  getToken: GetToken;
  intent?: string;
  location: string;
  privacyConsent: boolean;
  role: "seeker" | "family";
}): Promise<{ profile: { readiness: string } }> {
  return authedJson({
    apiBaseUrl,
    body: {
      intent,
      location,
      privacyConsent,
      role,
    },
    getToken,
    method: "POST",
    path: "/api/service/profile",
  });
}

export async function runMobileServiceAgents({
  agentId,
  apiBaseUrl,
  getToken,
}: {
  agentId?: "hafiz" | "watim" | "adil" | "sabr";
  apiBaseUrl: string;
  getToken: GetToken;
}): Promise<{
  actions: MobileAgentAction[];
  matches: MobileMatchSuggestion[];
}> {
  return authedJson({
    apiBaseUrl,
    body: agentId ? { agentId } : {},
    getToken,
    method: "POST",
    path: "/api/service/agents/run",
  });
}

async function authedJson<T>({
  apiBaseUrl,
  body,
  getToken,
  method = "GET",
  path,
}: {
  apiBaseUrl: string;
  body?: unknown;
  getToken: GetToken;
  method?: "GET" | "POST";
  path: string;
}): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error("Missing Clerk token");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return (await response.json()) as T;
}
