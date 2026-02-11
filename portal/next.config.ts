import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  },
  serverExternalPackages: ['node:sqlite']
};

export default nextConfig;
