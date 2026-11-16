import { compileZodiacLayerSchedule } from './schedule';
import type {
  CompiledZodiacSchedule,
  ZodiacBranch,
  ZodiacFillRegion,
  ZodiacGuidePath,
  ZodiacIlluminationLayerData,
  ZodiacLutPoint,
  ZodiacSign,
} from './types';

export interface ZodiacSymbolDefinition {
  sign: ZodiacSign;
  publicSvgUrl: string;
  /** Full canonical 64x64 viewBox used by the supplied asset and guide coordinates. */
  viewBox: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  /** Optical tight viewBox cropping transparent margins while keeping 64x64 coordinates exact. */
  tightViewBox: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  /** Canonical path transform copied verbatim from the source symbol SVG. */
  pathTransform: string;
  /** Canonical `d` attribute copied verbatim from the source symbol SVG. */
  canonicalPathD: string;
  /** Outline stroke width expressed in canonical transformed path coordinates. */
  outlinePathStrokeWidth: number;
  layer: ZodiacIlluminationLayerData;
}

const SYMBOL_VIEWBOX = {
  minX: 0,
  minY: 0,
  width: 64,
  height: 64,
} as const;

const SYMBOL_GRADIENT_TEMPLATE = {
  x1: '20%',
  y1: '0%',
  x2: '80%',
  y2: '100%',
  gradientUnits: 'objectBoundingBox' as const,
  stops: [
    { offset: '0%', color: 'var(--zodiac-rose-gold-highlight)' },
    { offset: '50%', color: 'var(--zodiac-rose-gold)' },
    { offset: '100%', color: 'var(--zodiac-rose-gold-deep)' },
  ],
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildWaveGuide(
  id: string,
  points: ReadonlyArray<readonly [number, number]>,
  strokeWidth: number,
  contourIndex: number,
): ZodiacGuidePath {
  const cumLen = [0];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    total += Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
    cumLen.push(total);
  }
  const safeTotal = total > 0 ? total : 1;
  const lut: ZodiacLutPoint[] = points.map((pt, idx) => [
    Number(((cumLen[idx] ?? 0) / safeTotal).toFixed(5)),
    round2(pt[0]),
    round2(pt[1]),
  ]);
  const d =
    `M${round2(points[0]![0])},${round2(points[0]![1])}` +
    points
      .slice(1)
      .map((pt) => `L${round2(pt[0])},${round2(pt[1])}`)
      .join('');

  return {
    id,
    d,
    length: round2(safeTotal),
    strokeWidth,
    contourIndices: [contourIndex],
    lut,
  };
}

interface ParsedSubpath {
  contourIndex: number;
  points: Array<readonly [number, number]>;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  diag: number;
}

function parseTransformNumbers(transform: string): readonly [number, number, number, number] {
  const trMatch = transform.match(/translate\(([^)]+)\)/);
  const scMatch = transform.match(/scale\(([^)]+)\)/);
  const trNums = (trMatch?.[1] ?? '0 0').trim().split(/[\s,]+/).map(Number);
  const scNums = (scMatch?.[1] ?? '1 1').trim().split(/[\s,]+/).map(Number);
  const tx = trNums[0] ?? 0;
  const ty = trNums[1] ?? 0;
  const sx = scNums[0] ?? 1;
  const sy = scNums[1] ?? sx;
  return [tx, ty, sx, sy];
}

