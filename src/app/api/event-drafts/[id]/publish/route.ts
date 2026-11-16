import { NextResponse, type NextRequest } from 'next/server';
import { publishEventDraftInputSchema } from '@/contracts/event-draft';
import { assertSameOriginMutation, handleApiError } from '@/server/api-response';
import { ValidationError } from '@/services/errors';
import { eventDraftService } from '@/services/event-draft-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function parseOptionalPublishBody(request: NextRequest): Promise<unknown> {
  assertSameOriginMutation(request);
  const contentType = request.headers.get('content-type');
  if (contentType !== null && !contentType.toLowerCase().includes('application/json')) {
    throw new ValidationError('Content-Type must be application/json');
  }
  const raw = await request.text();
  if (!raw.trim()) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError('Malformed JSON request body');
  }
}

export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await parseOptionalPublishBody(request);
    const options = publishEventDraftInputSchema.parse(body);
    const result = await eventDraftService.publishDraft(id, options);
    return NextResponse.json(
      {
        item: result.event,
        alreadyPublished: result.alreadyPublished,
        mode: result.mode,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
