import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Dev and the production build keep separate output folders so both can run
  // at once: `next dev` on 3090 for us, `next start` on 2002 for the client.
  // Sharing `.next` would mean the dev server overwrites the build the client
  // is being served from, the first time a file changes.
  //
  // Next sets NODE_ENV itself — development for `next dev`, production for
  // `next build` and `next start` — so the two always agree without an env
  // var to remember to pass.
  distDir: process.env.NODE_ENV === "development" ? ".next" : ".next-prod",
};

export default nextConfig;
