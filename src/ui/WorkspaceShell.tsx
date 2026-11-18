'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, Command, LayoutGrid } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { BellButton } from '@/features/notifications/BellButton';
import { DailyHeaderDate } from '@/features/tasks/daily/DailyDashboard';
import { DailySky, OrbitPlanetIcon } from '@/features/tasks/daily/DailySky';
import dailyStyles from '@/features/tasks/daily/daily-foundation.module.css';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { StarIcon } from './StarIcon';
import { UniverseMenu } from './UniverseMenu';
import { cn } from './cn';
import { FeatureTheme, FeatureThemeProvider, type FeatureThemeName } from './FeatureTheme';

const FULL_PAGE_FEATURE_THEMES = new Set<FeatureThemeName>([
  'events',
  'notification',
  'tracking',
  'project',
  'annual-milestones',
  'personal-achievements',
  'ai-engineering',
  'blogs-hub',
  'apcs-hub',
  'flashcards',
  'learning-room',
  'entertainment-hub',
  'tasks-hub',
]);

export interface WorkspaceShellProps {
  children: ReactNode;
  bellSlot?: ReactNode;
}

export function WorkspaceShell({ children, bellSlot }: WorkspaceShellProps) {
  const pathname = usePathname();
  const daily = pathname === '/tasks/daily';
  const tasksHub = pathname === '/tasks/hub';
  const taskNavigation = daily || tasksHub;
  const themes: Record<string, FeatureThemeName> = {
    '/tasks/hub': 'tasks-hub',
    '/notifications': 'notification',
    '/events': 'events',
    '/ai-engineering': 'ai-engineering',
    '/blogs': 'blogs-hub',
    '/apcs': 'apcs-hub',
    '/flashcards': 'flashcards',
    '/entertainment': 'entertainment-hub',
    '/tracking': 'tracking',
    '/projects': 'project',
    '/milestones': 'annual-milestones',
    '/learning-room': 'learning-room',
    '/achievements': 'personal-achievements',
  };
  const featureTheme = themes[pathname];
  const fullPageTheme =
    featureTheme && FULL_PAGE_FEATURE_THEMES.has(featureTheme) ? featureTheme : undefined;
  const topbar = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [universeOpen, setUniverseOpen] = useState(false);

  useEffect(() => {
    const header = topbar.current;
    let frame = 0;
    const updateDailyBackdrop = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / 44));
      const opacity = progress * progress * (3 - 2 * progress);
      header?.style.setProperty('--daily-topbar-opacity', String(opacity));
    };
    const handleScroll = () => {
      if (!daily) {
        setScrolled(window.scrollY > 4);
      } else if (!frame) {
        frame = window.requestAnimationFrame(updateDailyBackdrop);
      }
    };
    if (daily) updateDailyBackdrop();
    else handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(frame);
      if (daily) header?.style.removeProperty('--daily-topbar-opacity');
    };
  }, [daily]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setUniverseOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      data-theme="workspace"
      data-feature-theme={fullPageTheme}
      data-fullpage-theme={fullPageTheme ? 'true' : undefined}
      className={cn(
        'relative min-h-[100svh] bg-ws-bg text-ws-text flex flex-col',
        daily && dailyStyles.workspace,
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-ws-surface focus:text-ws-text focus:p-3"
      >
        Skip to content
      </a>
      {/* Faint top lavender ambient wash (≤ 8%, fading by ~40vh) per ui_readme.md §13.1 */}
      {daily ? (
        <DailySky />
      ) : !fullPageTheme ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 h-[40vh]"
          style={{
            zIndex: 'var(--z-bg)',
            background:
              'radial-gradient(ellipse 80% 100% at 50% 0%, color-mix(in srgb, var(--ws-accent) 8%, transparent), transparent 75%)',
          }}
        />
      ) : null}

      <header
        ref={topbar}
        data-fullpage-topbar={fullPageTheme ? 'true' : undefined}
        style={{ zIndex: 'var(--z-nav)', height: daily ? undefined : 'var(--topbar-h)' }}
        className={cn(
          'sticky top-0 w-full border-b',
          daily
            ? cn('border-transparent', dailyStyles.topbar)
            : cn(
                'transition-[border-color] duration-[var(--dur-fast)]',
                fullPageTheme
                  ? 'backdrop-blur-md'
                  : 'bg-[color-mix(in_srgb,var(--ws-bg)_92%,transparent)] backdrop-blur-sm',
                scrolled ? 'border-ws-border' : 'border-transparent',
              ),
        )}
      >
        {daily && <div className={dailyStyles.topbarBackdrop} aria-hidden="true" />}
        <div
          className={cn(
            'mx-auto flex h-full w-full max-w-[var(--max-content)] items-center justify-between px-[var(--gutter)] lg:px-[var(--gutter-lg)]',
            daily && dailyStyles.frame,
          )}
        >
          <TransitionLink
            href="/"
            aria-label="Hiep Trong Space home"
            className="inline-flex items-center gap-1.5 rounded-pill px-2 py-1 -ml-2 text-ws-text hover:opacity-80 transition-opacity duration-[var(--dur-fast)]"
          >
            <span className="font-display italic text-[1.375rem] leading-none">Hiep Trong</span>
            <StarIcon size={10} className="text-ws-accent" />
          </TransitionLink>

          <div className="flex items-center gap-2">
            {taskNavigation && (
              <TransitionLink
                href={daily ? '/tasks/hub' : '/tasks/daily'}
                data-task-shortcut
                title={daily ? 'Go to Tasks Hub' : 'Go to Task Management'}
                className="inline-flex items-center justify-center gap-2 min-h-[36px] px-3.5 rounded-pill bg-ws-accent-soft text-ws-text border border-ws-border text-[length:var(--fs-small)] font-medium whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--ws-accent)_35%,var(--ws-surface))] transition-colors duration-[var(--dur-fast)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-ws-focus focus-visible:outline-offset-2 max-[479px]:size-9 max-[479px]:p-0"
              >
                {daily ? (
                  <LayoutGrid size={14} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <CalendarDays size={14} strokeWidth={1.5} aria-hidden="true" />
                )}
                <span className="max-[479px]:sr-only">{daily ? 'Tasks Hub' : 'Daily'}</span>
              </TransitionLink>
            )}
            {daily && <DailyHeaderDate />}
            <button
              type="button"
              onClick={() => setUniverseOpen(true)}
              aria-label="Open universe menu"
              aria-haspopup="dialog"
              aria-expanded={universeOpen}
              className={cn(
                'inline-flex items-center gap-2 min-h-[36px] px-3.5 rounded-pill bg-ws-accent-soft text-ws-text border border-ws-border text-[length:var(--fs-small)] font-medium whitespace-nowrap cursor-pointer hover:bg-[color-mix(in_srgb,var(--ws-accent)_35%,var(--ws-surface))] transition-colors duration-[var(--dur-fast)]',
                taskNavigation && 'max-[479px]:size-9 max-[479px]:justify-center max-[479px]:p-0',
              )}
            >
              {daily ? (
                <OrbitPlanetIcon width={16} height={16} className="shrink-0" />
              ) : (
                <Command size={14} strokeWidth={1.5} className="shrink-0" />
              )}
              <span className={taskNavigation ? 'max-[479px]:sr-only' : undefined}>Universe</span>
              <span
                aria-hidden="true"
                className="hidden md:inline-block ml-0.5 text-[length:var(--fs-micro)] text-ws-text-muted"
              >
                Ctrl K
              </span>
            </button>

            {bellSlot ?? <BellButton tone="workspace" />}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        style={{ zIndex: 'var(--z-content)' }}
        className={cn(
          'relative flex-1 mx-auto flex flex-col w-full max-w-[var(--max-content)] px-[var(--gutter)] lg:px-[var(--gutter-lg)] py-8',
          (daily || tasksHub) && dailyStyles.frame,
          daily && dailyStyles.main,
        )}
      >
        {fullPageTheme ? (
          <FeatureThemeProvider name={fullPageTheme}>{children}</FeatureThemeProvider>
        ) : featureTheme ? (
          <FeatureTheme name={featureTheme}>{children}</FeatureTheme>
        ) : (
          children
        )}
      </main>

      <UniverseMenu
        open={universeOpen}
        onClose={() => setUniverseOpen(false)}
        featureTheme={fullPageTheme}
      />
    </div>
  );
}
