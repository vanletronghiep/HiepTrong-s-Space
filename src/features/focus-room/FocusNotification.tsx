'use client';

import { useEffect } from 'react';
import { Coffee, Play, Sprout, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';

export type FocusNotificationKind = 'focus' | 'break' | 'done';

export interface FocusNotificationItem {
  id: number;
  kind: FocusNotificationKind;
  title: string;
  body: string;
  /** Label of the button that opens the Focus Room. Omitted when you are already there. */
  actionLabel?: string;
}

const AUTO_DISMISS_MS = 8000;

const ICONS = { focus: Play, break: Coffee, done: Sprout } as const;

interface FocusNotificationProps {
  item: FocusNotificationItem | null;
  onDismiss: () => void;
  onAction: () => void;
}

/** A desktop-style notice in the bottom-right corner that fades away on its own. */
export function FocusNotification({ item, onDismiss, onAction }: FocusNotificationProps) {
  const reducedMotion = useReducedMotion();
  const id = item?.id;

  useEffect(() => {
    if (id === undefined) return undefined;
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [id, onDismiss]);

  const Icon = item ? ICONS[item.kind] : Play;

  return (
    <div
      data-theme="workspace"
      data-feature-theme="learning-room"
      style={{ zIndex: 'var(--z-toast)' }}
      className="pointer-events-none fixed bottom-5 right-5 w-[22.5rem] max-w-[calc(100%-2.5rem)] bg-transparent"
    >
      <AnimatePresence>
        {item ? (
          <motion.div
            key={item.id}
            role="status"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reducedMotion ? 0 : MOTION_DURATION.base, ease: MOTION_EASE }}
            className="pointer-events-auto flex flex-col gap-3 rounded-card border border-ws-border bg-ws-surface p-4 text-ws-text shadow-popover"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-9 shrink-0 items-center justify-center rounded-item',
                  item.kind === 'focus' ? 'bg-ws-accent text-ws-surface' : 'bg-ws-accent-soft',
                )}
              >
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[length:var(--fs-ui)] font-semibold">{item.title}</span>
                <span className="text-[length:var(--fs-small)] text-ws-text-muted">
                  {item.body}
                </span>
              </span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={onDismiss}
                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text"
              >
                <X size={14} strokeWidth={1.6} />
              </button>
            </div>
            {item.actionLabel ? (
              <div className="flex justify-end">
                <Button variant="primary" size="sm" pill onClick={onAction}>
                  {item.actionLabel}
                </Button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
