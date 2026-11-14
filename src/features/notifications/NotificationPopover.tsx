'use client';

import type { RefObject } from 'react';
import { Maximize2 } from 'lucide-react';
import Image from 'next/image';
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useSetNotificationRead,
} from '@/client/queries/notifications';
import { useMinuteTicker } from '@/client/use-minute-ticker';
import type { NotificationDto } from '@/contracts';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { FeatureEmptyState, FeatureThemeProvider } from '@/ui/FeatureTheme';
import { Popover } from '@/ui/Popover';
import { Skeleton } from '@/ui/Skeleton';
import { useToast } from '@/ui/Toast';
import { NotificationItem } from './NotificationItem';

export interface NotificationPopoverProps {
  id: string;
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
}

export function NotificationPopover({ id, open, onClose, anchorRef }: NotificationPopoverProps) {
  const { data, isLoading, isError, refetch } = useNotifications();
  const setReadMutation = useSetNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const now = useMinuteTicker();
  const { pushToast } = useToast();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleToggleRead = (notificationId: string, nextIsRead: boolean) => {
    setReadMutation.mutate(
      { id: notificationId, isRead: nextIsRead },
      {
        onError: () => {
          pushToast('Could not update notification status.', 'error');
        },
      },
    );
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllReadMutation.isPending) {
      return;
    }
    markAllReadMutation.mutate(undefined, {
      onError: () => {
        pushToast('Could not mark notifications as read.', 'error');
      },
    });
  };

  const handleNavigate = (item: NotificationDto) => {
    if (!item.isRead) {
      setReadMutation.mutate({ id: item.id, isRead: true });
    }
    onClose();
  };

  return (
    <FeatureThemeProvider name="notification">
      <Popover
        id={id}
        open={open}
        onClose={onClose}
        anchorRef={anchorRef}
        aria-label="Notifications"
        align="right"
        width={380}
        mobileFullWidth
        autoFocusPanel
        portal
        className="p-0 overflow-hidden"
      >
        <div
          data-theme="workspace"
          className="flex flex-col max-h-[72dvh] bg-ws-surface text-ws-text"
        >
          {/* Header with Sakura wash & unobstructed action spacing */}
          <div className="relative flex items-center justify-between gap-2 px-3.5 sm:px-4 pt-3.5 pb-3 border-b border-ws-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--feature-soft)_38%,var(--ws-surface))_0%,var(--ws-surface)_100%)] shrink-0">
            <div className="min-w-0 flex items-center gap-2">
              <Image
                src="/visuals/notification/sakura-branch.svg"
                className="shrink-0"
                alt=""
                aria-hidden="true"
                width={26}
                height={26}
                unoptimized
              />
              <div className="min-w-0">
                <h2 className="text-[1rem] font-semibold text-ws-text leading-tight">
                  Notifications
                </h2>
                <span className="inline-block mt-0.5 text-[length:var(--fs-micro)] font-medium text-ws-text-muted tabular-nums">
                  {unreadCount} unread
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              aria-disabled={unreadCount === 0 || markAllReadMutation.isPending || undefined}
              onClick={handleMarkAllRead}
              className="shrink-0 min-h-[36px] whitespace-nowrap rounded-pill px-3 py-1.5 text-[length:var(--fs-small)] font-medium text-ws-text bg-[color-mix(in_srgb,var(--ws-accent-soft)_72%,var(--ws-surface))] transition-colors duration-[var(--dur-fast)] hover:bg-ws-accent-soft disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
            >
              Mark all as read
            </button>
          </div>

          {/* Scrollable feed */}
          <div className="overflow-y-auto p-3 flex-1 min-h-0">
            {isLoading ? (
              <div className="space-y-2" aria-label="Loading notifications">
                <Skeleton className="h-[88px] w-full rounded-item" />
                <Skeleton className="h-[88px] w-full rounded-item" />
              </div>
            ) : isError ? (
              <div className="py-6 px-4 text-center space-y-2">
                <p className="text-[length:var(--fs-ui)] text-text-overdue font-medium">
                  Could not load notifications.
                </p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="min-h-[36px] rounded-pill px-3.5 py-1.5 text-[length:var(--fs-small)] font-medium bg-ws-accent-soft text-ws-text hover:bg-[color-mix(in_srgb,var(--ws-accent)_35%,var(--ws-surface))] transition-colors duration-[var(--dur-fast)] cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <FeatureEmptyState
                title="All caught up."
                description="Your universe is running smoothly."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    now={now}
                    onToggleRead={handleToggleRead}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer link to the full Sakura Notification Center */}
          <div className="shrink-0 border-t border-ws-border bg-[color-mix(in_srgb,var(--feature-canvas)_62%,var(--ws-surface))] px-4 py-2 flex items-center justify-between gap-2">
            <span className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            <TransitionLink
              href="/notifications"
              onClick={onClose}
              aria-label="Expand notification center"
              title="Open full notification center"
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-pill text-[length:var(--fs-small)] font-medium text-ws-accent hover:bg-ws-accent-soft transition-colors duration-[var(--dur-fast)]"
            >
              <Maximize2 size={13} strokeWidth={1.5} aria-hidden="true" />
              <span>Expand</span>
            </TransitionLink>
          </div>
        </div>
      </Popover>
    </FeatureThemeProvider>
  );
}
