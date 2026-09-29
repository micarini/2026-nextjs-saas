import "server-only";

import { getDb } from "@/lib/firebase/firestore";

const USERS = "users";
const SPOTIFY_ACCOUNTS = "spotifyAccount";
const SPOTIFY_GENRES = {
  fantasy: "soundtrack",
  romance: "romance",
  mystery_thriller: "mystery",
  horror: "dark ambient",
  science_fiction: "electronic",
  historical: "classical",
  non_fiction: "acoustic",
  biography: "singer-songwriter",
  poetry: "spoken word",
  young_adult: "pop",
  self_help: "ambient",
};

function config(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

export function spotifyConfigured() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET &&
      process.env.SPOTIFY_REDIRECT_URI,
  );
}

export function spotifyAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: config("SPOTIFY_CLIENT_ID"),
    response_type: "code",
    redirect_uri: config("SPOTIFY_REDIRECT_URI"),
    scope: "playlist-modify-private",
    state,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

async function tokenRequest(body) {
  const credentials = Buffer.from(
    `${config("SPOTIFY_CLIENT_ID")}:${config("SPOTIFY_CLIENT_SECRET")}`,
  ).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Spotify authorization failed.");
  }
  return response.json();
}

export async function saveSpotifyCode(uid, code) {
  const token = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: config("SPOTIFY_REDIRECT_URI"),
  });
  await getDb().collection(USERS).doc(uid).set({
    [SPOTIFY_ACCOUNTS]: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + (token.expires_in * 1000),
    },
  }, { merge: true });
}

async function getAccessToken(uid) {
  const snapshot = await getDb().collection(USERS).doc(uid).get();
  const account = snapshot.data()?.[SPOTIFY_ACCOUNTS];
  if (!account?.refreshToken) {
    return null;
  }
  if (account.expiresAt && account.expiresAt > Date.now() + 60_000) {
    return account.accessToken;
  }

  const token = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
  });
  await getDb().collection(USERS).doc(uid).set({
    [SPOTIFY_ACCOUNTS]: {
      ...account,
      accessToken: token.access_token,
      expiresAt: Date.now() + (token.expires_in * 1000),
    },
  }, { merge: true });
  return token.access_token;
}

export async function hasSpotifyConnection(uid) {
  const snapshot = await getDb().collection(USERS).doc(uid).get();
  return Boolean(snapshot.data()?.[SPOTIFY_ACCOUNTS]?.refreshToken);
}

export async function createReadingPlaylist(uid, { title, author, genre }) {
  const accessToken = await getAccessToken(uid);
  if (!accessToken) {
    throw new Error("Connect Spotify before creating a playlist.");
  }

  const search = await fetch(
    `https://api.spotify.com/v1/search?${new URLSearchParams({
      q: `genre:${SPOTIFY_GENRES[genre] || "ambient"}`,
      type: "track",
      limit: "50",
      market: "US",
    })}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!search.ok) {
    throw new Error("Spotify could not find songs for this genre.");
  }
  const tracks = (await search.json()).tracks?.items || [];
  const uris = tracks.map((track) => track.uri).filter(Boolean).slice(0, 30);
  if (!uris.length) {
    throw new Error("Spotify did not return songs for this genre.");
  }

  const playlist = await fetch("https://api.spotify.com/v1/me/playlists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `Reading: ${title}`,
      description: `A ${genre} reading playlist for ${title} by ${author}.`,
      public: false,
    }),
  });
  if (!playlist.ok) {
    throw new Error("Spotify could not create the playlist.");
  }
  const created = await playlist.json();

  const added = await fetch(`https://api.spotify.com/v1/playlists/${created.id}/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris }),
  });
  if (!added.ok) {
    throw new Error("Spotify could not add songs to the playlist.");
  }
  return { url: created.external_urls?.spotify || "" };
}
