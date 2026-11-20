'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/client/query-provider';
import { FocusSessionProvider } from '@/features/focus-room/FocusSessionProvider';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { AutofillGuard } from '@/ui/AutofillGuard';
import { FocusModality } from '@/ui/FocusModality';
import { ToastProvider } from '@/ui/Toast';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AutofillGuard />
      <FocusModality />
      <ToastProvider>
        <TransitionProvider>
          <FocusSessionProvider>{children}</FocusSessionProvider>
        </TransitionProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
