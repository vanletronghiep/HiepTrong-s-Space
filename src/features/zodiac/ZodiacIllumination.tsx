'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from 'react';
import { cn } from '@/ui/cn';
import { createZodiacPlayheadController, type ZodiacPlayheadController } from './controller';
import {
  getCachedZodiacAsset,
  getZodiacCanonicalSvgUrl,
  getZodiacWordmarkSvgUrl,
  loadZodiacEnhancement,
  type LoadedZodiacAsset,
} from './loader';
import {
  clamp01,
  createFrameBuffer,
  sampleZodiacFrameInto,
  type MutableSampledZodiacFrame,
} from './schedule';
import { getCompiledSymbolSchedule, getZodiacSymbolDefinition } from './symbol-data';
import type {
  CompiledZodiacSchedule,
  ZodiacControllerSnapshot,
  ZodiacIlluminationLayerData,
  ZodiacIlluminationProps,
  ZodiacLayerRefs,
  ZodiacRoutePath,
} from './types';
import { ZodiacSymbolProgressiveSvg, ZodiacSymbolStaticSvg } from './ZodiacSymbol';
import styles from './zodiac-illumination.module.css';

const PATH_LENGTH_SCALE = 1000;
const BASE_DIM_OPACITY = 0.35;
const GLOW_HIGHLIGHT_COLOR = 'var(--zodiac-rose-gold-highlight)';
const GLOW_LEAD_DASH_ARRAY = '20 980';
const GLOW_TAIL_DASH_ARRAY = '120 880';
const GLOW_LEAD_SEGMENT_UNITS = 20;
const GLOW_TAIL_SEGMENT_UNITS = 120;
const GLOW_TAIL_OPACITY_RATIO = 0.12 / 0.32;
const DEFAULT_EMBLEM_HEAD_RADIUS = 14;
const DEFAULT_EMBLEM_GLOW_STROKE_WIDTH = 8;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function createLayerRefs(): ZodiacLayerRefs {
  return {
    dimLayer: null,
    outlineLayer: null,
    outlinePaths: [],
    fillPaths: [],
    primaryHead: null,
    secondaryHead: null,
    glowGroup: null,
    glowPath: null,
    glowTailPath: null,
    lastAppliedP: null,
  };
}

