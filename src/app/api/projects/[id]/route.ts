import { NextResponse, type NextRequest } from 'next/server';
import { patchProjectInputSchema } from '@/contracts/project';
import { assertSameOriginMutation, handleApiError, parseJsonBody } from '@/server/api-response';
import { NotFoundError } from '@/services/errors';
import { projectService } from '@/services/project-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const item = await projectService.getProject(id);
    if (!item) {
      throw new NotFoundError('Project not found');
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
    const patch = patchProjectInputSchema.parse(body);
    const item = await projectService.updateProject(id, patch);
    if (!item) {
      throw new NotFoundError('Project not found');
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
    const deleted = await projectService.deleteProject(id);
    if (!deleted) {
      throw new NotFoundError('Project not found');
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
