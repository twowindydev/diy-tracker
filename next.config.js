/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Unoptimized: Next 14.x has no patched release for the AVIF RCE
    // (GHSA-2xp9-vwfh-vxw4) in the built-in Image Optimization API, and this
    // app doesn't need on-the-fly resizing (photos are already reasonably
    // sized on upload). This makes the vulnerable code path unreachable.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