function parseTransformedSymbolSubpaths(
  pathTransform: string,
  canonicalPathD: string,
): ParsedSubpath[] {
  const [tx, ty, sx, sy] = parseTransformNumbers(pathTransform);
  const toGlobal = (x: number, y: number): readonly [number, number] => [
    tx + x * sx,
    ty + y * sy,
  ];

  const subpathStrings = canonicalPathD
    .split(/(?=M)/)
    .map((part) => part.trim())
    .filter(Boolean);

  return subpathStrings.map((subpathD, contourIndex) => {
    const tokens = subpathD.match(/[a-zA-Z]|-?\d+(?:\.\d+)?/g) ?? [];
    const points: Array<readonly [number, number]> = [];
    let cx = 0;
    let cy = 0;
    let startX = 0;
    let startY = 0;
    let cmd = '';
    let idx = 0;

    const pushPoint = (x: number, y: number) => {
      const gx = tx + x * sx;
      const gy = ty + y * sy;
      const prev = points[points.length - 1];
      if (!prev || Math.hypot(gx - prev[0], gy - prev[1]) > 0.15) {
        points.push([gx, gy]);
      }
    };

    while (idx < tokens.length) {
      const token = tokens[idx]!;
      if (/^[a-zA-Z]$/.test(token)) {
        cmd = token;
        idx += 1;
        if (cmd === 'Z' || cmd === 'z') {
          cx = startX;
          cy = startY;
          pushPoint(cx, cy);
        }
        continue;
      }

      if (cmd === 'M' || cmd === 'L') {
        const x = Number(tokens[idx] ?? 0);
        const y = Number(tokens[idx + 1] ?? 0);
        idx += 2;
        cx = x;
        cy = y;
        if (cmd === 'M') {
          startX = cx;
          startY = cy;
          cmd = 'L';
        }
        pushPoint(cx, cy);
      } else if (cmd === 'm' || cmd === 'l') {
        const dx = Number(tokens[idx] ?? 0);
        const dy = Number(tokens[idx + 1] ?? 0);
        idx += 2;
        cx += dx;
        cy += dy;
        if (cmd === 'm') {
          startX = cx;
          startY = cy;
          cmd = 'l';
        }
        pushPoint(cx, cy);
      } else if (cmd === 'H') {
        cx = Number(tokens[idx] ?? cx);
        idx += 1;
        pushPoint(cx, cy);
      } else if (cmd === 'h') {
        cx += Number(tokens[idx] ?? 0);
        idx += 1;
        pushPoint(cx, cy);
      } else if (cmd === 'V') {
        cy = Number(tokens[idx] ?? cy);
        idx += 1;
        pushPoint(cx, cy);
      } else if (cmd === 'v') {
        cy += Number(tokens[idx] ?? 0);
        idx += 1;
        pushPoint(cx, cy);
      } else if (cmd === 'Q' || cmd === 'q') {
        const qx = Number(tokens[idx] ?? 0) + (cmd === 'q' ? cx : 0);
        const qy = Number(tokens[idx + 1] ?? 0) + (cmd === 'q' ? cy : 0);
        const ex = Number(tokens[idx + 2] ?? 0) + (cmd === 'q' ? cx : 0);
        const ey = Number(tokens[idx + 3] ?? 0) + (cmd === 'q' ? cy : 0);
        idx += 4;
        const p0x = cx;
        const p0y = cy;
        const samples = 5;
        for (let s = 1; s <= samples; s += 1) {
          const t = s / samples;
          const mt = 1 - t;
          const x = mt * mt * p0x + 2 * mt * t * qx + t * t * ex;
          const y = mt * mt * p0y + 2 * mt * t * qy + t * t * ey;
          pushPoint(x, y);
        }
        cx = ex;
        cy = ey;
      } else {
        idx += 1;
      }
    }

    if (points.length === 0) {
      points.push(toGlobal(0, 0), toGlobal(1, 1));
    } else if (points.length === 1) {
      points.push([points[0]![0] + 0.5, points[0]![1] + 0.5]);
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [px, py] of points) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    return {
      contourIndex,
      points,
      minX,
      minY,
      maxX,
      maxY,
      diag: Math.hypot(maxX - minX, maxY - minY),
    };
  });
}

function isBoxContained(inner: ParsedSubpath, outer: ParsedSubpath): boolean {
  return (
    inner.contourIndex !== outer.contourIndex &&
    inner.diag < outer.diag * 0.9 &&
    inner.minX >= outer.minX - 0.5 &&
    inner.maxX <= outer.maxX + 0.5 &&
    inner.minY >= outer.minY - 0.5 &&
    inner.maxY <= outer.maxY + 0.5
  );
}

