/**
 * Shared types and runtime contracts for Zodiac SVG illumination.
 * Kept pure and framework-free so schedule compilation, frame sampling,
 * and enhancement data schemas can be shared across worker/test environments.
 */

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type ZodiacBranchKind = 'major' | 'detail-group';

export type ZodiacTransitionKind = 'connected' | 'backtrack' | 'pen-lift';

export type ZodiacPhase = 'idle' | 'outline' | 'fill' | 'complete';

export interface ZodiacViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface ZodiacGradientStop {
  offset: string;
  color: string;
  opacity?: number;
}

export interface ZodiacGradientDef {
  id: string;
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  gradientUnits?: 'objectBoundingBox' | 'userSpaceOnUse';
  stops: readonly ZodiacGradientStop[];
}

/**
 * Normalized arc-length lookup sample:
 * [normalizedArcLength in 0..1, x in viewBox, y in viewBox].
 */
export type ZodiacLutPoint = readonly [s: number, x: number, y: number];

export interface ZodiacRoutePath {
  id: string;
  /** SVG path data in canonical viewBox coordinates. */
  d: string;
  /** Geometric length of `d` in viewBox coordinates. */
  length: number;
  /** Pre-sampled arc-length lookup table sorted ascending from s = 0 to s = 1. */
  lut: readonly ZodiacLutPoint[];
}

export interface ZodiacGuidePath extends ZodiacRoutePath {
  /** Stroke width in viewBox coordinates used inside the alpha mask. */
  strokeWidth: number;
  /** Source contour indices in the canonical compound path covered by this guide. */
  contourIndices: readonly number[];
}

export interface ZodiacBranch {
  id: string;
  label: string;
  parentId: string | null;
  kind: ZodiacBranchKind;
  /** Ordered child branch IDs visited recursively after this branch's outlines. */
  children: readonly string[];
  /** Source contour indices associated with this branch. */
  contourIndices: readonly number[];
  /** Transition from the preceding DFS step into this branch. */
  entryTransition: ZodiacTransitionKind;
  /** Head-only backtrack path when `entryTransition === 'backtrack'`. */
  entryPath?: ZodiacRoutePath;
  /** Ordered outline guide segments traced during the forward DFS visit. */
  outlineGuides: readonly ZodiacGuidePath[];
  /** Optional head-only backtrack path executed after this branch subtree completes. */
  backtrackGuide?: ZodiacRoutePath;
}

export interface ZodiacFillRegion {
  id: string;
  label: string;
  /** Linked semantic branch ID from the traversal forest. */
  branchId: string;
  kind: ZodiacBranchKind;
  /** Deterministic DFS fill execution order (0, 1, 2, ...). */
  order: number;
  /** SVG path data defining the region clip boundary (evaluated with clip-rule="evenodd"). */
  clipPathD: string;
  /** Source contour indices covered by this fill region. */
  contourIndices: readonly number[];
  /** Transition from the preceding fill step into this region. */
  entryTransition: ZodiacTransitionKind;
  /** Head-only backtrack path when `entryTransition === 'backtrack'`. */
  entryPath?: ZodiacRoutePath;
  /** Shape-following advancing guides rendered inside `clipPathD` within the fill mask. */
  fillGuides: readonly ZodiacGuidePath[];
  /** Optional head-only backtrack path executed after this region completes. */
  backtrackGuide?: ZodiacRoutePath;
}

export interface ZodiacIlluminationLayerData {
  viewBox: ZodiacViewBox;
  gradient: ZodiacGradientDef;
  /** Exact compound `d` path string from the canonical SVG. */
  canonicalPath: string;
  fillRule: 'evenodd' | 'nonzero';
  clipRule: 'evenodd' | 'nonzero';
  /** Total closed contour count audited in the canonical compound path. */
  contourCount: number;
  /** Interior outline band stroke width in viewBox coordinates. */
  outlineBandStrokeWidth: number;
  /** Ordered root branch IDs forming the DFS forest. */
  roots: readonly string[];
  /** Semantic DFS branches for the outline phase. */
  branches: readonly ZodiacBranch[];
  /** Ordered fill regions for the fill phase. */
  fillRegions: readonly ZodiacFillRegion[];
}

export interface ZodiacWordmarkData extends ZodiacIlluminationLayerData {
  /** Uppercase display label for accessibility / metadata (e.g. 'AQUARIUS'). */
  text: string;
  /** Path to the standalone static Champagne Rose Gold SVG under `public/`. */
  staticSvgUrl?: string;
  /** Optional closed contour route for the 5.5s completed-state moving glow. */
  completedGlowRoute?: ZodiacRoutePath;
  /** Optional traveling light head outer halo radius in wordmark viewBox units. */
  headRadius?: number;
  /** Optional completed-state glow stroke width in wordmark viewBox units. */
  glowStrokeWidth?: number;
}

