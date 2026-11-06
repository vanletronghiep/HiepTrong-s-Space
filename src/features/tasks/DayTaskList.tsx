'use client';

import { motion, useReducedMotion } from 'motion/react';
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { StarIcon } from '@/ui/StarIcon';
import styles from './day-task-list.module.css';

const THUMB_SIZE = 20;

function limit(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

export function DayTaskList({
  children,
  count,
  label,
}: {
  children: ReactNode;
  count: number;
  label: string;
}) {
  const scrollable = count > 3;
  const viewportId = useId();
  const list = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; top: number; travel: number; grab: number } | null>(
    null,
  );
  const reducedMotion = useReducedMotion();

  const syncThumb = useCallback(() => {
    const pane = viewport.current;
    if (!pane || !list.current || !track.current) return;
    const max = pane.scrollHeight - pane.clientHeight;
    const progress = max > 0 ? limit(pane.scrollTop / max, 1) : 0;
    track.current.style.setProperty('--day-scroll-progress', String(progress));
    track.current.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    list.current.dataset.listEnd = String(max - pane.scrollTop <= 1);
  }, []);

  useLayoutEffect(() => {
    const pane = viewport.current;
    if (!pane || !list.current || !scrollable) return;
    const container = list.current;
    const cards = Array.from(pane.querySelectorAll('article'));
    const fourth = cards[3];
    if (!fourth) return;
    const measure = () => {
      const visibleHeight = fourth.offsetTop + fourth.offsetHeight / 2;
      const last = pane.querySelector<HTMLElement>('article:last-of-type');
      const gap = parseFloat(getComputedStyle(pane).rowGap) || 0;
      container.style.setProperty('--day-list-height', `${visibleHeight}px`);
      container.style.setProperty(
        '--day-list-tail',
        `${Math.max(0, visibleHeight - (last?.offsetHeight ?? 0) - gap)}px`,
      );
      container.style.setProperty('--day-list-fade', `${fourth.offsetHeight / 2}px`);
      syncThumb();
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(pane);
    cards.forEach((card) => observer?.observe(card));
    return () => observer?.disconnect();
  }, [children, scrollable, syncThumb]);

  const scrollByItems = (event: KeyboardEvent<HTMLDivElement>) => {
    const pane = viewport.current;
    if (!pane) return;
    const cards = Array.from(pane.querySelectorAll('article'));
    if (cards.length < 2) return;
    const max = pane.scrollHeight - pane.clientHeight;
    const current = nearestCardIndex(cards, pane.scrollTop);
    const offsets: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -3, PageDown: 3 };
    const offset = offsets[event.key];
    if (offset === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? max
          : cards[limit(current + (offset ?? 0), cards.length - 1)]!.offsetTop;
    pane.scrollTo({ top: limit(target, max), behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const dragTo = (clientY: number) => {
    const pane = viewport.current;
    const pointer = drag.current;
    if (!pane || !pointer) return;
    const progress = limit((clientY - pointer.top - pointer.grab) / pointer.travel, 1);
    pane.scrollTop = progress * (pane.scrollHeight - pane.clientHeight);
    syncThumb();
  };

  const startThumbDrag = (event: PointerEvent<HTMLDivElement>) => {
    const pane = viewport.current;
    if (!pane || event.button !== 0 || !event.isPrimary) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const travel = rect.height - THUMB_SIZE;
    const max = pane.scrollHeight - pane.clientHeight;
    if (travel <= 0 || max <= 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const position = (pane.scrollTop / max) * travel;
    const offset = event.clientY - rect.top - position;
    drag.current = {
      pointerId: event.pointerId,
      top: rect.top,
      travel,
      grab: offset >= 0 && offset <= THUMB_SIZE ? offset : THUMB_SIZE / 2,
    };
    if (list.current) list.current.dataset.thumbDragging = 'true';
    dragTo(event.clientY);
  };

  const stopThumbDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== drag.current?.pointerId) return;
    drag.current = null;
    if (list.current) delete list.current.dataset.thumbDragging;
    const pane = viewport.current;
    if (!pane) return;
    const cards = Array.from(pane.querySelectorAll('article'));
    pane.scrollTo({
      top: cards[nearestCardIndex(cards, pane.scrollTop)]?.offsetTop ?? 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    syncThumb();
  };

  return (
    <div ref={list} className={styles.list} data-scrollable={scrollable}>
      <motion.div
        ref={viewport}
        className={styles.viewport}
        id={viewportId}
        role="region"
        aria-label={label}
        tabIndex={scrollable ? 0 : undefined}
        layoutScroll
        onKeyDown={(event) => {
          if (scrollable && event.target === event.currentTarget) scrollByItems(event);
        }}
        onScroll={scrollable ? syncThumb : undefined}
      >
        {children}
        {scrollable && <div className={styles.endSpacer} aria-hidden="true" />}
      </motion.div>
      {scrollable && (
        <>
          <div className={styles.fade} aria-hidden="true">
            <span>
              <StarIcon size={10} /> Scroll for more
            </span>
          </div>
          <div
            ref={track}
            className={styles.track}
            role="scrollbar"
            aria-label={`Scroll ${label.toLowerCase()}`}
            aria-controls={viewportId}
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            tabIndex={0}
            onPointerDown={startThumbDrag}
            onPointerMove={(event) => {
              if (event.pointerId === drag.current?.pointerId) dragTo(event.clientY);
            }}
            onPointerUp={stopThumbDrag}
            onPointerCancel={stopThumbDrag}
            onLostPointerCapture={stopThumbDrag}
            onKeyDown={scrollByItems}
          >
            <svg
              viewBox="0 0 24 120"
              preserveAspectRatio="none"
              aria-hidden="true"
              className={styles.constellation}
            >
              <path d="M12 6V114" fill="none" stroke="currentColor" strokeDasharray="1.5 2.8" />
              <circle cx="12" cy="10" r="1.6" fill="currentColor" />
              <circle cx="12" cy="43" r="1.25" fill="currentColor" />
              <circle cx="12" cy="80" r="1.4" fill="currentColor" />
              <circle cx="12" cy="111" r="1.6" fill="currentColor" />
            </svg>
            <span className={styles.thumb} aria-hidden="true" />
          </div>
        </>
      )}
    </div>
  );
}

function nearestCardIndex(cards: HTMLElement[], scrollTop: number) {
  return cards.reduce(
    (nearest, card, index) =>
      Math.abs(card.offsetTop - scrollTop) < Math.abs(cards[nearest]!.offsetTop - scrollTop)
        ? index
        : nearest,
    0,
  );
}

const EMPTY_COPY = {
  yesterday: 'The sky was quiet yesterday.',
  today: 'A clear sky today. Add a task to begin.',
  tomorrow: 'The sky is quiet tomorrow.',
};

export function DayEmpty({
  day,
  compact = false,
}: {
  day: keyof typeof EMPTY_COPY;
  compact?: boolean;
}) {
  return (
    <div className={styles.empty} data-compact={compact}>
      <div className={styles.emptyArt} aria-hidden="true">
        {day === 'today' ? (
          <svg viewBox="0 0 188 96" fill="none" stroke="currentColor">
            <circle cx="94" cy="48" r="39" strokeWidth="0.9" />
            <circle cx="94" cy="48" r="34" strokeWidth="0.65" />
            {Array.from({ length: 24 }, (_, index) => (
              <path
                key={index}
                d={index % 3 ? 'M94 12v2' : 'M94 12v5'}
                transform={`rotate(${index * 15} 94 48)`}
                strokeWidth="0.7"
              />
            ))}
            <path
              d="M95 49c-4-6-14 0-9 8 8 12 27 2 25-10-3-19-27-24-40-9-14 15-3 42 15 47"
              strokeWidth="1.1"
            />
            <ellipse cx="94" cy="49" rx="28" ry="11" transform="rotate(-27 94 49)" opacity="0.46" />
            <path d="M37 22v10m-5-5h10m106 37v12m-6-6h12" strokeWidth="0.8" />
            <circle cx="59" cy="71" r="1.5" fill="currentColor" />
            <circle cx="135" cy="28" r="1.4" fill="currentColor" />
          </svg>
        ) : (
          <div className={styles.planet} data-planet={day} />
        )}
      </div>
      <p>{compact ? 'No tasks' : EMPTY_COPY[day]}</p>
    </div>
  );
}