function buildSerpentineBoxFillGuide(
  id: string,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  contourIndices: number[],
): { guide: ZodiacGuidePath; clipPathD: string } {
  const pad = 2.5;
  const x0 = round2(Math.max(0, bounds.minX - pad));
  const x1 = round2(Math.min(64, bounds.maxX + pad));
  const y0 = round2(Math.max(0, bounds.minY - pad));
  const y1 = round2(Math.min(64, bounds.maxY + pad));
  const strokeWidth = 14;
  const stepY = 8.5;

  const pts: Array<readonly [number, number]> = [];
  const rows = Math.max(1, Math.ceil((y1 - y0) / stepY));
  for (let r = 0; r <= rows; r += 1) {
    const y = round2(y0 + ((y1 - y0) * r) / rows);
    if (r % 2 === 0) {
      pts.push([x0, y], [x1, y]);
    } else {
      pts.push([x1, y], [x0, y]);
    }
  }

  const guide = buildWaveGuide(id, pts, strokeWidth, contourIndices[0] ?? 0);
  guide.contourIndices = contourIndices;
  const clipPathD = `M${x0},${y0}H${x1}V${y1}H${x0}Z`;
  return { guide, clipPathD };
}

function buildSymbolDefinitionFromPath(
  sign: ZodiacSign,
  pathTransform: string,
  canonicalPathD: string,
): ZodiacSymbolDefinition {
  const [, , sx] = parseTransformNumbers(pathTransform);
  const subpaths = parseTransformedSymbolSubpaths(pathTransform, canonicalPathD);

  let gxMin = Infinity;
  let gyMin = Infinity;
  let gxMax = -Infinity;
  let gyMax = -Infinity;
  for (const sp of subpaths) {
    if (sp.minX < gxMin) gxMin = sp.minX;
    if (sp.maxX > gxMax) gxMax = sp.maxX;
    if (sp.minY < gyMin) gyMin = sp.minY;
    if (sp.maxY > gyMax) gyMax = sp.maxY;
  }

  const pad = 1.6;
  const rawW = gxMax - gxMin + pad * 2;
  const rawH = gyMax - gyMin + pad * 2;
  const cx = (gxMin + gxMax) / 2;
  const cy = (gyMin + gyMax) / 2;
  const height = round2(Math.max(25, rawH));
  const width = round2(Math.max(rawW, height * 1.25));
  const tightViewBox = {
    minX: round2(cx - width / 2),
    minY: round2(cy - height / 2),
    width,
    height,
  };

  // Identify which subpaths are interior counters nested inside an outer contour.
  const hostMap = new Map<number, number>();
  for (const sp of subpaths) {
    const containing = subpaths
      .filter((candidate) => isBoxContained(sp, candidate))
      .sort((a, b) => a.diag - b.diag)[0];
    if (containing) {
      hostMap.set(sp.contourIndex, containing.contourIndex);
    }
  }

  const majorSubpaths = subpaths
    .filter((sp) => !hostMap.has(sp.contourIndex))
    .sort((a, b) => a.minY - b.minY || a.minX - b.minX);

  const branches: ZodiacBranch[] = [];
  const fillRegions: ZodiacFillRegion[] = [];
  const roots: string[] = [];

  majorSubpaths.forEach((major, majorIdx) => {
    const branchId = `${sign}-symbol-part-${majorIdx}`;
    const nestedCounters = subpaths.filter((sp) => hostMap.get(sp.contourIndex) === major.contourIndex);
    const childIds = nestedCounters.map((_, cIdx) => `${branchId}-counter-${cIdx}`);
    roots.push(branchId);

    branches.push({
      id: branchId,
      label: `${sign} symbol contour ${majorIdx + 1}`,
      parentId: null,
      kind: 'major',
      children: childIds,
      contourIndices: [major.contourIndex],
      entryTransition: majorIdx === 0 ? 'connected' : 'pen-lift',
      outlineGuides: [
        buildWaveGuide(`${branchId}-outline`, major.points, 8.5, major.contourIndex),
      ],
    });

    nestedCounters.forEach((counter, cIdx) => {
      const counterId = childIds[cIdx]!;
      branches.push({
        id: counterId,
        label: `${sign} symbol counter ${cIdx + 1}`,
        parentId: branchId,
        kind: 'detail-group',
        children: [],
        contourIndices: [counter.contourIndex],
        entryTransition: 'pen-lift',
        outlineGuides: [
          buildWaveGuide(`${counterId}-outline`, counter.points, 7.5, counter.contourIndex),
        ],
      });
    });

    const regionContours = [major.contourIndex, ...nestedCounters.map((c) => c.contourIndex)];
    const { guide, clipPathD } = buildSerpentineBoxFillGuide(
      `${branchId}-fill-guide`,
      major,
      regionContours,
    );
    fillRegions.push({
      id: `${branchId}-fill`,
      label: `${sign} symbol region ${majorIdx + 1} fill`,
      branchId,
      kind: 'major',
      order: majorIdx,
      clipPathD,
      contourIndices: regionContours,
      entryTransition: majorIdx === 0 ? 'connected' : 'pen-lift',
      fillGuides: [guide],
    });
  });

  const layer: ZodiacIlluminationLayerData = {
    viewBox: { ...SYMBOL_VIEWBOX },
    gradient: {
      id: `${sign}-symbol-rose-gold`,
      ...SYMBOL_GRADIENT_TEMPLATE,
      stops: SYMBOL_GRADIENT_TEMPLATE.stops.map((s) => ({ ...s })),
    },
    canonicalPath: canonicalPathD,
    fillRule: 'evenodd',
    clipRule: 'evenodd',
    contourCount: subpaths.length,
    outlineBandStrokeWidth: 1.25,
    roots,
    branches,
    fillRegions,
  };

  return {
    sign,
    publicSvgUrl: `/visuals/zodiac/${sign}-symbol.svg`,
    viewBox: layer.viewBox,
    tightViewBox,
    pathTransform,
    canonicalPathD,
    outlinePathStrokeWidth: Math.round(1.25 / Math.abs(sx)),
    layer,
  };
}

