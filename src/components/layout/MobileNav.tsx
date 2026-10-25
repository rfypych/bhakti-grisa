'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  ClipboardList,
  Activity,
  MapPin,
  Layers,
  Users,
  Menu,
  X,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
  userRole?: string | null;
}

/**
 * Mobile navigation menu for the top header.
 */
export function MobileNav({ userRole }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: 'Beranda Utama', Icon: Home, show: true },
    { href: '/formulir', label: 'Isi Formulir Keluarga', Icon: PlusCircle, show: true },
    { href: '/dashboard', label: 'Dashboard Statistik', Icon: Home, show: true },
    {
      href: '/dashboard/verifikasi',
      label: 'Antrean Verifikasi Data',
      Icon: ClipboardList,
      show: userRole === 'ADMIN_DESA' || userRole === 'KADER_RT',
    },
    { href: '/dashboard/lapor-peristiwa', label: 'Lapor Peristiwa Vital', Icon: Activity, show: true },
    { href: '/dashboard/peta', label: 'Peta Spasial Rumah Sehat', Icon: MapPin, show: true },
    {
      href: '/dashboard/wilayah',
      label: 'Manajemen Wilayah',
      Icon: Layers,
      show: userRole === 'ADMIN_DESA',
    },
    {
      href: '/dashboard/pengguna',
      label: 'Manajemen Akun Pengguna',
      Icon: Users,
      show: userRole === 'ADMIN_DESA',
    },
  ].filter((l) => l.show);

  return (
    <div className="relative xl:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={open ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="min-h-touch min-w-touch rounded-md"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open && (
        <div
          className="fixed inset-0 top-16 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <nav
            className="w-full max-w-xs bg-background border-r border-border h-full p-4 flex flex-col gap-1.5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pb-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Navigasi SIMPATIK
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
              {links.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted/80 transition-colors min-h-[48px]"
                >
                  <Icon className="size-5 text-primary shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <a
                href="/api/export/excel"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-semibold text-foreground bg-secondary hover:bg-accent transition-colors min-h-[48px]"
              >
                <FileSpreadsheet className="size-4 text-primary" />
                <span>Unduh Rekapitulasi Excel</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
