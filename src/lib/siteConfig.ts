export interface DesaIdentity {
  nama: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
}

export const DESA_IDENTITY: DesaIdentity = {
  nama: process.env.DESA_NAMA || 'Grudo',
  kecamatan: process.env.DESA_KECAMATAN || 'Ngawi',
  kabupaten: process.env.DESA_KABUPATEN || 'Ngawi',
  provinsi: process.env.DESA_PROVINSI || 'Jawa Timur',
};
