import { redirect } from "next/navigation";

// `/` is marketing-first: every visitor lands on /trust. Authed users
// navigate to /app from there.
export default function RootPage(): never {
  redirect("/trust");
}
