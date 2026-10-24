'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, ClipboardList, Activity, MapPin, Layers, Users, Menu, X } from 'lucide-react';

interface MobileNavProps {
  userRole?: string | null;
}

/**
 * Mobile navigation for the app header.
 */
export function MobileNav({ userRole }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', Icon: Home, show: true },
    {
      href: '/dashboard/verifikasi',
      label: 'Verifikasi',
      Icon: ClipboardList,
      show: userRole === 'ADMIN_DESA' || userRole === 'KADER_RT',
    },
    { href: '/dashboard/lapor-peristiwa', label: 'Lapor Peristiwa', Icon: Activity, show: true },
    { href: '/dashboard/peta', label: 'Peta Spasial', Icon: MapPin, show: true },
    {
      href: '/dashboard/wilayah',
      label: 'Wilayah',
      Icon: Layers,
      show: userRole === 'ADMIN_DESA',
    },
    {
      href: '/dashboard/pengguna',
      label: 'Pengguna',
      Icon: Users,
      show: userRole === 'ADMIN_DESA',
    },
  ].filter((l) => l.show);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={open ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <nav className="absolute left-0 top-full mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-50">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-700 hover:text-emerald-800 hover:bg-stone-100 transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
