import { describe, expect, it } from 'vitest';
import {
  BRANCH_OVERLAP_RATIO,
  compileZodiacSchedule,
  OUTLINE_PHASE_END,
  sampleLut,
  sampleZodiacFrame,
} from '@/features/zodiac/schedule';
import type { ZodiacEnhancementData, ZodiacGuidePath } from '@/features/zodiac/types';

function makeGuide(
  id: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  length?: number,
): ZodiacGuidePath {
  const len = length ?? Math.hypot(x1 - x0, y1 - y0);
  return {
    id,
    d: `M ${x0} ${y0} L ${x1} ${y1}`,
    length: len,
    strokeWidth: 4,
    contourIndices: [0],
    lut: [
      [0, x0, y0],
      [0.5, (x0 + x1) / 2, (y0 + y1) / 2],
      [1, x1, y1],
    ],
  };
}

function makeSyntheticAtlas(): ZodiacEnhancementData {
  return {
    version: 1,
    sign: 'aquarius',
    sourceSha256: 'a'.repeat(64),
    canonicalSvgUrl: '/visuals/zodiac/aquarius.svg',
    viewBox: { minX: 0, minY: 0, width: 394, height: 484 },
    gradient: {
      id: 'aquarius-rose-gold',
      x1: '20%',
      y1: '0%',
      x2: '80%',
      y2: '100%',
      stops: [{ offset: '0%', color: 'var(--cosmos-text)' }],
    },
    canonicalPath: 'M 0 0 H 10 V 10 H 0 Z',
    fillRule: 'evenodd',
    clipRule: 'evenodd',
    contourCount: 3,
    outlineBandStrokeWidth: 3,
    roots: ['root-a', 'root-b'],
    branches: [
      {
        id: 'root-a',
        label: 'Root A',
        parentId: null,
        kind: 'major',
        children: ['child-a1', 'child-a2'],
        contourIndices: [0],
        entryTransition: 'connected',
        outlineGuides: [makeGuide('g-root-a', 10, 10, 110, 10, 100)],
        backtrackGuide: {
          id: 'bt-root-a',
          d: 'M 110 10 L 10 10',
          length: 100,
          lut: [
            [0, 110, 10],
            [1, 10, 10],
          ],
        },
      },
      {
        id: 'child-a1',
        label: 'Child A1',
        parentId: 'root-a',
        kind: 'major',
        children: [],
        contourIndices: [0],
        entryTransition: 'connected',
        outlineGuides: [makeGuide('g-child-a1', 110, 10, 210, 10, 100)],
      },
      {
        id: 'child-a2',
        label: 'Child A2 tiny details',
        parentId: 'root-a',
        kind: 'detail-group',
        children: [],
        contourIndices: [1],
        entryTransition: 'backtrack',
        entryPath: {
          id: 'entry-a2',
          d: 'M 210 10 L 110 10',
          length: 100,
          lut: [
            [0, 210, 10],
            [1, 110, 10],
          ],
        },
        outlineGuides: [makeGuide('g-child-a2', 110, 10, 114, 10, 4)],
      },
      {
        id: 'root-b',
        label: 'Satellite Root B',
        parentId: null,
        kind: 'major',
        children: [],
        contourIndices: [2],
        entryTransition: 'pen-lift',
        outlineGuides: [makeGuide('g-root-b', 300, 300, 360, 300, 60)],
      },
    ],
    fillRegions: [
      {
        id: 'fill-a',
        label: 'Fill A',
        branchId: 'root-a',
        kind: 'major',
        order: 0,
        clipPathD: 'M 0 0 H 220 V 50 H 0 Z',
        contourIndices: [0, 1],
        entryTransition: 'connected',
        fillGuides: [makeGuide('fg-a', 10, 20, 210, 20, 200)],
      },
      {
        id: 'fill-b',
        label: 'Fill B',
        branchId: 'root-b',
        kind: 'major',
        order: 1,
        clipPathD: 'M 290 290 H 370 V 330 H 290 Z',
        contourIndices: [2],
        entryTransition: 'pen-lift',
        fillGuides: [makeGuide('fg-b', 300, 300, 360, 300, 60)],
      },
    ],
    completedGlowRoute: {
      id: 'glow',
      d: 'M 10 10 L 110 10 L 110 50 L 10 50 Z',
      length: 280,
      lut: [
        [0, 10, 10],
        [0.5, 110, 50],
        [1, 10, 10],
      ],
    },
  };
}

