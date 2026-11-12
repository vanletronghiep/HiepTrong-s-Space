import { NextResponse, type NextRequest } from 'next/server';
import { patchMilestoneInputSchema } from '@/contracts/milestone';
import { assertSameOriginMutation, handleApiError, parseJsonBody } from '@/server/api-response';
import { NotFoundError } from '@/services/errors';
import { milestoneService } from '@/services/milestone-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const item = await milestoneService.getMilestone(id);
    if (!item) {
      throw new NotFoundError('Milestone not found');
    }
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const patch = patchMilestoneInputSchema.parse(body);
    const item = await milestoneService.updateMilestone(id, patch);
    if (!item) {
      throw new NotFoundError('Milestone not found');
    }
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    assertSameOriginMutation(_request);
    const { id } = await params;
    const deleted = await milestoneService.deleteMilestone(id);
    if (!deleted) {
      throw new NotFoundError('Milestone not found');
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
