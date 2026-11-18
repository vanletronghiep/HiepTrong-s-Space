'use client';

import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { cn } from '@/ui/cn';
import { useFeatureTheme } from '@/ui/FeatureTheme';
import { useFocusTrap } from '@/ui/use-focus-trap';
import styles from './events-overlays.module.css';

export interface EventsModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Plain-text accessible name when `title` contains markup. */
  ariaLabel?: string;
  size: 'reader' | 'calendar';
  headerExtra?: ReactNode;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeLabel?: string;
  children: ReactNode;
  testId?: string;
}

/**
 * Centered themed surface for the Events reader and Week Calendar (v3.1 §6.3–6.4).
 * Desktop: 75% (reader, ≤1140px) or 80% (calendar, ≤1440px) wide, ≤90dvh with internal
 * scrolling. Below 768px: full-screen. Uses the shared focus-trap stack, so a reader opened
 * from the calendar becomes the single active trap and Escape/focus restore return to it.
 */
export function EventsModal({
  open,
  onClose,
  title,
  ariaLabel,
  size,
  headerExtra,
  footer,
  initialFocusRef,
  closeLabel = 'Close',
  children,
  testId,
}: EventsModalProps) {
  const featureTheme = useFeatureTheme();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useFocusTrap({ open, containerRef: panelRef, initialFocusRef, onClose });

  const node = (
    <AnimatePresence>
      {open ? (
        <div style={{ zIndex: 'var(--z-drawer)' }} className={styles.layer}>
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : MOTION_DURATION.fast, ease: MOTION_EASE }}
            onClick={onClose}
            className={styles.scrim}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabel ? undefined : titleId}
            aria-label={ariaLabel}
            tabIndex={-1}
            data-testid={testId}
            data-theme="workspace"
            data-feature-theme={featureTheme}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : MOTION_DURATION.base, ease: MOTION_EASE }}
            className={cn(styles.panel, size === 'reader' ? styles.reader : styles.calendar)}
          >
            <header className={styles.header}>
              <div id={titleId} className={styles.headerTitle}>
                {title}
              </div>
              {headerExtra}
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className={styles.closeButton}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.body}>{children}</div>
            {footer ? <footer className={styles.footer}>{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
