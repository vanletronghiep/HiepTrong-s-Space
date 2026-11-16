import { NextResponse, type NextRequest } from 'next/server';
import { saveEventDraftInputSchema } from '@/contracts/event-draft';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { eventDraftService } from '@/services/event-draft-service';

export async function GET(): Promise<NextResponse> {
  try {
    const items = await eventDraftService.listDrafts();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await parseJsonBody(request);
    const input = saveEventDraftInputSchema.parse(body);
    const result = await eventDraftService.saveDraft(input);
    return NextResponse.json(
      { item: result.item, created: result.created },
      { status: result.created ? 201 : 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
