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
    const message = err instanceof Error ? err.message : 'Failed to retrieve entertainment data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    if (action === 'book') {
      const parsed = createBookInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const created = await entertainmentService.createBook(parsed.data);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'game') {
      const parsed = createGameInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const created = await entertainmentService.createGame(parsed.data);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'update-book') {
      const { bookId, progressPercentage, status } = body;
      if (!bookId) {
        return NextResponse.json({ success: false, error: 'bookId required' }, { status: 400 });
      }
      const updated = await entertainmentService.updateBookProgress(bookId, Number(progressPercentage), status);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process entertainment request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

