'use client';

import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import type { FeatureEntry, FeatureThumbnailPreset } from '@/features/registry';
import { ZodiacIllumination } from '@/features/zodiac/ZodiacIllumination';
import type { ZodiacControllerSnapshot } from '@/features/zodiac/types';
import { cn } from '@/ui/cn';
import styles from './feature-collection.module.css';

export interface ZodiacThumbnailControl {
  /** Controlled playhead override in [0, 1] for preview scrubbing/inspection. */
  manualProgress?: number;
  /** Suppress completed-state moving glow loop (for static fidelity comparison). */
  disableGlow?: boolean;
  /** Preview-only guide overlay toggle. */
  showGuides?: boolean;
  /** Optional imperative frame telemetry hook (called without React re-renders). */
  onFrame?: (snapshot: ZodiacControllerSnapshot) => void;
  /** Optional external override for active intent (used by preview Play Inward/Outward). */
  activeOverride?: boolean;
}

export interface FeatureThumbnailProps {
  thumbnail: FeatureEntry['thumbnail'];
  /** Whether the owning card link is hovered or :focus-visible. */
  active?: boolean;
  /** External lifecycle gate (e.g. collection revealComplete). Defaults to true. */
  illuminationEnabled?: boolean;
  /** Preview-only external controls for Zodiac illumination. */
  zodiacControl?: ZodiacThumbnailControl;
  className?: string;
}

function FourPointStar({
  x,
  y,
  size = 5.5,
  color,
}: {
  x: number;
  y: number;
  size?: number;
  color: string;
}) {
  const c = size * 0.22;
  const d = `M 0 ${-size} C ${c} ${-c} ${c} ${-c} ${size} 0 C ${c} ${c} ${c} ${c} 0 ${size} C ${-c} ${c} ${-c} ${c} ${-size} 0 C ${-c} ${-c} ${-c} ${-c} 0 ${-size} Z`;
  return <path d={d} transform={`translate(${x} ${y})`} fill={color} />;
}

