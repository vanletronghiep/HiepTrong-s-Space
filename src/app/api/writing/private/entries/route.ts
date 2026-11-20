import { NextResponse, type NextRequest } from 'next/server';
import { createPrivateEntryInputSchema } from '@/contracts/writing';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { privateTokenFrom } from '@/server/private-session';
import { privateVaultService } from '@/services/private-vault-service';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const items = await privateVaultService.listEntries(privateTokenFrom(request));
    return NextResponse.json({ items }, { status: 200, headers: NO_STORE });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const input = createPrivateEntryInputSchema.parse(await parseJsonBody(request));
    const item = await privateVaultService.createEntry(privateTokenFrom(request), input);
    return NextResponse.json({ item }, { status: 201, headers: NO_STORE });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
