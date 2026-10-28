import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
