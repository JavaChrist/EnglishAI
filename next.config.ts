import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Serwist injects a webpack config used by `next build --webpack` to
  // generate the service worker. In dev we run Turbopack; an empty
  // turbopack config silences the "webpack config with no turbopack config"
  // error (the SW is disabled in development anyway).
  turbopack: {},
};

export default withSerwist(nextConfig);
