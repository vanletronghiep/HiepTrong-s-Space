import { NextResponse, type NextRequest } from 'next/server';
import { patchEventDraftInputSchema } from '@/contracts/event-draft';
import { assertSameOriginMutation, handleApiError, parseJsonBody } from '@/server/api-response';
import { NotFoundError } from '@/services/errors';
import { eventDraftService } from '@/services/event-draft-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const item = await eventDraftService.getDraft(id);
    if (!item) {
      throw new NotFoundError('Event draft not found');
    }
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const patch = patchEventDraftInputSchema.parse(body);
    const item = await eventDraftService.updateDraft(id, patch);
    if (!item) {
      throw new NotFoundError('Event draft not found');
    }
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    assertSameOriginMutation(request);
    const { id } = await params;
    const deleted = await eventDraftService.deleteDraft(id);
    if (!deleted) {
      throw new NotFoundError('Event draft not found');
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
