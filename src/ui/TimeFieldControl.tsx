'use client';

import { useMemo, useRef, useState } from 'react';
import { Time } from '@internationalized/date';
import { Clock3 } from 'lucide-react';
import {
  Button as AriaButton,
  DateInput,
  DateSegment,
  Dialog as AriaDialog,
  DialogTrigger,
  I18nProvider,
  Popover as AriaPopover,
  TimeField as AriaTimeField,
} from 'react-aria-components';
import { cn } from './cn';
import { useOverlayTheme } from './overlay-theme';

export interface TimeFieldControlProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  label?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

const TIME_PRESETS = ['08:00', '09:00', '12:00', '14:00', '18:00', '21:00', '23:59'] as const;

function parseTimeString(raw: string): Time | null {
  const match = /^(\d{2}):(\d{2})$/.exec(raw.trim());
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return new Time(hour, minute);
}

function formatTimeValue(time: Time): string {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
}

export function TimeFieldControl({
  id,
  value,
  onChange,
  label,
  ariaLabel,
  ariaDescribedBy,
  placeholder = '23:59',
  disabled = false,
  error = false,
  className,
}: TimeFieldControlProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { themeAttributes, refreshTheme } = useOverlayTheme(triggerRef);

  const parsedTime = useMemo(() => parseTimeString(value), [value]);

  return (
    <div className={cn('relative flex flex-col gap-1', className)}>
      {label ? (
        <label htmlFor={id} className="text-[length:var(--fs-small)] font-medium text-ws-text">
          {label}
        </label>
      ) : null}

      <div
        data-focus-field
        className={cn(
          'flex min-h-[42px] items-center rounded-item border bg-ws-surface pr-1',
          error ? 'border-tint-overdue-border' : 'border-ws-border',
          disabled && 'opacity-45 pointer-events-none',
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label ? undefined : (ariaLabel ?? 'Time (24-hour HH:mm)')}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error || undefined}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[length:var(--fs-small)] tabular-nums text-ws-text placeholder:text-ws-text-muted/75 outline-none"
        />

        <DialogTrigger
          isOpen={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen) {
              refreshTheme();
            }
            setOpen(nextOpen);
          }}
        >
          <AriaButton
            ref={triggerRef}
            isDisabled={disabled}
            aria-label="Open 24-hour time picker"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer"
            data-focus-tint
          >
            <Clock3 size={15} aria-hidden="true" />
          </AriaButton>

          <AriaPopover
            data-overlay-popup="true"
            offset={6}
            placement="bottom end"
            {...themeAttributes}
            style={{ zIndex: 'var(--z-toast)' }}
            className="w-[244px] rounded-card border border-ws-border bg-ws-surface p-3 text-ws-text shadow-popover outline-none"
          >
            <AriaDialog aria-label="24-hour time entry" className="outline-none">
              <div
                className="space-y-3"
                onKeyDown={(event) => {
                  // Enter saves: the time is already applied live, so Enter just closes the popover.
                  if (event.key === 'Enter' && !(event.target as HTMLElement).closest('button')) {
                    event.preventDefault();
                    setOpen(false);
                  }
                }}
              >
                <I18nProvider locale="en-GB">
                  <div className="space-y-1">
                    <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted block">
                      24-hour time (1-minute steps)
                    </span>
                    <AriaTimeField
                      aria-label="24-hour time"
                      hourCycle={24}
                      granularity="minute"
                      value={parsedTime ?? new Time(9, 0)}
                      onChange={(nextTime) => {
                        if (nextTime) {
                          onChange(formatTimeValue(nextTime));
                        }
                      }}
                    >
                      <DateInput className="inline-flex w-full items-center justify-center gap-0.5 rounded-item border border-ws-border bg-[color-mix(in_srgb,var(--ws-bg)_45%,var(--ws-surface))] px-3 py-1.5 text-[length:var(--fs-body)] font-medium tabular-nums">
                        {(segment) => (
                          <DateSegment
                            segment={segment}
                            className="rounded-[4px] px-1 py-0.5 outline-none focus:bg-[var(--focus-tint-selected)] focus:text-ws-text data-[placeholder]:text-ws-text-muted"
                          />
                        )}
                      </DateInput>
                    </AriaTimeField>
                  </div>
                </I18nProvider>

                <div className="space-y-1.5">
                  <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted block">
                    Quick times
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          onChange(preset);
                          setOpen(false);
                        }}
                        className={cn(
                          'rounded-sm border px-1.5 py-1 text-[length:var(--fs-micro)] tabular-nums cursor-pointer transition-colors duration-[var(--dur-fast)]',
                          value === preset
                            ? 'border-ws-accent bg-ws-accent-soft font-medium text-ws-text'
                            : 'border-ws-border bg-ws-surface text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text',
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AriaDialog>
          </AriaPopover>
        </DialogTrigger>
      </div>
    </div>
  );
}
