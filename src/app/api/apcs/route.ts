import { NextRequest, NextResponse } from 'next/server';
import { apcsService } from '@/services/apcs-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subpath = searchParams.get('path');

    if (subpath !== null) {
      const listing = apcsService.getDirectory(subpath);
      return NextResponse.json({ success: true, data: listing });
    }

    const overview = apcsService.getOverview();
    return NextResponse.json({ success: true, data: overview });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve APCS resources';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

