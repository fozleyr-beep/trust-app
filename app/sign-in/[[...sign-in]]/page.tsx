import { SignIn } from "@clerk/nextjs";

// Clerk-hosted UI. Custom sign-in matching /trust's visual register is a
// later track if the visual identity is locked.

export default function SignInPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <SignIn />
    </main>
  );
}
