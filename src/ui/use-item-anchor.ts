'use client';
import { useEffect } from 'react';

/** Reveal a notification's entity after asynchronous collection loading. */
export function useItemAnchor(items: readonly { id: string }[]): void {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('item');
    if (!id || !items.some((item) => item.id === id)) return;
    const element = document.getElementById(`item-${id}`);
    element?.scrollIntoView({ block: 'center' });
    element?.focus({ preventScroll: true });
  }, [items]);
}
