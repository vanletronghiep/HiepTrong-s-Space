import { z } from 'zod';

export type HabitCategory = 'health' | 'learning' | 'mindfulness' | 'routine';

export const habitItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  category: z.enum(['health', 'learning', 'mindfulness', 'routine']).default('routine'),
  targetFrequency: z.enum(['daily', 'weekly']).default('daily'),
  streakDays: z.number().default(0),
  completedDates: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export type HabitItem = z.infer<typeof habitItemSchema>;

export const sleepLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  bedTime: z.string(),
  wakeTime: z.string(),
  durationHours: z.number(),
  qualityRating: z.number().min(1).max(5).default(4),
  sleepDebtMinutes: z.number().default(0),
  notes: z.string().default(''),
});

export type SleepLog = z.infer<typeof sleepLogSchema>;

export const screenTimeLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  totalMinutes: z.number(),
  productiveMinutes: z.number(),
  leisureMinutes: z.number(),
  notes: z.string().default(''),
});

export type ScreenTimeLog = z.infer<typeof screenTimeLogSchema>;

export const trackingDataSchema = z.object({
  habits: z.array(habitItemSchema),
  sleepLogs: z.array(sleepLogSchema),
  screenTimeLogs: z.array(screenTimeLogSchema),
  stats: z.object({
    overallHabitCompletionRate: z.number(),
    averageSleepHours: z.number(),
    averageProductiveRatio: z.number(),
    activeStreakDays: z.number(),
  }),
});

export type TrackingData = z.infer<typeof trackingDataSchema>;

export const createHabitInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.enum(['health', 'learning', 'mindfulness', 'routine']).default('routine'),
  targetFrequency: z.enum(['daily', 'weekly']).default('daily'),
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

export const logSleepInputSchema = z.object({
  date: z.string(),
  bedTime: z.string(),
  wakeTime: z.string(),
  durationHours: z.number(),
  qualityRating: z.number().min(1).max(5).default(4),
  notes: z.string().optional().default(''),
});

export type LogSleepInput = z.input<typeof logSleepInputSchema>;

export const logScreenTimeInputSchema = z.object({
  date: z.string(),
  totalMinutes: z.number(),
  productiveMinutes: z.number(),
  leisureMinutes: z.number(),
  notes: z.string().optional().default(''),
});

export type LogScreenTimeInput = z.input<typeof logScreenTimeInputSchema>;

