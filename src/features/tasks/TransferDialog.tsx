'use client';

import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import type { TaskDto } from '@/contracts';
import { buildDeadlineFromInputs, isFutureInstant, resolveDateInput } from '@/domain/date-input';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate, shiftScheduledDate } from '@/domain/time';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog } from '@/ui/Dialog';

export interface TransferDialogProps {
  task: TaskDto | null;
  open: boolean;
  onClose: () => void;
  onSubmitTransfer: (
    taskId: string,
    payload: { scheduledDate: string; deadlineAt: string },
  ) => Promise<void>;
  now: Date;
  timeZone?: string;
  isSubmitting?: boolean;
  portal?: boolean;
}

function buildInitialTransferDraft(now: Date, timeZone: string) {
  const todayStr = formatScheduledDate(now, timeZone);
  const tomorrowStr = shiftScheduledDate(todayStr, 1, timeZone);
  const todayEndOfDay = buildDeadlineFromInputs({
    dateInput: todayStr,
    timeInput: '23:59',
    referenceNow: now,
    timeZone,
  });
  const defaultDate =
    todayEndOfDay.ok && isFutureInstant(todayEndOfDay.deadlineAt, now) ? todayStr : tomorrowStr;
  const resolved = resolveDateInput(defaultDate, now, timeZone);

  return {
    dateInput: resolved?.displayInput ?? '',
    canonicalDate: resolved?.scheduledDate ?? null,
  };
}

export function TransferDialog({
  task,
  open,
  onClose,
  onSubmitTransfer,
  now,
  timeZone = DEFAULT_APP_TIMEZONE,
  isSubmitting = false,
  portal = false,
}: TransferDialogProps) {
  const dateFieldRef = useRef<HTMLInputElement>(null);
  const isOpen = open && task !== null;
  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [openSeq, setOpenSeq] = useState(isOpen ? 1 : 0);

  // Remount a fresh body on each open transition without resetting drafts on minute ticks or refetches.
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setOpenSeq((count) => count + 1);
    }
  }

  return (
    <Dialog
      portal={portal}
      open={isOpen}
      onClose={onClose}
      title="Transfer overdue task"
      description={task ? `Choose a new date and deadline time for “${task.title}”.` : undefined}
      initialFocusRef={dateFieldRef}
    >
      {isOpen ? (
        <TransferDialogBody
          key={`${task.id}:${openSeq}`}
          task={task}
          onClose={onClose}
          onSubmitTransfer={onSubmitTransfer}
          now={now}
          timeZone={timeZone}
          isSubmitting={isSubmitting}
          dateFieldRef={dateFieldRef}
        />
      ) : null}
    </Dialog>
  );
}

interface TransferDialogBodyProps {
  task: TaskDto;
  onClose: () => void;
  onSubmitTransfer: TransferDialogProps['onSubmitTransfer'];
  now: Date;
  timeZone: string;
  isSubmitting: boolean;
  dateFieldRef: RefObject<HTMLInputElement | null>;
}

