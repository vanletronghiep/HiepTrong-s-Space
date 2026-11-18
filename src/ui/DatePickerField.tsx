'use client';

import { useMemo, useRef, useState } from 'react';
import { getLocalTimeZone, parseDate, today, type CalendarDate } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  Dialog as AriaDialog,
  DialogTrigger,
  Popover as AriaPopover,
} from 'react-aria-components';
import { Button } from './Button';
import { cn } from './cn';
import { useOverlayTheme } from './overlay-theme';

export type DateFieldMode = 'iso' | 'task';

export interface DatePickerFieldProps {
  id?: string;
  value: string;
  onChange: (nextValue: string) => void;
  mode?: DateFieldMode;
  referenceYear?: number;
  label?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

function parseTaskOrIsoToCalendarDate(raw: string, referenceYear: number): CalendarDate | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    try {
      return parseDate(trimmed);
    } catch {
      return null;
    }
  }

  const fullSlashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (fullSlashMatch) {
    const dd = String(Number(fullSlashMatch[1])).padStart(2, '0');
    const mm = String(Number(fullSlashMatch[2])).padStart(2, '0');
    const yyyy = fullSlashMatch[3];
    try {
      return parseDate(`${yyyy}-${mm}-${dd}`);
    } catch {
      return null;
    }
  }

  const shortSlashMatch = /^(\d{1,2})\/(\d{1,2})$/.exec(trimmed);
  if (shortSlashMatch) {
    const dd = String(Number(shortSlashMatch[1])).padStart(2, '0');
    const mm = String(Number(shortSlashMatch[2])).padStart(2, '0');
    try {
      return parseDate(`${referenceYear}-${mm}-${dd}`);
    } catch {
      return null;
    }
  }

  return null;
}

function formatCalendarDateForMode(
  date: CalendarDate,
  mode: DateFieldMode,
  referenceYear: number,
): string {
  const yyyy = String(date.year).padStart(4, '0');
  const mm = String(date.month).padStart(2, '0');
  const dd = String(date.day).padStart(2, '0');
  if (mode === 'iso') {
    return `${yyyy}-${mm}-${dd}`;
  }
  return date.year === referenceYear ? `${dd}/${mm}` : `${dd}/${mm}/${yyyy}`;
}

export function DatePickerField({
  id,
  value,
  onChange,
  mode = 'iso',
  referenceYear = new Date().getFullYear(),
  label,
  ariaLabel,
  ariaDescribedBy,
  placeholder,
  clearable = false,
  disabled = false,
  error = false,
  className,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { themeAttributes, refreshTheme } = useOverlayTheme(triggerRef);

  const selectedCalendarDate = useMemo(
    () => parseTaskOrIsoToCalendarDate(value, referenceYear),
    [referenceYear, value],
  );

  const defaultFocusedDate = useMemo(
    () => selectedCalendarDate ?? today(getLocalTimeZone()),
    [selectedCalendarDate],
  );

  const resolvedPlaceholder =
    placeholder ?? (mode === 'task' ? 'DD/MM or YYYY-MM-DD' : 'YYYY-MM-DD');

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
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          aria-label={label ? undefined : (ariaLabel ?? 'Date')}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error || undefined}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[length:var(--fs-small)] text-ws-text placeholder:text-ws-text-muted/75 outline-none"
        />

        {clearable && value && !disabled ? (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => onChange('')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}

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
            aria-label="Open calendar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer"
            data-focus-tint
          >
            <CalendarDays size={16} aria-hidden="true" />
          </AriaButton>

          <AriaPopover
            data-overlay-popup="true"
            offset={6}
            placement="bottom end"
            {...themeAttributes}
            style={{ zIndex: 'var(--z-toast)' }}
            className="rounded-card border border-ws-border bg-ws-surface p-3 text-ws-text shadow-popover outline-none"
          >
            <AriaDialog aria-label="Calendar picker" className="outline-none">
              <Calendar
                value={selectedCalendarDate}
                defaultFocusedValue={defaultFocusedDate}
                onChange={(picked) => {
                  onChange(formatCalendarDateForMode(picked as CalendarDate, mode, referenceYear));
                  setOpen(false);
                }}
                className="w-[260px] select-none"
              >
                <header className="mb-2.5 flex items-center justify-between gap-2">
                  <AriaButton
                    slot="previous"
                    aria-label="Previous month"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </AriaButton>
                  <CalendarHeading className="text-[length:var(--fs-small)] font-semibold text-ws-text" />
                  <AriaButton
                    slot="next"
                    aria-label="Next month"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </AriaButton>
                </header>

                <CalendarGrid className="w-full border-collapse">
                  <CalendarGridHeader>
                    {(day) => (
                      <CalendarHeaderCell className="pb-1.5 text-center text-[length:var(--fs-micro)] font-medium text-ws-text-muted">
                        {day}
                      </CalendarHeaderCell>
                    )}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => (
                      <CalendarCell
                        date={date}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-sm text-[length:var(--fs-small)] tabular-nums cursor-pointer outline-none',
                          'hover:bg-ws-accent-soft data-[focused]:bg-ws-accent-soft',
                          'data-[outside-month]:text-ws-text-muted/45',
                          'data-[today]:border data-[today]:border-ws-accent',
                          'data-[selected]:bg-ws-text data-[selected]:text-ws-surface data-[selected]:font-medium',
                        )}
                      />
                    )}
                  </CalendarGridBody>
                </CalendarGrid>
              </Calendar>

              <div className="mt-2.5 flex items-center justify-between border-t border-ws-border pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const todayDate = today(getLocalTimeZone());
                    onChange(formatCalendarDateForMode(todayDate, mode, referenceYear));
                    setOpen(false);
                  }}
                >
                  Today
                </Button>
                {clearable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onChange('');
                      setOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </AriaDialog>
          </AriaPopover>
        </DialogTrigger>
      </div>
    </div>
  );
}
