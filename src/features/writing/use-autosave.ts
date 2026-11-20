'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const DEFAULT_DELAY_MS = 800;

/**
 * Debounced autosave. Changes queue into one patch, which is sent after a short pause, when
 * the tab is hidden, and when the component unmounts (for example when another page opens).
 */
export function useAutosave<TPatch extends object>(
  save: (patch: TPatch) => Promise<unknown>,
  delay: number = DEFAULT_DELAY_MS,
) {
  const [state, setState] = useState<SaveState>('idle');
  const pending = useRef<Partial<TPatch>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const saveRef = useRef(save);
  const mounted = useRef(true);
  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(async (): Promise<void> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    // Wait for a save already in flight so patches reach the server in order.
    if (inFlight.current) await inFlight.current.catch(() => undefined);
    const patch = pending.current;
    if (Object.keys(patch).length === 0) return;
    pending.current = {};
    if (mounted.current) setState('saving');
    const run = (async () => {
      try {
        await saveRef.current(patch as TPatch);
        if (mounted.current) setState(Object.keys(pending.current).length ? 'dirty' : 'saved');
      } catch (error) {
        // Keep the change so the next attempt carries it.
        pending.current = { ...patch, ...pending.current };
        if (mounted.current) setState('error');
        throw error;
      }
    })();
    inFlight.current = run;
    try {
      await run;
    } finally {
      if (inFlight.current === run) inFlight.current = null;
    }
  }, []);

  const queue = useCallback(
    (patch: Partial<TPatch>) => {
      pending.current = { ...pending.current, ...patch };
      setState('dirty');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush().catch(() => undefined);
      }, delay);
    },
    [delay, flush],
  );

  useEffect(() => {
    mounted.current = true;
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      mounted.current = false;
      void flush().catch(() => undefined);
    };
  }, [flush]);

  return { queue, flush, state };
}

export function saveStateLabel(state: SaveState): string {
  switch (state) {
    case 'dirty':
      return 'Unsaved changes';
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'Saved just now';
    case 'error':
      return 'Could not save. Retrying with your next change.';
    default:
      return '';
  }
}
