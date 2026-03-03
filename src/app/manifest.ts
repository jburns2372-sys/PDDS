import { MetadataRoute } from 'next'
import { PDDS_LOGO_URL } from '@/lib/data'

export default function manifest(): MetadataRoute.Manifest {
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
