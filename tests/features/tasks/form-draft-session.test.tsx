// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { TaskForm, type TaskFormProps } from '@/features/tasks/shared/TaskForm';
import {
  ScheduleDateDialog,
  TransferDialog,
  type ScheduleDateDialogProps,
  type TransferDialogProps,
} from '@/features/tasks/shared/TransferDialog';

afterEach(() => {
  cleanup();
});

const T0 = new Date('2026-11-06T03:00:00.000Z');
const T1 = new Date('2026-11-06T03:01:00.000Z');
// 23:59 -> 00:00 in Asia/Saigon (UTC+07:00)
const BEFORE_MIDNIGHT = new Date('2026-11-06T16:59:00.000Z');
const AFTER_MIDNIGHT = new Date('2026-11-06T17:00:00.000Z');

function makeTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: overrides.id ?? '11111111-1111-4111-8111-111111111111',
    title: overrides.title ?? 'Original title',
    description: overrides.description ?? '',
    priority: overrides.priority ?? 'normal',
    pinned: overrides.pinned ?? false,
    deadlineAt: overrides.deadlineAt ?? '2026-11-10T16:59:00.000Z',
    scheduledDate: overrides.scheduledDate === undefined ? '2026-11-05' : overrides.scheduledDate,
    status: overrides.status ?? 'active',
    completedAt: overrides.completedAt ?? null,
    reminderAt: overrides.reminderAt ?? null,
    createdAt: overrides.createdAt ?? '2026-11-01T01:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-11-01T01:00:00.000Z',
    isOverdue: overrides.isOverdue ?? false,
    isDueSoon: overrides.isDueSoon ?? false,
    timeLeftMs: overrides.timeLeftMs ?? 1,
  };
}

function formProps(overrides: Partial<TaskFormProps> = {}): TaskFormProps {
  return {
    open: true,
    mode: 'edit',
    initialTask: makeTask(),
    now: T0,
    onClose: () => {},
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    ...overrides,
  };
}

