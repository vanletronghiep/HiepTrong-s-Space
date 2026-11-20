import { z } from 'zod';

/** The two rooms stored as ordinary pages. The Private Room has its own encrypted store. */
export const writingRoomSchema = z.enum(['drafts', 'perspective']);
export type WritingRoom = z.infer<typeof writingRoomSchema>;

export const WRITING_ROOM_LABEL: Record<WritingRoom | 'private', string> = {
  drafts: 'Draft Room',
  perspective: 'My Perspective',
  private: 'Private Room',
};

export const ripenessSchema = z.enum(['seed', 'sprout', 'ready']);
export type Ripeness = z.infer<typeof ripenessSchema>;

export const perspectiveStatusSchema = z.enum(['writing', 'revising', 'done']);
export type PerspectiveStatus = z.infer<typeof perspectiveStatusSchema>;

export const pageKindSchema = z.enum(['note', 'clipping']);

/** Page icons are a closed set of line icons, not free text. */
export const PAGE_ICONS = [
  'leaf',
  'feather',
  'book',
  'lamp',
  'compass',
  'mountain',
  'cloud',
  'key',
] as const;
export const pageIconSchema = z.enum(PAGE_ICONS);
export type PageIcon = z.infer<typeof pageIconSchema>;

/** Covers come from the project's own line art in public/visuals/blogs-hub. */
export const PAGE_COVERS = [
  'woodland-cabin',
  'cabin-lantern',
  'falling-maple-pair',
  'woodland-typewriter',
] as const;
export const pageCoverSchema = z.enum(PAGE_COVERS);
export type PageCover = z.infer<typeof pageCoverSchema>;

export const marginNoteSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1).max(1000),
  createdAt: z.string(),
});
export type MarginNote = z.infer<typeof marginNoteSchema>;

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const writingPageSchema = z.object({
  id: z.string(),
  room: writingRoomSchema,
  parentId: z.string().nullable().default(null),
  title: z.string().max(200).default(''),
  icon: pageIconSchema.default('leaf'),
  cover: pageCoverSchema.nullable().default(null),
  /** TipTap document as a JSON string. Empty string for a new page. */
  content: z.string().default(''),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  /** Draft Room: how far along a note is. */
  ripeness: ripenessSchema.default('seed'),
  /** My Perspective: where the essay is in its life. */
  status: perspectiveStatusSchema.default('writing'),
  /** My Perspective: the life question the essay answers. */
  question: z.string().max(300).default(''),
  kind: pageKindSchema.default('note'),
  sourceUrl: z.string().nullable().default(null),
  favorite: z.boolean().default(false),
  marginNotes: z.array(marginNoteSchema).default([]),
  /** My Perspective: the date the essay should come back to you. */
  revisitOn: dateOnly.nullable().default(null),
  /** Draft Room: when "From the drawer" last surfaced this note. */
  resurfacedAt: z.string().nullable().default(null),
  archivedAt: z.string().nullable().default(null),
  trashedAt: z.string().nullable().default(null),
  wordCount: z.number().int().nonnegative().default(0),
  importedFromBlogId: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WritingPage = z.infer<typeof writingPageSchema>;

export const createWritingPageInputSchema = writingPageSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    wordCount: true,
    trashedAt: true,
    archivedAt: true,
    resurfacedAt: true,
    importedFromBlogId: true,
  })
  .partial({
    parentId: true,
    title: true,
    icon: true,
    cover: true,
    content: true,
    tags: true,
    ripeness: true,
    status: true,
    question: true,
    kind: true,
    sourceUrl: true,
    favorite: true,
    marginNotes: true,
    revisitOn: true,
  });
export type CreateWritingPageInput = z.input<typeof createWritingPageInputSchema>;

export const patchWritingPageInputSchema = createWritingPageInputSchema
  .omit({ room: true })
  .partial()
  .extend({
    room: writingRoomSchema.optional(),
    trashed: z.boolean().optional(),
    archived: z.boolean().optional(),
    resurfaced: z.boolean().optional(),
  });
export type PatchWritingPageInput = z.infer<typeof patchWritingPageInputSchema>;

/* ── Private Room ───────────────────────────────────────────────────────── */

export const PRIVATE_ENTRY_TYPES = ['diary', 'reflection', 'weekly', 'monthly'] as const;
export const privateEntryTypeSchema = z.enum(PRIVATE_ENTRY_TYPES);
export type PrivateEntryType = z.infer<typeof privateEntryTypeSchema>;

export const PRIVATE_ENTRY_LABEL: Record<PrivateEntryType, string> = {
  diary: 'Daily diary',
  reflection: 'Self reflection',
  weekly: 'Weekly recap',
  monthly: 'Monthly recap',
};

export const SKY_VALUES = ['clear', 'soft_clouds', 'rain', 'storm'] as const;
export const skySchema = z.enum(SKY_VALUES);
export type Sky = z.infer<typeof skySchema>;

export const SKY_LABEL: Record<Sky, string> = {
  clear: 'Clear',
  soft_clouds: 'Soft clouds',
  rain: 'Rain',
  storm: 'Storm',
};

export const privateEntrySchema = z.object({
  id: z.string(),
  entryType: privateEntryTypeSchema.default('diary'),
  title: z.string().max(200).default(''),
  /** The day the entry is about, in the app's time zone. */
  date: dateOnly,
  sky: skySchema.nullable().default(null),
  content: z.string().default(''),
  wordCount: z.number().int().nonnegative().default(0),
  trashedAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PrivateEntry = z.infer<typeof privateEntrySchema>;

export const createPrivateEntryInputSchema = privateEntrySchema
  .pick({ entryType: true, title: true, date: true, sky: true, content: true })
  .partial({ entryType: true, title: true, sky: true, content: true });
export type CreatePrivateEntryInput = z.input<typeof createPrivateEntryInputSchema>;

export const patchPrivateEntryInputSchema = createPrivateEntryInputSchema
  .partial()
  .extend({ trashed: z.boolean().optional() });
export type PatchPrivateEntryInput = z.infer<typeof patchPrivateEntryInputSchema>;

export const privateStatusSchema = z.object({
  configured: z.boolean(),
  unlocked: z.boolean(),
  /** Minutes of inactivity before the room locks itself. */
  idleMinutes: z.number(),
});
export type PrivateStatus = z.infer<typeof privateStatusSchema>;

export const PRIVATE_PASSWORD_MIN = 8;
export const setupPrivateInputSchema = z.object({
  password: z
    .string()
    .min(PRIVATE_PASSWORD_MIN, `Use at least ${PRIVATE_PASSWORD_MIN} characters`)
    .max(200),
});
export const unlockPrivateInputSchema = z
  .object({
    password: z.string().min(1).max(200).optional(),
    recoveryCode: z.string().min(1).max(100).optional(),
  })
  .refine((value) => Boolean(value.password) !== Boolean(value.recoveryCode), {
    message: 'Provide either the password or the recovery code',
  });
export const resetPrivatePasswordInputSchema = z.object({
  recoveryCode: z.string().min(1).max(100),
  newPassword: z.string().min(PRIVATE_PASSWORD_MIN).max(200),
});
