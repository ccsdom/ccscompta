import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Inter, Space_Grotesk } from "next/font/google"
import { cn } from "@/lib/utils"
import { ThemeProvider } from '@/components/theme-provider';
import { CookieBanner } from '@/components/cookie-banner';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PwaInstaller } from '@/components/pwa-installer';

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: 'CCS Compta',
  description: 'Téléchargez et traitez facilement des documents comptables.',
  manifest: '/manifest.webmanifest', // NextJS 15 compile manifest.ts en webmanifest
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CCS Compta',
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Expérience native : empêche le double-tap zoom
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased bg-fixed", fontSans.variable, fontDisplay.variable)} suppressHydrationWarning>
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
