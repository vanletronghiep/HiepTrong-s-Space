import { parseJsonBody, handleApiError } from '@/server/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { createBlogArticleInputSchema } from '@/contracts/blog';
import { blogService } from '@/services/blog-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') ?? undefined;
    const authorship = searchParams.get('authorship') ?? undefined;
    const tag = searchParams.get('tag') ?? undefined;

    const articles = await blogService.getArticles(category, authorship, tag);
    return NextResponse.json({ success: true, data: articles });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    const validated = createBlogArticleInputSchema.parse(body);
    const created = await blogService.createArticle(validated);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

