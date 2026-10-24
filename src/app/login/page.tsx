'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/actions/authActions';
import Link from 'next/link';
import { Lock, User, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [username, setUsername] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAction({ username, kataSandi });
      if (!res.success) {
        setError(res.error || 'Nama pengguna atau kata sandi tidak valid.');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan pada sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-stone-200 rounded-2xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Nama Pengguna (Username)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username Anda"
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Kata Sandi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={kataSandi}
              onChange={(e) => setKataSandi(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col gap-2.5 text-center text-xs text-stone-500">
        <p className="text-[11px] text-stone-400">
          Warga yang ingin mengisi formulir mandiri tidak memerlukan akun.{' '}
          <Link href="/formulir" className="text-emerald-700 font-semibold hover:underline">
            Buka Formulir Warga
          </Link>
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 text-stone-600 hover:text-stone-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-stone-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
              SP
            </div>
            <span className="font-extrabold text-stone-900 tracking-tight text-xl">
              SIMPATIK
            </span>
          </Link>
        </div>

        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-stone-900">
          Masuk Akun Pengelola PKK
        </h2>
        <p className="mt-1 text-center text-xs text-stone-600">
          Akses modul administrasi untuk Kader RT, Pengurus RW/Dusun, & Admin Desa
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={
          <div className="bg-white py-12 px-6 shadow-sm border border-stone-200 rounded-2xl flex items-center justify-center text-xs text-stone-500">
            Memuat formulir masuk...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
