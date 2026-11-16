// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearZodiacLoaderCache, loadZodiacEnhancement } from '@/features/zodiac/loader';
import {
  BRANCH_OVERLAP_RATIO,
  compileZodiacLayerSchedule,
  OUTLINE_PHASE_END,
  sampleZodiacFrame,
} from '@/features/zodiac/schedule';
import type { ZodiacEnhancementData, ZodiacSign } from '@/features/zodiac/types';
import { ZodiacIllumination } from '@/features/zodiac/ZodiacIllumination';

const ROOT = process.cwd();
const AQUARIUS_ENHANCEMENT_PATH = path.join(
  ROOT,
  'public/visuals/zodiac/aquarius-enhancement.json',
);
const AQUARIUS_WORDMARK_SVG_PATH = path.join(ROOT, 'public/visuals/zodiac/aquarius-wordmark.svg');
const ARIES_WORDMARK_SVG_PATH = path.join(ROOT, 'public/visuals/zodiac/aries-wordmark.svg');

function loadAquariusJson(): ZodiacEnhancementData {
  return JSON.parse(fs.readFileSync(AQUARIUS_ENHANCEMENT_PATH, 'utf8')) as ZodiacEnhancementData;
}

function extractSvgPathAttribute(svgText: string): string {
  const match = svgText.match(/\sd="([^"]+)"/);
  if (!match?.[1]) {
    throw new Error('SVG <path> d attribute not found');
  }
  return match[1];
}

