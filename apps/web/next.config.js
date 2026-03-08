/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@qbms/shared'],
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/:path*` },
      { source: '/health/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/health/:path*` },
    ];
  },
};

module.exports = nextConfig;
