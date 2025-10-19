import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Inter, Space_Grotesk } from "next/font/google"
import { cn } from "@/lib/utils"
import { ThemeProvider } from '@/components/theme-provider';
import { CookieBanner } from '@/components/cookie-banner';
import { FirebaseClientProvider } from '@/firebase/client-provider';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable, fontDisplay.variable)}>
        <FirebaseClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <CookieBanner />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
