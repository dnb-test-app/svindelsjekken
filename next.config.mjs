/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  distDir: '.next',

  // Note: Body size limits for App Router API routes are handled at the platform level (Vercel, etc.)
  // Client-side compression should keep uploads under default limits

  // Cache control headers
  async headers() {
    return [
      {
        // API routes - minimal caching for latest fraud detection rules
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Main app pages - short cache with revalidation
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, must-revalidate', // 5 minutes cache
          },
        ],
      },
    ];
  },
};

export default nextConfig;