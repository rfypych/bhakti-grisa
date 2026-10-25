'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/actions/authActions';
import Link from 'next/link';
import { Lock, User, ArrowLeft, AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

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
      setError(err?.message || 'Terjadi gangguan koneksi pada sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="p-6 pb-4 space-y-1">
        <CardTitle className="text-xl font-bold text-foreground">
          Masuk Akun Pengelola PKK
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Khusus untuk Kader RT, Pengurus RW/Dusun, dan Admin Desa.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-2">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2.5 text-destructive text-sm font-medium"
            >
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span className="leading-normal">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Nama Pengguna (Username)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <User className="size-5" />
              </div>
              <Input
                id="username"
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="pl-11 min-h-touch text-base"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="kataSandi">Kata Sandi</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="size-5" />
              </div>
              <Input
                id="kataSandi"
                type="password"
                required
                autoComplete="current-password"
                value={kataSandi}
                onChange={(e) => setKataSandi(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="pl-11 min-h-touch text-base"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full min-h-touch mt-2 text-base font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" data-icon="inline-start" />
                <span>Memverifikasi Kredensial...</span>
              </>
            ) : (
              <>
                <LogIn className="size-5" data-icon="inline-start" />
                <span>Masuk ke Dashboard</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="p-6 pt-4 border-t border-border flex flex-col gap-3 text-center text-sm text-muted-foreground">
        <div className="p-3.5 bg-muted/60 border border-border/50 rounded-lg w-full text-xs sm:text-sm text-foreground">
          Warga yang mengisi formulir mandiri tidak memerlukan akun.{' '}
          <Link href="/formulir" className="text-primary font-bold hover:underline block sm:inline mt-1 sm:mt-0">
            Buka Formulir Warga &rarr;
          </Link>
        </div>

        <Button asChild variant="ghost" size="sm" className="min-h-touch text-sm text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" data-icon="inline-start" />
            <span>Kembali ke Beranda Utama</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
      <div className="text-center mb-6 flex flex-col items-center gap-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="size-11 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-sm">
            SP
          </div>
          <span className="font-extrabold text-foreground tracking-tight text-2xl">
            SIMPATIK
          </span>
        </Link>
        <p className="text-sm text-muted-foreground font-medium">
          Sistem Informasi Manajemen PKK Desa Grudo
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Memuat formulir masuk...
          </Card>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
