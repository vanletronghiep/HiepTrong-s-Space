import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ApcsStorage } from '@/services/storage/apcs-storage';
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
describe('APCS containment', () => {
  it('allows nested files and rejects siblings and junctions', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'apcs-boundary-'));
    roots.push(fixture);
    const root = path.join(fixture, 'Year I');
    const sibling = path.join(fixture, 'Year II');
    fs.mkdirSync(root); fs.mkdirSync(sibling);
    fs.writeFileSync(path.join(root, 'allowed.txt'), 'inside');
    fs.writeFileSync(path.join(sibling, 'outside.txt'), 'outside');
    fs.symlinkSync(sibling, path.join(root, 'escape'), 'junction');
    const store = new ApcsStorage(root);
    expect(store.getFileBuffer('allowed.txt')?.buffer.toString()).toBe('inside');
    expect(store.getFileBuffer('../Year II/outside.txt')).toBeNull();
    expect(store.getFileBuffer('escape/outside.txt')).toBeNull();
    expect(() => store.getDirectoryListing('../Year II')).toThrow();
    expect(() => store.getDirectoryListing('escape')).toThrow();
  });
});
