'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import type { TaskDto } from '@/contracts';
import { buildDeadlineFromInputs, isFutureInstant, resolveDateInput } from '@/domain/date-input';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate, shiftScheduledDate } from '@/domain/time';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { DatePickerField } from '@/ui/DatePickerField';
import { Dialog } from '@/ui/Dialog';
import { TimeFieldControl } from '@/ui/TimeFieldControl';

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
  /** Preselects the transfer day (e.g. Today / Tomorrow from Choose day). */
  initialDate?: string | null;
}

function buildInitialTransferDraft(now: Date, timeZone: string, initialDate?: string | null) {
  const todayStr = formatScheduledDate(now, timeZone);
  const tomorrowStr = shiftScheduledDate(todayStr, 1, timeZone);
  const todayEndOfDay = buildDeadlineFromInputs({
    dateInput: todayStr,
    timeInput: '23:59',
    referenceNow: now,
    timeZone,
  });
  const defaultDate =
    initialDate ??
    (todayEndOfDay.ok && isFutureInstant(todayEndOfDay.deadlineAt, now) ? todayStr : tomorrowStr);
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
  initialDate = null,
}: TransferDialogProps) {
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
          initialDate={initialDate}
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
  initialDate: string | null;
}

function TransferDialogBody({
  task,
  onClose,
  onSubmitTransfer,
  now,
  timeZone,
  isSubmitting,
  initialDate,
}: TransferDialogBodyProps) {
  const todayStr = formatScheduledDate(now, timeZone);
  const tomorrowStr = shiftScheduledDate(todayStr, 1, timeZone);
  const referenceYear = Number(todayStr.slice(0, 4));

  const [initialDraft] = useState(() =>
    buildInitialTransferDraft(now, timeZone, initialDate),
  );
  const [dateInput, setDateInput] = useState(initialDraft.dateInput);
  const [canonicalDate, setCanonicalDate] = useState<string | null>(initialDraft.canonicalDate);
  const [timeInput, setTimeInput] = useState('23:59');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <DatePickerField
          id="transfer-date-input"
          label="New date (DD/MM)"
          mode="task"
          referenceYear={referenceYear}
          placeholder="31/10"
          value={dateInput}
          error={Boolean(errorMessage)}
          onChange={(nextValue) => {
            setDateInput(nextValue);
            setCanonicalDate(null);
            setErrorMessage(null);
          }}
        />

        <TimeFieldControl
          id="transfer-time-input"
          label="New time (24h)"
          placeholder="23:59"
          value={timeInput}
          error={Boolean(errorMessage)}
          onChange={(nextValue) => {
            setTimeInput(nextValue);
            setErrorMessage(null);
          }}
        />
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
}

function ScheduleDateDialogBody({
  task,
  onClose,
  onSelectDate,
  now,
  timeZone,
  isSubmitting,
}: ScheduleDateDialogBodyProps) {
  const todayStr = formatScheduledDate(now, timeZone);
  const tomorrowStr = shiftScheduledDate(todayStr, 1, timeZone);
  const referenceYear = Number(todayStr.slice(0, 4));

  const [initialDraft] = useState(() => buildInitialScheduleDraft(task, now, timeZone));
  const [dateInput, setDateInput] = useState(initialDraft.dateInput);
  const [canonicalDate, setCanonicalDate] = useState<string | null>(initialDraft.canonicalDate);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      <DatePickerField
        id="schedule-date-input"
        label="Day (DD/MM)"
        mode="task"
        referenceYear={referenceYear}
        placeholder="30/10"
        value={dateInput}
        error={Boolean(errorMessage)}
        onChange={(nextValue) => {
          setDateInput(nextValue);
          setCanonicalDate(null);
          setErrorMessage(null);
        }}
      />

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
