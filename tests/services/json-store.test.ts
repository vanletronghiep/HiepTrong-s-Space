import { afterEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JsonFileStore } from '@/services/storage/json-store';

const directories: string[] = [];
async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'json-store-test-'));
  directories.push(dir);
  return dir;
}
afterEach(async () => { await Promise.all(directories.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true }))); });
describe('JSON preservation', () => {
  it('retains concurrent saves across independent instances and reload', async () => {
    const dir = await fixture();
    await Promise.all(Array.from({ length: 20 }, (_, i) => new JsonFileStore<{ id: string }>('items.json', [], dir).save({ id: String(i) })));
    expect(await new JsonFileStore('items.json', [], dir).getAll()).toHaveLength(20);
  });
  it('serializes read-modify-write across singleton instances', async () => {
    const dir = await fixture();
    await Promise.all(Array.from({ length: 20 }, () => new JsonFileStore<{ id: string; count: number }>('counter.json', [], dir).update({ id: 'counter', count: 0 }, item => ++item.count)));
    expect((await new JsonFileStore<{ id: string; count: number }>('counter.json', [], dir).getById('counter'))?.count).toBe(20);
  });

  it('retries a transient Windows lock release error', async () => {
    const dir = await fixture();
    const open = vi.spyOn(fs, 'open').mockRejectedValueOnce(Object.assign(new Error('lock deleting'), { code: 'EPERM' }));
    try {
      const store = new JsonFileStore<{ id: string }>('items.json', [], dir);
      await store.save({ id: 'retained' });
      expect(await store.getAll()).toEqual([{ id: 'retained' }]);
    } finally { open.mockRestore(); }
  });
  it('keeps the preceding valid version recoverable', async () => {
    const dir = await fixture();
    const store = new JsonFileStore<{ id: string }>('items.json', [], dir);
    await store.save({ id: 'first' });
    await store.save({ id: 'second' });
    expect(JSON.parse(await fs.readFile(path.join(dir, 'items.json.bak'), 'utf8'))).toEqual([{ id: 'first' }]);
  });

  it('preserves the readable version on commit failure and releases the lock', async () => {
    const dir = await fixture();
    const store = new JsonFileStore<{ id: string }>('items.json', [], dir);
    await store.save({ id: 'first' });
    const rename = vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('simulated disk failure'));
    try {
      await expect(store.save({ id: 'second' })).rejects.toThrow('simulated disk failure');
      expect(await store.getAll()).toEqual([{ id: 'first' }]);
      expect(await new JsonFileStore('items.json', [], dir).getAll()).toEqual([{ id: 'first' }]);
    } finally { rename.mockRestore(); }
    await store.save({ id: 'third' });
    expect(await store.getAll()).toHaveLength(2);
  });

  it('preserves corrupt bytes on reads and writes', async () => {
    const dir = await fixture();
    const file = path.join(dir, 'items.json');
    await fs.writeFile(file, '{damaged');
    const store = new JsonFileStore('items.json', [{ id: 'seed' }], dir);
    await expect(store.getAll()).rejects.toThrow();
    await expect(store.save({ id: 'new' })).rejects.toThrow();
    expect(await fs.readFile(file, 'utf8')).toBe('{damaged');
  });
  it('does not present seed records as personal data', async () => {
    expect(await new JsonFileStore('items.json', [{ id: 'fake' }], await fixture()).getAll()).toEqual([]);
  });
  it('rejects structurally invalid and duplicate records', async () => {
    const dir = await fixture();
    for (const data of ['{}', '[null]', '[{"id":"x"},{"id":"x"}]']) {
      await fs.writeFile(path.join(dir, 'items.json'), data);
      await expect(new JsonFileStore('items.json', [], dir).getAll()).rejects.toThrow();
    }
  });
});
