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
    const message = err instanceof Error ? err.message : 'Failed to fetch articles';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBlogArticleInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const created = await blogService.createArticle(parsed.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create article';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

