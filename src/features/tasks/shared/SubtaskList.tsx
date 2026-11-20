'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MAX_SUBTASKS, type Priority, type Subtask } from '@/contracts';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { countSubtasks, sortSubtasks } from '@/domain/subtask';
import { Checkbox } from '@/ui/Checkbox';
import { cn } from '@/ui/cn';

const PRIORITIES: ReadonlyArray<{ value: Priority; label: string }> = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'normal', label: 'Normal' },
  { value: 'optional', label: 'Optional' },
];

const DOT: Record<Priority, string> = {
  urgent: 'bg-[var(--daily-planet-urgent)]',
  normal: 'bg-[var(--daily-planet-normal)]',
  optional: 'bg-[var(--daily-planet-optional)]',
};

function PriorityChips({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (next: Priority) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Subtask priority" className="inline-flex gap-1">
      {PRIORITIES.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border border-ws-border px-2.5 text-[length:var(--fs-micro)] outline-none transition-colors duration-[var(--dur-fast)] motion-reduce:transition-none',
            value === option.value
              ? 'bg-ws-accent-soft font-medium text-ws-text'
              : 'text-ws-text-muted hover:bg-ws-accent-soft focus-visible:bg-ws-accent-soft',
          )}
        >
          <span className={cn('size-1.5 rounded-full', DOT[option.value])} />
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Inline editor shown in place of a subtask row after a double click. */
function EditRow({
  subtask,
  onSave,
  onCancel,
}: {
  subtask: Subtask;
  onSave: (title: string, priority: Priority) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(subtask.title);
  const [priority, setPriority] = useState<Priority>(subtask.priority);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(trimmed.slice(0, 80), priority);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Escape') {
            // Closes only this editor, not the dialog around it.
            event.preventDefault();
            event.stopPropagation();
            onCancel();
            return;
          }
          if (event.key !== 'Enter') return;
          event.preventDefault();
          save();
        }}
        maxLength={80}
        autoComplete="off"
        aria-label="Edit subtask title"
        className="h-9 min-w-[140px] flex-1 rounded-item border border-ws-border bg-ws-surface px-3 text-[length:var(--fs-ui)] text-ws-text outline-none focus-visible:bg-ws-accent-soft"
      />
      <PriorityChips value={priority} onChange={setPriority} />
      <button
        type="button"
        onClick={save}
        disabled={!title.trim()}
        className="inline-flex h-8 cursor-pointer items-center rounded-pill border border-ws-border bg-ws-accent-soft px-3.5 text-[length:var(--fs-small)] font-medium text-ws-text outline-none transition-colors duration-[var(--dur-fast)] hover:bg-ws-border focus-visible:bg-ws-border disabled:cursor-default disabled:opacity-45 motion-reduce:transition-none"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-8 cursor-pointer items-center rounded-pill px-3 text-[length:var(--fs-small)] text-ws-text-muted outline-none transition-colors duration-[var(--dur-fast)] hover:bg-ws-accent-soft focus-visible:bg-ws-accent-soft motion-reduce:transition-none"
      >
        Cancel
      </button>
    </div>
  );
}

export interface SubtaskListProps {
  subtasks: readonly Subtask[];
  onChange: (next: Subtask[]) => void;
  onPromote?: (subtaskId: string) => void;
  /**
   * Task Details mode: a read-only list with a single + button. The creation form opens inline
   * on demand and closes again after saving or cancelling. Without it the form is always shown
   * (the task editor).
   */
  collapsible?: boolean;
}

/**
 * Short checklist under a task's description (v3.4): a short title plus a priority per item.
 * Deleting is a single click with no confirmation. Enter adds the typed subtask.
 */
