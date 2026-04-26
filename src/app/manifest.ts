import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CCS Compta - Portail Client IA',
    short_name: 'CCS Compta',
    description: 'Scannez vos tickets de caisse et factures directement depuis votre smartphone, même hors connexion.',
    start_url: '/dashboard/scan',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
    ],
  }
}
