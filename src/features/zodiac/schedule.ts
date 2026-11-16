import type {
  CompiledBranchInterval,
  CompiledGuideSpan,
  CompiledTransitionInterval,
  CompiledZodiacSchedule,
  SampledZodiacFrame,
  TravelingHeadSample,
  ZodiacBranch,
  ZodiacBranchKind,
  ZodiacEnhancementData,
  ZodiacGuidePath,
  ZodiacIlluminationLayerData,
  ZodiacLutPoint,
  ZodiacPhase,
  ZodiacRoutePath,
  ZodiacSign,
} from './types';

export const OUTLINE_PHASE_END = 8 / 13;
export const BRANCH_OVERLAP_RATIO = 0.12;
export const BACKTRACK_SPEED_MULTIPLIER = 3.2;
export const MIN_DETAIL_PHASE_SHARE = 0.035;
export const MAX_DETAIL_FLOOR_BUDGET = 0.45;
export const PEN_LIFT_SHARE = 0.014;
export const HEAD_EDGE_FADE_SPAN = 0.015;

const HIDDEN_HEAD: TravelingHeadSample = {
  visible: false,
  x: 0,
  y: 0,
  opacity: 0,
};

interface PhaseBranchStep {
  type: 'branch';
  id: string;
  kind: ZodiacBranchKind;
  clipPathD?: string;
  guides: readonly ZodiacGuidePath[];
}

interface PhaseBacktrackStep {
  type: 'backtrack';
  id: string;
  path: ZodiacRoutePath;
  fromPoint: readonly [number, number];
  toPoint: readonly [number, number];
}

interface PhasePenLiftStep {
  type: 'pen-lift';
  id: string;
  fromPoint: readonly [number, number];
  toPoint: readonly [number, number];
}

type PhaseStep = PhaseBranchStep | PhaseBacktrackStep | PhasePenLiftStep;

export function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Samples `(x, y)` along a pre-computed arc-length LUT using binary search
 * and linear interpolation. Performs zero DOM or SVG geometry calls.
 */
