/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so Next doesn't pick up a parent lockfile.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
