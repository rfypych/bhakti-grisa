'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Step2Props {
  formData: any;
  updateField: (key: string, val: any) => void;
}

export function Step2Sanitasi({ formData, updateField }: Step2Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <h2 className="text-xl font-bold text-foreground">Sanitasi &amp; Lingkungan Fisik Rumah</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Kondisi sanitasi, jamban keluarga, sumber air minum, dan indikator PHBS (Lampiran 4.14.2a &amp; 4.15).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="kriteriaRumah">Kriteria Kelayakan Rumah</Label>
          <select
            id="kriteriaRumah"
            value={formData.kriteriaRumah || 'SEHAT'}
            onChange={(e) => updateField('kriteriaRumah', e.target.value)}
            className="flex min-h-touch w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
          >
            <option value="SEHAT">Sehat Layak Huni</option>
            <option value="KURANG_SEHAT">Kurang Sehat</option>
            <option value="TIDAK_SEHAT_LAYAK_HUNI">Tidak Sehat / Perlu Bedah Rumah</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sumberAir">Sumber Air Utama Keluarga</Label>
          <select
            id="sumberAir"
            value={formData.sumberAir || 'SUMUR'}
            onChange={(e) => updateField('sumberAir', e.target.value)}
            className="flex min-h-touch w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
          >
            <option value="PDAM">PDAM / Air Perpipaan</option>
            <option value="SUMUR">Sumur Gali / Pompa</option>
            <option value="SUNGAI">Sungai / Mata Air Alam</option>
            <option value="LAINNYA">Lainnya (Air Hujan / Tangki)</option>
          </select>
        </div>

        {/* Checkbox Card: Jamban Keluarga */}
        <div className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3">
          <label className="flex items-center justify-between min-h-touch cursor-pointer select-none">
            <span className="text-base font-semibold text-foreground">Jamban Keluarga</span>
            <input
              type="checkbox"
              checked={formData.jambanKeluarga ?? true}
              onChange={(e) => updateField('jambanKeluarga', e.target.checked)}
              className="size-5 rounded border-input text-primary focus:ring-ring"
            />
          </label>
          {formData.jambanKeluarga && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
              <Label htmlFor="jumlahJamban" className="text-xs text-muted-foreground font-medium">
                Jumlah Kloset / Jamban (buah)
              </Label>
              <Input
                id="jumlahJamban"
                type="number"
                min={1}
                max={10}
                value={formData.jumlahJamban || 1}
                onChange={(e) => updateField('jumlahJamban', parseInt(e.target.value, 10) || 1)}
                className="min-h-touch text-base"
              />
            </div>
          )}
        </div>

        {/* Checkbox Card: Tempat Sampah */}
        <div className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between gap-1">
          <label className="flex items-center justify-between min-h-touch cursor-pointer select-none">
            <span className="text-base font-semibold text-foreground">Tempat Pembuangan Sampah</span>
            <input
              type="checkbox"
              checked={formData.tempatSampah ?? true}
              onChange={(e) => updateField('tempatSampah', e.target.checked)}
              className="size-5 rounded border-input text-primary focus:ring-ring"
            />
          </label>
          <p className="text-xs text-muted-foreground leading-normal">
            Memiliki bak atau tempat sampah tertutup/terpisah di lingkungan rumah.
          </p>
        </div>

        {/* Checkbox Card: SPAL */}
        <div className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between gap-1">
          <label className="flex items-center justify-between min-h-touch cursor-pointer select-none">
            <span className="text-base font-semibold text-foreground">Saluran Air Limbah (SPAL)</span>
            <input
              type="checkbox"
              checked={formData.spal ?? true}
              onChange={(e) => updateField('spal', e.target.checked)}
              className="size-5 rounded border-input text-primary focus:ring-ring"
            />
          </label>
          <p className="text-xs text-muted-foreground leading-normal">
            Air limbah dapur/kamar mandi mengalir ke saluran atau resapan tertutup.
          </p>
        </div>

        {/* Checkbox Card: Stiker P4K */}
        <div className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between gap-1">
          <label className="flex items-center justify-between min-h-touch cursor-pointer select-none">
            <span className="text-base font-semibold text-foreground">Menempelkan Stiker P4K</span>
            <input
              type="checkbox"
              checked={formData.stikerP4k ?? false}
              onChange={(e) => updateField('stikerP4k', e.target.checked)}
              className="size-5 rounded border-input text-primary focus:ring-ring"
            />
          </label>
          <p className="text-xs text-muted-foreground leading-normal">
            Program Perencanaan Persalinan dan Pencegahan Komplikasi di depan rumah.
          </p>
        </div>

        {/* Makanan Pokok */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border">
          <div className="flex flex-col gap-2">
            <Label htmlFor="makananPokok">Makanan Pokok Utama</Label>
            <select
              id="makananPokok"
              value={formData.makananPokok || 'BERAS'}
              onChange={(e) => updateField('makananPokok', e.target.value)}
              className="flex min-h-touch w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            >
              <option value="BERAS">Beras</option>
              <option value="NON_BERAS">Non Beras (Jagung, Singkong, dll.)</option>
            </select>
          </div>

          {formData.makananPokok === 'NON_BERAS' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="jenisNonBeras">Jenis Makanan Pokok Non Beras</Label>
              <Input
                id="jenisNonBeras"
                type="text"
                placeholder="Contoh: Jagung, Tiwul, Umbi-umbian"
                value={formData.jenisNonBeras || ''}
                onChange={(e) => updateField('jenisNonBeras', e.target.value)}
                className="min-h-touch text-base"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
