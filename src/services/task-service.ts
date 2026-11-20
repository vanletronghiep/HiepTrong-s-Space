import {
  createTaskInputSchema,
  taskQuerySchema,
  transferTaskInputSchema,
  updateTaskInputSchema,
  type CreateTaskInput,
  type TaskDto,
  type TaskQuery,
  type TaskRecord,
  type TransferTaskInput,
  type UpdateTaskInput,
} from '@/contracts';
import type { Clock } from '@/domain/clock';
import { isFutureInstant } from '@/domain/date-input';
import { computeReminderAt } from '@/domain/reminder';
import { sortTasks } from '@/domain/task-sort';
import { toTaskDto } from '@/domain/task-status';
import {
  buildZonedInstant,
  DEFAULT_APP_TIMEZONE,
  formatScheduledDate,
  shiftScheduledDate,
} from '@/domain/time';
import { NotFoundError, ValidationError } from './errors';
import type { StorageAdapter, TaskRecordPatch } from './storage/storage-adapter';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Weekly repeat (v3.3): a repeat only exists while the toggle is on, and its optional last
 * date may not precede the task's own deadline date.
 */
function normalizeRepeat(
  repeatWeekly: boolean,
  repeatUntil: string | null,
  deadlineAt: string,
): { repeatWeekly: boolean; repeatUntil: string | null } {
  if (!repeatWeekly) return { repeatWeekly: false, repeatUntil: null };
  if (repeatUntil !== null && repeatUntil < formatScheduledDate(deadlineAt, DEFAULT_APP_TIMEZONE)) {
    throw new ValidationError('Repeat until must be on or after the deadline date.', {
      repeatUntil: 'Choose a date on or after the deadline.',
    });
  }
  return { repeatWeekly: true, repeatUntil };
}

export class TaskService {
  private readonly storage: StorageAdapter;
  private readonly clock: Clock;

  constructor(deps: { storage: StorageAdapter; clock: Clock }) {
    this.storage = deps.storage;
    this.clock = deps.clock;
  }

  async listTasks(rawQuery?: TaskQuery): Promise<TaskDto[]> {
    const query = rawQuery ? taskQuerySchema.parse(rawQuery) : undefined;
    const records = await this.storage.tasks.listItems(query);
    const sorted = sortTasks(records);
    const now = this.clock.now();
    return sorted.map((record) => toTaskDto(record, now));
  }

  async getTask(id: string): Promise<TaskDto> {
    const record = await this.storage.tasks.getItem(id);
    if (!record) {
      throw new NotFoundError('Task not found.');
    }
    return toTaskDto(record, this.clock.now());
  }

  async createTask(rawInput: CreateTaskInput): Promise<TaskDto> {
    const input = createTaskInputSchema.parse(rawInput);
    const now = this.clock.now();

    if (!isFutureInstant(input.deadlineAt, now)) {
      throw new ValidationError('Deadline must be in the future.', {
        deadlineAt: 'Choose a future date and time.',
      });
    }

    const nowIso = now.toISOString();
    const repeat = normalizeRepeat(input.repeatWeekly, input.repeatUntil, input.deadlineAt);
    const record: TaskRecord = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      priority: input.priority,
      pinned: input.pinned,
      deadlineAt: input.deadlineAt,
      scheduledDate: input.scheduledDate,
      status: 'active',
      completedAt: null,
      reminderAt: computeReminderAt(input.deadlineAt, now),
      repeatWeekly: repeat.repeatWeekly,
      repeatUntil: repeat.repeatUntil,
      subtasks: input.subtasks,
      transferCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const saved = await this.storage.tasks.saveItem(record);
    if (saved.repeatWeekly === true) await this.ensureNextWeek(saved, now);
    return toTaskDto(saved, now);
  }

  async updateTask(id: string, rawInput: UpdateTaskInput): Promise<TaskDto> {
    const existing = await this.storage.tasks.getItem(id);
    if (!existing) {
      throw new NotFoundError('Task not found.');
    }

    const input = updateTaskInputSchema.parse(rawInput);
    const now = this.clock.now();
    const nowIso = now.toISOString();
    const nextDeadlineAt = input.deadlineAt ?? existing.deadlineAt;
    const deadlineChanged =
      input.deadlineAt !== undefined && input.deadlineAt !== existing.deadlineAt;

    const patch: TaskRecordPatch = {
      updatedAt: nowIso,
    };
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.priority !== undefined) patch.priority = input.priority;
    if (input.pinned !== undefined) patch.pinned = input.pinned;
    if (input.scheduledDate !== undefined) patch.scheduledDate = input.scheduledDate;
    if (input.subtasks !== undefined) patch.subtasks = input.subtasks;
    if (
      input.repeatWeekly !== undefined ||
      input.repeatUntil !== undefined ||
      (deadlineChanged && existing.repeatWeekly === true)
    ) {
      const repeat = normalizeRepeat(
        input.repeatWeekly ?? existing.repeatWeekly ?? false,
        input.repeatUntil !== undefined ? input.repeatUntil : (existing.repeatUntil ?? null),
        nextDeadlineAt,
      );
      patch.repeatWeekly = repeat.repeatWeekly;
      patch.repeatUntil = repeat.repeatUntil;
    }
    if (input.deadlineAt !== undefined) {
      patch.deadlineAt = nextDeadlineAt;
      if (deadlineChanged) {
        patch.reminderAt =
          existing.status === 'completed' ? null : computeReminderAt(nextDeadlineAt, now);
      }
    }

