/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverExternalPackages: [
      'genkit', 
      '@genkit-ai/google-genai', 
      '@opentelemetry/sdk-node', 
      'require-in-the-middle',
      'import-in-the-middle'
    ],
  },
};

export default nextConfig;
