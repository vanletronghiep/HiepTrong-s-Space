import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.HOME_PREVIEW_BUILD === '1' ? '.next-preview' : '.next',
  serverExternalPackages: ['better-sqlite3'],
  devIndicators: false,
};

export default nextConfig;

