import { z } from 'zod';

export type FocusMode = 'pomodoro' | 'deep_focus' | 'quick_review';
export type SessionStatus = 'active' | 'completed' | 'abandoned';

export const focusIntervalSchema = z.object({
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
});

export type FocusInterval = z.infer<typeof focusIntervalSchema>;

export const learningSessionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  mode: z.enum(['pomodoro', 'deep_focus', 'quick_review']),
  targetSubject: z.string().default('General'),
  relatedProjectId: z.string().nullable().default(null),
  relatedTaskId: z.string().nullable().default(null),
  startedAt: z.string(),
  completedAt: z.string().nullable().default(null),
  durationMinutes: z.number().default(25),
  focusMinutes: z.number().nonnegative().default(0),
  breakMinutes: z.number().nonnegative().default(0),
  pausedMinutes: z.number().nonnegative().default(0),
  status: z.enum(['active', 'completed', 'abandoned']).default('active'),
  reflectionNotes: z.string().default(''),
  rating: z.number().min(1).max(5).default(4),
  /** When each focus block actually ran. Empty for sessions saved before v4.1. */
  focusIntervals: z.array(focusIntervalSchema).default([]),
});

export type LearningSession = z.infer<typeof learningSessionSchema>;

export const createLearningSessionInputSchema = z.object({
  startedAt: z.string().datetime({ offset: true }).optional(),
  completedAt: z.string().datetime({ offset: true }).optional(),
  title: z.string().min(1, 'Title is required'),
  mode: z.enum(['pomodoro', 'deep_focus', 'quick_review']).default('pomodoro'),
  targetSubject: z.string().default('General'),
  relatedProjectId: z.string().nullable().optional(),
  relatedTaskId: z.string().nullable().optional(),
  durationMinutes: z.number().positive().default(25),
  focusMinutes: z.number().nonnegative().default(0),
  breakMinutes: z.number().nonnegative().default(0),
  pausedMinutes: z.number().nonnegative().default(0),
  reflectionNotes: z.string().default(''),
  rating: z.number().min(1).max(5).default(4),
  status: z.enum(['active', 'completed', 'abandoned']).default('completed'),
  focusIntervals: z.array(focusIntervalSchema).max(64).default([]),
 }).refine(value => value.focusMinutes + value.breakMinutes + value.pausedMinutes <= value.durationMinutes + 0.0001, {
  message: 'Recorded phases cannot exceed session duration', path: ['durationMinutes'],
}).refine(value => !value.startedAt || !value.completedAt || Date.parse(value.completedAt) >= Date.parse(value.startedAt), {
  message: 'Completion must not precede start', path: ['completedAt'],
});

export type CreateLearningSessionInput = z.input<typeof createLearningSessionInputSchema>;

/** Buckets per day in the time-of-day timeline: one every 15 minutes. */
export const TIMELINE_BUCKETS = 96;

const dayMinutesSchema = z.object({ date: z.string(), focusMinutes: z.number() });

/**
 * Focus Room statistics for one calendar year. Sessions from earlier years are kept in the
 * logbook but never counted here, so every year starts from zero.
 */
export const learningRoomStatsSchema = z.object({
  year: z.number().int(),
  todayFocusMinutes: z.number(),
  weekFocusMinutes: z.number(),
  /** Mean focus time of sessions that started in the last 30 days. */
  averageSessionMinutes: z.number(),
  streakDays: z.number(),
  /** Every day of the year that has focus time, for the activity heatmap. */
  activity: z.array(dayMinutesSchema),
  /** Monday to Sunday of the current week. */
  weekDays: z.array(dayMinutesSchema).length(7),
  /** The last eight weeks that fall inside the year, oldest first. */
  recentWeeks: z.array(z.object({ weekStart: z.string(), focusMinutes: z.number() })),
  /** January to December focus minutes. */
  months: z.array(z.number()).length(12),
  /** Per month, focus minutes in each 15-minute slot of the day. */
  timeline: z.array(z.array(z.number()).length(TIMELINE_BUCKETS)).length(12),
});

export type LearningRoomStats = z.infer<typeof learningRoomStatsSchema>;

