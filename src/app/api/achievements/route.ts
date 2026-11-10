import { NextRequest, NextResponse } from 'next/server';
import { createAchievementInputSchema } from '@/contracts/achievement';
import { achievementService } from '@/services/achievement-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const era = searchParams.get('era') ?? undefined;

    const list = await achievementService.getAchievements(era);
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch achievements';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAchievementInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const created = await achievementService.createAchievement(parsed.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create achievement';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

