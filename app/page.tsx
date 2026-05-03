import { redirect } from "next/navigation";

// ASSUMPTION: until later PRs land the marketing/app shell, "/" goes to /trust.
// Replace this redirect when the home page is scoped in CLAUDE_CODE_PROMPT.md.
export default function RootPage(): never {
  redirect("/trust");
}
