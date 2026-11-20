import { NextResponse, type NextRequest } from 'next/server';
import { setupPrivateInputSchema } from '@/contracts/writing';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { setPrivateCookie } from '@/server/private-session';
import { privateVaultService } from '@/services/private-vault-service';

/** Creates the password. The recovery code in the response is shown once and never stored. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { password } = setupPrivateInputSchema.parse(await parseJsonBody(request));
    const { token, recoveryCode } = await privateVaultService.setup(password);
    return setPrivateCookie(
      request,
      NextResponse.json(
        { recoveryCode },
        { status: 201, headers: { 'Cache-Control': 'no-store' } },
      ),
      token,
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
