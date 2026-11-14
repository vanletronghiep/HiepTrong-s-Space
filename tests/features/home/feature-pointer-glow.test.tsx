// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeatureThumbnail } from '@/features/home/feature-collection/FeatureThumbnail';

function setup(reduced = false) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduced-motion') ? reduced : true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const view = render(<FeatureThumbnail thumbnail={{ preset: 'dual-orbit', accent: 'blue' }} />);
  const surface = view.container.firstElementChild as HTMLDivElement;
  const glow = surface.children[1] as HTMLDivElement;
  vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 80 } as DOMRect);
  return { ...view, surface, glow, raf, cancel };
}

function move(surface: HTMLElement, x: number, y: number, pointerType = 'mouse') {
  const event = new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  fireEvent(surface, event);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Feature thumbnail cursor glow', () => {
  it('batches moves into one frame using the latest position relative to its own box', () => {
    const { surface, glow, raf, cancel } = setup();
    move(surface, 140, 110);
    move(surface, 180, 140);
    expect(raf).toHaveBeenCalledTimes(1);
    raf.mock.calls[0]![0](0);
    expect(glow).toHaveAttribute('data-active', 'true');
    expect(glow.style.transform).toBe('translate3d(80px, 60px, 0)');
    expect(glow).toHaveAttribute('aria-hidden', 'true');

    move(surface, 200, 160);
    fireEvent.pointerLeave(surface);
    expect(cancel).toHaveBeenCalledWith(42);
    expect(glow).not.toHaveAttribute('data-active');
  });

  it('ignores touch and reduced motion, and cancels pending work when unmounted', () => {
    const normal = setup();
    move(normal.surface, 140, 110, 'touch');
    expect(normal.raf).not.toHaveBeenCalled();
    move(normal.surface, 140, 110);
    normal.unmount();
    expect(normal.cancel).toHaveBeenCalledWith(42);
    vi.restoreAllMocks();

    const reduced = setup(true);
    move(reduced.surface, 140, 110);
    expect(reduced.raf).not.toHaveBeenCalled();
    expect(reduced.glow).not.toHaveAttribute('data-active');
  });
});
