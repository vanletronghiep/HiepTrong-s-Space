// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationKeys, useSetNotificationRead } from '@/client/queries/notifications';
import {
  taskKeys,
  useCompleteTask,
  useDeleteTask,
  useTransferTask,
  useUncompleteTask,
  useUpdateTask,
} from '@/client/queries/tasks';
import type { NotificationListResponse, TaskDto } from '@/contracts';

function makeTaskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: overrides.id ?? '11111111-1111-4111-8111-111111111111',
    title: overrides.title ?? 'Task one',
    description: overrides.description ?? '',
    priority: overrides.priority ?? 'normal',
    pinned: overrides.pinned ?? false,
    deadlineAt: overrides.deadlineAt ?? '2026-11-06T12:00:00.000Z',
    scheduledDate: overrides.scheduledDate === undefined ? '2026-11-06' : overrides.scheduledDate,
    status: overrides.status ?? 'active',
    completedAt: overrides.completedAt ?? null,
    reminderAt:
      overrides.reminderAt === undefined ? '2026-11-06T09:00:00.000Z' : overrides.reminderAt,
    createdAt: overrides.createdAt ?? '2026-11-05T03:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-11-05T03:00:00.000Z',
    isOverdue: overrides.isOverdue ?? false,
    isDueSoon: overrides.isDueSoon ?? false,
    timeLeftMs: overrides.timeLeftMs ?? 3600_000,
  };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('client/queries optimistic cache behavior (S01, D04)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T10:00:00.000Z'));
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('recomputes reminderAt, isDueSoon, and isOverdue during optimistic uncomplete, deadline update, and transfer', async () => {
    // Task due in 2 hours (12:00Z while now is 10:00Z -> reminderAt should be 11:30Z, or if due in 20m -> reminderAt 5m before)
    // Let's test a completed task whose deadline is at 10:20Z (20m from now -> reminderAt = 10:15Z; if deadline is 10:10Z and created earlier -> let's check computeReminderAt(12:00Z, 10:00Z) = 11:30Z)
    const completedTask = makeTaskDto({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'completed',
      completedAt: '2026-11-06T09:30:00.000Z',
      deadlineAt: '2026-11-06T12:00:00.000Z',
      reminderAt: null,
      isDueSoon: false,
      isOverdue: false,
    });

    queryClient.setQueryData<TaskDto[]>(taskKeys.list(), [completedTask]);

    let resolveFetch!: (res: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result: uncompleteHook } = renderHook(() => useUncompleteTask(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      uncompleteHook.current.mutate(completedTask.id);
    });

    // Wait microtask for onMutate
    await act(async () => {
      await Promise.resolve();
    });

    const optimisticAfterUncomplete = queryClient.getQueryData<TaskDto[]>(taskKeys.list())?.[0];
    expect(optimisticAfterUncomplete?.status).toBe('active');
    // 2h remaining from 10:00Z to 12:00Z -> reminderAt must be recomputed to 11:30Z (not left null!)
    expect(optimisticAfterUncomplete?.reminderAt).toBe('2026-11-06T11:30:00.000Z');

    // Clean up in-flight mutation
    await act(async () => {
      resolveFetch(
        new Response(JSON.stringify({ item: optimisticAfterUncomplete }), { status: 200 }),
      );
    });

    // Now test optimistic updateTask changing deadlineAt to 24h in future (2026-11-07T10:00:00.000Z -> reminderAt = 2026-11-06T10:00:00.000Z -> isDueSoon = true!)
    const { result: updateHook } = renderHook(() => useUpdateTask(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      updateHook.current.mutate({
        id: completedTask.id,
        input: { deadlineAt: '2026-11-07T10:00:00.000Z' },
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    const optimisticAfterUpdate = queryClient.getQueryData<TaskDto[]>(taskKeys.list())?.[0];
    expect(optimisticAfterUpdate?.reminderAt).toBe('2026-11-06T10:00:00.000Z');
    expect(optimisticAfterUpdate?.isDueSoon).toBe(true);

    await act(async () => {
      resolveFetch(new Response(JSON.stringify({ item: optimisticAfterUpdate }), { status: 200 }));
    });

    // Now test optimistic transferTask recomputing reminderAt
    const { result: transferHook } = renderHook(() => useTransferTask(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      transferHook.current.mutate({
        id: completedTask.id,
        input: {
          scheduledDate: '2026-11-08',
          deadlineAt: '2026-11-08T10:00:00.000Z',
        },
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    const optimisticAfterTransfer = queryClient.getQueryData<TaskDto[]>(taskKeys.list())?.[0];
    expect(optimisticAfterTransfer?.scheduledDate).toBe('2026-11-08');
    expect(optimisticAfterTransfer?.reminderAt).toBe('2026-11-07T10:00:00.000Z');
    expect(optimisticAfterTransfer?.isDueSoon).toBe(false);

    await act(async () => {
      resolveFetch(
        new Response(JSON.stringify({ item: optimisticAfterTransfer }), { status: 200 }),
      );
    });
  });

  it('does not clobber a concurrent successful task mutation when an earlier overlapping mutation fails and rolls back', async () => {
    const taskA = makeTaskDto({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Task A',
      status: 'active',
    });
    const taskB = makeTaskDto({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Task B',
      status: 'active',
    });

    queryClient.setQueryData<TaskDto[]>(taskKeys.list(), [taskA, taskB]);

    const pendingRequests = new Map<string, (res: Response) => void>();
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      return new Promise<Response>((resolve) => {
        pendingRequests.set(url, resolve);
      });
    });

    const { result: completeHook } = renderHook(() => useCompleteTask(), {
      wrapper: createWrapper(queryClient),
    });
    const { result: deleteHook } = renderHook(() => useDeleteTask(), {
      wrapper: createWrapper(queryClient),
    });

    // Start mutation 1 (complete Task A) and mutation 2 (delete Task B) concurrently
    act(() => {
      completeHook.current.mutate(taskA.id);
      deleteHook.current.mutate(taskB.id);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Mutation 2 (delete Task B) starts AFTER Mutation 1's optimistic update.
    // Now Mutation 1 (complete Task A) succeeds, and THEN Mutation 2 (delete Task B) fails!
    const completedTaskA: TaskDto = {
      ...taskA,
      status: 'completed',
      completedAt: '2026-11-06T10:00:00.000Z',
      reminderAt: null,
    };

    // Wait: what if Mutation 1 (started first, snapshotted [taskA_active, taskB_active]) FAILS
    // AFTER Mutation 2 (or an update on Task B) SUCCEEDS?
    // Let's test that exact case: Mutation 1 (on taskA) fails after Mutation 2 (on taskB) succeeds!
    await act(async () => {
      pendingRequests.get(`/api/tasks/${taskB.id}`)?.(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    });

    // Now fail Mutation 1 (which took its snapshot when taskB was still present!)
    await act(async () => {
      pendingRequests.get(`/api/tasks/${taskA.id}/complete`)?.(
        new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed' } }), {
          status: 500,
        }),
      );
    });

    const cachedAfterRollback = queryClient.getQueryData<TaskDto[]>(taskKeys.list()) ?? [];
    // Task A must be rolled back to 'active', while Task B must remain deleted (NOT resurrected from Mutation 1's old whole-list snapshot!)
    expect(cachedAfterRollback.map((t) => ({ id: t.id, status: t.status }))).toEqual([
      { id: taskA.id, status: 'active' },
    ]);
    void completedTaskA;
  });

  it('rolls back only the failed notification read toggle when concurrent notification mutations overlap', async () => {
    const initialList: NotificationListResponse = {
      items: [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          kind: 'due_soon',
          tagLabel: 'Due soon',
          title: 'Due soon',
          message: 'Task A is due soon',
          isRead: false,
          createdAt: '2026-11-06T09:00:00.000Z',
          timeLeftMs: 3600_000,
          taskId: '11111111-1111-4111-8111-111111111111',
          targetUrl: '/tasks/hub',
        },
        {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          kind: 'overdue',
          tagLabel: 'Overdue',
          title: 'Overdue',
          message: 'Task B is overdue',
          isRead: false,
          createdAt: '2026-11-06T08:00:00.000Z',
          timeLeftMs: -1000,
          taskId: '22222222-2222-4222-8222-222222222222',
          targetUrl: '/tasks/hub',
        },
      ],
      unreadCount: 2,
    };

    queryClient.setQueryData<NotificationListResponse>(notificationKeys.list(), initialList);

    const pendingRequests = new Map<string, (res: Response) => void>();
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input.toString();
      return new Promise<Response>((resolve) => {
        pendingRequests.set(url, resolve);
      });
    });

    const { result } = renderHook(() => useSetNotificationRead(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ id: initialList.items[0]!.id, isRead: true });
      result.current.mutate({ id: initialList.items[1]!.id, isRead: true });
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Second notification read succeeds
    await act(async () => {
      pendingRequests.get(`/api/notifications/${initialList.items[1]!.id}/read`)?.(
        new Response(JSON.stringify({ item: { ...initialList.items[1], isRead: true } }), {
          status: 200,
        }),
      );
    });

    // First notification read fails -> must only roll back item[0] to isRead: false, keeping item[1] isRead: true
    await act(async () => {
      pendingRequests.get(`/api/notifications/${initialList.items[0]!.id}/read`)?.(
        new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed' } }), {
          status: 500,
        }),
      );
    });

    const cached = queryClient.getQueryData<NotificationListResponse>(notificationKeys.list());
    expect(cached?.items.map((n) => ({ id: n.id, isRead: n.isRead }))).toEqual([
      { id: initialList.items[0]!.id, isRead: false },
      { id: initialList.items[1]!.id, isRead: true },
    ]);
    expect(cached?.unreadCount).toBe(1);
  });
});
