export interface DesaIdentity {
  nama: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
}

export const DESA_IDENTITY: DesaIdentity = {
  nama: process.env.DESA_NAMA || 'Desa Bhakti Grisa',
  kecamatan: process.env.DESA_KECAMATAN || 'Kecamatan Cerdas',
  kabupaten: process.env.DESA_KABUPATEN || 'Kabupaten Mandiri',
  provinsi: process.env.DESA_PROVINSI || 'Jawa Tengah',
};
