import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { NotFoundError } from '@/services/errors';
import { milestoneService } from '@/services/milestone-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const { landmarkId } = z
      .object({
        landmarkId: z.string({ required_error: 'Missing landmarkId' }).min(1, 'Missing landmarkId'),
      })
      .parse(body);
    const item = await milestoneService.toggleLandmark(id, landmarkId);
    if (!item) {
      throw new NotFoundError('Milestone not found');
    }
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

