import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it, vi } from 'vitest';
import { createStorageAdapter } from '@/services/storage/factory';
import { LocalStorageAdapter } from '@/services/storage/local/local-storage-adapter';
import { runStorageAdapterContractTests } from './storage-adapter.contract';

runStorageAdapterContractTests('LocalStorageAdapter', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'hts-sqlite-test-'));
  const adapter = createStorageAdapter({
    storageDriver: 'local',
    databasePath: path.join(tempRoot, 'test.db'),
    mediaDir: path.join(tempRoot, 'media'),
    googleDriveFolderId: '',
  });

  return {
    adapter,
    cleanup: async () => {
      await fs.rm(tempRoot, { recursive: true, force: true });
    },
  };
});

describe('LocalStorageAdapter lifecycle (S03)', () => {
  it('releases the transaction queue when opening a savepoint fails', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'hts-sqlite-queue-'));
    const adapter = new LocalStorageAdapter({
      databasePath: path.join(tempRoot, 'queue.db'),
      mediaDir: path.join(tempRoot, 'media'),
    });
    try {
      await adapter.init();
      const exec = vi.spyOn(Database.prototype, 'exec').mockImplementationOnce(() => {
        throw new Error('Savepoint unavailable');
      });
      try {
        await expect(adapter.runInTransaction(async () => 'first')).rejects.toThrow(
          'Savepoint unavailable',
        );
      } finally {
        exec.mockRestore();
      }
      await expect(adapter.runInTransaction(async () => 'recovered')).resolves.toBe('recovered');
    } finally {
      await adapter.close();
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('closes the SQLite handle if migration fails during init()', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'hts-sqlite-fail-'));
    const dbPath = path.join(tempRoot, 'broken.db');
    const adapter = new LocalStorageAdapter({
      databasePath: dbPath,
      mediaDir: path.join(tempRoot, 'media'),
      migrationsFolder: path.join(tempRoot, 'missing-migrations'),
    });

    await expect(adapter.init()).rejects.toThrow();

    // On Windows, unlinking an open SQLite file fails with EBUSY/EPERM if the handle leaked.
    await expect(fs.unlink(dbPath)).resolves.toBeUndefined();
    await fs.rm(tempRoot, { recursive: true, force: true });
  });
});
