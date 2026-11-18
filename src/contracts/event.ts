import { z } from 'zod';

/**
 * Event categories. `school` is a legacy, read-compatible value: existing School events and
 * drafts remain readable and publishable, but new ordinary events cannot choose it (v3.1 §6.1).
 */
export const eventCategorySchema = z.enum(['school', 'meeting', 'exam', 'deadline', 'contest']);
export type EventCategory = z.infer<typeof eventCategorySchema>;

/** Categories available when creating or re-categorising an ordinary event. */
export const ORDINARY_EVENT_CATEGORIES = ['exam', 'meeting', 'deadline', 'contest'] as const;
export const ordinaryEventCategorySchema = z.enum(ORDINARY_EVENT_CATEGORIES);
export type OrdinaryEventCategory = z.infer<typeof ordinaryEventCategorySchema>;

export const eventKindSchema = z.enum(['event', 'class']);
export type EventKind = z.infer<typeof eventKindSchema>;

export const eventStatusSchema = z.enum(['active', 'canceled']);
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const eventLocationTypeSchema = z.enum(['online', 'in_person']);
export type EventLocationType = z.infer<typeof eventLocationTypeSchema>;

export const eventRecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  until: z.string().datetime({ offset: true }).optional(),
});
export type EventRecurrence = z.infer<typeof eventRecurrenceSchema>;

const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const localTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');

/**
 * Effective fields of a class occurrence. Default revisions and weekly overrides both store
 * complete field sets so their meaning never shifts underneath them (v3.1 §7.2).
 */
export const classFieldsSchema = z.object({
  title: z.string().min(1).max(200),
  /** ISO weekday, Monday = 1 … Sunday = 7, in Asia/Saigon. */
  weekday: z.number().int().min(1).max(7),
  startTime: localTimeSchema,
  endTime: localTimeSchema,
  location: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  highlighted: z.boolean().default(false),
});
export type ClassFields = z.infer<typeof classFieldsSchema>;

export const classDefaultRevisionSchema = classFieldsSchema.extend({
  /** Monday (YYYY-MM-DD) of the first week this default applies to. */
  effectiveWeek: localDateSchema,
});
export type ClassDefaultRevision = z.infer<typeof classDefaultRevisionSchema>;

export const classOverrideSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('occurrence'),
    /** Actual local date; may move into another week while keeping its original-week key. */
    date: localDateSchema,
    title: z.string().min(1).max(200),
    startTime: localTimeSchema,
    endTime: localTimeSchema,
    location: z.string().nullable().default(null),
    url: z.string().nullable().default(null),
    notes: z.string().nullable().default(null),
    highlighted: z.boolean().default(false),
    status: eventStatusSchema.default('active'),
  }),
  z.object({ type: z.literal('deleted') }),
]);
export type ClassOverride = z.infer<typeof classOverrideSchema>;

export const classScheduleSchema = z.object({
  /** Monday of the series' first week. */
  startWeek: localDateSchema,
  /** False for a single dated class: only `startWeek` exists, no future occurrences. */
  repeating: z.boolean(),
  /** Optional inclusive last date (Asia/Saigon). */
  endDate: localDateSchema.nullable().default(null),
  /** Immutable history of defaults, ascending by `effectiveWeek`. */
  defaults: z.array(classDefaultRevisionSchema).min(1),
  /** Weekly overrides keyed by original week (Monday). */
  overrides: z.record(localDateSchema, classOverrideSchema).default({}),
  /** Cancel This Week Onward: every occurrence from this week is canceled. */
  canceledFromWeek: localDateSchema.nullable().default(null),
  /** Delete This Week Onward: the series ends before this week. */
  deletedFromWeek: localDateSchema.nullable().default(null),
});
export type ClassSchedule = z.infer<typeof classScheduleSchema>;

/**
 * Stored event record. Unknown legacy keys pass through untouched for round-trip fidelity;
 * absent v3.1 fields normalise to ordinary, not highlighted, active, revision 0 (v3.1 §8.3).
 */
export const eventItemSchema = z
  .object({
    id: z.string(),
    kind: eventKindSchema.default('event'),
    title: z.string().min(1).max(200),
    description: z.string().nullable().default(null),
    /** Ordinary category; classes carry none. */
    category: eventCategorySchema.nullable(),
    /** Classification before an explicit Convert to class (e.g. legacy `school`). */
    originalCategory: eventCategorySchema.nullable().optional().default(null),
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }).nullable().default(null),
    locationType: eventLocationTypeSchema.default('in_person'),
    location: z.string().nullable().default(null),
    url: z.string().nullable().default(null),
    isExam: z.boolean().default(false),
    highlighted: z.boolean().default(false),
    status: eventStatusSchema.default('active'),
    preparationTaskId: z.string().nullable().optional().default(null),
    recurrence: eventRecurrenceSchema.nullable().optional().default(null),
    classSchedule: classScheduleSchema.nullable().optional().default(null),
    notes: z.string().nullable().optional().default(null),
    revision: z.number().int().min(0).default(0),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();
