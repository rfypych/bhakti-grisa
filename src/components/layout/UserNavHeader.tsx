'use client';

import React from 'react';
import Link from 'next/link';
import { logoutAction } from '@/actions/authActions';
import { LogOut, LogIn, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
      <Button asChild variant="outline" size="sm" className="min-h-touch text-sm">
        <Link href="/login">
          <LogIn className="size-4" data-icon="inline-start" />
          <span>Masuk Petugas</span>
        </Link>
      </Button>
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
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5">
          <UserCheck className="size-4 text-primary" />
          <span>{user.nama}</span>
        </span>
        <Badge variant="secondary" className="mt-0.5 text-xs font-semibold px-2 py-0.5">
          {roleLabel}
        </Badge>
      </div>

      <form action={() => logoutAction()}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="min-h-touch text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
          title="Keluar dari akun pengelola"
        >
          <LogOut className="size-4" data-icon="inline-start" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </form>
    </div>
  );
}