function TransferDialogBody({
  task,
  onClose,
  onSubmitTransfer,
  now,
  timeZone,
  isSubmitting,
  dateFieldRef,
}: TransferDialogBodyProps) {
  const todayStr = formatScheduledDate(now, timeZone);
  const tomorrowStr = shiftScheduledDate(todayStr, 1, timeZone);

  const [initialDraft] = useState(() => buildInitialTransferDraft(now, timeZone));
  const [dateInput, setDateInput] = useState(initialDraft.dateInput);
  const [canonicalDate, setCanonicalDate] = useState<string | null>(initialDraft.canonicalDate);
  const [timeInput, setTimeInput] = useState('23:59');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nativeDateRef = useRef<HTMLInputElement>(null);

  const resolvedDate = resolveDateInput(dateInput, now, timeZone, canonicalDate);

  const applyPresetDate = (isoDate: string) => {
    const resolved = resolveDateInput(isoDate, now, timeZone);
    if (resolved) {
      setDateInput(resolved.displayInput);
      setCanonicalDate(resolved.scheduledDate);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!task) {
      return;
    }

    const built = buildDeadlineFromInputs({
      dateInput,
      timeInput,
      referenceNow: now,
      timeZone,
      canonicalDate,
    });

    if (!built.ok) {
      setErrorMessage(built.message);
      return;
    }

    if (!isFutureInstant(built.deadlineAt, now)) {
      setErrorMessage('New deadline must be in the future.');
      return;
    }

    setErrorMessage(null);
    try {
      await onSubmitTransfer(task.id, {
        scheduledDate: built.scheduledDate,
        deadlineAt: built.deadlineAt,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to transfer task.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Chip
          active={resolvedDate?.scheduledDate === todayStr}
          onClick={() => applyPresetDate(todayStr)}
        >
          Today
        </Chip>
        <Chip
          active={resolvedDate?.scheduledDate === tomorrowStr}
          onClick={() => applyPresetDate(tomorrowStr)}
        >
          Tomorrow
        </Chip>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="transfer-date-input"
            className="block text-[length:var(--fs-ui)] font-medium text-ws-text mb-1.5"
          >
            New date (DD/MM)
          </label>
          <div className="relative flex items-center">
            <input
              ref={dateFieldRef}
              id="transfer-date-input"
              type="text"
              placeholder="31/10"
              value={dateInput}
              onChange={(e) => {
                setDateInput(e.target.value);
                setCanonicalDate(null);
                setErrorMessage(null);
              }}
              className="w-full h-11 rounded-item bg-ws-surface border border-ws-border px-3.5 pr-10 text-[length:var(--fs-ui)] text-ws-text tabular-nums"
            />
            <button
              type="button"
              aria-label="Open calendar picker"
              onClick={() => nativeDateRef.current?.showPicker?.()}
              className="absolute right-2 inline-flex items-center justify-center h-8 w-8 rounded-sm text-ws-text-muted hover:text-ws-text hover:bg-ws-accent-soft cursor-pointer"
            >
              <Calendar size={16} strokeWidth={1.5} />
            </button>
            <input
              ref={nativeDateRef}
              type="date"
              tabIndex={-1}
              aria-hidden="true"
              value={resolvedDate?.scheduledDate ?? ''}
              onChange={(e) => {
                if (e.target.value) {
                  applyPresetDate(e.target.value);
                }
              }}
              className="sr-only"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="transfer-time-input"
            className="block text-[length:var(--fs-ui)] font-medium text-ws-text mb-1.5"
          >
            New time (24h)
          </label>
          <input
            id="transfer-time-input"
            type="text"
            placeholder="23:59"
            value={timeInput}
            onChange={(e) => {
              setTimeInput(e.target.value);
              setErrorMessage(null);
            }}
            className="w-full h-11 rounded-item bg-ws-surface border border-ws-border px-3.5 text-[length:var(--fs-ui)] text-ws-text tabular-nums"
          />
        </div>
      </div>

      {resolvedDate ? (
        <p className="text-[length:var(--fs-small)] text-ws-text-muted">
          Resolves to {resolvedDate.humanLabel}
        </p>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-center gap-2 text-[length:var(--fs-small)] text-text-overdue"
        >
          <AlertCircle size={15} strokeWidth={1.5} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2.5 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          Transfer
        </Button>
      </div>
    </form>
  );
}

export interface ScheduleDateDialogProps {
  task: TaskDto | null;
  open: boolean;
  onClose: () => void;
  onSelectDate: (taskId: string, scheduledDate: string) => Promise<void>;
  now: Date;
  timeZone?: string;
  isSubmitting?: boolean;
  portal?: boolean;
}

function buildInitialScheduleDraft(task: TaskDto, now: Date, timeZone: string) {
  const initialIso = task.scheduledDate ?? formatScheduledDate(now, timeZone);
  const resolved = resolveDateInput(initialIso, now, timeZone);
  return {
    dateInput: resolved?.displayInput ?? '',
    canonicalDate: resolved?.scheduledDate ?? null,
  };
}

export function ScheduleDateDialog({
  task,
  open,
  onClose,
  onSelectDate,
  now,
  timeZone = DEFAULT_APP_TIMEZONE,
  isSubmitting = false,
  portal = false,
}: ScheduleDateDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = open && task !== null;
  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [openSeq, setOpenSeq] = useState(isOpen ? 1 : 0);

  // Remount a fresh body on each open transition without resetting drafts on minute ticks or refetches.
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setOpenSeq((count) => count + 1);
    }
  }

  return (
    <Dialog
      portal={portal}
      open={isOpen}
      onClose={onClose}
      title="Schedule for a day"
      description={
        task ? `Place “${task.title}” on a Daily column without changing its deadline.` : undefined
      }
      initialFocusRef={inputRef}
    >
      {isOpen ? (
        <ScheduleDateDialogBody
          key={`${task.id}:${openSeq}`}
          task={task}
          onClose={onClose}
          onSelectDate={onSelectDate}
          now={now}
          timeZone={timeZone}
          isSubmitting={isSubmitting}
          inputRef={inputRef}
        />
      ) : null}
    </Dialog>
  );
}

interface ScheduleDateDialogBodyProps {
  task: TaskDto;
  onClose: () => void;
  onSelectDate: ScheduleDateDialogProps['onSelectDate'];
  now: Date;
  timeZone: string;
  isSubmitting: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

function ScheduleDateDialogBody({
  task,
  onClose,
  onSelectDate,
  now,
  timeZone,
  isSubmitting,
  inputRef,
}: ScheduleDateDialogBodyProps) {
  const todayStr = formatScheduledDate(now, timeZone);
  const tomorrowStr = shiftScheduledDate(todayStr, 1, timeZone);

  const [initialDraft] = useState(() => buildInitialScheduleDraft(task, now, timeZone));
  const [dateInput, setDateInput] = useState(initialDraft.dateInput);
  const [canonicalDate, setCanonicalDate] = useState<string | null>(initialDraft.canonicalDate);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nativeDateRef = useRef<HTMLInputElement>(null);

  const resolvedDate = resolveDateInput(dateInput, now, timeZone, canonicalDate);

  const applyPreset = (isoDate: string) => {
    const resolved = resolveDateInput(isoDate, now, timeZone);
    if (resolved) {
      setDateInput(resolved.displayInput);
      setCanonicalDate(resolved.scheduledDate);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!task) {
      return;
    }
    if (!resolvedDate) {
      setErrorMessage('Enter a valid date as DD/MM.');
      return;
    }
    try {
      await onSelectDate(task.id, resolvedDate.scheduledDate);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to schedule task.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Chip
          active={resolvedDate?.scheduledDate === todayStr}
          onClick={() => applyPreset(todayStr)}
        >
          Today
        </Chip>
        <Chip
          active={resolvedDate?.scheduledDate === tomorrowStr}
          onClick={() => applyPreset(tomorrowStr)}
        >
          Tomorrow
        </Chip>
      </div>

      <div>
        <label
          htmlFor="schedule-date-input"
          className="block text-[length:var(--fs-ui)] font-medium text-ws-text mb-1.5"
        >
          Day (DD/MM)
        </label>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            id="schedule-date-input"
            type="text"
            placeholder="30/10"
            value={dateInput}
            onChange={(e) => {
              setDateInput(e.target.value);
              setCanonicalDate(null);
              setErrorMessage(null);
            }}
            className="w-full h-11 rounded-item bg-ws-surface border border-ws-border px-3.5 pr-10 text-[length:var(--fs-ui)] text-ws-text tabular-nums"
          />
          <button
            type="button"
            aria-label="Open calendar picker"
            onClick={() => nativeDateRef.current?.showPicker?.()}
            className="absolute right-2 inline-flex items-center justify-center h-8 w-8 rounded-sm text-ws-text-muted hover:text-ws-text hover:bg-ws-accent-soft cursor-pointer"
          >
            <Calendar size={16} strokeWidth={1.5} />
          </button>
          <input
            ref={nativeDateRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            value={resolvedDate?.scheduledDate ?? ''}
            onChange={(e) => {
              if (e.target.value) {
                applyPreset(e.target.value);
              }
            }}
            className="sr-only"
          />
        </div>
      </div>

      {resolvedDate ? (
        <p className="text-[length:var(--fs-small)] text-ws-text-muted">
          Resolves to {resolvedDate.humanLabel}
        </p>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-center gap-2 text-[length:var(--fs-small)] text-text-overdue"
        >
          <AlertCircle size={15} strokeWidth={1.5} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2.5 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
