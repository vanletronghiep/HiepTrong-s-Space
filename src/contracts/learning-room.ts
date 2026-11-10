import { z } from 'zod';

export type FocusMode = 'pomodoro' | 'deep_focus' | 'quick_review';
export type SessionStatus = 'active' | 'completed' | 'abandoned';

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
  focusMinutes: z.number().default(0),
  breakMinutes: z.number().default(0),
  pausedMinutes: z.number().default(0),
  status: z.enum(['active', 'completed', 'abandoned']).default('active'),
  reflectionNotes: z.string().default(''),
  rating: z.number().min(1).max(5).default(4),
});

export type LearningSession = z.infer<typeof learningSessionSchema>;

export const createLearningSessionInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  mode: z.enum(['pomodoro', 'deep_focus', 'quick_review']).default('pomodoro'),
  targetSubject: z.string().default('General'),
  relatedProjectId: z.string().nullable().optional(),
  relatedTaskId: z.string().nullable().optional(),
  durationMinutes: z.number().positive().default(25),
  focusMinutes: z.number().default(0),
  breakMinutes: z.number().default(0),
  pausedMinutes: z.number().default(0),
  reflectionNotes: z.string().default(''),
  rating: z.number().min(1).max(5).default(4),
  status: z.enum(['active', 'completed', 'abandoned']).default('completed'),
});

export type CreateLearningSessionInput = z.input<typeof createLearningSessionInputSchema>;

export const learningRoomStatsSchema = z.object({
  totalFocusMinutes: z.number(),
  totalStudyMinutes: z.number(),
  totalPausedMinutes: z.number(),
  totalSessions: z.number(),
  completedSessions: z.number(),
  streakDays: z.number(),
  subjectBreakdown: z.array(
    z.object({
      subject: z.string(),
      minutes: z.number(),
      percentage: z.number(),
    }),
  ),
  dailyHistory: z.array(
    z.object({
      date: z.string(),
      focusMinutes: z.number(),
      breakMinutes: z.number(),
      sessionCount: z.number(),
    }),
  ),
});

export type LearningRoomStats = z.infer<typeof learningRoomStatsSchema>;

