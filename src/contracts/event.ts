import { z } from 'zod';

export const eventCategorySchema = z.enum(['school', 'meeting', 'exam', 'deadline']);
export type EventCategory = z.infer<typeof eventCategorySchema>;

export const eventLocationTypeSchema = z.enum(['online', 'in_person']);
export type EventLocationType = z.infer<typeof eventLocationTypeSchema>;

export const eventRecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  until: z.string().optional(),
});
export type EventRecurrence = z.infer<typeof eventRecurrenceSchema>;

export const eventItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().default(null),
  category: eventCategorySchema,
  startAt: z.string(),
  endAt: z.string().nullable().default(null),
  locationType: eventLocationTypeSchema.default('in_person'),
  location: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  isExam: z.boolean().default(false),
  preparationTaskId: z.string().nullable().optional().default(null),
  recurrence: eventRecurrenceSchema.nullable().optional().default(null),
  notes: z.string().nullable().optional().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EventItem = z.infer<typeof eventItemSchema>;

export const createEventInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional().default(null),
  category: eventCategorySchema,
  startAt: z.string(),
  endAt: z.string().nullable().optional().default(null),
  locationType: eventLocationTypeSchema.default('in_person'),
  location: z.string().nullable().optional().default(null),
  url: z.string().nullable().optional().default(null),
  isExam: z.boolean().default(false),
  preparationTaskId: z.string().nullable().optional().default(null),
  recurrence: eventRecurrenceSchema.nullable().optional().default(null),
  notes: z.string().nullable().optional().default(null),
});
export type CreateEventInput = z.input<typeof createEventInputSchema>;

export const patchEventInputSchema = createEventInputSchema.partial();
export type PatchEventInput = z.infer<typeof patchEventInputSchema>;