export function sampleLut(
  lut: readonly ZodiacLutPoint[],
  normalizedS: number,
): readonly [number, number] {
  const count = lut.length;
  if (count === 0) return [0, 0];
  const first = lut[0];
  const last = lut[count - 1];
  if (!first || !last) return [0, 0];

  const s = clamp01(normalizedS);
  if (count === 1 || s <= first[0]) return [first[1], first[2]];
  if (s >= last[0]) return [last[1], last[2]];

  let lo = 0;
  let hi = count - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    const sample = lut[mid];
    if (!sample) break;
    if (sample[0] <= s) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const a = lut[lo] ?? first;
  const b = lut[hi] ?? last;
  const span = b[0] - a[0];
  if (span <= 1e-9) return [a[1], a[2]];
  const t = (s - a[0]) / span;
  return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function getPathEndpoint(
  path: ZodiacRoutePath | undefined,
  which: 'start' | 'end',
): readonly [number, number] {
  if (!path || path.lut.length === 0) return [0, 0];
  const sample = which === 'start' ? path.lut[0] : path.lut[path.lut.length - 1];
  return sample ? [sample[1], sample[2]] : [0, 0];
}

function getGuidesEndpoint(
  guides: readonly ZodiacGuidePath[],
  which: 'start' | 'end',
): readonly [number, number] {
  if (guides.length === 0) return [0, 0];
  const guide = which === 'start' ? guides[0] : guides[guides.length - 1];
  return getPathEndpoint(guide, which);
}

function buildOutlinePhaseSteps(
  data: Pick<ZodiacIlluminationLayerData, 'roots' | 'branches'>,
): PhaseStep[] {
  const branchMap = new Map<string, ZodiacBranch>();
  for (const branch of data.branches) {
    if (branchMap.has(branch.id)) {
      throw new Error(`Duplicate zodiac branch id: "${branch.id}"`);
    }
    branchMap.set(branch.id, branch);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const steps: PhaseStep[] = [];
  let prevEndPoint: readonly [number, number] | null = null;

  const visit = (branchId: string) => {
    if (visiting.has(branchId)) {
      throw new Error(`Circular branch reference detected at "${branchId}"`);
    }
    if (visited.has(branchId)) {
      throw new Error(`Branch "${branchId}" referenced more than once in DFS forest`);
    }
    const branch = branchMap.get(branchId);
    if (!branch) {
      throw new Error(`Missing zodiac branch "${branchId}"`);
    }

    visiting.add(branchId);
    const startPoint = getGuidesEndpoint(branch.outlineGuides, 'start');
    const endPoint = getGuidesEndpoint(branch.outlineGuides, 'end');

    if (prevEndPoint !== null) {
      if (branch.entryTransition === 'pen-lift') {
        steps.push({
          type: 'pen-lift',
          id: `${branch.id}__entry-lift`,
          fromPoint: prevEndPoint,
          toPoint: startPoint,
        });
      } else if (branch.entryTransition === 'backtrack' && branch.entryPath) {
        steps.push({
          type: 'backtrack',
          id: `${branch.id}__entry-backtrack`,
          path: branch.entryPath,
          fromPoint: getPathEndpoint(branch.entryPath, 'start'),
          toPoint: getPathEndpoint(branch.entryPath, 'end'),
        });
      }
    }

    if (branch.outlineGuides.length > 0) {
      steps.push({
        type: 'branch',
        id: branch.id,
        kind: branch.kind,
        guides: branch.outlineGuides,
      });
      prevEndPoint = endPoint;
    }

    for (const childId of branch.children) {
      visit(childId);
    }

    if (branch.backtrackGuide) {
      const btStart = getPathEndpoint(branch.backtrackGuide, 'start');
      const btEnd = getPathEndpoint(branch.backtrackGuide, 'end');
      steps.push({
        type: 'backtrack',
        id: `${branch.id}__backtrack`,
        path: branch.backtrackGuide,
        fromPoint: btStart,
        toPoint: btEnd,
      });
      prevEndPoint = btEnd;
    }

    visiting.delete(branchId);
    visited.add(branchId);
  };

  for (const rootId of data.roots) {
    visit(rootId);
  }

  if (visited.size !== data.branches.length) {
    const unvisited = data.branches.filter((b) => !visited.has(b.id)).map((b) => b.id);
    throw new Error(`Unreachable zodiac branches in DFS forest: ${unvisited.join(', ')}`);
  }

  return steps;
}

function buildFillPhaseSteps(data: Pick<ZodiacIlluminationLayerData, 'fillRegions'>): PhaseStep[] {
  const sorted = [...data.fillRegions].sort((a, b) => a.order - b.order);
  const seen = new Set<string>();
  const steps: PhaseStep[] = [];
  let prevEndPoint: readonly [number, number] | null = null;

  for (const region of sorted) {
    if (seen.has(region.id)) {
      throw new Error(`Duplicate fill region id: "${region.id}"`);
    }
    seen.add(region.id);

    const startPoint = getGuidesEndpoint(region.fillGuides, 'start');
    const endPoint = getGuidesEndpoint(region.fillGuides, 'end');

    if (prevEndPoint !== null) {
      if (region.entryTransition === 'pen-lift') {
        steps.push({
          type: 'pen-lift',
          id: `${region.id}__entry-lift`,
          fromPoint: prevEndPoint,
          toPoint: startPoint,
        });
      } else if (region.entryTransition === 'backtrack' && region.entryPath) {
        steps.push({
          type: 'backtrack',
          id: `${region.id}__entry-backtrack`,
          path: region.entryPath,
          fromPoint: getPathEndpoint(region.entryPath, 'start'),
          toPoint: getPathEndpoint(region.entryPath, 'end'),
        });
      }
    }

    if (region.fillGuides.length > 0) {
      steps.push({
        type: 'branch',
        id: region.id,
        kind: region.kind,
        clipPathD: region.clipPathD,
        guides: region.fillGuides,
      });
      prevEndPoint = endPoint;
    }

    if (region.backtrackGuide) {
      const btStart = getPathEndpoint(region.backtrackGuide, 'start');
      const btEnd = getPathEndpoint(region.backtrackGuide, 'end');
      steps.push({
        type: 'backtrack',
        id: `${region.id}__backtrack`,
        path: region.backtrackGuide,
        fromPoint: btStart,
        toPoint: btEnd,
      });
      prevEndPoint = btEnd;
    }
  }

  return steps;
}

function layoutPhase(
  steps: readonly PhaseStep[],
  phase: 'outline' | 'fill',
  phaseStart: number,
  phaseEnd: number,
): {
  branches: CompiledBranchInterval[];
  transitions: CompiledTransitionInterval[];
  flatGuides: CompiledGuideSpan[];
} {
  if (steps.length === 0) {
    return { branches: [], transitions: [], flatGuides: [] };
  }

  let totalRawBranchLen = 0;
  let detailGroupCount = 0;
  for (const step of steps) {
    if (step.type === 'branch') {
      const branchLen = step.guides.reduce((sum, g) => sum + Math.max(g.length, 1), 0);
      totalRawBranchLen += branchLen;
      if (step.kind === 'detail-group') detailGroupCount += 1;
    }
  }

  const effectiveTotalLen = Math.max(totalRawBranchLen, 1);
  const detailShare =
    detailGroupCount > 0
      ? Math.min(MIN_DETAIL_PHASE_SHARE, MAX_DETAIL_FLOOR_BUDGET / detailGroupCount)
      : 0;
  const minDetailWeight = effectiveTotalLen * detailShare;
  const penLiftWeight = Math.max(12, effectiveTotalLen * PEN_LIFT_SHARE);

  const placed: Array<{
    step: PhaseStep;
    startW: number;
    endW: number;
  }> = [];

  let cursor = 0;
  let prevBranch: { startW: number; endW: number; durationW: number } | null = null;
  let sawTransitionSinceBranch = false;

  for (const step of steps) {
    if (step.type === 'branch') {
      const rawLen = Math.max(
        1,
        step.guides.reduce((sum, g) => sum + Math.max(g.length, 1), 0),
      );
      const durationW: number =
        step.kind === 'detail-group' ? Math.max(rawLen, minDetailWeight) : rawLen;
      const overlapW: number =
        prevBranch !== null && !sawTransitionSinceBranch
          ? BRANCH_OVERLAP_RATIO * Math.min(prevBranch.durationW, durationW)
          : 0;
      const startW: number = cursor - overlapW;
      const endW: number = startW + durationW;
      placed.push({ step, startW, endW });
      cursor = endW;
      prevBranch = { startW, endW, durationW };
      sawTransitionSinceBranch = false;
    } else if (step.type === 'backtrack') {
      const durationW = Math.max(8, step.path.length / BACKTRACK_SPEED_MULTIPLIER);
      const startW = cursor;
      const endW = startW + durationW;
      placed.push({ step, startW, endW });
      cursor = endW;
      sawTransitionSinceBranch = true;
    } else {
      const startW = cursor;
      const endW = startW + penLiftWeight;
      placed.push({ step, startW, endW });
      cursor = endW;
      sawTransitionSinceBranch = true;
    }
  }

  const totalWeight = Math.max(cursor, 1e-6);
  const phaseSpan = phaseEnd - phaseStart;

  const branches: CompiledBranchInterval[] = [];
  const transitions: CompiledTransitionInterval[] = [];
  const flatGuides: CompiledGuideSpan[] = [];

  for (let i = 0; i < placed.length; i += 1) {
    const entry = placed[i];
    if (!entry) continue;
    const isLast = i === placed.length - 1;
    const startP = phaseStart + (entry.startW / totalWeight) * phaseSpan;
    const endP = isLast ? phaseEnd : phaseStart + (entry.endW / totalWeight) * phaseSpan;

    if (entry.step.type === 'branch') {
      const branchSpan = Math.max(endP - startP, 1e-9);
      const guideLengths = entry.step.guides.map((g) => Math.max(g.length, 1));
      const totalGuideLen = Math.max(
        guideLengths.reduce((a, b) => a + b, 0),
        1,
      );

      const compiledGuides: CompiledGuideSpan[] = [];
      let guideCursorP = startP;
      for (let gIdx = 0; gIdx < entry.step.guides.length; gIdx += 1) {
        const guide = entry.step.guides[gIdx];
        const gLen = guideLengths[gIdx] ?? 1;
        if (!guide) continue;
        const isLastGuide = gIdx === entry.step.guides.length - 1;
        const gStartP = guideCursorP;
        const gEndP = isLastGuide ? endP : gStartP + (gLen / totalGuideLen) * branchSpan;
        guideCursorP = gEndP;

        const span: CompiledGuideSpan = {
          guideIndex: flatGuides.length,
          guideId: guide.id,
          d: guide.d,
          length: guide.length,
          strokeWidth: guide.strokeWidth,
          lut: guide.lut,
          startP: gStartP,
          endP: gEndP,
        };
        compiledGuides.push(span);
        flatGuides.push(span);
      }

      branches.push({
        id: entry.step.id,
        kind: entry.step.kind,
        phase,
        clipPathD: entry.step.clipPathD,
        startP,
        endP,
        guides: compiledGuides,
      });
    } else if (entry.step.type === 'backtrack') {
      transitions.push({
        id: entry.step.id,
        kind: 'backtrack',
        phase,
        startP,
        endP,
        path: entry.step.path,
        fromPoint: entry.step.fromPoint,
        toPoint: entry.step.toPoint,
      });
    } else {
      transitions.push({
        id: entry.step.id,
        kind: 'pen-lift',
        phase,
        startP,
        endP,
        fromPoint: entry.step.fromPoint,
        toPoint: entry.step.toPoint,
      });
    }
  }

  return { branches, transitions, flatGuides };
}

/**
 * Compiles authored traversal metadata for an emblem or wordmark layer into
 * deterministic phase intervals with 12% adjacent branch overlap, detail-group
 * minimum readable intervals, fast head-only backtracking, and pen-lift fades.
 */
export function compileZodiacLayerSchedule(
  sign: ZodiacSign,
  data: Pick<ZodiacIlluminationLayerData, 'roots' | 'branches' | 'fillRegions'>,
): CompiledZodiacSchedule {
  const outlineSteps = buildOutlinePhaseSteps(data);
  const fillSteps = buildFillPhaseSteps(data);

  const outline = layoutPhase(outlineSteps, 'outline', 0, OUTLINE_PHASE_END);
  const fill = layoutPhase(fillSteps, 'fill', OUTLINE_PHASE_END, 1);

  return {
    sign,
    outlinePhaseEnd: OUTLINE_PHASE_END,
    outlineBranches: outline.branches,
    fillBranches: fill.branches,
    transitions: [...outline.transitions, ...fill.transitions],
    outlineGuides: outline.flatGuides,
    fillGuides: fill.flatGuides,
  };
}

/**
 * Compiles authored zodiac traversal metadata into deterministic phase intervals
 * with 12% adjacent branch overlap, detail-group minimum readable intervals,
 * fast head-only backtracking, and pen-lift fade transitions.
 */
export function compileZodiacSchedule(data: ZodiacEnhancementData): CompiledZodiacSchedule {
  return compileZodiacLayerSchedule(data.sign, data);
}

function sampleBranchHead(
  branch: CompiledBranchInterval,
  p: number,
): readonly [number, number] | null {
  for (const guide of branch.guides) {
    if (p >= guide.startP && p <= guide.endP) {
      const span = guide.endP - guide.startP;
      const u = span > 1e-9 ? clamp01((p - guide.startP) / span) : 1;
      return sampleLut(guide.lut, u);
    }
  }
  const fallback = branch.guides[branch.guides.length - 1];
  return fallback ? sampleLut(fallback.lut, 1) : null;
}

export interface MutableSampledZodiacFrame {
  p: number;
  phase: ZodiacPhase;
  outlineProgress: number[];
  fillProgress: number[];
  primaryHead: { visible: boolean; x: number; y: number; opacity: number };
  secondaryHead: { visible: boolean; x: number; y: number; opacity: number };
}

export function createFrameBuffer(schedule: CompiledZodiacSchedule): MutableSampledZodiacFrame {
  return {
    p: 0,
    phase: 'idle',
    outlineProgress: new Array<number>(schedule.outlineGuides.length).fill(0),
    fillProgress: new Array<number>(schedule.fillGuides.length).fill(0),
    primaryHead: { ...HIDDEN_HEAD },
    secondaryHead: { ...HIDDEN_HEAD },
  };
}

function resetHead(target: { visible: boolean; x: number; y: number; opacity: number }): void {
  target.visible = false;
  target.x = 0;
  target.y = 0;
  target.opacity = 0;
}

/**
 * Pure deterministic frame sampler mutating a pre-allocated buffer (zero GC churn per frame).
 */
export function sampleZodiacFrameInto(
  schedule: CompiledZodiacSchedule,
  rawP: number,
  out: MutableSampledZodiacFrame,
): MutableSampledZodiacFrame {
  const p = clamp01(rawP);
  out.p = p;

  if (p <= 0) {
    out.phase = 'idle';
    out.outlineProgress.fill(0);
    out.fillProgress.fill(0);
    resetHead(out.primaryHead);
    resetHead(out.secondaryHead);
    return out;
  }

  if (p >= 1) {
    out.phase = 'complete';
    out.outlineProgress.fill(1);
    out.fillProgress.fill(1);
    resetHead(out.primaryHead);
    resetHead(out.secondaryHead);
    return out;
  }

  out.phase = p < schedule.outlinePhaseEnd ? 'outline' : 'fill';

  for (let i = 0; i < schedule.outlineGuides.length; i += 1) {
    const g = schedule.outlineGuides[i];
    if (!g) continue;
    if (p <= g.startP) {
      out.outlineProgress[i] = 0;
    } else if (p >= g.endP) {
      out.outlineProgress[i] = 1;
    } else {
      const span = g.endP - g.startP;
      out.outlineProgress[i] = span > 1e-9 ? clamp01((p - g.startP) / span) : 1;
    }
  }

  for (let i = 0; i < schedule.fillGuides.length; i += 1) {
    const g = schedule.fillGuides[i];
    if (!g) continue;
    if (p <= g.startP) {
      out.fillProgress[i] = 0;
    } else if (p >= g.endP) {
      out.fillProgress[i] = 1;
    } else {
      const span = g.endP - g.startP;
      out.fillProgress[i] = span > 1e-9 ? clamp01((p - g.startP) / span) : 1;
    }
  }

  const envelope = Math.min(
    smoothstep(0, HEAD_EDGE_FADE_SPAN, p),
    1 - smoothstep(1 - HEAD_EDGE_FADE_SPAN, 1, p),
  );

  resetHead(out.primaryHead);
  resetHead(out.secondaryHead);

  // Check active backtrack or pen-lift transitions first.
  for (const tr of schedule.transitions) {
    if (p >= tr.startP && p <= tr.endP) {
      const span = tr.endP - tr.startP;
      const u = span > 1e-9 ? clamp01((p - tr.startP) / span) : 0.5;
      if (tr.kind === 'pen-lift') {
        if (u < 0.5) {
          out.primaryHead.visible = true;
          out.primaryHead.x = tr.fromPoint[0];
          out.primaryHead.y = tr.fromPoint[1];
          out.primaryHead.opacity = (1 - u * 2) * envelope;
        } else {
          out.primaryHead.visible = true;
          out.primaryHead.x = tr.toPoint[0];
          out.primaryHead.y = tr.toPoint[1];
          out.primaryHead.opacity = (u - 0.5) * 2 * envelope;
        }
        return out;
      }
      if (tr.kind === 'backtrack' && tr.path) {
        const pt = sampleLut(tr.path.lut, u);
        out.primaryHead.visible = true;
        out.primaryHead.x = pt[0];
        out.primaryHead.y = pt[1];
        out.primaryHead.opacity = 0.85 * envelope;
        return out;
      }
    }
  }

  const activeList = out.phase === 'outline' ? schedule.outlineBranches : schedule.fillBranches;
  let firstActive: CompiledBranchInterval | null = null;
  let secondActive: CompiledBranchInterval | null = null;

  for (const branch of activeList) {
    if (p >= branch.startP && p <= branch.endP) {
      if (!firstActive) {
        firstActive = branch;
      } else {
        secondActive = branch;
        break;
      }
    }
  }

  if (firstActive && secondActive) {
    const overlapSpan = Math.max(firstActive.endP - secondActive.startP, 1e-9);
    const cross = clamp01((p - secondActive.startP) / overlapSpan);
    const pt2 = sampleBranchHead(secondActive, p);
    const pt1 = sampleBranchHead(firstActive, p);
    if (pt2) {
      out.primaryHead.visible = true;
      out.primaryHead.x = pt2[0];
      out.primaryHead.y = pt2[1];
      out.primaryHead.opacity = cross * envelope;
    }
    if (pt1) {
      out.secondaryHead.visible = true;
      out.secondaryHead.x = pt1[0];
      out.secondaryHead.y = pt1[1];
      out.secondaryHead.opacity = (1 - cross) * envelope;
    }
    return out;
  }

  if (firstActive) {
    const pt = sampleBranchHead(firstActive, p);
    if (pt) {
      out.primaryHead.visible = true;
      out.primaryHead.x = pt[0];
      out.primaryHead.y = pt[1];
      out.primaryHead.opacity = envelope;
    }
  }

  return out;
}

/**
 * Pure deterministic frame sampler returning a fresh `SampledZodiacFrame`.
 * Every rendered mask/glow state is a pure function of `p` in [0, 1].
 */
export function sampleZodiacFrame(schedule: CompiledZodiacSchedule, p: number): SampledZodiacFrame {
  const buffer = createFrameBuffer(schedule);
  sampleZodiacFrameInto(schedule, p, buffer);
  return {
    p: buffer.p,
    phase: buffer.phase,
    outlineProgress: buffer.outlineProgress,
    fillProgress: buffer.fillProgress,
    primaryHead: { ...buffer.primaryHead },
    secondaryHead: { ...buffer.secondaryHead },
  };
}
