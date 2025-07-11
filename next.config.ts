import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
