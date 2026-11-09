import { NextResponse, type NextRequest } from 'next/server';
import type { ApiErrorResponse, NotificationDto } from '@/contracts';
import { assertSameOriginMutation, handleApiError, parseUuidParam } from '@/server/api-response';
import { getContainer } from '@/server/container';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<{ item: NotificationDto } | ApiErrorResponse>> {
  try {
    assertSameOriginMutation(request);
    const { id } = await context.params;
    const notificationId = parseUuidParam(id, 'Invalid notification id');
    const { notificationService } = await getContainer();
    const item = await notificationService.markUnread(notificationId);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
