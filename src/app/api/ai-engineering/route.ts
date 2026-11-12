import { z } from 'zod';
import { parseJsonBody, handleApiError } from '@/server/api-response';
import { NotFoundError, ValidationError } from '@/services/errors';
import { NextRequest, NextResponse } from 'next/server';
import { createAiNoteInputSchema } from '@/contracts/ai-engineering';
import { aiEngineeringService } from '@/services/ai-engineering-service';

export async function GET() {
  try {
    const data = await aiEngineeringService.getData();
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await parseJsonBody(request);

    if (action === 'toggle-topic') {
      const { stageId, topicId } = z
        .object({
          stageId: z.string().min(1, 'stageId is required'),
          topicId: z.string().min(1, 'topicId is required'),
        })
        .parse(body);
      const success = await aiEngineeringService.toggleTopic(stageId, topicId);
      if (!success) throw new NotFoundError('Topic not found');
      return NextResponse.json({ success });
    }

    if (action === 'note') {
      const validated = createAiNoteInputSchema.parse(body);
      const created = await aiEngineeringService.addNote(validated);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    throw new ValidationError('Unknown action');
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

