'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { HistoryEntry } from '@/contracts/project';
import { daysUntil } from '@/domain/deadline-phrase';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { cn } from '@/ui/cn';
import styles from './projects.module.css';

const DELETE_DELAY_MS = 6500;

function dayLabel(at: string, now: Date): string {
  const tz = DEFAULT_APP_TIMEZONE;
  const days = -daysUntil(formatScheduledDate(at, tz), formatScheduledDate(now, tz));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return new Date(at).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: tz,
  });
}

export function FocusHistory({
  entries,
  now,
  editable,
  logLocked = false,
  onLog,
  onEdit,
  onDelete,
  onRemoved,
}: {
  entries: readonly HistoryEntry[];
  now: Date;
  /** Edit mode: notes can be opened for editing. Writing a new log is always allowed. */
  editable: boolean;
  /** A draft has nowhere to keep a log yet. */
  logLocked?: boolean;
  onLog: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  /** Lets the panel offer Undo after a delete. */
  onRemoved: (label: string, restore: () => void) => void;
}) {
  const [draft, setDraft] = useState('');
  const logOff = !editable || logLocked;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  // A deleted note is hidden at once and removed for good after the Undo window.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Map<string, number>());
  const onDeleteRef = useRef(onDelete);
  useEffect(() => {
    onDeleteRef.current = onDelete;
  }, [onDelete]);

  // Anything still waiting is removed when the panel closes.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const [id, timer] of pending) {
        window.clearTimeout(timer);
        onDeleteRef.current(id);
      }
      pending.clear();
    };
  }, []);

  // Leaving Edit mode closes an open editor without saving.
  useEffect(() => {
    if (!editable) setEditingId(null);
  }, [editable]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onLog(text);
    setDraft('');
  };

  const startEdit = (entry: HistoryEntry) => {
    if (!editable) return;
    setEditingId(entry.id);
    setEditText(entry.text);
  };

  const saveEdit = (entry: HistoryEntry) => {
    const text = editText.trim();
    if (text && text !== entry.text) onEdit(entry.id, text);
    setEditingId(null);
  };

  const removeEntry = (entry: HistoryEntry) => {
    setEditingId(null);
    setHidden((current) => new Set(current).add(entry.id));
    const timer = window.setTimeout(() => {
      timers.current.delete(entry.id);
      onDelete(entry.id);
    }, DELETE_DELAY_MS);
    timers.current.set(entry.id, timer);
    onRemoved('Deleted a log note', () => {
      const pending = timers.current.get(entry.id);
      if (pending === undefined) return;
      window.clearTimeout(pending);
      timers.current.delete(entry.id);
      setHidden((current) => {
        const next = new Set(current);
        next.delete(entry.id);
        return next;
      });
    });
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, entry: HistoryEntry) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveEdit(entry);
    } else if (event.key === 'Escape') {
      // Cancel the edit only; the panel stays open.
      event.preventDefault();
      setEditingId(null);
    }
  };

  const visible = entries
    .filter((entry) => !hidden.has(entry.id))
    .sort((a, b) => b.at.localeCompare(a.at));
  const groups: { label: string; items: HistoryEntry[] }[] = [];
  for (const entry of visible) {
    const label = dayLabel(entry.at, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(entry);
    else groups.push({ label, items: [entry] });
  }

  const time = (entry: HistoryEntry) => (
    <time dateTime={entry.at}>
      {new Date(entry.at).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: DEFAULT_APP_TIMEZONE,
      })}
    </time>
  );

  return (
    <div className={styles.history}>
      <form className={styles.logForm} onSubmit={submit}>
        <label className={styles.srOnly} htmlFor="history-new">
          What did you do?
        </label>
        <input
          id="history-new"
          className={styles.textInput}
          value={draft}
          maxLength={600}
          placeholder={logLocked ? 'Save this focus to start a log' : 'What did you do?'}
          autoComplete="off"
          disabled={logOff}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className={styles.smallButton} disabled={logOff || !draft.trim()}>
          Log
        </button>
      </form>
      {groups.length === 0 ? (
        <p className={styles.historyEmpty}>
          <i>Nothing logged yet.</i>
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.label} className={styles.historyDay}>
            <h4>{group.label}</h4>
            {group.items.map((entry) =>
              editingId === entry.id ? (
                <div key={entry.id} className={cn(styles.entry, styles.entryEditing)}>
                  {time(entry)}
                  <div className={styles.entryEditor}>
                    <label className={styles.srOnly} htmlFor={`note-edit-${entry.id}`}>
                      Edit note
                    </label>
                    <textarea
                      id={`note-edit-${entry.id}`}
                      className={styles.noteEditInput}
                      value={editText}
                      maxLength={600}
                      rows={3}
                      autoFocus
                      onChange={(event) => setEditText(event.target.value)}
                      onKeyDown={(event) => onEditorKeyDown(event, entry)}
                    />
                    <div className={styles.entryEditActions}>
                      <span>Enter saves · Esc cancels</span>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => saveEdit(entry)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className={styles.noteDelete}
                        onClick={() => removeEntry(entry)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={entry.id}
                  className={cn(styles.entry, editable && styles.entryEditable)}
                  tabIndex={editable ? 0 : undefined}
                  title={editable ? 'Double-click to edit' : undefined}
                  onDoubleClick={() => startEdit(entry)}
                  onKeyDown={(event) => {
                    if (
                      editable &&
                      event.target === event.currentTarget &&
                      (event.key === 'Enter' || event.key === 'F2')
                    ) {
                      event.preventDefault();
                      startEdit(entry);
                    }
                  }}
                >
                  {time(entry)}
                  <p>
                    {entry.text}
                    {entry.editedAt ? <small className={styles.editedMark}> · edited</small> : null}
                  </p>
                  {editable ? (
                    <button
                      type="button"
                      className={styles.notePencil}
                      aria-label="Edit note"
                      onClick={() => startEdit(entry)}
                    >
                      ✎
                    </button>
                  ) : null}
                </div>
              ),
            )}
          </div>
        ))
      )}
    </div>
  );
}
