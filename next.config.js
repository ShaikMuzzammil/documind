/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep only packages that truly need native Node.js bindings.
  // pdf-parse is intentionally EXCLUDED here — it must be bundled inline
  // by webpack/Turbopack so the alias below can redirect it to the lib
  // entry that doesn't execute test-runner code on import (the root
  // index.js loads test PDFs at require-time, which fails on Vercel).
  serverExternalPackages: ['bcryptjs', 'pg'],

  // Turbopack alias (Next.js 16 production builds on Vercel)
  turbopack: {
    resolveAlias: {
      'pdf-parse': './node_modules/pdf-parse/lib/pdf-parse.js',
    },
  },

  // Webpack alias (fallback / local dev)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdf-parse': require.resolve('pdf-parse/lib/pdf-parse.js'),
    };
    return config;
  },

  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options',       value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};

module.exports = nextConfig;
