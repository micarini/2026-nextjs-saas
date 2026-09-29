import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/session";
import { saveSpotifyCode } from "@/lib/spotify-api";

export async function GET(request) {
  const url = new URL(request.url);
  const user = await getCurrentUser();
  const state = request.cookies.get("spotify_oauth_state")?.value;
  const returnedState = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  if (!user || !code || !state || state !== returnedState || !state.startsWith(`${user.uid}:`)) {
    return NextResponse.json({ error: "Invalid Spotify authorization." }, { status: 400 });
  }

  await saveSpotifyCode(user.uid, code);
  const response = NextResponse.redirect(new URL("/dashboard/read?spotify=connected", url));
  response.cookies.delete("spotify_oauth_state");
  return response;
}
