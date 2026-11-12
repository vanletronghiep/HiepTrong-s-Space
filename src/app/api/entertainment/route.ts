import { z } from 'zod';
import { parseJsonBody, handleApiError } from '@/server/api-response';
import { NotFoundError, ValidationError } from '@/services/errors';
import { NextRequest, NextResponse } from 'next/server';
import {
  createBookInputSchema,
  createGameInputSchema,
} from '@/contracts/entertainment';
import { entertainmentService } from '@/services/entertainment-service';

export async function GET() {
  try {
    const data = await entertainmentService.getData();
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await parseJsonBody(request);

    if (action === 'book') {
      const validated = createBookInputSchema.parse(body);
      const created = await entertainmentService.createBook(validated);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'game') {
      const validated = createGameInputSchema.parse(body);
      const created = await entertainmentService.createGame(validated);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'update-book') {
      const { bookId, progressPercentage, status } = z
        .object({
          bookId: z.string().min(1, 'bookId is required'),
          progressPercentage: z.number().min(0).max(100),
          status: z.enum(['reading', 'completed', 'want_to_read']).optional(),
        })
        .parse(body);
      const updated = await entertainmentService.updateBookProgress(
        bookId,
        progressPercentage,
        status,
      );
      if (!updated) throw new NotFoundError('Record not found');
      return NextResponse.json({ success: true, data: updated });
    }

    throw new ValidationError('Unknown action');
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

