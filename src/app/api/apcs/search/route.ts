import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/api-response';
import { apcsService } from '@/services/apcs-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? '';
    const course = searchParams.get('course') ?? undefined;
    const category = searchParams.get('category') ?? undefined;

    const results = apcsService.searchFiles(query, course, category);
    return NextResponse.json({ success: true, data: results });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

