/**
 * Root Layout
 * Application shell with global providers
 */

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// =============================================================================
// FONTS
// =============================================================================

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: 'IDTA Form Studio',
  description:
    'Industrial-grade form editor for IDTA Submodel Templates. Create, edit, and export AAS V3.0 compliant submodels.',
  keywords: [
    'AAS',
    'Asset Administration Shell',
    'IDTA',
    'Submodel',
    'Industry 4.0',
    'Digital Twin',
    'BaSyx',
  ],
  authors: [{ name: 'IDTA Form Studio' }],
};

// =============================================================================
// LAYOUT
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