function renderPresetArtwork(
  preset: FeatureThumbnailPreset,
  lineSoft: string,
  lineAccent: string,
  starColor: string,
  nodeColor: string,
): ReactNode {
  switch (preset) {
    case 'constellation-arc':
      return (
        <>
          <circle cx="160" cy="235" r="145" fill="none" stroke={lineSoft} strokeWidth="0.85" />
          <circle
            cx="160"
            cy="235"
            r="105"
            fill="none"
            stroke={lineAccent}
            strokeWidth="0.9"
            strokeDasharray="3 5"
          />
          <polyline
            points="72,138 124,96 184,108 242,68"
            fill="none"
            stroke={lineAccent}
            strokeWidth="1"
          />
          <circle cx="72" cy="138" r="1.8" fill={nodeColor} />
          <circle cx="124" cy="96" r="2" fill={nodeColor} />
          <circle cx="184" cy="108" r="1.8" fill={nodeColor} />
          <FourPointStar x={242} y={68} size={6.2} color={starColor} />
        </>
      );

    case 'dual-orbit':
      return (
        <>
          <ellipse
            cx="160"
            cy="100"
            rx="108"
            ry="44"
            transform="rotate(-14 160 100)"
            fill="none"
            stroke={lineSoft}
            strokeWidth="0.85"
          />
          <ellipse
            cx="160"
            cy="100"
            rx="72"
            ry="28"
            transform="rotate(18 160 100)"
            fill="none"
            stroke={lineAccent}
            strokeWidth="1"
          />
          <line x1="66" y1="126" x2="254" y2="74" stroke={lineSoft} strokeWidth="0.75" />
          <circle cx="160" cy="100" r="2.2" fill={nodeColor} />
          <circle cx="104" cy="84" r="1.6" fill={nodeColor} />
          <FourPointStar x={221} y={83} size={6} color={starColor} />
        </>
      );

    case 'meridian-grid':
      return (
        <>
          <circle cx="160" cy="100" r="64" fill="none" stroke={lineSoft} strokeWidth="0.85" />
          <ellipse
            cx="160"
            cy="100"
            rx="32"
            ry="64"
            fill="none"
            stroke={lineAccent}
            strokeWidth="0.95"
          />
          <line x1="80" y1="100" x2="240" y2="100" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="160" y1="24" x2="160" y2="176" stroke={lineSoft} strokeWidth="0.8" />
          <circle cx="128" cy="100" r="1.8" fill={nodeColor} />
          <FourPointStar x={192} y={68} size={5.8} color={starColor} />
        </>
      );

    case 'neural-lattice':
      return (
        <>
          <line x1="78" y1="64" x2="158" y2="54" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="78" y1="64" x2="148" y2="112" stroke={lineAccent} strokeWidth="0.95" />
          <line x1="78" y1="136" x2="158" y2="54" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="78" y1="136" x2="148" y2="112" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="158" y1="54" x2="238" y2="96" stroke={lineAccent} strokeWidth="1" />
          <line x1="148" y1="112" x2="238" y2="96" stroke={lineAccent} strokeWidth="1" />
          <line x1="148" y1="112" x2="224" y2="148" stroke={lineSoft} strokeWidth="0.8" />
          <circle cx="78" cy="64" r="2" fill={nodeColor} />
          <circle cx="78" cy="136" r="2" fill={nodeColor} />
          <circle cx="158" cy="54" r="2" fill={nodeColor} />
          <circle cx="148" cy="112" r="2.2" fill={nodeColor} />
          <circle cx="224" cy="148" r="1.8" fill={nodeColor} />
          <FourPointStar x={238} y={96} size={6.2} color={starColor} />
        </>
      );

    case 'manuscript-lines':
      return (
        <>
          <line x1="76" y1="68" x2="218" y2="68" stroke={lineAccent} strokeWidth="1" />
          <line x1="76" y1="92" x2="244" y2="92" stroke={lineSoft} strokeWidth="0.85" />
          <line x1="76" y1="116" x2="204" y2="116" stroke={lineSoft} strokeWidth="0.85" />
          <line x1="76" y1="140" x2="156" y2="140" stroke={lineSoft} strokeWidth="0.85" />
          <path
            d="M 214 148 A 56 56 0 0 0 246 62"
            fill="none"
            stroke={lineAccent}
            strokeWidth="0.9"
          />
          <FourPointStar x={234} y={68} size={5.8} color={starColor} />
        </>
      );

    case 'academic-compass':
      return (
        <>
          <circle cx="160" cy="102" r="58" fill="none" stroke={lineSoft} strokeWidth="0.85" />
          <polygon
            points="160,48 206,128 114,128"
            fill="none"
            stroke={lineAccent}
            strokeWidth="0.95"
          />
          <line
            x1="160"
            y1="32"
            x2="160"
            y2="168"
            stroke={lineSoft}
            strokeWidth="0.75"
            strokeDasharray="2 4"
          />
          <circle cx="114" cy="128" r="1.8" fill={nodeColor} />
          <circle cx="206" cy="128" r="1.8" fill={nodeColor} />
          <FourPointStar x={160} y={48} size={6} color={starColor} />
        </>
      );

    case 'paired-cards':
      return (
        <>
          <rect
            x="88"
            y="60"
            width="92"
            height="64"
            rx="8"
            fill="none"
            stroke={lineSoft}
            strokeWidth="0.85"
          />
          <rect
            x="136"
            y="78"
            width="96"
            height="66"
            rx="8"
            fill="none"
            stroke={lineAccent}
            strokeWidth="1"
          />
          <path
            d="M 112 52 A 74 74 0 0 1 218 70"
            fill="none"
            stroke={lineSoft}
            strokeWidth="0.8"
            strokeDasharray="3 4"
          />
          <FourPointStar x={184} y={111} size={5.8} color={starColor} />
        </>
      );

    case 'harmonic-waves':
      return (
        <>
          <path
            d="M 52 106 C 96 68, 144 142, 188 100 C 218 72, 246 86, 268 96"
            fill="none"
            stroke={lineAccent}
            strokeWidth="1"
          />
          <path
            d="M 52 122 C 98 92, 146 154, 194 114 C 224 90, 248 102, 268 110"
            fill="none"
            stroke={lineSoft}
            strokeWidth="0.8"
          />
          <circle cx="122" cy="105" r="1.7" fill={nodeColor} />
          <FourPointStar x={212} y={84} size={5.8} color={starColor} />
        </>
      );

    case 'pulse-timeline':
      return (
        <>
          <line x1="56" y1="112" x2="264" y2="112" stroke={lineSoft} strokeWidth="0.8" />
          <polyline
            points="66,112 108,112 128,76 154,132 178,92 204,112 254,112"
            fill="none"
            stroke={lineAccent}
            strokeWidth="1.05"
          />
          <circle cx="108" cy="112" r="1.8" fill={nodeColor} />
          <circle cx="178" cy="92" r="1.8" fill={nodeColor} />
          <FourPointStar x={128} y={76} size={6} color={starColor} />
        </>
      );

    case 'blueprint-vectors':
      return (
        <>
          <line x1="68" y1="146" x2="252" y2="146" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="88" y1="44" x2="88" y2="162" stroke={lineSoft} strokeWidth="0.8" />
          <polyline
            points="88,146 146,98 196,112 238,60"
            fill="none"
            stroke={lineAccent}
            strokeWidth="1"
          />
          <path
            d="M 88 104 A 42 42 0 0 1 122 118"
            fill="none"
            stroke={lineSoft}
            strokeWidth="0.8"
          />
          <circle cx="146" cy="98" r="1.9" fill={nodeColor} />
          <circle cx="196" cy="112" r="1.9" fill={nodeColor} />
          <FourPointStar x={238} y={60} size={6.2} color={starColor} />
        </>
      );

    case 'summit-trajectory':
      return (
        <>
          <path d="M 64 150 Q 148 134 226 56" fill="none" stroke={lineAccent} strokeWidth="1.05" />
          <circle cx="226" cy="56" r="26" fill="none" stroke={lineSoft} strokeWidth="0.8" />
          <circle cx="114" cy="138" r="1.8" fill={nodeColor} />
          <circle cx="168" cy="108" r="1.9" fill={nodeColor} />
          <FourPointStar x={226} y={56} size={6.2} color={starColor} />
        </>
      );

    case 'focus-aperture':
      return (
        <>
          <circle cx="160" cy="100" r="66" fill="none" stroke={lineSoft} strokeWidth="0.8" />
          <circle cx="160" cy="100" r="40" fill="none" stroke={lineAccent} strokeWidth="1" />
          <circle cx="160" cy="100" r="16" fill="none" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="160" y1="24" x2="160" y2="48" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="160" y1="152" x2="160" y2="176" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="84" y1="100" x2="108" y2="100" stroke={lineSoft} strokeWidth="0.8" />
          <line x1="212" y1="100" x2="236" y2="100" stroke={lineSoft} strokeWidth="0.8" />
          <FourPointStar x={160} y={100} size={6} color={starColor} />
        </>
      );

    case 'zenith-crown':
      return (
        <>
          <path
            d="M 74 138 A 96 96 0 0 1 246 138"
            fill="none"
            stroke={lineSoft}
            strokeWidth="0.85"
          />
          <polyline
            points="92,132 126,88 160,62 194,88 228,132"
            fill="none"
            stroke={lineAccent}
            strokeWidth="1"
          />
          <circle cx="92" cy="132" r="1.7" fill={nodeColor} />
          <circle cx="126" cy="88" r="1.9" fill={nodeColor} />
          <circle cx="194" cy="88" r="1.9" fill={nodeColor} />
          <circle cx="228" cy="132" r="1.7" fill={nodeColor} />
          <FourPointStar x={160} y={62} size={6.4} color={starColor} />
        </>
      );
  }
}

