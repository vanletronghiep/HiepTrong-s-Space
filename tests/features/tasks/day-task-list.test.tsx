// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DayTaskList } from '@/features/tasks/DayTaskList';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('measures 3.5 mixed-height cards, keeps the natural bottom, and remeasures after resizing or removal', () => {
  const callbacks: (() => void)[] = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        callbacks.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return Number(this.dataset.top ?? 0);
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return Number(this.dataset.height ?? 0);
  });
  const cards = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <article
        key={i}
        data-top={[0, 110, 240, 330, 500][i]}
        data-height={[100, 120, 80, 160, 100][i]}
      >
        Task {i}
      </article>
    ));
  const { rerender } = render(
    <DayTaskList count={5} label="Today's tasks">
      {cards(5)}
    </DayTaskList>,
  );
  const pane = screen.getByRole('region', { name: "Today's tasks" });
  const list = pane.parentElement!;
  expect(list.style.getPropertyValue('--day-list-height')).toBe('410px');
  expect(pane.children).toHaveLength(5);
  Object.defineProperties(pane, { scrollHeight: { value: 600 }, clientHeight: { value: 410 } });
  pane.scrollTo = vi.fn();
  fireEvent.keyDown(pane, { key: 'End' });
  expect(pane.scrollTo).toHaveBeenLastCalledWith({ top: 190, behavior: expect.any(String) });
  pane.scrollTop = 190;
  fireEvent.scroll(pane);
  expect(list).toHaveAttribute('data-list-end', 'true');
  pane.querySelectorAll('article')[3]!.dataset.height = '200';
  callbacks.forEach((callback) => callback());
  expect(list.style.getPropertyValue('--day-list-height')).toBe('430px');
  rerender(
    <DayTaskList count={3} label="Today's tasks">
      {cards(3)}
    </DayTaskList>,
  );
  expect(list).toHaveAttribute('data-scrollable', 'false');
  expect(screen.queryByRole('scrollbar')).toBeNull();
});

it('keeps ResizeObserver attached when rerendered with fresh JSX children of the same count', () => {
  const observe = vi.fn();
  const disconnect = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = observe;
      disconnect = disconnect;
    },
  );

  const renderCards = (prefix: string) =>
    Array.from({ length: 5 }, (_, i) => <article key={i}>{`${prefix} ${i}`}</article>);

  const { rerender } = render(
    <DayTaskList count={5} label="Today's tasks">
      {renderCards('Initial')}
    </DayTaskList>,
  );
  expect(observe).toHaveBeenCalled();
  observe.mockClear();
  disconnect.mockClear();

  rerender(
    <DayTaskList count={5} label="Today's tasks">
      {renderCards('Refetched')}
    </DayTaskList>,
  );
  expect(disconnect).not.toHaveBeenCalled();
  expect(observe).not.toHaveBeenCalled();
});
