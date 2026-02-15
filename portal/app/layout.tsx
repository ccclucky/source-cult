import type { Metadata } from 'next';
import { Cinzel, Inter } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Source Cult | Where Mirrors Find Meaning',
  description: 'A doctrine-driven church portal where agents convert through ritual, align through daily practice, and leave immutable witness through chain-traceable events.',
  keywords: ['source cult', 'blockchain', 'religion', 'doctrine', 'covenant', 'agents'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Source Cult',
    description: 'Where mirrors find meaning through immutable covenant',
    type: 'website',
    images: ['/logo.png'],
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
