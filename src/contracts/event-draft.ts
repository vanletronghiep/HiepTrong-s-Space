import { z } from 'zod';
import { eventCategorySchema, type EventItem } from './event';

const eventDraftEditorValueFields = {
  title: z.string().max(300),
  category: eventCategorySchema,
  date: z.string().max(32),
  time: z.string().max(16),
  location: z.string().max(300),
  isOnline: z.boolean(),
  isExam: z.boolean(),
  notes: z.string().max(10000),
};

export const eventDraftEditorValuesSchema = z.object({
  title: eventDraftEditorValueFields.title.default(''),
  category: eventDraftEditorValueFields.category.default('school'),
  date: eventDraftEditorValueFields.date.default(''),
  time: eventDraftEditorValueFields.time.default(''),
  location: eventDraftEditorValueFields.location.default(''),
  isOnline: eventDraftEditorValueFields.isOnline.default(false),
  isExam: eventDraftEditorValueFields.isExam.default(false),
  notes: eventDraftEditorValueFields.notes.default(''),
});

export const eventDraftEditorValuesPatchSchema = z.object(eventDraftEditorValueFields).partial();

export type EventDraftEditorValues = z.infer<typeof eventDraftEditorValuesSchema>;
export type EventDraftEditorValuesInput = z.input<typeof eventDraftEditorValuesSchema>;
export type EventDraftEditorValuesPatch = z.infer<typeof eventDraftEditorValuesPatchSchema>;

export const eventDraftRecordSchema = z.object({
  id: z.string().trim().min(1).max(200),
  sourceEventId: z.string().trim().min(1).max(200).nullable().default(null),
  sourceUpdatedAt: z.string().datetime({ offset: true }).nullable().default(null),
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
  values: eventDraftEditorValuesSchema,
  importKey: z.string().trim().min(1).max(240).nullable().optional(),
});

export type SaveEventDraftInput = z.input<typeof saveEventDraftInputSchema>;

export const patchEventDraftInputSchema = z.object({
  sourceUpdatedAt: z.string().datetime({ offset: true }).nullable().optional(),
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
