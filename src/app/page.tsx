import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { INITIAL_WILAYAH, INITIAL_FAMILIES } from '@/lib/seedData';
import {
  Wilayah,
  KeluargaRecord,
  OfficerAccount,
  UserRole,
  StatusVerifikasi,
} from '@/lib/domain';
import { PublicBeranda, FAQ_ITEMS } from '@/components/public/PublicBeranda';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let wilayahList: Wilayah[] = INITIAL_WILAYAH;
  let families: KeluargaRecord[] = INITIAL_FAMILIES;
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'WARGA';

  try {
    const [dbWilayah, dbKeluarga, user] = await Promise.all([
      prisma.wilayah.findMany({
        orderBy: [{ dusun: 'asc' }, { rw: 'asc' }, { rt: 'asc' }],
      }),
      prisma.keluarga.findMany({
        where: { statusData: { not: 'ARSIP' } },
        include: {
          anggota: true,
          wilayah: true,
        },
      }),
      getSessionUser(),
    ]);

    if (dbWilayah && dbWilayah.length > 0) {
      wilayahList = dbWilayah.map((w) => ({
        id: w.id,
        dusun: w.dusun,
        rw: w.rw,
        rt: w.rt,
        namaDasawisma: w.namaDasawisma,
        aktif: true,
        ketuaDasawisma: w.ketuaNama || `Ibu RT ${w.rt}`,
        targetKK: 25,
      }));
    }

    if (dbKeluarga && dbKeluarga.length > 0) {
      families = dbKeluarga.map((k) => ({
        id: k.id,
        noKK: k.noKk,
        namaKepalaKeluarga: k.namaKepalaRumahTangga,
        wilayahId: k.wilayahId,
        dusun: k.wilayah?.dusun || '',
        rw: k.wilayah?.rw || '',
        rt: k.wilayah?.rt || '',
        namaDasawisma: k.wilayah?.namaDasawisma || '',
        alamat: k.alamat,
        latitude: k.latitude || -7.402,
        longitude: k.longitude || 111.442,
        tahunPendataan: 2026,
        status: (k.statusData === 'VERIFIKASI' ? 'VERIFIKASI' : 'DRAFT') as StatusVerifikasi,
        diinputOleh: 'WARGA_MANDIRI',
        tanggalInput: k.createdAt?.toISOString().split('T')[0] || '2026-10-28',
        tanggalUpdate: k.updatedAt?.toISOString().split('T')[0] || '2026-10-28',
        sanitasi: {
          kriteriaRumah:
            k.kriteriaRumah === 'KURANG_SEHAT'
              ? 'KURANG_SEHAT'
              : k.kriteriaRumah === 'TIDAK_SEHAT_LAYAK_HUNI'
                ? 'TIDAK_SEHAT'
                : 'SEHAT',
          punyaJamban: Boolean(k.jambanKeluarga),
          jumlahJamban: k.jumlahJamban || 1,
          sumberAir: k.sumberAir === 'PDAM' ? 'PDAM' : 'SUMUR_GALI',
          punyaSpal: Boolean(k.spal),
          punyaTempatSampah: Boolean(k.tempatSampah),
          tempelStikerP4k: Boolean(k.stikerP4k),
        },
        pekarangan: {
          tanamanKeras: false,
          toga: false,
          sayuran: false,
          perikanan: false,
          peternakan: false,
          industriRumahTangga: [],
          ikutUp2k: Boolean(k.aktivitasUp2k),
          jenisUsahaUp2k: k.jenisUsahaUp2k || undefined,
          makananPokok: k.makananPokok === 'NON_BERAS' ? 'NON_BERAS' : 'BERAS',
        },
        anggota: (k.anggota || []).map((a: any) => {
          const birthTime = a.tanggalLahir ? new Date(a.tanggalLahir).getTime() : 0;
          const ageYears = birthTime
            ? Math.floor((Date.now() - birthTime) / (365.25 * 24 * 3600 * 1000))
            : 30;
          return {
            id: a.id,
            nama: a.nama,
            nik: a.nik,
            isVirtualNik: Boolean(a.isNikSementara),
            hubungan: (a.hubunganKeluarga || 'KEPALA_KELUARGA') as any,
            jenisKelamin: a.jenisKelamin === 'P' ? 'P' : 'L',
            tempatLahir: a.tempatLahir,
            tanggalLahir: a.tanggalLahir?.toISOString().split('T')[0] || '1990-01-01',
            umur: ageYears,
            statusKawin: 'KAWIN',
            agama: 'ISLAM',
            pendidikan: 'SMA',
            pekerjaan: typeof a.pekerjaan === 'string' ? a.pekerjaan : 'WIRASWASTA',
            isBalita: ageYears < 5,
            isLansia: ageYears >= 60,
            isIbuHamil: false,
            isIbuMenyusui: false,
            isButaAksara: false,
            isDisabilitas: false,
            statusHidup:
              a.statusKehidupan === 'MENINGGAL'
                ? 'MENINGGAL'
                : a.statusKehidupan === 'PINDAH'
                  ? 'PINDAH'
                  : 'HIDUP',
          };
        }),
      }));
    }

    if (user) {
      currentRole = (user.peran as UserRole) || 'WARGA';
      currentUser = {
        id: user.id,
        nama: user.nama,
        username: user.username,
        passwordPlain: '',
        role: user.peran as any,
        aktif: user.aktif,
        scopeDusun: user.wilayah?.dusun,
        scopeRw: user.wilayah?.rw,
        scopeRt: user.wilayah?.rt,
        wilayahId: user.wilayahId || undefined,
        terakhirMasuk: user.updatedAt?.toISOString() || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Gagal memuat data dari Prisma, menggunakan data seed default:', err);
  }

  return (
    <PublicBeranda
      wilayahList={wilayahList}
      families={families}
      currentUser={currentUser}
      currentRole={currentRole}
    />
  );
}

export { PublicBeranda, FAQ_ITEMS };
