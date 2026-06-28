import type { NextConfig } from 'next';

const config: NextConfig = {
  // Required for pdf-parse and pg to work in server routes
  serverExternalPackages: ['pdf-parse', 'pg'],

  // Strict lint/type checking on every build
  eslint:     { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY'        },
          { key: 'X-Content-Type-Options',     value: 'nosniff'     },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default config;
