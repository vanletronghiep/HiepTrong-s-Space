'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import overlays from './events-overlays.module.css';

/** Scrolled distance (px) over which the Show more cue fades out once the reader starts. */
const CUE_FADE_PX = 40;
/** Within this many px of the end the list counts as fully scrolled. */
const END_PX = 8;
/** Share of the remaining wheel distance covered per frame while easing. */
const EASE = 0.2;

export interface AgendaScrollerProps {
  children: ReactNode;
  label: string;
  isDesktop: boolean;
  /** True when there are enough events to need scrolling (more than five). */
  scrollable: boolean;
  /** Changes when the visible entries change, so the cue is measured again. */
  contentKey: string | number;
}

/**
 * Event list container (v3.3). Up to five events show in full with no inner scrolling and no
 * cue. Beyond that, from 768px up, the list becomes a fixed-height, scrollbar-free box with a
 * "Show more" cue that only tells the reader to scroll: it fades out the moment scrolling starts
 * and never loads anything. Wheel scrolling glides inside the box. On phones the list simply
 * grows with the page.
 */
export function AgendaScroller({
  children,
  label,
  isDesktop,
  scrollable,
  contentKey,
}: AgendaScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const active = isDesktop && scrollable;

  // The cue is updated straight on the DOM, at most once a frame, so scrolling never re-renders.
  const frameRef = useRef(0);
  const updateCue = useCallback(() => {
    const element = scrollerRef.current;
    const cue = cueRef.current;
    if (!element || !cue) return;
    const remaining = element.scrollHeight - element.clientHeight - element.scrollTop;
    const canScroll = element.scrollHeight - element.clientHeight > END_PX;
    const fade = Math.max(0, Math.min(1, 1 - element.scrollTop / CUE_FADE_PX));
    cue.style.opacity = canScroll && remaining > END_PX ? fade.toFixed(2) : '0';
  }, []);

  const onScroll = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      updateCue();
    });
  }, [updateCue]);

  useLayoutEffect(() => {
    if (active) updateCue();
  }, [active, contentKey, updateCue]);

  useEffect(
    () => () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  // Eased mouse-wheel scrolling; reduced motion keeps the browser's own behaviour.
  useEffect(() => {
    const element = scrollerRef.current;
    if (!element || !active) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let target = element.scrollTop;
    let frame = 0;
    const tick = () => {
      const distance = target - element.scrollTop;
      if (Math.abs(distance) < 0.5) {
        element.scrollTop = target;
        frame = 0;
        return;
      }
      const stride = Math.max(1, Math.abs(distance) * EASE);
      element.scrollTop += Math.sign(distance) * Math.min(stride, Math.abs(distance));
      frame = window.requestAnimationFrame(tick);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaMode !== 0) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const max = element.scrollHeight - element.clientHeight;
      if (max <= 0) return;
      // At either end the page takes over, so the list never traps the scroll.
      if (event.deltaY < 0 && element.scrollTop <= 0) return;
      if (event.deltaY > 0 && element.scrollTop >= max - 1) return;
      event.preventDefault();
      const from = frame ? target : element.scrollTop;
      target = Math.min(max, Math.max(0, from + event.deltaY));
      if (!frame) frame = window.requestAnimationFrame(tick);
    };
    const syncTarget = () => {
      if (!frame) target = element.scrollTop;
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('scroll', syncTarget, { passive: true });
    return () => {
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('scroll', syncTarget);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active]);

  if (!active) return <div>{children}</div>;

  return (
    <div className={overlays.agendaScrollWrap}>
      <div
        ref={scrollerRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={overlays.agendaScroller}
        onScroll={onScroll}
      >
        {children}
      </div>
      <div ref={cueRef} aria-hidden="true" className={overlays.showMoreOverlay}>
        <span className={overlays.showMoreCue}>Show more</span>
      </div>
    </div>
  );
}