export type EventItem = z.infer<typeof eventItemSchema>;
export type EventItemInput = z.input<typeof eventItemSchema>;

export const classRepeatInputSchema = z.object({
  /** Set Default: repeat weekly from the first occurrence. Unchecked = single dated class. */
  weekly: z.boolean(),
  /** Optional inclusive recurrence end date. */
  endDate: localDateSchema.nullable().optional().default(null),
});
export type ClassRepeatInput = z.infer<typeof classRepeatInputSchema>;

export const createEventInputSchema = z.object({
  kind: eventKindSchema.default('event'),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional().default(null),
  category: eventCategorySchema.nullable().optional().default(null),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }).nullable().optional().default(null),
  locationType: eventLocationTypeSchema.optional(),
  location: z.string().nullable().optional().default(null),
  url: z.string().nullable().optional().default(null),
  isExam: z.boolean().optional(),
  highlighted: z.boolean().optional().default(false),
  preparationTaskId: z.string().nullable().optional().default(null),
  recurrence: eventRecurrenceSchema.nullable().optional().default(null),
  notes: z.string().nullable().optional().default(null),
  /** Classes only: weekly default or a single dated class. */
  classRepeat: classRepeatInputSchema.optional(),
  /** Internal: allows a legacy School draft to publish without conversion. */
  allowLegacyCategory: z.boolean().optional(),
});
export type CreateEventInput = z.input<typeof createEventInputSchema>;

export const patchEventInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  category: eventCategorySchema.nullable().optional(),
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  locationType: eventLocationTypeSchema.optional(),
  location: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  isExam: z.boolean().optional(),
  highlighted: z.boolean().optional(),
  preparationTaskId: z.string().nullable().optional(),
  recurrence: eventRecurrenceSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  /** Optimistic concurrency: reject when the stored revision differs. */
  expectedRevision: z.number().int().min(0).optional(),
  /** Explicit legacy conversion: `kind: 'class'` plus a conscious repeat choice. */
  convertToClass: classRepeatInputSchema.optional(),
});
export type PatchEventInput = z.infer<typeof patchEventInputSchema>;

/** Timetable periods (Asia/Saigon). A timetable class must match one exactly. */
export const TIMETABLE_PERIODS = [
  { index: 0, start: '07:30', end: '09:30', label: 'Morning 1' },
  { index: 1, start: '09:30', end: '11:30', label: 'Morning 2' },
  { index: 2, start: '13:30', end: '15:30', label: 'Afternoon 1' },
  { index: 3, start: '15:30', end: '17:30', label: 'Afternoon 2' },
] as const;
export type TimetablePeriod = (typeof TIMETABLE_PERIODS)[number];

export const occurrenceScopeSchema = z.enum(['this-week', 'this-week-onward']);
export type OccurrenceScope = z.infer<typeof occurrenceScopeSchema>;

export const occurrenceEditFieldsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  date: localDateSchema.optional(),
  startTime: localTimeSchema.optional(),
  endTime: localTimeSchema.optional(),
  location: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  highlighted: z.boolean().optional(),
  /** Onward scope only: optional inclusive recurrence end date. */
  endDate: localDateSchema.nullable().optional(),
});
export type OccurrenceEditFields = z.infer<typeof occurrenceEditFieldsSchema>;

export const occurrenceMutationSchema = z.object({
  action: z.enum(['edit', 'cancel', 'delete']),
  originalWeek: localDateSchema,
  scope: occurrenceScopeSchema,
  expectedRevision: z.number().int().min(0),
  fields: occurrenceEditFieldsSchema.optional(),
});
export type OccurrenceMutation = z.infer<typeof occurrenceMutationSchema>;

/** A resolved, displayable occurrence. UI lists and calendars consume these, not raw records. */
export interface EventOccurrence {
  /** Stable key: event id, or `${eventId}@${originalWeek}` for class occurrences. */
  key: string;
  eventId: string;
  kind: EventKind;
  /** Monday of the original week (classes only). */
  originalWeek: string | null;
  title: string;
  category: EventCategory | null;
  originalCategory: EventCategory | null;
  /** Exam meaning: Exam category or a preserved legacy flag. */
  isExam: boolean;
  highlighted: boolean;
  status: EventStatus;
  startAt: string;
  endAt: string | null;
  location: string | null;
  url: string | null;
  locationType: EventLocationType;
  notes: string | null;
  description: string | null;
  preparationTaskId: string | null;
  recurrence: EventRecurrence | null;
  /** Timetable period index when this active-or-canceled class matches a period exactly. */
  period: number | null;
  /** Class only: whether this occurrence comes from a weekly override. */
  isOverride: boolean;
  /** Class only: whether the series repeats weekly. */
  isRepeating: boolean;
  revision: number;
}
