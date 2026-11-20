import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import type { NotificationDto, NotificationKind } from '@/contracts';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate, shiftScheduledDate } from './time';

export type NotificationReadFilter = 'all' | 'unread' | 'read';
export type NotificationKindFilter = 'all' | NotificationKind;

export const NOTIFICATION_KIND_ORDER: readonly NotificationKind[] = [
  'due_soon',
  'overdue',
  'completed',
  'general',
  'system',
];

export interface NotificationFilterOptions {
  query: string;
  readStatus: NotificationReadFilter;
  kind: NotificationKindFilter;
}

export interface NotificationGroupCounts {
  total: number;
  unread: number;
  read: number;
  byKind: Record<NotificationKind, number>;
}

/**
 * Counts unread, read, and per-kind totals across all fetched notifications in a single pass.
 */
export function countNotificationGroups(
  items: readonly NotificationDto[],
): NotificationGroupCounts {
  const byKind: Record<NotificationKind, number> = {
    due_soon: 0,
    overdue: 0,
    completed: 0,
    general: 0,
    system: 0,
  };

  let unread = 0;
  for (const item of items) {
    if (!item.isRead) {
      unread += 1;
    }
    byKind[item.kind] += 1;
  }

  return {
    total: items.length,
    unread,
    read: items.length - unread,
    byKind,
  };
}

/**
 * Filters notifications by text query (title, message, tagLabel), read status, and kind while
 * preserving the server's newest-first ordering.
 */
export function filterNotifications(
  items: readonly NotificationDto[],
  options: NotificationFilterOptions,
): NotificationDto[] {
  const normalizedQuery = options.query.trim().toLocaleLowerCase();

  return items.filter((item) => {
    if (options.readStatus === 'unread' && item.isRead) {
      return false;
    }
    if (options.readStatus === 'read' && !item.isRead) {
      return false;
    }
    if (options.kind !== 'all' && item.kind !== options.kind) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return (
      item.title.toLocaleLowerCase().includes(normalizedQuery) ||
      item.message.toLocaleLowerCase().includes(normalizedQuery) ||
      item.tagLabel.toLocaleLowerCase().includes(normalizedQuery)
    );
  });
}

export interface NotificationDateGroup {
  dateKey: string;
  label: string;
  items: NotificationDto[];
}

function formatDateGroupLabel(
  dateKey: string,
  todayKey: string,
  yesterdayKey: string,
  referenceYear: number,
  timeZone: string,
): string {
  if (dateKey === todayKey) {
    return 'Today';
  }
  if (dateKey === yesterdayKey) {
    return 'Yesterday';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return dateKey;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const anchor = new TZDate(year, month - 1, day, 12, 0, 0, 0, timeZone);
  return format(anchor, year === referenceYear ? 'EEEE, MMM d' : 'EEEE, MMM d, yyyy');
}

/**
 * Groups notifications newest-first by calendar date in `timeZone` while preserving order within each day.
 */
export function groupNotificationsByDate(
  items: readonly NotificationDto[],
  referenceNow: Date = new Date(),
  timeZone: string = DEFAULT_APP_TIMEZONE,
): NotificationDateGroup[] {
  if (items.length === 0) {
    return [];
  }

  const todayKey = formatScheduledDate(referenceNow, timeZone);
  const yesterdayKey = shiftScheduledDate(todayKey, -1, timeZone);
  const referenceYear = Number(todayKey.slice(0, 4));
  const groupsByKey = new Map<string, NotificationDateGroup>();

  for (const item of items) {
    const dateKey = formatScheduledDate(item.createdAt, timeZone);
    const existing = groupsByKey.get(dateKey);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    groupsByKey.set(dateKey, {
      dateKey,
      label: formatDateGroupLabel(dateKey, todayKey, yesterdayKey, referenceYear, timeZone),
      items: [item],
    });
  }

  return Array.from(groupsByKey.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
