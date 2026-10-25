'use client';

import React from 'react';
import { Plus, Trash2, Sprout, Store } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Step4Props {
  formData: any;
  updateField: (key: string, val: any) => void;
}

export function Step4PekaranganUp2k({ formData, updateField }: Step4Props) {
  const hatinyaList = formData.hatinyaPkk || [];
  const industriList = formData.industriRumahTangga || [];

  const handleAddHatinya = () => {
    updateField('hatinyaPkk', [
      ...hatinyaList,
      { kategori: 'WARUNG_HIDUP', komoditi: '', jumlah: '' },
    ]);
  };

  const handleRemoveHatinya = (idx: number) => {
    updateField(
      'hatinyaPkk',
      hatinyaList.filter((_: any, i: number) => i !== idx)
    );
  };

  const handleUpdateHatinya = (idx: number, field: string, val: string) => {
    const next = hatinyaList.map((item: any, i: number) =>
      i === idx ? { ...item, [field]: val } : item
    );
    updateField('hatinyaPkk', next);
  };

  const handleAddIndustri = () => {
    updateField('industriRumahTangga', [
      ...industriList,
      { kategori: 'PANGAN', komoditi: '', volume: '' },
    ]);
  };

  const handleRemoveIndustri = (idx: number) => {
    updateField(
      'industriRumahTangga',
      industriList.filter((_: any, i: number) => i !== idx)
    );
  };

  const handleUpdateIndustri = (idx: number, field: string, val: string) => {
    const next = industriList.map((item: any, i: number) =>
      i === idx ? { ...item, [field]: val } : item
    );
    updateField('industriRumahTangga', next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <h2 className="text-xl font-bold text-foreground">Hatinya PKK &amp; Industri Rumah Tangga (UP2K)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pemanfaatan pekarangan rumah tangga dan kegiatan usaha peningkatan pendapatan keluarga (opsional).
        </p>
      </div>

      {/* Bagian 1: Hatinya PKK */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-secondary/40 p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sprout className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Pemanfaatan Pekarangan (AKU HATINYA PKK)
              </CardTitle>
              <span className="text-xs text-muted-foreground block">
                Tanaman warung hidup, TOGA, perikanan, atau peternakan
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddHatinya}
            className="min-h-touch text-sm"
          >
            <Plus className="size-4 text-primary" data-icon="inline-start" />
            <span>Tambah Komoditi</span>
          </Button>
        </CardHeader>

        <CardContent className="p-5 flex flex-col gap-3">
          {hatinyaList.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Belum ada komoditi pemanfaatan pekarangan yang dicatat.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {hatinyaList.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-md border border-border bg-card"
                >
                  <div className="w-full sm:w-44 shrink-0">
                    <select
                      aria-label="Kategori Pekarangan"
                      value={item.kategori}
                      onChange={(e) => handleUpdateHatinya(idx, 'kategori', e.target.value)}
                      className="flex min-h-touch w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="WARUNG_HIDUP">Warung Hidup (Sayur, Cabai)</option>
                      <option value="TOGA">TOGA (Jahe, Kunyit, Kencur)</option>
                      <option value="PETERNAKAN">Peternakan (Ayam, Bebek, dll)</option>
                      <option value="PERIKANAN">Perikanan (Lele, Nila, dll)</option>
                      <option value="TANAMAN_KERAS">Tanaman Keras (Mangga, Kelapa)</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <Input
                      aria-label="Nama Komoditi"
                      type="text"
                      placeholder="Nama komoditi (misal: Cabai Rawit / Jahe Merah)"
                      value={item.komoditi}
                      onChange={(e) => handleUpdateHatinya(idx, 'komoditi', e.target.value)}
                      className="min-h-touch text-sm"
                    />
                  </div>

                  <div className="w-full sm:w-40 shrink-0">
                    <Input
                      aria-label="Jumlah Komoditi"
                      type="text"
                      placeholder="Jumlah (misal: 10 pot)"
                      value={item.jumlah}
                      onChange={(e) => handleUpdateHatinya(idx, 'jumlah', e.target.value)}
                      className="min-h-touch text-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveHatinya(idx)}
                    className="min-h-touch min-w-touch text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-auto"
                    title="Hapus komoditi ini"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Hapus Komoditi</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bagian 2: Industri Rumah Tangga (UP2K) */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-secondary/40 p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Store className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Industri Rumah Tangga (UP2K PKK)
              </CardTitle>
              <span className="text-xs text-muted-foreground block">
                Usaha ekonomi mikro, kerajinan, olahan makanan, atau jasa keluarga
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddIndustri}
            className="min-h-touch text-sm"
          >
            <Plus className="size-4 text-primary" data-icon="inline-start" />
            <span>Tambah Usaha</span>
          </Button>
        </CardHeader>

        <CardContent className="p-5 flex flex-col gap-3">
          {industriList.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Belum ada usaha industri rumah tangga yang dicatat.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {industriList.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-md border border-border bg-card"
                >
                  <div className="w-full sm:w-44 shrink-0">
                    <select
                      aria-label="Kategori Usaha"
                      value={item.kategori}
                      onChange={(e) => handleUpdateIndustri(idx, 'kategori', e.target.value)}
                      className="flex min-h-touch w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="PANGAN">Pangan / Olahan Makanan</option>
                      <option value="SANDANG">Sandang / Busana</option>
                      <option value="KONVEKSI">Konveksi / Jahit</option>
                      <option value="JASA">Jasa Keluarga</option>
                      <option value="LAIN_LAIN">Lain-lain</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <Input
                      aria-label="Komoditi Usaha"
                      type="text"
                      placeholder="Komoditi usaha (misal: Keripik Tempe / Kue Kering)"
                      value={item.komoditi}
                      onChange={(e) => handleUpdateIndustri(idx, 'komoditi', e.target.value)}
                      className="min-h-touch text-sm"
                    />
                  </div>

                  <div className="w-full sm:w-40 shrink-0">
                    <Input
                      aria-label="Volume Produksi"
                      type="text"
                      placeholder="Volume (misal: 25 kg/bln)"
                      value={item.volume}
                      onChange={(e) => handleUpdateIndustri(idx, 'volume', e.target.value)}
                      className="min-h-touch text-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIndustri(idx)}
                    className="min-h-touch min-w-touch text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-auto"
                    title="Hapus usaha ini"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Hapus Usaha</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
