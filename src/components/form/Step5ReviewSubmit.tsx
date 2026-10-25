'use client';

import React from 'react';
import { CheckCircle2, Home, Users, Droplets, Sprout, Store, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface Step5Props {
  formData: any;
  isPublicResident?: boolean;
}

export function Step5ReviewSubmit({ formData, isPublicResident = false }: Step5Props) {
  const anggota = formData.anggota || [];
  const hatinya = formData.hatinyaPkk || [];
  const industri = formData.industriRumahTangga || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <h2 className="text-xl font-bold text-foreground">Ringkasan &amp; Konfirmasi Akhir</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Periksa kembali kebenaran seluruh isian formulir sebelum data dikirimkan ke pangkalan data SIMPATIK.
        </p>
      </div>

      {/* Status Notice Banner */}
      <div className="p-4 rounded-md bg-secondary border border-border flex items-start gap-3">
        <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          {isPublicResident ? <Clock className="size-5" /> : <CheckCircle2 className="size-5" />}
        </div>
        <div className="flex flex-col gap-1 text-sm text-foreground">
          <p className="font-bold">
            Status Pengiriman :{' '}
            {isPublicResident
              ? 'DRAFT (Menunggu Verifikasi Kader RT)'
              : 'TERVERIFIKASI (Input Langsung oleh Kader)'}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {isPublicResident
              ? 'Data yang diisi mandiri oleh warga akan masuk ke antrean verifikasi Kader RT setempat untuk diperiksa sebelum dihitung ke dalam rekapitulasi desa.'
              : 'Data yang diinput langsung oleh Kader akan otomatis tersimpan ke buku administrasi desa dan memperbarui rekapitulasi Dasawisma secara langsung.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Identitas Rumah Tangga */}
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-secondary/40 p-4 border-b border-border flex flex-row items-center gap-2">
            <Home className="size-4 text-primary shrink-0" />
            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
              Profil Rumah Tangga
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-2 text-sm text-foreground">
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Nomor KK:</span>
              <span className="font-mono font-bold">{formData.noKk || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Kepala Rumah Tangga:</span>
              <span className="font-semibold">{formData.namaKepalaRumahTangga || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5 border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Alamat:</span>
              <span>{formData.alamat || '-'}</span>
            </div>
            {formData.latitude && formData.longitude && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Koordinat:</span>
                <span className="font-mono text-xs">{formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Sanitasi */}
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-secondary/40 p-4 border-b border-border flex flex-row items-center gap-2">
            <Droplets className="size-4 text-primary shrink-0" />
            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
              Sanitasi &amp; Lingkungan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-2 text-sm text-foreground">
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Kriteria Rumah:</span>
              <Badge variant={formData.kriteriaRumah === 'SEHAT' ? 'default' : 'secondary'}>
                {formData.kriteriaRumah || 'SEHAT'}
              </Badge>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Jamban Keluarga:</span>
              <span className="font-semibold">
                {formData.jambanKeluarga ? `Ada (${formData.jumlahJamban || 1} buah)` : 'Tidak Ada'}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">Sumber Air Minum:</span>
              <span>{formData.sumberAir || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sampah / SPAL:</span>
              <span>
                {formData.tempatSampah ? 'Ada' : 'Tidak'} / {formData.spal ? 'Ada' : 'Tidak'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card 3: Anggota Keluarga */}
      <Card className="border-border shadow-sm">
        <CardHeader className="bg-secondary/40 p-4 border-b border-border flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary shrink-0" />
            <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
              Daftar Anggota Keluarga ({anggota.length} Jiwa)
            </CardTitle>
          </div>
          <Badge variant="secondary">{anggota.length} Terdaftar</Badge>
        </CardHeader>

        <CardContent className="p-0">
          {anggota.length === 0 ? (
            <p className="p-6 text-sm text-destructive font-medium text-center">
              Belum ada anggota keluarga yang didaftarkan.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Hubungan</TableHead>
                  <TableHead>L/P</TableHead>
                  <TableHead>Tanggal Lahir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggota.map((m: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-bold">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-foreground">{m.nama || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{m.nik || (m.isNikSementara ? '(NIK Sementara)' : '-')}</TableCell>
                    <TableCell>{m.hubunganKeluarga}</TableCell>
                    <TableCell>{m.jenisKelamin === 'L' ? 'L' : 'P'}</TableCell>
                    <TableCell>
                      {m.tanggalLahir ? new Date(m.tanggalLahir).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Card 4: Pekarangan & UP2K */}
      {(hatinya.length > 0 || industri.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hatinya.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-secondary/40 p-4 border-b border-border flex flex-row items-center gap-2">
                <Sprout className="size-4 text-primary shrink-0" />
                <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Pekarangan (Hatinya PKK)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-1.5 text-sm text-foreground">
                {hatinya.map((h: any, i: number) => (
                  <div key={i} className="flex justify-between border-b border-border/40 pb-1 last:border-0">
                    <span className="font-medium">{h.komoditi} ({h.kategori})</span>
                    <span className="text-muted-foreground">{h.jumlah}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {industri.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="bg-secondary/40 p-4 border-b border-border flex flex-row items-center gap-2">
                <Store className="size-4 text-amber-700 shrink-0" />
                <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Industri Rumah Tangga (UP2K)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-1.5 text-sm text-foreground">
                {industri.map((ind: any, i: number) => (
                  <div key={i} className="flex justify-between border-b border-border/40 pb-1 last:border-0">
                    <span className="font-medium">{ind.komoditi} ({ind.kategori})</span>
                    <span className="text-muted-foreground">{ind.volume}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
