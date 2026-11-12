import { parseJsonBody, handleApiError, assertSameOriginMutation } from '@/server/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { patchBlogArticleInputSchema } from '@/contracts/blog';
import { NotFoundError } from '@/services/errors';
import { blogService } from '@/services/blog-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const article = await blogService.getArticleById(id);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return NextResponse.json({ success: true, data: article });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await parseJsonBody(request);
    const patch = patchBlogArticleInputSchema.parse(body);
    const updated = await blogService.updateArticle(id, patch);
    if (!updated) {
      throw new NotFoundError('Article not found');
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOriginMutation(_request);
    const { id } = await params;
    const deleted = await blogService.deleteArticle(id);
    if (!deleted) {
      throw new NotFoundError('Article not found');
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

