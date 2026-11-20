import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const tempDirs: string[] = [];
const originalDataDir = process.env.DATA_DIR;

afterEach(async () => {
  if (originalDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = originalDataDir;
  vi.resetModules();
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

async function isolatedService(seed: unknown[] = []) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-service-'));
  tempDirs.push(dir);
  await fs.writeFile(path.join(dir, 'projects.json'), JSON.stringify(seed), 'utf8');
  process.env.DATA_DIR = dir;
  vi.resetModules();
  const { ProjectService } = await import('@/services/project-service');
  return new ProjectService();
}

describe('ProjectService history', () => {
  it('writes only owner notes and never automatic events', async () => {
    const service = await isolatedService();
    const created = await service.createProject({ title: 'IELTS', priority: 'critical' });
    expect(created.history).toEqual([]);

    const updated = await service.updateProject(created.id, {
      status: 'intensive',
      deadlineAt: '2027-02-28',
      deadlinePhrase: 'end of February',
      logNote: 'Speaking mock 2',
    });
    expect(updated?.history).toHaveLength(1);
    expect(updated?.history[0]).toMatchObject({ text: 'Speaking mock 2', editedAt: null });
  });

  it('edits and deletes a note, marking the edit', async () => {
    const service = await isolatedService();
    const created = await service.createProject({ title: 'IELTS' });
    const withNotes = await service.updateProject(created.id, { logNote: 'First' });
    const second = await service.updateProject(created.id, { logNote: 'Second' });
    const [first, other] = [withNotes?.history[0], second?.history[1]];
    expect(first && other).toBeTruthy();

    const edited = await service.updateProject(created.id, {
      editNote: { id: first!.id, text: 'First, rewritten' },
    });
    const editedEntry = edited?.history.find((h) => h.id === first!.id);
    expect(editedEntry?.text).toBe('First, rewritten');
    expect(editedEntry?.editedAt).not.toBeNull();
    expect(editedEntry?.at).toBe(first!.at);

    const deleted = await service.updateProject(created.id, { deleteNote: other!.id });
    expect(deleted?.history.map((h) => h.id)).toEqual([first!.id]);
  });

  it('ignores an edit that changes nothing and an id that does not exist', async () => {
    const service = await isolatedService();
    const created = await service.createProject({ title: 'IELTS' });
    const logged = await service.updateProject(created.id, { logNote: 'Same' });
    const entry = logged!.history[0]!;

    const unchanged = await service.updateProject(created.id, {
      editNote: { id: entry.id, text: 'Same' },
    });
    expect(unchanged?.history[0]?.editedAt).toBeNull();

    const missing = await service.updateProject(created.id, { deleteNote: 'nope' });
    expect(missing?.history).toHaveLength(1);
  });

  it('drops event lines saved by an earlier build when reading', async () => {
    const service = await isolatedService([
      {
        id: 'p1',
        title: 'Old',
        status: 'intensive',
        history: [
          { id: 'e1', at: '2026-11-10T00:00:00.000Z', kind: 'event', text: 'Focus created' },
          { id: 'n1', at: '2026-11-11T00:00:00.000Z', kind: 'note', text: 'Kept' },
        ],
        createdAt: '2026-11-10T00:00:00.000Z',
        updatedAt: '2026-11-11T00:00:00.000Z',
      },
    ]);
    const item = await service.getProject('p1');
    expect(item?.history.map((h) => h.id)).toEqual(['n1']);
  });
});
