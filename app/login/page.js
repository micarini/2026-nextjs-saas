import { redirect } from "next/navigation";

// Sign-in now lives at "/" (the onboarding flow handles both new and
// returning users). Keep this route around as a redirect for old
// links/bookmarks rather than letting it 404.
export default function LoginPage() {
  redirect("/");
}