function resetLayerRefs(refs: ZodiacLayerRefs): void {
  refs.lastAppliedP = null;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function wrapDashOffset(startPos: number): string {
  const wrapped = ((startPos % PATH_LENGTH_SCALE) + PATH_LENGTH_SCALE) % PATH_LENGTH_SCALE;
  return (-wrapped).toFixed(2);
}

function applyLayerFrame(
  schedule: CompiledZodiacSchedule,
  snapshot: ZodiacControllerSnapshot,
  buffer: MutableSampledZodiacFrame,
  refs: ZodiacLayerRefs,
  options: { showTravelingHeads?: boolean } = {},
): void {
  const showTravelingHeads = options.showTravelingHeads ?? true;
  const glowOnlyFrame = snapshot.p >= 1 && refs.lastAppliedP !== null && refs.lastAppliedP >= 1;

  if (!glowOnlyFrame) {
    const sampled = sampleZodiacFrameInto(schedule, snapshot.p, buffer);
    refs.lastAppliedP = sampled.p;

    // Smoothly dissolve dim & outline base layers in the final 1.5% so p=1 matches
    // canonical fill edge anti-aliasing without altering fill-mask coverage.
    const endFade = smoothstep(0.985, 1, sampled.p);
    if (refs.dimLayer) {
      refs.dimLayer.setAttribute('opacity', (BASE_DIM_OPACITY * (1 - endFade)).toFixed(4));
    }
    if (refs.outlineLayer) {
      refs.outlineLayer.setAttribute('opacity', (1 - endFade).toFixed(4));
    }

    for (let i = 0; i < sampled.outlineProgress.length; i += 1) {
      const pathEl = refs.outlinePaths[i];
      const prog = sampled.outlineProgress[i] ?? 0;
      if (!pathEl) continue;
      if (prog <= 0) {
        pathEl.setAttribute('stroke-opacity', '0');
        pathEl.setAttribute('stroke-dashoffset', String(PATH_LENGTH_SCALE));
      } else {
        pathEl.setAttribute('stroke-opacity', '1');
        pathEl.setAttribute('stroke-dashoffset', (PATH_LENGTH_SCALE * (1 - prog)).toFixed(2));
      }
    }

    for (let i = 0; i < sampled.fillProgress.length; i += 1) {
      const pathEl = refs.fillPaths[i];
      const prog = sampled.fillProgress[i] ?? 0;
      if (!pathEl) continue;
      if (prog <= 0) {
        pathEl.setAttribute('stroke-opacity', '0');
        pathEl.setAttribute('stroke-dashoffset', String(PATH_LENGTH_SCALE));
      } else {
        pathEl.setAttribute('stroke-opacity', '1');
        pathEl.setAttribute('stroke-dashoffset', (PATH_LENGTH_SCALE * (1 - prog)).toFixed(2));
      }
    }

    if (showTravelingHeads) {
      const updateHead = (
        el: SVGGElement | null,
        head: { visible: boolean; x: number; y: number; opacity: number },
      ) => {
        if (!el) return;
        if (head.visible && head.opacity > 0.002) {
          el.setAttribute('transform', `translate(${head.x.toFixed(2)} ${head.y.toFixed(2)})`);
          el.setAttribute('opacity', head.opacity.toFixed(3));
        } else {
          el.setAttribute('opacity', '0');
        }
      };

      updateHead(refs.primaryHead, sampled.primaryHead);
      updateHead(refs.secondaryHead, sampled.secondaryHead);
    }
  }

  if (refs.glowGroup && refs.glowPath) {
    if (snapshot.glowOpacity > 0.001) {
      const headUnits = snapshot.glowPhase * PATH_LENGTH_SCALE;
      refs.glowGroup.setAttribute('opacity', snapshot.glowOpacity.toFixed(3));
      refs.glowPath.setAttribute(
        'stroke-dashoffset',
        wrapDashOffset(headUnits - GLOW_LEAD_SEGMENT_UNITS),
      );
      if (refs.glowTailPath) {
        refs.glowTailPath.setAttribute(
          'stroke-dashoffset',
          wrapDashOffset(headUnits - GLOW_TAIL_SEGMENT_UNITS),
        );
      }
    } else {
      refs.glowGroup.setAttribute('opacity', '0');
    }
  }
}

interface ZodiacProgressiveSvgProps {
  uidPrefix: string;
  dataPart: 'emblem' | 'wordmark';
  layer: ZodiacIlluminationLayerData;
  schedule: CompiledZodiacSchedule;
  completedGlowRoute?: ZodiacRoutePath;
  headRadius: number;
  glowStrokeWidth: number;
  showTravelingHeads?: boolean;
  showGuides?: boolean;
  preserveAspectRatio: string;
  className?: string;
  style?: CSSProperties;
  refs: MutableRefObject<ZodiacLayerRefs>;
}

function ZodiacProgressiveSvg({
  uidPrefix,
  dataPart,
  layer,
  schedule,
  completedGlowRoute,
  headRadius,
  glowStrokeWidth,
  showTravelingHeads = true,
  showGuides = false,
  preserveAspectRatio,
  className,
  style,
  refs,
}: ZodiacProgressiveSvgProps) {
  const { minX, minY, width, height } = layer.viewBox;
  const highlightColor = layer.gradient.stops[0]?.color ?? 'currentColor';

  const canonicalPathId = `${uidPrefix}-canonical`;
  const gradientId = `${uidPrefix}-gradient`;
  const canonicalClipId = `${uidPrefix}-canonical-clip`;
  const outlineMaskId = `${uidPrefix}-outline-mask`;
  const fillMaskId = `${uidPrefix}-fill-mask`;
  const headGradPrimaryId = `${uidPrefix}-head-primary`;
  const headGradSecondaryId = `${uidPrefix}-head-secondary`;

  const primaryCoreRadius = Number((headRadius * 0.2).toFixed(2));
  const secondaryHaloRadius = Number((headRadius * (13 / 14)).toFixed(2));
  const secondaryCoreRadius = Number((headRadius * (2.4 / 14)).toFixed(2));

  return (
    <svg
      data-zodiac-part={dataPart}
      viewBox={`${minX} ${minY} ${width} ${height}`}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
      focusable="false"
      style={style}
      className={className}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1={layer.gradient.x1}
          y1={layer.gradient.y1}
          x2={layer.gradient.x2}
          y2={layer.gradient.y2}
          gradientUnits={layer.gradient.gradientUnits ?? 'objectBoundingBox'}
        >
          {layer.gradient.stops.map((stop, idx) => (
            <stop
              key={`${stop.offset}-${idx}`}
              offset={stop.offset}
              stopColor={stop.color}
              stopOpacity={stop.opacity}
            />
          ))}
        </linearGradient>

        <path
          id={canonicalPathId}
          d={layer.canonicalPath}
          fillRule={layer.fillRule}
          clipRule={layer.clipRule}
        />

        <clipPath id={canonicalClipId} clipPathUnits="userSpaceOnUse">
          <use href={`#${canonicalPathId}`} clipRule={layer.clipRule} />
        </clipPath>

        {schedule.fillBranches.map((branch, idx) =>
          branch.clipPathD ? (
            <clipPath
              key={branch.id}
              id={`${uidPrefix}-region-clip-${idx}`}
              clipPathUnits="userSpaceOnUse"
            >
              <path d={branch.clipPathD} clipRule={layer.clipRule} />
            </clipPath>
          ) : null,
        )}

        <mask
          id={outlineMaskId}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x={minX}
          y={minY}
          width={width}
          height={height}
          style={{ maskType: 'alpha' }}
        >
          {schedule.outlineGuides.map((guide) => (
            <path
              key={guide.guideId}
              ref={(el) => {
                refs.current.outlinePaths[guide.guideIndex] = el;
              }}
              d={guide.d}
              fill="none"
              stroke="white"
              strokeWidth={guide.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={PATH_LENGTH_SCALE}
              strokeDasharray={`${PATH_LENGTH_SCALE} ${PATH_LENGTH_SCALE}`}
              strokeDashoffset={PATH_LENGTH_SCALE}
              strokeOpacity={0}
            />
          ))}
        </mask>

        <mask
          id={fillMaskId}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x={minX}
          y={minY}
          width={width}
          height={height}
          style={{ maskType: 'alpha' }}
        >
          {schedule.fillBranches.map((branch, idx) => (
            <g
              key={branch.id}
              clipPath={branch.clipPathD ? `url(#${uidPrefix}-region-clip-${idx})` : undefined}
            >
              {branch.guides.map((guide) => (
                <path
                  key={guide.guideId}
                  ref={(el) => {
                    refs.current.fillPaths[guide.guideIndex] = el;
                  }}
                  d={guide.d}
                  fill="none"
                  stroke="white"
                  strokeWidth={guide.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={PATH_LENGTH_SCALE}
                  strokeDasharray={`${PATH_LENGTH_SCALE} ${PATH_LENGTH_SCALE}`}
                  strokeDashoffset={PATH_LENGTH_SCALE}
                  strokeOpacity={0}
                />
              ))}
            </g>
          ))}
        </mask>

        {showTravelingHeads ? (
          <>
            <radialGradient id={headGradPrimaryId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={highlightColor} stopOpacity={0.95} />
              <stop offset="35%" stopColor={highlightColor} stopOpacity={0.42} />
              <stop offset="100%" stopColor={highlightColor} stopOpacity={0} />
            </radialGradient>

            <radialGradient id={headGradSecondaryId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={highlightColor} stopOpacity={0.85} />
              <stop offset="40%" stopColor={highlightColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={highlightColor} stopOpacity={0} />
            </radialGradient>
          </>
        ) : null}
      </defs>

      {/* Layer 1: Dim original canonical artwork (~35% opacity at rest) */}
      <use
        ref={(el) => {
          refs.current.dimLayer = el;
        }}
        href={`#${canonicalPathId}`}
        fill={`url(#${gradientId})`}
        fillRule={layer.fillRule}
        opacity={BASE_DIM_OPACITY}
      />

      {/* Layer 2: Progressive interior outline band clipped to canonical silhouette */}
      <g
        ref={(el) => {
          refs.current.outlineLayer = el;
        }}
        clipPath={`url(#${canonicalClipId})`}
      >
        <use
          href={`#${canonicalPathId}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={layer.outlineBandStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          mask={`url(#${outlineMaskId})`}
        />
      </g>

      {/* Layer 3: Progressive fill layer using canonical artwork + region-specific masks */}
      <use
        href={`#${canonicalPathId}`}
        fill={`url(#${gradientId})`}
        fillRule={layer.fillRule}
        mask={`url(#${fillMaskId})`}
      />

      {/* Layer 4: Traveling light heads (emblem-dominant; omitted for wordmark & symbol) */}
      {showTravelingHeads ? (
        <>
          <g
            ref={(el) => {
              refs.current.secondaryHead = el;
            }}
            opacity={0}
          >
            <circle cx={0} cy={0} r={secondaryHaloRadius} fill={`url(#${headGradSecondaryId})`} />
            <circle cx={0} cy={0} r={secondaryCoreRadius} fill={highlightColor} opacity={0.85} />
          </g>
          <g
            ref={(el) => {
              refs.current.primaryHead = el;
            }}
            opacity={0}
          >
            <circle cx={0} cy={0} r={headRadius} fill={`url(#${headGradPrimaryId})`} />
            <circle cx={0} cy={0} r={primaryCoreRadius} fill={highlightColor} opacity={0.95} />
          </g>
        </>
      ) : null}

      {/* Layer 5: Illustration-only completed glow (8.0s loop, trailing 12% + leading 2%) */}
      {completedGlowRoute ? (
        <g
          ref={(el) => {
            refs.current.glowGroup = el;
          }}
          data-zodiac-glow="completed"
          clipPath={`url(#${canonicalClipId})`}
          opacity={0}
        >
          <path
            ref={(el) => {
              refs.current.glowTailPath = el;
            }}
            data-zodiac-glow-segment="trailing"
            d={completedGlowRoute.d}
            fill="none"
            stroke={GLOW_HIGHLIGHT_COLOR}
            strokeWidth={Number((glowStrokeWidth * 1.15).toFixed(2))}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={PATH_LENGTH_SCALE}
            strokeDasharray={GLOW_TAIL_DASH_ARRAY}
            strokeDashoffset={0}
            opacity={GLOW_TAIL_OPACITY_RATIO}
          />
          <path
            ref={(el) => {
              refs.current.glowPath = el;
            }}
            data-zodiac-glow-segment="leading"
            d={completedGlowRoute.d}
            fill="none"
            stroke={GLOW_HIGHLIGHT_COLOR}
            strokeWidth={glowStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={PATH_LENGTH_SCALE}
            strokeDasharray={GLOW_LEAD_DASH_ARRAY}
            strokeDashoffset={0}
          />
        </g>
      ) : null}

      {showGuides ? (
        <g data-zodiac-guide-overlay="true" opacity={0.7}>
          {schedule.outlineGuides.map((guide) => (
            <path
              key={`dbg-o-${guide.guideId}`}
              d={guide.d}
              fill="none"
              stroke="var(--cosmos-star-blue)"
              strokeWidth={1.1}
              strokeDasharray="3 2"
            />
          ))}
          {schedule.fillGuides.map((guide) => (
            <path
              key={`dbg-f-${guide.guideId}`}
              d={guide.d}
              fill="none"
              stroke="var(--cosmos-lavender)"
              strokeWidth={1.1}
            />
          ))}
          {completedGlowRoute ? (
            <path
              d={completedGlowRoute.d}
              fill="none"
              stroke={GLOW_HIGHLIGHT_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          ) : null}
        </g>
      ) : null}
    </svg>
  );
}

/**
 * Shared Zodiac SVG illumination renderer.
 * Coordinates the 42% / 4% / 54% editorial split composition across static and
 * progressive states, keeping title + symbol centered alongside the illustration
 * off a single shared playhead controller.
 */
export function ZodiacIllumination({
  sign,
  active = false,
  enabled = true,
  manualProgress,
  disableGlow = false,
  onFrame,
  fallbackSvgUrl,
  fallbackWordmarkSvgUrl,
  showWordmark = true,
  showSymbol = true,
  showGuides = false,
  presentation = 'hover',
  forwardSpeed,
  className,
}: ZodiacIlluminationProps) {
  const rawUid = useId();
  const uid = rawUid.replace(/:/g, '');

  const containerRef = useRef<HTMLDivElement>(null);
  const emblemRefs = useRef<ZodiacLayerRefs>(createLayerRefs());
  const wordmarkRefs = useRef<ZodiacLayerRefs>(createLayerRefs());
  const symbolRefs = useRef<ZodiacLayerRefs>(createLayerRefs());

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const activeRef = useRef(active && enabled);
  activeRef.current = active && enabled;
  const manualProgressRef = useRef(manualProgress);
  manualProgressRef.current = manualProgress;

  const controllerRef = useRef<ZodiacPlayheadController | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [noHover, setNoHover] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [asset, setAsset] = useState<LoadedZodiacAsset | null>(() => getCachedZodiacAsset(sign));
  const [loadFailed, setLoadFailed] = useState(false);
  const [wordmarkImgFailed, setWordmarkImgFailed] = useState(false);
  const [hasActivated, setHasActivated] = useState(
    () => (active && enabled) || typeof manualProgress === 'number',
  );

  // Mount enhanced SVG DOM only on activation intent or manual inspection.
  useEffect(() => {
    if ((active && enabled) || typeof manualProgress === 'number') {
      setHasActivated(true);
    }
  }, [active, enabled, manualProgress]);

  // Reset per-sign asset state if sign changes.
  useEffect(() => {
    const cached = getCachedZodiacAsset(sign);
    setAsset(cached);
    setLoadFailed(false);
    setWordmarkImgFailed(false);
    resetLayerRefs(emblemRefs.current);
    resetLayerRefs(wordmarkRefs.current);
    resetLayerRefs(symbolRefs.current);
  }, [sign]);

  // Listen to reduced-motion and hover capability media queries.
  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const noHoverQuery = window.matchMedia('(hover: none)');

    const syncMedia = () => {
      setPrefersReducedMotion(reducedQuery.matches);
      setNoHover(noHoverQuery.matches);
    };
    syncMedia();

    reducedQuery.addEventListener('change', syncMedia);
    noHoverQuery.addEventListener('change', syncMedia);
    return () => {
      reducedQuery.removeEventListener('change', syncMedia);
      noHoverQuery.removeEventListener('change', syncMedia);
    };
  }, []);

  // Pause when document tab is hidden.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncVisibility = () => {
      setIsTabVisible(document.visibilityState !== 'hidden');
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  // Pause when offscreen via IntersectionObserver (registered once activated to avoid idle overhead).
  useEffect(() => {
    const el = containerRef.current;
    if (!hasActivated || !el || typeof IntersectionObserver !== 'function') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInViewport(entry.isIntersecting);
        }
      },
      { threshold: 0.01 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [hasActivated]);

  const staticFullFallback =
    presentation === 'static' ||
    prefersReducedMotion ||
    (presentation !== 'loader' && noHover) ||
    loadFailed;

  // Lazy-load enhancement data when enabled and near/in viewport or activated.
  useEffect(() => {
    if (staticFullFallback || asset || loadFailed) return;
    if (!enabled && typeof manualProgress !== 'number') return;
    if (!isInViewport && !active && typeof manualProgress !== 'number') return;
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        (presentation !== 'loader' && window.matchMedia('(hover: none)').matches))
    ) {
      return;
    }

    let cancelled = false;
    loadZodiacEnhancement(sign)
      .then((loaded) => {
        if (!cancelled) {
          setAsset(loaded);
        }
      })
      .catch(() => {
        if (!cancelled && (activeRef.current || typeof manualProgressRef.current === 'number')) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    sign,
    staticFullFallback,
    asset,
    loadFailed,
    isInViewport,
    active,
    enabled,
    manualProgress,
    presentation,
  ]);

  const symbolDefinition = showSymbol ? getZodiacSymbolDefinition(sign) : null;
  const symbolSchedule = showSymbol ? getCompiledSymbolSchedule(sign) : null;

  const shouldMountEnhancedSvg = Boolean(asset) && !staticFullFallback && hasActivated;
  const paused = !isInViewport || !isTabVisible || !enabled;

  // Create/destroy playhead controller when enhanced SVG mounts.
  useIsomorphicLayoutEffect(() => {
    if (!shouldMountEnhancedSvg || !asset) {
      controllerRef.current?.destroy();
      controllerRef.current = null;
      resetLayerRefs(emblemRefs.current);
      resetLayerRefs(wordmarkRefs.current);
      resetLayerRefs(symbolRefs.current);
      return;
    }

    resetLayerRefs(emblemRefs.current);
    resetLayerRefs(wordmarkRefs.current);
    resetLayerRefs(symbolRefs.current);

    const emblemBuffer = createFrameBuffer(asset.schedule);
    const wordmarkSchedule = showWordmark ? asset.wordmarkSchedule : undefined;
    const wordmarkBuffer = wordmarkSchedule ? createFrameBuffer(wordmarkSchedule) : null;
    const activeSymbolSchedule = showSymbol ? symbolSchedule : null;
    const symbolBuffer = activeSymbolSchedule ? createFrameBuffer(activeSymbolSchedule) : null;

    let releaseScheduled = false;

    const applySnapshot = (snapshot: ZodiacControllerSnapshot) => {
      applyLayerFrame(asset.schedule, snapshot, emblemBuffer, emblemRefs.current, {
        showTravelingHeads: true,
      });
      if (wordmarkSchedule && wordmarkBuffer) {
        applyLayerFrame(wordmarkSchedule, snapshot, wordmarkBuffer, wordmarkRefs.current, {
          showTravelingHeads: false,
        });
      }
      if (activeSymbolSchedule && symbolBuffer) {
        applyLayerFrame(activeSymbolSchedule, snapshot, symbolBuffer, symbolRefs.current, {
          showTravelingHeads: false,
        });
      }
      onFrameRef.current?.(snapshot);

      // Release enhanced SVG nodes only after fully settling back to idle (never mid-flight).
      if (
        !releaseScheduled &&
        typeof manualProgressRef.current !== 'number' &&
        !activeRef.current &&
        snapshot.settled &&
        snapshot.p <= 0 &&
        snapshot.target <= 0 &&
        snapshot.glowOpacity <= 0
      ) {
        releaseScheduled = true;
        setHasActivated(false);
      }
    };

    const initialP = typeof manualProgress === 'number' ? clamp01(manualProgress) : 0;
    const controller = createZodiacPlayheadController({
      initialP,
      glowEnabled: !disableGlow,
      forwardMaxSpeed: forwardSpeed && forwardSpeed > 0 ? forwardSpeed : undefined,
      onRender: applySnapshot,
    });
    controllerRef.current = controller;

    // Apply initial frame synchronously before paint.
    applySnapshot(controller.getSnapshot());

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
    // Intentionally recreate only when sign/asset/mount eligibility changes.
  }, [shouldMountEnhancedSvg, asset, sign, showWordmark, showSymbol, symbolSchedule]);

  // Synchronize target, pause, glow, and manual scrubber updates without recreating controller.
  useIsomorphicLayoutEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    controller.setGlowEnabled(!disableGlow);
    controller.setForwardSpeed(forwardSpeed ?? 0);
    controller.setPaused(paused);

    if (typeof manualProgress === 'number') {
      controller.setManualProgress(manualProgress, {
        runCompletedGlow: active && enabled && !disableGlow && manualProgress >= 1,
      });
      return;
    }

    const wantActive = active && enabled;
    controller.setTarget(wantActive ? 1 : 0);
    if (!wantActive) {
      const snap = controller.getSnapshot();
      if (snap.settled && snap.p <= 0 && snap.target <= 0 && snap.glowOpacity <= 0) {
        setHasActivated(false);
      }
    }
  }, [active, enabled, paused, disableGlow, manualProgress, shouldMountEnhancedSvg, forwardSpeed]);

  const canonicalUrl =
    fallbackSvgUrl ?? asset?.data.canonicalSvgUrl ?? getZodiacCanonicalSvgUrl(sign);
  const wordmarkStaticUrl =
    fallbackWordmarkSvgUrl ?? asset?.data.wordmark?.staticSvgUrl ?? getZodiacWordmarkSvgUrl(sign);

  if (!shouldMountEnhancedSvg || !asset) {
    return (
      <div
        ref={containerRef}
        data-zodiac-sign={sign}
        data-zodiac-mode={staticFullFallback ? 'static-full' : 'idle-dim'}
        data-zodiac-presentation={presentation}
        className={cn(styles.root, className)}
      >
        <div className={styles.editorialColumn} data-zodiac-column="editorial">
          {showWordmark && !wordmarkImgFailed ? (
            <div className={styles.wordmarkSlot}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-zodiac-part="wordmark"
                src={wordmarkStaticUrl}
                alt=""
                aria-hidden="true"
                draggable={false}
                onError={() => setWordmarkImgFailed(true)}
                className={cn(
                  styles.staticWordmarkImage,
                  !staticFullFallback && styles.staticImageDim,
                )}
              />
            </div>
          ) : null}

          {showSymbol && symbolDefinition ? (
            <div className={styles.symbolSlot}>
              <ZodiacSymbolStaticSvg
                definition={symbolDefinition}
                className={cn(styles.symbolSvg, !staticFullFallback && styles.staticImageDim)}
              />
            </div>
          ) : null}
        </div>

        <div className={styles.illustrationColumn} data-zodiac-column="illustration">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-zodiac-part="emblem"
            src={canonicalUrl}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={cn(styles.staticImage, !staticFullFallback && styles.staticImageDim)}
          />
        </div>
      </div>
    );
  }

  const { data, schedule, wordmarkSchedule } = asset;
  const wordmarkData = showWordmark ? data.wordmark : undefined;

  return (
    <div
      ref={containerRef}
      data-zodiac-sign={sign}
      data-zodiac-mode="enhanced"
      data-zodiac-presentation={presentation}
      className={cn(styles.root, className)}
    >
      <div className={styles.editorialColumn} data-zodiac-column="editorial">
        {wordmarkData && wordmarkSchedule ? (
          <div className={styles.wordmarkSlot} data-zodiac-wordmark={wordmarkData.text}>
            <ZodiacProgressiveSvg
              uidPrefix={`${uid}-wm`}
              dataPart="wordmark"
              layer={wordmarkData}
              schedule={wordmarkSchedule}
              headRadius={0}
              glowStrokeWidth={0}
              showTravelingHeads={false}
              showGuides={showGuides}
              preserveAspectRatio="xMidYMid meet"
              className={styles.wordmarkSvg}
              refs={wordmarkRefs}
            />
          </div>
        ) : null}

        {showSymbol && symbolDefinition && symbolSchedule ? (
          <div className={styles.symbolSlot}>
            <ZodiacSymbolProgressiveSvg
              uidPrefix={uid}
              definition={symbolDefinition}
              schedule={symbolSchedule}
              refs={symbolRefs}
              showGuides={showGuides}
              className={styles.symbolSvg}
            />
          </div>
        ) : null}
      </div>

      <div className={styles.illustrationColumn} data-zodiac-column="illustration">
        <ZodiacProgressiveSvg
          uidPrefix={uid}
          dataPart="emblem"
          layer={data}
          schedule={schedule}
          completedGlowRoute={data.completedGlowRoute}
          headRadius={DEFAULT_EMBLEM_HEAD_RADIUS}
          glowStrokeWidth={DEFAULT_EMBLEM_GLOW_STROKE_WIDTH}
          showTravelingHeads
          showGuides={showGuides}
          preserveAspectRatio="xMidYMid meet"
          className={styles.emblemSvg}
          refs={emblemRefs}
        />
      </div>
    </div>
  );
}
