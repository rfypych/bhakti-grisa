import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Wilayah data...');

  const sampleWilayah = [
    {
      dusun: 'Krajan',
      rw: '01',
      rt: '01',
      namaDasawisma: 'Melati 1',
      ketuaNama: 'Ibu Siti Aminah',
      kontak: '081234567890',
    },
    {
      dusun: 'Krajan',
      rw: '01',
      rt: '01',
      namaDasawisma: 'Melati 2',
      ketuaNama: 'Ibu Rahayu',
      kontak: '081234567891',
    },
    {
      dusun: 'Krajan',
      rw: '01',
      rt: '02',
      namaDasawisma: 'Mawar 1',
      ketuaNama: 'Ibu Anisa',
      kontak: '081234567892',
    },
    {
      dusun: 'Krajan',
      rw: '02',
      rt: '01',
      namaDasawisma: 'Anggrek 1',
      ketuaNama: 'Ibu Dewi Sartika',
      kontak: '081234567893',
    },
    {
      dusun: 'Tegalsari',
      rw: '01',
      rt: '01',
      namaDasawisma: 'Kenanga 1',
      ketuaNama: 'Ibu Sri Wahyuni',
      kontak: '081234567894',
    },
  ];

  for (const w of sampleWilayah) {
    await prisma.wilayah.upsert({
      where: {
        dusun_rw_rt_namaDasawisma: {
          dusun: w.dusun,
          rw: w.rw,
          rt: w.rt,
          namaDasawisma: w.namaDasawisma,
        },
      },
      update: {},
      create: w,
    });
  }

  console.log('Seeding initial ADMIN_DESA user...');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn(
      '⚠️  [PERINGATAN KERAS] SEED_ADMIN_PASSWORD tidak diset. Menggunakan kata sandi default "admin123". SEGERA UBAH DI PRODUCTION!'
    );
  }

  const existingAdmin = await prisma.pengguna.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.pengguna.create({
      data: {
        nama: 'Administrator Desa',
        username: 'admin',
        kataSandiHash: hash,
        peran: 'ADMIN_DESA',
        aktif: true,
      },
    });
    console.log('Akun ADMIN_DESA pertama (username: "admin") berhasil dibuat.');
  } else {
    console.log('Akun ADMIN_DESA "admin" sudah ada (idempoten, tidak ditimpa).');
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
