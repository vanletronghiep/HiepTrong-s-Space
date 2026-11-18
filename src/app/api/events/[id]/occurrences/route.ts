import { NextResponse, type NextRequest } from 'next/server';
import { occurrenceMutationSchema } from '@/contracts/event';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { eventService } from '@/services/event-service';

/** Scoped class command: edit, cancel, or delete this week only or this week onward. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const mutation = occurrenceMutationSchema.parse(body);
    const result = await eventService.mutateOccurrence(id, mutation);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
