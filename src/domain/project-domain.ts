import type {
  PatchProjectInput,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
  RoadmapBlock,
} from '@/contracts/project';
import { daysUntil } from './deadline-phrase';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from './time';

/** A focus with no owner log for this long is dimmed on its card (never when paused). */
export const QUIET_AFTER_DAYS = 14;

export const PRIORITY_LABEL: Record<ProjectPriority, string> = {
  critical: 'Critical',
  active: 'Active',
  background: 'Background',
};
const PRIORITY_RANK: Record<ProjectPriority, number> = { critical: 0, active: 1, background: 2 };

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  intensive: 'Intensive',
  steady: 'Steady',
  moderate: 'Moderate',
  minimal: 'Minimal',
  paused: 'Paused',
};

/** Whole-number percent of roadmap blocks that are done. Never stored, never edited by hand. */
export function roadmapProgress(roadmap: readonly RoadmapBlock[]): number {
  if (roadmap.length === 0) return 0;
  return Math.round((roadmap.filter((block) => block.done).length / roadmap.length) * 100);
}

export function nextBlock(roadmap: readonly RoadmapBlock[]): RoadmapBlock | null {
  return roadmap.find((block) => !block.done) ?? null;
}

export function isFinished(project: Pick<ProjectItem, 'finishedAt'>): boolean {
  return project.finishedAt !== null;
}

/** Priority first, then nearest deadline; focuses without a deadline come last in their tier. */
export function sortFocuses<T extends Pick<ProjectItem, 'priority' | 'deadlineAt' | 'title'>>(
  projects: readonly T[],
): T[] {
  return [...projects].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;
    const aDue = a.deadlineAt ? a.deadlineAt.slice(0, 10) : '9999-12-31';
    const bDue = b.deadlineAt ? b.deadlineAt.slice(0, 10) : '9999-12-31';
    return aDue === bDue ? a.title.localeCompare(b.title) : aDue < bDue ? -1 : 1;
  });
}

/** Days since the owner last wrote a note, or null when there is none. */
export function daysSinceLastNote(project: Pick<ProjectItem, 'history'>, now: Date): number | null {
  let latest: string | null = null;
  for (const entry of project.history) {
    if (latest === null || entry.at > latest) latest = entry.at;
  }
  if (latest === null) return null;
  const tz = DEFAULT_APP_TIMEZONE;
  return -daysUntil(formatScheduledDate(latest, tz), formatScheduledDate(now, tz));
}

export function isQuiet(project: Pick<ProjectItem, 'history' | 'status'>, now: Date): boolean {
  if (project.status === 'paused') return false;
  const days = daysSinceLastNote(project, now);
  return days !== null && days >= QUIET_AFTER_DAYS;
}

export function lastNoteLabel(project: Pick<ProjectItem, 'history'>, now: Date): string {
  const days = daysSinceLastNote(project, now);
  if (days === null) return 'No log yet';
  if (days <= 0) return 'Last log today';
  if (days === 1) return 'Last log yesterday';
  return `Last log ${days} days ago`;
}

/** A new focus lives only in the panel until it is saved, and counts once anything is written. */
export function draftHasContent(
  project: Pick<ProjectItem, 'title' | 'why' | 'deadlinePhrase' | 'roadmap'>,
): boolean {
  return Boolean(
    project.title.trim() ||
    project.why.trim() ||
    (project.deadlinePhrase ?? '').trim() ||
    project.roadmap.length > 0,
  );
}

/** Applies a panel edit to an unsaved draft. Log notes and finishing only exist once saved. */
export function applyDraftPatch(
  draft: ProjectItem,
  patch: PatchProjectInput,
  nowIso: string,
): ProjectItem {
  const { logNote, editNote, deleteNote, finished, ...fields } = patch;
  void [logNote, editNote, deleteNote, finished];
  const roadmap = fields.roadmap
    ? fields.roadmap.map((block) =>
        block.done ? { ...block, doneAt: block.doneAt ?? nowIso } : { ...block, doneAt: null },
      )
    : draft.roadmap;
  const merged: ProjectItem = { ...draft, ...fields, roadmap, updatedAt: nowIso };
  if (merged.deadlineAt === null) merged.deadlinePhrase = null;
  return merged;
}
