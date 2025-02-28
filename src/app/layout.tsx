import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Timber & Threads Retreat',
  description: 'A serene quilting retreat in West Central Missouri where creativity flourishes and friendships form.',
  metadataBase: new URL('https://timber-threads-retreat.vercel.app'),
  openGraph: {
    title: 'Timber & Threads Retreat',
    description: 'A serene quilting retreat in West Central Missouri where creativity flourishes and friendships form.',
    images: [
      {
        url: '/assets/logo.png',
        width: 1200,
        height: 630,
        alt: 'Timber & Threads Retreat Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Timber & Threads Retreat',
    description: 'A serene quilting retreat in West Central Missouri where creativity flourishes and friendships form.',
    images: ['/assets/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {children}
        {/* Footer removed to prevent it from covering gallery options */}
      </body>
    </html>
  );
}
