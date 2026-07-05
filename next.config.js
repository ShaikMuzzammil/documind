/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep these packages out of the serverless bundle — Node.js require() will handle them
  serverExternalPackages: ['pdf-parse', 'bcryptjs', 'pg'],

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

  webpack(config, { isServer }) {
    if (isServer) {
      // Prevent webpack from trying to bundle pdf-parse — it uses require() internally
      if (Array.isArray(config.externals)) {
        config.externals.push('pdf-parse');
      } else if (typeof config.externals === 'object') {
        config.externals['pdf-parse'] = 'commonjs pdf-parse';
      }
    }
    return config;
  },
};

module.exports = nextConfig;
