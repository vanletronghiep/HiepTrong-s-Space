import { NextResponse, type NextRequest } from 'next/server';
import { updateTaskInputSchema, type ApiErrorResponse, type TaskDto } from '@/contracts';
import {
  assertSameOriginMutation,
  handleApiError,
  parseJsonBody,
  parseUuidParam,
} from '@/server/api-response';
import { getContainer } from '@/server/container';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<{ item: TaskDto } | ApiErrorResponse>> {
  try {
    const { id } = await context.params;
    const taskId = parseUuidParam(id, 'Invalid task id');
    const { taskService } = await getContainer();
    const item = await taskService.getTask(taskId);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<{ item: TaskDto } | ApiErrorResponse>> {
  try {
    const { id } = await context.params;
    const taskId = parseUuidParam(id, 'Invalid task id');
    const body = await parseJsonBody(request);
    const input = updateTaskInputSchema.parse(body);
    const { taskService } = await getContainer();
    const item = await taskService.updateTask(taskId, input);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<{ ok: true } | ApiErrorResponse>> {
  try {
    assertSameOriginMutation(request);
    const { id } = await context.params;
    const taskId = parseUuidParam(id, 'Invalid task id');
    const { taskService } = await getContainer();
    await taskService.deleteTask(taskId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
