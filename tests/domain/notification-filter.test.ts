import { describe, expect, it } from 'vitest';
import type { NotificationDto } from '@/contracts';
import {
  countNotificationGroups,
  filterNotifications,
  groupNotificationsByDate,
} from '@/domain/notification-filter';

const SAMPLE_ITEMS: NotificationDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    kind: 'due_soon',
    tagLabel: 'Due soon',
    title: 'Linear Algebra Quiz',
    message: '"Linear Algebra Quiz" is due today at 18:00.',
    isRead: false,
    createdAt: '2026-11-13T10:00:00.000Z',
    timeLeftMs: 3_600_000,
    taskId: '00000000-0000-4000-8000-000000000101',
    targetUrl: '/tasks/hub?task=00000000-0000-4000-8000-000000000101',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    kind: 'overdue',
    tagLabel: 'Overdue',
    title: 'Submit Project Proposal',
    message: '"Submit Project Proposal" was due yesterday.',
    isRead: false,
    createdAt: '2026-11-12T10:00:00.000Z',
    timeLeftMs: -7_200_000,
    taskId: null,
    targetUrl: '/projects?item=proposal',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    kind: 'completed',
    tagLabel: 'Completed',
    title: 'Nicely done',
    message: '"Daily reading block" is complete.',
    isRead: true,
    createdAt: '2026-11-11T10:00:00.000Z',
    timeLeftMs: null,
    taskId: '00000000-0000-4000-8000-000000000103',
    targetUrl: '/tasks/hub?task=00000000-0000-4000-8000-000000000103',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    kind: 'system',
    tagLabel: 'System',
    title: 'Backup check',
    message: 'SQLite integrity verified.',
    isRead: true,
    createdAt: '2026-11-10T10:00:00.000Z',
    timeLeftMs: null,
    taskId: null,
    targetUrl: null,
  },
];

describe('notification-filter domain helpers', () => {
  it('computes unread, read, and per-kind counts in a single pass', () => {
    const counts = countNotificationGroups(SAMPLE_ITEMS);
    expect(counts).toEqual({
      total: 4,
      unread: 2,
      read: 2,
      byKind: {
        due_soon: 1,
        overdue: 1,
        completed: 1,
        general: 0,
        system: 1,
      },
    });
  });

  it('filters by read status, notification kind, and case-insensitive search across title/message/tagLabel', () => {
    expect(
      filterNotifications(SAMPLE_ITEMS, { query: '  linear  ', readStatus: 'all', kind: 'all' }).map(
        (i) => i.id,
      ),
    ).toEqual(['00000000-0000-4000-8000-000000000001']);

    expect(
      filterNotifications(SAMPLE_ITEMS, { query: 'sqlite', readStatus: 'read', kind: 'system' }).map(
        (i) => i.id,
      ),
    ).toEqual(['00000000-0000-4000-8000-000000000004']);

    expect(
      filterNotifications(SAMPLE_ITEMS, { query: 'overdue', readStatus: 'unread', kind: 'all' }).map(
        (i) => i.id,
      ),
    ).toEqual(['00000000-0000-4000-8000-000000000002']);

    expect(
      filterNotifications(SAMPLE_ITEMS, { query: '', readStatus: 'unread', kind: 'completed' }),
    ).toEqual([]);
  });

  it('groups notifications newest-first by calendar date in Asia/Saigon', () => {
    const refNow = new Date('2026-11-13T12:00:00.000Z');
    const groups = groupNotificationsByDate(SAMPLE_ITEMS, refNow);
    expect(groups.map((g) => ({ dateKey: g.dateKey, label: g.label, count: g.items.length }))).toEqual([
      { dateKey: '2026-11-13', label: 'Today', count: 1 },
      { dateKey: '2026-11-12', label: 'Yesterday', count: 1 },
      { dateKey: '2026-11-11', label: 'Wednesday, Nov 11', count: 1 },
      { dateKey: '2026-11-10', label: 'Tuesday, Nov 10', count: 1 },
    ]);
  });
});

