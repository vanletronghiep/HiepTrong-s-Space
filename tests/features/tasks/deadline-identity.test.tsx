// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import {
  buildDeadlineFromInputs,
  extractZonedDateAndTime,
  resolveDateInput,
} from '@/domain/date-input';
import { TaskForm } from '@/features/tasks/TaskForm';
import { ScheduleDateDialog, TransferDialog } from '@/features/tasks/TransferDialog';

afterEach(() => {
  cleanup();
});

const NOW = new Date('2026-11-06T03:00:00.000Z'); // 2026-11-06 10:00 Asia/Saigon

function makeTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: overrides.id ?? '11111111-1111-4111-8111-111111111111',
    title: overrides.title ?? 'Original task',
    description: overrides.description ?? 'Notes',
    priority: overrides.priority ?? 'normal',
    pinned: overrides.pinned ?? false,
    deadlineAt: overrides.deadlineAt ?? '2026-11-05T16:59:12.123Z', // 2026-11-05 23:59:12.123 ICT
    scheduledDate: overrides.scheduledDate === undefined ? '2026-11-05' : overrides.scheduledDate,
    status: overrides.status ?? 'active',
    completedAt: overrides.completedAt ?? null,
    reminderAt: overrides.reminderAt ?? null,
    createdAt: overrides.createdAt ?? '2026-11-01T01:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-11-01T01:00:00.000Z',
    isOverdue: overrides.isOverdue ?? true,
    isDueSoon: overrides.isDueSoon ?? false,
    timeLeftMs: overrides.timeLeftMs ?? -10_000,
  };
}

