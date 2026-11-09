import { NextResponse, type NextRequest } from 'next/server';
import type { ApiErrorResponse } from '@/contracts';
import { assertSameOriginMutation, handleApiError } from '@/server/api-response';
import { getContainer } from '@/server/container';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ ok: true; updatedCount: number } | ApiErrorResponse>> {
  try {
    assertSameOriginMutation(request);
    const { notificationService } = await getContainer();
    const { updatedCount } = await notificationService.markAllRead();
    return NextResponse.json({ ok: true, updatedCount }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
