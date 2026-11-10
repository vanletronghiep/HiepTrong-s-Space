import { NextResponse, type NextRequest } from 'next/server';
import { createMilestoneInputSchema } from '@/contracts/milestone';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { milestoneService } from '@/services/milestone-service';

export async function GET(): Promise<NextResponse> {
  try {
    const items = await milestoneService.listMilestones();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await parseJsonBody(request);
    const input = createMilestoneInputSchema.parse(body);
    const item = await milestoneService.createMilestone(input);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

