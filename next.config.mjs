/** @type {import('next').NextConfig} */
const nextConfig = {
  // The dev server only trusts requests from the host it was started
  // with (localhost, by default) and silently blocks JS/HMR for any
  // other origin. We visit it as 127.0.0.1 too — Spotify's redirect_uri
  // requires that exact host — so it needs to be allow-listed here or
  // every button on that origin looks dead (no handler ever attaches).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
