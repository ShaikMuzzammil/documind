import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pg'],
  eslint:     { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

export default config;
