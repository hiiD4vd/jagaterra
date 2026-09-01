import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, Oswald, Poppins } from 'next/font/google';
import MotionProvider from '@/components/MotionProvider';
import './globals.css';

// Oswald — display condensed bold; kiblat section GRASS-FED PREMIUM.
const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

// Poppins — geometric sans untuk body/label; kiblat FMM.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

// Fraunces — a warm, characterful "old-style" serif; the go-to for artisan /
// grass-fed food brands. Optical sizing on for large display headings.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
});

// Inter — clean humanist sans with excellent tabular figures for prices/labels.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jagaterra: Daging Sapi Grass-Fed Segar, Diantar Hari Ini | Jabodetabek',
  description:
    'Beli daging sapi segar grass-fed Australia dari Jagaterra: dibesarkan 30 bulan tanpa hormon, dipotong halal, dikirim rantai dingin, tidak pernah beku. Steak, iga, buntut, sumsum. Pesan via WhatsApp, diantar hari ini ke seluruh Jabodetabek.',
  keywords: [
    'daging sapi segar',
    'grass-fed beef Jakarta',
    'daging sapi grass-fed',
    'daging sapi premium Jabodetabek',
    'daging sapi halal',
    'jual daging sapi Australia',
    'steak grass-fed',
    'Jagaterra',
  ],
  openGraph: {
    title: 'Jagaterra: Daging Sapi Grass-Fed Segar, Diantar Hari Ini',
    description:
      'Daging sapi segar grass-fed Australia: 30 bulan tanpa hormon, halal, rantai dingin, tidak pernah beku. Diantar hari ini se-Jabodetabek.',
    type: 'website',
    locale: 'id_ID',
  },
};

export const viewport: Viewport = {
  themeColor: '#1d140f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${oswald.variable} ${poppins.variable} ${fraunces.variable} ${inter.variable}`}>
      <body className="bg-ink font-sans text-bone antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
