'use client';

import type { MouseEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from './cn';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-label'?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  stopPropagation?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  'aria-label': ariaLabel,
  label,
  id,
  disabled = false,
  size = 'md',
  stopPropagation = true,
  className,
}: CheckboxProps) {
  const reducedMotion = useReducedMotion();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const buttonNode = (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'group relative inline-flex items-center justify-center rounded-sm cursor-pointer select-none shrink-0',
        size === 'md' ? 'h-7 w-7 -m-1' : 'h-6 w-6 -m-1',
        disabled && 'opacity-45 pointer-events-none cursor-not-allowed',
        !label && className,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-[6px] border-[1.5px] transition-[background-color,border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease)] motion-reduce:transition-none motion-reduce:duration-0',
          reducedMotion && 'transition-none duration-0',
          size === 'md' ? 'h-5 w-5' : 'h-4 w-4',
          checked
            ? 'bg-fill-checkbox-checked border-fill-checkbox-checked text-ws-surface shadow-[0_1px_2px_color-mix(in_srgb,var(--ws-text)_12%,transparent)]'
            : 'bg-ws-surface border-[color-mix(in_srgb,var(--ws-text-muted)_82%,var(--ws-text))] group-hover:border-ws-accent group-hover:shadow-[0_0_0_3px_var(--ws-accent-soft)]',
        )}
      >
        <svg
          viewBox="0 0 16 16"
          width={size === 'md' ? 12 : 10}
          height={size === 'md' ? 12 : 10}
          aria-hidden="true"
          className="overflow-visible"
        >
          <path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="motion-reduce:transition-none"
            style={{
              strokeDasharray: 16,
              strokeDashoffset: checked ? 0 : 16,
              transition: reducedMotion ? 'none' : 'stroke-dashoffset 200ms var(--ease)',
            }}
          />
        </svg>
      </span>
    </button>
  );

  if (!label) {
    return buttonNode;
  }

  return (
    <label
      className={cn(
        'inline-flex min-h-[44px] items-center gap-2.5 cursor-pointer select-none text-[length:var(--fs-small)] text-ws-text',
        disabled && 'opacity-45 cursor-not-allowed',
        className,
      )}
    >
      {buttonNode}
      <span className="leading-[var(--lh-body)]">{label}</span>
    </label>
  );
}
