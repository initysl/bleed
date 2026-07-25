import type { Metadata } from 'next';
import {
  Space_Grotesk,
  Inter,
  IBM_Plex_Mono,
  Quantico,
} from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500'],
});

const quantico = Quantico({
  subsets: ['latin'],
  variable: '--font-quantico',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bleed.up.railway.app'),
  title: {
    default: 'Bleed — See exactly what your subscriptions are costing you',
    template: '%s · Bleed',
  },
  description:
    'Forward a subscription receipt and Bleed logs it automatically — no manual entry. See your real monthly spend across every subscription, and get reminded before anything renews so you can decide to keep it or cancel.',
  keywords: [
    'subscription tracker',
    'subscription management',
    'cancel subscriptions',
    'recurring payments tracker',
    'subscription reminder app',
    'track monthly spending',
  ],
  authors: [{ name: 'Yusuf Lawal' }],
  openGraph: {
    title: 'Bleed — See exactly what your subscriptions are costing you',
    images: '/og-image.png',
    description:
      'Forward a receipt, Bleed reads it automatically. Get reminded before anything renews.',
    url: 'https://bleed.up.railway.app',
    siteName: 'Bleed',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bleed — See exactly what your subscriptions are costing you',
    images: '/og-image.png',
    description:
      'Forward a receipt, Bleed reads it automatically. Get reminded before anything renews.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} ${quantico.variable}`}
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
