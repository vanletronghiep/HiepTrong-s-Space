import { NextResponse, type NextRequest } from 'next/server';
import { patchPrivateEntryInputSchema } from '@/contracts/writing';
import { assertSameOriginMutation, handleApiError, parseJsonBody } from '@/server/api-response';
import { privateTokenFrom } from '@/server/private-session';
import { privateVaultService } from '@/services/private-vault-service';

type Context = { params: Promise<{ id: string }> };
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function PATCH(request: NextRequest, { params }: Context): Promise<NextResponse> {
  try {
    const { id } = await params;
    const patch = patchPrivateEntryInputSchema.parse(await parseJsonBody(request));
    const item = await privateVaultService.updateEntry(privateTokenFrom(request), id, patch);
    return NextResponse.json({ item }, { status: 200, headers: NO_STORE });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context): Promise<NextResponse> {
  try {
    assertSameOriginMutation(request);
    const { id } = await params;
    await privateVaultService.deleteEntry(privateTokenFrom(request), id);
    return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
