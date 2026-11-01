import type { Metadata } from 'next';
import {
  Space_Grotesk,
  Inter,
  IBM_Plex_Mono,
  Quantico,
} from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { THEME_SCRIPT } from '@/lib/theme';

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
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} ${quantico.variable}`}
      // The inline script writes data-theme onto this element before React
      // hydrates, so the server's markup and the live DOM necessarily differ
      // here. That is the point of it, not a bug — this tells React to stop
      // warning about this one element's attributes.
      suppressHydrationWarning
    >
      <head>
        {/* Must be blocking and must come before any painted content. Moving
            this into a component or an effect reintroduces the flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Seeded light; ThemeProvider rewrites it from the resolved theme. */}
        <meta name='theme-color' content='#f7f8f6' />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
