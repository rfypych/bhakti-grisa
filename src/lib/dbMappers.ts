import {
  Wilayah,
  KeluargaRecord,
  PeristiwaRecord,
  OfficerAccount,
  StatusVerifikasi,
} from '@/lib/domain';

export function mapDbWilayahToDomain(w: any): Wilayah {
  return {
    id: w.id,
    dusun: w.dusun,
    rw: w.rw,
    rt: w.rt,
    namaDasawisma: w.namaDasawisma,
    aktif: true,
    ketuaDasawisma: w.ketuaNama || `Ibu RT ${w.rt}`,
    targetKK: 25,
  };
}

export function mapDbKeluargaToDomain(k: any): KeluargaRecord {
  const anggotaList = (k.anggota || []).map((a: any) => {
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
      jenisKelamin: (a.jenisKelamin === 'P' ? 'P' : 'L') as 'L' | 'P',
      tempatLahir: a.tempatLahir || 'Ngawi',
      tanggalLahir: a.tanggalLahir
        ? new Date(a.tanggalLahir).toISOString().split('T')[0]
        : '1990-01-01',
      umur: ageYears,
      statusKawin: (a.statusPerkawinan || 'BELUM_KAWIN') as any,
      agama: (a.agama || 'ISLAM') as any,
      pendidikan: (a.pendidikan || 'SMA') as any,
      pekerjaan: typeof a.pekerjaan === 'string' ? a.pekerjaan : 'WIRASWASTA',
      isBalita: ageYears < 5,
      isLansia: ageYears >= 60,
      isIbuHamil: (() => {
        if (a.jenisKelamin !== 'P') return false;
        const events = a.peristiwaVital || [];
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
      statusHidup: (a.statusKehidupan === 'MENINGGAL'
        ? 'MENINGGAL'
        : a.statusKehidupan === 'PINDAH'
        ? 'PINDAH'
        : 'HIDUP') as 'HIDUP' | 'MENINGGAL' | 'PINDAH',
      akseptorKb: Boolean(a.akseptorKb),
    };
  });

  let status: StatusVerifikasi = 'DRAFT';
  if (k.statusData === 'VERIFIKASI') {
    status = 'VERIFIKASI';
  } else if (k.statusData === 'ARSIP') {
    status = 'DITOLAK';
  } else {
    status = 'DRAFT';
  }

  return {
    id: k.id,
    noKK: k.noKk,
    namaKepalaKeluarga: k.namaKepalaRumahTangga,
    wilayahId: k.wilayahId,
    dusun: k.wilayah?.dusun || '',
    rw: k.wilayah?.rw || '',
    rt: k.wilayah?.rt || '',
    namaDasawisma: k.wilayah?.namaDasawisma || '',
    alamat: k.alamat,
    latitude: k.latitude ?? -7.4065,
    longitude: k.longitude ?? 111.4395,
    tahunPendataan: 2026,
    status,
    catatanRevisi: k.catatanVerifikasi || undefined,
    diinputOleh: k.statusData === 'DRAFT' ? 'WARGA_MANDIRI' : 'KADER_RT',
    tanggalInput: k.createdAt
      ? new Date(k.createdAt).toISOString().split('T')[0]
      : '2026-10-28',
    tanggalUpdate: k.updatedAt
      ? new Date(k.updatedAt).toISOString().split('T')[0]
      : '2026-10-28',
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
      tanamanKeras: k.hatinyaPkk?.some((h: any) => h.kategori === 'tanaman keras') || false,
      toga: k.hatinyaPkk?.some((h: any) => h.kategori === 'toga') || false,
      sayuran: k.hatinyaPkk?.some((h: any) => h.kategori === 'warung hidup') || false,
      perikanan: k.hatinyaPkk?.some((h: any) => h.kategori === 'perikanan') || false,
      peternakan: k.hatinyaPkk?.some((h: any) => h.kategori === 'peternakan') || false,
      industriRumahTangga: (k.industriRumahTangga || []).map((i: any) =>
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
    anggota: anggotaList,
  };
}

export function mapDbPeristiwaToDomain(ev: any): PeristiwaRecord {
  const fam = ev.anggota?.keluarga;
  const wil = fam?.wilayah;
  let jenis: any = 'KELAHIRAN';
  if (ev.jenisPeristiwa === 'KELAHIRAN_BAYI') jenis = 'KELAHIRAN';
  else if (ev.jenisPeristiwa?.startsWith('KEMATIAN')) jenis = 'KEMATIAN';
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
    jenisKelamin: ev.jenisKelaminBayi === 'P' || ev.anggota?.jenisKelamin === 'P' ? 'P' : 'L',
    tanggalPeristiwa: ev.tanggalPeristiwa
      ? new Date(ev.tanggalPeristiwa).toISOString().split('T')[0]
      : '2026-10-28',
    keterangan: ev.keterangan || (ev.sebabKematian ? `Sebab: ${ev.sebabKematian}` : ''),
    namaIbu: ev.keterangan?.includes('Ibu: ')
      ? ev.keterangan.split('Ibu: ')[1]?.split(',')[0]
      : undefined,
    nikBayi: ev.anggota?.nik,
    dicatatOleh: 'Kader RT',
  };
}

export function mapDbUserToOfficer(u: any): OfficerAccount {
  return {
    id: u.id,
    nama: u.nama,
    username: u.username,
    passwordPlain: '',
    role: u.peran,
    aktif: u.aktif,
    scopeDusun: u.wilayah?.dusun,
    scopeRw: u.wilayah?.rw,
    scopeRt: u.wilayah?.rt,
    wilayahId: u.wilayahId || undefined,
    terakhirMasuk: u.updatedAt
      ? new Date(u.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}
