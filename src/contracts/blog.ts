import { z } from 'zod';

export type BlogCategory = 'personal_stories' | 'ideas_and_perspectives';
export type BlogAuthorship = 'by_hiep' | 'saved_from_others';
export type BlogStatus = 'published' | 'draft';

export const blogSourceSchema = z.object({
  title: z.string().min(1, 'Source title is required'),
  url: z.string().default(''),
  note: z.string().optional(),
});

export type BlogSource = z.infer<typeof blogSourceSchema>;

export const blogArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().default(''),
  category: z.enum(['personal_stories', 'ideas_and_perspectives']),
  authorship: z.enum(['by_hiep', 'saved_from_others']),
  authorName: z.string().default('Hiep Trong'),
  originalSourceUrl: z.string().nullable().default(null),
  commentary: z.string().nullable().default(null),
  readingTimeMinutes: z.number().default(5),
  publishedAt: z.string(),
  shortVersion: z.string().default(''),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).default([]),
  sources: z.array(blogSourceSchema).default([]),
  status: z.enum(['published', 'draft']).default('published'),
});

export type BlogArticle = z.infer<typeof blogArticleSchema>;

export const createBlogArticleInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional().default(''),
  category: z.enum(['personal_stories', 'ideas_and_perspectives']).default('ideas_and_perspectives'),
  authorship: z.enum(['by_hiep', 'saved_from_others']).default('by_hiep'),
  authorName: z.string().optional().default('Hiep Trong'),
  originalSourceUrl: z.string().nullable().optional().default(null),
  commentary: z.string().nullable().optional().default(null),
  readingTimeMinutes: z.number().optional().default(4),
  shortVersion: z.string().optional().default(''),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional().default([]),
  sources: z.array(blogSourceSchema).optional().default([]),
  status: z.enum(['published', 'draft']).optional().default('published'),
});

export type CreateBlogArticleInput = z.input<typeof createBlogArticleInputSchema>;

export const patchBlogArticleInputSchema = createBlogArticleInputSchema.partial();
export type PatchBlogArticleInput = z.infer<typeof patchBlogArticleInputSchema>;