describe('Zodiac DFS schedule compiler & deterministic frame sampler', () => {
  it('validates graph integrity and rejects duplicate, missing, circular, or unreachable branches', () => {
    const base = makeSyntheticAtlas();
    expect(() => compileZodiacSchedule(base)).not.toThrow();

    // Duplicate branch ID
    const dup: ZodiacEnhancementData = {
      ...base,
      branches: [...base.branches, { ...base.branches[0]! }],
    };
    expect(() => compileZodiacSchedule(dup)).toThrow(/Duplicate zodiac branch/);

    // Missing branch
    const missing: ZodiacEnhancementData = {
      ...base,
      roots: ['root-a', 'non-existent'],
    };
    expect(() => compileZodiacSchedule(missing)).toThrow(/Missing zodiac branch/);

    // Circular reference
    const circular: ZodiacEnhancementData = {
      ...base,
      branches: base.branches.map((b, idx) => (idx === 1 ? { ...b, children: ['root-a'] } : b)),
    };
    expect(() => compileZodiacSchedule(circular)).toThrow(/Circular branch reference/);

    // Unreachable branch
    const unreachable: ZodiacEnhancementData = {
      ...base,
      roots: ['root-a'],
    };
    expect(() => compileZodiacSchedule(unreachable)).toThrow(
      /Unreachable zodiac branches in DFS forest: root-b/,
    );

    // Duplicate fill region ID
    const dupFill: ZodiacEnhancementData = {
      ...base,
      fillRegions: [...base.fillRegions, { ...base.fillRegions[0]!, order: 2 }],
    };
    expect(() => compileZodiacSchedule(dupFill)).toThrow(/Duplicate fill region/);
  });

  it('compiles deterministic DFS order, 12% connected overlap, detail-group minimum interval, and strict outline-before-fill phases', () => {
    const schedule = compileZodiacSchedule(makeSyntheticAtlas());

    expect(schedule.outlinePhaseEnd).toBe(OUTLINE_PHASE_END);
    expect(schedule.outlineGuides.map((g) => g.guideId)).toEqual([
      'g-root-a',
      'g-child-a1',
      'g-child-a2',
      'g-root-b',
    ]);
    expect(schedule.fillGuides.map((g) => g.guideId)).toEqual(['fg-a', 'fg-b']);

    // Connected adjacent branches (root-a -> child-a1) overlap by 12% of the shorter branch interval
    const b0 = schedule.outlineBranches[0]!;
    const b1 = schedule.outlineBranches[1]!;
    const d0 = b0.endP - b0.startP;
    const d1 = b1.endP - b1.startP;
    const overlap = b0.endP - b1.startP;
    expect(overlap).toBeCloseTo(BRANCH_OVERLAP_RATIO * Math.min(d0, d1), 6);

    // Pen-lift and backtrack transitions do not overlap adjacent branches
    const b2 = schedule.outlineBranches[2]!;
    expect(b2.startP).toBeGreaterThanOrEqual(b1.endP);

    // Tiny detail-group branch receives boosted readable interval vs its tiny 4-unit guide length
    const detailDur = b2.endP - b2.startP;
    expect(detailDur).toBeGreaterThan(d0 * 0.08);

    // Every outline guide ends <= 8/13 and every fill guide starts >= 8/13
    for (const guide of schedule.outlineGuides) {
      expect(guide.startP).toBeGreaterThanOrEqual(0);
      expect(guide.endP).toBeLessThanOrEqual(OUTLINE_PHASE_END + 1e-12);
    }
    for (const guide of schedule.fillGuides) {
      expect(guide.startP).toBeGreaterThanOrEqual(OUTLINE_PHASE_END - 1e-12);
      expect(guide.endP).toBeLessThanOrEqual(1 + 1e-12);
    }
  });

  it('samples deterministically across endpoints, outline completion, backtrack, pen-lift, and reverse unwind', () => {
    const schedule = compileZodiacSchedule(makeSyntheticAtlas());

    const idle = sampleZodiacFrame(schedule, 0);
    expect(idle.phase).toBe('idle');
    expect(idle.outlineProgress.every((v) => v === 0)).toBe(true);
    expect(idle.fillProgress.every((v) => v === 0)).toBe(true);
    expect(idle.primaryHead.visible).toBe(false);

    // Outline completion checkpoint: all outlines 1, zero fills started
    const outlineDone = sampleZodiacFrame(schedule, OUTLINE_PHASE_END);
    expect(outlineDone.outlineProgress.every((v) => v === 1)).toBe(true);
    expect(outlineDone.fillProgress.every((v) => v === 0)).toBe(true);

    // Mid-fill: outlines stay 1 while fill-a completes before fill-b
    const midFill = sampleZodiacFrame(schedule, 0.78);
    expect(midFill.phase).toBe('fill');
    expect(midFill.outlineProgress.every((v) => v === 1)).toBe(true);
    expect(midFill.fillProgress[0]).toBeGreaterThan(0);
    expect(midFill.fillProgress[1]).toBe(0);

    // Complete
    const complete = sampleZodiacFrame(schedule, 1);
    expect(complete.phase).toBe('complete');
    expect(complete.outlineProgress.every((v) => v === 1)).toBe(true);
    expect(complete.fillProgress.every((v) => v === 1)).toBe(true);
    expect(complete.primaryHead.visible).toBe(false);

    // Pen-lift transition fades down at fromPoint then fades up at toPoint (no invented line midpoint)
    const penLift = schedule.transitions.find(
      (t) => t.kind === 'pen-lift' && t.phase === 'outline',
    )!;
    const liftQuarter = sampleZodiacFrame(
      schedule,
      penLift.startP + (penLift.endP - penLift.startP) * 0.25,
    );
    const liftMid = sampleZodiacFrame(
      schedule,
      penLift.startP + (penLift.endP - penLift.startP) * 0.5,
    );
    const liftThreeQuarter = sampleZodiacFrame(
      schedule,
      penLift.startP + (penLift.endP - penLift.startP) * 0.75,
    );
    expect([liftQuarter.primaryHead.x, liftQuarter.primaryHead.y]).toEqual(penLift.fromPoint);
    expect(liftMid.primaryHead.opacity).toBeCloseTo(0, 6);
    expect([liftThreeQuarter.primaryHead.x, liftThreeQuarter.primaryHead.y]).toEqual(
      penLift.toPoint,
    );

    // Determinism & reverse unwind: fill-b -> fill-a -> outlines in exact reverse order
    const forwardSamples = [0.1, 0.35, 0.61, 0.75, 0.95].map((p) => sampleZodiacFrame(schedule, p));
    const reverseSamples = [0.95, 0.75, 0.61, 0.35, 0.1].map((p) => sampleZodiacFrame(schedule, p));
    expect(reverseSamples.reverse()).toEqual(forwardSamples);

    // Binary-search LUT sampler clamps and interpolates linearly
    const lut = [
      [0, 0, 0],
      [0.5, 10, 20],
      [1, 30, 40],
    ] as const;
    expect(sampleLut(lut, -1)).toEqual([0, 0]);
    expect(sampleLut(lut, 0.25)).toEqual([5, 10]);
    expect(sampleLut(lut, 0.75)).toEqual([20, 30]);
    expect(sampleLut(lut, 2)).toEqual([30, 40]);
  });
});
