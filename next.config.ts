import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: ['pdf-parse','pg','@pg-native'],
  eslint:     { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  experimental: {
    optimizePackageImports: ['lucide-react','recharts','framer-motion'],
  },
};

export default config;
