import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import {
  createPrivateEntryInputSchema,
  patchPrivateEntryInputSchema,
  privateEntrySchema,
  type CreatePrivateEntryInput,
  type PatchPrivateEntryInput,
  type PrivateEntry,
  type PrivateStatus,
} from '@/contracts/writing';
import { wordCountOfContent } from '@/domain/writing';
import { ConflictError, NotFoundError, ValidationError } from './errors';
import { JsonFileStore } from './storage/json-store';

/**
 * Private Room storage.
 *
 * A random master key encrypts every entry (AES-256-GCM). The master key is itself stored
 * twice, wrapped by a key derived (scrypt) from the password and by one derived from a
 * one-time recovery code. Entries and key material live only in the git-ignored data folder.
 */

export const IDLE_MINUTES = 10;
const IDLE_MS = IDLE_MINUTES * 60_000;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 60_000;
const TRASH_KEEP_MS = 30 * 86_400_000;

interface Sealed {
  iv: string;
  tag: string;
  data: string;
}

interface VaultMeta {
  id: 'vault';
  passwordSalt: string;
  passwordWrap: Sealed;
  recoverySalt: string;
  recoveryWrap: Sealed;
  createdAt: string;
}

interface StoredEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  sealed: Sealed;
}

interface Session {
  key: Buffer;
  lastSeen: number;
}

const GLOBAL_SESSIONS = Symbol.for('hiep-trong-space.privateVaultSessions');
const GLOBAL_FAILURES = Symbol.for('hiep-trong-space.privateVaultFailures');
type GlobalWithVault = typeof globalThis & {
  [GLOBAL_SESSIONS]?: Map<string, Session>;
  [GLOBAL_FAILURES]?: { count: number; lockedUntil: number };
};

function sessions(): Map<string, Session> {
  const g = globalThis as GlobalWithVault;
  g[GLOBAL_SESSIONS] ??= new Map();
  return g[GLOBAL_SESSIONS];
}

function failures(): { count: number; lockedUntil: number } {
  const g = globalThis as GlobalWithVault;
  g[GLOBAL_FAILURES] ??= { count: 0, lockedUntil: 0 };
  return g[GLOBAL_FAILURES];
}

function deriveKey(secret: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      secret.normalize('NFKC'),
      salt,
      32,
      { N: 1 << 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

function seal(key: Buffer, plain: Buffer, aad: string): Sealed {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(aad));
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  };
}

function open(key: Buffer, sealed: Sealed, aad: string): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(sealed.iv, 'base64'));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(sealed.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(sealed.data, 'base64')), decipher.final()]);
}

const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newRecoveryCode(): string {
  const bytes = randomBytes(20);
  let out = '';
  for (const byte of bytes) out += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
  return out.match(/.{1,5}/g)?.join('-') ?? out;
}

function normalizeRecoveryCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}

function newToken(): string {
  return randomBytes(32).toString('hex');
}

