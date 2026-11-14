// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LearningRoomView } from '@/features/learning-room/LearningRoomView';
const mocks = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('@/client/queries/learning-room', () => ({
  useLearningRoomData: () => ({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() }),
  useCreateLearningSession: () => ({ mutateAsync: mocks.save, isPending: false, isError: false }),
}));
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-10T05:00:00Z')); mocks.save.mockReset().mockResolvedValue({ id: 'session' }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('focus session accounting', () => {
  it('records real focus/pause durations and persists when notes are skipped', async () => {
    render(<LearningRoomView />);
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    act(() => vi.advanceTimersByTime(65000));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => vi.advanceTimersByTime(30000));
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    act(() => vi.advanceTimersByTime(5000));
    fireEvent.click(screen.getByRole('button', { name: 'Log & finish' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Skip notes' })); });
    const input = mocks.save.mock.calls[0]?.[0];
    expect(input.focusMinutes).toBeCloseTo(70 / 60);
    expect(input.pausedMinutes).toBe(0.5);
    expect(input.breakMinutes).toBe(0);
    expect(input.durationMinutes).toBeCloseTo(100 / 60);
    expect(Date.parse(input.completedAt) - Date.parse(input.startedAt)).toBe(100000);
  });
  it('keeps reflection input on failure and prevents duplicate in-flight saves', async () => {
    let rejectSave!: (reason: Error) => void;
    mocks.save.mockImplementation(() => new Promise((_resolve, reject) => { rejectSave = reject; }));
    render(<LearningRoomView />);
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.click(screen.getByRole('button', { name: 'Log & finish' }));
    fireEvent.change(screen.getByLabelText(/Key insights or notes/), { target: { value: 'Keep this reflection' } });
    fireEvent.click(screen.getByRole('button', { name: 'Skip notes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip notes' }));
    expect(mocks.save).toHaveBeenCalledTimes(1);
    await act(async () => { rejectSave(new Error('Offline')); });
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((screen.getByLabelText(/Key insights or notes/) as HTMLTextAreaElement).value).toBe('Keep this reflection');
  });

  it('runs and records the actual five-minute break after focus', async () => {
    render(<LearningRoomView />);
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    act(() => vi.advanceTimersByTime(25 * 60000));
    expect(screen.getByText('Rest & recharge')).toBeTruthy();
    act(() => vi.advanceTimersByTime(5 * 60000));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Skip notes' })); });
    expect(mocks.save.mock.calls[0]?.[0]).toMatchObject({ focusMinutes: 25, breakMinutes: 5, pausedMinutes: 0, durationMinutes: 30 });
  });
});
