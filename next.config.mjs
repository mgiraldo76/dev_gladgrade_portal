/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
