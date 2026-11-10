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
    const message = err instanceof Error ? err.message : 'Failed to retrieve flashcards';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    if (action === 'deck') {
      const parsed = createDeckInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const created = await flashcardService.createDeck(parsed.data);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'card') {
      const parsed = createCardInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const created = await flashcardService.createCard(parsed.data);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'review') {
      const parsed = reviewCardInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const updated = await flashcardService.reviewCard(parsed.data);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process flashcard request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

