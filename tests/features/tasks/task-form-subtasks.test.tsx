// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { TaskForm } from '@/features/tasks/shared/TaskForm';

afterEach(cleanup);

const NOW = new Date('2026-11-06T03:00:00.000Z');

function makeTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Parent task',
    description: '',
    priority: 'normal',
    pinned: false,
    deadlineAt: '2026-11-10T16:59:00.000Z',
    scheduledDate: '2026-11-05',
    status: 'active',
    completedAt: null,
    reminderAt: null,
    createdAt: '2026-11-01T01:00:00.000Z',
    updatedAt: '2026-11-01T01:00:00.000Z',
    isOverdue: false,
    isDueSoon: false,
    timeLeftMs: 1,
    subtasks: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Existing step',
        priority: 'optional',
        done: false,
        createdAt: '2026-11-01T01:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('TaskForm subtasks', () => {
  it('shows the subtask list under the description and saves added subtasks with the task', async () => {
    const onUpdate = vi.fn().mockResolvedValue(makeTask());
    render(
      <TaskForm
        open
        mode="edit"
        initialTask={makeTask()}
        now={NOW}
        onClose={() => {}}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByText('Existing step')).toBeInTheDocument();

    const input = screen.getByLabelText('New subtask');
    fireEvent.change(input, { target: { value: 'Second step' } });
    // Enter adds the subtask and must not submit the task form.
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Second step')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    const payload = onUpdate.mock.calls[0]![1];
    expect(payload.subtasks.map((item: { title: string }) => item.title).sort()).toEqual([
      'Existing step',
      'Second step',
    ]);
  });
});
