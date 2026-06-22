import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { CookieBanner } from '@/components/cookie-banner';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PwaInstaller } from '@/components/pwa-installer';
import './globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ccscompta.fr'),
  title: {
    default: 'CCS Compta - Portail IA pour cabinets comptables',
    template: '%s | CCS Compta',
  },
  description:
    'Collecte client, OCR facture, pre-saisie comptable, validation cabinet et suivi des pieces dans un portail SaaS concu pour les cabinets comptables.',
  applicationName: 'CCS Compta',
  keywords: [
    'logiciel comptable IA',
    'portail client cabinet comptable',
    'collecte pieces comptables',
    'OCR facture',
    'pre-saisie comptable',
    'automatisation comptable',
    'SaaS expert-comptable',
  ],
  authors: [{ name: 'CCS Compta' }],
  creator: 'CCS Compta',
  publisher: 'CCS Compta',
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://ccscompta.fr',
    siteName: 'CCS Compta',
    title: 'CCS Compta - Portail IA pour cabinets comptables',
    description:
      'Une plateforme SaaS pour collecter les pieces clients, extraire les donnees par IA et fluidifier la production comptable.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CCS Compta - Portail IA pour cabinets comptables',
    description:
      'Collecte client, OCR facture, pre-saisie comptable et validation cabinet dans une seule plateforme.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CCS Compta',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased bg-fixed', fontSans.variable, fontDisplay.variable)} suppressHydrationWarning>
        <FirebaseClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PwaInstaller />
            {children}
            <Toaster />
            <CookieBanner />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
