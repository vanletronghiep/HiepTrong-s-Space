import { describe, expect, it } from 'vitest';
import { projectItemSchema, type ProjectItem } from '@/contracts/project';
import {
  applyDraftPatch,
  draftHasContent,
  isQuiet,
  lastNoteLabel,
  nextBlock,
  roadmapProgress,
  sortFocuses,
} from '@/domain/project-domain';

const NOW = new Date('2026-11-18T05:00:00Z');

function project(overrides: Record<string, unknown> = {}): ProjectItem {
  return projectItemSchema.parse({
    id: 'p1',
    title: 'Space v4',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-17T00:00:00.000Z',
    ...overrides,
  });
}

const block = (id: string, done = false, title = id) => ({
  id,
  title,
  description: '',
  done,
  doneAt: done ? '2026-11-10T00:00:00.000Z' : null,
});

describe('project contract migration', () => {
  it('maps pre-revision statuses onto the new scale', () => {
    expect(project({ status: 'in_focus' })).toMatchObject({ status: 'steady', priority: 'active' });
    expect(project({ status: 'on_deck' })).toMatchObject({
      status: 'minimal',
      priority: 'background',
    });
    expect(project({ status: 'parked' })).toMatchObject({
      status: 'paused',
      priority: 'background',
    });
    expect(project({ status: 'active' }).status).toBe('steady');
  });

  it('turns a finished status into a finished stamp', () => {
    const migrated = project({ status: 'finished', finishedAt: null });
    expect(migrated.finishedAt).toBe('2026-11-17T00:00:00.000Z');
  });

  it('turns checkpoints into roadmap blocks', () => {
    const migrated = project({
      status: 'in_focus',
      checkpoints: [{ id: 'c1', title: 'Draft', done: true, doneAt: '2026-11-05T00:00:00.000Z' }],
    });
    expect(migrated.roadmap).toEqual([
      { id: 'c1', title: 'Draft', description: '', done: true, doneAt: '2026-11-05T00:00:00.000Z' },
    ]);
  });

  it('keeps removed text as one imported history note', () => {
    const migrated = project({
      status: 'in_focus',
      overview: 'Build the thing',
      nextStep: 'Write tests',
      blockers: 'Waiting on design',
    });
    expect(migrated.history).toHaveLength(1);
    expect(migrated.history[0]).toMatchObject({ editedAt: null });
    expect(migrated.history[0]?.text).toContain('Imported notes');
    expect(migrated.history[0]?.text).toContain('Next step: Write tests');
    expect(migrated.history[0]?.text).toContain('Blocker: Waiting on design');
  });

  it('drops automatic event lines saved by an earlier build and keeps notes', () => {
    const migrated = project({
      status: 'intensive',
      history: [
        {
          id: 'e1',
          at: '2026-11-10T00:00:00.000Z',
          kind: 'event',
          text: 'Status: Steady → Intensive',
        },
        { id: 'n1', at: '2026-11-11T00:00:00.000Z', kind: 'note', text: 'Wrote the outline' },
        { id: 'n2', at: '2026-11-12T00:00:00.000Z', text: 'Newer note without a kind' },
      ],
    });
    expect(migrated.history.map((h) => h.id)).toEqual(['n1', 'n2']);
  });

  it('leaves current records alone', () => {
    const current = project({ status: 'intensive', priority: 'critical', history: [] });
    expect(current).toMatchObject({ status: 'intensive', priority: 'critical', history: [] });
  });
});

describe('roadmap progress', () => {
  it('is done blocks over all blocks, rounded', () => {
    expect(roadmapProgress([])).toBe(0);
    expect(roadmapProgress([block('a', true), block('b'), block('c')])).toBe(33);
    expect(roadmapProgress([block('a', true), block('b', true)])).toBe(100);
  });

  it('finds the first open block', () => {
    expect(nextBlock([block('a', true), block('b'), block('c')])?.id).toBe('b');
    expect(nextBlock([block('a', true)])).toBeNull();
  });
});

describe('card order', () => {
  it('sorts by priority, then nearest deadline, then no deadline last', () => {
    const list = [
      project({ id: 'a', title: 'A', priority: 'background', deadlineAt: '2026-12-01' }),
      project({ id: 'b', title: 'B', priority: 'critical', deadlineAt: null }),
      project({ id: 'c', title: 'C', priority: 'critical', deadlineAt: '2026-12-20' }),
      project({ id: 'd', title: 'D', priority: 'critical', deadlineAt: '2026-11-30' }),
    ];
    expect(sortFocuses(list).map((p) => p.id)).toEqual(['d', 'c', 'b', 'a']);
  });
});

describe('quiet hint', () => {
  const note = (at: string) => ({ id: at, at, text: 'x' });
  it('dims after 14 days without a note, never when paused', () => {
    const old = [note('2026-11-01T05:00:00Z')];
    expect(isQuiet(project({ history: old }), NOW)).toBe(true);
    expect(isQuiet(project({ history: old, status: 'paused' }), NOW)).toBe(false);
    expect(isQuiet(project({ history: [note('2026-11-10T05:00:00Z')] }), NOW)).toBe(false);
    expect(isQuiet(project({ history: [] }), NOW)).toBe(false);
  });

  it('describes the last log', () => {
    expect(lastNoteLabel(project({ history: [] }), NOW)).toBe('No log yet');
    expect(lastNoteLabel(project({ history: [note('2026-11-18T01:00:00Z')] }), NOW)).toBe(
      'Last log today',
    );
    expect(lastNoteLabel(project({ history: [note('2026-11-17T01:00:00Z')] }), NOW)).toBe(
      'Last log yesterday',
    );
    expect(lastNoteLabel(project({ history: [note('2026-11-09T01:00:00Z')] }), NOW)).toBe(
      'Last log 9 days ago',
    );
  });
});

describe('unsaved drafts', () => {
  const NOW_ISO = '2026-11-20T00:00:00.000Z';

  it('has content once anything is written', () => {
    expect(draftHasContent(project({ title: '' }))).toBe(false);
    expect(draftHasContent(project({ title: '   ', why: ' ' }))).toBe(false);
    expect(draftHasContent(project({ title: 'A' }))).toBe(true);
    expect(draftHasContent(project({ title: '', why: 'Because' }))).toBe(true);
    expect(draftHasContent(project({ title: '', deadlinePhrase: 'next friday' }))).toBe(true);
    expect(draftHasContent(project({ title: '', roadmap: [block('a')] }))).toBe(true);
  });

  it('applies edits locally and ignores log and finish actions', () => {
    const draft = project({ title: '' });
    const next = applyDraftPatch(
      draft,
      {
        title: 'Learn Rust',
        status: 'intensive',
        roadmap: [block('a', true), block('b')].map((b) => ({
          ...b,
          doneAt: b.done ? null : null,
        })),
        logNote: 'ignored',
        finished: true,
      },
      NOW_ISO,
    );
    expect(next).toMatchObject({ title: 'Learn Rust', status: 'intensive', finishedAt: null });
    expect(next.history).toEqual([]);
    expect(next.roadmap[0]?.doneAt).toBe(NOW_ISO);
    expect(next.roadmap[1]?.doneAt).toBeNull();
  });

  it('clears the typed phrase when the deadline is removed', () => {
    const draft = project({ deadlineAt: '2027-02-28', deadlinePhrase: 'end of February' });
    const next = applyDraftPatch(draft, { deadlineAt: null }, NOW_ISO);
    expect(next.deadlinePhrase).toBeNull();
  });
});
