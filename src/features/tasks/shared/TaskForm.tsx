'use client';

import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { AlertCircle } from 'lucide-react';
import { ClientApiError } from '@/client/api-client';
import type { CreateTaskInput, Priority, Subtask, TaskDto, UpdateTaskInput } from '@/contracts';
import {
  buildDeadlineFromInputs,
  extractZonedDateAndTime,
  isFutureInstant,
  resolveDateInput,
} from '@/domain/date-input';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { Button } from '@/ui/Button';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import styles from './task-form.module.css';
import { SubtaskList } from './SubtaskList';
import { DatePickerField } from '@/ui/DatePickerField';
import { Drawer } from '@/ui/Drawer';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SegmentedControl, type SegmentedOption } from '@/ui/SegmentedControl';
import { TimeFieldControl } from '@/ui/TimeFieldControl';
import { cn } from '@/ui/cn';

const FIELD_FEEDBACK_CLASS = 'mt-1.5 flex items-center gap-1.5 text-[length:var(--fs-small)]';

const PRIORITY_OPTIONS: readonly SegmentedOption<Priority>[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'normal', label: 'Normal' },
  { value: 'optional', label: 'Optional' },
];

export interface TaskFormProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialTask?: TaskDto | null;
  defaultScheduledDate?: string | null;
  now: Date;
  timeZone?: string;
  isSubmitting?: boolean;
  portal?: boolean;
  onClose: () => void;
  onCreate: (input: CreateTaskInput) => Promise<TaskDto>;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<TaskDto>;
}

interface FieldErrors {
  title?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  description?: string;
  repeatUntil?: string;
  form?: string;
}

interface TaskDraft {
  title: string;
  dateInput: string;
  canonicalDate: string | null;
  timeInput: string;
  priority: Priority;
  description: string;
  pinned: boolean;
  repeatWeekly: boolean;
  repeatUntilInput: string;
  repeatUntilCanonical: string | null;
  subtasks: Subtask[];
}

function buildInitialTaskDraft({
  mode,
  initialTask,
  defaultScheduledDate,
  now,
  timeZone,
}: {
  mode: 'create' | 'edit';
  initialTask?: TaskDto | null;
  defaultScheduledDate: string | null;
  now: Date;
  timeZone: string;
}): TaskDraft {
  if (mode === 'edit' && initialTask) {
    const extracted = extractZonedDateAndTime(initialTask.deadlineAt, now, timeZone);
    return {
      title: initialTask.title,
      dateInput: extracted.dateInput,
      canonicalDate: extracted.scheduledDate,
      timeInput: extracted.timeHm,
      priority: initialTask.priority,
      description: initialTask.description,
      pinned: initialTask.pinned,
      repeatWeekly: initialTask.repeatWeekly === true,
      repeatUntilInput: initialTask.repeatUntil
        ? (resolveDateInput(initialTask.repeatUntil, now, timeZone)?.displayInput ?? '')
        : '',
      repeatUntilCanonical: initialTask.repeatUntil ?? null,
      subtasks: initialTask.subtasks ?? [],
    };
  }

  const baseDate = defaultScheduledDate ?? formatScheduledDate(now, timeZone);
  const resolved = resolveDateInput(baseDate, now, timeZone);
  return {
    title: '',
    dateInput: resolved?.displayInput ?? '',
    canonicalDate: resolved?.scheduledDate ?? null,
    timeInput: '23:59',
    priority: 'normal',
    description: '',
    pinned: false,
    repeatWeekly: false,
    repeatUntilInput: '',
    repeatUntilCanonical: null,
    subtasks: [],
  };
}

export function TaskForm({
  open,
  mode,
  initialTask,
  defaultScheduledDate = null,
  now,
  timeZone = DEFAULT_APP_TIMEZONE,
  isSubmitting = false,
  portal = false,
  onClose,
  onCreate,
  onUpdate,
}: TaskFormProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  const [openSeq, setOpenSeq] = useState(open ? 1 : 0);

  // Remount a fresh body on each open transition without resetting drafts on minute ticks or refetches.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setOpenSeq((count) => count + 1);
    }
  }

  const sessionKey =
    mode === 'edit' ? `edit:${initialTask?.id ?? ''}` : `create:${defaultScheduledDate ?? ''}`;
  const formId = 'hts-task-editor-form';

  return (
    <Drawer
      portal={portal}
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit task' : 'New task'}
      initialFocusRef={titleInputRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" disabled={isSubmitting}>
            Save
          </Button>
        </>
      }
    >
      {open ? (
        <TaskFormBody
          key={`${sessionKey}:${openSeq}`}
          formId={formId}
          titleInputRef={titleInputRef}
          mode={mode}
          initialTask={initialTask}
          defaultScheduledDate={defaultScheduledDate}
          now={now}
          timeZone={timeZone}
          onClose={onClose}
          onCreate={onCreate}
          onUpdate={onUpdate}
        />
      ) : null}
    </Drawer>
  );
}

