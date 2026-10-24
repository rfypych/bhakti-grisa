import { NextRequest, NextResponse } from 'next/server';
import { generateOfficialExcelWorkbook } from '@/lib/excelTemplate';
import { getSessionUser } from '@/lib/auth';

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
