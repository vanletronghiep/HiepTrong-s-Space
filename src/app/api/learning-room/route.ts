import { NextRequest, NextResponse } from 'next/server';
import { createLearningSessionInputSchema } from '@/contracts/learning-room';
import { learningRoomService } from '@/services/learning-room-service';

export async function GET() {
  try {
    const [sessions, stats] = await Promise.all([
      learningRoomService.getSessions(),
      learningRoomService.getStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        stats,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch learning room data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createLearningSessionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const created = await learningRoomService.createSession(parsed.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to log session';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

