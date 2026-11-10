import { z } from 'zod';

export type ApcsFileCategory = 'document' | 'presentation' | 'code' | 'image' | 'archive' | 'other';

export const apcsFileItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  relativePath: z.string(),
  fullPath: z.string(),
  isDirectory: z.boolean(),
  size: z.number(),
  formattedSize: z.string(),
  extension: z.string(),
  modifiedAt: z.string(),
  category: z.enum(['document', 'presentation', 'code', 'image', 'archive', 'other']),
  parentPath: z.string().nullable(),
});

export type ApcsFileItem = z.infer<typeof apcsFileItemSchema>;

export const apcsCourseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  folderName: z.string(),
  semester: z.string(),
  fileCount: z.number(),
  totalSizeBytes: z.number(),
  formattedSize: z.string(),
  tags: z.array(z.string()),
  topics: z.array(z.string()),
});

export type ApcsCourse = z.infer<typeof apcsCourseSchema>;

export const apcsOverviewSchema = z.object({
  courses: z.array(apcsCourseSchema),
  stats: z.object({
    totalCourses: z.number(),
    totalFiles: z.number(),
    totalSizeBytes: z.number(),
    formattedSize: z.string(),
  }),
  recentFiles: z.array(apcsFileItemSchema),
});

export type ApcsOverview = z.infer<typeof apcsOverviewSchema>;

export const apcsDirectoryListingSchema = z.object({
  currentPath: z.string(),
  breadcrumbs: z.array(z.object({ name: z.string(), path: z.string() })),
  parentPath: z.string().nullable(),
  courseId: z.string().nullable(),
  items: z.array(apcsFileItemSchema),
});

export type ApcsDirectoryListing = z.infer<typeof apcsDirectoryListingSchema>;
