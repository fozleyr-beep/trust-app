// Pure validation for the message-fanout endpoint. Extracted from the
// route handler so we can lock its behaviour with unit tests — see
// lib/messaging/authz.test.ts. The runtime in
// app/api/threads/[id]/messages/route.ts wires this up against the live DB.
//
// The contract: a sender may only fan out a message to recipient device
// keys that (a) exist and (b) belong to a current member of the thread.
// A thread member marked observer can receive ciphertext but cannot send.
// Anything else is a pollution / exfiltration vector and must be rejected
// at write time.

export type FanoutEntry = {
  recipientDeviceKeyId: string;
};

export type DeviceLookup = {
  id: string;
  userId: string;
};

export type ThreadMemberRole = "participant" | "observer";

export type FanoutValidation =
  | { ok: true }
  | { ok: false; status: 400; error: string }
  | { ok: false; status: 403; error: string };

export function validateFanout(args: {
  fanout: FanoutEntry[];
  senderRole?: ThreadMemberRole;
  targetDevices: DeviceLookup[];
  threadMemberUserIds: string[];
}): FanoutValidation {
  if (args.senderRole === "observer") {
    return {
      ok: false,
      status: 403,
      error: "observer members cannot send messages",
    };
  }

  if (args.fanout.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "fanout must be a non-empty array",
    };
  }

  const requestedIds = args.fanout.map((f) => f.recipientDeviceKeyId);
  const foundIds = new Set(args.targetDevices.map((d) => d.id));

  for (const id of requestedIds) {
    if (!foundIds.has(id)) {
      return {
        ok: false,
        status: 400,
        error: "one or more recipientDeviceKeyId are unknown",
      };
    }
  }

  // Detect duplicate requestedIds — keep the row count honest, prevent
  // amplification.
  if (new Set(requestedIds).size !== requestedIds.length) {
    return {
      ok: false,
      status: 400,
      error: "duplicate recipientDeviceKeyId in fanout",
    };
  }

  const memberSet = new Set(args.threadMemberUserIds);
  for (const d of args.targetDevices) {
    if (!memberSet.has(d.userId)) {
      return {
        ok: false,
        status: 403,
        error:
          "recipientDeviceKeyId belongs to a user who is not a member of this thread",
      };
    }
  }

  return { ok: true };
}