interface TaskFormBodyProps {
  formId: string;
  titleInputRef: RefObject<HTMLInputElement | null>;
  mode: 'create' | 'edit';
  initialTask?: TaskDto | null;
  defaultScheduledDate: string | null;
  now: Date;
  timeZone: string;
  onClose: () => void;
  onCreate: (input: CreateTaskInput) => Promise<TaskDto>;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<TaskDto>;
}

function TaskFormBody({
  formId,
  titleInputRef,
  mode,
  initialTask,
  defaultScheduledDate,
  now,
  timeZone,
  onClose,
  onCreate,
  onUpdate,
}: TaskFormBodyProps) {
  const reducedMotion = useReducedMotion();
  const referenceYear = Number(formatScheduledDate(now, timeZone).slice(0, 4));

  const [initialDraft] = useState(() =>
    buildInitialTaskDraft({ mode, initialTask, defaultScheduledDate, now, timeZone }),
  );
  const [title, setTitle] = useState(initialDraft.title);
  const [dateInput, setDateInput] = useState(initialDraft.dateInput);
  const [canonicalDate, setCanonicalDate] = useState<string | null>(initialDraft.canonicalDate);
  const [timeInput, setTimeInput] = useState(initialDraft.timeInput);
  const [priority, setPriority] = useState<Priority>(initialDraft.priority);
  const [description, setDescription] = useState(initialDraft.description);
  const [pinned, setPinned] = useState(initialDraft.pinned);
  const [repeatWeekly, setRepeatWeekly] = useState(initialDraft.repeatWeekly);
  const [repeatUntilInput, setRepeatUntilInput] = useState(initialDraft.repeatUntilInput);
  const [repeatUntilCanonical, setRepeatUntilCanonical] = useState<string | null>(
    initialDraft.repeatUntilCanonical,
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialDraft.subtasks);
  const [errors, setErrors] = useState<FieldErrors>({});

  const resolvedDate = resolveDateInput(dateInput, now, timeZone, canonicalDate);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      nextErrors.title = 'Enter a task title.';
    } else if (trimmedTitle.length > 120) {
      nextErrors.title = 'Title must be 120 characters or fewer.';
    }

    if (description.length > 2000) {
      nextErrors.description = 'Description must be 2000 characters or fewer.';
    }

    const builtDeadline = buildDeadlineFromInputs({
      dateInput,
      timeInput,
      referenceNow: now,
      timeZone,
      canonicalDate,
      existingDeadlineAt: mode === 'edit' ? initialTask?.deadlineAt : null,
    });

    if (!builtDeadline.ok) {
      if (builtDeadline.field === 'date') {
        nextErrors.deadlineDate = builtDeadline.message;
      } else {
        nextErrors.deadlineTime = builtDeadline.message;
      }
    } else if (mode === 'create' && !isFutureInstant(builtDeadline.deadlineAt, now)) {
      nextErrors.deadlineDate = 'New tasks must have a deadline in the future.';
    }

    // Repeat until is optional; an empty field means the repeat has no end date.
    let repeatUntil: string | null = null;
    if (repeatWeekly && repeatUntilInput.trim() !== '') {
      const resolvedUntil = resolveDateInput(repeatUntilInput, now, timeZone, repeatUntilCanonical);
      if (!resolvedUntil) {
        nextErrors.repeatUntil = 'Enter a valid date, such as 30/10.';
      } else if (
        builtDeadline.ok &&
        resolvedUntil.scheduledDate <
          extractZonedDateAndTime(builtDeadline.deadlineAt, now, timeZone).scheduledDate
      ) {
        nextErrors.repeatUntil = 'Repeat until must be on or after the deadline date.';
      } else {
        repeatUntil = resolvedUntil.scheduledDate;
      }
    }

    if (Object.keys(nextErrors).length > 0 || !builtDeadline.ok) {
      setErrors(nextErrors);
      if (nextErrors.title) titleInputRef.current?.focus();
      return;
    }

    setErrors({});

    try {
      if (mode === 'edit' && initialTask) {
        await onUpdate(initialTask.id, {
          title: trimmedTitle,
          description,
          priority,
          pinned,
          deadlineAt: builtDeadline.deadlineAt,
          repeatWeekly,
          repeatUntil,
          subtasks,
        });
      } else {
        await onCreate({
          title: trimmedTitle,
          description,
          priority,
          pinned,
          deadlineAt: builtDeadline.deadlineAt,
          scheduledDate: defaultScheduledDate,
          repeatWeekly,
          repeatUntil,
          subtasks,
        });
      }
      onClose();
    } catch (error: unknown) {
      if (error instanceof ClientApiError && error.fields) {
        setErrors({
          title: error.fields.title,
          deadlineDate: error.fields.deadlineAt,
          description: error.fields.description,
          repeatUntil: error.fields.repeatUntil,
          form: error.message,
        });
        return;
      }
      setErrors({
        form: error instanceof Error ? error.message : 'Unable to save task.',
      });
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Title (v3.2: reserved message line + 12px before Deadline, instead of 20px) */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="task-title-input"
            className="text-[length:var(--fs-ui)] font-medium text-ws-text"
          >
            Title
          </label>
          {title.length >= 100 ? (
            <span
              className={cn(
                'text-[length:var(--fs-micro)] tabular-nums',
                title.length > 120 ? 'text-text-overdue font-medium' : 'text-ws-text-muted',
              )}
            >
              {title.length}/120
            </span>
          ) : null}
        </div>
        <input
          ref={titleInputRef}
          id="task-title-input"
          type="text"
          placeholder="What needs your attention?"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (
              errors.title &&
              e.target.value.trim().length > 0 &&
              e.target.value.trim().length <= 120
            ) {
              setErrors((prev) => ({ ...prev, title: undefined }));
            }
          }}
          aria-invalid={Boolean(errors.title)}
          aria-describedby="task-title-feedback"
          className={cn(
            'w-full h-11 rounded-item bg-ws-surface border px-3.5 text-[length:var(--fs-ui)] text-ws-text placeholder:text-ws-text-muted',
            errors.title ? 'border-tint-overdue-border' : 'border-ws-border',
            errors.title && styles.titleInvalid,
          )}
        />
        <div id="task-title-feedback" className={styles.titleMessage}>
          <div
            aria-hidden="true"
            className={cn(
              styles.titleMessageSlot,
              FIELD_FEEDBACK_CLASS,
              'invisible pointer-events-none select-none',
            )}
          >
            <AlertCircle size={14} strokeWidth={1.5} className="shrink-0" />
            <span
              className={cn('min-w-0', styles.titleReserveText)}
              data-reserve-text="Enter a task title."
            />
          </div>
          <AnimatePresence initial={false}>
            {errors.title && (
              <motion.div
                className={styles.titleMessageSlot}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
              >
                <InlineFieldError message={errors.title} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Deadline Date & Time */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[length:var(--fs-ui)] font-medium text-ws-text">Deadline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DatePickerField
            id="task-date-input"
            ariaLabel="Deadline date (DD/MM)"
            mode="task"
            referenceYear={referenceYear}
            placeholder="30/10"
            value={dateInput}
            error={Boolean(errors.deadlineDate)}
            onChange={(nextValue) => {
              setDateInput(nextValue);
              setCanonicalDate(null);
              if (errors.deadlineDate) {
                setErrors((prev) => ({ ...prev, deadlineDate: undefined }));
              }
            }}
          />

          <TimeFieldControl
            id="task-time-input"
            ariaLabel="Deadline time (HH:mm)"
            placeholder="23:59"
            value={timeInput}
            error={Boolean(errors.deadlineTime)}
            onChange={(nextValue) => {
              setTimeInput(nextValue);
              if (errors.deadlineTime) {
                setErrors((prev) => ({ ...prev, deadlineTime: undefined }));
              }
            }}
          />
        </div>

        {resolvedDate ? (
          <p className="text-[length:var(--fs-small)] text-ws-text-muted">
            Resolves to {resolvedDate.humanLabel}
          </p>
        ) : null}

        {errors.deadlineDate ? <InlineFieldError message={errors.deadlineDate} /> : null}
        {errors.deadlineTime ? <InlineFieldError message={errors.deadlineTime} /> : null}
      </div>

      {/* Priority */}
      <div>
        <span className="block text-[length:var(--fs-ui)] font-medium text-ws-text mb-2">
          Priority
        </span>
        <SegmentedControl
          aria-label="Task priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            id="task-desc-label"
            htmlFor="task-desc-input"
            className="text-[length:var(--fs-ui)] font-medium text-ws-text"
          >
            Description
          </label>
          {description.length >= 1800 ? (
            <span
              className={cn(
                'text-[length:var(--fs-micro)] tabular-nums',
                description.length > 2000 ? 'text-text-overdue font-medium' : 'text-ws-text-muted',
              )}
            >
              {description.length}/2000
            </span>
          ) : null}
        </div>
        <RichNoteEditor
          id="task-desc-input"
          ariaLabelledBy="task-desc-label"
          placeholder="Optional notes or context…"
          value={description}
          maxLength={2000}
          error={Boolean(errors.description)}
          onChange={(nextValue) => {
            setDescription(nextValue);
            if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
          }}
        />
        {errors.description ? <InlineFieldError message={errors.description} /> : null}
      </div>

      {/* Subtasks (v3.4): saved together with the task */}
      <SubtaskList subtasks={subtasks} onChange={setSubtasks} />

      {/* Pinned toggle */}
      <div className="flex items-center justify-between pt-1">
        <label
          htmlFor="task-pinned-switch"
          className="text-[length:var(--fs-ui)] font-medium text-ws-text cursor-pointer"
        >
          Pin to top of the day
        </label>
        <button
          id="task-pinned-switch"
          type="button"
          role="switch"
          aria-checked={pinned}
          onClick={() => setPinned((prev) => !prev)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-pill border transition-colors duration-[var(--dur-fast)] motion-reduce:transition-none motion-reduce:duration-0 cursor-pointer',
            pinned
              ? 'bg-fill-checkbox-checked border-fill-checkbox-checked'
              : 'bg-ws-accent-soft border-ws-border',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'inline-block h-4 w-4 rounded-pill bg-ws-surface transition-transform duration-[var(--dur-fast)] motion-reduce:transition-none motion-reduce:duration-0',
              pinned ? 'translate-x-5' : 'translate-x-1',
            )}
          />
        </button>
      </div>

      {/* Weekly repeat (v3.3): completing the task creates next week's copy */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="task-repeat-switch"
            className="text-[length:var(--fs-ui)] font-medium text-ws-text cursor-pointer"
          >
            Repeat weekly
          </label>
          <button
            id="task-repeat-switch"
            type="button"
            role="switch"
            aria-checked={repeatWeekly}
            onClick={() => setRepeatWeekly((prev) => !prev)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-pill border transition-colors duration-[var(--dur-fast)] motion-reduce:transition-none motion-reduce:duration-0 cursor-pointer',
              repeatWeekly
                ? 'bg-fill-checkbox-checked border-fill-checkbox-checked'
                : 'bg-ws-accent-soft border-ws-border',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'inline-block h-4 w-4 rounded-pill bg-ws-surface transition-transform duration-[var(--dur-fast)] motion-reduce:transition-none motion-reduce:duration-0',
                repeatWeekly ? 'translate-x-5' : 'translate-x-1',
              )}
            />
          </button>
        </div>
        {repeatWeekly ? (
          <div className="space-y-2">
            <p className="text-[length:var(--fs-small)] text-ws-text-muted">
              Completing this task creates next week’s copy on the same weekday.
            </p>
            <DatePickerField
              id="task-repeat-until-input"
              ariaLabel="Repeat until (optional)"
              mode="task"
              clearable
              referenceYear={referenceYear}
              placeholder="Repeat until (optional), e.g. 30/12"
              value={repeatUntilInput}
              error={Boolean(errors.repeatUntil)}
              onChange={(nextValue) => {
                setRepeatUntilInput(nextValue);
                setRepeatUntilCanonical(null);
                if (errors.repeatUntil) setErrors((prev) => ({ ...prev, repeatUntil: undefined }));
              }}
            />
            {errors.repeatUntil ? <InlineFieldError message={errors.repeatUntil} /> : null}
          </div>
        ) : null}
      </div>

      {errors.form ? <InlineFieldError message={errors.form} /> : null}
    </form>
  );
}

function InlineFieldError({ message }: { message: string }) {
  return (
    <div role="alert" className={cn(FIELD_FEEDBACK_CLASS, 'text-text-overdue')}>
      <AlertCircle size={14} strokeWidth={1.5} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
