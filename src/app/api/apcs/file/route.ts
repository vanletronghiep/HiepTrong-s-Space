import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/api-response';
import { NotFoundError, ValidationError } from '@/services/errors';
import { apcsService } from '@/services/apcs-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const relPath = searchParams.get('path');
    const download = searchParams.get('download') === 'true';

    if (!relPath) {
      throw new ValidationError('Path is required', { path: 'Path is required' });
    }

    const file = apcsService.getFileBuffer(relPath);
    if (!file) {
      throw new NotFoundError('File not found or inaccessible');
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
    return handleApiError(err);
  }
}
