'use client';

import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import styles from './day-carousel.module.css';

interface DayBoard {
  key: 'yesterday' | 'today' | 'tomorrow';
  label: string;
  content: ReactNode;
}

const DRAG_IGNORE =
  'button, a, input, select, textarea, [role="scrollbar"], [role="dialog"], [contenteditable]';
const SETTLE_EASE = [0.2, 0.7, 0.17, 1] as const;

interface DragState {
  pointerId: number;
  x: number;
  y: number;
  time: number;
  origin: number;
  step: number;
  horizontal: boolean;
}

function bound(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}

export function DayCarousel({ boards }: { boards: readonly DayBoard[] }) {
  const [active, setActive] = useState(1);
  const activeRef = useRef(1);
  const carousel = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const focusAfterMove = useRef(false);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const settleSeqRef = useRef(0);
  const motion = useMotionValue(1);
  const reducedMotion = useReducedMotion();

  useMotionValueEvent(motion, 'change', (value) => {
    stage.current?.style.setProperty('--carousel-position', String(value));
  });

  const clearMoving = useCallback(() => {
    if (stage.current) delete stage.current.dataset.moving;
  }, []);

  const settle = useCallback(
    (next: number) => {
      settleSeqRef.current += 1;
      const seq = settleSeqRef.current;
      animationRef.current?.stop();
      animationRef.current = null;
      motion.stop();
      if (reducedMotion || motion.get() === next) {
        clearMoving();
        motion.set(next);
        return;
      }
      if (stage.current) stage.current.dataset.moving = 'true';
      const controls = animate(motion, next, { duration: 0.32, ease: [...SETTLE_EASE] });
      animationRef.current = controls;
      void controls.then(
        () => {
          if (settleSeqRef.current === seq) {
            animationRef.current = null;
            clearMoving();
          }
        },
        () => {
          if (settleSeqRef.current === seq) {
            animationRef.current = null;
            clearMoving();
          }
        },
      );
    },
    [clearMoving, motion, reducedMotion],
  );

  useEffect(() => {
    if (reducedMotion) {
      settleSeqRef.current += 1;
      animationRef.current?.stop();
      animationRef.current = null;
      clearMoving();
      motion.stop();
      motion.set(activeRef.current);
    }
    return () => {
      settleSeqRef.current += 1;
      animationRef.current?.stop();
      animationRef.current = null;
      clearMoving();
      motion.stop();
    };
  }, [clearMoving, motion, reducedMotion]);

  const selectDay = useCallback(
    (requested: number) => {
      const next = bound(requested, 0, boards.length - 1);
      if (next !== activeRef.current) {
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && stage.current?.contains(focused)) {
          focusAfterMove.current = true;
        }
        activeRef.current = next;
        setActive(next);
      }
      settle(next);
    },
    [boards.length, settle],
  );

  useLayoutEffect(() => {
    if (focusAfterMove.current) carousel.current?.focus({ preventScroll: true });
    focusAfterMove.current = false;
  }, [active]);

  useEffect(() => {
    const region = carousel.current;
    if (!region) return;
    let lastEvent = -Infinity;
    let distance = 0;
    let consumed = false;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || drag.current?.horizontal) return;
      const delta = event.shiftKey ? event.deltaX || event.deltaY : event.deltaX;
      if (!delta || (!event.shiftKey && Math.abs(delta) <= Math.abs(event.deltaY))) return;
      event.preventDefault();
      if (event.timeStamp - lastEvent > 160) {
        distance = 0;
        consumed = false;
      }
      lastEvent = event.timeStamp;
      if (consumed) return;
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? region.clientWidth : 1;
      distance += delta * units;
      if (Math.abs(distance) < 42) return;
      consumed = true;
      selectDay(activeRef.current + Math.sign(distance));
    };
    region.addEventListener('wheel', onWheel, { passive: false });
    return () => region.removeEventListener('wheel', onWheel);
  }, [selectDay]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    if (
      !(event.target instanceof Element) ||
      !event.currentTarget.contains(event.target) ||
      event.target.closest(DRAG_IGNORE)
    )
      return;
    const board = event.currentTarget.querySelector<HTMLElement>('[data-offset="0"]');
    if (!board) return;
    const ratio = parseFloat(getComputedStyle(board).getPropertyValue('--carousel-step-percent'));
    const step = board.offsetWidth * (ratio / 100 || 0.79) + 12;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
      origin: motion.get(),
      step,
      horizontal: false,
    };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        drag.current = null;
        return;
      }
      gesture.horizontal = true;
      gesture.origin = motion.get();
      settleSeqRef.current += 1;
      animationRef.current?.stop();
      animationRef.current = null;
      clearMoving();
      motion.stop();
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = 'true';
    }
    event.preventDefault();
    const min = Math.max(0, activeRef.current - 1);
    const max = Math.min(boards.length - 1, activeRef.current + 1);
    motion.set(bound(gesture.origin - dx / gesture.step, min, max));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>, cancel: boolean) => {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (!gesture.horizontal) return;
    suppressClick.current = true;
    const dx = event.clientX - gesture.x;
    const velocity = Math.abs(dx) / Math.max(1, event.timeStamp - gesture.time);
    const enough =
      Math.abs(dx) >= Math.max(28, gesture.step * 0.16) || (Math.abs(dx) >= 18 && velocity > 0.55);
    selectDay(cancel || !enough ? activeRef.current : activeRef.current - Math.sign(dx));
  };

  return (
    <section
      ref={carousel}
      className={styles.carousel}
      aria-label="Three-day task carousel"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.target !== event.currentTarget &&
          !(event.target instanceof Element && event.target.closest('[data-day-selector]'))
        )
          return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          selectDay(activeRef.current + (event.key === 'ArrowLeft' ? -1 : 1));
        }
      }}
    >
      <div className={styles.daySelector} data-day-selector role="group" aria-label="Select day">
        {boards.map((board, index) => (
          <button
            key={board.key}
            type="button"
            aria-pressed={index === active}
            onClick={() => selectDay(index)}
          >
            {board.label}
          </button>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {boards[active]?.label} selected
      </span>
      <div
        ref={stage}
        className={styles.stage}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
        onLostPointerCapture={(event) => {
          if (event.target === event.currentTarget) endDrag(event, true);
        }}
        onPointerLeave={() => {
          if (!drag.current?.horizontal) drag.current = null;
        }}
        onClickCapture={(event) => {
          if (
            suppressClick.current &&
            event.detail > 0 &&
            event.target instanceof Node &&
            event.currentTarget.contains(event.target)
          ) {
            suppressClick.current = false;
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {boards.map((board, index) => {
          const activeBoard = index === active;
          return (
            <div
              key={board.key}
              className={styles.board}
              data-day={board.key}
              data-offset={index - active}
              style={{ '--carousel-board-index': index } as CSSProperties}
            >
              <div inert={!activeBoard} aria-hidden={!activeBoard}>
                {board.content}
              </div>
              {!activeBoard && Math.abs(index - active) === 1 && (
                <button
                  type="button"
                  className={styles.previewSelect}
                  aria-label={`Show ${board.label}`}
                  onClick={() => selectDay(index)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
