'use client';

import type { CSSProperties, MutableRefObject } from 'react';
import type { CompiledZodiacSchedule, ZodiacLayerRefs } from './types';
import type { ZodiacSymbolDefinition } from './symbol-data';

const PATH_LENGTH_SCALE = 1000;
const BASE_DIM_OPACITY = 0.35;

export interface ZodiacSymbolStaticProps {
  definition: ZodiacSymbolDefinition;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a static canonical Zodiac symbol (`public/visuals/zodiac/{sign}-symbol.svg`)
 * using `--zodiac-rose-gold` (`currentColor`) with exact transformed geometry intact.
 */
export function ZodiacSymbolStaticSvg({ definition, className, style }: ZodiacSymbolStaticProps) {
  const { minX, minY, width, height } = definition.tightViewBox;
  return (
    <svg
      data-zodiac-part="symbol"
      viewBox={`${minX} ${minY} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path
        transform={definition.pathTransform}
        fill="currentColor"
        fillRule={definition.layer.fillRule}
        d={definition.canonicalPathD}
      />
    </svg>
  );
}

export interface ZodiacSymbolProgressiveProps {
  uidPrefix: string;
  definition: ZodiacSymbolDefinition;
  schedule: CompiledZodiacSchedule;
  refs: MutableRefObject<ZodiacLayerRefs>;
  showGuides?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Progressive outline (0..8/13) and fill (8/13..1) renderer for the canonical symbol.
 * Suppresses traveling light heads and completed glow so the illustration remains focal.
 */
export function ZodiacSymbolProgressiveSvg({
  uidPrefix,
  definition,
  schedule,
  refs,
  showGuides = false,
  className,
  style,
}: ZodiacSymbolProgressiveProps) {
  const { layer, pathTransform, canonicalPathD, outlinePathStrokeWidth, tightViewBox } = definition;
  const { minX, minY, width, height } = layer.viewBox;

  const canonicalPathId = `${uidPrefix}-sym-canonical`;
  const gradientId = `${uidPrefix}-sym-gradient`;
  const canonicalClipId = `${uidPrefix}-sym-clip`;
  const outlineMaskId = `${uidPrefix}-sym-outline-mask`;
  const fillMaskId = `${uidPrefix}-sym-fill-mask`;

  return (
    <svg
      data-zodiac-part="symbol"
      viewBox={`${tightViewBox.minX} ${tightViewBox.minY} ${tightViewBox.width} ${tightViewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
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
          transform={pathTransform}
          d={canonicalPathD}
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
              id={`${uidPrefix}-sym-region-clip-${idx}`}
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
              clipPath={branch.clipPathD ? `url(#${uidPrefix}-sym-region-clip-${idx})` : undefined}
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
      </defs>

      {/* Layer 1: Dim base symbol */}
      <use
        ref={(el) => {
          refs.current.dimLayer = el;
        }}
        href={`#${canonicalPathId}`}
        fill={`url(#${gradientId})`}
        fillRule={layer.fillRule}
        opacity={BASE_DIM_OPACITY}
      />

      {/* Layer 2: Progressive outline band clipped to canonical wave silhouette */}
      <g
        ref={(el) => {
          refs.current.outlineLayer = el;
        }}
        clipPath={`url(#${canonicalClipId})`}
      >
        <g mask={`url(#${outlineMaskId})`}>
          <use
            href={`#${canonicalPathId}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={outlinePathStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* Layer 3: Progressive fill layer masked wave-by-wave */}
      <g mask={`url(#${fillMaskId})`}>
        <use
          href={`#${canonicalPathId}`}
          fill={`url(#${gradientId})`}
          fillRule={layer.fillRule}
        />
      </g>

      {showGuides ? (
        <g data-zodiac-guide-overlay="true" opacity={0.75}>
          {schedule.outlineGuides.map((guide) => (
            <path
              key={`sym-dbg-o-${guide.guideId}`}
              d={guide.d}
              fill="none"
              stroke="var(--cosmos-star-blue)"
              strokeWidth={0.75}
              strokeDasharray="1.5 1"
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
