import { NextRequest, NextResponse } from 'next/server';
import { apcsService } from '@/services/apcs-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const relPath = searchParams.get('path');
    const download = searchParams.get('download') === 'true';

    if (!relPath) {
      return NextResponse.json({ success: false, error: 'Path is required' }, { status: 400 });
    }

    const file = apcsService.getFileBuffer(relPath);
    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found or inaccessible' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', file.mimeType);
    headers.set('Content-Length', file.buffer.length.toString());

    if (download) {
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error accessing file';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