export function FeatureThumbnail({
  thumbnail,
  active = false,
  illuminationEnabled = true,
  zodiacControl,
  className,
}: FeatureThumbnailProps) {
  const glow = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const enabled = useRef(false);

  const hideGlow = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    glow.current?.removeAttribute('data-active');
  };

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      enabled.current = finePointer.matches && !reducedMotion.matches;
      if (!enabled.current) hideGlow();
    };
    update();
    finePointer.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      finePointer.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  // Zodiac artwork rests fully drawn; hover only raises its glow, so no moving light follows
  // the pointer across it (v3.1 §4). Preview controls keep the interactive drawing mode.
  const isStaticZodiac = Boolean(thumbnail.zodiacSign) && !zodiacControl;

  const moveGlow = (event: PointerEvent<HTMLDivElement>) => {
    if (isStaticZodiac || !enabled.current || event.pointerType !== 'mouse') return;
    pointer.current = { x: event.clientX, y: event.clientY };
    if (frame.current) return;
    const surface = event.currentTarget;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (!glow.current) return;
      const bounds = surface.getBoundingClientRect();
      glow.current.style.transform = `translate3d(${pointer.current.x - bounds.left}px, ${pointer.current.y - bounds.top}px, 0)`;
      glow.current.dataset.active = 'true';
    });
  };

  const fallbackAccent =
    thumbnail.accent === 'lavender' ? 'var(--cosmos-lavender)' : 'var(--cosmos-star-blue)';
  const accentToken = `var(--card-accent, ${fallbackAccent})`;
  const lineSoft = 'color-mix(in srgb, var(--cosmos-text) 20%, transparent)';
  const lineAccent = `color-mix(in srgb, ${accentToken} 58%, transparent)`;
  const nodeColor = 'color-mix(in srgb, var(--cosmos-star-pale) 80%, transparent)';

  return (
    <div
      data-zodiac-thumb={isStaticZodiac ? 'static' : undefined}
      onPointerEnter={moveGlow}
      onPointerMove={moveGlow}
      onPointerLeave={hideGlow}
      onPointerCancel={hideGlow}
      className={cn(
        'relative aspect-[16/10] w-full overflow-hidden rounded-card select-none',
        styles.thumbSurface,
        className,
      )}
    >
      {/* Pre-blended per-feature radial accent glow (compositor opacity/scale only) */}
      <div aria-hidden="true" className={styles.thumbGlow} />
      <div ref={glow} aria-hidden="true" className={styles.pointerGlow} />

      {/* Composited SVG vector reveal strictly inside overflow-hidden bounds */}
      <div className={styles.thumbArtwork}>
        {thumbnail.zodiacSign && isStaticZodiac ? (
          // Pre-glowed copy painted once and faded by opacity only, so hover never re-rasterizes
          // a filter per frame (v3.2).
          <div aria-hidden="true" className={cn(styles.zodiacInset, styles.zodiacHalo)}>
            <ZodiacIllumination
              sign={thumbnail.zodiacSign}
              presentation="static"
              enabled={illuminationEnabled}
            />
          </div>
        ) : null}
        {thumbnail.zodiacSign ? (
          <div className={styles.zodiacInset}>
            <ZodiacIllumination
              sign={thumbnail.zodiacSign}
              presentation={isStaticZodiac ? 'static' : 'hover'}
              active={zodiacControl?.activeOverride ?? active}
              enabled={illuminationEnabled}
              manualProgress={zodiacControl?.manualProgress}
              disableGlow={zodiacControl?.disableGlow}
              showGuides={zodiacControl?.showGuides}
              onFrame={zodiacControl?.onFrame}
            />
          </div>
        ) : thumbnail.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail.imageUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 320 200"
            aria-hidden="true"
            className="relative block h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {renderPresetArtwork(thumbnail.preset, lineSoft, lineAccent, accentToken, nodeColor)}
          </svg>
        )}
      </div>

      {/* Resting subtle hairline */}
      <div aria-hidden="true" className={styles.thumbHairlineBase} />
      {/* Expressive accent border hairline overlay (opacity only) */}
      <div aria-hidden="true" className={styles.thumbHairlineAccent} />
    </div>
  );
}
