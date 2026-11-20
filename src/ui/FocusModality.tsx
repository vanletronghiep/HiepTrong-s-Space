'use client';

import { useEffect } from 'react';

const ATTRIBUTE = 'data-keyboard-nav';
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'OS']);

/**
 * Tracks whether the last interaction was real keyboard navigation. Chrome treats a lone Shift
 * press as keyboard input and re-applies `:focus-visible` to a mouse-focused element, which drew
 * a stray outline. `globals.css` hides focus outlines unless `<html data-keyboard-nav>` is set.
 */
export function FocusModality() {
  useEffect(() => {
    const root = document.documentElement;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.key || event.key === 'Unidentified' || MODIFIER_KEYS.has(event.key)) return;
      root.setAttribute(ATTRIBUTE, '');
    };
    const onPointerDown = () => root.removeAttribute(ATTRIBUTE);

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      root.removeAttribute(ATTRIBUTE);
    };
  }, []);

  return null;
}
