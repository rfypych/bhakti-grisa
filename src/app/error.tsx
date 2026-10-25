'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-destructive/30 shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Terjadi Kendala Sistem
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {error.message || 'Halaman mengalami kesalahan saat memproses data kependudukan.'}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-4 flex justify-center">
          <Button onClick={() => reset()} className="min-h-touch gap-2 font-semibold">
            <RotateCcw className="size-4" data-icon="inline-start" />
            <span>Muat Ulang Halaman</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
