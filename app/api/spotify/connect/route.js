import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/session";
import { spotifyAuthorizeUrl, spotifyConfigured } from "@/lib/spotify-api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
  if (!spotifyConfigured()) {
    return NextResponse.json({ error: "Spotify integration is not configured." }, { status: 503 });
  }

  const state = `${user.uid}:${randomUUID()}`;
  const response = NextResponse.redirect(spotifyAuthorizeUrl(state));
  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