describe('Deadline identity and canonical date resolution (C02)', () => {
  it('preserves exact deadlineAt (including seconds and ms) when editing only the title on a same-year past deadline', async () => {
    const task = makeTask({ deadlineAt: '2026-11-05T16:59:12.123Z' });
    const onUpdate = vi.fn().mockResolvedValue(task);

    render(
      <TaskForm
        open
        mode="edit"
        initialTask={task}
        now={NOW}
        onClose={() => {}}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByText(/Resolves to Thursday, 05 Nov 2026/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Renamed only' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    const [calledId, payload] = onUpdate.mock.calls[0]!;
    expect(calledId).toBe(task.id);
    expect(payload.title).toBe('Renamed only');
    if (payload.deadlineAt !== undefined) {
      expect(payload.deadlineAt).toBe('2026-11-05T16:59:12.123Z');
    }
  });

  it('keeps the same-year past date when only the deadline time is edited', async () => {
    const task = makeTask({ deadlineAt: '2026-11-05T16:59:12.123Z' });
    const onUpdate = vi.fn().mockResolvedValue(task);

    render(
      <TaskForm
        open
        mode="edit"
        initialTask={task}
        now={NOW}
        onClose={() => {}}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Deadline time/i), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    const [, payload] = onUpdate.mock.calls[0]!;
    // 2026-11-05 18:00 Asia/Saigon = 2026-11-05T11:00:00.000Z (not 2027!)
    expect(payload.deadlineAt).toBe('2026-11-05T11:00:00.000Z');
  });

  it('keeps an explicit past date entered as ISO in DatePickerField during edit', async () => {
    const task = makeTask({ deadlineAt: '2026-11-10T16:59:00.000Z' });
    const onUpdate = vi.fn().mockResolvedValue(task);

    render(
      <TaskForm
        open
        mode="edit"
        initialTask={task}
        now={NOW}
        onClose={() => {}}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    );

    const dateField = screen.getByLabelText(/Deadline date/i);
    fireEvent.change(dateField, { target: { value: '2026-10-15' } });

    expect(dateField).toHaveValue('2026-10-15');
    expect(screen.getByText(/Resolves to Thursday, 15 Oct 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    const [, payload] = onUpdate.mock.calls[0]!;
    expect(payload.deadlineAt).toBe('2026-10-15T16:59:00.000Z');
  });

  it('rolls a manually typed yearless past DD/MM into the next year while allowing explicit past DD/MM/YYYY in edit mode', async () => {
    const task = makeTask({ deadlineAt: '2026-11-10T16:59:00.000Z' });
    const onUpdate = vi.fn().mockResolvedValue(task);

    render(
      <TaskForm
        open
        mode="edit"
        initialTask={task}
        now={NOW}
        onClose={() => {}}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    );

    // Manual yearless entry -> next occurrence (2027)
    fireEvent.change(screen.getByLabelText(/Deadline date/i), { target: { value: '05/11' } });
    expect(screen.getByText(/Resolves to Friday, 05 Nov 2027/i)).toBeInTheDocument();

    // Explicit past year -> stays in 2026
    fireEvent.change(screen.getByLabelText(/Deadline date/i), { target: { value: '05/11/2026' } });
    expect(screen.getByText(/Resolves to Thursday, 05 Nov 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate.mock.calls[0]?.[1]?.deadlineAt).toBe('2026-11-05T16:59:00.000Z');
  });

  it('rejects non-future deadlines in create and transfer, including same-minute boundary', async () => {
    // 2026-11-06 10:00:30 ICT -> same minute as 10:00, so 10:00:00.000 is already in the past
    const sameMinuteNow = new Date('2026-11-06T03:00:30.000Z');
    const onCreate = vi.fn();
    const onTransfer = vi.fn();

    render(
      <TaskForm
        open
        mode="create"
        defaultScheduledDate="2026-11-06"
        now={sameMinuteNow}
        onClose={() => {}}
        onCreate={onCreate}
        onUpdate={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Boundary test' } });
    fireEvent.change(screen.getByLabelText(/Deadline time/i), { target: { value: '10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('New tasks must have a deadline in the future.'),
    ).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();

    cleanup();

    render(
      <TransferDialog
        open
        task={makeTask()}
        now={sameMinuteNow}
        onClose={() => {}}
        onSubmitTransfer={onTransfer}
      />,
    );

    fireEvent.change(screen.getByLabelText(/New date/i), { target: { value: '06/11/2026' } });
    fireEvent.change(screen.getByLabelText(/New time/i), { target: { value: '10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }));

    expect(await screen.findByText('New deadline must be in the future.')).toBeInTheDocument();
    expect(onTransfer).not.toHaveBeenCalled();
  });

  it('preserves same-year past scheduledDate in ScheduleDateDialog without rolling to next year', async () => {
    const task = makeTask({
      scheduledDate: '2026-11-05',
      deadlineAt: '2026-11-10T16:59:12.123Z',
    });
    const onSelectDate = vi.fn().mockResolvedValue(undefined);

    render(
      <ScheduleDateDialog
        open
        task={task}
        now={NOW}
        onClose={() => {}}
        onSelectDate={onSelectDate}
      />,
    );

    expect(screen.getByText(/Resolves to Thursday, 05 Nov 2026/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onSelectDate).toHaveBeenCalledWith(task.id, '2026-11-05'));
  });

  it('handles cross-year, leap-day, and timezone boundaries in domain helpers', () => {
    // Leap day shorthand from 2026 resolves to 2028-02-29
    const leap = resolveDateInput('29/02', NOW, 'Asia/Saigon');
    expect(leap?.scheduledDate).toBe('2028-02-29');
    expect(leap?.displayInput).toBe('29/02/2028');

    // Explicit past leap year
    const pastLeap = resolveDateInput('29/02/2024', NOW, 'Asia/Saigon');
    expect(pastLeap?.scheduledDate).toBe('2024-02-29');

    // Invalid non-leap year 29/02/2026
    expect(resolveDateInput('29/02/2026', NOW, 'Asia/Saigon')).toBeNull();

    // Timezone boundary: 2026-12-31T20:00:00.000Z is 2027-01-01 03:00 in Asia/Saigon,
    // but still 2026-12-31 15:00 in America/New_York
    const nyExtracted = extractZonedDateAndTime(
      '2026-12-31T20:00:45.678Z',
      new Date('2026-12-31T21:00:00.000Z'),
      'America/New_York',
    );
    expect(nyExtracted).toEqual({
      dateInput: '31/12',
      scheduledDate: '2026-12-31',
      timeHm: '15:00',
    });

    const builtUnchanged = buildDeadlineFromInputs({
      dateInput: nyExtracted.dateInput,
      timeInput: nyExtracted.timeHm,
      referenceNow: new Date('2027-01-02T12:00:00.000Z'),
      timeZone: 'America/New_York',
      canonicalDate: nyExtracted.scheduledDate,
      existingDeadlineAt: '2026-12-31T20:00:45.678Z',
    });
    expect(builtUnchanged).toEqual({
      ok: true,
      scheduledDate: '2026-12-31',
      deadlineAt: '2026-12-31T20:00:45.678Z',
    });
  });
});
