import { NextResponse, type NextRequest } from 'next/server';
import { createEventInputSchema } from '@/contracts/event';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { eventService } from '@/services/event-service';

export async function GET(): Promise<NextResponse> {
  try {
    const items = await eventService.listEvents();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await parseJsonBody(request);
    // The legacy-category escape hatch is reserved for server-side draft publication.
    const input = createEventInputSchema.parse(body);
    delete input.allowLegacyCategory;
    const item = await eventService.createEvent(input);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