function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export class PrivateVaultService {
  private readonly metaStore: JsonFileStore<VaultMeta>;
  private readonly entryStore: JsonFileStore<StoredEntry>;

  constructor(directory?: string) {
    this.metaStore = new JsonFileStore<VaultMeta>('writing-private-meta.json', [], directory);
    this.entryStore = new JsonFileStore<StoredEntry>('writing-private-entries.json', [], directory);
  }

  private async meta(): Promise<VaultMeta | null> {
    return this.metaStore.getById('vault');
  }

  private activeSession(token: string | null | undefined, now: number): Session | null {
    if (!token) return null;
    const map = sessions();
    for (const [candidate, session] of map) {
      if (now - session.lastSeen > IDLE_MS) {
        session.key.fill(0);
        map.delete(candidate);
      }
    }
    for (const [candidate, session] of map) {
      if (tokensEqual(candidate, token)) {
        session.lastSeen = now;
        return session;
      }
    }
    return null;
  }

  async status(token: string | null | undefined, now = Date.now()): Promise<PrivateStatus> {
    const meta = await this.meta();
    return {
      configured: meta !== null,
      unlocked: this.activeSession(token, now) !== null,
      idleMinutes: IDLE_MINUTES,
    };
  }

  private newSession(key: Buffer, now: number): string {
    const token = newToken();
    sessions().set(token, { key, lastSeen: now });
    return token;
  }

  /** First-time setup. Returns the session token and the recovery code, shown only once. */
  async setup(
    password: string,
    now = Date.now(),
  ): Promise<{ token: string; recoveryCode: string }> {
    if (await this.meta()) throw new ConflictError('The Private Room already has a password.');
    const masterKey = randomBytes(32);
    const recoveryCode = newRecoveryCode();
    const passwordSalt = randomBytes(16);
    const recoverySalt = randomBytes(16);
    const [passwordKey, recoveryKey] = await Promise.all([
      deriveKey(password, passwordSalt),
      deriveKey(normalizeRecoveryCode(recoveryCode), recoverySalt),
    ]);
    const meta: VaultMeta = {
      id: 'vault',
      passwordSalt: passwordSalt.toString('base64'),
      passwordWrap: seal(passwordKey, masterKey, 'password'),
      recoverySalt: recoverySalt.toString('base64'),
      recoveryWrap: seal(recoveryKey, masterKey, 'recovery'),
      createdAt: new Date(now).toISOString(),
    };
    // Guard against two setups racing: the second one finds a record and stops.
    await this.metaStore.transaction((items) => {
      if (items.length > 0) throw new ConflictError('The Private Room already has a password.');
      return { items: [meta], result: null };
    });
    return { token: this.newSession(masterKey, now), recoveryCode };
  }

  private checkLockout(now: number): void {
    const state = failures();
    if (now < state.lockedUntil) {
      const seconds = Math.ceil((state.lockedUntil - now) / 1000);
      throw new ValidationError(`Too many attempts. Try again in ${seconds} seconds.`);
    }
  }

  private recordFailure(now: number): never {
    const state = failures();
    state.count += 1;
    if (state.count >= MAX_FAILURES) {
      state.count = 0;
      state.lockedUntil = now + LOCKOUT_MS;
    }
    throw new ValidationError('That did not unlock the Private Room.');
  }

  private async unwrapMaster(
    meta: VaultMeta,
    secret: { password?: string; recoveryCode?: string },
  ): Promise<Buffer> {
    if (secret.password) {
      const key = await deriveKey(secret.password, Buffer.from(meta.passwordSalt, 'base64'));
      return open(key, meta.passwordWrap, 'password');
    }
    const key = await deriveKey(
      normalizeRecoveryCode(secret.recoveryCode ?? ''),
      Buffer.from(meta.recoverySalt, 'base64'),
    );
    return open(key, meta.recoveryWrap, 'recovery');
  }

  async unlock(
    secret: { password?: string; recoveryCode?: string },
    now = Date.now(),
  ): Promise<string> {
    const meta = await this.meta();
    if (!meta) throw new NotFoundError('Set a password for the Private Room first.');
    this.checkLockout(now);
    let masterKey: Buffer;
    try {
      masterKey = await this.unwrapMaster(meta, secret);
    } catch {
      return this.recordFailure(now);
    }
    failures().count = 0;
    return this.newSession(masterKey, now);
  }

  /** Use the recovery code to choose a new password. Entries are untouched. */
  async resetPassword(
    recoveryCode: string,
    newPassword: string,
    now = Date.now(),
  ): Promise<string> {
    const meta = await this.meta();
    if (!meta) throw new NotFoundError('Set a password for the Private Room first.');
    this.checkLockout(now);
    let masterKey: Buffer;
    try {
      masterKey = await this.unwrapMaster(meta, { recoveryCode });
    } catch {
      return this.recordFailure(now);
    }
    failures().count = 0;
    const salt = randomBytes(16);
    const key = await deriveKey(newPassword, salt);
    await this.metaStore.save({
      ...meta,
      passwordSalt: salt.toString('base64'),
      passwordWrap: seal(key, masterKey, 'password'),
    });
    return this.newSession(masterKey, now);
  }

  lock(token: string | null | undefined): void {
    if (!token) return;
    const map = sessions();
    for (const [candidate, session] of map) {
      if (tokensEqual(candidate, token)) {
        session.key.fill(0);
        map.delete(candidate);
      }
    }
  }

  private requireKey(token: string | null | undefined, now: number): Buffer {
    const session = this.activeSession(token, now);
    if (!session) throw new ValidationError('The Private Room is locked.');
    return session.key;
  }

  private encode(key: Buffer, entry: PrivateEntry): StoredEntry {
    return {
      id: entry.id,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      sealed: seal(key, Buffer.from(JSON.stringify(entry), 'utf8'), entry.id),
    };
  }

  private decode(key: Buffer, stored: StoredEntry): PrivateEntry {
    const json = open(key, stored.sealed, stored.id).toString('utf8');
    return privateEntrySchema.parse(JSON.parse(json));
  }

  async listEntries(token: string | null | undefined, now = Date.now()): Promise<PrivateEntry[]> {
    const key = this.requireKey(token, now);
    const cutoff = now - TRASH_KEEP_MS;
    const stored = await this.entryStore.transaction((items) => {
      const keep = items.filter((item) => {
        try {
          const entry = this.decode(key, item);
          return !entry.trashedAt || Date.parse(entry.trashedAt) > cutoff;
        } catch {
          return true;
        }
      });
      return { items: keep.length === items.length ? items : keep, result: keep };
    });
    return stored
      .map((item) => this.decode(key, item))
      .sort(
        (a, b) => b.date.localeCompare(a.date) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      );
  }

  async createEntry(
    token: string | null | undefined,
    input: CreatePrivateEntryInput,
    now = Date.now(),
  ): Promise<PrivateEntry> {
    const key = this.requireKey(token, now);
    const validated = createPrivateEntryInputSchema.parse(input);
    const iso = new Date(now).toISOString();
    const content = validated.content ?? '';
    const entry = privateEntrySchema.parse({
      ...validated,
      id: randomUUID(),
      content,
      wordCount: wordCountOfContent(content),
      trashedAt: null,
      createdAt: iso,
      updatedAt: iso,
    });
    await this.entryStore.save(this.encode(key, entry));
    return entry;
  }

  async updateEntry(
    token: string | null | undefined,
    id: string,
    rawPatch: PatchPrivateEntryInput,
    now = Date.now(),
  ): Promise<PrivateEntry> {
    const key = this.requireKey(token, now);
    const patch = patchPrivateEntryInputSchema.parse(rawPatch);
    const iso = new Date(now).toISOString();
    return this.entryStore.transaction((items) => {
      const stored = items.find((item) => item.id === id);
      if (!stored) throw new NotFoundError('Entry not found');
      const existing = this.decode(key, stored);
      const { trashed, ...fields } = patch;
      const next: PrivateEntry = {
        ...existing,
        ...(fields as Partial<PrivateEntry>),
        updatedAt: iso,
      };
      if (fields.content !== undefined) next.wordCount = wordCountOfContent(fields.content);
      if (trashed === true) next.trashedAt = iso;
      if (trashed === false) next.trashedAt = null;
      const parsed = privateEntrySchema.parse(next);
      return {
        items: items.map((item) => (item.id === id ? this.encode(key, parsed) : item)),
        result: parsed,
      };
    });
  }

  async deleteEntry(token: string | null | undefined, id: string, now = Date.now()): Promise<void> {
    const key = this.requireKey(token, now);
    await this.entryStore.transaction((items) => {
      const stored = items.find((item) => item.id === id);
      if (!stored) throw new NotFoundError('Entry not found');
      if (!this.decode(key, stored).trashedAt)
        throw new ValidationError('Move the entry to the trash first.');
      return { items: items.filter((item) => item.id !== id), result: null };
    });
  }
}

export const privateVaultService = new PrivateVaultService();
