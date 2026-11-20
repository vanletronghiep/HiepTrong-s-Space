import { NextResponse, type NextRequest } from 'next/server';
import { resetPrivatePasswordInputSchema } from '@/contracts/writing';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { setPrivateCookie } from '@/server/private-session';
import { privateVaultService } from '@/services/private-vault-service';

/** Choose a new password using the recovery code. Existing entries stay readable. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { recoveryCode, newPassword } = resetPrivatePasswordInputSchema.parse(
      await parseJsonBody(request),
    );
    const token = await privateVaultService.resetPassword(recoveryCode, newPassword);
    return setPrivateCookie(
      request,
      NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } }),
      token,
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
