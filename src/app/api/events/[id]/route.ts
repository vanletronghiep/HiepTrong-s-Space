import { NextResponse, type NextRequest } from 'next/server';
import { patchEventInputSchema } from '@/contracts/event';
import { assertSameOriginMutation, handleApiError, parseJsonBody } from '@/server/api-response';
import { NotFoundError } from '@/services/errors';
import { eventService } from '@/services/event-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const item = await eventService.getEvent(id);
    if (!item) {
      throw new NotFoundError('Event not found');
    }
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const patch = patchEventInputSchema.parse(body);
    const item = await eventService.updateEvent(id, patch);
    if (!item) {
      throw new NotFoundError('Event not found');
    }
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    assertSameOriginMutation(_request);
    const { id } = await params;
    const deleted = await eventService.deleteEvent(id);
    if (!deleted) {
      throw new NotFoundError('Event not found');
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
