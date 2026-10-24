'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LaporKelahiranModal } from './LaporKelahiranModal';
import { LaporKematianModal } from './LaporKematianModal';
import { LaporKehamilanModal } from './LaporKehamilanModal';
import { Baby, HeartCrack, Activity, Heart } from 'lucide-react';

interface PeristiwaClientWrapperProps {
  mothers: any[];
  members: any[];
}

export function PeristiwaClientWrapper({ mothers, members }: PeristiwaClientWrapperProps) {
  const router = useRouter();
  const [kelahiranOpen, setKelahiranOpen] = useState(false);
  const [kehamilanOpen, setKehamilanOpen] = useState(false);
  const [nifasOpen, setNifasOpen] = useState(false);
  const [kematianOpen, setKematianOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setKelahiranOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Baby className="w-3.5 h-3.5" />
          <span>Lapor Kelahiran</span>
        </button>

        <button
          onClick={() => setKehamilanOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Lapor Kehamilan</span>
        </button>

        <button
          onClick={() => setNifasOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Lapor Nifas</span>
        </button>

        <button
          onClick={() => setKematianOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <HeartCrack className="w-3.5 h-3.5" />
          <span>Lapor Kematian</span>
        </button>
      </div>

      <LaporKelahiranModal
        isOpen={kelahiranOpen}
        onClose={() => setKelahiranOpen(false)}
        mothers={mothers}
        onSuccess={handleRefresh}
      />

      <LaporKehamilanModal
        isOpen={kehamilanOpen}
        onClose={() => setKehamilanOpen(false)}
        mothers={mothers}
        defaultStatus="KEHAMILAN"
        onSuccess={handleRefresh}
      />

      <LaporKehamilanModal
        isOpen={nifasOpen}
        onClose={() => setNifasOpen(false)}
        mothers={mothers}
        defaultStatus="NIFAS"
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
