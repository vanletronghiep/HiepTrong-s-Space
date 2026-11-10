import { promises as fs } from 'node:fs';
import path from 'node:path';

export class JsonFileStore<T extends { id: string }> {
  private readonly filePath: string;
  private readonly defaultSeed: T[];
  private cache: T[] | null = null;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(fileName: string, defaultSeed: T[]) {
    this.filePath = path.resolve(process.cwd(), 'data', fileName);
    this.defaultSeed = defaultSeed;
  }

  private async load(): Promise<T[]> {
    if (this.cache) return this.cache;
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      this.cache = JSON.parse(data) as T[];
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      this.cache = [...this.defaultSeed];
      await fs.writeFile(this.filePath, JSON.stringify(this.cache, null, 2), 'utf8');
    }
    return this.cache;
  }

  private async persist(items: T[]): Promise<void> {
    this.cache = items;
    const writeOp = this.writeLock.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf8');
    });
    this.writeLock = writeOp.catch(() => {});
    await writeOp;
  }

  async getAll(): Promise<T[]> {
    return this.load();
  }

  async getById(id: string): Promise<T | null> {
    const items = await this.load();
    return items.find((i) => i.id === id) ?? null;
  }

  async save(item: T): Promise<T> {
    const items = await this.load();
    const index = items.findIndex((i) => i.id === item.id);
    let updated: T[];
    if (index >= 0) {
      updated = [...items];
      updated[index] = item;
    } else {
      updated = [item, ...items];
    }
    await this.persist(updated);
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.load();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length !== items.length) {
      await this.persist(filtered);
      return true;
    }
    return false;
  }
}

