'use client';

import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import Link from 'next/link';
import { preloadZodiacEnhancement } from '@/features/zodiac/loader';
import { getRouteZodiacSign } from './route-zodiac';
import { parseInternalHref } from './transition-rules';
import { useTransitionRouter } from './TransitionProvider';

export interface TransitionLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  prefetch?: boolean;
}

/** Warms the destination zodiac's drawing data on hover/focus so the loader can start drawing sooner. */
function warmDestination(href: string): void {
  const parsed = parseInternalHref(href);
  const sign = parsed ? getRouteZodiacSign(parsed.pathname) : null;
  if (sign && typeof fetch === 'function') {
    void preloadZodiacEnhancement(sign);
  }
}

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  function TransitionLink(
    { href, onClick, onPointerEnter, onFocus, target, prefetch, children, ...props },
    ref,
  ) {
    const transitionRouter = useTransitionRouter();

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (target && target !== '_self') {
        return;
      }
      if (isModifiedEvent(event)) {
        return;
      }
      if (!href.startsWith('/')) {
        return;
      }

      event.preventDefault();
      transitionRouter.push(href);
    };

    return (
      <Link
        ref={ref}
        href={href}
        target={target}
        prefetch={prefetch}
        onClick={handleClick}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          warmDestination(href);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          warmDestination(href);
        }}
        {...props}
      >
        {children}
      </Link>
    );
  },
);
