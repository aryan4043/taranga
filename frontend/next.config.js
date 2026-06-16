/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/users/:path*',
        destination: 'http://user-service:5002/api/users/:path*',
      },
      {
        source: '/api/marketplace/:path*',
        destination: 'http://user-service:5002/api/marketplace/:path*',
      },
      {
        source: '/api/treks/:path*',
        destination: 'http://trek-service:5001/api/treks/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