// Aquarius prototype symbol (preserved verbatim from Milestone 6 owner approval).
const AQUARIUS_CANONICAL_SYMBOL_D =
  'M727 12Q683 12 648.5 37.0Q614 62 597.0 91.5Q580 121 558.0 146.0Q536 171 513 171Q496 171 478.5 155.0Q461 139 445.0 116.5Q429 94 410.5 71.0Q392 48 365.0 32.0Q338 16 306 16Q268 16 237.5 42.5Q207 69 190.5 100.5Q174 132 151.5 158.5Q129 185 105 185Q59 185 30 121L11 131Q28 226 105 226Q139 226 166.5 208.5Q194 191 212.0 166.0Q230 141 245.5 116.5Q261 92 276.5 74.5Q292 57 308 57Q329 57 349.0 81.0Q369 105 385.5 134.0Q402 163 436.0 187.0Q470 211 516 211Q554 211 587.0 186.0Q620 161 639.5 131.5Q659 102 682.5 77.0Q706 52 726 52Q751 52 766.0 62.0Q781 72 797 107L817 97Q802 12 727 12ZM727 232Q683 232 649.0 257.0Q615 282 597.5 311.5Q580 341 558.0 366.0Q536 391 513 391Q496 391 478.5 375.0Q461 359 444.5 336.5Q428 314 409.5 291.0Q391 268 364.0 252.0Q337 236 306 236Q268 236 237.5 262.5Q207 289 190.5 320.5Q174 352 151.5 378.5Q129 405 105 405Q79 405 63.0 391.5Q47 378 30 341L11 351Q28 446 105 446Q140 446 168.0 428.5Q196 411 214.0 386.5Q232 362 246.5 337.0Q261 312 276.5 294.5Q292 277 308 277Q329 277 349.0 301.0Q369 325 385.5 354.0Q402 383 436.0 407.0Q470 431 516 431Q554 431 587.5 406.0Q621 381 641.0 351.5Q661 322 684.0 297.0Q707 272 726 272Q754 272 767.5 281.5Q781 291 797 327L817 317Q802 232 727 232Z';

const AQUARIUS_SYMBOL_TRANSFORM = 'translate(9.400 44.501) scale(0.054591 -0.054591)';

