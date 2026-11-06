import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.HOME_PREVIEW_BUILD === '1' ? 'build' : '.next',
  serverExternalPackages: ['better-sqlite3'],
  devIndicators: false,
};

export default nextConfig;

