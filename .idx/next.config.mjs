/** @type {import('next').NextConfig} */
const nextConfig = {
  /* This helps Firebase handle large AI packages like Genkit */
  serverExternalPackages: ["@genkit-ai/core", "genkit"],
  
  // This allows your Digital ID to load images from Firebase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

module.exports = nextConfig;