'use client';

import { useEffect, useRef } from 'react';

export interface TabTitleAlert {
  text: string;
  /** Changes for every new alert, so the same text can flash again. */
  key: number;
}

export interface TabTitleState {
  /** Live title. `null` leaves the page title untouched. */
  title: string | null;
  /** A new alert flashes the title twice, then the live title returns. */
  alert: TabTitleAlert | null;
}

const BLINK_MS = 1200;
/** Alert, title, alert, title: two flashes. */
const FLASH_STEPS = 4;
const ICON_HREF = '/icon.svg';

let iconLink: HTMLLinkElement | null = null;
let originalIconHref: string | null = null;
let dottedIconHref: string | null = null;

function ensureIconLink(): HTMLLinkElement {
  if (iconLink && document.head.contains(iconLink)) return iconLink;
  const existing = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (existing) {
    iconLink = existing;
  } else {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    document.head.appendChild(iconLink);
  }
  return iconLink;
}

function buildDottedIcon(): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(image, 0, 0, 64, 64);
        const dot = getComputedStyle(document.documentElement)
          .getPropertyValue('--status-overdue')
          .trim();
        ctx.fillStyle = dot || 'red';
        ctx.beginPath();
        ctx.arc(50, 14, 12, 0, Math.PI * 2);
        ctx.fill();
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = ICON_HREF;
  });
}

async function setIconDot(on: boolean): Promise<void> {
  if (typeof document === 'undefined') return;
  const link = ensureIconLink();
  if (originalIconHref === null) originalIconHref = link.getAttribute('href') ?? ICON_HREF;
  if (!on) {
    link.setAttribute('href', originalIconHref);
    return;
  }
  if (dottedIconHref === null) dottedIconHref = (await buildDottedIcon()) ?? '';
  if (dottedIconHref) link.setAttribute('href', dottedIconHref);
}

/**
 * Drives `document.title` like a chat tab: a live title, and a new alert that flashes the title
 * twice (with a red dot on the icon) before the live title comes back. Restores the original
 * title and icon on unmount.
 */
export function useTabTitle({ title, alert }: TabTitleState): void {
  const originalTitle = useRef<string | null>(null);
  const baseTitle = useRef<string | null>(null);
  const flashing = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (originalTitle.current === null) originalTitle.current = document.title;
    baseTitle.current = title ?? originalTitle.current;
    if (!flashing.current) document.title = baseTitle.current;
  }, [title]);

  const alertText = alert?.text;
  const alertKey = alert?.key;
  useEffect(() => {
    if (typeof document === 'undefined' || alertText === undefined) return undefined;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let step = 0;
    flashing.current = true;
    void setIconDot(true);

    const show = () => {
      // Reduced motion keeps the alert on screen for two beats instead of alternating.
      const showAlert = reduceMotion ? step < FLASH_STEPS / 2 : step % 2 === 0;
      document.title = showAlert ? alertText : (baseTitle.current ?? alertText);
      step += 1;
    };
    show();
    const timer = setInterval(() => {
      if (step >= FLASH_STEPS) {
        clearInterval(timer);
        flashing.current = false;
        document.title = baseTitle.current ?? document.title;
        void setIconDot(false);
        return;
      }
      show();
    }, BLINK_MS);

    return () => {
      clearInterval(timer);
      flashing.current = false;
      void setIconDot(false);
    };
  }, [alertText, alertKey]);

  useEffect(
    () => () => {
      if (typeof document === 'undefined') return;
      if (originalTitle.current !== null) document.title = originalTitle.current;
      void setIconDot(false);
    },
    [],
  );
}
