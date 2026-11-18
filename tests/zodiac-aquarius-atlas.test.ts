import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compileZodiacSchedule,
  OUTLINE_PHASE_END,
  sampleZodiacFrame,
} from '@/features/zodiac/schedule';
import type { ZodiacEnhancementData, ZodiacRoutePath, ZodiacSign } from '@/features/zodiac/types';

function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function countPathSubpaths(d: string): number {
  const matches = d.match(/[Mm]/g);
  return matches ? matches.length : 0;
}

function assertValidLut(route: ZodiacRoutePath, label: string) {
  expect(route.length, `${label} length`).toBeGreaterThan(0);
  expect(route.lut.length, `${label} lut entries`).toBeGreaterThanOrEqual(2);
  expect(route.lut[0]![0], `${label} lut start s`).toBe(0);
  expect(route.lut[route.lut.length - 1]![0], `${label} lut end s`).toBe(1);
  let prevS = -1;
  for (const [s, x, y] of route.lut) {
    expect(Number.isFinite(s) && Number.isFinite(x) && Number.isFinite(y)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(prevS);
    prevS = s;
  }
}

describe('Aquarius canonical asset, manifest & authored traversal atlas integrity', () => {
  const root = process.cwd();
  const sourceSvgPath = path.join(root, '.local/sources/img/zodiac/svg/aquarius.svg');
  const publicSvgPath = path.join(root, 'public/visuals/zodiac/aquarius.svg');
  const manifestPath = path.join(root, 'public/visuals/zodiac/manifest.json');
  const enhancementPath = path.join(root, 'public/visuals/zodiac/aquarius-enhancement.json');

  it('preserves byte-identical canonical aquarius.svg and accurate SHA-256 manifest', () => {
    const publicBytes = fs.readFileSync(publicSvgPath);
    const publicHash = sha256(publicBytes);

    if (fs.existsSync(sourceSvgPath)) {
      const sourceBytes = fs.readFileSync(sourceSvgPath);
      expect(publicBytes.equals(sourceBytes)).toBe(true);
      expect(publicHash).toBe(sha256(sourceBytes));
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      version: number;
      signs: {
        aquarius: {
          sign: string;
          svgUrl: string;
          enhancementUrl: string;
          sourceSha256: string;
          byteLength: number;
          viewBox: { minX: number; minY: number; width: number; height: number };
          fillRule: string;
          clipRule: string;
          contourCount: number;
          gradient: {
            id: string;
            x1: string;
            y1: string;
            x2: string;
            y2: string;
            stops: Array<{ offset: string; color: string }>;
          };
          canonicalPath: string;
        };
      };
    };

    const entry = manifest.signs.aquarius;
    expect(manifest.version).toBe(1);
    expect(entry.sign).toBe('aquarius');
    expect(entry.svgUrl).toBe('/visuals/zodiac/aquarius.svg');
    expect(entry.enhancementUrl).toBe('/visuals/zodiac/aquarius-enhancement.json');
    expect(entry.sourceSha256).toBe(publicHash);
    expect(entry.byteLength).toBe(publicBytes.byteLength);
    expect(entry.viewBox).toEqual({ minX: 0, minY: 0, width: 394, height: 484 });
    expect(entry.fillRule).toBe('evenodd');
    expect(entry.clipRule).toBe('evenodd');
    expect(entry.contourCount).toBe(281);
    expect(countPathSubpaths(entry.canonicalPath)).toBe(281);
    expect(entry.gradient.stops).toEqual([
      { offset: '0%', color: '#F3DDD8' },
      { offset: '50%', color: '#EBC7BF' },
      { offset: '100%', color: '#E0B1A6' },
    ]);

    const svgText = publicBytes.toString('utf8');
    expect(svgText).toContain(`d="${entry.canonicalPath}"`);
  });

  it('accounts for all 281 contours, valid branch/parent IDs, explicit pen lifts, and deterministic DFS schedule', () => {
    const publicBytes = fs.readFileSync(publicSvgPath);
    const publicHash = sha256(publicBytes);
    const data = JSON.parse(fs.readFileSync(enhancementPath, 'utf8')) as ZodiacEnhancementData;

    expect(data.version).toBe(1);
    expect(data.sign).toBe('aquarius');
    expect(data.sourceSha256).toBe(publicHash);
    expect(data.contourCount).toBe(281);
    expect(countPathSubpaths(data.canonicalPath)).toBe(281);
    expect(data.fillRule).toBe('evenodd');
    expect(data.clipRule).toBe('evenodd');
    expect(data.roots.length).toBeGreaterThanOrEqual(2);
    expect(data.roots[0]).toBe('pour-origin');

    // Validate branch parentId/children consistency
    const branchById = new Map(data.branches.map((b) => [b.id, b]));
    expect(branchById.size).toBe(data.branches.length);

    for (const rootId of data.roots) {
      const rootBranch = branchById.get(rootId);
      expect(rootBranch).toBeDefined();
      expect(rootBranch!.parentId).toBeNull();
    }

    for (const branch of data.branches) {
      if (branch.parentId !== null) {
        const parent = branchById.get(branch.parentId);
        expect(parent).toBeDefined();
        expect(parent!.children).toContain(branch.id);
      }
      for (const childId of branch.children) {
        const child = branchById.get(childId);
        expect(child).toBeDefined();
        expect(child!.parentId).toBe(branch.id);
      }
      for (const guide of branch.outlineGuides) {
        assertValidLut(guide, `outline guide ${guide.id}`);
      }
      if (branch.entryPath) {
        assertValidLut(branch.entryPath, `branch entryPath ${branch.id}`);
      }
      if (branch.backtrackGuide) {
        assertValidLut(branch.backtrackGuide, `branch backtrackGuide ${branch.id}`);
      }
    }

    // Validate fillRegions link back to branches, monotonic order, and LUTs
    const sortedOrders = data.fillRegions.map((r) => r.order);
    expect(sortedOrders).toEqual([...sortedOrders].sort((a, b) => a - b));
    for (const region of data.fillRegions) {
      expect(branchById.has(region.branchId)).toBe(true);
      expect(region.clipPathD.length).toBeGreaterThan(0);
      for (const guide of region.fillGuides) {
        assertValidLut(guide, `fill guide ${guide.id}`);
      }
      if (region.entryPath) {
        assertValidLut(region.entryPath, `fill entryPath ${region.id}`);
      }
      if (region.backtrackGuide) {
        assertValidLut(region.backtrackGuide, `fill backtrackGuide ${region.id}`);
      }
    }

    // Every contour 0..280 accounted for in outline branches AND in fill regions
    const outlineContours = new Set<number>();
    const outlineGuideContours = new Set<number>();
    for (const branch of data.branches) {
      for (const idx of branch.contourIndices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(281);
        outlineContours.add(idx);
      }
      for (const guide of branch.outlineGuides) {
        for (const idx of guide.contourIndices) {
          outlineGuideContours.add(idx);
        }
      }
    }
    expect(outlineContours.size).toBe(281);
    expect(outlineGuideContours.size).toBe(281);

    const fillContours = new Set<number>();
    const fillGuideContours = new Set<number>();
    for (const region of data.fillRegions) {
      for (const idx of region.contourIndices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(281);
        fillContours.add(idx);
      }
      for (const guide of region.fillGuides) {
        for (const idx of guide.contourIndices) {
          fillGuideContours.add(idx);
        }
      }
    }
    expect(fillContours.size).toBe(281);
    expect(fillGuideContours.size).toBe(281);

    // Closed completed glow route
    assertValidLut(data.completedGlowRoute, 'completedGlowRoute');
    const glowStart = data.completedGlowRoute.lut[0]!;
    const glowEnd = data.completedGlowRoute.lut[data.completedGlowRoute.lut.length - 1]!;
    expect(Math.hypot(glowEnd[1] - glowStart[1], glowEnd[2] - glowStart[2])).toBeLessThan(5);

    // Compiles deterministically and honors outline-before-fill and explicit pen lifts
    const schedule = compileZodiacSchedule(data);
    expect(schedule.outlineGuides.length).toBeGreaterThan(0);
    expect(schedule.fillGuides.length).toBeGreaterThan(0);
    expect(schedule.transitions.some((t) => t.kind === 'pen-lift')).toBe(true);

    const atOutlineEnd = sampleZodiacFrame(schedule, OUTLINE_PHASE_END);
    expect(atOutlineEnd.outlineProgress.every((v) => v === 1)).toBe(true);
    expect(atOutlineEnd.fillProgress.every((v) => v === 0)).toBe(true);

    // First visible light begins at pour-origin
    const atStart = sampleZodiacFrame(schedule, 0.02);
    expect(atStart.primaryHead.visible).toBe(true);
    expect(atStart.outlineProgress[0]).toBeGreaterThan(0);
    expect(atStart.fillProgress.every((v) => v === 0)).toBe(true);

    // Reverse order unwinds fills before outlines
    const atMidFill = sampleZodiacFrame(schedule, 0.8);
    expect(atMidFill.outlineProgress.every((v) => v === 1)).toBe(true);
    expect(atMidFill.fillProgress.some((v) => v > 0 && v < 1)).toBe(true);
  });
});

const TWELVE_ZODIAC_SIGNS: ReadonlyArray<{ indexPrefix: string; sign: ZodiacSign }> = [
  { indexPrefix: '01', sign: 'aries' },
  { indexPrefix: '02', sign: 'taurus' },
  { indexPrefix: '03', sign: 'gemini' },
  { indexPrefix: '04', sign: 'cancer' },
  { indexPrefix: '05', sign: 'leo' },
  { indexPrefix: '06', sign: 'virgo' },
  { indexPrefix: '07', sign: 'libra' },
  { indexPrefix: '08', sign: 'scorpio' },
  { indexPrefix: '09', sign: 'sagittarius' },
  { indexPrefix: '10', sign: 'capricorn' },
  { indexPrefix: '11', sign: 'aquarius' },
  { indexPrefix: '12', sign: 'pisces' },
];

interface ManifestSignRecord {
  sign: string;
  sourceSha256: string;
  byteLength: number;
  symbolSha256: string;
  symbolBytes: number;
  contourCount: number;
  canonicalPath: string;
}

describe('12-sign Zodiac canonical assets, manifest & enhancement atlases', () => {
  const root = process.cwd();
  const manifestPath = path.join(root, 'public/visuals/zodiac/manifest.json');

  it('stores valid byte-identical SVGs, SHA-256 manifest entries, 100% contour atlases, and closed glow routes across all 12 signs', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      signs: Record<string, ManifestSignRecord>;
    };

    for (const { indexPrefix, sign } of TWELVE_ZODIAC_SIGNS) {
      const publicSvgPath = path.join(root, `public/visuals/zodiac/${sign}.svg`);
      const publicSymbolPath = path.join(root, `public/visuals/zodiac/${sign}-symbol.svg`);
      const sourceSvgPath = path.join(root, `sources/img/zodiac/svg/${sign}.svg`);
      const sourceSymbolPath = path.join(root, `sources/img/zodiac/svg/${indexPrefix}_${sign}.svg`);
      const enhancementPath = path.join(root, `public/visuals/zodiac/${sign}-enhancement.json`);

      const svgBytes = fs.readFileSync(publicSvgPath);
      const symbolBytes = fs.readFileSync(publicSymbolPath);
      const svgHash = sha256(svgBytes);
      const symbolHash = sha256(symbolBytes);

      if (fs.existsSync(sourceSvgPath)) {
        expect(svgHash, `${sign}.svg matches source`).toBe(sha256(fs.readFileSync(sourceSvgPath)));
      }
      if (fs.existsSync(sourceSymbolPath)) {
        expect(symbolHash, `${sign}-symbol.svg matches source`).toBe(
          sha256(fs.readFileSync(sourceSymbolPath)),
        );
      }

      const entry = manifest.signs[sign];
      expect(entry, `${sign} manifest entry`).toBeDefined();
      expect(entry!.sourceSha256).toBe(svgHash);
      expect(entry!.byteLength).toBe(svgBytes.length);
      expect(entry!.symbolSha256).toBe(symbolHash);
      expect(entry!.symbolBytes).toBe(symbolBytes.length);

      const data = JSON.parse(fs.readFileSync(enhancementPath, 'utf8')) as ZodiacEnhancementData;
      expect(data.sign).toBe(sign);
      expect(data.canonicalPath).toBe(entry!.canonicalPath);
      expect(data.fillRule).toBe('evenodd');
      expect(data.clipRule).toBe('evenodd');

      const totalContours = countPathSubpaths(data.canonicalPath);
      expect(totalContours).toBe(entry!.contourCount);
      expect(totalContours).toBeGreaterThan(50);

      expect(data.roots.length).toBeGreaterThan(0);
      const outlineContours = new Set<number>();
      for (const b of data.branches) {
        for (const c of b.contourIndices) outlineContours.add(c);
      }
      expect(outlineContours.size, `${sign} 100% outline contour coverage`).toBe(totalContours);

      const fillContours = new Set<number>();
      for (const region of data.fillRegions) {
        for (const c of region.contourIndices) fillContours.add(c);
      }
      expect(fillContours.size, `${sign} 100% fill region coverage`).toBe(totalContours);

      assertValidLut(data.completedGlowRoute, `${sign}.completedGlowRoute`);
      const gStart = data.completedGlowRoute.lut[0]!;
      const gEnd = data.completedGlowRoute.lut[data.completedGlowRoute.lut.length - 1]!;
      expect(
        Math.hypot(gEnd[1] - gStart[1], gEnd[2] - gStart[2]),
        `${sign} closed glow loop`,
      ).toBeLessThan(5);

      const schedule = compileZodiacSchedule(data);
      expect(schedule.outlinePhaseEnd).toBeCloseTo(OUTLINE_PHASE_END, 8);
      expect(schedule.outlineGuides.length, `${sign} outline guides`).toBeGreaterThan(0);
      expect(schedule.fillGuides.length, `${sign} fill guides`).toBeGreaterThan(0);
      expect(schedule.transitions.some((t) => t.kind === 'pen-lift')).toBe(true);

      const atOutlineEnd = sampleZodiacFrame(schedule, OUTLINE_PHASE_END);
      expect(atOutlineEnd.outlineProgress.every((v) => v === 1)).toBe(true);
      expect(atOutlineEnd.fillProgress.every((v) => v === 0)).toBe(true);

      const midFillSamples = [0.66, 0.72, 0.8, 0.88, 0.94].map((sampleP) =>
        sampleZodiacFrame(schedule, sampleP),
      );
      for (const sample of midFillSamples) {
        expect(sample.outlineProgress.every((v) => v === 1)).toBe(true);
      }
      expect(
        midFillSamples.some((s) => s.fillProgress.some((v) => v > 0 && v < 1)),
        `${sign} progressive fill samples between regions`,
      ).toBe(true);
      const atMidFill = midFillSamples[2]!;
      const completedOrPartial =
        atMidFill.fillProgress.some((v) => v > 0 && v < 1) ||
        (atMidFill.fillProgress.some((v) => v === 1) &&
          atMidFill.fillProgress.some((v) => v === 0));
      expect(completedOrPartial, `${sign} mid-fill state at p=0.8`).toBe(true);

      const atComplete = sampleZodiacFrame(schedule, 1);
      expect(atComplete.outlineProgress.every((v) => v === 1)).toBe(true);
      expect(atComplete.fillProgress.every((v) => v === 1)).toBe(true);
    }
  });
});
