/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 16 uses Turbopack by default.
  // serverExternalPackages is the Turbopack-compatible way to keep
  // native Node.js packages (pdf-parse, bcryptjs, pg) out of the bundle.
  serverExternalPackages: ['pdf-parse', 'bcryptjs', 'pg'],

  // Empty turbopack config silences the "webpack config present but no turbopack config" error
  turbopack: {},

  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options',        value: 'DENY' },
        { key: 'X-Content-Type-Options',  value: 'nosniff' },
        { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};

module.exports = nextConfig;
