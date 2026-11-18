import { NextResponse, type NextRequest } from 'next/server';
import { handleApiError } from '@/server/api-response';
import { ValidationError } from '@/services/errors';
import { eventService } from '@/services/event-service';

/**
 * Resolved occurrences intersecting the half-open Asia/Saigon local-date interval
 * [from, to), including canceled entries. At most 366 days per request.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    if (!from || !to) {
      throw new ValidationError('Both from and to are required', {
        ...(from ? {} : { from: 'Required' }),
        ...(to ? {} : { to: 'Required' }),
      });
    }
    const items = await eventService.listOccurrences(from, to);
    return NextResponse.json({ items, from, to }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
