// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { HTMLAttributes, ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast, type ToastOptions, type ToastTone } from '@/ui/Toast';

// Keep presentation animations out of timer-lifecycle assertions.
vi.mock('motion/react', async () => {
  const { createElement, forwardRef } = await import('react');
  return {
    useReducedMotion: () => true,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: {
      div: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
        ({ children, ...props }, ref) => {
          const domProps = { ...props } as Record<string, unknown>;
          for (const key of ['initial', 'animate', 'exit', 'transition']) delete domProps[key];
          return createElement('div', { ...domProps, ref }, children);
        },
      ),
    },
  };
});

function Trigger({ tone = 'success', options }: { tone?: ToastTone; options?: ToastOptions }) {
  const { pushToast } = useToast();
  return <button onClick={() => pushToast('Saved.', tone, options)}>Notify</button>;
}

function BurstTrigger() {
  const { pushToast } = useToast();
  return (
    <button
      onClick={() => {
        pushToast('Could not save.', 'error');
        for (let i = 1; i <= 5; i++) pushToast(`Saved ${i}.`, 'success');
      }}
    >
      Notify burst
    </button>
  );
}

function notify(tone: ToastTone = 'success', options?: ToastOptions) {
  const view = render(
    <ToastProvider>
      <Trigger tone={tone} options={options} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Notify' }));
  return view;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('toast visibility and duration', () => {
  it.each(['success', 'info'] as const)(
    'shows a custom-duration %s immediately for one second',
    (tone) => {
      notify(tone, { durationMs: 1000 });
      expect(screen.getByText('Saved.')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(999));
      expect(screen.getByText('Saved.')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
      expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
    },
  );

  it.each(['success', 'info'] as const)('preserves the four-second default for %s', (tone) => {
    notify(tone);
    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });

  it('keeps errors until dismissed even when a duration is supplied', () => {
    notify('error', { durationMs: 1000 });
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });

  it('cancels the timer on early dismissal', () => {
    notify('success', { durationMs: 1000 });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not evict persistent errors when newer transient messages fill the queue', () => {
    render(
      <ToastProvider>
        <BurstTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Notify burst' }));
    expect(screen.getByText('Could not save.')).toBeInTheDocument();
    expect(screen.queryByText('Saved 1.')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved 2.')).not.toBeInTheDocument();
    expect(screen.getByText('Saved 3.')).toBeInTheDocument();
    expect(screen.getByText('Saved 5.')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText('Could not save.')).toBeInTheDocument();
    expect(screen.queryByText('Saved 5.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Could not save.')).not.toBeInTheDocument();
  });

  it('cleans up pending timers when the provider unmounts', () => {
    const view = notify('success', { durationMs: 1000 });
    expect(vi.getTimerCount()).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
