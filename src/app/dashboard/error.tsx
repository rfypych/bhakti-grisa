'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <Card className="border-destructive/30 shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Gagal Memuat Data Dashboard
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {error.message || 'Terjadi gangguan saat memuat data statistik dan agregasi wilayah.'}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-4 flex justify-center">
          <Button onClick={() => reset()} className="min-h-touch gap-2 font-semibold">
            <RotateCcw className="size-4" data-icon="inline-start" />
            <span>Coba Muat Ulang</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
