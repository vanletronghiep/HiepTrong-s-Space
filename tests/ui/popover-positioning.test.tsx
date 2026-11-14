// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BellButton } from '@/features/notifications/BellButton';
import { Popover } from '@/ui/Popover';
import { ToastProvider } from '@/ui/Toast';
import { useRef, useState } from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/tasks/hub',
}));

function PopoverHarness({
  width = 380,
  anchorNull = false,
}: {
  width?: number;
  anchorNull?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const nullRef = useRef<HTMLElement | null>(null);

  return (
    <div>
      <button ref={anchorRef} type="button" onClick={() => setOpen((v) => !v)}>
        Toggle popover
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorNull ? nullRef : anchorRef}
        aria-label="Test popover"
        align="right"
        width={width}
        portal
        autoFocusPanel
      >
        <div>
          Popover content
          <button type="button">Inside action</button>
        </div>
      </Popover>
    </div>
  );
}

describe('Popover and NotificationPopover positioning', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('portals NotificationPopover into document.body anchored to the bell with sakura theme', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 5.5,
      bottom: 49.5,
      left: 1276,
      right: 1320,
      width: 44,
      height: 44,
      x: 1276,
      y: 5.5,
      toJSON: () => {},
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ items: [], unreadCount: 0 }), { status: 200 }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <div style={{ backdropFilter: 'blur(4px)' }}>
            <BellButton tone="workspace" />
          </div>
        </ToastProvider>
      </QueryClientProvider>,
    );

    const bell = await screen.findByRole('button', { name: 'Notifications' });
    fireEvent.click(bell);

    const dialog = await screen.findByRole('dialog', { name: 'Notifications' });
    expect(container.contains(dialog)).toBe(false);
    expect(dialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(dialog).toHaveStyle({
      position: 'fixed',
      left: '940px',
      top: '57.5px',
      width: '380px',
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Notifications' })).toBeNull());
    expect(bell).toHaveFocus();
  });

  it('recalculates Popover position when panel dimensions change via ResizeObserver', async () => {
    const callbackRef: { current: (() => void) | null } = { current: null };
    class MockResizeObserver {
      constructor(cb: () => void) {
        callbackRef.current = cb;
      }
      observe() {}
      disconnect() {}
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);

    let panelHeight = 140;
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => panelHeight,
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 740,
      bottom: 784,
      left: 1276,
      right: 1320,
      width: 44,
      height: 44,
      x: 1276,
      y: 740,
      toJSON: () => {},
    });

    render(<PopoverHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle popover' }));

    const dialog = screen.getByRole('dialog', { name: 'Test popover' });
    expect(dialog).toHaveStyle({ top: '592px' });

    panelHeight = 260;
    act(() => {
      callbackRef.current?.();
    });

    await waitFor(() => {
      expect(dialog).toHaveStyle({ top: '472px' });
    });
  });

  it('keeps outer fixed geometry stationary during entrance transform and stays hidden before anchor geometry resolves', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(180);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 136,
      left: 900,
      right: 936,
      width: 36,
      height: 36,
      x: 900,
      y: 100,
      toJSON: () => {},
    });

    const { rerender } = render(<PopoverHarness width={220} anchorNull />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle popover' }));

    const hiddenDialog = screen.getByRole('dialog', { hidden: true });
    expect(hiddenDialog).toHaveAttribute('aria-label', 'Test popover');
    expect(hiddenDialog).toHaveStyle({
      position: 'fixed',
      top: '0px',
      left: '0px',
      visibility: 'hidden',
      pointerEvents: 'none',
    });

    rerender(<PopoverHarness width={220} anchorNull={false} />);
    const dialog = screen.getByRole('dialog', { name: 'Test popover' });
    expect(dialog).toHaveStyle({
      position: 'fixed',
      top: '144px',
      left: '716px',
      width: '220px',
    });
    expect(dialog.style.visibility).not.toBe('hidden');
    expect(dialog.style.transform).toBe('');
    const innerSurface = dialog.firstElementChild as HTMLElement;
    expect(innerSurface).toHaveClass('rounded-card');
    expect(innerSurface).toHaveClass('origin-top-right');
    expect(innerSurface.style.transform).toContain('scale(0.98)');
  });

  it('coalesces capture scroll positioning via requestAnimationFrame and cancels pending frames on close/unmount', async () => {
    let nextFrameId = 1;
    const queuedFrames = new Map<number, FrameRequestCallback>();
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextFrameId++;
      queuedFrames.set(id, cb);
      return id;
    });
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      queuedFrames.delete(id);
    });

    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(180);

    let anchorRect = {
      top: 100,
      bottom: 140,
      left: 900,
      right: 940,
      width: 40,
      height: 40,
      x: 900,
      y: 100,
      toJSON: () => {},
    };
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => anchorRect);

    const { unmount } = render(<PopoverHarness width={220} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle popover' }));

    const dialog = screen.getByRole('dialog', { name: 'Test popover' });
    expect(dialog).toHaveStyle({ top: '148px' });

    const insideBtn = screen.getByRole('button', { name: 'Inside action' });
    insideBtn.focus();
    expect(insideBtn).toHaveFocus();

    const callsBeforeScroll = rectSpy.mock.calls.length;
    rafSpy.mockClear();

    anchorRect = { ...anchorRect, top: 240, bottom: 280, y: 240 };

    const scrollHost = document.createElement('div');
    document.body.appendChild(scrollHost);
    act(() => {
      for (let i = 0; i < 5; i += 1) {
        scrollHost.dispatchEvent(new Event('scroll'));
      }
    });
    document.body.removeChild(scrollHost);

    // Burst of 5 capture scroll events schedules only 1 rAF and performs 0 synchronous measurements
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(rectSpy).toHaveBeenCalledTimes(callsBeforeScroll);
    expect(dialog).toHaveStyle({ top: '148px' });

    act(() => {
      const entries = Array.from(queuedFrames.entries());
      queuedFrames.clear();
      for (const [, cb] of entries) {
        cb(16);
      }
    });

    expect(dialog).toHaveStyle({ top: '288px' });
    expect(insideBtn).toHaveFocus();

    // Queue another frame and close/unmount before it executes -> pending frame must cancel
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    const pendingIds = Array.from(queuedFrames.keys());
    expect(pendingIds).toHaveLength(1);

    unmount();
    expect(cancelSpy).toHaveBeenCalledWith(pendingIds[0]);
    expect(queuedFrames.size).toBe(0);
  });
});
