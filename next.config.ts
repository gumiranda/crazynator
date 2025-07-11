import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    dirs: ['src/app', 'src/components', 'src/hooks', 'src/lib', 'src/trpc'],
  },
};

export default nextConfig;
