// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { setDailyViewPreference } from '@/client/preferences';
import { DailyBoard } from '@/features/tasks/DailyBoard';
import { DailySky } from '@/features/tasks/DailySky';
import { DayCarousel } from '@/features/tasks/DayCarousel';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

let mockedPathname = '/tasks/daily';
const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => mockedPathname,
}));

vi.mock('@/client/queries/tasks', () => {
  const noopMutation = () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  });

  return {
    useTasks: () => ({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useCreateTask: noopMutation,
    useUpdateTask: noopMutation,
    useCompleteTask: noopMutation,
    useUncompleteTask: noopMutation,
    useTransferTask: noopMutation,
    useDeleteTask: noopMutation,
  };
});

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
  mockedPathname = '/tasks/daily';
  pushMock.mockReset();
  replaceMock.mockReset();
  setDailyViewPreference('day');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.style.overflow = '';
  document.documentElement.removeAttribute('aria-busy');
});

function renderDays() {
  render(
    <DayCarousel
      boards={[
        { key: 'yesterday', label: 'Yesterday', content: <button>Yesterday task</button> },
        { key: 'today', label: 'Today', content: <button>Today task</button> },
        { key: 'tomorrow', label: 'Tomorrow', content: <button>Tomorrow task</button> },
      ]}
    />,
  );
}

it('moves the same boards between positions and exposes only valid controls', () => {
  renderDays();
  const today = screen.getByRole('button', { name: 'Today task' });
  const yesterday = screen.getByText('Yesterday task').parentElement!;
  const yesterdayBoard = yesterday.closest('[data-day]');
  const tomorrow = screen.getByText('Tomorrow task').parentElement!;
  const tomorrowBoard = tomorrow.closest('[data-day]');
  const todayBoard = today.closest('[data-day]');
  expect(yesterday).toHaveAttribute('inert');
  expect(tomorrow).toHaveAttribute('inert');

  const previous = screen.getByRole('button', { name: 'Show Yesterday' });
  previous.focus();
  fireEvent.click(previous);
  expect(yesterdayBoard).toHaveAttribute('data-offset', '0');
  expect(todayBoard).toHaveAttribute('data-offset', '1');
  expect(tomorrowBoard).toHaveAttribute('data-offset', '2');
  expect(screen.queryByRole('button', { name: 'Show Yesterday' })).toBeNull();
  expect(screen.getByRole('region', { name: 'Three-day task carousel' })).toHaveFocus();
  expect(yesterday).not.toHaveAttribute('inert');
  expect(today.parentElement).toHaveAttribute('inert');
  fireEvent.click(screen.getByRole('button', { name: 'Show Today' }));
  expect(screen.getByRole('button', { name: 'Today task' })).toBe(today);
  fireEvent.click(screen.getByRole('button', { name: 'Show Tomorrow' }));
  expect(tomorrowBoard).toHaveAttribute('data-offset', '0');
  expect(todayBoard).toHaveAttribute('data-offset', '-1');
  expect(yesterdayBoard).toHaveAttribute('data-offset', '-2');
  expect(screen.queryByRole('button', { name: 'Show Tomorrow' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show Today' }));
  expect(todayBoard).toHaveAttribute('data-offset', '0');
});

it('accepts arrows on the carousel but leaves task controls alone', () => {
  renderDays();
  const carousel = screen.getByRole('region', { name: 'Three-day task carousel' });
  fireEvent.keyDown(screen.getByRole('button', { name: 'Today task' }), { key: 'ArrowLeft' });
  expect(screen.getByRole('button', { name: 'Today task' })).toBeVisible();
  fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
  expect(screen.getByRole('button', { name: 'Yesterday task' })).toBeVisible();
  fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
  expect(screen.getByRole('button', { name: 'Yesterday task' })).toBeVisible();
  fireEvent.keyDown(carousel, { key: 'ArrowRight' });
  expect(screen.getByRole('button', { name: 'Today task' })).toBeVisible();
});

it('moves one day per horizontal wheel gesture and preserves vertical scrolling', () => {
  renderDays();
  const carousel = screen.getByRole('region', { name: 'Three-day task carousel' });
  expect(fireEvent.wheel(carousel, { deltaY: 120 })).toBe(true);
  expect(screen.getByRole('button', { name: 'Today task' })).toBeVisible();
  expect(fireEvent.wheel(carousel, { deltaY: 84, shiftKey: true })).toBe(false);
  expect(screen.getByRole('button', { name: 'Tomorrow task' })).toBeVisible();
  fireEvent.wheel(carousel, { deltaX: -140 });
  expect(screen.getByRole('button', { name: 'Tomorrow task' })).toBeVisible();
});

it('offers direct mobile selection without activating task content and moves focus out of inactive panels', () => {
  renderDays();
  const todayTask = screen.getByRole('button', { name: 'Today task' });
  todayTask.focus();
  fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }));
  expect(screen.getByRole('button', { name: 'Tomorrow' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('region', { name: 'Three-day task carousel' })).toHaveFocus();
  expect(todayTask.parentElement).toHaveAttribute('inert');
  expect(screen.getByRole('button', { name: 'Tomorrow task' }).parentElement).not.toHaveAttribute(
    'inert',
  );
});

it('cancels a drag without changing day and suppresses the synthetic click after dragging', () => {
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      readonly pointerId = 1;
      readonly isPrimary = true;
    },
  );
  renderDays();
  const board = screen.getByRole('button', { name: 'Today task' }).closest('[data-day]')!;
  const stage = board.parentElement!;
  stage.setPointerCapture = vi.fn();
  Object.defineProperty(board, 'offsetWidth', { value: 600 });
  fireEvent.pointerDown(stage, { button: 0, clientX: 500, clientY: 50 });
  fireEvent.pointerMove(stage, { clientX: 100, clientY: 51 });
  fireEvent.pointerCancel(stage, { clientX: 100, clientY: 51 });
  expect(board).toHaveAttribute('data-offset', '0');
  const preview = screen.getByRole('button', { name: 'Show Tomorrow' });
  fireEvent.click(preview, { detail: 1 });
  expect(board).toHaveAttribute('data-offset', '0');
  fireEvent.click(preview, { detail: 0 });
  expect(board).toHaveAttribute('data-offset', '-1');
});

