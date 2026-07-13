/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // pg and bcryptjs need native Node.js bindings and must stay external.
  // pdfjs-dist is listed here so Turbopack / webpack never try to bundle it
  // — they leave it as a runtime require() from node_modules instead.
  // This is the key fix for the "Failed to load external module pdf-parse-HASH"
  // error on Vercel: we now import pdfjs-dist directly (lib/pdf-extract.ts)
  // instead of going through pdf-parse's root index.js.
  serverExternalPackages: ['bcryptjs', 'pg', 'pdfjs-dist'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
