import { NextRequest, NextResponse } from 'next/server';
import { generateOfficialExcelWorkbook } from '@/lib/excelTemplate';
import { getSessionUser, getScopeWilayahIds } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Autentikasi diperlukan. Silakan login untuk mengunduh laporan resmi.' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString(), 10);
  const semester = searchParams.get('semester') || undefined;
  const rtId = searchParams.get('rtId') || 'all';
  const dasawismaId = searchParams.get('dasawismaId') || undefined;
  const keluargaId = searchParams.get('keluargaId') || undefined;

  // Enforce RBAC territorial scoping (KADER_RT, PENGURUS_RW, PENGURUS_DUSUN)
  const allowedWilayahIds = await getScopeWilayahIds(user);
  if (allowedWilayahIds !== null) {
    if (rtId === 'all') {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda tidak memiliki wewenang untuk mengunduh rekapitulasi seluruh desa.' },
        { status: 403 }
      );
    }
    if (keluargaId) {
      const fam = await prisma.keluarga.findUnique({
        where: { id: keluargaId },
        select: { wilayahId: true },
      });
      if (!fam || !allowedWilayahIds.includes(fam.wilayahId)) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat mengunduh data warga di wilayah tugas Anda.' },
          { status: 403 }
        );
      }
    }
    if (dasawismaId && !allowedWilayahIds.includes(dasawismaId)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda hanya dapat mengunduh data di wilayah tugas Anda.' },
        { status: 403 }
      );
    }
    if (rtId && rtId !== 'all') {
      const match = await prisma.wilayah.findFirst({
        where: {
          id: { in: allowedWilayahIds },
          rt: rtId,
        },
      });
      if (!match) {
        return NextResponse.json(
          { error: 'Akses ditolak: RT tersebut berada di luar wilayah tugas Anda.' },
          { status: 403 }
        );
      }
    }
  }

  try {
    const buffer = await generateOfficialExcelWorkbook({
      tahun,
      semester,
      rtId,
      dasawismaId,
      keluargaId,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="SIMPATIK_Laporan_${tahun}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating Excel export:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel workbook', details: error.message },
      { status: 500 }
    );
  }
}
