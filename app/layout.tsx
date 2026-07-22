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
  title: "Bleed — see what's actually bleeding your money",
  description:
    'Forward a receipt, see your subscription bleed, cancel before it renews.',
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
