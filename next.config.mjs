/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
    experimental: {
        allowedDevOrigins: [
            "https://6000-firebase-studio-1771944132599.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev"
        ],
    },
};

export default nextConfig;
