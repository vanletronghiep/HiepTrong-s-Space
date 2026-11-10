import { z } from 'zod';

export const projectStatusSchema = z.enum(['active', 'in_progress', 'completed', 'on_hold']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  overview: z.string(),
  status: projectStatusSchema.default('active'),
  progressPercent: z.number().min(0).max(100).default(0),
  deadlineAt: z.string().nullable().default(null),
  blockers: z.string().nullable().default(null),
  nextStep: z.string().nullable().default(null),
  techStack: z.array(z.string()).default([]),
  repoUrl: z.string().nullable().optional().default(null),
  liveUrl: z.string().nullable().optional().default(null),
  linkedTaskIds: z.array(z.string()).default([]),
  linkedMilestoneIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProjectItem = z.infer<typeof projectItemSchema>;

export const createProjectInputSchema = z.object({
  title: z.string().min(1).max(200),
  overview: z.string(),
  status: projectStatusSchema.default('active'),
  progressPercent: z.number().min(0).max(100).default(0),
  deadlineAt: z.string().nullable().optional().default(null),
  blockers: z.string().nullable().optional().default(null),
  nextStep: z.string().nullable().optional().default(null),
  techStack: z.array(z.string()).default([]),
  repoUrl: z.string().nullable().optional().default(null),
  liveUrl: z.string().nullable().optional().default(null),
  linkedTaskIds: z.array(z.string()).default([]),
  linkedMilestoneIds: z.array(z.string()).default([]),
});
export type CreateProjectInput = z.input<typeof createProjectInputSchema>;

export const patchProjectInputSchema = createProjectInputSchema.partial();
export type PatchProjectInput = z.infer<typeof patchProjectInputSchema>;
