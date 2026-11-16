// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OUTLINE_PHASE_END, sampleZodiacFrame } from '@/features/zodiac/schedule';
import { getCompiledSymbolSchedule, getZodiacSymbolDefinition } from '@/features/zodiac/symbol-data';
import type { ZodiacSign } from '@/features/zodiac/types';
import {
  ZodiacSymbolProgressiveSvg,
  ZodiacSymbolStaticSvg,
} from '@/features/zodiac/ZodiacSymbol';

const ROOT = process.cwd();

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

function extractSymbolSvgAttrs(svgText: string): { transform?: string; d: string } {
  const pathMatch = svgText.match(/<path\b([^>]*)\/?>/);
  if (!pathMatch?.[1]) {
    throw new Error('Expected <path> in symbol SVG');
  }
  const attrs = pathMatch[1];
  const dMatch = attrs.match(/\sd="([^"]+)"/);
  if (!dMatch?.[1]) {
    throw new Error('Expected d attribute in symbol SVG');
  }
  const transformMatch = attrs.match(/\stransform="([^"]+)"/);
  return {
    transform: transformMatch?.[1],
    d: dMatch[1],
  };
}

function createTestSymbolRefs() {
  return {
    current: {
      dimLayer: null,
      outlineLayer: null,
      outlinePaths: [],
      fillPaths: [],
      primaryHead: null,
      secondaryHead: null,
      glowGroup: null,
      glowPath: null,
      glowTailPath: null,
      lastAppliedP: -1,
    },
  };
}

afterEach(() => {
  cleanup();
});

