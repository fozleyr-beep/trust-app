import { SignIn } from "@clerk/nextjs";

// ASSUMPTION: Clerk-hosted UI is acceptable for PR-02. If DECISIONS.md
// commits to a fully custom sign-in (matching the /trust visual register),
// replace with <ClerkProvider>'s elements API or the lower-level hooks.

export default function SignInPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <SignIn />
    </main>
  );
}
