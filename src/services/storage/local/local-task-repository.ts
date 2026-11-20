import { and, asc, eq, gte, isNull, lte, type SQL } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { subtasksSchema, taskRecordSchema, type TaskQuery, type TaskRecord } from '@/contracts';
import type { TaskRecordPatch, TaskRepository } from '../storage-adapter';
import { tasksTable } from './schema';

type TaskRow = typeof tasksTable.$inferSelect;

function parseSubtasks(raw: string): TaskRecord['subtasks'] {
  try {
    const parsed = subtasksSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function rowToTaskRecord(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    pinned: row.pinned,
    deadlineAt: row.deadlineAt,
    scheduledDate: row.scheduledDate,
    status: row.status,
    completedAt: row.completedAt,
    reminderAt: row.reminderAt,
    repeatWeekly: row.repeatWeekly,
    repeatUntil: row.repeatUntil,
    subtasks: parseSubtasks(row.subtasks),
    transferCount: row.transferCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class LocalTaskRepository implements TaskRepository {
  private readonly getDb: () => BetterSQLite3Database;

  constructor(getDb: () => BetterSQLite3Database) {
    this.getDb = getDb;
  }

  async saveItem(record: TaskRecord): Promise<TaskRecord> {
    const validated = taskRecordSchema.parse(record);
    const db = this.getDb();

    db.insert(tasksTable)
      .values({
        id: validated.id,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        pinned: validated.pinned,
        deadlineAt: validated.deadlineAt,
        scheduledDate: validated.scheduledDate,
        status: validated.status,
        completedAt: validated.completedAt,
        reminderAt: validated.reminderAt,
        repeatWeekly: validated.repeatWeekly,
        repeatUntil: validated.repeatUntil,
        subtasks: JSON.stringify(validated.subtasks ?? []),
        transferCount: validated.transferCount ?? 0,
        createdAt: validated.createdAt,
        updatedAt: validated.updatedAt,
      })
      .onConflictDoUpdate({
        target: tasksTable.id,
        set: {
          title: validated.title,
          description: validated.description,
          priority: validated.priority,
          pinned: validated.pinned,
          deadlineAt: validated.deadlineAt,
          scheduledDate: validated.scheduledDate,
          status: validated.status,
          completedAt: validated.completedAt,
          reminderAt: validated.reminderAt,
          repeatWeekly: validated.repeatWeekly,
          repeatUntil: validated.repeatUntil,
          subtasks: JSON.stringify(validated.subtasks ?? []),
          transferCount: validated.transferCount ?? 0,
          createdAt: validated.createdAt,
          updatedAt: validated.updatedAt,
        },
      })
      .run();

    return validated;
  }

  async patchItem(id: string, patch: TaskRecordPatch): Promise<TaskRecord | null> {
    const db = this.getDb();
    const updateValues: Partial<typeof tasksTable.$inferInsert> = {
      updatedAt: patch.updatedAt,
    };

    if (patch.title !== undefined) updateValues.title = patch.title;
    if (patch.description !== undefined) updateValues.description = patch.description;
    if (patch.priority !== undefined) updateValues.priority = patch.priority;
    if (patch.pinned !== undefined) updateValues.pinned = patch.pinned;
    if (patch.deadlineAt !== undefined) updateValues.deadlineAt = patch.deadlineAt;
    if (patch.scheduledDate !== undefined) updateValues.scheduledDate = patch.scheduledDate;
    if (patch.status !== undefined) updateValues.status = patch.status;
    if (patch.completedAt !== undefined) updateValues.completedAt = patch.completedAt;
    if (patch.reminderAt !== undefined) updateValues.reminderAt = patch.reminderAt;
    if (patch.repeatWeekly !== undefined) updateValues.repeatWeekly = patch.repeatWeekly;
    if (patch.repeatUntil !== undefined) updateValues.repeatUntil = patch.repeatUntil;
    if (patch.subtasks !== undefined) updateValues.subtasks = JSON.stringify(patch.subtasks);
    if (patch.transferCount !== undefined) updateValues.transferCount = patch.transferCount;

    const result = db.update(tasksTable).set(updateValues).where(eq(tasksTable.id, id)).run();
    if (result.changes === 0) {
      return null;
    }

    const row = db.select().from(tasksTable).where(eq(tasksTable.id, id)).get();
    return row ? taskRecordSchema.parse(rowToTaskRecord(row)) : null;
  }

  async getItem(id: string): Promise<TaskRecord | null> {
    const db = this.getDb();
    const row = db.select().from(tasksTable).where(eq(tasksTable.id, id)).get();
    return row ? rowToTaskRecord(row) : null;
  }

  async listItems(query?: TaskQuery): Promise<TaskRecord[]> {
    const db = this.getDb();
    const conditions: SQL[] = [];

    if (query?.status !== undefined) {
      conditions.push(eq(tasksTable.status, query.status));
    }
    if (query?.priority !== undefined) {
      conditions.push(eq(tasksTable.priority, query.priority));
    }
    if (query?.scheduledDate !== undefined) {
      if (query.scheduledDate === null) {
        conditions.push(isNull(tasksTable.scheduledDate));
      } else {
        conditions.push(eq(tasksTable.scheduledDate, query.scheduledDate));
      }
    }
    if (query?.scheduledFrom !== undefined) {
      conditions.push(gte(tasksTable.scheduledDate, query.scheduledFrom));
    }
    if (query?.scheduledTo !== undefined) {
      conditions.push(lte(tasksTable.scheduledDate, query.scheduledTo));
    }
    if (query?.deadlineFrom !== undefined) {
      conditions.push(gte(tasksTable.deadlineAt, query.deadlineFrom));
    }
    if (query?.deadlineTo !== undefined) {
      conditions.push(lte(tasksTable.deadlineAt, query.deadlineTo));
    }

    const baseQuery = db.select().from(tasksTable);
    const filteredQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
    const rows = filteredQuery.orderBy(asc(tasksTable.createdAt), asc(tasksTable.id)).all();

    let records = rows.map(rowToTaskRecord);

    const search = query?.search?.trim();
    if (search) {
      const needle = search.toLocaleLowerCase();
      records = records.filter(
        (task) =>
          task.title.toLocaleLowerCase().includes(needle) ||
          task.description.toLocaleLowerCase().includes(needle),
      );
    }

    return records;
  }

  async deleteItem(id: string): Promise<void> {
    const db = this.getDb();
    db.delete(tasksTable).where(eq(tasksTable.id, id)).run();
  }
}
