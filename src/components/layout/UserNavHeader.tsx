'use client';

import React from 'react';
import Link from 'next/link';
import { logoutAction } from '@/actions/authActions';
import { User, LogOut, LogIn, Shield } from 'lucide-react';

interface UserNavHeaderProps {
  user: {
    nama: string;
    username: string;
    peran: string;
    wilayah?: {
      dusun: string;
      rw: string;
      rt: string;
      namaDasawisma: string;
    } | null;
  } | null;
}

export function UserNavHeader({ user }: UserNavHeaderProps) {
  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
      >
        <LogIn className="w-3.5 h-3.5 text-stone-500" />
        <span>Masuk Petugas</span>
      </Link>
    );
  }

  const ROLE_NAMES: Record<string, string> = {
    ADMIN_DESA: 'Admin Desa',
    PENGURUS_DUSUN: user.wilayah ? `Pengurus ${user.wilayah.dusun}` : 'Pengurus Dusun',
    PENGURUS_RW: user.wilayah ? `Pengurus RW ${user.wilayah.rw}` : 'Pengurus RW',
    KADER_RT: user.wilayah ? `Kader RT ${user.wilayah.rt} (${user.wilayah.namaDasawisma})` : 'Kader RT',
  };

  const roleLabel = ROLE_NAMES[user.peran] || user.peran;

  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-xs font-bold text-stone-800 leading-tight">
          {user.nama}
        </span>
        <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          {roleLabel}
        </span>
      </div>

      <button
        onClick={() => logoutAction()}
        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
        title="Keluar dari akun"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Keluar</span>
      </button>
    </div>
  );
}
