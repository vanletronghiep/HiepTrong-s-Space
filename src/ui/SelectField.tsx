'use client';

import { useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Button as AriaButton,
  Label as AriaLabel,
  ListBox,
  ListBoxItem,
  Popover as AriaPopover,
  Select as AriaSelect,
  SelectValue,
} from 'react-aria-components';
import { cn } from './cn';
import { useOverlayTheme } from './overlay-theme';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string = string> {
  id?: string;
  value: T;
  onChange: (nextValue: T) => void;
  options: readonly SelectOption<T>[];
  label?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  triggerClassName?: string;
}

export function SelectField<T extends string = string>({
  id,
  value,
  onChange,
  options,
  label,
  ariaLabel,
  ariaDescribedBy,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  size = 'md',
  className,
  triggerClassName,
}: SelectFieldProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const valueRef = useRef<T>(value);
  const onChangeRef = useRef(onChange);
  const { themeAttributes, refreshTheme } = useOverlayTheme(triggerRef);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const button = triggerRef.current;
    if (!button) {
      return;
    }
    let pendingDomValue: string | null = null;
    Object.defineProperty(button, 'value', {
      configurable: true,
      get: () => pendingDomValue ?? button.getAttribute('value') ?? valueRef.current,
      set: (nextValue: unknown) => {
        pendingDomValue = typeof nextValue === 'string' ? nextValue : String(nextValue ?? '');
      },
    });
    const handleDomChange = () => {
      const attrValue = button.getAttribute('value');
      const rawNext = pendingDomValue ?? attrValue;
      if (rawNext === null) {
        return;
      }
      pendingDomValue = null;
      if (attrValue !== null) {
        button.removeAttribute('value');
      }
      const next = rawNext as T;
      valueRef.current = next;
      onChangeRef.current(next);
    };
    button.addEventListener('change', handleDomChange);
    button.addEventListener('input', handleDomChange);
    return () => {
      button.removeEventListener('change', handleDomChange);
      button.removeEventListener('input', handleDomChange);
    };
  }, []);

  return (
    <AriaSelect
      value={value}
      onChange={(nextKey) => {
        if (nextKey !== null) {
          onChange(String(nextKey) as T);
        }
      }}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          refreshTheme();
        }
      }}
      isDisabled={disabled}
      isInvalid={error}
      aria-label={label ? undefined : (ariaLabel ?? placeholder)}
      aria-describedby={ariaDescribedBy}
      placeholder={placeholder}
      className={cn('relative flex flex-col gap-1', className)}
    >
      {label ? (
        <AriaLabel className="text-[length:var(--fs-small)] font-medium text-ws-text">
          {label}
        </AriaLabel>
      ) : null}

      <AriaButton
        ref={triggerRef}
        id={id}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-item border bg-ws-surface text-left text-ws-text cursor-pointer select-none',
          'transition-[border-color,background-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease)]',
          'hover:border-[color-mix(in_srgb,var(--ws-accent)_75%,var(--ws-border))]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ws-focus)]',
          'data-[disabled]:opacity-45 data-[disabled]:cursor-not-allowed',
          error ? 'border-tint-overdue-border' : 'border-ws-border',
          size === 'sm'
            ? 'min-h-[34px] px-2.5 text-[length:var(--fs-small)]'
            : 'min-h-[42px] px-3 text-[length:var(--fs-small)]',
          triggerClassName,
        )}
      >
        <SelectValue className="truncate data-[placeholder]:text-ws-text-muted" />
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="shrink-0 text-ws-text-muted transition-transform duration-[var(--dur-fast)]"
        />
      </AriaButton>

      <AriaPopover
        data-overlay-popup="true"
        offset={6}
        {...themeAttributes}
        style={{ zIndex: 'var(--z-toast)' }}
        className="w-[var(--trigger-width,180px)] min-w-[180px] max-w-[320px] rounded-card border border-ws-border bg-ws-surface p-1.5 text-ws-text shadow-popover outline-none"
      >
        <ListBox className="max-h-[260px] overflow-y-auto space-y-0.5 outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className={cn(
                'flex items-center justify-between gap-2 rounded-item px-2.5 py-2 text-[length:var(--fs-small)] text-ws-text cursor-pointer outline-none select-none',
                'data-[focused]:bg-ws-accent-soft data-[hovered]:bg-ws-accent-soft',
                'data-[selected]:bg-[color-mix(in_srgb,var(--ws-accent)_18%,var(--ws-surface))] data-[selected]:font-medium',
              )}
            >
              {({ isSelected }) => (
                <>
                  <span className="truncate">{option.label}</span>
                  {isSelected ? (
                    <Check size={14} aria-hidden="true" className="shrink-0 text-ws-accent" />
                  ) : null}
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </AriaPopover>
    </AriaSelect>
  );
}