const TOP_WAVE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [9.5, 23.02],
  [12, 23.02],
  [14.5, 21.64],
  [17, 21.99],
  [19.5, 24.91],
  [22, 26.79],
  [24.5, 28.86],
  [27, 29.84],
  [29.5, 28.4],
  [32, 26.08],
  [34.5, 24.16],
  [37, 22.5],
  [39.5, 23.43],
  [42, 25.73],
  [44.5, 27.09],
  [47, 29.38],
  [49.5, 30.48],
  [52, 29.24],
  [54.5, 29.24],
];

const BOTTOM_WAVE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [9.5, 35.03],
  [12, 35.03],
  [14.5, 33.28],
  [17, 34.0],
  [19.5, 36.92],
  [22, 38.81],
  [24.5, 40.89],
  [27, 41.86],
  [29.5, 40.41],
  [32, 38.09],
  [34.5, 36.17],
  [37, 34.51],
  [39.5, 35.44],
  [42, 37.73],
  [44.5, 39.09],
  [47, 41.39],
  [49.5, 42.48],
  [52, 41.25],
  [54.5, 41.25],
];

const topWaveOutlineGuide = buildWaveGuide('aquarius-symbol-top-outline', TOP_WAVE_POINTS, 7.2, 1);
const bottomWaveOutlineGuide = buildWaveGuide(
  'aquarius-symbol-bottom-outline',
  BOTTOM_WAVE_POINTS,
  7.2,
  0,
);
const topWaveFillGuide = buildWaveGuide('aquarius-symbol-top-fill', TOP_WAVE_POINTS, 7.6, 1);
const bottomWaveFillGuide = buildWaveGuide('aquarius-symbol-bottom-fill', BOTTOM_WAVE_POINTS, 7.6, 0);

const AQUARIUS_SYMBOL_LAYER: ZodiacIlluminationLayerData = {
  viewBox: { ...SYMBOL_VIEWBOX },
  gradient: {
    id: 'aquarius-symbol-rose-gold',
    ...SYMBOL_GRADIENT_TEMPLATE,
    stops: SYMBOL_GRADIENT_TEMPLATE.stops.map((s) => ({ ...s })),
  },
  canonicalPath: AQUARIUS_CANONICAL_SYMBOL_D,
  fillRule: 'nonzero',
  clipRule: 'nonzero',
  contourCount: 2,
  outlineBandStrokeWidth: 1.35,
  roots: ['symbol-top-wave', 'symbol-bottom-wave'],
  branches: [
    {
      id: 'symbol-top-wave',
      label: 'Aquarius symbol upper wave',
      parentId: null,
      kind: 'major',
      children: [],
      contourIndices: [1],
      entryTransition: 'connected',
      outlineGuides: [topWaveOutlineGuide],
    },
    {
      id: 'symbol-bottom-wave',
      label: 'Aquarius symbol lower wave',
      parentId: null,
      kind: 'major',
      children: [],
      contourIndices: [0],
      entryTransition: 'connected',
      outlineGuides: [bottomWaveOutlineGuide],
    },
  ],
  fillRegions: [
    {
      id: 'symbol-top-wave-fill',
      label: 'Aquarius symbol upper wave fill',
      branchId: 'symbol-top-wave',
      kind: 'major',
      order: 0,
      clipPathD: 'M0,16H64V32H0Z',
      contourIndices: [1],
      entryTransition: 'connected',
      fillGuides: [topWaveFillGuide],
    },
    {
      id: 'symbol-bottom-wave-fill',
      label: 'Aquarius symbol lower wave fill',
      branchId: 'symbol-bottom-wave',
      kind: 'major',
      order: 1,
      clipPathD: 'M0,32H64V48H0Z',
      contourIndices: [0],
      entryTransition: 'connected',
      fillGuides: [bottomWaveFillGuide],
    },
  ],
};

export const AQUARIUS_SYMBOL_DEFINITION: ZodiacSymbolDefinition = {
  sign: 'aquarius',
  publicSvgUrl: '/visuals/zodiac/aquarius-symbol.svg',
  viewBox: AQUARIUS_SYMBOL_LAYER.viewBox,
  tightViewBox: {
    minX: 9.4,
    minY: 19.5,
    width: 45.2,
    height: 25,
  },
  pathTransform: AQUARIUS_SYMBOL_TRANSFORM,
  canonicalPathD: AQUARIUS_CANONICAL_SYMBOL_D,
  outlinePathStrokeWidth: 22,
  layer: AQUARIUS_SYMBOL_LAYER,
};

