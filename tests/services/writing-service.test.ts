import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { BlogArticle } from '@/contracts/blog';
import { PrivateVaultService } from '@/services/private-vault-service';
import { WritingService } from '@/services/writing-service';

const directories: string[] = [];
async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'writing-test-'));
  directories.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

function article(overrides: Partial<BlogArticle>): BlogArticle {
  return {
    id: 'a1',
    slug: 'a1',
    title: 'On habits',
    subtitle: 'What do habits cost?',
    category: 'ideas_and_perspectives',
    authorship: 'by_hiep',
    authorName: 'Hiep Trong',
    originalSourceUrl: null,
    commentary: null,
    readingTimeMinutes: 3,
    publishedAt: '2026-10-01T00:00:00.000Z',
    shortVersion: '',
    content: 'First **paragraph**.\n\n- one\n- two',
    tags: ['Habits'],
    sources: [],
    status: 'published',
    ...overrides,
  };
}

describe('WritingService', () => {
  it('moves old Blogs Hub articles into the right rooms exactly once', async () => {
    const dir = await fixture();
    const articles = [
      article({ id: 'pub' }),
      article({ id: 'draft', status: 'draft', title: 'Half done' }),
      article({
        id: 'clip',
        authorship: 'saved_from_others',
        originalSourceUrl: 'https://example.com/post',
        title: 'Someone else',
      }),
    ];
    const service = new WritingService(dir, async () => articles);
    const pages = await service.listPages();
    expect(pages.find((p) => p.id === 'blog-pub')).toMatchObject({
      room: 'perspective',
      question: 'What do habits cost?',
    });
    expect(pages.find((p) => p.id === 'blog-draft')).toMatchObject({ room: 'drafts', kind: 'note' });
    expect(pages.find((p) => p.id === 'blog-clip')).toMatchObject({
      room: 'drafts',
      kind: 'clipping',
      sourceUrl: 'https://example.com/post',
    });
    expect(pages.find((p) => p.id === 'blog-pub')?.wordCount).toBeGreaterThan(3);

    // A second instance sees the marker and does not import again, even after deleting.
    await service.updatePage('blog-pub', { trashed: true });
    await service.deletePage('blog-pub');
    const again = new WritingService(dir, async () => articles);
    expect((await again.listPages()).some((p) => p.id === 'blog-pub')).toBe(false);
  });

  it('trashes and restores a page with its sub-pages, and only deletes from the trash', async () => {
    const service = new WritingService(await fixture(), async () => []);
    const parent = await service.createPage({ room: 'drafts', title: 'Parent' });
    const child = await service.createPage({ room: 'drafts', title: 'Child', parentId: parent.id });
    await expect(service.deletePage(parent.id)).rejects.toThrow(/trash first/i);

    await service.updatePage(parent.id, { trashed: true });
    const trashed = await service.listPages('drafts');
    expect(trashed.every((p) => p.trashedAt)).toBe(true);

    await service.updatePage(parent.id, { trashed: false });
    const restored = await service.listPages('drafts');
    expect(restored.find((p) => p.id === child.id)?.trashedAt).toBeNull();
  });

  it('rejects cross-room parents and loops', async () => {
    const service = new WritingService(await fixture(), async () => []);
    const a = await service.createPage({ room: 'drafts', title: 'A' });
    const b = await service.createPage({ room: 'drafts', title: 'B', parentId: a.id });
    await expect(service.createPage({ room: 'perspective', parentId: a.id })).rejects.toThrow(
      /same room/i,
    );
    await expect(service.updatePage(a.id, { parentId: b.id })).rejects.toThrow(/inside itself/i);
  });

  it('moves a note to My Perspective with its sub-pages and recounts words on save', async () => {
    const service = new WritingService(await fixture(), async () => []);
    const note = await service.createPage({ room: 'drafts', title: 'Note' });
    const sub = await service.createPage({ room: 'drafts', title: 'Sub', parentId: note.id });
    const doc = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one two three four' }] }],
    });
    const moved = await service.updatePage(note.id, { room: 'perspective', content: doc });
    expect(moved.wordCount).toBe(4);
    const pages = await service.listPages('perspective');
    expect(pages.map((p) => p.id).sort()).toEqual([note.id, sub.id].sort());
    expect(pages.find((p) => p.id === note.id)?.parentId).toBeNull();
  });
});

