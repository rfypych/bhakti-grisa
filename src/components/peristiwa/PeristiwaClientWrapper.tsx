'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LaporKelahiranModal } from './LaporKelahiranModal';
import { LaporKematianModal } from './LaporKematianModal';
import { Baby, HeartCrack, PlusCircle } from 'lucide-react';

interface PeristiwaClientWrapperProps {
  mothers: any[];
  members: any[];
}

export function PeristiwaClientWrapper({ mothers, members }: PeristiwaClientWrapperProps) {
  const router = useRouter();
  const [kelahiranOpen, setKelahiranOpen] = useState(false);
  const [kematianOpen, setKematianOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setKelahiranOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Baby className="w-4 h-4" />
          <span>Lapor Kelahiran Bayi</span>
        </button>

        <button
          onClick={() => setKematianOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <HeartCrack className="w-4 h-4" />
          <span>Lapor Kematian Warga</span>
        </button>
      </div>

      <LaporKelahiranModal
        isOpen={kelahiranOpen}
        onClose={() => setKelahiranOpen(false)}
        mothers={mothers}
        onSuccess={handleRefresh}
      />

      <LaporKematianModal
        isOpen={kematianOpen}
        onClose={() => setKematianOpen(false)}
        members={members}
        onSuccess={handleRefresh}
      />
    </>
  );
}