const SYMBOL_SPECS: Readonly<
  Record<Exclude<ZodiacSign, 'aquarius'>, { transform: string; d: string }>
> = {
  aries: {
    transform: 'translate(13.333 51.911) scale(0.059259 -0.059259)',
    d: 'M622 575Q622 543 605.0 515.5Q588 488 557 488Q538 488 523.5 504.5Q509 521 509 540Q509 558 527.0 578.5Q545 599 545 609Q545 620 531.5 625.5Q518 631 504 631Q463 631 432.0 594.0Q401 557 386.0 501.0Q371 445 364.0 394.0Q357 343 357 299V0H273V299Q273 343 266.0 394.0Q259 445 244.0 501.0Q229 557 198.0 594.0Q167 631 126 631Q112 631 98.5 625.5Q85 620 85 609Q85 599 103.0 578.5Q121 558 121 540Q121 521 106.5 504.5Q92 488 73 488Q42 488 25.0 515.5Q8 543 8 575Q8 612 36.5 642.0Q65 672 101 672Q249 672 315 425Q381 672 529 672Q565 672 593.5 642.0Q622 612 622 575Z',
  },
  taurus: {
    transform: 'translate(17.452 50.489) scale(0.059259 -0.059259)',
    d: 'M115 275Q115 168 154.0 93.0Q193 18 256 18Q312 18 344.0 66.0Q376 114 376 199Q376 302 336.0 367.0Q296 432 233 432Q180 432 147.5 389.0Q115 346 115 275ZM199 455Q172 464 147.0 478.5Q122 493 99.0 514.5Q76 536 61.5 567.0Q47 598 46 634H75Q85 586 141.0 546.5Q197 507 247.0 507.0Q297 507 353.0 546.5Q409 586 419 634H448Q447 598 432.5 567.0Q418 536 395.0 514.0Q372 492 346.5 477.5Q321 463 295 455Q372 439 419.0 379.0Q466 319 466 234Q466 130 402.0 60.0Q338 -10 244.0 -10.0Q150 -10 87.5 57.5Q25 125 25 226Q25 316 72.5 378.0Q120 440 199 455Z',
  },
  gemini: {
    transform: 'translate(14.519 51.615) scale(0.059259 -0.059259)',
    d: 'M393 109V553Q393 608 376.5 623.5Q360 639 296 643Q233 640 215.5 624.0Q198 608 198 553V109Q198 54 216.0 37.5Q234 21 296 19Q359 21 376.0 37.0Q393 53 393 109ZM113 109V553Q113 608 96.0 623.5Q79 639 15 643V662H575V643Q512 640 494.5 624.0Q477 608 477 553V109Q477 54 495.0 37.5Q513 21 575 19V0H15V19Q78 21 95.5 37.0Q113 53 113 109Z',
  },
  cancer: {
    transform: 'translate(11.319 52.030) scale(0.059259 -0.059259)',
    d: 'M149 367Q215 367 264.0 397.5Q313 428 313 477Q313 521 278.0 547.0Q243 573 194 573Q134 573 88.0 542.0Q42 511 42 464Q42 414 73.0 390.5Q104 367 149 367ZM290 579Q350 545 350 471Q350 401 300.5 346.5Q251 292 172 292Q102 292 54.5 343.0Q7 394 7 469Q7 519 27.5 556.0Q48 593 85.0 615.0Q122 637 169.0 647.5Q216 658 273 658Q384 658 497.0 621.0Q610 584 691 532L673 495Q607 526 493.5 552.5Q380 579 290 579ZM543 309Q477 309 428.0 278.5Q379 248 379 199Q379 155 414.0 129.0Q449 103 498 103Q558 103 604.0 134.0Q650 165 650 212Q650 262 619.0 285.5Q588 309 543 309ZM402 97Q342 131 342 205Q342 275 391.5 329.5Q441 384 520 384Q590 384 637.5 333.0Q685 282 685 207Q685 157 664.5 120.0Q644 83 607.0 61.0Q570 39 523.0 28.5Q476 18 419 18Q309 18 201.5 54.5Q94 91 11 144L29 181Q94 150 207.0 123.5Q320 97 402 97Z',
  },
  leo: {
    transform: 'translate(9.410 48.562) scale(0.058524 -0.058524)',
    d: 'M229 161Q229 174 215.5 209.0Q202 244 188.0 304.5Q174 365 174 439Q174 532 247.0 604.0Q320 676 425 676Q538 676 603.5 607.0Q669 538 669 443Q669 387 647.5 336.0Q626 285 601.0 253.0Q576 221 554.5 174.0Q533 127 533 78Q533 28 559.0 -24.0Q585 -76 632 -76Q662 -76 683.5 -61.0Q705 -46 705 -17Q705 2 668 2Q649 2 630.0 17.0Q611 32 611 55Q611 76 626.5 89.5Q642 103 663 103Q702 103 730.0 72.5Q758 42 758 2Q758 -53 717.5 -81.5Q677 -110 617 -110Q542 -110 492.5 -61.0Q443 -12 443 57Q443 106 465.0 155.5Q487 205 514.0 241.0Q541 277 563.0 328.0Q585 379 585 430Q585 525 535.5 582.5Q486 640 423.0 640.0Q360 640 309.0 581.0Q258 522 258 437Q258 359 275.0 276.5Q292 194 292 138Q292 76 255.5 38.0Q219 0 154 0Q87 0 50.5 49.0Q14 98 14 214H28Q45 132 74.5 108.0Q104 84 152 84Q229 84 229 161Z',
  },
  virgo: {
    transform: 'translate(8.632 42.891) scale(0.045954 -0.045954)',
    d: 'M173 538V0H89V524Q89 568 80.0 585.0Q71 602 47 602Q28 602 8 597V618Q38 626 60.0 633.5Q82 641 110.5 653.0Q139 665 159 672L168 670V579Q248 640 278.0 656.0Q308 672 346 672Q392 672 410.0 650.5Q428 629 447 570Q497 624 540.0 648.0Q583 672 635 672Q694 672 718.5 632.5Q743 593 747 506Q817 562 896 562Q961 562 985.0 516.5Q1009 471 1009 386Q1009 256 832 27Q868 -70 915 -160H853Q809 -82 784 -33Q704 -130 634 -198H572Q585 -180 649.0 -100.0Q713 -20 753 35Q664 245 664 476Q664 554 648.5 581.5Q633 609 582 609Q542 609 515.5 592.0Q489 575 460 535V0H376V482Q376 548 360.5 578.5Q345 609 306.0 609.0Q267 609 234.5 593.5Q202 578 187.5 562.0Q173 546 173 538ZM748 466Q748 461 748 456Q748 293 804 110Q925 293 925 406Q925 457 909.0 478.0Q893 499 843 499Q787 499 748 466Z',
  },
  libra: {
    transform: 'translate(12.030 52.030) scale(0.059259 -0.059259)',
    d: 'M650 0H24V52H650ZM25 181H189Q184 188 161.0 215.0Q138 242 124.5 263.5Q111 285 97.5 332.5Q84 380 84 439Q84 532 157.0 604.0Q230 676 335 676Q448 676 513.5 607.0Q579 538 579 443Q579 385 566.5 338.5Q554 292 539.5 269.5Q525 247 505.0 220.5Q485 194 478 181H648V117H413Q427 187 448.5 241.5Q470 296 482.5 334.5Q495 373 495 430Q495 525 445.5 582.5Q396 640 333.0 640.0Q270 640 219.0 581.0Q168 522 168 437Q168 372 179.5 331.5Q191 291 214.0 237.0Q237 183 253 117H25Z',
  },
  scorpio: {
    transform: 'translate(8.661 46.046) scale(0.042435 -0.042435)',
    d: 'M173 538V0H89V524Q89 568 80.0 585.0Q71 602 47 602Q28 602 8 597V618Q38 626 60.0 633.5Q82 641 110.5 653.0Q139 665 159 672L168 670V579Q248 640 278.0 656.0Q308 672 346 672Q392 672 410.0 650.5Q428 629 447 570Q497 624 540.0 648.0Q583 672 635 672Q701 672 724.5 621.5Q748 571 748 456Q748 52 805 52Q832 52 856.0 85.5Q880 119 915.0 177.0Q950 235 989 272L853 290L852 335L1085 328L1092 95L1046 97L1029 232Q1006 210 976.5 164.5Q947 119 925.5 83.0Q904 47 871.0 18.5Q838 -10 803 -10Q721 -10 692.5 95.0Q664 200 664 476Q664 554 648.5 581.5Q633 609 582 609Q542 609 515.5 592.0Q489 575 460 535V0H376V482Q376 548 360.5 578.5Q345 609 306.0 609.0Q267 609 234.5 593.5Q202 578 187.5 562.0Q173 546 173 538Z',
  },
  sagittarius: {
    transform: 'translate(13.304 50.400) scale(0.059259 -0.059259)',
    d: 'M172 127 257 43Q257 43 217 3L132 88L53 9L14 48L93 127L8 212L48 252L132 167L520 555L334 573L333 618L616 612L623 328L578 329L560 515Z',
  },
  capricorn: {
    transform: 'translate(15.378 51.200) scale(0.059259 -0.059259)',
    d: 'M322 372Q276 372 241.5 325.0Q207 278 207 223Q207 136 246.0 75.0Q285 14 349 14Q402 14 430.0 58.5Q458 103 458 185Q458 278 422.5 325.0Q387 372 322 372ZM41 144 23 181Q75 259 129 307Q134 385 179.5 462.5Q225 540 291 588H163Q122 588 100.5 573.0Q79 558 47 507L30 515L89 662H449V646Q382 624 316.0 554.5Q250 485 232 383Q294 428 360 428Q445 428 491.5 372.0Q538 316 538 219Q538 114 484.0 50.0Q430 -14 338 -14Q247 -14 193.0 55.5Q139 125 130 243Q85 204 41 144Z',
  },
  pisces: {
    transform: 'translate(14.133 51.822) scale(0.059259 -0.059259)',
    d: 'M30 307V373H148Q145 475 116.5 540.5Q88 606 19 660L31 676Q60 658 90.0 632.0Q120 606 151.5 568.0Q183 530 205.0 479.0Q227 428 233 373H369Q374 428 395.5 478.0Q417 528 449.5 565.5Q482 603 511.5 628.5Q541 654 575 676L584 660Q513 603 485.0 539.0Q457 475 454 373H564V307H454Q458 195 485.5 130.0Q513 65 584 9L572 -7Q541 12 512.0 37.0Q483 62 451.0 100.0Q419 138 397.0 192.0Q375 246 369 307H234Q231 257 215.0 212.0Q199 167 179.0 135.5Q159 104 130.0 74.5Q101 45 78.5 28.0Q56 11 28 -7L19 9Q91 67 118.5 132.0Q146 197 149 307Z',
  },
};

const definitionCache = new Map<ZodiacSign, ZodiacSymbolDefinition>();
const scheduleCache = new Map<ZodiacSign, CompiledZodiacSchedule>();

export function getZodiacSymbolDefinition(sign: ZodiacSign): ZodiacSymbolDefinition | null {
  const cached = definitionCache.get(sign);
  if (cached) return cached;

  let def: ZodiacSymbolDefinition;
  if (sign === 'aquarius') {
    def = AQUARIUS_SYMBOL_DEFINITION;
  } else {
    const spec = SYMBOL_SPECS[sign];
    if (!spec) return null;
    def = buildSymbolDefinitionFromPath(sign, spec.transform, spec.d);
  }
  definitionCache.set(sign, def);
  return def;
}

export function getCompiledSymbolSchedule(sign: ZodiacSign): CompiledZodiacSchedule | null {
  const cached = scheduleCache.get(sign);
  if (cached) return cached;

  const def = getZodiacSymbolDefinition(sign);
  if (!def) return null;
  const compiled = compileZodiacLayerSchedule(sign, def.layer);
  scheduleCache.set(sign, compiled);
  return compiled;
}
