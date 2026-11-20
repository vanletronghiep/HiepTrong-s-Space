import { NextResponse, type NextRequest } from 'next/server';
import { patchWritingPageInputSchema } from '@/contracts/writing';
import { assertSameOriginMutation, handleApiError, parseJsonBody } from '@/server/api-response';
import { NotFoundError } from '@/services/errors';
import { writingService } from '@/services/writing-service';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context): Promise<NextResponse> {
  try {
    const { id } = await params;
    const item = await writingService.getPage(id);
    if (!item) throw new NotFoundError('Page not found');
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context): Promise<NextResponse> {
  try {
    const { id } = await params;
    const patch = patchWritingPageInputSchema.parse(await parseJsonBody(request));
    const item = await writingService.updatePage(id, patch);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

/** Permanent delete. Only a page already in the trash can be removed. */
export async function DELETE(request: NextRequest, { params }: Context): Promise<NextResponse> {
  try {
    assertSameOriginMutation(request);
    const { id } = await params;
    await writingService.deletePage(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
