'use server';

import { prisma } from '@/lib/prisma';
import { generateVirtualNik } from '@/lib/virtualNik';

export interface AnggotaInputData {
  id?: string;
  nik?: string;
  isNikSementara?: boolean;
  noRegistrasi?: string;
  nama: string;
  hubunganKeluarga: any;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string | Date;
  agama?: any;
  pendidikan?: any;
  pekerjaan?: any;
  statusPerkawinan?: any;
  jabatanPkk?: string;
  disabilitas?: boolean;
  jenisDisabilitas?: string;
  tigaButa?: boolean;
  // Social Programs
  akseptorKb?: boolean;
  jenisKb?: string;
  posyanduAktif?: boolean;
  frekuensiPosyandu?: number;
  bkb?: boolean;
  memilikiTabungan?: boolean;
  kelompokBelajar?: string;
  paudSejenis?: boolean;
  kegiatanKoperasi?: boolean;
  jenisKoperasi?: string;
  // 10 Program PKK
  kegPancasila?: boolean;
  kegGotongRoyong?: boolean;
  kegRukunKematian?: boolean;
  kegKeagamaan?: boolean;
  kegJimpitan?: boolean;
  kegArisan?: boolean;
  kegPendidikanKeterampilan?: boolean;
  kegKoperasi?: boolean;
  kegPangan?: boolean;
  kegSandang?: boolean;
  kegKesehatan?: boolean;
  kegPerencanaanSehat?: boolean;
}

export interface HatinyaPkkInput {
  kategori: string;
  komoditi: string;
  jumlah: string;
}

export interface IndustriRumahTanggaInput {
  kategori: string;
  komoditi: string;
  volume: string;
}

