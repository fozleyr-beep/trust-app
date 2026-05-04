import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ASSUMPTION: /trust and / are public; everything else requires auth.
// Replace this matcher when handoff.yaml's route map lands.
const isPublic = createRouteMatcher([
  "/",
  "/trust",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
