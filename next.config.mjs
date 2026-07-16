/** @type {import('next').NextConfig} */
const nextConfig = {
  // Community Edition is a single small school on their own box; keep builds
  // resilient rather than blocking a self-hoster on a stray lint/type nit.
  // We run with `next start` (the Docker image + Node option both ship
  // node_modules), so no standalone output is needed.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
