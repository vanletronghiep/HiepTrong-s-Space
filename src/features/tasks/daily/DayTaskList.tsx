'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { StarIcon } from '@/ui/StarIcon';
import styles from './day-task-list.module.css';

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
  const list = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // v3.2: no visible scrollbar — native scrolling only; track the end for the fade/mask.
  const syncListEnd = useCallback(() => {
    const pane = viewport.current;
    if (!pane || !list.current) return;
    const max = pane.scrollHeight - pane.clientHeight;
    list.current.dataset.listEnd = String(max - pane.scrollTop <= 1);
  }, []);

  useLayoutEffect(() => {
    const pane = viewport.current;
    if (!pane || !list.current || !scrollable) return;
    const container = list.current;
    const measure = () => {
      const fourth = pane.querySelectorAll('article')[3];
      if (!fourth) return;
      const visibleHeight = fourth.offsetTop + fourth.offsetHeight / 2;
      container.style.setProperty('--day-list-height', `${visibleHeight}px`);
      container.style.setProperty('--day-list-fade', `${fourth.offsetHeight / 2}px`);
      syncListEnd();
    };
    let resizeObserver: ResizeObserver | null = null;
    const observeCards = () => {
      if (!resizeObserver) return;
      resizeObserver.disconnect();
      resizeObserver.observe(pane);
      pane.querySelectorAll('article').forEach((card) => resizeObserver?.observe(card));
    };
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure);
      observeCards();
    }
    measure();
    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            observeCards();
            measure();
          });
    mutationObserver?.observe(pane, { childList: true });
    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [count, scrollable, syncListEnd]);

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

  return (
    <div ref={list} className={styles.list} data-scrollable={scrollable}>
      <motion.div
        ref={viewport}
        className={styles.viewport}
        role="region"
        aria-label={label}
        tabIndex={scrollable ? 0 : undefined}
        layoutScroll
        onKeyDown={(event) => {
          if (scrollable && event.target === event.currentTarget) scrollByItems(event);
        }}
        onScroll={scrollable ? syncListEnd : undefined}
      >
        {children}
      </motion.div>
      {scrollable && (
        <div className={styles.fade} aria-hidden="true">
          <span>
            <StarIcon size={10} /> Scroll for more
          </span>
        </div>
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
