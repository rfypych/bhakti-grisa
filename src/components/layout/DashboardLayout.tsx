'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Activity,
  MapPin,
  Layers,
  Users,
  FileText,
  LogOut,
  Search,
  Globe,
  Moon,
  Sun,
  PanelLeft,
  ChevronsUpDown,
  Plus,
  Printer,
} from 'lucide-react';
import {
  AppRoute,
  OfficerAccount,
  UserRole,
  getRbacPermissions,
} from '@/lib/domain';
import { logoutAction } from '@/actions/authActions';
import {
  BoardAvatar,
  BoardBadge,
  BoardBreadcrumb,
  BoardBreadcrumbItem,
  BoardButton,
  BoardChip,
  BoardKbd,
  BoardLogo,
} from '@/components/simpatik';

export interface DashboardLayoutProps {
  currentRoute?: AppRoute;
  onNavigate?: (route: AppRoute, params?: { wilayahId?: string; cetakId?: string }) => void;
  currentUser?: OfficerAccount | null;
  currentRole?: UserRole;
  allOfficers?: OfficerAccount[];
  onSwitchOfficer?: (officer: OfficerAccount | null) => void;
  pendingDraftCount?: number;
  globalSearch?: string;
  onGlobalSearchChange?: (val: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  children: React.ReactNode;
}

/**
 * 1:1 SIMPATIK `Collapsible` slot (from `components/application/dashboard/dashboard-sidebar.tsx`):
 * Smoothly interpolates pixel max-width (`220px` ↔ `0px`), opacity, blur, and margin
 * so icons stay locked on a 36px grid without any unmount or layout snap.
 */
export function Collapsible({
  collapsed,
  children,
  className = '',
}: {
  collapsed: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`flex min-w-0 items-center overflow-hidden transition-[max-width,opacity,filter,margin] duration-300 ease-out ${
        collapsed
          ? 'max-w-0 opacity-0 blur-[2px] pointer-events-none'
          : 'max-w-[220px] opacity-100 blur-0'
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function DashboardLayout({
  currentRoute,
  onNavigate,
  currentUser: initialUser = null,
  currentRole: initialRole,
  allOfficers = [],
  onSwitchOfficer,
  pendingDraftCount = 0,
  globalSearch: propSearch,
  onGlobalSearchChange,
  darkMode: propDarkMode,
  onToggleDarkMode,
  children,
}: DashboardLayoutProps) {
  let pathname = '/dashboard';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pathname = usePathname() || '/dashboard';
  } catch {
    // Fallback when outside router context (e.g. tests)
  }

  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const [internalDarkMode, setInternalDarkMode] = useState(false);
  const [activeUser, setActiveUser] = useState<OfficerAccount | null>(initialUser);

  const currentUser = activeUser ?? initialUser;
  const currentRole: UserRole = initialRole ?? (currentUser?.role || 'ADMIN_DESA');
  const perms = getRbacPermissions(currentRole, currentUser);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeRoute: AppRoute =
    currentRoute ||
    (pathname.startsWith('/dashboard/verifikasi')
      ? '/dashboard/verifikasi'
      : pathname.startsWith('/dashboard/lapor-peristiwa')
        ? '/dashboard/lapor-peristiwa'
        : pathname.startsWith('/dashboard/peta')
          ? '/dashboard/peta'
          : pathname.startsWith('/dashboard/wilayah')
            ? '/dashboard/wilayah'
            : pathname.startsWith('/dashboard/pengguna')
              ? '/dashboard/pengguna'
              : pathname.startsWith('/dashboard/laporan/cetak')
                ? '/dashboard/laporan/cetak'
                : '/dashboard');

  const globalSearch = propSearch !== undefined ? propSearch : internalSearch;

  const handleSearchChange = (val: string) => {
    if (onGlobalSearchChange) {
      onGlobalSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  // Sync internal user if initialUser changes
  useEffect(() => {
    if (initialUser) {
      setActiveUser(initialUser);
    }
  }, [initialUser]);

  // Dark mode initial detection
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('simpatik_theme') === 'dark');
      setInternalDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const isDarkMode = propDarkMode !== undefined ? propDarkMode : internalDarkMode;

  const handleToggleTheme = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
      return;
    }
    setInternalDarkMode((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
          if (typeof localStorage !== 'undefined') localStorage.setItem('simpatik_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          if (typeof localStorage !== 'undefined') localStorage.setItem('simpatik_theme', 'light');
        }
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+L / Cmd+L for quick search
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'l' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCollapsed(false);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const handleNavigate = (route: AppRoute, params?: { wilayahId?: string; cetakId?: string }) => {
    if (onNavigate) {
      onNavigate(route, params);
    } else {
      let url: string = route;
      if (params?.cetakId) {
        url = `/dashboard/laporan/cetak/${params.cetakId}`;
      } else if (params?.wilayahId) {
        url = `${route}?wilayahId=${params.wilayahId}`;
      }
      router.push(url);
    }
  };

  const handleOfficerSwitch = (officer: OfficerAccount | null) => {
    setActiveUser(officer);
    if (onSwitchOfficer) {
      onSwitchOfficer(officer);
    }
  };

  const handleLogout = async () => {
    if (onSwitchOfficer) {
      onSwitchOfficer(null);
    }
    setActiveUser(null);
    try {
      await logoutAction();
    } catch {
      // If outside Server Action context or in test
      handleNavigate('/login');
    }
  };

  const navItems: {
    route: AppRoute;
    label: string;
    icon: React.ReactNode;
    allowed: boolean;
    count?: number;
  }[] = [
    {
      route: '/dashboard',
      label: 'Statistik Agregat',
      icon: <LayoutDashboard className="size-5 shrink-0" />,
      allowed: perms.canAccessDashboard,
    },
    {
      route: '/dashboard/verifikasi',
      label: 'Verifikasi Draft',
      icon: <CheckSquare className="size-5 shrink-0" />,
      allowed: perms.canVerifyDraft,
      count: pendingDraftCount,
    },
    {
      route: '/dashboard/lapor-peristiwa',
      label: 'Lapor Peristiwa',
      icon: <Activity className="size-5 shrink-0" />,
      allowed: perms.canViewPeristiwa,
    },
    {
      route: '/dashboard/peta',
      label: 'Peta GIS Spasial',
      icon: <MapPin className="size-5 shrink-0" />,
      allowed: perms.canViewPeta,
    },
    {
      route: '/dashboard/wilayah',
      label: 'Manajemen Wilayah',
      icon: <Layers className="size-5 shrink-0" />,
      allowed: perms.canManageWilayah,
    },
    {
      route: '/dashboard/pengguna',
      label: 'Manajemen Akun',
      icon: <Users className="size-5 shrink-0" />,
      allowed: perms.canManagePengguna,
    },
    {
      route: '/dashboard/laporan/cetak',
      label: 'Cetak Catatan Keluarga',
      icon: <Printer className="size-5 shrink-0" />,
      allowed: perms.canPrintCatatanKeluarga,
    },
  ];

  const routeShortTitleMap: Record<AppRoute, string> = {
    '/': 'Beranda',
    '/formulir': 'Formulir Mandiri',
    '/login': 'Masuk Petugas',
    '/tentang': 'Tentang Inisiatif',
    '/dashboard': 'Dashboard',
    '/dashboard/verifikasi': 'Verifikasi Draft',
    '/dashboard/lapor-peristiwa': 'Lapor Peristiwa',
    '/dashboard/peta': 'Peta GIS Spasial',
    '/dashboard/wilayah': 'Manajemen Wilayah',
    '/dashboard/pengguna': 'Manajemen Akun',
    '/dashboard/laporan/cetak': 'Lampiran 4.15',
  };

  const routeTitleMap: Record<AppRoute, string> = {
    '/': 'Beranda Publik',
    '/formulir': 'Formulir Mandiri',
    '/login': 'Masuk Petugas',
    '/tentang': 'Tentang Inisiatif',
    '/dashboard': `Selamat Datang, ${currentUser?.nama?.split('(')[0].trim() || 'Petugas PKK'}`,
    '/dashboard/verifikasi': 'Antrean Verifikasi Data Warga (Draft)',
    '/dashboard/lapor-peristiwa': 'Lapor Peristiwa Vital & Dinamika Penduduk (Lampiran 4.18)',
    '/dashboard/peta': 'Peta Spasial Rumah Warga (GIS Desa Grudo)',
    '/dashboard/wilayah': 'Manajemen Wilayah Administrasi (RT/RW & Dasawisma)',
    '/dashboard/pengguna': 'Manajemen Akun Pengelola & Kader PKK',
    '/dashboard/laporan/cetak': 'Cetak Catatan Keluarga Resmi (Lampiran 4.15)',
  };

  const activeNav = navItems.find((item) => item.route === activeRoute);
  const officerInitials = (currentUser?.nama || 'Petugas PKK')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div
      data-simpatik-layout="dashboard"
      className="relative flex min-h-dvh lg:h-dvh w-full gap-4 lg:overflow-hidden bg-background-full p-3 text-text-primary"
    >
      {/* 1:1 SIMPATIK Floating Sidebar (`w-[260px]` expanded ↔ `w-[60px]` collapsed) */}
      <aside
        aria-label="Navigasi Ruang Kerja Petugas"
        className={`hidden lg:flex h-full shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-border-button-white bg-background-secondary-default shadow-sidebar transition-[width,padding] duration-300 ease-out will-change-[width,padding] no-print ${
          collapsed ? 'w-[60px] px-[11px] py-3' : 'w-[260px] p-3'
        }`}
      >
        <div className="-m-2 flex min-h-0 w-[calc(100%+16px)] flex-col gap-3 overflow-x-hidden overflow-y-auto p-2 [scrollbar-width:none]">
          {/* Workspace / Officer Switcher Header + Collapse Toggle Button */}
          <div
            className={`relative w-full shrink-0 transition-[height] duration-300 ease-out ${
              collapsed ? 'h-[76px]' : 'h-9'
            }`}
          >
            <div
              className={`flex h-9 items-center transition-[transform,padding] duration-300 ease-out ${
                collapsed ? 'translate-y-10 pr-0' : 'translate-y-0 pr-9'
              }`}
              title={currentUser?.nama || 'Petugas PKK'}
            >
              <span className="flex size-9 shrink-0 items-center justify-center">
                <BoardAvatar size="md" color="neutral" initials={officerInitials} />
              </span>
              <Collapsible collapsed={collapsed} className={collapsed ? 'ml-0' : 'ml-1.5'}>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-body-medium text-text-primary">
                    {currentUser?.nama?.split('(')[0].trim() || 'Petugas PKK'}
                  </span>
                  <span className="truncate text-caption-1-regular text-text-tertiary">
                    {perms.scopeLabel}
                  </span>
                </div>
              </Collapsible>
            </div>

            <button
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              onClick={() => setCollapsed((prev) => !prev)}
              className="absolute top-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-2lg text-foreground-icon-secondary hover:bg-background-secondary-hover hover:text-foreground-icon-primary transition-colors duration-200"
            >
              <PanelLeft
                className={`size-5 transition-transform duration-300 ease-out ${
                  collapsed ? 'rotate-180' : 'rotate-0'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Quick Search Pill (Single persistent DOM node: 36×36 circle when collapsed, full pill when expanded) */}
          <div
            role={collapsed ? 'button' : undefined}
            tabIndex={collapsed ? 0 : undefined}
            aria-label={collapsed ? 'Cari KK / Nama (Ctrl+L)' : undefined}
            title={collapsed ? 'Cari KK / Nama (Ctrl+L)' : undefined}
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setTimeout(() => searchInputRef.current?.focus(), 220);
              }
            }}
            onKeyDown={(e) => {
              if (collapsed && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setCollapsed(false);
                setTimeout(() => searchInputRef.current?.focus(), 220);
              }
            }}
            className={`flex h-9 w-full shrink-0 items-center rounded-full bg-background-tertiary-default px-2 focus-within:ring-2 focus-within:ring-inset focus-within:ring-border-button-active transition-[background-color,box-shadow] duration-200 ease ${
              collapsed ? 'cursor-pointer hover:bg-background-tertiary-hover/55' : ''
            }`}
          >
            <Search className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden="true" />
            <Collapsible
              collapsed={collapsed}
              className={collapsed ? 'ml-0 flex-none' : 'ml-2 flex-1'}
            >
              <div className="flex w-full items-center gap-2">
                <input
                  ref={searchInputRef}
                  type="search"
                  tabIndex={collapsed ? -1 : 0}
                  aria-label="Cari kepala keluarga atau nomor KK"
                  placeholder="Cari KK / Nama (Ctrl+L)..."
                  value={globalSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-body-medium text-text-primary outline-none placeholder:text-text-secondary"
                />
                <BoardKbd>Ctrl+L</BoardKbd>
              </div>
            </Collapsible>
          </div>

          {/* Primary Nav (`NavItem` with `bg-button-primary shadow-nav-selected` when active) */}
          <nav className="flex w-full flex-col gap-1">
            {navItems.map((item) => {
              const isSelected = activeRoute === item.route;
              return (
                <Link
                  key={item.route}
                  href={item.route}
                  onClick={(e) => {
                    if (onNavigate) {
                      e.preventDefault();
                      item.allowed && onNavigate(item.route);
                    } else if (!item.allowed) {
                      e.preventDefault();
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`flex h-9 w-full items-center justify-between rounded-2lg p-2 transition-[background-color,box-shadow] duration-200 ease outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring ${
                    !item.allowed
                      ? 'opacity-45 cursor-not-allowed pointer-events-none'
                      : isSelected
                        ? 'bg-button-primary shadow-nav-selected cursor-pointer'
                        : 'hover:bg-background-secondary-hover cursor-pointer'
                  }`}
                >
                  <span className="flex min-w-0 items-center">
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center ${
                        isSelected ? 'text-white' : 'text-foreground-icon-secondary'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <Collapsible collapsed={collapsed} className={collapsed ? 'ml-0' : 'ml-2'}>
                      <span
                        className={`text-body-medium whitespace-nowrap ${
                          isSelected ? 'text-white font-semibold' : 'text-text-secondary'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Collapsible>
                  </span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <Collapsible collapsed={collapsed}>
                      <BoardBadge color={isSelected ? 'primary' : 'neutral'}>
                        {item.count}
                      </BoardBadge>
                    </Collapsible>
                  )}
                  {!item.allowed && (
                    <Collapsible collapsed={collapsed}>
                      <BoardBadge color="neutral">RBAC</BoardBadge>
                    </Collapsible>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Officer Active Account & Scope Information */}
          {currentUser && (
            <div
              aria-hidden={collapsed}
              className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
                collapsed
                  ? 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                  : 'grid-rows-[1fr] opacity-100 mt-1'
              }`}
            >
              <div className="overflow-hidden">
                <div className="w-[234px] rounded-2xl bg-background-inner-default p-2.5 shadow-card border border-border">
                  <div className="flex items-center gap-2 mb-1.5">
                    <BoardAvatar size="xs" color="neutral" initials={officerInitials} />
                    <div className="min-w-0 flex-1">
                      <div className="text-body-2-semibold text-text-primary truncate" title={currentUser.nama}>
                        {currentUser.nama.split('(')[0].trim()}
                      </div>
                      <div className="text-caption-2-medium text-text-tertiary truncate">
                        {`@${currentUser.username}`}
                      </div>
                    </div>
                    <BoardBadge color="primary" className="shrink-0">{currentUser.role}</BoardBadge>
                  </div>
                  <div className="text-caption-2-medium text-text-secondary border-t border-border pt-1.5 mt-1 flex items-center justify-between gap-1">
                    <span className="shrink-0">Wilayah Tugas:</span>
                    <span className="font-medium text-text-primary truncate text-right" title={perms.scopeLabel}>{perms.scopeLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Bottom Section: Segmented Theme Toggle + Secondary Nav + Team Card */}
        <div className="flex w-full shrink-0 flex-col gap-2.5 pt-2">
          {/* SIMPATIK Theme Toggle + Logout */}
          <div className="flex h-9 w-full items-center justify-between">
            <div
              role="group"
              aria-label="Theme"
              className={`relative inline-flex items-center rounded-full transition-[background-color,padding] duration-300 ease-out ${
                collapsed ? 'bg-transparent p-0' : 'bg-theme-toggle-sidebar-background p-1 gap-1'
              }`}
            >
              <button
                type="button"
                aria-label={
                  collapsed ? (isDarkMode ? 'Mode terang' : 'Mode gelap') : 'Mode terang'
                }
                title={collapsed ? (isDarkMode ? 'Mode terang' : 'Mode gelap') : 'Mode terang'}
                onClick={() => {
                  if (collapsed) {
                    handleToggleTheme();
                  } else if (isDarkMode) {
                    handleToggleTheme();
                  }
                }}
                className={`relative z-10 inline-flex cursor-pointer items-center justify-center rounded-full transition-all duration-200 ${
                  collapsed
                    ? 'size-9 text-foreground-icon-secondary hover:bg-background-secondary-hover hover:text-foreground-icon-primary'
                    : !isDarkMode
                      ? 'size-7 bg-theme-toggle-sidebar-selected-background text-foreground-icon-primary shadow-2xs'
                      : 'size-7 text-foreground-icon-secondary hover:text-foreground-icon-primary'
                }`}
              >
                {collapsed && isDarkMode ? (
                  <Moon className="size-5" />
                ) : (
                  <Sun className={collapsed ? 'size-5' : 'size-4'} />
                )}
              </button>

              <Collapsible collapsed={collapsed}>
                <button
                  type="button"
                  tabIndex={collapsed ? -1 : 0}
                  aria-label="Mode gelap"
                  onClick={() => !isDarkMode && handleToggleTheme()}
                  className={`relative z-10 inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-all ${
                    isDarkMode
                      ? 'bg-theme-toggle-sidebar-selected-background text-foreground-icon-primary shadow-2xs'
                      : 'text-foreground-icon-secondary hover:text-foreground-icon-primary'
                  }`}
                >
                  <Moon className="size-4" />
                </button>
              </Collapsible>
            </div>

            <Collapsible collapsed={collapsed}>
              <button
                type="button"
                tabIndex={collapsed ? -1 : 0}
                onClick={handleLogout}
                aria-label="Keluar akun petugas"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-caption-1-medium text-text-secondary hover:bg-background-secondary-hover hover:text-text-error-primary cursor-pointer whitespace-nowrap transition-colors"
              >
                <LogOut className="size-3.5" />
                <span>Keluar</span>
              </button>
            </Collapsible>
          </div>

          {/* Secondary Nav */}
          <nav className="flex w-full flex-col gap-0.5">
            {perms.canSubmitFormulir && (
              <Link
                href="/formulir"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate('/formulir');
                  }
                }}
                title={collapsed ? 'Formulir Pendataan' : undefined}
                className="flex h-9 w-full items-center rounded-2lg p-2 text-body-medium text-text-secondary hover:bg-background-secondary-hover cursor-pointer transition-colors"
              >
                <FileText className="size-5 shrink-0 text-foreground-icon-secondary" />
                <Collapsible collapsed={collapsed} className={collapsed ? 'ml-0' : 'ml-2'}>
                  <span className="truncate whitespace-nowrap">Formulir Pendataan</span>
                </Collapsible>
              </Link>
            )}
            <Link
              href="/"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/');
                }
              }}
              title={collapsed ? 'Portal Publik Warga' : undefined}
              className="flex h-9 w-full items-center rounded-2lg p-2 text-body-medium text-text-secondary hover:bg-background-secondary-hover cursor-pointer transition-colors"
            >
              <Globe className="size-5 shrink-0 text-foreground-icon-secondary" />
              <Collapsible collapsed={collapsed} className={collapsed ? 'ml-0' : 'ml-2'}>
                <span className="truncate whitespace-nowrap">Portal Publik Warga</span>
              </Collapsible>
            </Link>
          </nav>

          {/* SIMPATIK Team Card */}
          <Link
            href="/tentang"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/tentang');
              }
            }}
            title={collapsed ? 'SIMPATIK Grudo (TP PKK Bhakti Grisa)' : undefined}
            className={`flex w-full cursor-pointer items-center justify-between overflow-hidden border-2 border-transparent hover:border-border-button-hover transition-[background-color,border-color,padding,border-radius] duration-300 ease-out text-left ${
              collapsed
                ? 'rounded-2xl bg-transparent p-0.5'
                : 'rounded-xl bg-background-tertiary-default py-2 pe-3 ps-2.5'
            }`}
          >
            <span className="flex min-w-0 items-center">
              <BoardLogo size={32} rounded="circle" />
              <Collapsible collapsed={collapsed} className={collapsed ? 'ml-0' : 'ml-2'}>
                <span className="flex min-w-0 flex-col items-start justify-center">
                  <span className="text-body-medium whitespace-nowrap text-text-primary">
                    SIMPATIK Grudo
                  </span>
                  <span className="text-caption-1-regular whitespace-nowrap text-text-secondary">
                    TP PKK Bhakti Grisa
                  </span>
                </span>
              </Collapsible>
            </span>
            <Collapsible collapsed={collapsed}>
              <span className="inline-flex items-center justify-center rounded-sm bg-background-secondary-default px-1.5 py-0.5 text-caption-1-semibold text-text-tertiary">
                v1.0
              </span>
            </Collapsible>
          </Link>
        </div>
      </aside>

      {/* Main Content Area (`1300px` centered column inside `bg-background-full`) */}
      <main className="relative flex min-h-0 min-w-0 flex-1 justify-center overflow-x-hidden overflow-y-auto bg-background-full sm:pt-3 pb-20 lg:pb-4">
        <div className="flex w-full max-w-[1300px] flex-col gap-4">
          {/* 1:1 SIMPATIK AppShell Header: Breadcrumb trail + Page Title + Action Buttons */}
          <header className="flex w-full flex-col gap-2 no-print">
            <div className="flex items-center justify-between gap-2">
              <BoardBreadcrumb>
                <BoardBreadcrumbItem
                  onClick={() => handleNavigate('/')}
                  icon={<BoardLogo size={20} rounded="circle" />}
                >
                  SIMPATIK Grudo
                </BoardBreadcrumbItem>
                <BoardBreadcrumbItem
                  onClick={() => handleNavigate('/dashboard')}
                  icon={<BoardAvatar size="xs" color="neutral" initials={officerInitials} />}
                >
                  {currentUser?.nama?.split('(')[0].trim() || 'Petugas PKK'}
                </BoardBreadcrumbItem>
                <BoardBreadcrumbItem current icon={activeNav?.icon}>
                  {routeShortTitleMap[activeRoute] || 'Dashboard'}
                </BoardBreadcrumbItem>
              </BoardBreadcrumb>

              <div className="flex items-center gap-2">
                <BoardChip variant="bold" color="blue" className="hidden sm:inline-flex">
                  {perms.scopeLabel}
                </BoardChip>

                <button
                  type="button"
                  aria-label={isDarkMode ? 'Mode terang' : 'Mode gelap'}
                  onClick={handleToggleTheme}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-border-button-default bg-background-primary-default text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>

                <Link
                  href="/"
                  title="Buka Portal Publik"
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-border-button-default bg-background-primary-default text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <Globe className="size-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar"
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-border-button-default bg-background-primary-default text-text-secondary hover:text-text-error-primary transition-colors cursor-pointer"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-end justify-between gap-2.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Toggle sidebar"
                  onClick={() => setCollapsed((prev) => !prev)}
                  className="lg:hidden inline-flex p-1.5 rounded-lg border border-border-button-default bg-background-primary-default text-text-secondary hover:text-text-primary mr-1"
                >
                  <PanelLeft className="size-4" />
                </button>
                <h1 className="px-1 text-title-2-medium text-text-primary">
                  {routeTitleMap[activeRoute] || 'Dashboard'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5">
                {/* Header Search */}
                <div className="relative flex items-center rounded-2lg bg-background-tertiary-default px-2.5 py-1.5 h-9 ring-2 ring-inset ring-transparent focus-within:ring-border-button-active">
                  <Search className="size-4 text-foreground-icon-tertiary shrink-0 mr-1.5" />
                  <input
                    type="search"
                    aria-label="Cari kepala keluarga atau nomor KK"
                    placeholder="Cari nama KK / No. KK..."
                    value={globalSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-40 sm:w-52 bg-transparent text-body-regular text-text-primary placeholder:text-text-tertiary outline-none"
                  />
                </div>

                {perms.canSubmitFormulir && (
                  <BoardButton
                    variant="primary"
                    size="md"
                    icon={<Plus className="size-4" />}
                    onClick={() => handleNavigate('/formulir')}
                  >
                    Input KK Resmi
                  </BoardButton>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex w-full flex-col gap-4 pb-6">{children}</div>
        </div>
      </main>

      {/* MobileBottomBar — Compact Mobile Navigation */}
      <nav
        aria-label="Navigasi Bawah Petugas Mobile"
        className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-background-primary-default/95 backdrop-blur-md border-t border-separator-border flex items-center justify-around py-2 px-2 no-print"
      >
        {navItems
          .filter((i) => i.allowed)
          .slice(0, 5)
          .map((item) => {
            const active = activeRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNavigate(item.route)}
                className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-caption-1-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-accent-600 dark:text-accent-400 font-semibold'
                    : 'text-text-tertiary'
                }`}
              >
                <span className="[&>svg]:size-4">{item.icon}</span>
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
      </nav>
    </div>
  );
}
