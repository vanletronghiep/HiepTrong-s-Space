'use client';

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type {
  CreateTaskInput,
  TaskDto,
  TaskQuery,
  TransferTaskInput,
  UpdateTaskInput,
} from '@/contracts';
import { computeReminderAt } from '@/domain/reminder';
import { sortTasks } from '@/domain/task-sort';
import { toTaskDto } from '@/domain/task-status';
import { apiRequest } from '../api-client';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (params?: TaskQuery) => ['tasks', 'list', params ?? {}] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
};

function buildTasksQueryString(params?: TaskQuery): string {
  if (!params) {
    return '';
  }
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.priority) sp.set('priority', params.priority);
  if (params.scheduledDate !== undefined) {
    sp.set('scheduledDate', params.scheduledDate === null ? 'null' : params.scheduledDate);
  }
  if (params.scheduledFrom) sp.set('scheduledFrom', params.scheduledFrom);
  if (params.scheduledTo) sp.set('scheduledTo', params.scheduledTo);
  if (params.deadlineFrom) sp.set('deadlineFrom', params.deadlineFrom);
  if (params.deadlineTo) sp.set('deadlineTo', params.deadlineTo);
  if (params.search) sp.set('search', params.search);
  const str = sp.toString();
  return str ? `?${str}` : '';
}

export function useTasks(params?: TaskQuery) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const res = await apiRequest<{ items: TaskDto[] }>(
        `/api/tasks${buildTasksQueryString(params)}`,
      );
      return res.items;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

type TaskItemSnapshot = Array<[QueryKey, TaskDto | undefined]>;

function snapshotAndTransformTaskItem(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  transform: (item: TaskDto) => TaskDto | null,
): TaskItemSnapshot {
  const queries = queryClient.getQueriesData<TaskDto[]>({ queryKey: taskKeys.all });
  const itemSnapshots: TaskItemSnapshot = [];

  for (const [key, data] of queries) {
    if (!Array.isArray(data)) {
      continue;
    }
    const existingItem = data.find((item) => item.id === taskId);
    itemSnapshots.push([key, existingItem]);

    if (!existingItem) {
      continue;
    }

    const nextItem = transform(existingItem);
    const nextList =
      nextItem === null
        ? data.filter((item) => item.id !== taskId)
        : data.map((item) => (item.id === taskId ? nextItem : item));

    queryClient.setQueryData<TaskDto[]>(key, sortTasks(nextList));
  }

  return itemSnapshots;
}

function restoreTaskItemSnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  snapshots: TaskItemSnapshot | undefined,
): void {
  if (!snapshots) {
    return;
  }
  for (const [key, previousItem] of snapshots) {
    const currentList = queryClient.getQueryData<TaskDto[]>(key);
    if (!Array.isArray(currentList)) {
      continue;
    }

    if (previousItem === undefined) {
      queryClient.setQueryData<TaskDto[]>(
        key,
        currentList.filter((item) => item.id !== taskId),
      );
      continue;
    }

    const existsInCurrent = currentList.some((item) => item.id === taskId);
    const restoredList = existsInCurrent
      ? currentList.map((item) => (item.id === taskId ? previousItem : item))
      : [...currentList, previousItem];

    queryClient.setQueryData<TaskDto[]>(key, sortTasks(restoredList));
  }
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await apiRequest<{ item: TaskDto }>('/api/tasks', {
        method: 'POST',
        body: input,
      });
      return res.item;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      const res = await apiRequest<{ item: TaskDto }>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: input,
      });
      return res.item;
    },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const now = new Date();
      const snapshots = snapshotAndTransformTaskItem(queryClient, id, (item) => {
        const nextDeadlineAt = input.deadlineAt ?? item.deadlineAt;
        const deadlineChanged =
          input.deadlineAt !== undefined && input.deadlineAt !== item.deadlineAt;
        const nextReminderAt = deadlineChanged
          ? item.status === 'completed'
            ? null
            : computeReminderAt(nextDeadlineAt, now)
          : item.reminderAt;

        return toTaskDto(
          {
            ...item,
            ...input,
            deadlineAt: nextDeadlineAt,
            reminderAt: nextReminderAt,
            updatedAt: now.toISOString(),
          },
          now,
        );
      });
      return { snapshots };
    },
    onError: (_err, vars, ctx) => {
      restoreTaskItemSnapshot(queryClient, vars.id, ctx?.snapshots);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest<{ item: TaskDto }>(`/api/tasks/${id}/complete`, {
        method: 'POST',
      });
      return res.item;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const now = new Date();
      const nowIso = now.toISOString();
      const snapshots = snapshotAndTransformTaskItem(queryClient, id, (item) =>
        toTaskDto(
          {
            ...item,
            status: 'completed',
            completedAt: nowIso,
            reminderAt: null,
            updatedAt: nowIso,
          },
          now,
        ),
      );
      return { snapshots };
    },
    onError: (_err, id, ctx) => {
      restoreTaskItemSnapshot(queryClient, id, ctx?.snapshots);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUncompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest<{ item: TaskDto }>(`/api/tasks/${id}/uncomplete`, {
        method: 'POST',
      });
      return res.item;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const now = new Date();
      const nowIso = now.toISOString();
      const snapshots = snapshotAndTransformTaskItem(queryClient, id, (item) =>
        toTaskDto(
          {
            ...item,
            status: 'active',
            completedAt: null,
            reminderAt: computeReminderAt(item.deadlineAt, now),
            updatedAt: nowIso,
          },
          now,
        ),
      );
      return { snapshots };
    },
    onError: (_err, id, ctx) => {
      restoreTaskItemSnapshot(queryClient, id, ctx?.snapshots);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useTransferTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TransferTaskInput }) => {
      const res = await apiRequest<{ item: TaskDto }>(`/api/tasks/${id}/transfer`, {
        method: 'POST',
        body: input,
      });
      return res.item;
    },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const now = new Date();
      const nowIso = now.toISOString();
      const snapshots = snapshotAndTransformTaskItem(queryClient, id, (item) =>
        toTaskDto(
          {
            ...item,
            scheduledDate: input.scheduledDate,
            deadlineAt: input.deadlineAt,
            reminderAt:
              item.status === 'completed' ? null : computeReminderAt(input.deadlineAt, now),
            updatedAt: nowIso,
          },
          now,
        ),
      );
      return { snapshots };
    },
    onError: (_err, vars, ctx) => {
      restoreTaskItemSnapshot(queryClient, vars.id, ctx?.snapshots);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ ok: true }>(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshots = snapshotAndTransformTaskItem(queryClient, id, () => null);
      return { snapshots };
    },
    onError: (_err, id, ctx) => {
      restoreTaskItemSnapshot(queryClient, id, ctx?.snapshots);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
