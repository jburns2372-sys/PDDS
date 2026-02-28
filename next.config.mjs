
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'genkit', 
      '@genkit-ai/google-genai', 
      '@genkit-ai/ai', 
      '@genkit-ai/core', 
      '@genkit-ai/flow',
      'require-in-the-middle'
    ],
  },
};

export default nextConfig;
