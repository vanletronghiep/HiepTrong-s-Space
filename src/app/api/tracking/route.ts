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
    const message = err instanceof Error ? err.message : 'Failed to retrieve tracking data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    if (action === 'toggle-habit') {
      const { habitId, date } = body;
      if (!habitId || !date) {
        return NextResponse.json({ success: false, error: 'habitId and date required' }, { status: 400 });
      }
      const updated = await trackingService.toggleHabit(habitId, date);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'habit') {
      const parsed = createHabitInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const created = await trackingService.createHabit(parsed.data);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'sleep') {
      const parsed = logSleepInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const created = await trackingService.logSleep(parsed.data);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    if (action === 'screen-time') {
      const parsed = logScreenTimeInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const created = await trackingService.logScreenTime(parsed.data);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Unknown tracking action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process tracking request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

