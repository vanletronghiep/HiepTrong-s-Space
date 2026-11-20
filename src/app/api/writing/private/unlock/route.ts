import { NextResponse, type NextRequest } from 'next/server';
import { unlockPrivateInputSchema } from '@/contracts/writing';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { setPrivateCookie } from '@/server/private-session';
import { privateVaultService } from '@/services/private-vault-service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const input = unlockPrivateInputSchema.parse(await parseJsonBody(request));
    const token = await privateVaultService.unlock(input);
    return setPrivateCookie(
      request,
      NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } }),
      token,
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
