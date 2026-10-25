'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      className="min-h-touch gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <Printer className="size-4" data-icon="inline-start" />
      <span>Cetak Dokumen (Print / PDF)</span>
    </Button>
  );
}
