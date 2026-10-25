'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, LayoutDashboard, ClipboardList, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomBarProps {
  userRole?: string | null;
}

export function MobileBottomBar({ userRole }: MobileBottomBarProps) {
  const pathname = usePathname();

  const isKaderOrAdmin = userRole === 'ADMIN_DESA' || userRole === 'KADER_RT';

  const items = [
    {
      href: '/',
      label: 'Beranda',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      href: '/formulir',
      label: 'Formulir',
      icon: PlusCircle,
      isActive: pathname.startsWith('/formulir'),
      highlight: true,
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    ...(isKaderOrAdmin
      ? [
          {
            href: '/dashboard/verifikasi',
            label: 'Verifikasi',
            icon: ClipboardList,
            isActive: pathname.startsWith('/dashboard/verifikasi'),
          },
        ]
      : [
          {
            href: '/dashboard/lapor-peristiwa',
            label: 'Peristiwa',
            icon: Activity,
            isActive: pathname.startsWith('/dashboard/lapor-peristiwa'),
          },
        ]),
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Ponsel"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 border-t border-border md:hidden print:hidden safe-area-bottom shadow-lg"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto px-1 items-center">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center h-full min-h-touch gap-1 text-[11px] font-semibold transition-colors',
                item.isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground',
                item.highlight && !item.isActive && 'text-primary'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center p-1 rounded-full transition-colors',
                  item.isActive && 'bg-primary/10'
                )}
              >
                <Icon className={cn('size-5', item.isActive ? 'text-primary' : 'text-current')} />
              </div>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