export function SubtaskList({
  subtasks,
  onChange,
  onPromote,
  collapsible = false,
}: SubtaskListProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const sorted = sortSubtasks(subtasks);
  const { done, total } = countSubtasks(subtasks);
  const full = total >= MAX_SUBTASKS;

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const add = () => {
    const trimmed = title.trim();
    if (!trimmed || full) return;
    onChange([
      ...subtasks,
      {
        id: crypto.randomUUID(),
        title: trimmed.slice(0, 80),
        priority,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setTitle('');
    if (collapsible) setAdding(false);
  };

  const cancel = () => {
    setTitle('');
    setAdding(false);
  };

  const form = (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        New subtask
      </label>
      <input
        ref={inputRef}
        id={inputId}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Escape' && collapsible) {
            // Closes only the inline form, not the dialog around it.
            event.preventDefault();
            event.stopPropagation();
            cancel();
            return;
          }
          // Enter adds the subtask; it must not submit a surrounding form (the task editor).
          if (event.key !== 'Enter') return;
          event.preventDefault();
          add();
        }}
        maxLength={80}
        disabled={full}
        autoComplete="off"
        placeholder={full ? 'Subtask limit reached' : 'Add a subtask'}
        className="h-9 min-w-[140px] flex-1 rounded-item border border-ws-border bg-ws-surface px-3 text-[length:var(--fs-ui)] text-ws-text outline-none placeholder:text-ws-text-muted/75 focus-visible:bg-ws-accent-soft"
      />
      <PriorityChips value={priority} onChange={setPriority} />
      {collapsible ? (
        <>
          <button
            type="button"
            onClick={add}
            disabled={!title.trim() || full}
            className="inline-flex h-8 cursor-pointer items-center rounded-pill border border-ws-border bg-ws-accent-soft px-3.5 text-[length:var(--fs-small)] font-medium text-ws-text outline-none transition-colors duration-[var(--dur-fast)] hover:bg-ws-border focus-visible:bg-ws-border disabled:cursor-default disabled:opacity-45 motion-reduce:transition-none"
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancel}
            className="inline-flex h-8 cursor-pointer items-center rounded-pill px-3 text-[length:var(--fs-small)] text-ws-text-muted outline-none transition-colors duration-[var(--dur-fast)] hover:bg-ws-accent-soft focus-visible:bg-ws-accent-soft motion-reduce:transition-none"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={add}
          aria-label="Add subtask"
          disabled={!title.trim() || full}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-pill border border-ws-border text-ws-text outline-none hover:bg-ws-accent-soft focus-visible:bg-ws-accent-soft disabled:cursor-default disabled:opacity-45"
        >
          <Plus size={15} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );

  return (
    <section
      aria-label="Subtasks"
      className="rounded-item border border-ws-border bg-ws-surface px-3.5 py-3"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <h4 className="text-[length:var(--fs-small)] font-semibold text-ws-text">Subtasks</h4>
        <div className="flex items-center gap-2">
          <span className="text-[length:var(--fs-micro)] tabular-nums text-ws-text-muted">
            {total ? `${done} of ${total} done` : 'None yet'}
          </span>
          {collapsible && !adding && !full ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              aria-label="Add a subtask"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-pill border border-ws-border text-ws-text outline-none transition-colors duration-[var(--dur-fast)] hover:bg-ws-accent-soft focus-visible:bg-ws-accent-soft motion-reduce:transition-none"
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
          ) : null}
        </div>
      </div>

      {sorted.length > 0 ? (
        <ul className="mb-1 flex flex-col gap-0.5">
          {sorted.map((item) =>
            editingId === item.id ? (
              <li key={item.id} className="rounded-sm px-1">
                <EditRow
                  subtask={item}
                  onCancel={() => setEditingId(null)}
                  onSave={(nextTitle, nextPriority) => {
                    onChange(
                      subtasks.map((sub) =>
                        sub.id === item.id
                          ? { ...sub, title: nextTitle, priority: nextPriority }
                          : sub,
                      ),
                    );
                    setEditingId(null);
                  }}
                />
              </li>
            ) : (
              <li
                key={item.id}
                onDoubleClick={() => setEditingId(item.id)}
                className="group/sub flex min-h-9 items-center gap-2.5 rounded-sm px-1 hover:bg-ws-accent-soft"
              >
                <Checkbox
                  checked={item.done}
                  onCheckedChange={() =>
                    onChange(
                      subtasks.map((sub) =>
                        sub.id === item.id ? { ...sub, done: !sub.done } : sub,
                      ),
                    )
                  }
                  aria-label={item.done ? `Reopen ${item.title}` : `Complete ${item.title}`}
                />
                <span
                  title={item.priority}
                  aria-label={`${item.priority} priority`}
                  className={cn('size-2 shrink-0 rounded-full', DOT[item.priority])}
                />
                <span
                  title="Double-click to edit"
                  className={cn(
                    'min-w-0 flex-1 truncate text-[length:var(--fs-ui)]',
                    item.done ? 'text-text-completed line-through' : 'text-ws-text',
                  )}
                >
                  {item.title}
                </span>
                {onPromote ? (
                  <button
                    type="button"
                    onClick={() => onPromote(item.id)}
                    aria-label={`Make ${item.title} its own task`}
                    title="Make it a task"
                    className="inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-ws-text-muted opacity-0 outline-none hover:bg-ws-surface hover:text-ws-text focus-visible:bg-ws-surface focus-visible:opacity-100 group-hover/sub:opacity-100 motion-reduce:transition-none"
                  >
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onChange(subtasks.filter((sub) => sub.id !== item.id))}
                  aria-label={`Delete ${item.title}`}
                  className={cn(
                    'inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-ws-text-muted outline-none hover:bg-ws-surface hover:text-ws-text focus-visible:bg-ws-surface',
                    collapsible &&
                      'opacity-0 focus-visible:opacity-100 group-hover/sub:opacity-100',
                  )}
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </li>
            ),
          )}
        </ul>
      ) : null}

      {collapsible ? (
        <AnimatePresence initial={false}>
          {adding ? (
            <motion.div
              key="subtask-form"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : MOTION_DURATION.fast, ease: MOTION_EASE }}
              className="overflow-hidden"
            >
              <div className="pt-1.5">{form}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : (
        <div className="pt-1">{form}</div>
      )}
    </section>
  );
}