it('handles rapid keyboard arrow switches cleanly and clears motion flag on settle', async () => {
  renderDays();
  const carousel = screen.getByRole('region', { name: 'Three-day task carousel' });
  const stage = screen
    .getByRole('button', { name: 'Today task' })
    .closest('[data-day]')!.parentElement!;

  fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
  fireEvent.keyDown(carousel, { key: 'ArrowRight' });
  fireEvent.keyDown(carousel, { key: 'ArrowRight' });
  fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
  fireEvent.keyDown(carousel, { key: 'ArrowLeft' });

  expect(stage).toHaveAttribute('data-moving', 'true');
  const yesterdayBoard = screen.getByText('Yesterday task').closest('[data-day]');
  expect(yesterdayBoard).toHaveAttribute('data-offset', '0');

  await waitFor(() => expect(stage).not.toHaveAttribute('data-moving'));
  expect(stage.style.getPropertyValue('--carousel-position')).toBe('0');
});

it.each(['day', 'week', 'month'] as const)('keeps the Daily %s content free of a standalone navigation button', (mode) => {
  setDailyViewPreference(mode);
  render(
    <ToastProvider>
      <DailyBoard />
    </ToastProvider>,
  );

  expect(screen.queryByRole('link', { name: 'Tasks Hub' })).not.toBeInTheDocument();
});

it('renders persisted Daily view mode immediately without day flash and prevents overlapping modePanel buildup on rapid toggles', async () => {
  setDailyViewPreference('week');
  const { container } = render(
    <ToastProvider>
      <DailyBoard />
    </ToastProvider>,
  );

  expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('group', { name: 'Week task summaries' })).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Three-day task carousel' })).toBeNull();
  expect(container.querySelectorAll('[class*="modePanel"]').length).toBe(1);

  cleanup();
  setDailyViewPreference('day');

  const second = render(
    <ToastProvider>
      <DailyBoard />
    </ToastProvider>,
  );

  expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('region', { name: 'Three-day task carousel' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('radio', { name: 'Week' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Month' }));

  expect(second.container.querySelectorAll('[class*="modePanel"]').length).toBeLessThanOrEqual(1);

  await waitFor(() => {
    expect(screen.getByRole('region', { name: /calendar$/i })).toBeInTheDocument();
  });
  expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');
  expect(second.container.querySelectorAll('[class*="modePanel"]').length).toBe(1);
});

it('defers DailySky twinkle activation while Cosmic Launch or popstate quick-fade is active', () => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  mockedPathname = '/';

  const { container } = render(
    <ToastProvider>
      <TransitionProvider>
        <TransitionLink href="/tasks/daily">Launch daily</TransitionLink>
        <DailySky />
      </TransitionProvider>
    </ToastProvider>,
  );

  const sky = container.querySelector('[class*="sky"]') as HTMLElement;
  expect(sky).toHaveAttribute('data-animated', 'false');
  expect(sky.querySelectorAll('[class*="twinkle"]').length).toBe(8);
  expect(sky.querySelectorAll('svg[class*="stars"] circle').length).toBe(114);
  expect(sky.querySelectorAll('svg[class*="stars"] path').length).toBe(4);
  const wheels = sky.querySelectorAll('image[data-daily-zodiac]');
  expect(wheels).toHaveLength(2);
  for (const wheel of wheels) {
    expect(wheel).toHaveAttribute('href', '/visuals/daily-v2/zodiac-wheel.svg');
    expect(wheel).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  expect(wheels[0]).toHaveAttribute('data-daily-zodiac', 'upper-left');
  expect(wheels[1]).toHaveAttribute('data-daily-zodiac', 'lower-right');
  expect(wheels[1]).toHaveAttribute('x', '976');
  expect(wheels[1]).toHaveAttribute('width', '420');

  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(sky).toHaveAttribute('data-animated', 'false');

  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(sky).toHaveAttribute('data-animated', 'true');

  fireEvent.click(screen.getByRole('link', { name: 'Launch daily' }));
  expect(sky).toHaveAttribute('data-animated', 'false');

  cleanup();
  mockedPathname = '/tasks/daily';

  const second = render(
    <ToastProvider>
      <TransitionProvider>
        <DailySky />
      </TransitionProvider>
    </ToastProvider>,
  );
  const sky2 = second.container.querySelector('[class*="sky"]') as HTMLElement;

  act(() => {
    vi.advanceTimersByTime(180);
  });
  expect(sky2).toHaveAttribute('data-animated', 'true');

  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(sky2).toHaveAttribute('data-animated', 'false');

  act(() => {
    vi.advanceTimersByTime(260);
  });
  // Remains inactive right after overlay unmount until post-arrival settle completes
  expect(sky2).toHaveAttribute('data-animated', 'false');

  act(() => {
    vi.advanceTimersByTime(180);
  });
  expect(sky2).toHaveAttribute('data-animated', 'true');
});
