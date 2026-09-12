import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { MotionProvider } from '@/providers/MotionProvider';

// Two faces, down from four.
//
// Inter was the declared body font and was overridden by nearly every element
// that used it; Quantico is a squared display face that was carrying body copy
// at 14-16px. Dropping both removes two font families from every page load and
// leaves one voice for the interface and one for its numbers.
//
// The loaded weights are the ONLY ones available: asking for 600 or 800 makes
// the browser synthesise a fake bold, which is what smeared the old headings.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '700'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bleed.up.railway.app'),
  title: {
    default: 'Bleed - See exactly what your subscriptions are costing you',
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
    title: 'Bleed - See exactly what your subscriptions are costing you',
    description:
      'Forward a receipt, Bleed reads it automatically. Get reminded before anything renews.',
    url: 'https://bleed.up.railway.app',
    siteName: 'Bleed',
    images: [
      {
        url: 'https://bleed.up.railway.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bleed',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bleed - See exactly what your subscriptions are costing you',
    description:
      'Forward a receipt, Bleed reads it automatically. Get reminded before anything renews.',
    images: ['https://bleed.up.railway.app/og-image.png'],
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
      data-scroll-behavior='smooth'
      className={`${spaceGrotesk.variable} ${plexMono.variable}`}
    >
      <body>
        <MotionProvider>
          <QueryProvider>{children}</QueryProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