export interface ZodiacEnhancementData extends ZodiacIlluminationLayerData {
  version: 1;
  sign: ZodiacSign;
  /** Lowercase hex SHA-256 of `public/visuals/zodiac/<sign>.svg`. */
  sourceSha256: string;
  /** Path to the byte-identical canonical SVG under `public/`. */
  canonicalSvgUrl: string;
  /** Closed contour route for the 5.5s completed-state moving glow. */
  completedGlowRoute: ZodiacRoutePath;
  /** Optional synchronized vector wordmark illumination data for the top-left corner. */
  wordmark?: ZodiacWordmarkData;
}

export interface CompiledGuideSpan {
  guideIndex: number;
  guideId: string;
  d: string;
  length: number;
  strokeWidth: number;
  lut: readonly ZodiacLutPoint[];
  startP: number;
  endP: number;
}

export interface CompiledBranchInterval {
  id: string;
  kind: ZodiacBranchKind;
  phase: 'outline' | 'fill';
  clipPathD?: string;
  startP: number;
  endP: number;
  guides: readonly CompiledGuideSpan[];
}

export interface CompiledTransitionInterval {
  id: string;
  kind: 'backtrack' | 'pen-lift';
  phase: 'outline' | 'fill';
  startP: number;
  endP: number;
  path?: ZodiacRoutePath;
  fromPoint: readonly [number, number];
  toPoint: readonly [number, number];
}

export interface CompiledZodiacSchedule {
  sign: ZodiacSign;
  outlinePhaseEnd: number;
  outlineBranches: readonly CompiledBranchInterval[];
  fillBranches: readonly CompiledBranchInterval[];
  transitions: readonly CompiledTransitionInterval[];
  /** Flat lookup of outline guide spans in deterministic execution order. */
  outlineGuides: readonly CompiledGuideSpan[];
  /** Flat lookup of fill guide spans in deterministic execution order. */
  fillGuides: readonly CompiledGuideSpan[];
}

export interface TravelingHeadSample {
  visible: boolean;
  x: number;
  y: number;
  opacity: number;
}

export interface SampledZodiacFrame {
  p: number;
  phase: ZodiacPhase;
  /** Progress in [0, 1] for each outline guide aligned with `schedule.outlineGuides`. */
  outlineProgress: readonly number[];
  /** Progress in [0, 1] for each fill guide aligned with `schedule.fillGuides`. */
  fillProgress: readonly number[];
  /** Primary traveling light spot (active guide, backtrack, or pen-lift fade). */
  primaryHead: TravelingHeadSample;
  /** Secondary traveling light spot during 12% adjacent branch overlap. */
  secondaryHead: TravelingHeadSample;
}

export interface PlayheadState {
  p: number;
  v: number;
  target: number;
  glowPhase: number;
  glowOpacity: number;
}

export interface ZodiacControllerSnapshot {
  p: number;
  v: number;
  target: number;
  phase: ZodiacPhase;
  glowPhase: number;
  glowOpacity: number;
  settled: boolean;
}

export interface ZodiacLayerRefs {
  dimLayer: SVGElement | null;
  outlineLayer: SVGGElement | null;
  outlinePaths: Array<SVGPathElement | null>;
  fillPaths: Array<SVGPathElement | null>;
  primaryHead: SVGGElement | null;
  secondaryHead: SVGGElement | null;
  glowGroup: SVGGElement | null;
  glowPath: SVGPathElement | null;
  glowTailPath: SVGPathElement | null;
  lastAppliedP: number | null;
}

export interface ZodiacIlluminationProps {
  sign: ZodiacSign;
  /** Whether interaction intent is active (hover or :focus-visible on the owning card link). */
  active?: boolean;
  /** External lifecycle gate (e.g. collection revealComplete). Defaults to true. */
  enabled?: boolean;
  /** Optional controlled playhead override in [0, 1] for preview scrubbing/inspection. */
  manualProgress?: number;
  /** Suppress completed-state moving glow loop (for static fidelity comparison). */
  disableGlow?: boolean;
  /** Optional imperative frame telemetry hook (called on animation/scrub updates without React re-renders). */
  onFrame?: (snapshot: ZodiacControllerSnapshot) => void;
  /** Canonical SVG fallback URL (defaults to `/visuals/zodiac/${sign}.svg`). */
  fallbackSvgUrl?: string;
  /** Canonical static wordmark SVG fallback URL (defaults to `/visuals/zodiac/${sign}-wordmark.svg`). */
  fallbackWordmarkSvgUrl?: string;
  /** Whether to render the synchronized Zodiac wordmark when available. Defaults to true. */
  showWordmark?: boolean;
  /** Whether to render the canonical Zodiac symbol beneath the title when available. Defaults to true. */
  showSymbol?: boolean;
  /** Preview-only diagnostic overlay showing vector guide paths over masks. Defaults to false. */
  showGuides?: boolean;
  className?: string;
}
