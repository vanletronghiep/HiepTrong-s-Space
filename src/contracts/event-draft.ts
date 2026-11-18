import { z } from 'zod';
import {
  eventCategorySchema,
  eventKindSchema,
  occurrenceScopeSchema,
  type EventItem,
} from './event';

const eventDraftEditorValueFields = {
  kind: eventKindSchema,
  title: z.string().max(300),
  /** Ordinary category; null until the user chooses one (classes have none). */
  category: eventCategorySchema.nullable(),
  date: z.string().max(32),
  time: z.string().max(16),
  /** Optional end; expiry uses the end when present (v3.1 §6.2). */
  endDate: z.string().max(32),
  endTime: z.string().max(16),
  /** Single "Location or link" field. */
  location: z.string().max(300),
  highlighted: z.boolean(),
  notes: z.string().max(10000),
  /** Class only: Set Default (repeat weekly). */
  classWeekly: z.boolean(),
  /** Class only: optional inclusive recurrence end date. */
  classEndDate: z.string().max(32),
  /** Legacy fields kept so older drafts round-trip; the v3.1 editor no longer shows them. */
  isOnline: z.boolean(),
  isExam: z.boolean(),
};

export const eventDraftEditorValuesSchema = z.object({
  kind: eventDraftEditorValueFields.kind.default('event'),
  title: eventDraftEditorValueFields.title.default(''),
  category: eventDraftEditorValueFields.category.default(null),
  date: eventDraftEditorValueFields.date.default(''),
  time: eventDraftEditorValueFields.time.default(''),
  endDate: eventDraftEditorValueFields.endDate.default(''),
  endTime: eventDraftEditorValueFields.endTime.default(''),
  location: eventDraftEditorValueFields.location.default(''),
  highlighted: eventDraftEditorValueFields.highlighted.default(false),
  notes: eventDraftEditorValueFields.notes.default(''),
  classWeekly: eventDraftEditorValueFields.classWeekly.default(true),
  classEndDate: eventDraftEditorValueFields.classEndDate.default(''),
  isOnline: eventDraftEditorValueFields.isOnline.default(false),
  isExam: eventDraftEditorValueFields.isExam.default(false),
});

export const eventDraftEditorValuesPatchSchema = z.object(eventDraftEditorValueFields).partial();

export type EventDraftEditorValues = z.infer<typeof eventDraftEditorValuesSchema>;
export type EventDraftEditorValuesInput = z.input<typeof eventDraftEditorValuesSchema>;
export type EventDraftEditorValuesPatch = z.infer<typeof eventDraftEditorValuesPatchSchema>;

/** Class occurrence being edited: original-week identity plus the chosen scope. */
export const eventDraftOccurrenceSchema = z.object({
  originalWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scope: occurrenceScopeSchema,
});
export type EventDraftOccurrence = z.infer<typeof eventDraftOccurrenceSchema>;

export const eventDraftRecordSchema = z.object({
  id: z.string().trim().min(1).max(200),
  sourceEventId: z.string().trim().min(1).max(200).nullable().default(null),
  sourceUpdatedAt: z.string().datetime({ offset: true }).nullable().default(null),
  /** Source record revision when the draft was taken; revalidated on publish. */
  sourceRevision: z.number().int().min(0).nullable().default(null),
  /** Class occurrence edits are keyed by series + original week + scope. */
  occurrence: eventDraftOccurrenceSchema.nullable().default(null),
  values: eventDraftEditorValuesSchema,
  importKey: z.string().trim().min(1).max(240).nullable().default(null),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type EventDraftRecord = z.infer<typeof eventDraftRecordSchema>;

export const saveEventDraftInputSchema = z.object({
  id: z.string().trim().min(1).max(200).optional(),
  sourceEventId: z.string().trim().min(1).max(200).nullable().optional(),
  sourceUpdatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  sourceRevision: z.number().int().min(0).nullable().optional(),
  occurrence: eventDraftOccurrenceSchema.nullable().optional(),
  values: eventDraftEditorValuesSchema,
  importKey: z.string().trim().min(1).max(240).nullable().optional(),
});

export type SaveEventDraftInput = z.input<typeof saveEventDraftInputSchema>;

export const patchEventDraftInputSchema = z.object({
  sourceUpdatedAt: z.string().datetime({ offset: true }).nullable().optional(),
  sourceRevision: z.number().int().min(0).nullable().optional(),
  values: eventDraftEditorValuesPatchSchema.optional(),
});

export type PatchEventDraftInput = z.infer<typeof patchEventDraftInputSchema>;

export const publishEventDraftInputSchema = z.object({
  forceOverwrite: z.boolean().optional(),
});

export type PublishEventDraftInput = z.infer<typeof publishEventDraftInputSchema>;

export const eventDraftPublicationReceiptSchema = z.object({
  id: z.string().trim().min(1).max(200),
  draftId: z.string().trim().min(1).max(200),
  eventId: z.string().trim().min(1).max(200),
  publishedAt: z.string().datetime({ offset: true }),
  mode: z.enum(['create', 'update']),
});

export type EventDraftPublicationReceipt = z.infer<typeof eventDraftPublicationReceiptSchema>;

export interface PublishEventDraftResult {
  event: EventItem;
  alreadyPublished: boolean;
  mode: 'create' | 'update';
}

/** Draft identity for a source: one draft per event, or per class occurrence and scope. */
export function eventDraftSourceKey(draft: {
  sourceEventId?: string | null;
  occurrence?: EventDraftOccurrence | null;
}): string | null {
  if (!draft.sourceEventId) return null;
  return draft.occurrence
    ? `${draft.sourceEventId}@${draft.occurrence.originalWeek}#${draft.occurrence.scope}`
    : draft.sourceEventId;
}
