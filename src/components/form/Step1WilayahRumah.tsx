'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface WilayahOption {
  id: string;
  dusun: string;
  rw: string;
  rt: string;
  namaDasawisma: string;
}

interface Step1Props {
  formData: any;
  updateField: (key: string, val: any) => void;
  wilayahList?: WilayahOption[];
}

export function Step1WilayahRumah({ formData, updateField, wilayahList = [] }: Step1Props) {
  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateField('latitude', pos.coords.latitude);
          updateField('longitude', pos.coords.longitude);
        },
        (err) => {
          alert('Tidak dapat mendeteksi lokasi GPS: ' + err.message);
        }
      );
    } else {
      alert('Fitur Geolocation tidak didukung di perangkat ini.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <h2 className="text-xl font-bold text-foreground">Wilayah &amp; Lokasi Rumah</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tentukan kelompok Dasawisma binaan, identitas kepala rumah tangga, dan koordinat tempat tinggal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="wilayahId">
            Kelompok Dasawisma / Wilayah <span className="text-destructive">*</span>
          </Label>
          <select
            id="wilayahId"
            value={formData.wilayahId || ''}
            onChange={(e) => updateField('wilayahId', e.target.value)}
            className="flex min-h-touch w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
          >
            <option value="">-- Pilih Kelompok Dasawisma --</option>
            {wilayahList.map((w) => (
              <option key={w.id} value={w.id}>
                {w.namaDasawisma} (RT {w.rt} / RW {w.rw} : Dusun {w.dusun})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="noKk">
            Nomor Kartu Keluarga (No. KK) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="noKk"
            type="text"
            maxLength={16}
            placeholder="16 digit nomor KK"
            value={formData.noKk || ''}
            onChange={(e) => updateField('noKk', e.target.value)}
            className="min-h-touch text-base"
          />
          {formData.noKk && formData.noKk.length !== 16 && (
            <span className="text-xs font-semibold text-warning-foreground">
              Panjang No. KK saat ini {formData.noKk.length} digit (standar Dukcapil 16 digit).
            </span>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label htmlFor="namaKepalaRumahTangga">
            Nama Kepala Rumah Tangga (KRT) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="namaKepalaRumahTangga"
            type="text"
            placeholder="Nama lengkap kepala rumah tangga"
            value={formData.namaKepalaRumahTangga || ''}
            onChange={(e) => updateField('namaKepalaRumahTangga', e.target.value)}
            className="min-h-touch text-base"
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label htmlFor="alamat">Alamat Lengkap Rumah</Label>
          <textarea
            id="alamat"
            rows={3}
            placeholder="Nama jalan, gang, nomor rumah, RT/RW, atau patokan lingkungan sekitar"
            value={formData.alamat || ''}
            onChange={(e) => updateField('alamat', e.target.value)}
            className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors leading-relaxed"
          />
        </div>

        <div className="md:col-span-2 p-5 bg-muted/40 rounded-lg border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="size-9 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Titik Koordinat Spasial Rumah</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {formData.latitude && formData.longitude
                  ? `Lintang: ${formData.latitude.toFixed(6)}, Bujur: ${formData.longitude.toFixed(6)}`
                  : 'Belum terdeteksi (Gunakan tombol GPS di depan rumah warga)'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleGetLocation}
            className="min-h-touch w-full sm:w-auto text-sm"
          >
            <Navigation className="size-4 text-primary" data-icon="inline-start" />
            <span>Ambil Titik Lokasi GPS</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
