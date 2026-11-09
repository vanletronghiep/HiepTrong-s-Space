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
import { ConflictError, NotFoundError, ValidationError } from './errors';
import type { StorageAdapter, TaskRecordPatch } from './storage/storage-adapter';

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
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const saved = await this.storage.tasks.saveItem(record);
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

      // §6.7: If the task had a due_soon or overdue notification, delete those and create one completed notification.
      const removedAlertCount = await this.storage.notifications.deleteWhere({
        taskId: id,
        kinds: ['due_soon', 'overdue'],
      });

      if (removedAlertCount > 0) {
        try {
          await this.storage.notifications.saveItem({
            id: crypto.randomUUID(),
            kind: 'completed',
            taskId: id,
            dedupeKey: `task:${id}:completed:${target.deadlineAt}`,
            payload: null,
            createdAt: nowIso,
            readAt: null,
          });
        } catch (error: unknown) {
          if (!(error instanceof ConflictError)) {
            throw error;
          }
        }
      }

      return target;
    });

    return toTaskDto(saved, now);
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
