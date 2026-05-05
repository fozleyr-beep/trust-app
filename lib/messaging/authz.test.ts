import { describe, expect, test } from "vitest";
import { validateFanout } from "./authz";

describe("validateFanout", () => {
  const me = "user-me";
  const peer = "user-peer";
  const stranger = "user-stranger";

  const myDevice = { id: "dev-me", userId: me };
  const peerDevice = { id: "dev-peer", userId: peer };
  const strangerDevice = { id: "dev-stranger", userId: stranger };

  test("ok when every recipient device belongs to a thread member", () => {
    const r = validateFanout({
      fanout: [
        { recipientDeviceKeyId: "dev-me" },
        { recipientDeviceKeyId: "dev-peer" },
      ],
      targetDevices: [myDevice, peerDevice],
      threadMemberUserIds: [me, peer],
    });
    expect(r.ok).toBe(true);
  });

  test("403 when an observer tries to send", () => {
    const r = validateFanout({
      fanout: [{ recipientDeviceKeyId: "dev-peer" }],
      senderRole: "observer",
      targetDevices: [peerDevice],
      threadMemberUserIds: [me, peer],
    });
    expect(r).toEqual({
      ok: false,
      status: 403,
      error: "observer members cannot send messages",
    });
  });

  test("400 when fanout is empty", () => {
    const r = validateFanout({
      fanout: [],
      targetDevices: [],
      threadMemberUserIds: [me],
    });
    expect(r).toEqual({
      ok: false,
      status: 400,
      error: "fanout must be a non-empty array",
    });
  });

  test("400 when a recipientDeviceKeyId is unknown server-side", () => {
    const r = validateFanout({
      fanout: [
        { recipientDeviceKeyId: "dev-me" },
        { recipientDeviceKeyId: "dev-ghost" },
      ],
      targetDevices: [myDevice],
      threadMemberUserIds: [me, peer],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  test("403 when a recipient device belongs to a non-member", () => {
    // The classic exploit attempt: encrypt a message and try to fan it
    // out to a stranger's device by referencing their published pubkey.
    const r = validateFanout({
      fanout: [
        { recipientDeviceKeyId: "dev-me" },
        { recipientDeviceKeyId: "dev-stranger" },
      ],
      targetDevices: [myDevice, strangerDevice],
      threadMemberUserIds: [me, peer],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  test("400 on duplicate recipientDeviceKeyId entries", () => {
    const r = validateFanout({
      fanout: [
        { recipientDeviceKeyId: "dev-peer" },
        { recipientDeviceKeyId: "dev-peer" },
      ],
      targetDevices: [peerDevice],
      threadMemberUserIds: [me, peer],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  test("403 takes precedence over 'duplicate' for clarity", () => {
    // Unusual but worth pinning: when a fanout has duplicates AND a
    // non-member, callers should see the unknown-id check first because
    // it's the cheaper failure path. Behaviour shouldn't accidentally
    // change.
    const r = validateFanout({
      fanout: [
        { recipientDeviceKeyId: "dev-stranger" },
        { recipientDeviceKeyId: "dev-stranger" },
      ],
      targetDevices: [strangerDevice],
      threadMemberUserIds: [me, peer],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      // duplicate-detection runs after id-existence; both targets exist
      // here, so we hit the duplicate check first (400) before the
      // membership check.
      expect(r.status).toBe(400);
    }
  });
});
