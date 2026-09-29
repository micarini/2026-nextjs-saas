import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/session";
import { createReadingPlaylist } from "@/lib/spotify-api";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const playlist = await createReadingPlaylist(user.uid, body);
    return NextResponse.json(playlist);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not create playlist." }, { status: 400 });
  }
}
