// Turns a pasted open.spotify.com link (track/album/playlist/episode) into
// an embeddable player URL. Uses Spotify's official oEmbed-style iframe
// widget — no API key, no OAuth. See README-handoff.md for why this was
// chosen over the full Web Playback SDK for now.
// Spotify's own official "Peaceful Piano" editorial playlist — used as the
// default focus soundtrack for any book that doesn't have its own link set.
export const DEFAULT_FOCUS_PLAYLIST_URL = "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ";

const SPOTIFY_URL_PATTERN =
  /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/;

export function toSpotifyEmbedUrl(spotifyUrl) {
  if (!spotifyUrl) {
    return null;
  }

  const match = SPOTIFY_URL_PATTERN.exec(spotifyUrl);

  if (!match) {
    return null;
  }

  const [, type, id] = match;
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}
