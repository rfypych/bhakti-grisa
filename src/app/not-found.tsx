import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-border shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="size-12 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto mb-2">
            <FileQuestion className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Halaman Tidak Ditemukan
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Alamat yang Anda tuju tidak tersedia atau telah dipindahkan ke tautan lain.
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-4 flex justify-center">
          <Button asChild className="min-h-touch gap-2 font-semibold">
            <Link href="/">
              <Home className="size-4" data-icon="inline-start" />
              <span>Kembali ke Beranda</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