function splitSubpaths(d: string): string[] {
  return d
    .split(/(?=M)/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const ALL_ZODIAC_SIGNS: readonly ZodiacSign[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

function sampleSubpathPolyline(subpath: string): Array<{ x: number; y: number }> {
  const tokens = subpath.match(/[MLQZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const pts: Array<{ x: number; y: number }> = [];
  let idx = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = 'M';

  while (idx < tokens.length) {
    const t = tokens[idx]!;
    if (/^[MLQZ]$/.test(t)) {
      cmd = t;
      idx += 1;
      if (cmd === 'Z') {
        pts.push({ x: sx, y: sy });
      }
      continue;
    }

    if (cmd === 'M' || cmd === 'L') {
      const x = Number(tokens[idx]!);
      const y = Number(tokens[idx + 1]!);
      idx += 2;
      if (cmd === 'M') {
        sx = x;
        sy = y;
        cmd = 'L';
      }
      cx = x;
      cy = y;
      pts.push({ x, y });
    } else if (cmd === 'Q') {
      const x1 = Number(tokens[idx]!);
      const y1 = Number(tokens[idx + 1]!);
      const x2 = Number(tokens[idx + 2]!);
      const y2 = Number(tokens[idx + 3]!);
      idx += 4;
      const steps = 6;
      for (let s = 1; s <= steps; s += 1) {
        const u = s / steps;
        const v = 1 - u;
        pts.push({
          x: v * v * cx + 2 * v * u * x1 + u * u * x2,
          y: v * v * cy + 2 * v * u * y1 + u * u * y2,
        });
      }
      cx = x2;
      cy = y2;
    } else {
      idx += 1;
    }
  }
  return pts;
}

function pointToSegDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-9) {
    const ex = px - ax;
    const ey = py - ay;
    return ex * ex + ey * ey;
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy);
}

function minSubpathContourDistance(d1: string, d2: string): number {
  const p1 = sampleSubpathPolyline(d1);
  const p2 = sampleSubpathPolyline(d2);
  let bestSq = Infinity;

  for (let i = 0; i < p1.length; i += 1) {
    const pt = p1[i]!;
    for (let j = 1; j < p2.length; j += 1) {
      const a = p2[j - 1]!;
      const b = p2[j]!;
      const d = pointToSegDistSq(pt.x, pt.y, a.x, a.y, b.x, b.y);
      if (d < bestSq) bestSq = d;
    }
  }
  for (let i = 0; i < p2.length; i += 1) {
    const pt = p2[i]!;
    for (let j = 1; j < p1.length; j += 1) {
      const a = p1[j - 1]!;
      const b = p1[j]!;
      const d = pointToSegDistSq(pt.x, pt.y, a.x, a.y, b.x, b.y);
      if (d < bestSq) bestSq = d;
    }
  }
  return Math.sqrt(bestSq);
}

function extractOuterLetterSubpaths(subpaths: string[]): string[] {
  const outers: Array<{ d: string; bounds: ReturnType<typeof getSubpathBounds> }> = [];
  for (const sp of subpaths) {
    const b = getSubpathBounds(sp);
    const prev = outers[outers.length - 1];
    const isNestedHole =
      prev !== undefined &&
      b.minX >= prev.bounds.minX - 0.5 &&
      b.maxX <= prev.bounds.maxX + 0.5 &&
      b.minY >= prev.bounds.minY - 0.5 &&
      b.maxY <= prev.bounds.maxY + 0.5;
    if (!isNestedHole) {
      outers.push({ d: sp, bounds: b });
    }
  }
  return outers.map((entry) => entry.d);
}

function getSubpathBounds(subpath: string): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const nums = subpath.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]!;
    const y = nums[i + 1]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

function setupMediaQueries(initial: { reducedMotion?: boolean; noHover?: boolean } = {}) {
  const reducedMatches = initial.reducedMotion ?? false;
  const noHoverMatches = initial.noHover ?? false;

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const isReduced = query.includes('prefers-reduced-motion');
      const isNoHover = query.includes('hover: none');
      return {
        get matches() {
          if (isReduced) return reducedMatches;
          if (isNoHover) return noHoverMatches;
          return false;
        },
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  );
}

function setupIntersectionObserver() {
  class MockIO implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [0.01];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = () => [];
  }
  vi.stubGlobal('IntersectionObserver', MockIO);
}

describe('Zodiac vector wordmark data, tight kerning, schedule & synchronized illumination', () => {
  let rafQueue: Map<number, FrameRequestCallback>;
  let nextRafId: number;

  beforeEach(() => {
    clearZodiacLoaderCache();
    rafQueue = new Map();
    nextRafId = 1;

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextRafId;
      nextRafId += 1;
      rafQueue.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue.delete(id);
    });
  });

  afterEach(() => {
    cleanup();
    clearZodiacLoaderCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('validates AQUARIUS wordmark schema, Champagne Rose Gold stops, evenodd holes, and standalone SVG parity', () => {
    const data = loadAquariusJson();
    const wordmark = data.wordmark!;
    expect(wordmark).toBeDefined();
    expect(wordmark.text).toBe('AQUARIUS');
    expect(wordmark.staticSvgUrl).toBe('/visuals/zodiac/aquarius-wordmark.svg');
    expect(wordmark.fillRule).toBe('evenodd');
    expect(wordmark.clipRule).toBe('evenodd');
    expect(wordmark.contourCount).toBe(13);
    expect(wordmark.roots).toEqual([
      'letter-0-a',
      'letter-1-q',
      'letter-2-u',
      'letter-3-a',
      'letter-4-r',
      'letter-5-i',
      'letter-6-u',
      'letter-7-s',
    ]);

    // Champagne Rose Gold gradient lives inside JSON/SVG data (#F3D3C9 -> #F0CFC5 -> #EBC5BA)
    expect(wordmark.gradient.stops).toEqual([
      { offset: '0%', color: '#F3D3C9' },
      { offset: '50%', color: '#F0CFC5' },
      { offset: '100%', color: '#EBC5BA' },
    ]);

    // Standalone SVG matches canonicalPath, evenodd rules, and Rose Gold gradient stops
    const aquariusSvg = fs.readFileSync(AQUARIUS_WORDMARK_SVG_PATH, 'utf8');
    expect(aquariusSvg).toContain('fill-rule="evenodd"');
    expect(aquariusSvg).toContain('clip-rule="evenodd"');
    expect(aquariusSvg).toContain('#F3D3C9');
    expect(aquariusSvg).toContain('#F0CFC5');
    expect(aquariusSvg).toContain('#EBC5BA');
    expect(extractSvgPathAttribute(aquariusSvg)).toBe(wordmark.canonicalPath);

    // Wordmark has positive optical contour clearance (~4-6% of cap height) and no completed glow
    expect(wordmark.completedGlowRoute).toBeUndefined();
    const outerBranchGuides = wordmark.roots.map((id) =>
      wordmark.branches.find((b) => b.id === id)!.outlineGuides[0]!,
    );
    for (let i = 1; i < outerBranchGuides.length; i += 1) {
      const leftPts = outerBranchGuides[i - 1]!.lut.map(([, x, y]) => [x, y] as const);
      const rightPts = outerBranchGuides[i]!.lut.map(([, x, y]) => [x, y] as const);
      let minDist = Infinity;
      for (const [lx, ly] of leftPts) {
        for (const [rx, ry] of rightPts) {
          const d = Math.hypot(rx - lx, ry - ly);
          if (d < minDist) minDist = d;
        }
      }
      expect(minDist).toBeGreaterThanOrEqual(4);
    }

    // Canonical symbol asset exists byte-identically under public/visuals/zodiac/
    const aquariusSymbolPublic = fs.readFileSync(
      path.join(ROOT, 'public/visuals/zodiac/aquarius-symbol.svg'),
      'utf8',
    );
    const aquariusSymbolSource = fs.readFileSync(
      path.join(ROOT, 'sources/img/zodiac/svg/11_aquarius.svg'),
      'utf8',
    );
    expect(aquariusSymbolPublic).toBe(aquariusSymbolSource);

    // Every contour 0..12 is accounted for in branches & fillRegions, with A/Q/R holes preserved
    const branchContours = new Set<number>();
    for (const branch of wordmark.branches) {
      for (const idx of branch.contourIndices) branchContours.add(idx);
    }
    expect(branchContours.size).toBe(13);

    const branchMap = new Map(wordmark.branches.map((b) => [b.id, b]));
    expect(branchMap.get('letter-0-a')?.children).toEqual(['letter-0-a-counter-0']);
    expect(branchMap.get('letter-1-q')?.children).toEqual([
      'letter-1-q-counter-0',
      'letter-1-q-counter-1',
    ]);
    expect(branchMap.get('letter-3-a')?.children).toEqual(['letter-3-a-counter-0']);
    expect(branchMap.get('letter-4-r')?.children).toEqual(['letter-4-r-counter-0']);

    const fillContours = new Set<number>();
    for (const region of wordmark.fillRegions) {
      for (const idx of region.contourIndices) fillContours.add(idx);
      expect(splitSubpaths(region.clipPathD).length).toBe(region.contourIndices.length);
    }
    expect(fillContours.size).toBe(13);
  });

  it('verifies ARIES optical editorial kerning (>= 4u clearance), curved R tail, flowing S, and evenodd holes', () => {
    const ariesSvg = fs.readFileSync(ARIES_WORDMARK_SVG_PATH, 'utf8');
    expect(ariesSvg).toContain('fill-rule="evenodd"');
    expect(ariesSvg).toContain('clip-rule="evenodd"');
    expect(ariesSvg).toContain('#F3D3C9');
    expect(ariesSvg).toContain('#F0CFC5');
    expect(ariesSvg).toContain('#EBC5BA');

    // 7 subpaths: A outer + A counter, R outer + R counter, I outer, E outer, S outer
    const subpaths = splitSubpaths(extractSvgPathAttribute(ariesSvg));
    expect(subpaths).toHaveLength(7);

    const aOuter = getSubpathBounds(subpaths[0]!);
    const aCounter = getSubpathBounds(subpaths[1]!);
    const rOuter = getSubpathBounds(subpaths[2]!);
    const rCounter = getSubpathBounds(subpaths[3]!);
    const iOuter = getSubpathBounds(subpaths[4]!);
    const eOuter = getSubpathBounds(subpaths[5]!);
    const sOuter = getSubpathBounds(subpaths[6]!);

    // Counters sit strictly inside their outer contours
    expect(aCounter.minX).toBeGreaterThan(aOuter.minX);
    expect(aCounter.maxX).toBeLessThan(aOuter.maxX);
    expect(rCounter.minX).toBeGreaterThan(rOuter.minX);
    expect(rCounter.maxX).toBeLessThan(rOuter.maxX);

    // Optical contour kerning keeps adjacent letters crisp without serif bleed/collision
    const outers = [subpaths[0]!, subpaths[2]!, subpaths[4]!, subpaths[5]!, subpaths[6]!];
    for (let i = 1; i < outers.length; i += 1) {
      const clearance = minSubpathContourDistance(outers[i - 1]!, outers[i]!);
      expect(clearance, `ARIES pair ${i - 1}-${i}`).toBeGreaterThanOrEqual(4);
      expect(clearance, `ARIES pair ${i - 1}-${i} upper bound`).toBeLessThan(12);
    }

    // R curved swash tail extends below standard flat baseline (yMax(R) > yMax(I))
    expect(rOuter.maxY).toBeGreaterThan(iOuter.maxY);
    // Flowing S maintains balanced optical relation to E without stem collision
    expect(sOuter.minX - eOuter.maxX).toBeGreaterThan(0);
    expect(sOuter.minX - eOuter.maxX).toBeLessThan(8);
  });

  it('compiles deterministic left-to-right DFS outline-before-fill schedule with 12% overlap for wordmark', () => {
    const data = loadAquariusJson();
    const schedule = compileZodiacLayerSchedule('aquarius', data.wordmark!);

    expect(schedule.outlinePhaseEnd).toBe(OUTLINE_PHASE_END);
    expect(schedule.outlineGuides).toHaveLength(13);
    expect(schedule.fillGuides).toHaveLength(8);

    // Left-to-right branch ordering & 12% connected overlap between first two branches
    expect(schedule.outlineBranches.map((b) => b.id)).toEqual([
      'letter-0-a',
      'letter-0-a-counter-0',
      'letter-1-q',
      'letter-1-q-counter-0',
      'letter-1-q-counter-1',
      'letter-2-u',
      'letter-3-a',
      'letter-3-a-counter-0',
      'letter-4-r',
      'letter-4-r-counter-0',
      'letter-5-i',
      'letter-6-u',
      'letter-7-s',
    ]);
    const b0 = schedule.outlineBranches[0]!;
    const b1 = schedule.outlineBranches[1]!;
    const overlap = b0.endP - b1.startP;
    expect(overlap).toBeCloseTo(
      BRANCH_OVERLAP_RATIO * Math.min(b0.endP - b0.startP, b1.endP - b1.startP),
      5,
    );

    // Outline phase strictly completes before fill phase starts
    for (const g of schedule.outlineGuides) {
      expect(g.endP).toBeLessThanOrEqual(OUTLINE_PHASE_END + 1e-12);
    }
    for (const g of schedule.fillGuides) {
      expect(g.startP).toBeGreaterThanOrEqual(OUTLINE_PHASE_END - 1e-12);
    }

    // Left-to-right progression checks
    const f25 = sampleZodiacFrame(schedule, 0.25);
    expect(f25.outlineProgress[0]).toBe(1); // A already outlined
    expect(f25.outlineProgress[12]).toBe(0); // S not started yet
    expect(f25.fillProgress.every((v) => v === 0)).toBe(true);

    const fOutlineDone = sampleZodiacFrame(schedule, OUTLINE_PHASE_END);
    expect(fOutlineDone.outlineProgress.every((v) => v === 1)).toBe(true);
    expect(fOutlineDone.fillProgress.every((v) => v === 0)).toBe(true);

    const f80 = sampleZodiacFrame(schedule, 0.8);
    expect(f80.outlineProgress.every((v) => v === 1)).toBe(true);
    expect(f80.fillProgress[0]).toBe(1); // A filled
    expect(f80.fillProgress[7]).toBe(0); // S fill not started yet

    const f100 = sampleZodiacFrame(schedule, 1);
    expect(f100.outlineProgress.every((v) => v === 1)).toBe(true);
    expect(f100.fillProgress.every((v) => v === 1)).toBe(true);
  });

  it('synchronizes emblem and wordmark off one playhead across scrub, reversal, and useId isolation', async () => {
    setupMediaQueries();
    setupIntersectionObserver();

    const realData = loadAquariusJson();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => realData,
      })),
    );

    const loaded = await loadZodiacEnhancement('aquarius');
    expect(loaded.wordmarkSchedule).toBeDefined();

    // Mount two instances simultaneously to check SVG ID isolation across both emblems + wordmarks
    const multi = render(
      <>
        <ZodiacIllumination sign="aquarius" manualProgress={0.5} />
        <ZodiacIllumination sign="aquarius" manualProgress={0.8} />
      </>,
    );

    await waitFor(() => {
      expect(multi.container.querySelectorAll('[data-zodiac-mode="enhanced"]')).toHaveLength(2);
    });

    const svgs = Array.from(multi.container.querySelectorAll('svg'));
    expect(svgs).toHaveLength(6); // 2 emblems + 2 wordmarks + 2 symbols
    expect(multi.container.querySelectorAll('[data-zodiac-part="emblem"]')).toHaveLength(2);
    expect(multi.container.querySelectorAll('[data-zodiac-part="wordmark"]')).toHaveLength(2);
    expect(multi.container.querySelectorAll('[data-zodiac-part="symbol"]')).toHaveLength(2);

    // Only the emblem carries traveling heads and completed glow; wordmark & symbol suppress them
    const firstEmblem = multi.container.querySelector('svg[data-zodiac-part="emblem"]')!;
    const firstWordmark = multi.container.querySelector('svg[data-zodiac-part="wordmark"]')!;
    const firstSymbol = multi.container.querySelector('svg[data-zodiac-part="symbol"]')!;
    expect(firstEmblem.querySelector('[data-zodiac-glow="completed"]')).not.toBeNull();
    expect(firstEmblem.querySelectorAll('radialGradient')).toHaveLength(2);
    expect(firstWordmark.querySelector('[data-zodiac-glow="completed"]')).toBeNull();
    expect(firstWordmark.querySelectorAll('radialGradient')).toHaveLength(0);
    expect(firstSymbol.querySelector('[data-zodiac-glow="completed"]')).toBeNull();
    expect(firstSymbol.querySelectorAll('radialGradient')).toHaveLength(0);
    expect(firstSymbol.querySelector('path[transform^="translate(9.400 44.501)"]')).not.toBeNull();

    const allIds = Array.from(multi.container.querySelectorAll('svg [id]')).map((el) =>
      el.getAttribute('id'),
    );
    expect(new Set(allIds).size).toBe(allIds.length);

    for (const svg of svgs) {
      const localIds = new Set(
        Array.from(svg.querySelectorAll('[id]')).map((el) => el.getAttribute('id')),
      );
      for (const useEl of Array.from(svg.querySelectorAll('use'))) {
        const href = useEl.getAttribute('href');
        expect(href).toMatch(/^#/);
        expect(localIds.has(href!.slice(1))).toBe(true);
      }
      for (const mask of Array.from(svg.querySelectorAll('mask'))) {
        expect(mask).toHaveAttribute('maskUnits', 'userSpaceOnUse');
        expect(mask).toHaveAttribute('maskContentUnits', 'userSpaceOnUse');
      }
    }

    cleanup();

    // Verify synchronized playhead scrub + reversal on a single card
    const snapshots: Array<{ p: number; target: number }> = [];
    const { container, rerender } = render(
      <ZodiacIllumination
        sign="aquarius"
        active={false}
        manualProgress={0}
        onFrame={(snap) => snapshots.push({ p: snap.p, target: snap.target })}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-zodiac-part="wordmark"]')).toBeInTheDocument();
    });

    const getMaskLitCount = (
      part: 'emblem' | 'wordmark' | 'symbol',
      maskSuffix: 'outline-mask' | 'fill-mask',
    ) => {
      const svg = container.querySelector(`svg[data-zodiac-part="${part}"]`)!;
      const mask = svg.querySelector(`mask[id$="-${maskSuffix}"]`)!;
      return Array.from(mask.querySelectorAll('path')).filter(
        (p) => p.getAttribute('stroke-opacity') === '1',
      ).length;
    };

    // At p=0: zero outline or fill guides lit in emblem, wordmark, and symbol
    expect(getMaskLitCount('emblem', 'outline-mask')).toBe(0);
    expect(getMaskLitCount('wordmark', 'outline-mask')).toBe(0);
    expect(getMaskLitCount('symbol', 'outline-mask')).toBe(0);
    expect(getMaskLitCount('emblem', 'fill-mask')).toBe(0);
    expect(getMaskLitCount('wordmark', 'fill-mask')).toBe(0);
    expect(getMaskLitCount('symbol', 'fill-mask')).toBe(0);

    // At p=8/13: ALL outline guides lit, ZERO fill guides lit across all 3 parts
    rerender(
      <ZodiacIllumination
        sign="aquarius"
        active={false}
        manualProgress={OUTLINE_PHASE_END}
        onFrame={(snap) => snapshots.push({ p: snap.p, target: snap.target })}
      />,
    );
    expect(getMaskLitCount('emblem', 'outline-mask')).toBe(loaded.schedule.outlineGuides.length);
    expect(getMaskLitCount('wordmark', 'outline-mask')).toBe(
      loaded.wordmarkSchedule!.outlineGuides.length,
    );
    expect(getMaskLitCount('symbol', 'outline-mask')).toBe(2);
    expect(getMaskLitCount('emblem', 'fill-mask')).toBe(0);
    expect(getMaskLitCount('wordmark', 'fill-mask')).toBe(0);
    expect(getMaskLitCount('symbol', 'fill-mask')).toBe(0);

    // At p=0.80: mid-fill on emblem, wordmark, and symbol
    rerender(
      <ZodiacIllumination
        sign="aquarius"
        active={false}
        manualProgress={0.8}
        onFrame={(snap) => snapshots.push({ p: snap.p, target: snap.target })}
      />,
    );
    const wmMidFills = getMaskLitCount('wordmark', 'fill-mask');
    expect(wmMidFills).toBeGreaterThan(0);
    expect(wmMidFills).toBeLessThan(loaded.wordmarkSchedule!.fillGuides.length);
    expect(getMaskLitCount('symbol', 'fill-mask')).toBeGreaterThan(0);

    // At p=1.0: all fills lit and dim/outline base layers dissolved for clean edges
    rerender(
      <ZodiacIllumination
        sign="aquarius"
        active={false}
        manualProgress={1}
        onFrame={(snap) => snapshots.push({ p: snap.p, target: snap.target })}
      />,
    );
    expect(getMaskLitCount('emblem', 'fill-mask')).toBe(loaded.schedule.fillGuides.length);
    expect(getMaskLitCount('wordmark', 'fill-mask')).toBe(
      loaded.wordmarkSchedule!.fillGuides.length,
    );
    expect(getMaskLitCount('symbol', 'fill-mask')).toBe(2);

    const wmSvg = container.querySelector('svg[data-zodiac-part="wordmark"]')!;
    const wmDimLayer = wmSvg.querySelector('use[opacity]')!;
    expect(wmDimLayer.getAttribute('opacity')).toBe('0.0000');

    // Interactive forward & reverse continuity (mount fresh at p=0 so controller integrates 0 -> 1 -> 0)
    cleanup();
    const liveSnapshots: Array<{ p: number; target: number }> = [];
    const live = render(
      <ZodiacIllumination
        sign="aquarius"
        active={true}
        onFrame={(snap) => liveSnapshots.push({ p: snap.p, target: snap.target })}
      />,
    );

    await waitFor(() => {
      expect(live.container.querySelector('svg[data-zodiac-part="wordmark"]')).toBeInTheDocument();
    });

    let timeMs = 0;
    const stepFrames = (n: number) => {
      for (let i = 0; i < n; i += 1) {
        const entries = Array.from(rafQueue.entries());
        rafQueue.clear();
        for (const [, cb] of entries) cb(timeMs);
        timeMs += 16.67;
      }
    };

    stepFrames(150); // ~2.5s inward (~p=0.50 at ~5.0s total duration)
    const beforeReverse = liveSnapshots[liveSnapshots.length - 1]!.p;
    expect(beforeReverse).toBeGreaterThan(0.3);
    expect(beforeReverse).toBeLessThan(0.95);

    live.rerender(
      <ZodiacIllumination
        sign="aquarius"
        active={false}
        onFrame={(snap) => liveSnapshots.push({ p: snap.p, target: snap.target })}
      />,
    );
    stepFrames(15); // ~0.25s reversal -> still mid-flight > 0
    const afterReverse = liveSnapshots[liveSnapshots.length - 1]!.p;
    expect(afterReverse).toBeLessThan(beforeReverse);
    expect(afterReverse).toBeGreaterThan(0);
    const liveWmOutlineMask = live.container.querySelector(
      'svg[data-zodiac-part="wordmark"] mask[id$="-outline-mask"]',
    )!;
    const litAfterReverse = Array.from(liveWmOutlineMask.querySelectorAll('path')).filter(
      (p) => p.getAttribute('stroke-opacity') === '1',
    ).length;
    expect(litAfterReverse).toBeGreaterThan(0);
  });

  it('renders static Champagne Rose Gold wordmark fallback on reduced motion, (hover: none), and load failure', async () => {
    setupIntersectionObserver();
    const fetchSpy = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));
    vi.stubGlobal('fetch', fetchSpy);

    // 1. Reduced motion -> static-full with both emblem & wordmark <img>, zero fetch
    setupMediaQueries({ reducedMotion: true, noHover: false });
    const reduced = render(<ZodiacIllumination sign="aquarius" active={true} />);
    expect(reduced.container.querySelector('[data-zodiac-mode="static-full"]')).toBeInTheDocument();
    expect(reduced.container.querySelector('img[data-zodiac-part="emblem"]')).toHaveAttribute(
      'src',
      '/visuals/zodiac/aquarius.svg',
    );
    const reducedWm = reduced.container.querySelector('img[data-zodiac-part="wordmark"]')!;
    expect(reducedWm).toHaveAttribute('src', '/visuals/zodiac/aquarius-wordmark.svg');
    expect(reducedWm.className).not.toContain('staticImageDim');
    expect(fetchSpy).not.toHaveBeenCalled();
    reduced.unmount();

    // 2. (hover: none) -> static-full with both <img>, zero fetch
    setupMediaQueries({ reducedMotion: false, noHover: true });
    const touch = render(<ZodiacIllumination sign="aquarius" active={true} />);
    expect(touch.container.querySelector('[data-zodiac-mode="static-full"]')).toBeInTheDocument();
    expect(touch.container.querySelector('img[data-zodiac-part="wordmark"]')).toHaveAttribute(
      'src',
      '/visuals/zodiac/aquarius-wordmark.svg',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    touch.unmount();

    // 3. Load failure -> static-full with full wordmark & emblem <img>
    clearZodiacLoaderCache();
    setupMediaQueries({ reducedMotion: false, noHover: false });
    const failed = render(<ZodiacIllumination sign="aquarius" active={true} />);
    await waitFor(() => {
      expect(
        failed.container.querySelector('[data-zodiac-mode="static-full"]'),
      ).toBeInTheDocument();
    });
    const failedWm = failed.container.querySelector('img[data-zodiac-part="wordmark"]')!;
    expect(failedWm).toHaveAttribute('src', '/visuals/zodiac/aquarius-wordmark.svg');
    expect(failedWm.className).not.toContain('staticImageDim');

    // 4. showWordmark={false} suppresses wordmark rendering
    const noWm = render(<ZodiacIllumination sign="aquarius" active={false} showWordmark={false} />);
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
    expect(noWm.container.querySelector('[data-zodiac-part="wordmark"]')).toBeNull();
  });

  it('verifies all 12 optical wordmarks (SVG + enhancement JSON) meet spacing, rose-gold, evenodd, and schedule guarantees', () => {
    for (const sign of ALL_ZODIAC_SIGNS) {
      const svgPath = path.join(ROOT, `public/visuals/zodiac/${sign}-wordmark.svg`);
      const enhancementPath = path.join(ROOT, `public/visuals/zodiac/${sign}-enhancement.json`);
      const svgText = fs.readFileSync(svgPath, 'utf8');
      const enhancement = JSON.parse(
        fs.readFileSync(enhancementPath, 'utf8'),
      ) as ZodiacEnhancementData;

      expect(svgText, `${sign} fillRule`).toContain('fill-rule="evenodd"');
      expect(svgText, `${sign} clipRule`).toContain('clip-rule="evenodd"');
      expect(svgText, `${sign} highlight stop`).toContain('#F3D3C9');
      expect(svgText, `${sign} mid stop`).toContain('#F0CFC5');
      expect(svgText, `${sign} deep stop`).toContain('#EBC5BA');

      const outers = extractOuterLetterSubpaths(splitSubpaths(extractSvgPathAttribute(svgText)));
      expect(outers, `${sign} outer letter count`).toHaveLength(sign.length);
      for (let i = 1; i < outers.length; i += 1) {
        const dist = minSubpathContourDistance(outers[i - 1]!, outers[i]!);
        expect(dist, `${sign} pair ${i - 1}-${i}`).toBeGreaterThanOrEqual(4);
      }

      const wm = enhancement.wordmark;
      expect(wm, `${sign} wordmark layer`).toBeDefined();
      expect(wm!.text).toBe(sign.toUpperCase());
      expect(wm!.completedGlowRoute, `${sign} omits wordmark glow`).toBeUndefined();
      expect(wm!.fillRule).toBe('evenodd');
      expect(wm!.clipRule).toBe('evenodd');
      expect(wm!.viewBox.height).toBeGreaterThan(50);

      expect(wm!.roots.length, `${sign} wordmark roots`).toBeGreaterThan(0);
      const expectedSubpaths = splitSubpaths(wm!.canonicalPath);
      const covered = new Set<number>();
      for (const branch of wm!.branches) {
        for (const c of branch.contourIndices) covered.add(c);
      }
      expect(covered.size, `${sign} 100% wordmark outline coverage`).toBe(expectedSubpaths.length);

      const compiled = compileZodiacLayerSchedule(sign, wm!);
      expect(compiled.outlineGuides.length, `${sign} outline guides`).toBeGreaterThan(0);
      expect(compiled.fillGuides.length, `${sign} fill guides`).toBeGreaterThan(0);
    }
  });
});
