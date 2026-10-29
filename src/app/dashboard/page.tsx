import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import {
  Wilayah,
  KeluargaRecord,
  PeristiwaRecord,
  OfficerAccount,
  UserRole,
  StatusVerifikasi,
} from '@/lib/domain';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

export const metadata = {
  title: 'Dashboard Statistik TP PKK - SIMPATIK Grudo',
  description: 'Ringkasan eksekutif dan rekapitulasi data Dasawisma Desa Grudo.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ wilayahId?: string; tahun?: string; q?: string }>;
}) {
  const resolvedParams = await searchParams;
  let wilayahList: Wilayah[] = [];
  let families: KeluargaRecord[] = [];
  let events: PeristiwaRecord[] = [];
  let currentUser: OfficerAccount | null = null;
  let currentRole: UserRole = 'ADMIN_DESA';

  try {
    const [dbWilayah, dbKeluarga, dbEvents, user] = await Promise.all([
      prisma.wilayah.findMany({
        orderBy: [{ dusun: 'asc' }, { rw: 'asc' }, { rt: 'asc' }],
      }),
      prisma.keluarga.findMany({
        where: { statusData: { not: 'ARSIP' } },
        include: {
          anggota: {
            include: { peristiwaVital: true },
          },
          wilayah: true,
          hatinyaPkk: true,
          industriRumahTangga: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.peristiwaVital.findMany({
        include: {
          anggota: {
            include: {
              keluarga: {
                include: { wilayah: true },
              },
            },
          },
        },
        orderBy: { tanggalPeristiwa: 'desc' },
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
        tahunPendataan: k.createdAt ? new Date(k.createdAt).getFullYear() : 2026,
        status: (k.statusData === 'VERIFIKASI' ? 'VERIFIKASI' : 'DRAFT') as StatusVerifikasi,
        catatanRevisi: undefined,
        diinputOleh: 'KADER_RT',
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
          tanamanKeras: k.hatinyaPkk?.some((h) => h.kategori === 'tanaman keras') || false,
          toga: k.hatinyaPkk?.some((h) => h.kategori === 'toga') || false,
          sayuran: k.hatinyaPkk?.some((h) => h.kategori === 'warung hidup') || false,
          perikanan: k.hatinyaPkk?.some((h) => h.kategori === 'perikanan') || false,
          peternakan: k.hatinyaPkk?.some((h) => h.kategori === 'peternakan') || false,
          industriRumahTangga: (k.industriRumahTangga || []).map((i) =>
            i.kategori === 'sandang'
              ? 'SANDANG'
              : i.kategori === 'kerajinan'
                ? 'KERAJINAN'
                : i.kategori === 'jasa'
                  ? 'JASA'
                  : 'PANGAN'
          ),
          ikutUp2k: Boolean(k.aktivitasUp2k),
          jenisUsahaUp2k: k.jenisUsahaUp2k || undefined,
          makananPokok: k.makananPokok === 'NON_BERAS' ? 'NON_BERAS' : 'BERAS',
        },
        anggota: (k.anggota || []).map((a) => {
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
            statusKawin: (a.statusPerkawinan || 'BELUM_KAWIN') as any,
            agama: (a.agama || 'ISLAM') as any,
            pendidikan: (a.pendidikan || 'SMA') as any,
            pekerjaan: typeof a.pekerjaan === 'string' ? a.pekerjaan : 'WIRASWASTA',
            isBalita: ageYears < 5,
            isLansia: ageYears >= 60,
            isIbuHamil: (() => {
              if (a.jenisKelamin !== 'P') return false;
              const events = (a as any).peristiwaVital || [];
              if (!events.length) return false;
              let lastPregnancyDate: Date | null = null;
              let concluded = false;
              const sorted = [...events].sort(
                (x: any, y: any) => new Date(x.tanggalPeristiwa).getTime() - new Date(y.tanggalPeristiwa).getTime()
              );
              for (const ev of sorted) {
                if (ev.jenisPeristiwa === 'KEHAMILAN') {
                  lastPregnancyDate = new Date(ev.tanggalPeristiwa);
                  concluded = false;
                } else if (
                  lastPregnancyDate &&
                  (ev.jenisPeristiwa === 'PERSALINAN_MELAHIRKAN' ||
                    ev.jenisPeristiwa === 'NIFAS' ||
                    ev.jenisPeristiwa === 'KELAHIRAN_BAYI' ||
                    ev.jenisPeristiwa === 'KEMATIAN_IBU')
                ) {
                  concluded = true;
                }
              }
              return Boolean(lastPregnancyDate && !concluded);
            })(),
            isIbuMenyusui: false,
            isButaAksara: Boolean(a.tigaButa),
            isDisabilitas: Boolean(a.disabilitas),
            statusHidup:
              a.statusKehidupan === 'MENINGGAL'
                ? 'MENINGGAL'
                : a.statusKehidupan === 'PINDAH'
                  ? 'PINDAH'
                  : 'HIDUP',
            akseptorKb: Boolean(a.akseptorKb),
          };
        }),
      }));
    }

    if (dbEvents && dbEvents.length > 0) {
      events = dbEvents.map((ev) => {
        const fam = ev.anggota?.keluarga;
        const wil = fam?.wilayah;
        let jenis: any = 'KELAHIRAN';
        if (ev.jenisPeristiwa === 'KELAHIRAN_BAYI') jenis = 'KELAHIRAN';
        else if (ev.jenisPeristiwa.startsWith('KEMATIAN')) jenis = 'KEMATIAN';
        else if (ev.jenisPeristiwa === 'KEHAMILAN') jenis = 'KEHAMILAN';
        else if (ev.jenisPeristiwa === 'NIFAS') jenis = 'NIFAS';
        else if (ev.jenisPeristiwa === 'MUTASI_KELUAR') jenis = 'MUTASI_KELUAR';

        return {
          id: ev.id,
          jenis,
          keluargaId: fam?.id || '',
          noKK: fam?.noKk || '',
          namaKepalaKeluarga: fam?.namaKepalaRumahTangga || '',
          wilayahId: wil?.id || '',
          rt: wil?.rt || '',
          rw: wil?.rw || '',
          dusun: wil?.dusun || '',
          namaSubjek: ev.namaBayi || ev.namaAlmarhum || ev.anggota?.nama || 'Warga Grudo',
          jenisKelamin: ev.jenisKelaminBayi === 'P' ? 'P' : 'L',
          tanggalPeristiwa: ev.tanggalPeristiwa.toISOString().split('T')[0],
          keterangan: ev.keterangan || '',
          nikBayi: ev.anggota?.nik,
          dicatatOleh: 'Kader RT',
        };
      });
    }

    if (user) {
      currentRole = (user.peran as UserRole) || 'ADMIN_DESA';
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
    console.warn('Gagal memuat data dari Prisma untuk DashboardPage:', err);
  }

  return (
    <DashboardHome
      families={families}
      wilayahList={wilayahList}
      events={events}
      currentUser={currentUser}
      currentRole={currentRole}
      globalSearch={resolvedParams.q || ''}
      initialTahun={resolvedParams.tahun ? Number(resolvedParams.tahun) : 2026}
    />
  );
}

export { DashboardHome };
