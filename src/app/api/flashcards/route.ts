import { parseJsonBody, handleApiError } from '@/server/api-response';
import { NotFoundError, ValidationError } from '@/services/errors';
import { NextRequest, NextResponse } from 'next/server';
import {
  createCardInputSchema,
  createDeckInputSchema,
  reviewCardInputSchema,
} from '@/contracts/flashcard';
import { flashcardService } from '@/services/flashcard-service';

export async function GET() {
  try {
    const data = await flashcardService.getData();
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

    if (action === 'deck') {
      const validated = createDeckInputSchema.parse(body);
      const created = await flashcardService.createDeck(validated);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'card') {
      const validated = createCardInputSchema.parse(body);
      const created = await flashcardService.createCard(validated);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'review') {
      const validated = reviewCardInputSchema.parse(body);
      const updated = await flashcardService.reviewCard(validated);
      if (!updated) throw new NotFoundError('Record not found');
      return NextResponse.json({ success: true, data: updated });
    }

    throw new ValidationError('Unknown action');
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

