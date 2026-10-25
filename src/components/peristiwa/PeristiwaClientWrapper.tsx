'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LaporKelahiranModal } from './LaporKelahiranModal';
import { LaporKematianModal } from './LaporKematianModal';
import { LaporKehamilanModal } from './LaporKehamilanModal';
import { LaporMutasiModal } from './LaporMutasiModal';
import { Baby, HeartCrack, Activity, Heart, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [mutasiOpen, setMutasiOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          onClick={() => setKelahiranOpen(true)}
          className="min-h-touch gap-2"
        >
          <Baby className="size-4" />
          <span>Lapor Kelahiran</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setKehamilanOpen(true)}
          className="min-h-touch gap-2"
        >
          <Activity className="size-4 text-muted-foreground" />
          <span>Lapor Kehamilan</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setNifasOpen(true)}
          className="min-h-touch gap-2"
        >
          <Heart className="size-4 text-muted-foreground" />
          <span>Lapor Nifas</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setMutasiOpen(true)}
          className="min-h-touch gap-2"
        >
          <Truck className="size-4 text-muted-foreground" />
          <span>Lapor Mutasi Pindah</span>
        </Button>

        <Button
          variant="destructive"
          onClick={() => setKematianOpen(true)}
          className="min-h-touch gap-2"
        >
          <HeartCrack className="size-4" />
          <span>Lapor Kematian</span>
        </Button>
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

      <LaporMutasiModal
        isOpen={mutasiOpen}
        onClose={() => setMutasiOpen(false)}
        members={members}
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
