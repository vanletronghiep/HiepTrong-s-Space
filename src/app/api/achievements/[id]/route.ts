import { parseJsonBody, handleApiError, assertSameOriginMutation } from '@/server/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { patchAchievementInputSchema } from '@/contracts/achievement';
import { NotFoundError } from '@/services/errors';
import { achievementService } from '@/services/achievement-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = await achievementService.getAchievementById(id);
    if (!item) {
      throw new NotFoundError('Achievement not found');
    }
    return NextResponse.json({ success: true, data: item });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const patch = patchAchievementInputSchema.parse(body);
    const updated = await achievementService.updateAchievement(id, patch);
    if (!updated) {
      throw new NotFoundError('Achievement not found');
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOriginMutation(_request);
    const { id } = await params;
    const deleted = await achievementService.deleteAchievement(id);
    if (!deleted) {
      throw new NotFoundError('Achievement not found');
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

