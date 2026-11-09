import { NextResponse, type NextRequest } from 'next/server';
import { transferTaskInputSchema, type ApiErrorResponse, type TaskDto } from '@/contracts';
import { handleApiError, parseJsonBody, parseUuidParam } from '@/server/api-response';
import { getContainer } from '@/server/container';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<{ item: TaskDto } | ApiErrorResponse>> {
  try {
    const { id } = await context.params;
    const taskId = parseUuidParam(id, 'Invalid task id');
    const body = await parseJsonBody(request);
    const input = transferTaskInputSchema.parse(body);
    const { taskService } = await getContainer();
    const item = await taskService.transferTask(taskId, input);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
