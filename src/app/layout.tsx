import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SIMPATIK - Sistem Informasi Manajemen PKK & Tertib Administrasi Keluarga',
  description: 'Inisiatif Program Inovasi & Pengabdian Masyarakat Bhakti Grisa, Desa Grudo, Ngawi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
