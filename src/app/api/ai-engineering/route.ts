import { NextRequest, NextResponse } from 'next/server';
import { createAiNoteInputSchema } from '@/contracts/ai-engineering';
import { aiEngineeringService } from '@/services/ai-engineering-service';

export async function GET() {
  try {
    const data = await aiEngineeringService.getData();
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve AI Engineering data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    if (action === 'toggle-topic') {
      const { stageId, topicId } = body;
      if (!stageId || !topicId) {
        return NextResponse.json({ success: false, error: 'stageId and topicId required' }, { status: 400 });
      }
      const success = await aiEngineeringService.toggleTopic(stageId, topicId);
      return NextResponse.json({ success });
    }

    if (action === 'note') {
      const parsed = createAiNoteInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const created = await aiEngineeringService.addNote(parsed.data);
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process AI engineering request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

