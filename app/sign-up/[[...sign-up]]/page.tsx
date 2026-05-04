import { SignUp } from "@clerk/nextjs";

// ASSUMPTION: same as sign-in — Clerk-hosted UI for PR-02. Replace if
// DECISIONS.md commits to a custom register flow.

export default function SignUpPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <SignUp />
    </main>
  );
}
