import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="p-8 max-w-sm w-full text-center flex flex-col items-center gap-3 border-border shadow-sm">
        <Loader2 className="size-8 animate-spin text-primary" />
        <div>
          <p className="text-base font-bold text-foreground">Memuat Halaman...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Menyiapkan data administrasi kependudukan SIMPATIK
          </p>
        </div>
      </Card>
    </div>
  );
}
