import { z } from 'zod';

/** How much a focus matters. Drives the tier switcher and the card order. */
export const projectPrioritySchema = z.enum(['critical', 'active', 'background']);
export type ProjectPriority = z.infer<typeof projectPrioritySchema>;

/** How much energy a focus gets right now. */
export const projectStatusSchema = z.enum(['intensive', 'steady', 'moderate', 'minimal', 'paused']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const MAX_ROADMAP_BLOCKS = 60;
export const MAX_WHY_LENGTH = 140;
export const MAX_DESCRIPTION_LENGTH = 4000;

export const roadmapBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().max(200).default(''),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).default(''),
  done: z.boolean().default(false),
  doneAt: z.string().nullable().default(null),
});
export type RoadmapBlock = z.infer<typeof roadmapBlockSchema>;

/** One line the owner wrote. There are no automatic entries. */
export const historyEntrySchema = z.object({
  id: z.string().min(1),
  at: z.string(),
  text: z.string().max(600),
  /** Set when the owner changed the text after writing it. */
  editedAt: z.string().nullable().default(null),
});
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

const deadlineField = z
  .union([z.string().date(), z.string().datetime({ offset: true })])
  .nullable();

/** Pre-revision records used a different status vocabulary; map it onto the new scale. */
const LEGACY_STATUS: Record<string, ProjectStatus> = {
  in_focus: 'steady',
  active: 'steady',
  in_progress: 'steady',
  on_deck: 'minimal',
  parked: 'paused',
  on_hold: 'paused',
  finished: 'steady',
  completed: 'steady',
};

function legacyNotes(record: Record<string, unknown>): string {
  const parts: [string, unknown][] = [
    ['Overview', record.overview],
    ['Next step', record.nextStep],
    ['Blocker', record.blockers],
    ['Pulse note', record.pulseNote],
    ['Parked reason', record.parkedReason],
  ];
  return parts
    .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
    .map(([label, value]) => `${label}: ${(value as string).trim()}`)
    .join('\n')
    .slice(0, 600);
}

/** Turn a stored record of any earlier shape into the current shape. */
function migrate(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const record = { ...(raw as Record<string, unknown>) };

  if (Array.isArray(record.checkpoints) && record.roadmap === undefined) {
    record.roadmap = (record.checkpoints as Record<string, unknown>[]).map((c) => ({
      id: c.id,
      title: c.title,
      description: '',
      done: c.done,
      doneAt: c.doneAt,
    }));
  }

  const oldStatus = typeof record.status === 'string' ? record.status : undefined;
  if (oldStatus && !projectStatusSchema.safeParse(oldStatus).success) {
    record.status = LEGACY_STATUS[oldStatus] ?? 'steady';
    if (record.priority === undefined) {
      record.priority = oldStatus === 'on_deck' || oldStatus === 'parked' ? 'background' : 'active';
    }
    if ((oldStatus === 'finished' || oldStatus === 'completed') && !record.finishedAt) {
      record.finishedAt = record.updatedAt ?? record.createdAt ?? new Date().toISOString();
    }
  }

  // Earlier builds also stored automatic event lines; History is now notes only.
  if (Array.isArray(record.history)) {
    record.history = (record.history as Record<string, unknown>[]).filter(
      (e) => e.kind !== 'event',
    );
  }
  if (record.history === undefined) {
    const notes = legacyNotes(record);
    record.history = notes
      ? [
          {
            id: `imported-${String(record.id ?? 'focus')}`,
            at: record.updatedAt ?? record.createdAt ?? new Date().toISOString(),
            text: `Imported notes\n${notes}`.slice(0, 600),
          },
        ]
      : [];
  }
  return record;
}

export const projectItemSchema = z.preprocess(
  migrate,
  z.object({
    id: z.string(),
    title: z.string().max(200),
    /** One line on why this focus matters, in the owner's words. */
    why: z.string().max(MAX_WHY_LENGTH).default(''),
    priority: projectPrioritySchema.default('active'),
    status: projectStatusSchema.default('steady'),
    /** The resolved deadline date. Cards count down to this. */
    deadlineAt: deadlineField.default(null),
    /** What the owner typed, such as "end of March". */
    deadlinePhrase: z.string().max(80).nullable().default(null),
    roadmap: z.array(roadmapBlockSchema).max(MAX_ROADMAP_BLOCKS).default([]),
    history: z.array(historyEntrySchema).max(1000).default([]),
    /** Kept so Learning Room sessions can still name the focus a task belongs to. */
    linkedTaskIds: z.array(z.string()).default([]),
    linkedMilestoneIds: z.array(z.string()).default([]),
    finishedAt: z.string().nullable().default(null),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);
export type ProjectItem = z.output<typeof projectItemSchema>;

export const createProjectInputSchema = z.object({
  title: z.string().trim().max(200).default(''),
  why: z.string().max(MAX_WHY_LENGTH).default(''),
  priority: projectPrioritySchema.default('active'),
  status: projectStatusSchema.default('steady'),
  deadlineAt: deadlineField.optional().default(null),
  deadlinePhrase: z.string().max(80).nullable().optional().default(null),
  roadmap: z.array(roadmapBlockSchema).max(MAX_ROADMAP_BLOCKS).default([]),
});
export type CreateProjectInput = z.input<typeof createProjectInputSchema>;

export const patchProjectInputSchema = createProjectInputSchema.partial().extend({
  /** Appends one owner note to the history.  */
  logNote: z.string().trim().min(1).max(600).optional(),
  /** Rewrites the text of one note. */
  editNote: z.object({ id: z.string().min(1), text: z.string().trim().min(1).max(600) }).optional(),
  /** Removes one note. */
  deleteNote: z.string().min(1).optional(),
  /** Marks the focus finished (true) or brings it back (false). */
  finished: z.boolean().optional(),
});
export type PatchProjectInput = z.infer<typeof patchProjectInputSchema>;
