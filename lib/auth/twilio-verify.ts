import "server-only";

type VerifyChannel = "sms" | "call" | "whatsapp";

type TwilioVerifyConfig = {
  accountSid: string;
  authToken: string;
  serviceSid: string;
};

export type TwilioVerification = {
  sid: string;
  status: string;
  to: string;
  channel: string;
};

export class TwilioVerifyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function isTwilioVerifyConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(
    env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_VERIFY_SERVICE_SID,
  );
}

export async function startTwilioVerification({
  to,
  channel = "sms",
}: {
  to: string;
  channel?: VerifyChannel;
}): Promise<TwilioVerification> {
  return twilioVerifyRequest("Verifications", {
    To: to,
    Channel: channel,
  });
}

export async function checkTwilioVerification({
  to,
  code,
}: {
  to: string;
  code: string;
}): Promise<TwilioVerification> {
  return twilioVerifyRequest("VerificationCheck", {
    To: to,
    Code: code,
  });
}

async function twilioVerifyRequest(
  resource: "Verifications" | "VerificationCheck",
  params: Record<string, string>,
): Promise<TwilioVerification> {
  const config = readConfig();
  const body = new URLSearchParams(params);
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${config.serviceSid}/${resource}`,
    {
      method: "POST",
      headers: {
        Authorization: basicAuth(config),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const payload = (await res.json().catch(() => ({}))) as Partial<{
    sid: string;
    status: string;
    to: string;
    channel: string;
    message: string;
  }>;

  if (!res.ok) {
    throw new TwilioVerifyError(
      res.status,
      payload.message ?? "Twilio Verify request failed",
    );
  }

  if (!payload.sid || !payload.status || !payload.to || !payload.channel) {
    throw new TwilioVerifyError(502, "Twilio Verify returned an invalid shape");
  }

  return {
    sid: payload.sid,
    status: payload.status,
    to: payload.to,
    channel: payload.channel,
  };
}

function readConfig(env: NodeJS.ProcessEnv = process.env): TwilioVerifyConfig {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const serviceSid = env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) {
    throw new TwilioVerifyError(503, "Twilio Verify is not configured");
  }
  return { accountSid, authToken, serviceSid };
}

function basicAuth(config: TwilioVerifyConfig): string {
  const token = Buffer.from(
    `${config.accountSid}:${config.authToken}`,
  ).toString("base64");
  return `Basic ${token}`;
}
