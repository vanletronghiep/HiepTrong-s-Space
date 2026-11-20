'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Lock, Plus } from 'lucide-react';
import { ClientApiError } from '@/client/api-client';
import { useLearningRoomData } from '@/client/queries/learning-room';
import { useTasks } from '@/client/queries/tasks';
import {
  useCreatePrivateEntry,
  useDeletePrivateEntry,
  useLockPrivate,
  usePrivateEntries,
  usePrivateStatus,
  useResetPrivatePassword,
  useSetupPrivate,
  useUnlockPrivate,
  useUpdatePrivateEntry,
} from '@/client/queries/writing';
import {
  PRIVATE_ENTRY_LABEL,
  PRIVATE_ENTRY_TYPES,
  PRIVATE_PASSWORD_MIN,
  SKY_LABEL,
  SKY_VALUES,
  type PatchPrivateEntryInput,
  type PrivateEntry,
  type PrivateEntryType,
  type Sky,
} from '@/contracts/writing';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import {
  contentToPlainText,
  entryTemplate,
  onThisDay,
  readingMinutes,
  recapBlocks,
} from '@/domain/writing';
import { usePageReady, useTransitionRouter } from '@/features/transitions/TransitionProvider';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { cn } from '@/ui/cn';
import { ConfirmDialog } from '@/ui/Dialog';
import { DatePickerField } from '@/ui/DatePickerField';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import { SelectField } from '@/ui/SelectField';
import { Skeleton } from '@/ui/Skeleton';
import { NotionEditor } from './editor/NotionEditor';
import { saveStateLabel, useAutosave } from './use-autosave';
import styles from './writing.module.css';

function errorText(error: unknown, fallback: string): string {
  return error instanceof ClientApiError || error instanceof Error ? error.message : fallback;
}

/* ── Password setup, recovery code and unlock ─────────────────────────── */

function RecoveryCard({ code, onDone }: { code: string; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className={styles.gateCard}>
      <h2>Keep this recovery code</h2>
      <p>
        If you forget the password, this code is the only way back in. It is shown once and is not
        stored anywhere. Write it down or keep it in a password manager.
      </p>
      <p className={styles.recoveryCode} aria-label="Recovery code">
        {code}
      </p>
      <div className={styles.gateRow}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigator.clipboard
              ?.writeText(code)
              .then(() => setCopied(true))
              .catch(() => setCopied(false));
          }}
        >
          {copied ? 'Copied' : 'Copy code'}
        </Button>
      </div>
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
        />
        <span>I have saved the recovery code</span>
      </label>
      <Button variant="primary" disabled={!saved} onClick={onDone}>
        Open the Private Room
      </Button>
    </div>
  );
}

