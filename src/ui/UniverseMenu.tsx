'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { FEATURE_REGISTRY } from '@/features/registry';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { useTransitionRouter } from '@/features/transitions/TransitionProvider';
import { cn } from './cn';
import { useFeatureTheme, type FeatureThemeName } from './FeatureTheme';
import { useFocusTrap } from './use-focus-trap';

export interface UniverseMenuProps {
  open: boolean;
  onClose: () => void;
  featureTheme?: FeatureThemeName;
}

interface UniverseDestination {
  id: string;
  title: string;
  label: string;
  href: string;
}

const UNIVERSE_DESTINATIONS: readonly UniverseDestination[] = [
  ...FEATURE_REGISTRY,
  {
    id: 'notifications',
    title: 'Notifications',
    label: 'Inbox',
    href: '/notifications',
  },
];

export function UniverseMenu({ open, onClose, featureTheme }: UniverseMenuProps) {
  const inheritedTheme = useFeatureTheme();
  const resolvedTheme = featureTheme ?? inheritedTheme;
  const titleId = useId();
  const listboxId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  const router = useTransitionRouter();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useFocusTrap({
    open,
    containerRef: panelRef,
    initialFocusRef: inputRef,
    onClose,
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const filteredFeatures = useMemo(() => {
    const trimmed = query.trim().toLocaleLowerCase();
    if (!trimmed) {
      return UNIVERSE_DESTINATIONS;
    }
    return UNIVERSE_DESTINATIONS.filter(
      (item) =>
        item.title.toLocaleLowerCase().includes(trimmed) ||
        item.label.toLocaleLowerCase().includes(trimmed) ||
        item.href.toLocaleLowerCase().includes(trimmed),
    );
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredFeatures.length]);

  const selectFeature = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filteredFeatures.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredFeatures.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredFeatures.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredFeatures.length) % filteredFeatures.length);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = filteredFeatures[activeIndex];
      if (target) {
        if (event.ctrlKey || event.metaKey) {
          // Ctrl/Cmd+Enter opens the destination in a new tab, like Ctrl+click.
          window.open(target.href, '_blank', 'noopener');
        } else {
          selectFeature(target.href);
        }
      }
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div
          style={{ zIndex: 'calc(var(--z-drawer) + 1)' }}
          className="fixed inset-0 flex items-start justify-center pt-[calc(var(--topbar-h)+12px)] px-4"
        >
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0 : MOTION_DURATION.popoverClose,
              ease: MOTION_EASE,
            }}
            onClick={onClose}
            className="fixed inset-0 bg-ws-scrim"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
            transition={{
              duration: reducedMotion ? 0 : MOTION_DURATION.popoverOpen,
              ease: MOTION_EASE,
            }}
            data-theme="workspace"
            data-feature-theme={resolvedTheme}
            className="relative w-full max-w-[480px] rounded-card bg-ws-surface text-ws-text border border-ws-border shadow-popover overflow-hidden"
          >
            <h2 id={titleId} className="sr-only">
              Universe menu
            </h2>
            <div
              data-frameless-search-row="true"
              className="flex items-center gap-2.5 px-4 h-12 rounded-t-card border-b border-ws-border"
            >
              <Search size={16} strokeWidth={1.5} className="text-ws-text-muted shrink-0" />
              <input
                ref={inputRef}
                data-frameless-search="true"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listboxId}
                aria-activedescendant={
                  filteredFeatures[activeIndex]
                    ? `universe-item-${filteredFeatures[activeIndex].id}`
                    : undefined
                }
                placeholder="Jump to a space…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="w-full border-0 bg-transparent text-[length:var(--fs-ui)] text-ws-text placeholder:text-ws-text-muted outline-none focus:outline-none focus:ring-0 shadow-none"
              />
            </div>

            <div
              id={listboxId}
              role="listbox"
              aria-label="Spaces"
              className="max-h-[60dvh] overflow-y-auto p-2"
            >
              {filteredFeatures.length === 0 ? (
                <p className="py-6 text-center text-[length:var(--fs-ui)] text-ws-text-muted">
                  No matching spaces found.
                </p>
              ) : (
                filteredFeatures.map((feature, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <TransitionLink
                      key={feature.id}
                      id={`universe-item-${feature.id}`}
                      href={feature.href}
                      role="option"
                      aria-selected={isActive}
                      tabIndex={-1}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={(event) => {
                        // Modified clicks open a new tab natively; keep the menu open for those.
                        if (!(
                          event.ctrlKey ||
                          event.metaKey ||
                          event.shiftKey ||
                          event.button !== 0
                        )) {
                          onClose();
                        }
                      }}
                      className={cn(
                        'flex items-center justify-between w-full h-10 px-3 rounded-sm text-left no-underline cursor-pointer transition-colors duration-[var(--dur-fast)]',
                        isActive
                          ? 'bg-ws-accent-soft text-ws-text'
                          : 'text-ws-text hover:bg-ws-accent-soft',
                      )}
                    >
                      <span className="text-[length:var(--fs-ui)] font-medium truncate">
                        {feature.title}
                      </span>
                      <span className="ml-3 text-[length:var(--fs-small)] text-ws-text-muted shrink-0">
                        {feature.href}
                      </span>
                    </TransitionLink>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