export interface KeluargaInputData {
  id?: string;
  noKk: string;
  namaKepalaRumahTangga: string;
  alamat: string;
  wilayahId: string;
  latitude?: number | null;
  longitude?: number | null;
  kriteriaRumah?: any;
  jambanKeluarga?: boolean;
  jumlahJamban?: number;
  sumberAir?: any;
  tempatSampah?: boolean;
  spal?: boolean;
  stikerP4k?: boolean;
  makananPokok?: any;
  jenisNonBeras?: string | null;
  aktivitasUp2k?: boolean;
  jenisUsahaUp2k?: string | null;
  kegiatanKesling?: boolean;
  statusData?: 'DRAFT' | 'VERIFIKASI' | 'ARSIP';
  catatanVerifikasi?: string | null;
  anggota?: AnggotaInputData[];
  hatinyaPkk?: HatinyaPkkInput[];
  industriRumahTangga?: IndustriRumahTanggaInput[];
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Server action to save a family record and its related entities.
 * Automatically marks data as DRAFT for public resident submissions,
 * or VERIFIKASI for cadre direct entries.
 */
export async function saveKeluargaAction(
  formData: KeluargaInputData,
  isPublicResident: boolean = false
): Promise<ActionResult> {
  try {
    if (!formData.noKk || formData.noKk.trim().length < 5) {
      return { success: false, error: 'Nomor Kartu Keluarga (KK) wajib diisi dengan benar.' };
    }
    if (!formData.namaKepalaRumahTangga || formData.namaKepalaRumahTangga.trim().length === 0) {
      return { success: false, error: 'Nama Kepala Rumah Tangga wajib diisi.' };
    }
    if (!formData.wilayahId) {
      return { success: false, error: 'Wilayah / Dasawisma wajib dipilih.' };
    }
    if (!formData.anggota || formData.anggota.length === 0) {
      return { success: false, error: 'Formulir wajib memiliki minimal 1 anggota keluarga (Kepala Keluarga).' };
    }

    const targetStatus = isPublicResident ? 'DRAFT' : 'VERIFIKASI';

    // Guard duplicate KK: If existing record is VERIFIKASI and submitted from public form or different ID, reject
    const existingKk = await prisma.keluarga.findUnique({
      where: { noKk: formData.noKk },
    });
    if (existingKk && existingKk.statusData === 'VERIFIKASI') {
      if (isPublicResident || (formData.id && formData.id !== existingKk.id)) {
        return {
          success: false,
          error: 'Nomor KK sudah terdaftar dan terverifikasi di sistem Desa Grudo. Silakan hubungi Kader Dasawisma setempat.',
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert Keluarga
      const existing = await tx.keluarga.findUnique({
        where: { noKk: formData.noKk },
      });

      let keluargaRecord;
      const keluargaPayload = {
        namaKepalaRumahTangga: formData.namaKepalaRumahTangga,
        alamat: formData.alamat || 'Alamat RT',
        wilayahId: formData.wilayahId,
        latitude: formData.latitude ?? null,
        longitude: formData.longitude ?? null,
        kriteriaRumah: formData.kriteriaRumah || 'SEHAT',
        jambanKeluarga: formData.jambanKeluarga ?? true,
        jumlahJamban: formData.jumlahJamban ?? 1,
        sumberAir: formData.sumberAir || 'SUMUR',
        tempatSampah: formData.tempatSampah ?? true,
        spal: formData.spal ?? true,
        stikerP4k: formData.stikerP4k ?? false,
        makananPokok: formData.makananPokok || 'BERAS',
        jenisNonBeras: formData.jenisNonBeras ?? null,
        aktivitasUp2k: formData.aktivitasUp2k ?? false,
        jenisUsahaUp2k: formData.jenisUsahaUp2k ?? null,
        kegiatanKesling: formData.kegiatanKesling ?? false,
        statusData: targetStatus as any,
        catatanVerifikasi: formData.catatanVerifikasi ?? null,
      };

      if (existing) {
        keluargaRecord = await tx.keluarga.update({
          where: { id: existing.id },
          data: keluargaPayload,
        });

        // Clear previous sub-records to replace cleanly
        await tx.hatinyaPkk.deleteMany({ where: { keluargaId: keluargaRecord.id } });
        await tx.industriRumahTangga.deleteMany({ where: { keluargaId: keluargaRecord.id } });
      } else {
        keluargaRecord = await tx.keluarga.create({
          data: {
            noKk: formData.noKk,
            ...keluargaPayload,
          },
        });
      }

      // 2. Members (Anggota Keluarga)
      if (formData.anggota && formData.anggota.length > 0) {
        for (const m of formData.anggota) {
          const birthDate = m.tanggalLahir ? new Date(m.tanggalLahir) : new Date();
          let finalNik = m.nik?.trim() || '';

          if (m.isNikSementara || !finalNik) {
            finalNik = generateVirtualNik(birthDate);
          }

          await tx.anggotaKeluarga.upsert({
            where: { nik: finalNik },
            update: {
              keluargaId: keluargaRecord.id,
              noRegistrasi: m.noRegistrasi || null,
              isNikSementara: Boolean(m.isNikSementara),
              nama: m.nama,
              hubunganKeluarga: m.hubunganKeluarga || 'ANAK',
              jenisKelamin: m.jenisKelamin || 'L',
              tempatLahir: m.tempatLahir || 'Desa',
              tanggalLahir: birthDate,
              agama: m.agama || 'ISLAM',
              pendidikan: m.pendidikan || 'SMA_SMK_SEDERAJAT',
              pekerjaan: m.pekerjaan || 'SWASTA',
              statusPerkawinan: m.statusPerkawinan || 'BELUM_KAWIN',
              jabatanPkk: m.jabatanPkk || null,
              disabilitas: Boolean(m.disabilitas),
              jenisDisabilitas: m.jenisDisabilitas || null,
              tigaButa: Boolean(m.tigaButa),
              akseptorKb: Boolean(m.akseptorKb),
              jenisKb: m.jenisKb || null,
              posyanduAktif: Boolean(m.posyanduAktif),
              frekuensiPosyandu: m.frekuensiPosyandu || 0,
              bkb: Boolean(m.bkb),
              memilikiTabungan: Boolean(m.memilikiTabungan),
              kelompokBelajar: m.kelompokBelajar || null,
              paudSejenis: Boolean(m.paudSejenis),
              kegiatanKoperasi: Boolean(m.kegiatanKoperasi),
              jenisKoperasi: m.jenisKoperasi || null,
              kegPancasila: Boolean(m.kegPancasila),
              kegGotongRoyong: Boolean(m.kegGotongRoyong),
              kegRukunKematian: Boolean(m.kegRukunKematian),
              kegKeagamaan: Boolean(m.kegKeagamaan),
              kegJimpitan: Boolean(m.kegJimpitan),
              kegArisan: Boolean(m.kegArisan),
              kegPendidikanKeterampilan: Boolean(m.kegPendidikanKeterampilan),
              kegKoperasi: Boolean(m.kegKoperasi),
              kegPangan: Boolean(m.kegPangan),
              kegSandang: Boolean(m.kegSandang),
              kegKesehatan: Boolean(m.kegKesehatan),
              kegPerencanaanSehat: Boolean(m.kegPerencanaanSehat),
            },
            create: {
              keluargaId: keluargaRecord.id,
              nik: finalNik,
              noRegistrasi: m.noRegistrasi || null,
              isNikSementara: Boolean(m.isNikSementara),
              nama: m.nama,
              hubunganKeluarga: m.hubunganKeluarga || 'ANAK',
              jenisKelamin: m.jenisKelamin || 'L',
              tempatLahir: m.tempatLahir || 'Desa',
              tanggalLahir: birthDate,
              agama: m.agama || 'ISLAM',
              pendidikan: m.pendidikan || 'SMA_SMK_SEDERAJAT',
              pekerjaan: m.pekerjaan || 'SWASTA',
              statusPerkawinan: m.statusPerkawinan || 'BELUM_KAWIN',
              jabatanPkk: m.jabatanPkk || null,
              disabilitas: Boolean(m.disabilitas),
              jenisDisabilitas: m.jenisDisabilitas || null,
              tigaButa: Boolean(m.tigaButa),
              akseptorKb: Boolean(m.akseptorKb),
              jenisKb: m.jenisKb || null,
              posyanduAktif: Boolean(m.posyanduAktif),
              frekuensiPosyandu: m.frekuensiPosyandu || 0,
              bkb: Boolean(m.bkb),
              memilikiTabungan: Boolean(m.memilikiTabungan),
              kelompokBelajar: m.kelompokBelajar || null,
              paudSejenis: Boolean(m.paudSejenis),
              kegiatanKoperasi: Boolean(m.kegiatanKoperasi),
              jenisKoperasi: m.jenisKoperasi || null,
              kegPancasila: Boolean(m.kegPancasila),
              kegGotongRoyong: Boolean(m.kegGotongRoyong),
              kegRukunKematian: Boolean(m.kegRukunKematian),
              kegKeagamaan: Boolean(m.kegKeagamaan),
              kegJimpitan: Boolean(m.kegJimpitan),
              kegArisan: Boolean(m.kegArisan),
              kegPendidikanKeterampilan: Boolean(m.kegPendidikanKeterampilan),
              kegKoperasi: Boolean(m.kegKoperasi),
              kegPangan: Boolean(m.kegPangan),
              kegSandang: Boolean(m.kegSandang),
              kegKesehatan: Boolean(m.kegKesehatan),
              kegPerencanaanSehat: Boolean(m.kegPerencanaanSehat),
            },
          });
        }
      }

      // 3. Hatinya PKK
      if (formData.hatinyaPkk && formData.hatinyaPkk.length > 0) {
        for (const h of formData.hatinyaPkk) {
          if (h.komoditi?.trim()) {
            await tx.hatinyaPkk.create({
              data: {
                keluargaId: keluargaRecord.id,
                kategori: h.kategori || 'WARUNG_HIDUP',
                komoditi: h.komoditi,
                jumlah: h.jumlah || '1',
              },
            });
          }
        }
      }

      // 4. Industri Rumah Tangga (UP2K)
      if (formData.industriRumahTangga && formData.industriRumahTangga.length > 0) {
        for (const ind of formData.industriRumahTangga) {
          if (ind.komoditi?.trim()) {
            await tx.industriRumahTangga.create({
              data: {
                keluargaId: keluargaRecord.id,
                kategori: ind.kategori || 'PANGAN',
                komoditi: ind.komoditi,
                volume: ind.volume || '1',
              },
            });
          }
        }
      }

      return keluargaRecord;
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('[saveKeluargaAction] Error:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan sistem saat menyimpan data.' };
  }
}
