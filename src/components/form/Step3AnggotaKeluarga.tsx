'use client';

import React from 'react';
import { Plus, Trash2, UserPlus, AlertCircle, User } from 'lucide-react';
import { calculateAge, classifyDemographics } from '@/lib/demographics';
import { generateVirtualNik } from '@/lib/virtualNik';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Step3Props {
  formData: any;
  updateField: (key: string, val: any) => void;
}

export function Step3AnggotaKeluarga({ formData, updateField }: Step3Props) {
  const anggotaList = formData.anggota || [];

  const handleAddMember = () => {
    const newMember = {
      nama: '',
      nik: '',
      isNikSementara: false,
      hubunganKeluarga: anggotaList.length === 0 ? 'KEPALA_KELUARGA' : 'ANAK',
      jenisKelamin: 'L',
      tempatLahir: '',
      tanggalLahir: '',
      agama: 'ISLAM',
      pendidikan: 'SMA_SMK_SEDERAJAT',
      pekerjaan: 'SWASTA',
      statusPerkawinan: 'BELUM_KAWIN',
      disabilitas: false,
      tigaButa: false,
      akseptorKb: false,
      posyanduAktif: false,
      bkb: false,
      memilikiTabungan: false,
      kegPancasila: false,
      kegGotongRoyong: false,
      kegKeagamaan: false,
    };
    updateField('anggota', [...anggotaList, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    const updated = anggotaList.filter((_: any, i: number) => i !== index);
    updateField('anggota', updated);
  };

  const handleUpdateMember = (index: number, field: string, value: any) => {
    const updated = anggotaList.map((m: any, i: number) => {
      if (i !== index) return m;
      const nextMember = { ...m, [field]: value };

      // Auto generate temporary NIK preview when checkbox checked
      if (field === 'isNikSementara' && value === true) {
        if (!nextMember.nik || !nextMember.nik.startsWith('TEMP-')) {
          const birthDate = nextMember.tanggalLahir ? new Date(nextMember.tanggalLahir) : new Date();
          nextMember.nik = generateVirtualNik(birthDate);
        }
      }
      return nextMember;
    });
    updateField('anggota', updated);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Anggota Keluarga</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Data kependudukan individu, status demografi, akseptor KB, dan partisipasi 10 Program Pokok PKK.
          </p>
        </div>
        <Button
          type="button"
          size="default"
          onClick={handleAddMember}
          className="min-h-touch self-start sm:self-auto text-base"
        >
          <UserPlus className="size-5" data-icon="inline-start" />
          <span>Tambah Anggota Keluarga</span>
        </Button>
      </div>

      {anggotaList.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-2 border-border bg-secondary/30">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <User className="size-6" />
          </div>
          <p className="text-base font-semibold text-foreground">Belum ada anggota keluarga yang didaftarkan.</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Klik tombol di bawah untuk mendaftarkan Kepala Keluarga atau anggota keluarga lainnya.
          </p>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleAddMember}
            className="mt-4 min-h-touch text-base"
          >
            <Plus className="size-5 text-primary" data-icon="inline-start" />
            <span>Tambah Kepala Keluarga</span>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {anggotaList.map((member: any, idx: number) => {
            const age = member.tanggalLahir ? calculateAge(new Date(member.tanggalLahir)) : 0;
            const flags = member.tanggalLahir
              ? classifyDemographics({
                  tanggalLahir: new Date(member.tanggalLahir),
                  jenisKelamin: member.jenisKelamin,
                  statusPerkawinan: member.statusPerkawinan,
                  tigaButa: member.tigaButa,
                })
              : null;

            return (
              <Card key={idx} className="border-border shadow-sm overflow-hidden">
                <CardHeader className="bg-secondary/40 p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                        {member.nama || 'Anggota Keluarga Baru'}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground font-medium block">
                        Hubungan: {member.hubunganKeluarga || 'Belum Dipilih'}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(idx)}
                    className="min-h-touch min-w-touch text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Hapus Anggota Keluarga Ini"
                  >
                    <Trash2 className="size-5" />
                    <span className="sr-only">Hapus Anggota Ini</span>
                  </Button>
                </CardHeader>

                <CardContent className="p-5 sm:p-6 flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`nama_${idx}`}>
                        Nama Lengkap Sesuai Dokumen <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`nama_${idx}`}
                        type="text"
                        value={member.nama}
                        onChange={(e) => handleUpdateMember(idx, 'nama', e.target.value)}
                        placeholder="Contoh: Siti Fatimah"
                        className="min-h-touch text-base"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`hub_${idx}`}>
                        Hubungan dalam Keluarga <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id={`hub_${idx}`}
                        value={member.hubunganKeluarga}
                        onChange={(e) => handleUpdateMember(idx, 'hubunganKeluarga', e.target.value)}
                        className="flex min-h-touch w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      >
                        <option value="KEPALA_KELUARGA">Kepala Keluarga</option>
                        <option value="ISTRI">Istri</option>
                        <option value="ANAK">Anak</option>
                        <option value="ORANG_TUA">Orang Tua</option>
                        <option value="MENANTU">Menantu</option>
                        <option value="CUCU">Cucu</option>
                        <option value="FAMILI_LAIN">Famili Lain</option>
                        <option value="PEMBANTU">Pembantu</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>
                        Jenis Kelamin <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2 min-h-touch items-center">
                        <label className="flex items-center gap-2 p-2.5 rounded-md border border-input bg-background cursor-pointer select-none text-sm font-semibold">
                          <input
                            type="radio"
                            name={`jk_${idx}`}
                            checked={member.jenisKelamin === 'L'}
                            onChange={() => handleUpdateMember(idx, 'jenisKelamin', 'L')}
                            className="size-4 text-primary focus:ring-ring"
                          />
                          <span>Laki-Laki</span>
                        </label>

                        <label className="flex items-center gap-2 p-2.5 rounded-md border border-input bg-background cursor-pointer select-none text-sm font-semibold">
                          <input
                            type="radio"
                            name={`jk_${idx}`}
                            checked={member.jenisKelamin === 'P'}
                            onChange={() => handleUpdateMember(idx, 'jenisKelamin', 'P')}
                            className="size-4 text-primary focus:ring-ring"
                          />
                          <span>Perempuan</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`tgl_${idx}`}>
                        Tanggal Lahir <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`tgl_${idx}`}
                        type="date"
                        value={
                          member.tanggalLahir
                            ? typeof member.tanggalLahir === 'string'
                              ? member.tanggalLahir.substring(0, 10)
                              : member.tanggalLahir.toISOString().substring(0, 10)
                            : ''
                        }
                        onChange={(e) => handleUpdateMember(idx, 'tanggalLahir', e.target.value)}
                        className="min-h-touch text-base"
                      />
                      {member.tanggalLahir && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="secondary">Usia {age} th</Badge>
                          {flags?.isBalita && <Badge variant="default">Balita</Badge>}
                          {flags?.isLansia && <Badge variant="secondary">Lansia</Badge>}
                          {flags?.isWus && <Badge variant="outline">WUS</Badge>}
                          {flags?.isPus && <Badge variant="outline">PUS</Badge>}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`tmpt_${idx}`}>Tempat Lahir</Label>
                      <Input
                        id={`tmpt_${idx}`}
                        type="text"
                        value={member.tempatLahir}
                        onChange={(e) => handleUpdateMember(idx, 'tempatLahir', e.target.value)}
                        placeholder="Kota / Kabupaten"
                        className="min-h-touch text-base"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`nik_${idx}`}>Nomor Induk Kependudukan (NIK)</Label>
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(member.isNikSementara)}
                            onChange={(e) => handleUpdateMember(idx, 'isNikSementara', e.target.checked)}
                            className="size-4 rounded border-input text-primary"
                          />
                          <span>NIK Sementara</span>
                        </label>
                      </div>
                      <Input
                        id={`nik_${idx}`}
                        type="text"
                        maxLength={member.isNikSementara ? 24 : 16}
                        value={member.nik}
                        onChange={(e) => handleUpdateMember(idx, 'nik', e.target.value)}
                        placeholder={member.isNikSementara ? 'TEMP-YYYYMMDD-XXXX' : '16 digit NIK Dukcapil'}
                        className="min-h-touch text-base font-mono"
                      />
                      {member.isNikSementara && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <AlertCircle className="size-3.5 text-warning-foreground shrink-0" />
                          <span>NIK sementara otomatis untuk bayi/warga belum memiliki KTP.</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`status_kawin_${idx}`}>Status Perkawinan</Label>
                      <select
                        id={`status_kawin_${idx}`}
                        value={member.statusPerkawinan}
                        onChange={(e) => handleUpdateMember(idx, 'statusPerkawinan', e.target.value)}
                        className="flex min-h-touch w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      >
                        <option value="BELUM_KAWIN">Belum Kawin / Lajang</option>
                        <option value="KAWIN">Kawin</option>
                        <option value="JANDA">Janda</option>
                        <option value="DUDA">Duda</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`pendidikan_${idx}`}>Pendidikan Terakhir</Label>
                      <select
                        id={`pendidikan_${idx}`}
                        value={member.pendidikan}
                        onChange={(e) => handleUpdateMember(idx, 'pendidikan', e.target.value)}
                        className="flex min-h-touch w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      >
                        <option value="TIDAK_TAMAT_SD">Tidak Tamat SD</option>
                        <option value="SD_MI">SD / MI</option>
                        <option value="SMP_SEDERAJAT">SMP / Sederajat</option>
                        <option value="SMA_SMK_SEDERAJAT">SMA / SMK / Sederajat</option>
                        <option value="DIPLOMA">Diploma (D1-D3)</option>
                        <option value="S1">Strata 1 (S1)</option>
                        <option value="S2">Magister (S2)</option>
                        <option value="S3">Doktor (S3)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`pekerjaan_${idx}`}>Pekerjaan</Label>
                      <select
                        id={`pekerjaan_${idx}`}
                        value={member.pekerjaan}
                        onChange={(e) => handleUpdateMember(idx, 'pekerjaan', e.target.value)}
                        className="flex min-h-touch w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      >
                        <option value="PETANI">Petani</option>
                        <option value="PEDAGANG">Pedagang</option>
                        <option value="SWASTA">Karyawan Swasta</option>
                        <option value="WIRAUSAHA">Wiraswasta / UMKM</option>
                        <option value="PNS">PNS / ASN</option>
                        <option value="TNI_POLRI">TNI / POLRI</option>
                        <option value="TIDAK_BEKERJA">Tidak Bekerja / IRT</option>
                        <option value="LAINNYA">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  {/* 10 Program Pokok PKK & Partisipasi Sosial */}
                  <div className="pt-4 border-t border-border flex flex-col gap-2">
                    <Label className="text-sm font-bold text-foreground">
                      Partisipasi 10 Program Pokok PKK &amp; Kesehatan
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <label className="flex items-center gap-2 p-3 rounded-md border border-border bg-card cursor-pointer select-none text-xs sm:text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(member.akseptorKb)}
                          onChange={(e) => handleUpdateMember(idx, 'akseptorKb', e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>Akseptor KB</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-md border border-border bg-card cursor-pointer select-none text-xs sm:text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(member.posyanduAktif)}
                          onChange={(e) => handleUpdateMember(idx, 'posyanduAktif', e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>Posyandu Aktif</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-md border border-border bg-card cursor-pointer select-none text-xs sm:text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(member.memilikiTabungan)}
                          onChange={(e) => handleUpdateMember(idx, 'memilikiTabungan', e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>Punya Tabungan</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-md border border-border bg-card cursor-pointer select-none text-xs sm:text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(member.bkb)}
                          onChange={(e) => handleUpdateMember(idx, 'bkb', e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>Ikut BKB</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-md border border-border bg-card cursor-pointer select-none text-xs sm:text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(member.kegPancasila)}
                          onChange={(e) => handleUpdateMember(idx, 'kegPancasila', e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>Keg. Pancasila</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-md border border-border bg-card cursor-pointer select-none text-xs sm:text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(member.kegGotongRoyong)}
                          onChange={(e) => handleUpdateMember(idx, 'kegGotongRoyong', e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>Gotong Royong</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-md border border-border bg-card cursor-pointer select-none text-xs sm:text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(member.kegKeagamaan)}
                          onChange={(e) => handleUpdateMember(idx, 'kegKeagamaan', e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>Keagamaan</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-md border border-border bg-card cursor-pointer select-none text-xs sm:text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(member.disabilitas)}
                          onChange={(e) => handleUpdateMember(idx, 'disabilitas', e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>Disabilitas</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
