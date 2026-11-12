import { parseJsonBody, handleApiError } from '@/server/api-response';
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
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const validated = createLearningSessionInputSchema.parse(body);
    const created = await learningRoomService.createSession(validated);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

