/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    // This allows Next.js to fetch from your local machine
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1', // Use the IP version too
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
    ],
  },

};

export default nextConfig;
