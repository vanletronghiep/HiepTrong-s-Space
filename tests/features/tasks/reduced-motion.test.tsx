// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { DayCarousel } from '@/features/tasks/DayCarousel';
import { TaskCard } from '@/features/tasks/TaskCard';
import { TaskForm } from '@/features/tasks/TaskForm';

vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => true,
}));
afterEach(cleanup);

it('switches reduced-motion panels immediately while keeping inactive controls inert', () => {
  const { container } = render(
    <DayCarousel
      boards={[
        { key: 'yesterday', label: 'Yesterday', content: <button>Yesterday task</button> },
        { key: 'today', label: 'Today', content: <button>Today task</button> },
        { key: 'tomorrow', label: 'Tomorrow', content: <button>Tomorrow task</button> },
      ]}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }));
  const active = container.querySelector('[data-offset="0"]')!;
  expect(active).toHaveAttribute('data-day', 'tomorrow');
  expect(active.parentElement!.style.getPropertyValue('--carousel-position')).toBe('2');
  expect(screen.getByText('Today task').parentElement).toHaveAttribute('inert');
  expect(screen.getByRole('button', { name: 'Tomorrow task' })).toBeInTheDocument();
});

it('retains title error focus and reserved space with reduced motion enabled', async () => {
  render(
    <TaskForm
      open
      mode="create"
      now={new Date('2026-11-13T03:00:00Z')}
      onClose={() => {}}
      onCreate={vi.fn()}
      onUpdate={vi.fn()}
    />,
  );
  const message = document.getElementById('task-title-feedback');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('Enter a task title.')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();
  fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
    target: { value: 'Valid title' },
  });
  await waitFor(() => expect(screen.queryByText('Enter a task title.')).toBeNull());
  expect(document.getElementById('task-title-feedback')).toBe(message);
});

it('disables residual CSS transitions on TaskCard, TaskMenu trigger, and TaskForm switch when reduced motion is preferred', () => {
  const noop = () => {};
  const task: TaskDto = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Reduced motion task',
    description: '',
    priority: 'normal',
    pinned: false,
    deadlineAt: '2026-11-13T12:00:00.000Z',
    scheduledDate: '2026-11-13',
    status: 'active',
    completedAt: null,
    reminderAt: '2026-11-12T12:00:00.000Z',
    createdAt: '2026-11-12T12:00:00.000Z',
    updatedAt: '2026-11-12T12:00:00.000Z',
    isOverdue: false,
    isDueSoon: false,
    timeLeftMs: 3_600_000,
  };

  const { container } = render(
    <>
      <TaskCard
        task={task}
        now={new Date('2026-11-13T09:00:00.000Z')}
        context="daily"
        onToggleComplete={noop}
        onEdit={noop}
        onScheduleDate={noop}
        onOpenPickDate={noop}
        onOpenTransfer={noop}
        onRequestDelete={noop}
      />
      <TaskForm
        open
        mode="create"
        now={new Date('2026-11-13T09:00:00.000Z')}
        onClose={noop}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    </>,
  );

  const article = container.querySelector('article');
  const menuTrigger = screen.getByRole('button', { name: 'Actions for Reduced motion task' });
  const pinnedSwitch = screen.getByRole('switch');

  expect(article).toHaveClass('motion-reduce:transition-none', 'motion-reduce:duration-0');
  expect(menuTrigger).toHaveClass('motion-reduce:transition-none', 'motion-reduce:duration-0');
  expect(pinnedSwitch).toHaveClass('motion-reduce:transition-none', 'motion-reduce:duration-0');
});
