import { z } from 'zod';
import { parseJsonBody, handleApiError } from '@/server/api-response';
import { NotFoundError, ValidationError } from '@/services/errors';
import { NextRequest, NextResponse } from 'next/server';
import {
  createHabitInputSchema,
  logScreenTimeInputSchema,
  logSleepInputSchema,
} from '@/contracts/tracking';
import { trackingService } from '@/services/tracking-service';

export async function GET() {
  try {
    const data = await trackingService.getTrackingData();
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

    if (action === 'toggle-habit') {
      const { habitId, date } = z
        .object({ habitId: z.string().min(1, 'habitId is required'), date: z.string().date() })
        .parse(body);
      const updated = await trackingService.toggleHabit(habitId, date);
      if (!updated) throw new NotFoundError('Record not found');
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'habit') {
      const validated = createHabitInputSchema.parse(body);
      const created = await trackingService.createHabit(validated);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'sleep') {
      const validated = logSleepInputSchema.parse(body);
      const created = await trackingService.logSleep(validated);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'screen-time') {
      const validated = logScreenTimeInputSchema.parse(body);
      const created = await trackingService.logScreenTime(validated);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    throw new ValidationError('Unknown tracking action');
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

