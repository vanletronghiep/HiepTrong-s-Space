import { NextResponse, type NextRequest } from 'next/server';
import { handleApiError } from '@/server/api-response';
import { privateTokenFrom } from '@/server/private-session';
import { privateVaultService } from '@/services/private-vault-service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = await privateVaultService.status(privateTokenFrom(request));
    return NextResponse.json({ status }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
