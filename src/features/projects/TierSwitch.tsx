'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/ui/cn';
import styles from './projects.module.css';

export interface TierOption<K extends string> {
  key: K;
  label: string;
  count: number;
  /** Decorative mark before the label, when the tier has one. */
  icon?: ReactNode;
}

/** Centred pill switcher whose highlight slides to the chosen option. */
export function TierSwitch<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly TierOption<K>[];
  value: K;
  onChange: (key: K) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<K, HTMLButtonElement>());

  const place = useCallback(() => {
    const track = trackRef.current;
    const active = buttons.current.get(value);
    if (!track || !active) return;
    track.style.setProperty('--ind-x', `${active.offsetLeft}px`);
    track.style.setProperty('--ind-w', `${active.offsetWidth}px`);
  }, [value]);

  useLayoutEffect(place, [place, options]);
  useEffect(() => {
    window.addEventListener('resize', place);
    void document.fonts?.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [place]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = options.findIndex((option) => option.key === value);
    let next = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = (index + 1) % options.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + options.length) % options.length;
    } else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    const target = options[next];
    if (!target) return;
    event.preventDefault();
    onChange(target.key);
    buttons.current.get(target.key)?.focus();
  };

  return (
    <div className={styles.switchRow}>
      <div
        ref={trackRef}
        className={styles.switchTrack}
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        <span className={styles.switchIndicator} aria-hidden="true" />
        {options.map((option) => (
          <button
            key={option.key}
            ref={(node) => {
              if (node) buttons.current.set(option.key, node);
              else buttons.current.delete(option.key);
            }}
            type="button"
            role="radio"
            aria-checked={option.key === value}
            tabIndex={option.key === value ? 0 : -1}
            className={cn(styles.switchOption)}
            onClick={() => onChange(option.key)}
          >
            {option.icon ?? null}
            {option.label}
            <span className={styles.switchCount}>{option.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