describe('PrivateVaultService', () => {
  let dir: string;
  let vault: PrivateVaultService;
  beforeEach(async () => {
    dir = await fixture();
    vault = new PrivateVaultService(dir);
  });

  it('sets up once, encrypts entries on disk, and reads them back when unlocked', async () => {
    const secret = 'the-very-private-sentence';
    const { token, recoveryCode } = await vault.setup('correct horse battery');
    expect(recoveryCode).toMatch(/^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/);
    await expect(vault.setup('another password')).rejects.toThrow(/already has a password/i);

    const doc = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: secret }] }],
    });
    const entry = await vault.createEntry(token, { date: '2026-11-18', title: 'Today', content: doc });
    expect((await vault.listEntries(token)).map((e) => e.id)).toEqual([entry.id]);

    const files = await fs.readdir(dir);
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      expect(raw).not.toContain(secret);
      expect(raw).not.toContain('Today');
      expect(raw).not.toContain('correct horse battery');
    }
  });

  it('stays locked without the right password, then lets the right one in', async () => {
    const { token } = await vault.setup('correct horse battery');
    await vault.createEntry(token, { date: '2026-11-18' });
    vault.lock(token);
    await expect(vault.listEntries(token)).rejects.toThrow(/locked/i);
    await expect(vault.unlock({ password: 'wrong password' })).rejects.toThrow(/did not unlock/i);
    const next = await vault.unlock({ password: 'correct horse battery' });
    expect(await vault.listEntries(next)).toHaveLength(1);
  });

  it('locks itself after the idle time', async () => {
    const now = 1_000_000;
    const { token } = await vault.setup('correct horse battery', now);
    expect((await vault.status(token, now + 9 * 60_000)).unlocked).toBe(true);
    expect((await vault.status(token, now + 9 * 60_000 + 11 * 60_000)).unlocked).toBe(false);
  });

  it('pauses attempts after repeated failures', async () => {
    await vault.setup('correct horse battery', 0);
    for (let i = 0; i < 5; i += 1) {
      await expect(vault.unlock({ password: `bad-${i}` }, 10)).rejects.toThrow(/did not unlock/i);
    }
    await expect(vault.unlock({ password: 'correct horse battery' }, 20)).rejects.toThrow(
      /too many attempts/i,
    );
    const token = await vault.unlock({ password: 'correct horse battery' }, 70_000);
    expect((await vault.status(token, 70_000)).unlocked).toBe(true);
  });

  it('recovers with the one-time code and keeps old entries readable', async () => {
    // Attempt counters are shared per process, so use a time past any earlier lockout.
    const t = 10_000_000;
    const { token, recoveryCode } = await vault.setup('first password', t);
    await vault.createEntry(token, { date: '2026-11-18', title: 'Kept' }, t);
    vault.lock(token);
    const fresh = await vault.resetPassword(recoveryCode, 'second password', t + 1_000);
    expect((await vault.listEntries(fresh, t + 1_000))[0]?.title).toBe('Kept');
    vault.lock(fresh);
    await expect(vault.unlock({ password: 'first password' }, t + 2_000)).rejects.toThrow();
    const again = await vault.unlock({ password: 'second password' }, t + 3_000);
    expect(await vault.listEntries(again, t + 3_000)).toHaveLength(1);
  });

  it('only deletes entries that are already in the trash', async () => {
    const { token } = await vault.setup('correct horse battery');
    const entry = await vault.createEntry(token, { date: '2026-11-18' });
    await expect(vault.deleteEntry(token, entry.id)).rejects.toThrow(/trash first/i);
    await vault.updateEntry(token, entry.id, { trashed: true });
    await vault.deleteEntry(token, entry.id);
    expect(await vault.listEntries(token)).toHaveLength(0);
  });
});

describe('private content never reaches git', () => {
  const repo = path.resolve(__dirname, '..', '..');

  it('ignores the data folder and tracks no private files', () => {
    const run = (args: string[]) =>
      execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
    for (const file of [
      'data/writing-private-entries.json',
      'data/writing-private-meta.json',
      'data/writing-pages.json',
    ]) {
      expect(run(['check-ignore', file])).toBe(file);
    }
    const tracked = run(['ls-files']).split('\n');
    expect(tracked.filter((f) => /writing-private|^data\//.test(f))).toEqual([]);
  });
});
