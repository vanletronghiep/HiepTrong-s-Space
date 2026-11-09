import { NextResponse, type NextRequest } from 'next/server';
import type { ApiErrorResponse, TaskDto } from '@/contracts';
import { assertSameOriginMutation, handleApiError, parseUuidParam } from '@/server/api-response';
import { getContainer } from '@/server/container';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<{ item: TaskDto } | ApiErrorResponse>> {
  try {
    assertSameOriginMutation(request);
    const { id } = await context.params;
    const taskId = parseUuidParam(id, 'Invalid task id');
    const { taskService } = await getContainer();
    const item = await taskService.completeTask(taskId);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
