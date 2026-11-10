import { NextResponse, type NextRequest } from 'next/server';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { milestoneService } from '@/services/milestone-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await parseJsonBody(request)) as { landmarkId?: string };
    if (!body?.landmarkId) {
      return NextResponse.json({ error: 'Missing landmarkId' }, { status: 400 });
    }
    const item = await milestoneService.toggleLandmark(id, body.landmarkId);
    if (!item) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

