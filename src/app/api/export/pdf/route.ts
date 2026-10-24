import { NextRequest, NextResponse } from 'next/server';
import { generateOfficialPdf, ExportPdfJenis, PDF_EXPORT_CONFIGS } from '@/lib/pdfExport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Official print PDF route: renders a single master workbook sheet into PDF
 * format using LibreOffice.
 *
 * Query Parameters:
 * - jenis: 'catatan-keluarga' (default) | 'data-warga' | 'data-keluarga' | 'rekap-dasawisma' | 'rekap-desa'
 * - keluargaId: ID keluarga (wajib untuk sheet keluarga)
 * - wilayahId: ID wilayah (opsional untuk rekap)
 * - tahun: yyyy (default tahun berjalan)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jenis = (searchParams.get('jenis') || 'catatan-keluarga') as ExportPdfJenis;
  const keluargaId = searchParams.get('keluargaId');
  const wilayahId = searchParams.get('wilayahId') || undefined;
  const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString(), 10);

  const config = PDF_EXPORT_CONFIGS[jenis];
  if (!config) {
    return NextResponse.json(
      {
        error: `Jenis lampiran "${jenis}" tidak valid. Pilihan: ${Object.keys(PDF_EXPORT_CONFIGS).join(', ')}`,
      },
      { status: 400 }
    );
  }

  if (config.isFamilySheet && !keluargaId) {
    return NextResponse.json(
      { error: 'Parameter keluargaId wajib diisi untuk format lampiran keluarga' },
      { status: 400 }
    );
  }

  try {
    const { pdfBuffer, filename } = await generateOfficialPdf(jenis, {
      keluargaId: keluargaId || undefined,
      tahun,
      wilayahId,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
