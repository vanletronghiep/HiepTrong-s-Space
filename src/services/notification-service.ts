import type { TimedSource } from './timed-sources';
import { addDays, differenceInMilliseconds } from 'date-fns';
import type {
  NotificationDto,
  NotificationListResponse,
  NotificationRecord,
  TaskRecord,
} from '@/contracts';
import type { Clock } from '@/domain/clock';
import { buildNotificationDto, evaluateTaskReminderCandidate } from '@/domain/notification-rules';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { ConflictError, NotFoundError } from './errors';
import type { StorageAdapter } from './storage/storage-adapter';

const RETENTION_DAYS = 7;

export class NotificationService {
  private readonly storage: StorageAdapter;
  private readonly clock: Clock;
  private readonly timeZone: string;
  private readonly timedSources: () => Promise<TimedSource[]>;
  private lastTickAt: Date | null = null;
  private inFlightTick: Promise<{ createdCount: number }> | null = null;

  constructor(deps: { storage: StorageAdapter; clock: Clock; timeZone?: string; timedSources?: () => Promise<TimedSource[]> }) {
    this.timedSources = deps.timedSources ?? (async () => []);
    this.storage = deps.storage;
    this.clock = deps.clock;
    this.timeZone = deps.timeZone ?? DEFAULT_APP_TIMEZONE;
  }

  async runReminderTick(): Promise<{ createdCount: number }> {
    if (this.inFlightTick) {
      return this.inFlightTick;
    }

    const tickPromise = this.executeReminderTick().finally(() => {
      if (this.inFlightTick === tickPromise) {
        this.inFlightTick = null;
      }
    });
    this.inFlightTick = tickPromise;
    return tickPromise;
  }

  private async executeReminderTick(): Promise<{ createdCount: number }> {
    const now = this.clock.now();
    const nowIso = now.toISOString();

    const [activeTasks, existingAlerts] = await Promise.all([
      this.storage.tasks.listItems({ status: 'active' }),
      this.storage.notifications.listItems({ kinds: ['due_soon', 'overdue'] }),
    ]);

    const existingDedupeKeys = new Set(existingAlerts.map((n) => n.dedupeKey));
    let createdCount = 0;

    for (const task of activeTasks) {
      const candidate = evaluateTaskReminderCandidate(task, now);
      if (!candidate || existingDedupeKeys.has(candidate.dedupeKey)) {
        continue;
      }

      const record: NotificationRecord = {
        id: crypto.randomUUID(),
        kind: candidate.kind,
        taskId: candidate.taskId,
        dedupeKey: candidate.dedupeKey,
        payload: null,
        createdAt: nowIso,
        readAt: null,
      };

      try {
        await this.storage.notifications.saveItem(record);
        existingDedupeKeys.add(candidate.dedupeKey);
        createdCount += 1;
      } catch (error: unknown) {
        if (!(error instanceof ConflictError)) {
          throw error;
        }
      }
    }

    for (const source of await this.timedSources()) {
      const remaining = Date.parse(source.deadlineAt) - now.getTime();
      if (remaining > 86400000) continue;
      const kind = remaining <= 0 ? 'overdue' : 'due_soon';
      const dedupeKey = `${source.key}:${source.deadlineAt}:${kind}`;
      if (existingDedupeKeys.has(dedupeKey)) continue;
      try {
        await this.storage.notifications.saveItem({
          id: crypto.randomUUID(),
          kind,
          taskId: null,
          dedupeKey,
          payload: {
            sourceKey: source.key,
            deadlineAt: source.deadlineAt,
            targetUrl: source.targetUrl,
            title: source.title,
            message: `${source.title}: ${kind === 'overdue' ? 'overdue' : 'due within 24 hours'}`,
          },
          createdAt: nowIso,
          readAt: null,
        });
        existingDedupeKeys.add(dedupeKey);
        createdCount += 1;
      } catch (error: unknown) {
        if (!(error instanceof ConflictError)) {
          throw error;
        }
      }
    }

    this.lastTickAt = now;
    return { createdCount };
  }

  async runReminderTickIfStale(maxAgeMs: number = 15_000): Promise<void> {
    if (this.inFlightTick) {
      await this.inFlightTick;
      return;
    }
    const now = this.clock.now();
    if (this.lastTickAt === null || differenceInMilliseconds(now, this.lastTickAt) > maxAgeMs) {
      await this.runReminderTick();
    }
  }

  async purgeExpired(): Promise<number> {
    const now = this.clock.now();
    const cutoffIso = addDays(now, -RETENTION_DAYS).toISOString();
    return this.storage.notifications.deleteWhere({
      createdAtOnOrBefore: cutoffIso,
    });
  }

  async listNotifications(): Promise<NotificationListResponse> {
    const now = this.clock.now();
    const cutoffIso = addDays(now, -RETENTION_DAYS).toISOString();
    const [records, tasks] = await Promise.all([
      this.storage.notifications.listItems({ createdAtAfter: cutoffIso }),
      this.storage.tasks.listItems(),
    ]);

    const taskMap = new Map<string, TaskRecord>();
    for (const task of tasks) {
      taskMap.set(task.id, task);
    }

    const sources = new Map((await this.timedSources()).map(source => [source.key, source]));
    const items: NotificationDto[] = [];
    for (const record of records) {
      if (record.payload?.sourceKey && sources.get(record.payload.sourceKey)?.deadlineAt !== record.payload.deadlineAt) continue;
      if (record.createdAt <= cutoffIso) {
        continue;
      }
      // v4.2: completion no longer notifies; hide legacy 'completed' rows until retention purges them.
      if (record.kind === 'completed') {
        continue;
      }
      const linkedTask = record.taskId ? (taskMap.get(record.taskId) ?? null) : null;
      const source = record.payload?.sourceKey ? sources.get(record.payload.sourceKey) : undefined;
      const dto = buildNotificationDto({
        record: source ? { ...record, payload: { ...record.payload, title: source.title, targetUrl: source.targetUrl } } : record,
        task: linkedTask,
        now,
        timeZone: this.timeZone,
      });
      if (dto) {
        items.push(dto);
      }
    }

    const unreadCount = items.filter((item) => !item.isRead).length;
    return { items, unreadCount };
  }

  async markRead(id: string): Promise<NotificationDto> {
    return this.setReadState(id, true);
  }

  async markUnread(id: string): Promise<NotificationDto> {
    return this.setReadState(id, false);
  }

  private async setReadState(id: string, isRead: boolean): Promise<NotificationDto> {
    const existing = await this.storage.notifications.getItem(id);
    if (!existing) {
      throw new NotFoundError('Notification not found.');
    }

    const now = this.clock.now();
    const updated: NotificationRecord = {
      ...existing,
      readAt: isRead ? (existing.readAt ?? now.toISOString()) : null,
    };

    const saved = await this.storage.notifications.saveItem(updated);
    const linkedTask = saved.taskId ? await this.storage.tasks.getItem(saved.taskId) : null;
    const dto = buildNotificationDto({
      record: saved,
      task: linkedTask,
      now,
      timeZone: this.timeZone,
    });

    if (!dto) {
      throw new NotFoundError('Linked task for notification no longer exists.');
    }
    return dto;
  }

  async markAllRead(): Promise<{ updatedCount: number }> {
    const unread = await this.storage.notifications.listItems({ unreadOnly: true });
    if (unread.length === 0) {
      return { updatedCount: 0 };
    }

    const nowIso = this.clock.now().toISOString();
    for (const item of unread) {
      await this.storage.notifications.saveItem({
        ...item,
        readAt: nowIso,
      });
    }
    return { updatedCount: unread.length };
  }
}
