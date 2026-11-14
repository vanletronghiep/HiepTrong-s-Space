'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { cn } from './cn';
import { useFeatureTheme } from './FeatureTheme';

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  'aria-label': string;
  id?: string;
  align?: 'right' | 'left';
  width?: number;
  mobileFullWidth?: boolean;
  autoFocusPanel?: boolean;
  portal?: boolean;
  children: ReactNode;
  className?: string;
}

interface PopoverGeometry {
  outerStyle: CSSProperties;
  surfaceStyle: CSSProperties;
  flipped: boolean;
}

function sameStyle(a: CSSProperties | undefined, b: CSSProperties): boolean {
  if (!a) return false;
  return (
    a.position === b.position &&
    a.top === b.top &&
    a.left === b.left &&
    a.right === b.right &&
    a.width === b.width &&
    a.maxHeight === b.maxHeight
  );
}

const UNMEASURED_STYLE: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  visibility: 'hidden',
  pointerEvents: 'none',
};

export function Popover({
  open,
  onClose,
  anchorRef,
  'aria-label': ariaLabel,
  id,
  align = 'right',
  width = 240,
  mobileFullWidth = false,
  autoFocusPanel = false,
  portal = false,
  children,
  className,
}: PopoverProps) {
  const featureTheme = useFeatureTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  useLayoutEffect(() => {
    openRef.current = open;
  }, [open]);
  const reducedMotion = useReducedMotion();
  const [geometry, setGeometry] = useState<PopoverGeometry | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor || typeof window === 'undefined') {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 16;

    let nextOuterStyle: CSSProperties;
    let nextSurfaceStyle: CSSProperties;
    let flipped = false;

    if (mobileFullWidth && viewportW < 640) {
      const top = Math.min(rect.bottom + 8, viewportH - 120);
      const boundedTop = Math.max(margin, top);
      nextOuterStyle = {
        position: 'fixed',
        top: boundedTop,
        left: margin,
        right: margin,
      };
      nextSurfaceStyle = {
        maxHeight: Math.max(0, viewportH - boundedTop - margin),
        overflowY: 'auto',
      };
    } else {
      const effectiveWidth = Math.min(width, viewportW - margin * 2);
      let left = align === 'right' ? rect.right - effectiveWidth : rect.left;
      left = Math.max(margin, Math.min(left, viewportW - effectiveWidth - margin));

      const panelEl = panelRef.current;
      const contentScrollHeight = panelEl?.firstElementChild?.scrollHeight ?? 0;
      const panelHeight = panelEl ? Math.max(panelEl.offsetHeight, contentScrollHeight) : 260;
      const spaceBelow = viewportH - rect.bottom - margin;
      flipped = spaceBelow < Math.min(panelHeight, 220) && rect.top > spaceBelow;
      const top = flipped
        ? Math.max(margin, rect.top - panelHeight - 8)
        : Math.max(margin, rect.bottom + 8);

      nextOuterStyle = {
        position: 'fixed',
        top,
        left,
        width: effectiveWidth,
      };
      nextSurfaceStyle = {
        maxHeight: Math.max(0, viewportH - top - margin),
        overflowY: 'auto',
      };
    }

    setGeometry((prev) =>
      prev &&
      prev.flipped === flipped &&
      sameStyle(prev.outerStyle, nextOuterStyle) &&
      sameStyle(prev.surfaceStyle, nextSurfaceStyle)
        ? prev
        : { outerStyle: nextOuterStyle, surfaceStyle: nextSurfaceStyle, flipped },
    );
  }, [align, anchorRef, mobileFullWidth, width]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
  }, [open, updatePosition, geometry?.outerStyle.width]);

  const hasGeometry = geometry !== null;

  useEffect(() => {
    if (!open || !autoFocusPanel || !hasGeometry) {
      return;
    }
    panelRef.current?.focus({ preventScroll: true });
  }, [open, autoFocusPanel, hasGeometry]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let rafId = 0;
    let needsFrameUpdate = false;

    const flushReposition = () => {
      rafId = 0;
      if (!openRef.current || !needsFrameUpdate) {
        needsFrameUpdate = false;
        return;
      }
      needsFrameUpdate = false;
      updatePosition();
    };

    const scheduleReposition = () => {
      needsFrameUpdate = true;
      if (rafId !== 0) {
        return;
      }
      rafId = window.requestAnimationFrame(flushReposition);
    };

    const handleResize = () => {
      if (rafId === 0) {
        // Update immediately on the leading edge, then coalesce burst events until next frame.
        updatePosition();
        needsFrameUpdate = false;
        rafId = window.requestAnimationFrame(flushReposition);
        return;
      }
      needsFrameUpdate = true;
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        anchorRef.current?.focus({ preventScroll: true });
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleReposition);
      if (panelRef.current) resizeObserver.observe(panelRef.current);
      if (anchorRef.current) resizeObserver.observe(anchorRef.current);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', scheduleReposition, { capture: true, passive: true });

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      needsFrameUpdate = false;
      resizeObserver?.disconnect();
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', scheduleReposition, true);
    };
  }, [open, onClose, anchorRef, updatePosition]);

  const originClass = geometry?.flipped
    ? align === 'right'
      ? 'origin-bottom-right'
      : 'origin-bottom-left'
    : align === 'right'
      ? 'origin-top-right'
      : 'origin-top-left';

  const activeOuterStyle = geometry ? geometry.outerStyle : UNMEASURED_STYLE;

  const panel = (
    <AnimatePresence
      onExitComplete={() => {
        if (!openRef.current) {
          setGeometry(null);
        }
      }}
    >
      {open ? (
        <div
          ref={panelRef}
          id={id}
          data-feature-theme={featureTheme}
          data-theme="workspace"
          role="dialog"
          aria-label={ariaLabel}
          tabIndex={-1}
          style={{ ...activeOuterStyle, zIndex: 'var(--z-popover)' }}
          className="rounded-card"
        >
          <motion.div
            style={geometry?.surfaceStyle}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={
              geometry
                ? reducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0 }
            }
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
            transition={{
              duration: reducedMotion ? 0 : MOTION_DURATION.popoverOpen,
              ease: MOTION_EASE,
            }}
            className={cn(
              originClass,
              'rounded-card bg-ws-surface text-ws-text border border-ws-border shadow-popover',
              className,
            )}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
  return portal && typeof document !== 'undefined' ? createPortal(panel, document.body) : panel;
}
