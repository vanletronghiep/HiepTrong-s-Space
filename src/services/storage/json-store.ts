import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getAppConfig } from '@/server/config';

/** Atomic single-file transactions. A lock file also excludes other processes. */
export class JsonFileStore<T extends { id: string }> {
  private readonly filePath: string;
  private readonly legacyPath: string | null;

  constructor(fileName: string, _defaultSeed?: T[], directory?: string) {
    this.filePath = path.resolve(directory ?? getAppConfig().dataDir, fileName);
    const legacy = path.resolve('data', fileName);
    this.legacyPath = directory === undefined && legacy !== this.filePath ? legacy : null;
  }

  private async load(): Promise<T[]> {
    let data: string;
    try {
      data = await fs.readFile(this.filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        if (this.legacyPath) {
          const existing = await fs
            .stat(this.legacyPath)
            .catch((failure: NodeJS.ErrnoException) => {
              if (failure.code === 'ENOENT') return null;
              throw failure;
            });
          if (existing)
            throw new Error(
              'Legacy JSON data exists outside DATA_DIR. Restore the previous configuration or explicitly migrate a backup; no data was moved.',
            );
        }
        return [];
      }
      throw error;
    }
    const items: unknown = JSON.parse(data);
    if (
      !Array.isArray(items) ||
      items.some((item) => !item || typeof item !== 'object' || typeof item.id !== 'string') ||
      new Set(items.map((item) => item.id)).size !== items.length
    ) {
      throw new Error(`Invalid records in ${this.filePath}; original file preserved`);
    }
    return items as T[];
  }

  private async transact<R>(change: (items: T[]) => { items: T[]; result: R }): Promise<R> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const lockPath = `${this.filePath}.lock`;
    const deadline = Date.now() + 5000;
    let lock;
    while (!lock) {
      try {
        lock = await fs.open(lockPath, 'wx');
      } catch (error) {
        // Windows can report EPERM while a competing lock is being deleted.
        if (!['EEXIST', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? '') || Date.now() >= deadline)
          throw error;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    const temporary = `${this.filePath}.${randomUUID()}.tmp`;
    try {
      const { items, result } = change(await this.load());
      const handle = await fs.open(temporary, 'wx');
      try {
        await handle.writeFile(JSON.stringify(items, null, 2), 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      // Preserve the last valid version before replacing the destination.
      try {
        await fs.copyFile(this.filePath, `${this.filePath}.bak`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      await fs.rename(temporary, this.filePath);
      return result;
    } finally {
      try {
        await fs.rm(temporary, { force: true });
      } finally {
        await lock.close();
        await fs.unlink(lockPath);
      }
    }
  }

  async getAll(): Promise<T[]> {
    return this.load();
  }

  async getById(id: string): Promise<T | null> {
    return (await this.load()).find((item) => item.id === id) ?? null;
  }

  async save(item: T): Promise<T> {
    return this.transact((items) => ({
      items: [item, ...items.filter((existing) => existing.id !== item.id)],
      result: item,
    }));
  }

  async update<R>(initial: T, change: (item: T) => R): Promise<R> {
    return this.transact((items) => {
      const current = items.find((item) => item.id === initial.id) ?? initial;
      const result = change(current);
      return { items: [current, ...items.filter((item) => item.id !== current.id)], result };
    });
  }

  async modify(id: string, change: (item: T) => T): Promise<T | null> {
    return this.transact((items) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) return { items, result: null };
      const updated = change(existing);
      return { items: items.map((item) => (item.id === id ? updated : item)), result: updated };
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.transact((items) => ({
      items: items.filter((item) => item.id !== id),
      result: items.some((item) => item.id === id),
    }));
  }
}