describe('12-sign Zodiac canonical symbols and progressive schedules', () => {
  it('defines synchronous canonical definitions matching public symbol SVGs with token-only Champagne Rose Gold stops', () => {
    for (const sign of ALL_ZODIAC_SIGNS) {
      const def = getZodiacSymbolDefinition(sign);
      expect(def, `${sign} symbol definition`).not.toBeNull();
      const definition = def!;

      const svgPath = path.join(ROOT, `public/visuals/zodiac/${sign}-symbol.svg`);
      const parsed = extractSymbolSvgAttrs(fs.readFileSync(svgPath, 'utf8'));

      expect(definition.sign).toBe(sign);
      expect(definition.canonicalPathD).toBe(parsed.d);
      expect(definition.pathTransform).toBe(parsed.transform);
      const expectedRule = sign === 'aquarius' ? 'nonzero' : 'evenodd';
      expect(definition.layer.fillRule).toBe(expectedRule);
      expect(definition.layer.clipRule).toBe(expectedRule);

      // Aspect-balanced viewBox protects tall vs wide symbols from clipping (2-decimal rounded)
      expect(definition.tightViewBox.height).toBeGreaterThanOrEqual(25);
      expect(definition.tightViewBox.width).toBeGreaterThanOrEqual(
        definition.tightViewBox.height * 1.25 - 0.02,
      );

      // CSS token colors only (zero raw #hex / rgb / hsl literals)
      const stopColors = definition.layer.gradient.stops.map((s) => s.color);
      expect(stopColors).toEqual([
        'var(--zodiac-rose-gold-highlight)',
        'var(--zodiac-rose-gold)',
        'var(--zodiac-rose-gold-deep)',
      ]);
      for (const color of stopColors) {
        expect(color).not.toMatch(/#[0-9a-fA-F]|rgba?\(|hsla?\(/);
      }
    }
  });

  it('compiles 0..8/13 outline and 8/13..1 fill schedules covering all contours across all 12 signs', () => {
    for (const sign of ALL_ZODIAC_SIGNS) {
      const def = getZodiacSymbolDefinition(sign)!;
      const compiled = getCompiledSymbolSchedule(sign);
      expect(compiled, `${sign} compiled schedule`).not.toBeNull();
      const schedule = compiled!;

      expect(schedule.outlinePhaseEnd).toBeCloseTo(OUTLINE_PHASE_END, 8);
      expect(schedule.outlineGuides.length).toBeGreaterThan(0);
      expect(schedule.fillGuides.length).toBeGreaterThan(0);

      // Every branch contour maps into compiled outline and fill guides
      expect(def.layer.roots.length).toBeGreaterThan(0);
      const layerContours = new Set<number>();
      for (const branch of def.layer.branches) {
        for (const idx of branch.contourIndices) layerContours.add(idx);
      }
      const fillContours = new Set<number>();
      for (const region of def.layer.fillRegions) {
        for (const idx of region.contourIndices) fillContours.add(idx);
      }
      expect(fillContours).toEqual(layerContours);

      // Phase boundaries: idle (0) -> outline (0.3) -> outlineEnd (8/13) -> mid-fill (0.8) -> complete (1)
      const atZero = sampleZodiacFrame(schedule, 0);
      expect(atZero.outlineProgress.every((v) => v === 0)).toBe(true);
      expect(atZero.fillProgress.every((v) => v === 0)).toBe(true);

      const atOutlineMid = sampleZodiacFrame(schedule, 0.3);
      expect(atOutlineMid.outlineProgress.some((v) => v > 0)).toBe(true);
      expect(atOutlineMid.fillProgress.every((v) => v === 0)).toBe(true);

      const atOutlineEnd = sampleZodiacFrame(schedule, OUTLINE_PHASE_END);
      expect(atOutlineEnd.outlineProgress.every((v) => v === 1)).toBe(true);
      expect(atOutlineEnd.fillProgress.every((v) => v === 0)).toBe(true);

      const atMidFill = sampleZodiacFrame(schedule, 0.8);
      expect(atMidFill.outlineProgress.every((v) => v === 1)).toBe(true);
      expect(atMidFill.fillProgress.some((v) => v > 0 && v < 1)).toBe(true);

      const atComplete = sampleZodiacFrame(schedule, 1);
      expect(atComplete.outlineProgress.every((v) => v === 1)).toBe(true);
      expect(atComplete.fillProgress.every((v) => v === 1)).toBe(true);
    }
  });

  it('renders ZodiacSymbolStaticSvg and ZodiacSymbolProgressiveSvg without traveling heads or completed glow', () => {
    const representativeSigns: readonly ZodiacSign[] = ['aries', 'leo', 'aquarius', 'pisces'];

    for (const sign of representativeSigns) {
      const def = getZodiacSymbolDefinition(sign)!;
      const schedule = getCompiledSymbolSchedule(sign)!;
      const refs = createTestSymbolRefs();

      const staticView = render(<ZodiacSymbolStaticSvg definition={def} />);
      const staticSvg = staticView.container.querySelector('svg[data-zodiac-part="symbol"]');
      expect(staticSvg, `${sign} static symbol SVG`).toBeInTheDocument();
      const expectedRule = sign === 'aquarius' ? 'nonzero' : 'evenodd';
      expect(staticView.container.querySelector(`[fill-rule="${expectedRule}"]`)).toBeInTheDocument();
      staticView.unmount();

      const progView = render(
        <ZodiacSymbolProgressiveSvg
          uidPrefix={`sym-${sign}`}
          definition={def}
          schedule={schedule}
          refs={refs}
          showGuides
        />,
      );
      const progSvg = progView.container.querySelector('svg[data-zodiac-part="symbol"]');
      expect(progSvg, `${sign} progressive symbol SVG`).toBeInTheDocument();
      expect(progView.container.querySelector('[data-zodiac-glow-group]')).toBeNull();
      expect(progView.container.querySelector('[data-zodiac-glow-segment]')).toBeNull();
      expect(progView.container.querySelector('[data-zodiac-guide-overlay="true"]')).toBeInTheDocument();
      // Traveling head circles (primary r=14 / secondary r=13) are omitted on symbols
      expect(progView.container.querySelectorAll('radialGradient')).toHaveLength(0);
      progView.unmount();
    }
  });
});
