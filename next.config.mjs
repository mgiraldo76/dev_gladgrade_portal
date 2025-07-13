// File: next.config.mjs
// Path: next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['firebasestorage.googleapis.com', 'blob.v0.dev'],
    unoptimized: true,
  },
  
  // Conditional configuration based on environment
  ...(process.env.NODE_ENV === 'production' && {
    // Production: Enable static export for Firebase Hosting
    output: 'export',
  }),
  
  // Development: Enable API proxy
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      if (process.env.NEXT_PUBLIC_API_URL) {
        console.log(`🔄 Proxying API calls to: ${process.env.NEXT_PUBLIC_API_URL}`)
        return [
          {
            source: '/api/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
          },
        ]
      }
      return []
    },
  }),
};

export default nextConfig;