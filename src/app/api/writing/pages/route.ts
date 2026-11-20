import { NextResponse, type NextRequest } from 'next/server';
import { createWritingPageInputSchema, writingRoomSchema } from '@/contracts/writing';
import { handleApiError, parseJsonBody } from '@/server/api-response';
import { writingService } from '@/services/writing-service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const roomParam = request.nextUrl.searchParams.get('room');
    const room = roomParam ? writingRoomSchema.parse(roomParam) : undefined;
    const items = await writingService.listPages(room);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await parseJsonBody(request);
    const input = createWritingPageInputSchema.parse(body);
    const item = await writingService.createPage(input);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
