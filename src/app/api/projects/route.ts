import { NextResponse, type NextRequest } from 'next/server';
import { createProjectInputSchema } from '@/contracts/project';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { projectService } from '@/services/project-service';

export async function GET(): Promise<NextResponse> {
  try {
    const items = await projectService.listProjects();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await parseJsonBody(request);
    const input = createProjectInputSchema.parse(body);
    const item = await projectService.createProject(input);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

