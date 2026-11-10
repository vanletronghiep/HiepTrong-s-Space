import { z } from 'zod';

export const milestoneCategorySchema = z.enum(['academic', 'career', 'personal', 'project']);
export type MilestoneCategory = z.infer<typeof milestoneCategorySchema>;

export const milestoneStatusSchema = z.enum(['planned', 'in_progress', 'achieved']);
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;

export const milestoneLandmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean().default(false),
  completedAt: z.string().nullable().optional().default(null),
});
export type MilestoneLandmark = z.infer<typeof milestoneLandmarkSchema>;

export const milestoneItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  meaning: z.string(),
  category: milestoneCategorySchema.default('personal'),
  timeframe: z.string(),
  targetDate: z.string().nullable().default(null),
  status: milestoneStatusSchema.default('in_progress'),
  reflection: z.string().nullable().default(null),
  landmarks: z.array(milestoneLandmarkSchema).default([]),
  linkedProjectIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MilestoneItem = z.infer<typeof milestoneItemSchema>;

export const createMilestoneInputSchema = z.object({
  title: z.string().min(1).max(200),
  meaning: z.string(),
  category: milestoneCategorySchema.default('personal'),
  timeframe: z.string(),
  targetDate: z.string().nullable().optional().default(null),
  status: milestoneStatusSchema.default('in_progress'),
  reflection: z.string().nullable().optional().default(null),
  landmarks: z.array(milestoneLandmarkSchema).default([]),
  linkedProjectIds: z.array(z.string()).default([]),
});
export type CreateMilestoneInput = z.input<typeof createMilestoneInputSchema>;

export const patchMilestoneInputSchema = createMilestoneInputSchema.partial();
export type PatchMilestoneInput = z.infer<typeof patchMilestoneInputSchema>;