    const saved = await this.storage.runInTransaction(async () => {
      const patched = await this.storage.tasks.patchItem(id, patch);
      if (!patched) {
        throw new NotFoundError('Task not found.');
      }

      if (deadlineChanged) {
        await this.storage.notifications.deleteWhere({
          taskId: id,
          kinds: ['due_soon', 'overdue'],
        });
      }

      return patched;
    });

    if (saved.repeatWeekly === true && saved.status === 'active') {
      await this.ensureNextWeek(saved, now);
    }
    return toTaskDto(saved, now);
  }

  async completeTask(id: string): Promise<TaskDto> {
    const existing = await this.storage.tasks.getItem(id);
    if (!existing) {
      throw new NotFoundError('Task not found.');
    }

    const now = this.clock.now();
    const nowIso = now.toISOString();

    const saved = await this.storage.runInTransaction(async () => {
      const target =
        existing.status === 'completed'
          ? existing
          : await this.storage.tasks.patchItem(id, {
              status: 'completed',
              completedAt: nowIso,
              reminderAt: null,
              updatedAt: nowIso,
            });

      if (!target) {
        throw new NotFoundError('Task not found.');
      }

      if (existing.status !== 'completed' && existing.repeatWeekly === true) {
        // Next week's copy normally exists already; keep one more week waiting behind it.
        const next = await this.ensureNextWeek(existing, now);
        if (next) await this.ensureNextWeek(next, now);
      }

      // v4.2: completing a task only clears its pending due_soon/overdue alerts; no "completed" notification is created.
      await this.storage.notifications.deleteWhere({
        taskId: id,
        kinds: ['due_soon', 'overdue'],
      });

      return target;
    });

    return toTaskDto(saved, now);
  }

  /**
   * Weekly repeat (v3.4): a repeating task always has its next occurrence one week ahead, on the
   * same weekday and time. The deadline and any Daily date move a whole number of weeks forward
   * until the deadline is in the future. Returns the existing or newly created copy, or null
   * when "repeat until" has passed. Never creates a duplicate.
   */
  private async ensureNextWeek(source: TaskRecord, now: Date): Promise<TaskRecord | null> {
    let weeks = 1;
    let deadlineMs = Date.parse(source.deadlineAt) + weeks * WEEK_MS;
    while (deadlineMs <= now.getTime()) {
      weeks += 1;
      deadlineMs = Date.parse(source.deadlineAt) + weeks * WEEK_MS;
    }
    const nextDeadlineAt = new Date(deadlineMs).toISOString();
    const repeatUntil = source.repeatUntil ?? null;
    if (
      repeatUntil !== null &&
      formatScheduledDate(nextDeadlineAt, DEFAULT_APP_TIMEZONE) > repeatUntil
    ) {
      return null;
    }

    const twins = await this.storage.tasks.listItems({
      status: 'active',
      deadlineFrom: nextDeadlineAt,
      deadlineTo: nextDeadlineAt,
    });
    const twin = twins.find((task) => task.title === source.title && task.repeatWeekly === true);
    if (twin) return twin;

    const nowIso = now.toISOString();
    return this.storage.tasks.saveItem({
      id: crypto.randomUUID(),
      title: source.title,
      description: source.description,
      priority: source.priority,
      pinned: source.pinned,
      deadlineAt: nextDeadlineAt,
      scheduledDate:
        source.scheduledDate === null
          ? null
          : shiftScheduledDate(source.scheduledDate, weeks * 7, DEFAULT_APP_TIMEZONE),
      status: 'active',
      completedAt: null,
      reminderAt: computeReminderAt(nextDeadlineAt, now),
      repeatWeekly: true,
      repeatUntil,
      subtasks: (source.subtasks ?? []).map((sub) => ({
        ...sub,
        id: crypto.randomUUID(),
        done: false,
      })),
      transferCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  /** One-time catch-up so repeating tasks created before v3.4 also get their next occurrence. */
  async backfillRepeatCopies(): Promise<void> {
    const now = this.clock.now();
    const active = (await this.storage.tasks.listItems({ status: 'active' })).filter(
      (task) => task.repeatWeekly === true,
    );
    const keys = new Set(active.map((task) => `${task.title}|${Date.parse(task.deadlineAt)}`));
    for (const task of active) {
      // A task that is itself the queued copy of an earlier occurrence needs nothing further.
      if (keys.has(`${task.title}|${Date.parse(task.deadlineAt) - WEEK_MS}`)) continue;
      await this.ensureNextWeek(task, now);
    }
  }

  /**
   * Turns a subtask into its own task on the parent's Daily day. The new task takes the
   * parent's deadline when it is still ahead, otherwise 23:59 today.
   */
  async promoteSubtask(taskId: string, subtaskId: string): Promise<TaskDto> {
    const parent = await this.storage.tasks.getItem(taskId);
    const sub = parent?.subtasks?.find((item) => item.id === subtaskId);
    if (!parent || !sub) {
      throw new NotFoundError('Subtask not found.');
    }

    const now = this.clock.now();
    const nowIso = now.toISOString();
    const endOfToday = buildZonedInstant(formatScheduledDate(now, DEFAULT_APP_TIMEZONE), '23:59');
    const deadlineAt = isFutureInstant(parent.deadlineAt, now)
      ? parent.deadlineAt
      : isFutureInstant(endOfToday, now)
        ? endOfToday
        : new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const created = await this.storage.runInTransaction(async () => {
      await this.storage.tasks.patchItem(taskId, {
        subtasks: (parent.subtasks ?? []).filter((item) => item.id !== subtaskId),
        updatedAt: nowIso,
      });
      return this.storage.tasks.saveItem({
        id: crypto.randomUUID(),
        title: sub.title,
        description: '',
        priority: sub.priority,
        pinned: false,
        deadlineAt,
        scheduledDate: parent.scheduledDate,
        status: sub.done ? 'completed' : 'active',
        completedAt: sub.done ? nowIso : null,
        reminderAt: sub.done ? null : computeReminderAt(deadlineAt, now),
        repeatWeekly: false,
        repeatUntil: null,
        subtasks: [],
        transferCount: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    });
    return toTaskDto(created, now);
  }

  async uncompleteTask(id: string): Promise<TaskDto> {
    const existing = await this.storage.tasks.getItem(id);
    if (!existing) {
      throw new NotFoundError('Task not found.');
    }

    const now = this.clock.now();
    const nowIso = now.toISOString();

    const saved = await this.storage.runInTransaction(async () => {
      const target =
        existing.status === 'active'
          ? existing
          : await this.storage.tasks.patchItem(id, {
              status: 'active',
              completedAt: null,
              reminderAt: computeReminderAt(existing.deadlineAt, now),
              updatedAt: nowIso,
            });

      if (!target) {
        throw new NotFoundError('Task not found.');
      }

      await this.storage.notifications.deleteWhere({
        taskId: id,
        kinds: ['completed'],
      });

      return target;
    });

    return toTaskDto(saved, now);
  }

  async transferTask(id: string, rawInput: TransferTaskInput): Promise<TaskDto> {
    const existing = await this.storage.tasks.getItem(id);
    if (!existing) {
      throw new NotFoundError('Task not found.');
    }

    const input = transferTaskInputSchema.parse(rawInput);
    const now = this.clock.now();

    if (!isFutureInstant(input.deadlineAt, now)) {
      throw new ValidationError('Transfer deadline must be in the future.', {
        deadlineAt: 'Choose a future date and time.',
      });
    }

    const nowIso = now.toISOString();

    const saved = await this.storage.runInTransaction(async () => {
      const patched = await this.storage.tasks.patchItem(id, {
        scheduledDate: input.scheduledDate,
        deadlineAt: input.deadlineAt,
        reminderAt:
          existing.status === 'completed' ? null : computeReminderAt(input.deadlineAt, now),
        transferCount: (existing.transferCount ?? 0) + 1,
        updatedAt: nowIso,
      });

      if (!patched) {
        throw new NotFoundError('Task not found.');
      }

      await this.storage.notifications.deleteWhere({
        taskId: id,
        kinds: ['due_soon', 'overdue'],
      });

      return patched;
    });

    return toTaskDto(saved, now);
  }

  async deleteTask(id: string): Promise<void> {
    const existing = await this.storage.tasks.getItem(id);
    if (!existing) {
      throw new NotFoundError('Task not found.');
    }
    await this.storage.runInTransaction(async () => {
      await this.storage.notifications.deleteWhere({ taskId: id });
      await this.storage.tasks.deleteItem(id);
    });
  }
}
