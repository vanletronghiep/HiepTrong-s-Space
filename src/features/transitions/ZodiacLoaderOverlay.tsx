'use client';

import { Component, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { ZodiacSign } from '@/features/zodiac/types';
import { ZodiacIllumination } from '@/features/zodiac/ZodiacIllumination';
import { FINISH_NOW_MS } from './load-estimate';
import styles from './zodiac-loader.module.css';

export type RouteLoaderPhase = 'loading' | 'leaving';
export type RouteLoaderMode = 'zodiac' | 'text' | 'quick-fade';
/**
 * pending: dim static art while the estimate is unknown (server render / first paint);
 * fast: fully drawn static art; draw: progressive drawing paced to the estimated load time.
 */
export type RouteLoaderPath = 'pending' | 'fast' | 'draw';

export interface ZodiacLoaderOverlayProps {
  mode: RouteLoaderMode;
  phase: RouteLoaderPhase;
  sign: ZodiacSign | null;
  /** Destination title shown on screen; the announcement reads "Loading {label}…". */
  label: string;
  /** Feature accent (CSS color) for the background glow, matching its collection card. */
  accent?: string;
  reducedMotion: boolean;
  path?: RouteLoaderPath;
  /** Total drawing time in ms (draw path). */
  drawMs?: number;
  /** The page is ready: finish the remaining drawing quickly. */
  finishNow?: boolean;
  /** Render fully visible from the first paint (hard load / server render). */
  initiallyVisible?: boolean;
  /** Reports playhead progress in [0, 1] without re-rendering. */
  onDrawProgress?: (progress: number) => void;
  onRuntimeError?: () => void;
}

interface BoundaryProps {
  onError?: () => void;
  fallback: ReactNode;
  children: ReactNode;
}

/** A failing zodiac renderer falls back to the text-only loader instead of trapping the user. */
class LoaderErrorBoundary extends Component<BoundaryProps, { hasError: boolean }> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  override componentDidCatch(): void {
    this.props.onError?.();
  }

  override render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/**
 * Destination title in the artwork's rose gold with three twinkling stars (v3.4). The stars
 * are pure CSS, so nothing re-renders while the page loads; the "Loading <title>…" wording
 * is announced once by the status region instead.
 */
function LoaderTitle({ title }: { title: string }) {
  return (
    <div className={styles.label} data-testid="route-loader-label">
      <p className={styles.title}>{title}</p>
      <span className={styles.stars} aria-hidden="true">
        <b />
        <b />
        <b />
      </span>
    </div>
  );
}

/**
 * Destination loading overlay (v3.2). Navigation has already started when this mounts;
 * the overlay never imposes a minimum display time. The drawing is paced by the estimated
 * load time (`drawMs`) and fast-forwarded when the page is ready early.
 */
export function ZodiacLoaderOverlay({
  mode,
  phase,
  sign,
  label,
  accent,
  reducedMotion,
  path = 'draw',
  drawMs,
  finishNow = false,
  initiallyVisible = false,
  onDrawProgress,
  onRuntimeError,
}: ZodiacLoaderOverlayProps) {
  const [entered, setEntered] = useState(initiallyVisible);

  useEffect(() => {
    if (initiallyVisible) return undefined;
    const raf = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(raf);
  }, [initiallyVisible]);

  if (mode === 'quick-fade') {
    return (
      <div
        aria-hidden="true"
        data-testid="route-loader-quick-fade"
        data-phase={phase}
        className={styles.quickFade}
        data-visible={entered && phase === 'loading' ? 'true' : undefined}
      />
    );
  }

  const hasArt = mode === 'zodiac' && sign !== null;
  const drawing = path === 'draw' && !reducedMotion;
  const forwardSpeed = finishNow
    ? 1000 / FINISH_NOW_MS
    : drawing && drawMs
      ? 1000 / drawMs
      : undefined;

  const art =
    hasArt && sign ? (
      <LoaderErrorBoundary onError={onRuntimeError} fallback={null}>
        <div
          className={styles.artwork}
          data-testid="route-loader-zodiac"
          data-sign={sign}
          data-path={reducedMotion ? 'fast' : path}
        >
          <ZodiacIllumination
            sign={sign}
            active={drawing}
            presentation={reducedMotion || path === 'fast' ? 'static' : 'loader'}
            forwardSpeed={forwardSpeed}
            onFrame={drawing && onDrawProgress ? (snap) => onDrawProgress(snap.p) : undefined}
          />
        </div>
      </LoaderErrorBoundary>
    ) : null;

  return (
    <div
      data-route-loader
      data-testid="route-loader"
      data-mode={mode}
      data-phase={phase}
      data-has-art={hasArt ? 'true' : 'false'}
      data-visible={entered && phase === 'loading' ? 'true' : undefined}
      className={styles.overlay}
      style={accent ? ({ '--loader-accent': accent } as CSSProperties) : undefined}
    >
      {initiallyVisible ? (
        <noscript>
          <style>{'[data-route-loader]{display:none!important}'}</style>
        </noscript>
      ) : null}
      <div className={styles.stage}>
        {art}
        <LoaderTitle title={label} />
      </div>
      {/* Announced once per navigation; animation frames never touch this node. */}
      <span role="status" aria-live="polite" className="sr-only">
        {phase === 'loading' ? `Loading ${label}…` : ''}
      </span>
    </div>
  );
}
