import { NextRequest, NextResponse } from 'next/server';
import { patchAchievementInputSchema } from '@/contracts/achievement';
import { achievementService } from '@/services/achievement-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = await achievementService.getAchievementById(id);
    if (!item) {
      return NextResponse.json({ success: false, error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch achievement';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = patchAchievementInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await achievementService.updateAchievement(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update achievement';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = await achievementService.deleteAchievement(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete achievement';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

