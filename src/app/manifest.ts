import { MetadataRoute } from 'next'

/**
 * @fileOverview Web Manifest Configuration.
 * Hardcoded values to prevent module resolution errors during manifest generation.
 */
export default function manifest(): MetadataRoute.Manifest {
  const PDDS_LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/patriot-link-production.firebasestorage.app/o/PDDS_1024x1024.png?alt=media";
  
  return {
    name: 'PatriotLink | PDDS Official',
    short_name: 'PatriotLink',
    description: 'Dugong Dakilang Samahan tactical movement platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#002366',
    icons: [
      {
        src: PDDS_LOGO_URL,
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: PDDS_LOGO_URL,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: PDDS_LOGO_URL,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
