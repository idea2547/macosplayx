/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.celestiai.co' },
      { protocol: 'https', hostname: '*.pocketbase.io' },
    ],
  },
};

module.exports = nextConfig;
