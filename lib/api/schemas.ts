import { z } from "zod";

// Shared validators for every API body. Keeping them here means a /trust
// reviewer can audit the entire wire surface in one file.

const Base64 = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, "must be base64");

export const RegisterDevice = z.object({
  deviceId: z.string().min(1).max(64),
  publicKey: Base64,
});

export const SenderKeysRequest = z.object({
  userIds: z.array(z.uuid()).min(1).max(100),
});

export const SendMessage = z.object({
  fanout: z
    .array(
      z.object({
        recipientDeviceKeyId: z.uuid(),
        ciphertext: Base64,
        nonce: Base64,
      }),
    )
    .min(1)
    .max(50),
});

export const AgentRequest = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(50),
});

export const ServiceProfileInput = z.object({
  role: z.enum(["seeker", "family"]).default("seeker"),
  location: z.string().trim().min(2).max(120),
  intent: z.string().trim().min(2).max(240).optional(),
  familyContext: z.string().trim().max(600).optional(),
  preferences: z.string().trim().max(1200).optional(),
  privacyConsent: z.literal(true),
});

export const RunServiceAgentsInput = z.object({
  agentId: z.enum(["hafiz", "watim", "adil", "sabr"]).optional(),
});

export const MatchResponseInput = z.object({
  response: z.enum(["request_salaam", "dismiss"]),
});

export const SalaamResponseInput = z.object({
  response: z.enum(["accept", "decline"]),
});

export type RegisterDevice = z.infer<typeof RegisterDevice>;
export type SenderKeysRequest = z.infer<typeof SenderKeysRequest>;
export type SendMessage = z.infer<typeof SendMessage>;
export type AgentRequest = z.infer<typeof AgentRequest>;
export type ServiceProfileInput = z.infer<typeof ServiceProfileInput>;
export type RunServiceAgentsInput = z.infer<typeof RunServiceAgentsInput>;
export type MatchResponseInput = z.infer<typeof MatchResponseInput>;
export type SalaamResponseInput = z.infer<typeof SalaamResponseInput>;
