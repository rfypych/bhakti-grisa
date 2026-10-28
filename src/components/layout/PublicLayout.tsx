'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppRoute, OfficerAccount, UserRole, getRbacPermissions } from '@/lib/domain';
import { BoardButton, BoardChip, BoardLogo } from '@/components/boardui';

export interface PublicLayoutProps {
  currentRoute?: AppRoute;
  onNavigate?: (route: AppRoute, params?: { wilayahId?: string; cetakId?: string }) => void;
  currentUser?: OfficerAccount | null;
  currentRole?: UserRole;
  children: React.ReactNode;
}

export function PublicLayout({
  currentRoute,
  onNavigate,
  currentUser = null,
  currentRole = 'WARGA',
  children,
}: PublicLayoutProps) {
  let pathname = '/';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pathname = usePathname() || '/';
  } catch {
    // Fallback when outside router context (e.g. tests)
  }

  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRoute: AppRoute =
    currentRoute ||
    (pathname === '/' ||
    pathname.startsWith('/formulir') ||
    pathname.startsWith('/tentang') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/dashboard')
      ? (pathname as AppRoute)
      : '/');

  const perms = getRbacPermissions(currentRole, currentUser);

  const handleRouteClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    route: AppRoute,
    params?: { wilayahId?: string; cetakId?: string }
  ) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(route, params);
    }
  };

  const navItems: { route: AppRoute; label: string }[] = [
    { route: '/', label: 'Beranda' },
    { route: '/formulir', label: 'Formulir Mandiri' },
    { route: '/tentang', label: 'Tentang Inisiatif' },
    {
      route: '/login',
      label: currentUser ? `Petugas (${currentUser.username})` : 'Masuk Petugas',
    },
  ];

  return (
    <div
      data-boardui-layout="public"
      className="min-h-screen flex flex-col bg-background-full text-text-primary"
    >
      {/* PublicNavbar — 1:1 BoardUI Header Navigation */}
      <header className="sticky top-0 z-30 bg-background-full/85 backdrop-blur-md border-b border-separator-border no-print">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 h-16">
          {/* Zone 1: BoardUI Brand Mark + SIMPATIK Wordmark + Version Chip */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/"
              onClick={(e) => handleRouteClick(e, '/')}
              className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
            >
              <BoardLogo size={32} rounded="circle" />
              <span className="text-headline-semibold tracking-tight text-text-primary whitespace-nowrap">
                SIMPATIK Grudo
              </span>
            </Link>
            <BoardChip variant="caption" color="lime" className="hidden sm:inline-flex">
              v1.0.1
            </BoardChip>
          </div>

          {/* Zone 2: Clean BoardUI Navigation Links */}
          <nav
            aria-label="Navigasi Ruang Publik"
            className="hidden md:flex items-center gap-1 rounded-full bg-background-secondary-default p-1"
          >
            {navItems.map((item) => {
              const active = activeRoute === item.route;
              return (
                <Link
                  key={item.route}
                  href={item.route}
                  onClick={(e) => handleRouteClick(e, item.route)}
                  className={`rounded-full px-3.5 py-1.5 text-body-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-background-primary-default text-text-primary shadow-2xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Primary BoardUI Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {perms.canAccessDashboard ? (
              <BoardButton
                variant="primary"
                size="md"
                onClick={(e) => {
                  if (onNavigate) {
                    onNavigate('/dashboard');
                  } else {
                    router.push('/dashboard');
                  }
                }}
              >
                Buka Dashboard Petugas
              </BoardButton>
            ) : (
              <>
                <BoardButton
                  variant="secondary"
                  size="md"
                  className="hidden sm:inline-flex"
                  onClick={(e) => {
                    if (onNavigate) {
                      onNavigate('/login');
                    } else {
                      router.push('/login');
                    }
                  }}
                >
                  Portal Kader
                </BoardButton>
                <BoardButton
                  variant="primary"
                  size="md"
                  onClick={(e) => {
                    if (onNavigate) {
                      onNavigate('/formulir');
                    } else {
                      router.push('/formulir');
                    }
                  }}
                >
                  Isi Formulir Mandiri
                </BoardButton>
              </>
            )}

            {/* Mobile Drawer Toggle */}
            <button
              type="button"
              aria-label="Menu navigasi mobile"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-secondary-default focus:outline-none cursor-pointer"
            >
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-separator-border bg-background-secondary-default px-4 py-4 space-y-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = activeRoute === item.route;
                return (
                  <Link
                    key={item.route}
                    href={item.route}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleRouteClick(e, item.route);
                    }}
                    className={`rounded-lg px-3 py-2 text-body-medium transition-all ${
                      active
                        ? 'bg-background-primary-default text-text-primary shadow-2xs font-semibold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-2 border-t border-separator-border flex flex-col gap-2">
              {perms.canAccessDashboard ? (
                <BoardButton
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigate) {
                      onNavigate('/dashboard');
                    } else {
                      router.push('/dashboard');
                    }
                  }}
                >
                  Buka Dashboard Petugas
                </BoardButton>
              ) : (
                <>
                  <BoardButton
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onNavigate) {
                        onNavigate('/formulir');
                      } else {
                        router.push('/formulir');
                      }
                    }}
                  >
                    Isi Formulir Mandiri
                  </BoardButton>
                  <BoardButton
                    variant="secondary"
                    size="md"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onNavigate) {
                        onNavigate('/login');
                      } else {
                        router.push('/login');
                      }
                    }}
                  >
                    Portal Kader
                  </BoardButton>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Secondary Quick Nav Row (Identical to simpatik-ref) */}
        <div className="flex md:hidden items-center justify-around border-t border-separator-border px-3 py-2 text-caption-1-medium text-text-secondary bg-background-secondary-default">
          <Link
            href="/"
            onClick={(e) => handleRouteClick(e, '/')}
            className={`whitespace-nowrap shrink-0 cursor-pointer px-2.5 py-1 rounded-md transition-all ${
              activeRoute === '/' ? 'bg-background-primary-default text-text-primary shadow-2xs' : ''
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/formulir"
            onClick={(e) => handleRouteClick(e, '/formulir')}
            className={`whitespace-nowrap shrink-0 cursor-pointer px-2.5 py-1 rounded-md transition-all ${
              activeRoute === '/formulir'
                ? 'bg-background-primary-default text-text-primary shadow-2xs'
                : ''
            }`}
          >
            Formulir
          </Link>
          <Link
            href="/tentang"
            onClick={(e) => handleRouteClick(e, '/tentang')}
            className={`whitespace-nowrap shrink-0 cursor-pointer px-2.5 py-1 rounded-md transition-all ${
              activeRoute === '/tentang'
                ? 'bg-background-primary-default text-text-primary shadow-2xs'
                : ''
            }`}
          >
            Tentang
          </Link>
          <Link
            href="/login"
            onClick={(e) => handleRouteClick(e, '/login')}
            className={`whitespace-nowrap shrink-0 cursor-pointer px-2.5 py-1 rounded-md transition-all ${
              activeRoute === '/login'
                ? 'bg-background-primary-default text-text-primary shadow-2xs'
                : ''
            }`}
          >
            Petugas
          </Link>
        </div>
      </header>

      {/* Main Public Content Viewport */}
      <main className="flex-1">{children}</main>

      {/* PublicFooter — BoardUI Footer */}
      <footer className="bg-background-secondary-default border-t border-separator-border mt-16 no-print">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-separator-border">
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <BoardLogo size={24} rounded="circle" />
                <span className="text-headline-semibold text-text-primary">
                  SIMPATIK Desa Grudo (Bhakti Grisa)
                </span>
              </div>
              <p className="text-body-2-regular text-text-secondary max-w-md">
                Sistem Informasi Manajemen PKK &amp; Tertib Administrasi Keluarga Pemerintah Desa Grudo,
                Kecamatan Ngawi, Kabupaten Ngawi. Dibangun dengan BoardUI Design System untuk
                transformasi digital 31 Sheet Buku Dasawisma melalui mekanisme Single Entry.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <BoardChip variant="caption" color="lime">
                  Pemerintah Desa Grudo
                </BoardChip>
                <BoardChip variant="caption" color="gray">
                  Tim Penggerak PKK
                </BoardChip>
                <BoardChip variant="caption" color="cyan">
                  BoardUI v1.0.1
                </BoardChip>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-body-medium text-text-primary">Ruang Publik Warga</div>
              <ul className="space-y-1.5 text-body-2-regular text-text-secondary">
                <li>
                  <Link
                    href="/"
                    onClick={(e) => handleRouteClick(e, '/')}
                    className="hover:text-text-primary cursor-pointer"
                  >
                    Portal Utama &amp; Direktori RT
                  </Link>
                </li>
                <li>
                  <Link
                    href="/formulir"
                    onClick={(e) => handleRouteClick(e, '/formulir')}
                    className="hover:text-text-primary cursor-pointer"
                  >
                    Formulir Keluarga 5 Langkah
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tentang"
                    onClick={(e) => handleRouteClick(e, '/tentang')}
                    className="hover:text-text-primary cursor-pointer"
                  >
                    Profil Inisiatif Bhakti Grisa
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-body-medium text-text-primary">Portal Pengelola PKK</div>
              <ul className="space-y-1.5 text-body-2-regular text-text-secondary">
                <li>
                  <Link
                    href="/login"
                    onClick={(e) => handleRouteClick(e, '/login')}
                    className="hover:text-text-primary cursor-pointer"
                  >
                    Masuk Akun Kader / Pengurus
                  </Link>
                </li>
                {perms.canAccessDashboard && (
                  <>
                    <li>
                      <Link
                        href="/dashboard"
                        onClick={(e) => handleRouteClick(e, '/dashboard')}
                        className="hover:text-text-primary cursor-pointer"
                      >
                        Dashboard Statistik Agregat
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/dashboard/peta"
                        onClick={(e) => handleRouteClick(e, '/dashboard/peta')}
                        className="hover:text-text-primary cursor-pointer"
                      >
                        Peta Spasial GIS Desa Grudo
                      </Link>
                    </li>
                  </>
                )}
              </ul>
              <div className="pt-2 text-caption-1-regular text-text-tertiary">
                <div className="font-medium text-text-secondary">Pelayanan Kantor Desa Grudo:</div>
                <div>Senin &ndash; Jumat: 08.00 &ndash; 15.00 WIB</div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption-1-regular text-text-tertiary">
            <div>
              &copy; 2026 Pemerintah Desa Grudo &amp; Inisiatif Bhakti Grisa &middot; Powered by BoardUI Design System.
            </div>
            <div className="flex items-center gap-2">
              <span>Standar Lampiran 4.14 – 4.19 TP PKK Pusat</span>
              <span aria-hidden="true">&middot;</span>
              <span>Kabupaten Ngawi, Jawa Timur</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
