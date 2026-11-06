'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const focusStack: RefObject<HTMLElement | null>[] = [];

export function useFocusTrap(options: {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}): void {
  const { open, containerRef, initialFocusRef, onClose } = options;
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusStack.push(containerRef);
    const isTopmost = () => focusStack.at(-1) === containerRef;

    const focusTimer = window.setTimeout(() => {
      if (!isTopmost()) return;
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        container.focus();
      }
    }, 10);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopmost()) return;
      if (event.key === 'Escape') {
        if (containerRef.current?.querySelector('[role="dialog"]:not([aria-modal="true"])')) return;
        event.stopPropagation();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }

      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      const restore = isTopmost();
      const index = focusStack.lastIndexOf(containerRef);
      if (index >= 0) focusStack.splice(index, 1);
      if (!restore) return;
      const parent = focusStack.at(-1)?.current;
      if (previouslyFocused?.isConnected && (!parent || parent.contains(previouslyFocused))) {
        previouslyFocused.focus();
      } else if (parent) {
        (parent.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? parent).focus();
      }
    };
  }, [open, containerRef, initialFocusRef]);
}
