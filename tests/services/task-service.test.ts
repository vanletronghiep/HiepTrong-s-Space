import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Clock } from '@/domain/clock';
import { NotFoundError, ValidationError } from '@/services/errors';
import { createStorageAdapter } from '@/services/storage/factory';
import type { StorageAdapter } from '@/services/storage/storage-adapter';
import { TaskService } from '@/services/task-service';

class MutableClock implements Clock {
  private current: Date;

  constructor(isoInstant: string) {
    this.current = new Date(isoInstant);
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(isoInstant: string): void {
    this.current = new Date(isoInstant);
  }
}

describe('TaskService (§6.7)', () => {
  let tempDir: string;
  let storage: StorageAdapter;
  let clock: MutableClock;
  let service: TaskService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hts-task-service-'));
    storage = createStorageAdapter({
      storageDriver: 'local',
      databasePath: path.join(tempDir, 'tasks.db'),
      mediaDir: path.join(tempDir, 'media'),
      googleDriveFolderId: '',
    });
    await storage.init();
    clock = new MutableClock('2026-10-30T03:00:00.000Z'); // 10:00 ICT
    service = new TaskService({ storage, clock });
  });

  afterEach(async () => {
    await storage.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('creates a task with computed reminderAt and rejects past deadlines on creation', async () => {
    await expect(
      service.createTask({
        title: 'Past task',
        deadlineAt: '2026-10-30T02:59:00.000Z',
        scheduledDate: '2026-10-30',
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    // 12h remaining -> reminderAt = deadline - 3h
    const created = await service.createTask({
      title: '  Finish architecture spec  ',
      description: 'Read agent_readme carefully',
      priority: 'urgent',
      pinned: true,
      deadlineAt: '2026-10-30T15:00:00.000Z',
      scheduledDate: '2026-10-30',
    });

    expect(created.title).toBe('Finish architecture spec');
    expect(created.reminderAt).toBe('2026-10-30T12:00:00.000Z');
    expect(created.isOverdue).toBe(false);
    expect(created.isDueSoon).toBe(false);

    // Advance clock past reminderAt -> isDueSoon becomes true
    clock.set('2026-10-30T12:30:00.000Z');
    const fetched = await service.getTask(created.id);
    expect(fetched.isDueSoon).toBe(true);
    expect(fetched.isOverdue).toBe(false);
  });

  it('updates deadlineAt, recomputes reminderAt, removes stale alerts, and permits past deadline edits on existing tasks', async () => {
    const task = await service.createTask({
      title: 'Draft report',
      deadlineAt: '2026-10-31T03:00:00.000Z',
      scheduledDate: '2026-10-31',
    });

    // Seed a due_soon notification for this task
    await storage.notifications.saveItem({
      id: crypto.randomUUID(),
      kind: 'due_soon',
      taskId: task.id,
      dedupeKey: `task:${task.id}:due_soon:${task.deadlineAt}`,
      payload: null,
      createdAt: clock.now().toISOString(),
      readAt: null,
    });

    // Update deadline into the past (allowed for existing tasks per §6.7)
    const edited = await service.updateTask(task.id, {
      deadlineAt: '2026-10-30T01:00:00.000Z',
    });

    expect(edited.isOverdue).toBe(true);
    expect(edited.reminderAt).toBeNull();

    // Stale due_soon notification was purged
    const remainingNotifs = await storage.notifications.listItems({ taskId: task.id });
    expect(remainingNotifs).toHaveLength(0);
  });

  it('completes silently when no alert existed, or replaces due_soon/overdue with one completed notification, and uncompletes cleanly', async () => {
    const quietTask = await service.createTask({
      title: 'Quiet task',
      deadlineAt: '2026-11-02T10:00:00.000Z',
    });
    const completedQuiet = await service.completeTask(quietTask.id);
    expect(completedQuiet.status).toBe('completed');
    expect(completedQuiet.reminderAt).toBeNull();
    expect(await storage.notifications.listItems({ taskId: quietTask.id })).toHaveLength(0);

    const alertedTask = await service.createTask({
      title: 'Alerted task',
      deadlineAt: '2026-10-30T15:00:00.000Z',
    });
    await storage.notifications.saveItem({
      id: crypto.randomUUID(),
      kind: 'due_soon',
      taskId: alertedTask.id,
      dedupeKey: `task:${alertedTask.id}:due_soon:${alertedTask.deadlineAt}`,
      payload: null,
      createdAt: clock.now().toISOString(),
      readAt: null,
    });

    clock.set('2026-10-30T13:00:00.000Z');
    await service.completeTask(alertedTask.id);

    // v4.2: the pending alert is cleared and no 'completed' notification is created.
    expect(await storage.notifications.listItems({ taskId: alertedTask.id })).toHaveLength(0);

    // Uncompleting restores active status and recomputes reminderAt
    const uncompleted = await service.uncompleteTask(alertedTask.id);
    expect(uncompleted.status).toBe('active');
    expect(uncompleted.completedAt).toBeNull();
    expect(uncompleted.reminderAt).toBe('2026-10-30T14:30:00.000Z'); // 2h left -> 30m before
  });

  it('transfers an overdue task by setting both scheduledDate and future deadlineAt, rejecting past transfers', async () => {
    const task = await service.createTask({
      title: 'Overdue reading',
      deadlineAt: '2026-10-30T04:00:00.000Z',
      scheduledDate: '2026-10-30',
    });

    clock.set('2026-10-30T06:00:00.000Z');
    expect((await service.getTask(task.id)).isOverdue).toBe(true);

    // Reject transfer into the past
    await expect(
      service.transferTask(task.id, {
        scheduledDate: '2026-10-30',
        deadlineAt: '2026-10-30T05:59:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    // Transfer to tomorrow
    const transferred = await service.transferTask(task.id, {
      scheduledDate: '2026-10-31',
      deadlineAt: '2026-10-31T16:59:00.000Z',
    });
    expect(transferred.scheduledDate).toBe('2026-10-31');
    expect(transferred.isOverdue).toBe(false);
    expect(transferred.reminderAt).toBe('2026-10-30T16:59:00.000Z');
  });

  it('deletes tasks and throws NotFoundError on missing task ids', async () => {
    const task = await service.createTask({
      title: 'Disposable task',
      deadlineAt: '2026-10-31T10:00:00.000Z',
    });

    await service.deleteTask(task.id);
    await expect(service.getTask(task.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('preserves independent fields across interleaved concurrent updates (C03)', async () => {
    const task = await service.createTask({
      title: 'Initial title',
      pinned: false,
      scheduledDate: '2026-10-30',
      deadlineAt: '2026-10-31T10:00:00.000Z',
    });

    // Gate both getItem calls so both updateTask invocations read the same initial snapshot
    // before either write executes.
    const originalGetItem = storage.tasks.getItem.bind(storage.tasks);
    let readCount = 0;
    let releaseBarrier!: () => void;
    const bothReadsDone = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });

    storage.tasks.getItem = async (id: string) => {
      const record = await originalGetItem(id);
      readCount += 1;
      if (readCount >= 2) {
        releaseBarrier();
      }
      await bothReadsDone;
      return record;
    };

    const [firstResult, secondResult] = await Promise.all([
      service.updateTask(task.id, { title: 'Concurrent title edit' }),
      service.updateTask(task.id, { pinned: true, scheduledDate: '2026-11-01' }),
    ]);

    storage.tasks.getItem = originalGetItem;

    const finalTask = await service.getTask(task.id);
    expect(finalTask.title).toBe('Concurrent title edit');
    expect(finalTask.pinned).toBe(true);
    expect(finalTask.scheduledDate).toBe('2026-11-01');
    expect(firstResult.id).toBe(task.id);
    expect(secondResult.id).toBe(task.id);
  });

  it('rolls back task mutations when notification cleanup fails and recovers cleanly on retry (C04)', async () => {
    const task = await service.createTask({
      title: 'Transactional task',
      deadlineAt: '2026-10-30T15:00:00.000Z',
      scheduledDate: '2026-10-30',
    });

    await storage.notifications.saveItem({
      id: crypto.randomUUID(),
      kind: 'overdue',
      taskId: task.id,
      dedupeKey: `task:${task.id}:overdue:${task.deadlineAt}`,
      payload: null,
      createdAt: clock.now().toISOString(),
      readAt: null,
    });

    const originalDeleteWhere = storage.notifications.deleteWhere.bind(storage.notifications);
    let failNextDelete = true;
    storage.notifications.deleteWhere = async (filter) => {
      if (failNextDelete) {
        failNextDelete = false;
        throw new Error('Injected notification delete failure');
      }
      return originalDeleteWhere(filter);
    };

    await expect(service.completeTask(task.id)).rejects.toThrow(
      'Injected notification delete failure',
    );

    // Because of atomic transaction rollback, task remains active and overdue alert is still present
    const afterFailedAttempt = await service.getTask(task.id);
    expect(afterFailedAttempt.status).toBe('active');
    const alertsAfterFailure = await storage.notifications.listItems({ taskId: task.id });
    expect(alertsAfterFailure.map((n) => n.kind)).toEqual(['overdue']);

    // Retry succeeds and leaves both task and notifications consistent
    const afterRetry = await service.completeTask(task.id);
    expect(afterRetry.status).toBe('completed');
    const alertsAfterRetry = await storage.notifications.listItems({ taskId: task.id });
    expect(alertsAfterRetry).toEqual([]);
  });

  it('removes stale completed notifications when reopening a task via uncompleteTask (C07)', async () => {
    const task = await service.createTask({
      title: 'Reopenable task',
      deadlineAt: '2026-10-30T15:00:00.000Z',
      scheduledDate: '2026-10-30',
    });

    await storage.notifications.saveItem({
      id: crypto.randomUUID(),
      kind: 'due_soon',
      taskId: task.id,
      dedupeKey: `task:${task.id}:due_soon:${task.deadlineAt}`,
      payload: null,
      createdAt: clock.now().toISOString(),
      readAt: null,
    });

    await service.completeTask(task.id);
    expect(await storage.notifications.listItems({ taskId: task.id })).toHaveLength(0);

    // Legacy rows written before v4.2 are still removed on reopen.
    await storage.notifications.saveItem({
      id: crypto.randomUUID(),
      kind: 'completed',
      taskId: task.id,
      dedupeKey: `task:${task.id}:completed:${task.deadlineAt}`,
      payload: null,
      createdAt: clock.now().toISOString(),
      readAt: null,
    });
    await service.uncompleteTask(task.id);
    expect(await storage.notifications.listItems({ taskId: task.id })).toHaveLength(0);
  });

  it('normalizes offset timestamps to canonical UTC for range queries and dedupe keys, and rejects impossible calendar dates (C05, C06)', async () => {
    // C06: impossible calendar date rejected
    await expect(
      service.createTask({
        title: 'Impossible date',
        deadlineAt: '2026-10-31T10:00:00.000Z',
        scheduledDate: '2026-02-30',
      }),
    ).rejects.toThrow();

    // C05: offset timestamp normalized to canonical UTC (.toISOString())
    // 2026-10-31T00:30:00+07:00 === 2026-10-30T17:30:00.000Z
    const created = await service.createTask({
      title: 'Offset deadline task',
      deadlineAt: '2026-10-31T00:30:00+07:00',
      scheduledDate: '2026-10-31',
    });

    expect(created.deadlineAt).toBe('2026-10-30T17:30:00.000Z');

    // Range query in UTC (or with offset) matches accurately instead of lexicographical mismatch
    const matchedUtcRange = await service.listTasks({
      deadlineFrom: '2026-10-30T17:00:00.000Z',
      deadlineTo: '2026-10-30T18:00:00.000Z',
    });
    expect(matchedUtcRange.map((t) => t.id)).toEqual([created.id]);

    const matchedOffsetRange = await service.listTasks({
      deadlineFrom: '2026-10-31T00:00:00+07:00',
      deadlineTo: '2026-10-31T01:00:00+07:00',
    });
    expect(matchedOffsetRange.map((t) => t.id)).toEqual([created.id]);
  });

  describe('weekly repeat (v3.3)', () => {
    const weekly = {
      title: 'Weekly review',
      deadlineAt: '2026-10-30T14:00:00.000Z', // Fri 30 Oct 21:00 ICT
      scheduledDate: '2026-10-30',
      repeatWeekly: true,
    };

    it('stores the repeat fields, clears the end date when repeat is off, and validates it', async () => {
      const created = await service.createTask({ ...weekly, repeatUntil: '2026-12-25' });
      expect(created).toMatchObject({ repeatWeekly: true, repeatUntil: '2026-12-25' });

      const off = await service.updateTask(created.id, { repeatWeekly: false });
      expect(off).toMatchObject({ repeatWeekly: false, repeatUntil: null });

      await expect(
        service.createTask({ ...weekly, repeatUntil: '2026-10-29' }),
      ).rejects.toBeInstanceOf(ValidationError);
      const plain = await service.createTask({ title: 'One-off', deadlineAt: weekly.deadlineAt });
      expect(plain).toMatchObject({ repeatWeekly: false, repeatUntil: null });
    });

    it('creates next week\'s copy as soon as a repeating task exists', async () => {
      const created = await service.createTask(weekly);

      const all = await service.listTasks();
      expect(all).toHaveLength(2);
      const copy = all.find((task) => task.id !== created.id)!;
      expect(copy).toMatchObject({
        title: 'Weekly review',
        status: 'active',
        deadlineAt: '2026-11-06T14:00:00.000Z',
        scheduledDate: '2026-11-06',
        repeatWeekly: true,
        completedAt: null,
      });
    });

    it('completing it keeps one more week waiting and keeps history', async () => {
      const created = await service.createTask(weekly);
      await service.completeTask(created.id);

      const all = await service.listTasks();
      expect(all).toHaveLength(3);
      expect(all.find((task) => task.id === created.id)!.status).toBe('completed');
      const dates = all.map((task) => task.scheduledDate).sort();
      expect(dates).toEqual(['2026-10-30', '2026-11-06', '2026-11-13']);
    });

    it('completing the same task again, or an unrepeated one, adds no duplicates', async () => {
      const created = await service.createTask(weekly);
      await service.completeTask(created.id);
      await service.completeTask(created.id);
      expect(await service.listTasks()).toHaveLength(3);

      // Reopen and complete again: both copies already exist, so nothing new appears.
      await service.uncompleteTask(created.id);
      await service.completeTask(created.id);
      expect(await service.listTasks()).toHaveLength(3);

      const once = await service.createTask({ title: 'Once', deadlineAt: weekly.deadlineAt });
      await service.completeTask(once.id);
      expect(await service.listTasks()).toHaveLength(4);
    });

    it('backfills the next copy for repeating tasks that predate pre-creation', async () => {
      await storage.tasks.saveItem({
        id: crypto.randomUUID(),
        title: 'Old repeat',
        description: '',
        priority: 'normal',
        pinned: false,
        deadlineAt: weekly.deadlineAt,
        scheduledDate: weekly.scheduledDate,
        status: 'active',
        completedAt: null,
        reminderAt: null,
        repeatWeekly: true,
        repeatUntil: null,
        createdAt: '2026-10-28T03:00:00.000Z',
        updatedAt: '2026-10-28T03:00:00.000Z',
      });
      await service.backfillRepeatCopies();
      await service.backfillRepeatCopies();
      expect(await service.listTasks()).toHaveLength(2);
    });

    it('stops after the repeat-until date', async () => {
      const created = await service.createTask({ ...weekly, repeatUntil: '2026-11-05' });
      await service.completeTask(created.id);
      // Next copy would land on 6 Nov, past the end date.
      expect(await service.listTasks()).toHaveLength(1);
    });

    it('moves a late completion forward by whole weeks so the copy is in the future', async () => {
      const created = await service.createTask(weekly);
      clock.set('2026-11-20T03:00:00.000Z'); // three weeks later, the task is long overdue
      await service.completeTask(created.id);
      const upcoming = (await service.listTasks()).filter(
        (task) => task.status === 'active' && task.id !== created.id,
      );
      // The pre-created 6 Nov copy is also overdue by now; the freshly queued ones are not.
      expect(upcoming.some((task) => task.deadlineAt === '2026-11-20T14:00:00.000Z')).toBe(true);
      expect(upcoming.find((task) => task.deadlineAt === '2026-11-20T14:00:00.000Z')).toMatchObject({
        scheduledDate: '2026-11-20',
        isOverdue: false,
      });
    });
  });

  describe('subtasks and transfers (v3.4)', () => {
    const base = { title: 'Parent', deadlineAt: '2026-10-30T14:00:00.000Z', scheduledDate: '2026-10-30' };
    const sub = (title: string, priority: 'urgent' | 'normal' | 'optional' = 'normal') => ({
      id: crypto.randomUUID(),
      title,
      priority,
      done: false,
      createdAt: '2026-10-30T03:00:00.000Z',
    });

    it('starts with no subtasks and stores the checklist sent on update', async () => {
      const created = await service.createTask(base);
      expect(created.subtasks).toEqual([]);

      const list = [sub('Outline', 'urgent'), sub('Tidy up', 'optional')];
      const updated = await service.updateTask(created.id, { subtasks: list });
      expect(updated.subtasks).toEqual(list);
      expect((await service.getTask(created.id)).subtasks).toEqual(list);

      const cleared = await service.updateTask(created.id, { subtasks: [] });
      expect(cleared.subtasks).toEqual([]);
    });

    it('accepts subtasks when a task is created', async () => {
      const list = [sub('First step', 'urgent')];
      const created = await service.createTask({ ...base, subtasks: list });
      expect(created.subtasks).toEqual(list);
    });

    it('rejects more than 20 subtasks', async () => {
      const created = await service.createTask(base);
      const many = Array.from({ length: 21 }, (_, i) => sub(`Item ${i}`));
      await expect(service.updateTask(created.id, { subtasks: many })).rejects.toThrow();
    });

    it('promotes a subtask into its own task on the same day and removes it from the parent', async () => {
      const created = await service.createTask(base);
      const keep = sub('Keep');
      const lift = sub('Lift me', 'urgent');
      await service.updateTask(created.id, { subtasks: [keep, lift] });

      const promoted = await service.promoteSubtask(created.id, lift.id);
      expect(promoted).toMatchObject({
        title: 'Lift me',
        priority: 'urgent',
        status: 'active',
        scheduledDate: '2026-10-30',
        deadlineAt: base.deadlineAt,
        subtasks: [],
      });
      expect((await service.getTask(created.id)).subtasks).toEqual([keep]);
      await expect(service.promoteSubtask(created.id, lift.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('gives a promoted subtask a future deadline when the parent is overdue', async () => {
      const created = await service.createTask(base);
      const lift = sub('Late bloomer');
      await service.updateTask(created.id, { subtasks: [lift] });
      clock.set('2026-11-02T03:00:00.000Z');

      const promoted = await service.promoteSubtask(created.id, lift.id);
      expect(promoted.isOverdue).toBe(false);
      expect(promoted.deadlineAt).toBe('2026-11-02T16:59:00.000Z'); // 23:59 ICT
    });

    it('counts each Transfer on the task', async () => {
      const created = await service.createTask(base);
      clock.set('2026-11-02T03:00:00.000Z');
      const once = await service.transferTask(created.id, {
        scheduledDate: '2026-11-03',
        deadlineAt: '2026-11-03T14:00:00.000Z',
      });
      expect(once.transferCount).toBe(1);
      const twice = await service.transferTask(created.id, {
        scheduledDate: '2026-11-04',
        deadlineAt: '2026-11-04T14:00:00.000Z',
      });
      expect(twice.transferCount).toBe(2);
    });
  });
});
