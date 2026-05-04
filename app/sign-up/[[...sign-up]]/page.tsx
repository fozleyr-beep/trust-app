import { SignUp } from "@clerk/nextjs";

// Clerk-hosted UI; matches /sign-in.

export default function SignUpPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <SignUp />
    </main>
  );
}
