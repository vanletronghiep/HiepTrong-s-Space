import { z } from 'zod';

export type AchievementEra =
  | 'elementary'
  | 'secondary'
  | 'high_school'
  | 'university'
  | 'future_contest';

export const achievementItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  era: z.enum(['elementary', 'secondary', 'high_school', 'university', 'future_contest']),
  year: z.string(),
  awardOrRole: z.string(),
  organization: z.string(),
  description: z.string(),
  lessonsLearned: z.string().default(''),
  futureDate: z.string().nullable().default(null),
  reminderEnabled: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export type AchievementItem = z.infer<typeof achievementItemSchema>;

export const createAchievementInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  era: z.enum(['elementary', 'secondary', 'high_school', 'university', 'future_contest']),
  year: z.string().min(1, 'Year is required'),
  awardOrRole: z.string().default(''),
  organization: z.string().default(''),
  description: z.string().default(''),
  lessonsLearned: z.string().default(''),
  futureDate: z.string().nullable().optional(),
  reminderEnabled: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export type CreateAchievementInput = z.input<typeof createAchievementInputSchema>;

export const patchAchievementInputSchema = createAchievementInputSchema.partial();
export type PatchAchievementInput = z.infer<typeof patchAchievementInputSchema>;

