'use client';

import { useId, useRef, useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { IconButton } from '@/ui/IconButton';
import { Popover } from '@/ui/Popover';
import { cn } from '@/ui/cn';
import { PILOT_NOTIFICATIONS } from './homepage-pilot-fixtures';

export function PilotBellFixture({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  const unreadCount = PILOT_NOTIFICATIONS.length;

  return (
    <>
      <IconButton
        ref={buttonRef}
        tone="cosmos"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className={className}
      >
        <Bell size={20} strokeWidth={1.5} />
        <span
          data-testid="pilot-bell-unread-indicator"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-pill bg-status-overdue font-semibold leading-none tabular-nums ring-2 ring-cosmos-bg-0 text-cosmos-bg-0 min-w-[16px] h-[16px] px-1 text-[10px]',
          )}
        >
          {unreadCount}
        </span>
      </IconButton>

      <FeatureThemeProvider name="notification">
        <Popover
          id={popoverId}
          open={open}
          onClose={() => setOpen(false)}
          anchorRef={buttonRef}
          aria-label="Notifications"
          align="right"
          width={360}
          mobileFullWidth
          autoFocusPanel
          portal
          className="p-0 overflow-hidden"
        >
          <div
            data-theme="workspace"
            data-pilot-bell-popover
            className="flex flex-col bg-ws-surface text-ws-text"
          >
            <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b border-ws-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--feature-soft)_38%,var(--ws-surface))_0%,var(--ws-surface)_100%)]">
              <div>
                <h2 className="text-[1rem] font-semibold text-ws-text leading-tight">
                  Notifications
                </h2>
                <span className="inline-block mt-0.5 text-[length:var(--fs-micro)] font-medium text-ws-text-muted tabular-nums">
                  {unreadCount} unread · Fixture preview
                </span>
              </div>
              <span className="rounded-pill border border-ws-border bg-ws-accent-soft px-2.5 py-1 text-[length:var(--fs-micro)] font-medium text-ws-text">
                Read-only
              </span>
            </div>

            <ul className="p-3 space-y-2 list-none m-0">
              {PILOT_NOTIFICATIONS.map((item) => (
                <li key={item.id}>
                  <div className="flex items-start gap-2.5 rounded-item bg-[color-mix(in_srgb,var(--feature-soft)_24%,var(--ws-surface))] px-3 py-2.5 border border-ws-border">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0 text-ws-accent"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[length:var(--fs-small)] font-medium text-ws-text leading-snug m-0">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[length:var(--fs-micro)] text-ws-text-muted leading-relaxed m-0">
                        {item.detail}
                      </p>
                      <span className="mt-1 inline-block text-[11px] text-ws-text-muted tabular-nums">
                        {item.timeLabel}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Popover>
      </FeatureThemeProvider>
    </>
  );
}
