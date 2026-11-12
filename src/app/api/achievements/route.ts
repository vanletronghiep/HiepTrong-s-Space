import { parseJsonBody, handleApiError } from '@/server/api-response';
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
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const validated = createAchievementInputSchema.parse(body);
    const created = await achievementService.createAchievement(validated);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

