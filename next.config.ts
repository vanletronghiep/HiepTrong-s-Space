import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.HOME_PREVIEW_BUILD === '1' ? '.next-preview' : '.next',
  serverExternalPackages: ['better-sqlite3'],
  devIndicators: false,
  async redirects() {
    return [
      { source: '/blogs', destination: '/writing', permanent: true },
      { source: '/blogs/:path*', destination: '/writing/:path*', permanent: true },
      { source: '/projects', destination: '/focus', permanent: true },
      { source: '/projects/:path*', destination: '/focus/:path*', permanent: true },
      { source: '/learning-room', destination: '/focus-room', permanent: true },
      { source: '/learning-room/:path*', destination: '/focus-room/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
