// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Checkbox } from '@/ui/Checkbox';
import { Drawer } from '@/ui/Drawer';

interface CapturedMotionProps {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
}

const motionMockState = vi.hoisted(() => ({
  reduced: false,
  drawerPanels: [] as CapturedMotionProps[],
}));

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  const ActualMotionDiv = actual.motion.div;
  return {
    ...actual,
    useReducedMotion: () => motionMockState.reduced,
    motion: {
      ...actual.motion,
      div: (props: ComponentProps<typeof ActualMotionDiv>) => {
        if ((props as Record<string, unknown>)['role'] === 'dialog') {
          motionMockState.drawerPanels.push({
            initial: props.initial,
            animate: props.animate,
            exit: props.exit,
            transition: props.transition,
          });
        }
        return <ActualMotionDiv {...props} />;
      },
    },
  };
});

function DrawerHarness({ useInitialRef = false }: { useInitialRef?: boolean }) {
  const [open, setOpen] = useState(false);
  const targetRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Sample drawer"
        initialFocusRef={useInitialRef ? targetRef : undefined}
      >
        <input ref={targetRef} type="text" aria-label="Task title" />
      </Drawer>
    </div>
  );
}

describe('Drawer, useFocusTrap, and Checkbox smoothness & reduced-motion', () => {
  beforeEach(() => {
    motionMockState.reduced = false;
    motionMockState.drawerPanels = [];
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('passes { preventScroll: true } for initial drawer focus and focus restoration', () => {
    vi.useFakeTimers();
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

    render(<DrawerHarness useInitialRef />);

    const trigger = screen.getByRole('button', { name: 'Open drawer' });
    trigger.focus();
    focusSpy.mockClear();

    fireEvent.click(trigger);

    act(() => {
      vi.advanceTimersByTime(15);
    });

    const input = screen.getByLabelText('Task title');
    expect(input).toHaveFocus();
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    focusSpy.mockClear();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveFocus();
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('animates Drawer on a single axis matching viewport edge and disables motion under reduced-motion', () => {
    // Desktop (>= 768px): horizontal right-edge slide only (no y drift)
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(min-width: 768px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const desktopRender = render(
      <Drawer open onClose={() => {}} title="Desktop drawer">
        <p>Body</p>
      </Drawer>,
    );

    const desktopMotion = motionMockState.drawerPanels.at(-1);
    expect(desktopMotion?.initial).toEqual({ opacity: 0, x: 24 });
    expect(desktopMotion?.animate).toEqual({ opacity: 1, x: 0 });
    expect(desktopMotion?.exit).toEqual({ opacity: 0, x: 16 });
    expect(desktopMotion?.transition).toMatchObject({ duration: 0.25 });

    desktopRender.unmount();

    // Mobile (< 768px): vertical bottom-sheet slide only (no x drift)
    motionMockState.drawerPanels = [];
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const mobileRender = render(
      <Drawer open onClose={() => {}} title="Mobile drawer">
        <p>Body</p>
      </Drawer>,
    );

    const mobileMotion = motionMockState.drawerPanels.at(-1);
    expect(mobileMotion?.initial).toEqual({ opacity: 0, y: 24 });
    expect(mobileMotion?.animate).toEqual({ opacity: 1, y: 0 });
    expect(mobileMotion?.exit).toEqual({ opacity: 0, y: 16 });

    mobileRender.unmount();

    // Reduced motion: instant opacity only (0s duration, zero x/y offsets)
    motionMockState.reduced = true;
    motionMockState.drawerPanels = [];

    render(
      <Drawer open onClose={() => {}} title="Reduced drawer">
        <p>Body</p>
      </Drawer>,
    );

    const reducedMotionPanel = motionMockState.drawerPanels.at(-1);
    expect(reducedMotionPanel?.initial).toEqual({ opacity: 0 });
    expect(reducedMotionPanel?.animate).toEqual({ opacity: 1 });
    expect(reducedMotionPanel?.exit).toEqual({ opacity: 0 });
    expect(reducedMotionPanel?.transition).toMatchObject({ duration: 0 });
  });

  it('disables Checkbox inline SVG path and box transitions under reduced-motion while keeping standard smoothness', () => {
    const onCheckedChange = vi.fn();

    const { rerender, container } = render(
      <Checkbox checked={false} onCheckedChange={onCheckedChange} aria-label="Toggle task" />,
    );

    const normalPath = container.querySelector('path')!;
    const normalBox = container.querySelector('span')!;
    expect(normalPath.style.transition).toBe('stroke-dashoffset 200ms var(--ease)');
    expect(normalPath.style.strokeDashoffset).toBe('16');
    expect(normalBox).toHaveClass('motion-reduce:transition-none');
    expect(normalBox).not.toHaveClass('transition-none');

    motionMockState.reduced = true;
    rerender(<Checkbox checked onCheckedChange={onCheckedChange} aria-label="Toggle task" />);

    const reducedPath = container.querySelector('path')!;
    const reducedBox = container.querySelector('span')!;
    expect(reducedPath.style.transition).toBe('none');
    expect(reducedPath.style.strokeDashoffset).toBe('0');
    expect(reducedPath).toHaveClass('motion-reduce:transition-none');
    expect(reducedBox).toHaveClass('transition-none', 'duration-0');
    expect(reducedBox).toHaveClass('motion-reduce:transition-none', 'motion-reduce:duration-0');
  });
});
