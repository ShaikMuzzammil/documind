/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // These packages must run in the native Node.js runtime.
  //
  // bcryptjs / pg: native bindings that can't be bundled by Turbopack.
  //
  // pdfjs-dist: listed here so Turbopack / webpack never try to bundle it.
  //   pdfjs-dist ships with large binary assets and workers that break when
  //   bundled. Marking it external means Node.js loads it directly from
  //   node_modules at runtime — exactly what we want in a Vercel function.
  //   The /legacy/build/pdf.js entry (available in pdfjs-dist v3+) provides
  //   a CJS build with no Web Worker requirement.
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
