'use client';

import React from 'react';
import { Plus, Trash2, UserPlus, AlertCircle } from 'lucide-react';
import { calculateAge, classifyDemographics } from '@/lib/demographics';
import { generateVirtualNik } from '@/lib/virtualNik';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-emerald-950">Langkah 3: Anggota Keluarga</h2>
          <p className="text-sm text-stone-600 mt-1">
            Data warga individu, status demografi, akseptor KB, dan partisipasi 10 Program Pokok PKK.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddMember}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Anggota
        </button>
      </div>

      {anggotaList.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-lg bg-stone-50/50">
          <p className="text-sm text-stone-600">Belum ada anggota keluarga yang didaftarkan.</p>
          <button
            type="button"
            onClick={handleAddMember}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200"
          >
            <Plus className="w-4 h-4" /> Tambah Kepala Keluarga
          </button>
        </div>
      ) : (
        <div className="space-y-6">
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
              <div
                key={idx}
                className="p-5 rounded-lg border border-stone-200 bg-white shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900">
                      {member.nama || 'Anggota Baru'}{' '}
                      <span className="text-xs font-normal text-stone-500">
                        ({member.hubunganKeluarga || 'Status Belum Dipilih'})
                      </span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                    title="Hapus Anggota Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nama Lengkap <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={member.nama}
                      onChange={(e) => handleUpdateMember(idx, 'nama', e.target.value)}
                      placeholder="Nama sesuai dokumen"
                      className="w-full rounded border border-stone-300 px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Hubungan Keluarga <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={member.hubunganKeluarga}
                      onChange={(e) => handleUpdateMember(idx, 'hubunganKeluarga', e.target.value)}
                      className="w-full rounded border border-stone-300 px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
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

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Jenis Kelamin <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex items-center gap-4 py-1.5">
                      <label className="inline-flex items-center gap-1.5 text-xs text-stone-700">
                        <input
                          type="radio"
                          name={`jk_${idx}`}
                          checked={member.jenisKelamin === 'L'}
                          onChange={() => handleUpdateMember(idx, 'jenisKelamin', 'L')}
                          className="text-emerald-600"
                        />
                        Laki-Laki
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-stone-700">
                        <input
                          type="radio"
                          name={`jk_${idx}`}
                          checked={member.jenisKelamin === 'P'}
                          onChange={() => handleUpdateMember(idx, 'jenisKelamin', 'P')}
                          className="text-emerald-600"
                        />
                        Perempuan
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Tanggal Lahir <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={
                        member.tanggalLahir
                          ? typeof member.tanggalLahir === 'string'
                            ? member.tanggalLahir.substring(0, 10)
                            : member.tanggalLahir.toISOString().substring(0, 10)
                          : ''
                      }
                      onChange={(e) => handleUpdateMember(idx, 'tanggalLahir', e.target.value)}
                      className="w-full rounded border border-stone-300 px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                    {member.tanggalLahir && (
                      <span className="text-[11px] text-emerald-800 font-medium mt-0.5 block">
                        Usia: {age} tahun{' '}
                        {flags?.isBalita && '(Balita)'}
                        {flags?.isLansia && '(Lansia)'}
                        {flags?.isWus && '(WUS)'}
                        {flags?.isPus && '(PUS)'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={member.tempatLahir}
                      onChange={(e) => handleUpdateMember(idx, 'tempatLahir', e.target.value)}
                      placeholder="Kota / Kabupaten"
                      className="w-full rounded border border-stone-300 px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-700">
                        Nomor Induk Kependudukan (NIK)
                      </label>
                      <label className="inline-flex items-center gap-1 text-[11px] text-amber-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(member.isNikSementara)}
                          onChange={(e) => handleUpdateMember(idx, 'isNikSementara', e.target.checked)}
                          className="h-3 w-3 rounded border-amber-400 text-amber-600"
                        />
                        NIK Sementara
                      </label>
                    </div>
                    <input
                      type="text"
                      maxLength={member.isNikSementara ? 24 : 16}
                      value={member.nik}
                      onChange={(e) => handleUpdateMember(idx, 'nik', e.target.value)}
                      placeholder={member.isNikSementara ? 'TEMP-YYYYMMDD-XXXX' : '16 digit NIK Dukcapil'}
                      className="w-full rounded border border-stone-300 px-2.5 py-1.5 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                    />
                    {member.isNikSementara && (
                      <span className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> NIK virtual otomatis untuk bayi/warga belum ber-KTP.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Status Perkawinan</label>
                    <select
                      value={member.statusPerkawinan}
                      onChange={(e) => handleUpdateMember(idx, 'statusPerkawinan', e.target.value)}
                      className="w-full rounded border border-stone-300 px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="BELUM_KAWIN">Belum Kawin / Lajang</option>
                      <option value="KAWIN">Kawin</option>
                      <option value="JANDA">Janda</option>
                      <option value="DUDA">Duda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Pendidikan Terakhir</label>
                    <select
                      value={member.pendidikan}
                      onChange={(e) => handleUpdateMember(idx, 'pendidikan', e.target.value)}
                      className="w-full rounded border border-stone-300 px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
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

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Pekerjaan</label>
                    <select
                      value={member.pekerjaan}
                      onChange={(e) => handleUpdateMember(idx, 'pekerjaan', e.target.value)}
                      className="w-full rounded border border-stone-300 px-2.5 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
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

                {/* Sub-section: Program Sosial & 10 Program PKK */}
                <div className="pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="inline-flex items-center gap-1.5 text-stone-700">
                    <input
                      type="checkbox"
                      checked={Boolean(member.akseptorKb)}
                      onChange={(e) => handleUpdateMember(idx, 'akseptorKb', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Akseptor KB
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-stone-700">
                    <input
                      type="checkbox"
                      checked={Boolean(member.posyanduAktif)}
                      onChange={(e) => handleUpdateMember(idx, 'posyanduAktif', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Posyandu Aktif
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-stone-700">
                    <input
                      type="checkbox"
                      checked={Boolean(member.memilikiTabungan)}
                      onChange={(e) => handleUpdateMember(idx, 'memilikiTabungan', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Punya Tabungan
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-stone-700">
                    <input
                      type="checkbox"
                      checked={Boolean(member.bkb)}
                      onChange={(e) => handleUpdateMember(idx, 'bkb', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Ikut BKB
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-stone-700">
                    <input
                      type="checkbox"
                      checked={Boolean(member.kegPancasila)}
                      onChange={(e) => handleUpdateMember(idx, 'kegPancasila', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Keg. Pancasila
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-stone-700">
                    <input
                      type="checkbox"
                      checked={Boolean(member.kegGotongRoyong)}
                      onChange={(e) => handleUpdateMember(idx, 'kegGotongRoyong', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Gotong Royong
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-stone-700">
                    <input
                      type="checkbox"
                      checked={Boolean(member.kegKeagamaan)}
                      onChange={(e) => handleUpdateMember(idx, 'kegKeagamaan', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Keagamaan
                  </label>

                  <label className="inline-flex items-center gap-1.5 text-stone-700">
                    <input
                      type="checkbox"
                      checked={Boolean(member.disabilitas)}
                      onChange={(e) => handleUpdateMember(idx, 'disabilitas', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600"
                    />
                    Disabilitas
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
