/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.celestiai.co' },
      { protocol: 'https', hostname: '*.pocketbase.io' },
    ],
  },
};

module.exports = nextConfig;
