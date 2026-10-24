import { NextRequest, NextResponse } from 'next/server';
import { generateCatatanKeluargaPdf } from '@/lib/pdfExport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Official print PDF for one family: renders the master workbook's
 * "catatan keluarga" sheet (Lampiran 4.15), injected with the family's
 * data, through LibreOffice. Query: ?keluargaId=<id>&tahun=<yyyy>
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keluargaId = searchParams.get('keluargaId');
  const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString(), 10);

  if (!keluargaId) {
    return NextResponse.json(
      { error: 'Parameter keluargaId wajib diisi' },
      { status: 400 }
    );
  }

  try {
    const pdf = await generateCatatanKeluargaPdf(keluargaId, tahun);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Catatan-Keluarga-Lampiran-4.15-${tahun}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating official PDF:', error);
    return NextResponse.json(
      { error: 'Gagal membuat PDF format resmi', details: error.message },
      { status: 500 }
    );
  }
}