describe('TaskForm draft session (C01)', () => {
  it('keeps typed edit fields and rich-note edits across a minute tick and a refreshed task object', async () => {
    const props = formProps({
      initialTask: makeTask({ description: 'Original notes' }),
    });
    const { rerender } = render(<TaskForm {...props} />);

    // Allow RichNoteEditor's post-create microtask guard to settle before formatting actions
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Draft title' } });
    fireEvent.change(screen.getByLabelText(/Deadline time/i), { target: { value: '15:15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bullet list' }));

    const descBox = screen.getByRole('textbox', { name: 'Description' });
    expect(descBox.querySelector('ul')).not.toBeNull();

    rerender(<TaskForm {...props} now={T1} />);
    rerender(
      <TaskForm
        {...props}
        now={T1}
        initialTask={makeTask({ description: 'Remote notes', updatedAt: T1.toISOString() })}
      />,
    );

    expect(screen.getByLabelText('Title')).toHaveValue('Draft title');
    expect(screen.getByLabelText(/Deadline time/i)).toHaveValue('15:15');
    expect(screen.getByRole('textbox', { name: 'Description' }).querySelector('ul')).not.toBeNull();
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveTextContent('Original notes');
  });

  it('preserves untouched rich or legacy description verbatim when editing only the title', async () => {
    const legacyDescription = '# Untouched heading\n*literal marker*';
    const onUpdate = vi.fn().mockResolvedValue(makeTask());
    const props = formProps({
      initialTask: makeTask({ description: legacyDescription }),
      onUpdate,
    });

    render(<TaskForm {...props} />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Edited title only' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate.mock.calls[0]?.[1]?.description).toBe(legacyDescription);
  });

  it('keeps typed create fields across the midnight tick', () => {
    const props = formProps({
      mode: 'create',
      initialTask: null,
      defaultScheduledDate: '2026-11-07',
      now: BEFORE_MIDNIGHT,
    });
    const { rerender } = render(<TaskForm {...props} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Late idea' } });
    fireEvent.change(screen.getByLabelText(/Deadline date/i), { target: { value: '09/11' } });

    rerender(<TaskForm {...props} now={AFTER_MIDNIGHT} />);

    expect(screen.getByLabelText('Title')).toHaveValue('Late idea');
    expect(screen.getByLabelText(/Deadline date/i)).toHaveValue('09/11');
  });

  it('keeps validation errors when only the clock changes', async () => {
    const props = formProps({ mode: 'create', initialTask: null, defaultScheduledDate: null });
    const { rerender } = render(<TaskForm {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter a task title.')).toBeInTheDocument();

    rerender(<TaskForm {...props} now={T1} />);
    expect(screen.getByText('Enter a task title.')).toBeInTheDocument();
  });

  it('reinitializes from the current task after closing and reopening', () => {
    const props = formProps();
    const { rerender } = render(<TaskForm {...props} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Abandoned draft' } });
    rerender(<TaskForm {...props} open={false} />);
    rerender(<TaskForm {...props} initialTask={makeTask({ title: 'Saved elsewhere' })} />);

    expect(screen.getByLabelText('Title')).toHaveValue('Saved elsewhere');
  });

  it('initializes the new task when the edited task is switched, and submits its id', async () => {
    const onUpdate = vi.fn().mockResolvedValue(makeTask());
    const props = formProps({ onUpdate });
    const { rerender } = render(<TaskForm {...props} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Draft for first' } });
    const second = makeTask({ id: '22222222-2222-4222-8222-222222222222', title: 'Second task' });
    rerender(<TaskForm {...props} initialTask={second} />);

    expect(screen.getByLabelText('Title')).toHaveValue('Second task');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate.mock.calls[0]?.[0]).toBe(second.id);
  });
});

describe('TransferDialog draft session (C01)', () => {
  function transferProps(overrides: Partial<TransferDialogProps> = {}): TransferDialogProps {
    return {
      task: makeTask({ isOverdue: true }),
      open: true,
      onClose: () => {},
      onSubmitTransfer: vi.fn(),
      now: T0,
      ...overrides,
    };
  }

  it('keeps the typed date and time across a minute tick and a refreshed task object', () => {
    const props = transferProps();
    const { rerender } = render(<TransferDialog {...props} />);

    fireEvent.change(screen.getByLabelText(/New date/i), { target: { value: '20/11' } });
    fireEvent.change(screen.getByLabelText(/New time/i), { target: { value: '15:15' } });

    rerender(<TransferDialog {...props} now={T1} task={makeTask({ isOverdue: true })} />);

    expect(screen.getByLabelText(/New date/i)).toHaveValue('20/11');
    expect(screen.getByLabelText(/New time/i)).toHaveValue('15:15');
  });

  it('reinitializes after closing and reopening', () => {
    const props = transferProps();
    const { rerender } = render(<TransferDialog {...props} />);

    fireEvent.change(screen.getByLabelText(/New time/i), { target: { value: '15:15' } });
    rerender(<TransferDialog {...props} open={false} task={null} />);
    rerender(<TransferDialog {...props} />);

    expect(screen.getByLabelText(/New time/i)).toHaveValue('23:59');
  });
});

describe('ScheduleDateDialog draft session (C01)', () => {
  function scheduleProps(
    overrides: Partial<ScheduleDateDialogProps> = {},
  ): ScheduleDateDialogProps {
    return {
      task: makeTask(),
      open: true,
      onClose: () => {},
      onSelectDate: vi.fn(),
      now: T0,
      ...overrides,
    };
  }

  it('keeps the typed day across a minute tick and a refreshed task object', () => {
    const props = scheduleProps();
    const { rerender } = render(<ScheduleDateDialog {...props} />);

    fireEvent.change(screen.getByLabelText(/Day \(DD\/MM\)/i), {
      target: { value: '20/11/2026' },
    });
    rerender(<ScheduleDateDialog {...props} now={T1} task={makeTask()} />);

    expect(screen.getByLabelText(/Day \(DD\/MM\)/i)).toHaveValue('20/11/2026');
  });

  it('initializes from a different task when the target is switched', () => {
    const props = scheduleProps();
    const { rerender } = render(<ScheduleDateDialog {...props} />);

    fireEvent.change(screen.getByLabelText(/Day \(DD\/MM\)/i), { target: { value: '20/11' } });
    rerender(
      <ScheduleDateDialog
        {...props}
        task={makeTask({ id: '33333333-3333-4333-8333-333333333333', scheduledDate: '2026-11-12' })}
      />,
    );

    expect(screen.getByLabelText(/Day \(DD\/MM\)/i)).toHaveValue('12/11');
  });
});
