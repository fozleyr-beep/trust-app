import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/trust",
  "/walkthrough",
  "/privacy",
  "/terms",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/webhooks/(.*)",
]);

function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

// Strict CSP. /trust says "no third-party analytics, no marketing pixels,
// no session-replay" — this header turns that into a runtime guarantee.
// Allowlist covers Clerk's hosted UI (`*.clerk.accounts.dev`) and Cloudflare
// Turnstile, which Clerk uses for bot challenges. If a prod Clerk host
// differs, add it here.
function buildCsp(nonce: string): string {
  const devScriptSource =
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const directives: string[] = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devScriptSource} https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
    // Next + Tailwind v4 inline some styles. There is no nonce path for
    // styles in Next.js today; 'unsafe-inline' for styles is the standard
    // tradeoff. Style-injection has a much smaller blast radius than
    // script-injection.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https://img.clerk.com`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.clerk.accounts.dev wss://*.clerk.accounts.dev https://clerk-telemetry.com`,
    `frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `worker-src 'self' blob:`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

function applySecurityHeaders(req: NextRequest): NextResponse {
  const nonce = makeNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads this on the request to nonce its own bundled scripts.
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return res;
}

// Clerk's middleware only invokes its callback when CLERK_SECRET_KEY is
// configured; otherwise it short-circuits with NextResponse.next() and our
// security headers never get applied. Mirror the conditional pattern from
// app/layout.tsx so the CSP runs unconditionally — with auth checks layered
// on top when Clerk is configured.
const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY);

const protectedHandler = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();
  }
  return applySecurityHeaders(req);
});

type ClerkHandler = (
  req: NextRequest,
  ev: unknown,
) => Response | Promise<Response>;

export default function middleware(req: NextRequest, ev: unknown) {
  if (clerkConfigured) {
    return (protectedHandler as unknown as ClerkHandler)(req, ev);
  }
  return applySecurityHeaders(req);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
