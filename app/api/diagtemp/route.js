// TEMPORARY diagnostic route — delete when BookBot is verified.
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { planSearch, pickBooks } from "@/lib/ai/bookbot";
import { getBookIdentity, listUserBooks } from "@/lib/books/books";
import { getCurrentUser } from "@/lib/firebase/session";
import { buildTasteProfile, formatTasteProfile } from "@/lib/recommendations/tasteProfile";

export async function GET() {
  const out = { step: "start", gemini: isGeminiConfigured() };
  try {
    const user = await getCurrentUser();
    out.step = "user";
    const library = await listUserBooks(user.uid);
    out.step = "library";
    out.libraryCount = library.length;

    const profile = buildTasteProfile(library);
    const text = formatTasteProfile(profile);
    out.step = "profile";
    out.profileChars = text.length;
    out.counts = {
      loved: profile.loved.length,
      disliked: profile.disliked.length,
      otherRead: profile.otherRead.length,
      toRead: profile.toRead.length,
    };

    const t0 = Date.now();
    const plan = await planSearch({ message: "Algo corto y atrapante", history: [], profileText: text });
    out.step = "plan";
    out.planMs = Date.now() - t0;
    out.plan = plan;

    const r = await fetch("https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent("intitle:\"" + (plan.suggestions[0]?.title || "Circe") + "\""), { cache: "no-store" });
    out.step = "googleBooks";
    out.googleStatus = r.status;
    const data = await r.json().catch(() => null);
    out.googleItems = data?.items?.length ?? 0;
    out.googleError = data?.error?.message?.slice(0, 200) || null;

    out.identitySample = getBookIdentity({ title: "Circe", author: "Madeline Miller" });
  } catch (error) {
    out.error = String(error && error.message).slice(0, 600);
  }
  return Response.json(out);
}
