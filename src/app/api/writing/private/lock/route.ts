import { NextResponse, type NextRequest } from 'next/server';
import { assertSameOriginMutation, handleApiError } from '@/server/api-response';
import { clearPrivateCookie, privateTokenFrom } from '@/server/private-session';
import { privateVaultService } from '@/services/private-vault-service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOriginMutation(request);
    privateVaultService.lock(privateTokenFrom(request));
    return clearPrivateCookie(NextResponse.json({ ok: true }, { status: 200 }));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
