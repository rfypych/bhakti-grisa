'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  UserCheck,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { AppRoute, OfficerAccount, UserRole } from '@/lib/domain';
import { loginAction } from '@/actions/authActions';
import {
  BoardButton,
  BoardChip,
  BoardCallout,
  BoardStatusLabel,
  BoardLogo,
} from '@/components/simpatik';
import { PublicLayout } from '@/components/layout/PublicLayout';

export interface PublicLoginProps {
  officers?: OfficerAccount[];
  currentUser?: OfficerAccount | null;
  currentRole?: UserRole;
  onLoginSuccess?: (officer: any) => void;
  onLogout?: () => void;
  onNavigate?: (route: AppRoute) => void;
}

export function PublicLogin({
  officers = [],
  currentUser = null,
  currentRole = 'WARGA',
  onLoginSuccess,
  onLogout,
  onNavigate,
}: PublicLoginProps) {
  let router: any = null;
  let searchParams: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    searchParams = useSearchParams();
  } catch {
    // Fallback when outside Next.js Router context (e.g. tests)
  }

  const callbackUrl = searchParams?.get?.('callbackUrl') || '/dashboard';

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNav = (route: AppRoute) => {
    if (onNavigate) {
      onNavigate(route);
      return;
    }
    if (router?.push) {
      router.push(route);
    } else if (typeof window !== 'undefined') {
      window.location.href = route;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password.trim()) {
      setErrorMsg('Username dan Kata Sandi wajib diisi untuk masuk ke portal pengelola.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginAction({ username: trimmedUser, kataSandi: password });

      if (!res.success) {
        setErrorMsg(
          res.error ||
            'Kredensial tidak sesuai. Periksa kembali Username dan Kata Sandi akun petugas PKK Anda.'
        );
        return;
      }

      const found = officers.find(
        (o) => o.username.toLowerCase() === trimmedUser.toLowerCase()
      );

      if (onLoginSuccess) {
        onLoginSuccess(found || { username: trimmedUser, role: 'ADMIN_DESA' });
      }

      if (onNavigate) {
        onNavigate('/dashboard');
      } else if (router?.push) {
        router.push(callbackUrl);
        router.refresh?.();
      } else if (typeof window !== 'undefined') {
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi gangguan koneksi pada sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout
      currentRoute="/login"
      currentUser={currentUser}
      currentRole={currentRole}
      onNavigate={handleNav}
    >
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* 1:1 SIMPATIK Split `AuthCard` */}
        <div className="grid w-full overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-sidebar lg:grid-cols-12">
          {/* Left Column: SIMPATIK Sign-In Form */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 space-y-6">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <BoardLogo size={32} rounded="circle" />
                <div>
                  <div className="text-body-medium text-text-primary">SIMPATIK Desa Grudo</div>
                  <div className="text-caption-1-regular text-text-tertiary">
                    Portal Pengelola &amp; Kader PKK
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-title-2-semibold text-text-primary tracking-tight">
                  Masuk Akun Pengelola PKK
                </h1>
                <p className="text-body-2-regular text-text-secondary">
                  Khusus Kader Dasawisma RT, Pengurus RW, Pengurus Dusun, dan Admin Desa Grudo.
                </p>
              </div>

              {currentUser && (
                <BoardCallout
                  tone="success"
                  title={`Sesi Aktif: ${currentUser.nama}`}
                  description={`Anda sedang masuk sebagai @${currentUser.username} (${currentUser.role}).`}
                  action={
                    <div className="flex items-center gap-2">
                      <BoardButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleNav('/dashboard')}
                      >
                        Ke Dashboard
                      </BoardButton>
                      {onLogout && (
                        <BoardButton variant="secondary" size="sm" onClick={onLogout}>
                          Keluar
                        </BoardButton>
                      )}
                    </div>
                  }
                />
              )}

              {errorMsg && (
                <BoardCallout
                  tone="danger"
                  title="Gagal Masuk Akun"
                  description={errorMsg}
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-body-medium text-text-primary mb-1.5"
                  >
                    Username Petugas <span className="text-text-error-primary">*</span>
                  </label>
                  <div className="relative flex w-full items-center rounded-2lg bg-background-tertiary-default p-2 ring-2 ring-inset ring-transparent hover:ring-border-button-hover focus-within:ring-border-button-active transition-all">
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: admin atau nama_petugas"
                      className="w-full bg-transparent px-1 text-body-regular text-text-primary placeholder:text-text-tertiary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-body-medium text-text-primary mb-1.5"
                  >
                    Kata Sandi <span className="text-text-error-primary">*</span>
                  </label>
                  <div className="relative flex w-full items-center rounded-2lg bg-background-tertiary-default p-2 ring-2 ring-inset ring-transparent hover:ring-border-button-hover focus-within:ring-border-button-active transition-all">
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full bg-transparent px-1 text-body-regular text-text-primary placeholder:text-text-tertiary outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <BoardButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                    icon={<ArrowRight className="size-4" />}
                  >
                    {loading ? 'Memverifikasi...' : 'Masuk ke Ruang Kerja Petugas'}
                  </BoardButton>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-separator-border flex items-center justify-between text-caption-1-regular text-text-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5" />
                Otentikasi Berjenjang Sesuai Peran Petugas
              </span>
              <span>TP PKK Desa Grudo</span>
            </div>
          </div>

          {/* Right Column: Official Initiative Overview & Info */}
          <div className="lg:col-span-7 bg-background-secondary-default p-6 sm:p-8 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-separator-border">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-2lg bg-button-primary text-white">
                    <Shield className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-body-medium text-text-primary">
                      Ruang Kerja Resmi Pengelola PKK Desa
                    </h2>
                    <p className="text-caption-1-regular text-text-tertiary">
                      Hak akses terisolasi berjenjang (Kader RT, RW, Dusun, dan Admin Desa).
                    </p>
                  </div>
                </div>
                <BoardChip variant="caption" color="lime">
                  Tertib Administrasi
                </BoardChip>
              </div>

              {/* Initiative Key Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2lg bg-background-inner-default shadow-card space-y-1 border border-border">
                  <div className="flex items-center gap-1.5 text-caption-1-semibold text-accent-600">
                    <CheckCircle2 className="size-3.5" />
                    <span>Verifikasi Berkas 1-Klik</span>
                  </div>
                  <p className="text-caption-1-regular text-text-tertiary leading-snug">
                    Antrean berkas warga mandiri divalidasi langsung oleh Kader Dasawisma setempat.
                  </p>
                </div>

                <div className="p-3.5 rounded-2lg bg-background-inner-default shadow-card space-y-1 border border-border">
                  <div className="flex items-center gap-1.5 text-caption-1-semibold text-accent-600">
                    <Sparkles className="size-3.5" />
                    <span>Mutasi Peristiwa Vital</span>
                  </div>
                  <p className="text-caption-1-regular text-text-tertiary leading-snug">
                    Pencatatan kelahiran bayi, nifas, kematian, dan mutasi warga (Lampiran 4.18).
                  </p>
                </div>

                <div className="p-3.5 rounded-2lg bg-background-inner-default shadow-card space-y-1 border border-border">
                  <div className="flex items-center gap-1.5 text-caption-1-semibold text-accent-600">
                    <Building2 className="size-3.5" />
                    <span>Peta Spasial GIS</span>
                  </div>
                  <p className="text-caption-1-regular text-text-tertiary leading-snug">
                    Pemetaan sebaran rumah tangga, sanitasi jamban, dan indeks kerentanan warga.
                  </p>
                </div>

                <div className="p-3.5 rounded-2lg bg-background-inner-default shadow-card space-y-1 border border-border">
                  <div className="flex items-center gap-1.5 text-caption-1-semibold text-accent-600">
                    <FileSpreadsheet className="size-3.5" />
                    <span>Otomasi 31 Sheet</span>
                  </div>
                  <p className="text-caption-1-regular text-text-tertiary leading-snug">
                    Ekspor Buku Dasawisma PKK berjenjang secara otomatis ke format Excel dan PDF resmi.
                  </p>
                </div>
              </div>

              {/* Resident Notice */}
              <div className="rounded-2lg border border-border bg-background-inner-default p-4 space-y-2">
                <div className="flex items-center gap-2 text-caption-1-semibold text-text-primary">
                  <span className="size-2 rounded-full bg-accent-600" />
                  <span>Informasi bagi Warga Masyarakat:</span>
                </div>
                <p className="text-caption-1-regular text-text-secondary leading-relaxed">
                  Warga yang ingin mengisi Formulir Pendataan Keluarga Mandiri tidak memerlukan akun login petugas.
                  Anda dapat langsung mengakses formulir publik tanpa perlu mendaftar.
                </p>
                <div className="pt-1">
                  <Link
                    href="/formulir"
                    className="inline-flex items-center gap-1.5 text-caption-1-semibold text-accent-600 hover:text-accent-700 transition-colors"
                  >
                    <span>Buka Formulir Mandiri Warga</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-separator-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-caption-2-medium text-text-tertiary">
              <span>Pemerintah Desa Grudo, Kec. Ngawi, Kab. Ngawi</span>
              <span>Inisiatif Bhakti Grisa 2026</span>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-full flex items-center justify-center p-8 text-text-secondary">
          Memuat Halaman Login Petugas...
        </div>
      }
    >
      <PublicLogin />
    </Suspense>
  );
}
