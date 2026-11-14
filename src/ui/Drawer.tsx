'use client';

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { IconButton } from './IconButton';
import { cn } from './cn';
import { useFeatureTheme } from './FeatureTheme';
import { useFocusTrap } from './use-focus-trap';

let openDrawers = 0;
let savedOverflow = '';

const DESKTOP_DRAWER_MEDIA_QUERY = '(min-width: 768px)';

function subscribeDrawerMedia(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  if (typeof window.matchMedia === 'function') {
    const mql = window.matchMedia(DESKTOP_DRAWER_MEDIA_QUERY);
    if (typeof mql?.addEventListener === 'function') {
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    }
    if (typeof mql?.addListener === 'function') {
      mql.addListener(callback);
      return () => mql.removeListener(callback);
    }
    return () => {};
  }
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getIsDesktopDrawer(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(DESKTOP_DRAWER_MEDIA_QUERY).matches;
  }
  return window.innerWidth >= 768;
}

function getServerDesktopDrawer(): boolean {
  return true;
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  portal?: boolean;
}

export function Drawer({
  open,
  onClose,
  title,
  initialFocusRef,
  children,
  footer,
  className,
  portal = false,
}: DrawerProps) {
  const featureTheme = useFeatureTheme();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const isDesktop = useSyncExternalStore(
    subscribeDrawerMedia,
    getIsDesktopDrawer,
    getServerDesktopDrawer,
  );

  useFocusTrap({
    open,
    containerRef: panelRef,
    initialFocusRef,
    onClose,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    if (openDrawers === 0) savedOverflow = document.body.style.overflow;
    openDrawers += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      openDrawers -= 1;
      if (openDrawers === 0) document.body.style.overflow = savedOverflow;
    };
  }, [open]);

  const drawer = (
    <AnimatePresence>
      {open ? (
        <div
          style={{ zIndex: 'var(--z-drawer)' }}
          className="fixed inset-0 flex items-end md:items-stretch md:justify-end"
        >
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0 : MOTION_DURATION.drawerClose,
              ease: MOTION_EASE,
            }}
            onClick={onClose}
            className="fixed inset-0 bg-ws-scrim"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : isDesktop
                  ? { opacity: 0, x: 24 }
                  : { opacity: 0, y: 24 }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : isDesktop
                  ? { opacity: 1, x: 0 }
                  : { opacity: 1, y: 0 }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : isDesktop
                  ? { opacity: 0, x: 16 }
                  : { opacity: 0, y: 16 }
            }
            transition={{
              duration: reducedMotion ? 0 : MOTION_DURATION.base,
              ease: MOTION_EASE,
            }}
            data-theme="workspace"
            data-feature-theme={featureTheme}
            className={cn(
              'relative flex flex-col w-full max-h-[90dvh] rounded-t-[20px] bg-ws-surface text-ws-text border border-ws-border shadow-drawer',
              'md:max-h-none md:h-full md:w-[420px] lg:w-[440px] md:rounded-t-none md:rounded-l-[20px]',
              className,
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-ws-border shrink-0">
              <h2
                id={titleId}
                className="font-display text-[1.5rem] leading-[var(--lh-heading)] font-medium text-ws-text"
              >
                {title}
              </h2>
              <IconButton aria-label="Close drawer" size="sm" onClick={onClose}>
                <X size={18} strokeWidth={1.5} />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-ws-border bg-ws-surface shrink-0">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
  return portal && typeof document !== 'undefined' ? createPortal(drawer, document.body) : drawer;
}