function SetupForm({ onCreated }: { onCreated: (recoveryCode: string) => void }) {
  const setup = useSetupPrivate();
  const passwordId = useId();
  const confirmId = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < PRIVATE_PASSWORD_MIN) {
      setError(`Use at least ${PRIVATE_PASSWORD_MIN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    try {
      onCreated(await setup.mutateAsync(password));
    } catch (failure) {
      setError(errorText(failure, 'Could not set the password. Try again.'));
    }
  };

  return (
    <form className={styles.gateCard} onSubmit={(event) => void submit(event)}>
      <h2>Set a password</h2>
      <p>
        Entries are encrypted on this computer with a key made from your password. The password
        itself is never saved.
      </p>
      <label htmlFor={passwordId}>Password</label>
      <input
        id={passwordId}
        type="password"
        autoComplete="off"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className={styles.plainInput}
      />
      <label htmlFor={confirmId}>Confirm password</label>
      <input
        id={confirmId}
        type="password"
        autoComplete="off"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        className={styles.plainInput}
      />
      {error ? (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" disabled={setup.isPending}>
        {setup.isPending ? 'Setting up…' : 'Set password'}
      </Button>
    </form>
  );
}

function UnlockForm() {
  const unlock = useUnlockPrivate();
  const reset = useResetPrivatePassword();
  const passwordId = useId();
  const codeId = useId();
  const newPasswordId = useId();
  const [password, setPassword] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (recovering) {
        if (newPassword.length < PRIVATE_PASSWORD_MIN) {
          setError(`Use at least ${PRIVATE_PASSWORD_MIN} characters for the new password.`);
          return;
        }
        await reset.mutateAsync({ recoveryCode: code, newPassword });
      } else {
        await unlock.mutateAsync({ password });
      }
      setPassword('');
      setNewPassword('');
      setCode('');
    } catch (failure) {
      setError(errorText(failure, 'That did not unlock the Private Room.'));
    }
  };

  return (
    <form className={styles.gateCard} onSubmit={(event) => void submit(event)}>
      <h2>{recovering ? 'Use your recovery code' : 'Enter the password'}</h2>
      {recovering ? (
        <>
          <label htmlFor={codeId}>Recovery code</label>
          <input
            id={codeId}
            type="text"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={styles.plainInput}
          />
          <label htmlFor={newPasswordId}>Choose a new password</label>
          <input
            id={newPasswordId}
            type="password"
            autoComplete="off"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={styles.plainInput}
          />
        </>
      ) : (
        <>
          <label htmlFor={passwordId}>Password</label>
          <input
            id={passwordId}
            type="password"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={styles.plainInput}

            autoFocus
          />
        </>
      )}
      {error ? (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      ) : null}
      <div className={styles.gateRow}>
        <Button type="submit" variant="primary" disabled={unlock.isPending || reset.isPending}>
          {recovering ? 'Reset and unlock' : 'Unlock'}
        </Button>
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => {
            setRecovering((value) => !value);
            setError('');
          }}
        >
          {recovering ? 'Back to password' : 'Forgot the password?'}
        </button>
      </div>
    </form>
  );
}

/* ── Unlocked workspace ───────────────────────────────────────────────── */

function EntryEditor({
  entry,
  onTrash,
}: {
  entry: PrivateEntry;
  onTrash: (entry: PrivateEntry) => void;
}) {
  const update = useUpdatePrivateEntry();
  const titleId = useId();
  const [title, setTitle] = useState(entry.title);
  const { queue, flush, state } = useAutosave<PatchPrivateEntryInput>((patch) =>
    update.mutateAsync({ id: entry.id, patch }),
  );
  const [words, setWords] = useState(entry.wordCount);

  return (
    <article
      className={styles.diaryPage}
      aria-label={`${PRIVATE_ENTRY_LABEL[entry.entryType]} entry`}
    >
      <div className={styles.diaryHead}>
        <div className={styles.diaryDate}>
          <DatePickerField
            mode="iso"
            ariaLabel="Entry date"
            value={entry.date}
            onChange={(next) => {
              if (next) {
                queue({ date: next });
                void flush().catch(() => undefined);
              }
            }}
          />
          <span className={styles.chip}>{PRIVATE_ENTRY_LABEL[entry.entryType]}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onTrash(entry)}>
          Move to trash
        </Button>
      </div>

      <div className={styles.sky} role="group" aria-label="Today's sky">
        {SKY_VALUES.map((value: Sky) => (
          <button
            key={value}
            type="button"
            aria-pressed={entry.sky === value}
            onClick={() => {
              queue({ sky: entry.sky === value ? null : value });
              void flush().catch(() => undefined);
            }}
          >
            {SKY_LABEL[value]}
          </button>
        ))}
      </div>

      <label htmlFor={titleId} className="sr-only">
        Entry title
      </label>
      <input
        id={titleId}
        type="text"
        className={styles.titleInput}
        placeholder="A title, if you want one"
        value={title}
        maxLength={200}
        onChange={(event) => {
          setTitle(event.target.value);
          queue({ title: event.target.value });
        }}
      />

      <NotionEditor
        key={entry.id}
        initialContent={entry.content}
        ariaLabel="Entry text"
        placeholder="Write freely. Nothing here leaves this computer."
        onChange={(json) => {
          queue({ content: json });
          setWords(contentToPlainText(json).split(/\s+/).filter(Boolean).length);
        }}
      />
      <p className={styles.saveLine} role="status" aria-live="polite">
        {saveStateLabel(state) || `${words} words · ${readingMinutes(words)} min read`}
      </p>
    </article>
  );
}

function Workspace({ idleMinutes }: { idleMinutes: number }) {
  const lock = useLockPrivate();
  const { data: entries = [], isLoading, isError, refetch } = usePrivateEntries(true);
  const create = useCreatePrivateEntry();
  const update = useUpdatePrivateEntry();
  const remove = useDeletePrivateEntry();
  const { data: tasks = [] } = useTasks({ status: 'completed' });
  const { data: learning } = useLearningRoomData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PrivateEntryType | 'all'>('all');
  const [newType, setNewType] = useState<PrivateEntryType>('diary');
  const [showTrash, setShowTrash] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PrivateEntry | null>(null);
  const [error, setError] = useState('');
  const lastActivity = useRef(Date.now());
  const now = useMemo(() => new Date(), []);
  const today = formatScheduledDate(now, DEFAULT_APP_TIMEZONE);

  const doLock = useCallback(() => {
    void lock.mutateAsync().catch(() => undefined);
  }, [lock]);

  // Lock after a stretch with no keys or pointer movement.
  useEffect(() => {
    const touch = () => {
      lastActivity.current = Date.now();
    };
    const events = ['keydown', 'pointerdown', 'pointermove', 'scroll'] as const;
    events.forEach((name) => window.addEventListener(name, touch, { passive: true }));
    const check = setInterval(() => {
      if (Date.now() - lastActivity.current >= idleMinutes * 60_000) doLock();
    }, 15_000);
    return () => {
      events.forEach((name) => window.removeEventListener(name, touch));
      clearInterval(check);
    };
  }, [idleMinutes, doLock]);

  const live = entries.filter((entry) => !entry.trashedAt);
  const trashed = entries.filter((entry) => entry.trashedAt);
  const visible = live.filter((entry) => filter === 'all' || entry.entryType === filter);
  const selected = selectedId ? (live.find((entry) => entry.id === selectedId) ?? null) : null;
  const memories = onThisDay(live, today);

  const createEntry = async () => {
    setError('');
    try {
      let recap: ReturnType<typeof recapBlocks> = [];
      if (newType === 'weekly' || newType === 'monthly') {
        const days = newType === 'weekly' ? 7 : 30;
        const since = now.getTime() - days * 86_400_000;
        const done = tasks.filter(
          (task) => task.completedAt && Date.parse(task.completedAt) >= since,
        );
        const sessions = (learning?.sessions ?? []).filter(
          (session) => Date.parse(session.startedAt) >= since,
        );
        recap = recapBlocks({
          completedTasks: done.map((task) => task.title),
          focusMinutes: sessions.reduce((sum, session) => sum + session.focusMinutes, 0),
          sessionCount: sessions.length,
          rangeLabel: newType === 'weekly' ? 'last 7 days' : 'last 30 days',
        });
      }
      const created = await create.mutateAsync({
        entryType: newType,
        date: today,
        content: entryTemplate(newType, recap),
      });
      setSelectedId(created.id);
    } catch (failure) {
      setError(errorText(failure, 'Could not create the entry.'));
    }
  };

  const patch = async (entry: PrivateEntry, change: PatchPrivateEntryInput) => {
    setError('');
    try {
      await update.mutateAsync({ id: entry.id, patch: change });
    } catch (failure) {
      setError(errorText(failure, 'Could not update the entry.'));
    }
  };

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar} aria-label="Private Room entries">
        <div className={styles.lockRow}>
          <span className={styles.chip}>Unlocked · locks after {idleMinutes} idle minutes</span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Lock size={14} aria-hidden="true" />}
            onClick={doLock}
            disabled={lock.isPending}
          >
            Lock now
          </Button>
        </div>

        <div className={styles.newEntry}>
          <label htmlFor="private-new-type" className="sr-only">
            Entry type
          </label>
          <SelectField<PrivateEntryType>
            id="private-new-type"
            ariaLabel="Entry type"
            size="sm"
            value={newType}
            onChange={setNewType}
            options={PRIVATE_ENTRY_TYPES.map((type) => ({
              value: type,
              label: PRIVATE_ENTRY_LABEL[type],
            }))}
          />
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} aria-hidden="true" />}
            onClick={() => void createEntry()}
            disabled={create.isPending}
          >
            New entry
          </Button>
        </div>

        <div className={styles.filters} role="group" aria-label="Filter entries">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </Chip>
          {PRIVATE_ENTRY_TYPES.map((type) => (
            <Chip key={type} active={filter === type} onClick={() => setFilter(type)}>
              {PRIVATE_ENTRY_LABEL[type]}
            </Chip>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-card" />
        ) : isError ? (
          <div role="alert" className={styles.alert}>
            <span>Could not load entries.</span>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className={styles.railEmpty}>
            {live.length === 0 ? 'No entries yet. Start with today.' : 'No entries of this type.'}
          </p>
        ) : (
          <ul className={styles.entryList}>
            {visible.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={cn(styles.entryRow, selectedId === entry.id && styles.treeRowActive)}
                  aria-current={selectedId === entry.id ? 'page' : undefined}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <b>{entry.date}</b>
                  <span>{entry.title || PRIVATE_ENTRY_LABEL[entry.entryType]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {memories.length > 0 ? (
          <section>
            <h2 className={styles.sideTitle}>On this day</h2>
            <ul className={styles.entryList}>
              {memories.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={styles.entryRow}
                    onClick={() => setSelectedId(entry.id)}
                  >
                    <b>{entry.date.slice(0, 4)}</b>
                    <span>{entry.title || PRIVATE_ENTRY_LABEL[entry.entryType]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <button
            type="button"
            className={styles.sideToggle}
            aria-expanded={showTrash}
            onClick={() => setShowTrash((value) => !value)}
          >
            Trash ({trashed.length})
          </button>
          {showTrash ? (
            <ul className={styles.treeList}>
              {trashed.map((entry) => (
                <li key={entry.id} className={styles.trashRow}>
                  <span>{entry.date}</span>
                  <button type="button" onClick={() => void patch(entry, { trashed: false })}>
                    Restore
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(entry)}>
                    Delete forever
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </nav>

      <main className={styles.main}>
        {error ? (
          <div role="alert" className={styles.alert}>
            {error}
          </div>
        ) : null}
        {selected ? (
          <EntryEditor
            key={selected.id}
            entry={selected}
            onTrash={(entry) => {
              void patch(entry, { trashed: true });
              setSelectedId(null);
            }}
          />
        ) : (
          <div className={styles.emptyWrap}>
            <Image
              src="/visuals/blogs-hub/cabin-lantern.svg"
              alt=""
              aria-hidden="true"
              width={110}
              height={150}
              unoptimized
              className={styles.emptyArt}
            />
            <p className={styles.roomSub}>
              Choose an entry, or start a new one. Daily diary, reflection, and recaps each come
              with a few gentle prompts you can skip.
            </p>
          </div>
        )}
      </main>

      <ConfirmDialog
        portal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          void remove
            .mutateAsync(target.id)
            .then(() => setDeleteTarget(null))
            .catch((failure: unknown) =>
              setError(errorText(failure, 'Could not delete the entry.')),
            );
        }}
        title="Delete forever?"
        description="This entry will be removed for good. This cannot be undone."
        confirmLabel="Delete forever"
        isSubmitting={remove.isPending}
      />
    </div>
  );
}

export function PrivateRoom() {
  const inheritedTheme = useFeatureTheme();
  const router = useTransitionRouter();
  const { data: status, isLoading, isError, refetch } = usePrivateStatus();
  usePageReady(!isLoading);
  // Held here, not in the form, so the code stays visible after the status flips to unlocked.
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const content = (
    <div data-feature-theme={inheritedTheme ? undefined : 'blogs-hub'} className={styles.workspace}>
      <header className={styles.roomHeader}>
        <button type="button" className={styles.backLink} onClick={() => router.push('/writing')}>
          <ArrowLeft size={16} aria-hidden="true" /> Writing Room
        </button>
        <h1 className={styles.roomTitle}>
          Private Room
          <span className={styles.caret} aria-hidden="true" />
        </h1>
        <p className={styles.roomSub}>
          A diary, reflections and recaps. Encrypted, and kept off GitHub.
        </p>
      </header>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-card" />
      ) : pendingCode ? (
        <div className={styles.gateWrap}>
          <RecoveryCard code={pendingCode} onDone={() => setPendingCode(null)} />
        </div>
      ) : isError || !status ? (
        <div role="alert" className={styles.alert}>
          <span>Could not reach the Private Room right now.</span>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : !status.configured ? (
        <div className={styles.gateWrap}>
          <SetupForm onCreated={setPendingCode} />
        </div>
      ) : !status.unlocked ? (
        <div className={styles.gateWrap}>
          <UnlockForm />
        </div>
      ) : (
        <Workspace idleMinutes={status.idleMinutes} />
      )}
    </div>
  );

  if (inheritedTheme) return content;
  return <FeatureThemeProvider name="blogs-hub">{content}</FeatureThemeProvider>;
}
