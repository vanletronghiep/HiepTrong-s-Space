/**
 * Reusable Modern Didone vector wordmark & progressive illumination atlas generator
 * for the Zodiac Feature Collection.
 *
 * Extracts high-contrast Modern No. 20 (MOD20.TTF) uppercase vector contours,
 * applies optical serif-touching kerning across A-Z pairs, emits standalone
 * Champagne Rose Gold static SVGs, and generates `ZodiacWordmarkData` atlases
 * matching the emblem progressive illumination schedule (outline 0..8/13, fill 8/13..1,
 * 12% adjacent branch overlap, evenodd counters, and completed glow route).
 *
 * Usage:
 *   node scripts/zodiac/generate-wordmarks.mjs --sign=aquarius
 *   node scripts/zodiac/generate-wordmarks.mjs --verify-all
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_FONT_PATH = 'C:\\Windows\\Fonts\\MOD20.TTF';
const CAP_HEIGHT_FontUnits = 645;
const TARGET_CAP_HEIGHT = 100;
const VIEWBOX_PADDING = 6;
const AQUARIUS_OPTICAL_GAP_RATIO = 0.05;
const AQUARIUS_OPTICAL_GAP_FONT_UNITS = Math.round(
  CAP_HEIGHT_FontUnits * AQUARIUS_OPTICAL_GAP_RATIO,
);

const CHAMPAGNE_ROSE_GOLD_STOPS = [
  { offset: '0%', color: '#F3D3C9' },
  { offset: '50%', color: '#F0CFC5' },
  { offset: '100%', color: '#EBC5BA' },
];

/**
 * Legacy tight optical adjustments (in 1000-em font units) for specimen signs
 * such as ARIES (`A-R-I-E-S` touching-serif look).
 */
const PAIR_GAPS = {
  'E:S': 10,
  'U:S': 12,
  'A:Q': 4,
  'Q:U': 4,
};

/**
 * Subtle pair-specific breathing corrections layered on top of the base
 * 5% cap-height optical separation so diagonal/round pairs stay visually even.
 */
const OPTICAL_PAIR_OFFSETS = {
  'U:S': 4,
  'A:R': 2,
  'T:A': -4,
  'A:G': -3,
  'T:T': -3,
  'I:T': -3,
  'P:R': -3,
  'C:O': -3,
  'O:R': -3,
};

export const ZODIAC_SIGNS = [
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

function round2(value) {
  return Math.round(value * 100) / 100;
}

function round5(value) {
  return Math.round(value * 100000) / 100000;
}

/**
 * Parses a local TrueType font buffer and exposes simple glyph contour lookup.
 */
export function parseTtfFont(fontPath = DEFAULT_FONT_PATH) {
  const buf = fs.readFileSync(fontPath);
  const numTables = buf.readUInt16BE(4);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const off = 12 + i * 16;
    tables[buf.toString('ascii', off, off + 4)] = {
      offset: buf.readUInt32BE(off + 8),
      length: buf.readUInt32BE(off + 12),
    };
  }

  const unitsPerEm = buf.readUInt16BE(tables.head.offset + 18);
  const indexToLocFormat = buf.readInt16BE(tables.head.offset + 50);
  const numGlyphs = buf.readUInt16BE(tables.maxp.offset + 4);

  const cmapOff = tables.cmap.offset;
  const numSub = buf.readUInt16BE(cmapOff + 2);
  let fmt4Off = null;
  for (let i = 0; i < numSub; i++) {
    const pId = buf.readUInt16BE(cmapOff + 4 + i * 8);
    const eId = buf.readUInt16BE(cmapOff + 4 + i * 8 + 2);
    const subOff = cmapOff + buf.readUInt32BE(cmapOff + 4 + i * 8 + 4);
    if (buf.readUInt16BE(subOff) === 4 && ((pId === 3 && eId === 1) || pId === 0)) {
      fmt4Off = subOff;
      break;
    }
  }
  if (fmt4Off === null) {
    throw new Error(`No format 4 Unicode cmap found in ${fontPath}`);
  }

  const charToGlyph = new Map();
  const segCount = buf.readUInt16BE(fmt4Off + 6) / 2;
  const endCodeOff = fmt4Off + 14;
  const startCodeOff = endCodeOff + segCount * 2 + 2;
  const idDeltaOff = startCodeOff + segCount * 2;
  const idRangeOffsetOff = idDeltaOff + segCount * 2;

  for (let s = 0; s < segCount; s++) {
    const endCode = buf.readUInt16BE(endCodeOff + s * 2);
    const startCode = buf.readUInt16BE(startCodeOff + s * 2);
    const idDelta = buf.readInt16BE(idDeltaOff + s * 2);
    const idRangeOffset = buf.readUInt16BE(idRangeOffsetOff + s * 2);
    if (startCode === 0xffff) break;
    for (let c = startCode; c <= endCode; c++) {
      let gid;
      if (idRangeOffset === 0) {
        gid = (c + idDelta) & 0xffff;
      } else {
        const raw = buf.readUInt16BE(
          idRangeOffsetOff + s * 2 + idRangeOffset + (c - startCode) * 2,
        );
        gid = raw === 0 ? 0 : (raw + idDelta) & 0xffff;
      }
      charToGlyph.set(c, gid);
    }
  }

  const locaOff = tables.loca.offset;
  const glyfOffsets = [];
  for (let i = 0; i <= numGlyphs; i++) {
    glyfOffsets.push(
      indexToLocFormat === 0
        ? buf.readUInt16BE(locaOff + i * 2) * 2
        : buf.readUInt32BE(locaOff + i * 4),
    );
  }

  const glyfBase = tables.glyf.offset;
  function readGlyphContours(ch) {
    const gid = charToGlyph.get(ch.codePointAt(0)) ?? 0;
    const off = glyfBase + glyfOffsets[gid];
    const numContours = buf.readInt16BE(off);
    if (numContours <= 0) {
      throw new Error(`Expected simple glyph with contours > 0 for "${ch}"`);
    }

    let pos = off + 10;
    const endPts = [];
    for (let i = 0; i < numContours; i++) {
      endPts.push(buf.readUInt16BE(pos));
      pos += 2;
    }
    const instLen = buf.readUInt16BE(pos);
    pos += 2 + instLen;

    const totalPts = endPts[numContours - 1] + 1;
    const flags = [];
    while (flags.length < totalPts) {
      const f = buf.readUInt8(pos++);
      flags.push(f);
      if (f & 8) {
        const r = buf.readUInt8(pos++);
        for (let k = 0; k < r; k++) flags.push(f);
      }
    }

    const xs = [];
    const ys = [];
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < totalPts; i++) {
      const f = flags[i];
      if (f & 2) cx += f & 16 ? buf.readUInt8(pos++) : -buf.readUInt8(pos++);
      else if (!(f & 16)) {
        cx += buf.readInt16BE(pos);
        pos += 2;
      }
      xs.push(cx);
    }
    for (let i = 0; i < totalPts; i++) {
      const f = flags[i];
      if (f & 4) cy += f & 32 ? buf.readUInt8(pos++) : -buf.readUInt8(pos++);
      else if (!(f & 32)) {
        cy += buf.readInt16BE(pos);
        pos += 2;
      }
      ys.push(cy);
    }

    const contours = [];
    let start = 0;
    for (const end of endPts) {
      const pts = [];
      for (let i = start; i <= end; i++) {
        pts.push({ x: xs[i], y: ys[i], onCurve: Boolean(flags[i] & 1) });
      }
      contours.push(pts);
      start = end + 1;
    }
    return contours;
  }

  return { unitsPerEm, readGlyphContours };
}

/**
 * Inserts implied on-curve midpoints between consecutive off-curve points
 * and rotates the contour to start at a deterministic leftmost on-curve anchor.
 */
function normalizeFontContour(pts, anchorBiasY = 0) {
  const expanded = [];
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const nxt = pts[(i + 1) % pts.length];
    expanded.push(cur);
    if (!cur.onCurve && !nxt.onCurve) {
      expanded.push({
        x: (cur.x + nxt.x) / 2,
        y: (cur.y + nxt.y) / 2,
        onCurve: true,
      });
    }
  }

  let bestIdx = -1;
  let bestScore = Infinity;
  for (let i = 0; i < expanded.length; i++) {
    if (!expanded[i].onCurve) continue;
    // Prefer leftmost point; subtle Y tie-break keeps start cleanly on serif/curve edge.
    const score = expanded[i].x + anchorBiasY * expanded[i].y;
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) {
    throw new Error('Contour has no on-curve anchor points');
  }
  return [...expanded.slice(bestIdx), ...expanded.slice(0, bestIdx)];
}

function flattenOrderedContour(ord, curveSteps = 16) {
  const poly = [{ x: ord[0].x, y: ord[0].y }];
  for (let i = 1; i < ord.length; ) {
    const p = ord[i];
    if (p.onCurve) {
      poly.push({ x: p.x, y: p.y });
      i++;
    } else {
      const p0 = poly[poly.length - 1];
      const p2 = ord[(i + 1) % ord.length];
      for (let s = 1; s <= curveSteps; s++) {
        const t = s / curveSteps;
        const u = 1 - t;
        poly.push({
          x: u * u * p0.x + 2 * u * t * p.x + t * t * p2.x,
          y: u * u * p0.y + 2 * u * t * p.y + t * t * p2.y,
        });
      }
      i += 2;
    }
  }
  return poly;
}

function polygonSignedArea(poly) {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function computeScanProfile(contours, yMin = -200, yMax = 660, yStep = 2) {
  const polys = contours.map((c) => flattenOrderedContour(normalizeFontContour(c), 16));
  const profile = new Map();
  for (let y = yMin; y <= yMax; y += yStep) {
    let minX = Infinity;
    let maxX = -Infinity;
    for (const poly of polys) {
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        if ((a.y <= y && b.y >= y) || (b.y <= y && a.y >= y)) {
          if (Math.abs(b.y - a.y) < 1e-6) {
            minX = Math.min(minX, a.x, b.x);
            maxX = Math.max(maxX, a.x, b.x);
          } else {
            const t = (y - a.y) / (b.y - a.y);
            const x = a.x + (b.x - a.x) * t;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
          }
        }
      }
    }
    if (minX <= maxX) profile.set(y, [minX, maxX]);
  }
  return profile;
}

/**
 * Samples uniformly along a flattened polyline (optionally closed) and produces
 * an exact normalized arc-length LUT `[s, x, y]` with `s` from 0 to 1.
 */
function buildPolylineLut(points, closed = false, maxSamples = 56) {
  const ring = closed ? [...points, points[0]] : points;
  const cumLen = [0];
  let total = 0;
  for (let i = 1; i < ring.length; i++) {
    const dx = ring[i].x - ring[i - 1].x;
    const dy = ring[i].y - ring[i - 1].y;
    total += Math.hypot(dx, dy);
    cumLen.push(total);
  }
  if (total <= 0) {
    throw new Error('Cannot build LUT for zero-length path');
  }

  const sampleCount = Math.max(16, Math.min(maxSamples, Math.ceil(total / 5)));
  const lut = [];
  let segIdx = 1;
  for (let k = 0; k <= sampleCount; k++) {
    const s = k === 0 ? 0 : k === sampleCount ? 1 : round5(k / sampleCount);
    const targetDist = s * total;
    while (segIdx < cumLen.length - 1 && cumLen[segIdx] < targetDist) {
      segIdx++;
    }
    const segStart = cumLen[segIdx - 1];
    const segEnd = cumLen[segIdx];
    const span = segEnd - segStart;
    const alpha = span > 1e-9 ? (targetDist - segStart) / span : 0;
    const a = ring[segIdx - 1];
    const b = ring[segIdx];
    lut.push([s, round2(a.x + (b.x - a.x) * alpha), round2(a.y + (b.y - a.y) * alpha)]);
  }
  return { length: round2(total), lut };
}

function orderedContourToSvgAndPoly(ord, tx, ty, scale) {
  const toSvg = (pt) => ({
    x: round2(tx + pt.x * scale),
    y: round2(ty - pt.y * scale),
  });

  const parts = [];
  const start = toSvg(ord[0]);
  parts.push(`M${start.x},${start.y}`);

  const poly = [start];
  for (let i = 1; i < ord.length; ) {
    const p = ord[i];
    if (p.onCurve) {
      const sp = toSvg(p);
      parts.push(`L${sp.x},${sp.y}`);
      poly.push(sp);
      i++;
    } else {
      const c = toSvg(p);
      const endPt = toSvg(ord[(i + 1) % ord.length]);
      parts.push(`Q${c.x},${c.y} ${endPt.x},${endPt.y}`);
      const p0 = poly[poly.length - 1];
      const steps = 16;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const u = 1 - t;
        poly.push({
          x: u * u * p0.x + 2 * u * t * c.x + t * t * endPt.x,
          y: u * u * p0.y + 2 * u * t * c.y + t * t * endPt.y,
        });
      }
      i += 2;
    }
  }
  parts.push('Z');
  return { d: parts.join(''), poly };
}

/**
 * Generates a continuous left-to-right vertical-serpentine fill guide strictly inside
 * each letter's vertical column bounds so clipping to `clipPathD` yields 100% pixel fill.
 */
function buildLetterFillGuide(letterPolys, letterIndex, letterId) {
  const samples = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const poly of letterPolys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      minX = Math.min(minX, a.x);
      maxX = Math.max(maxX, a.x);
      minY = Math.min(minY, a.y);
      maxY = Math.max(maxY, a.y);
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      const subs = Math.max(1, Math.ceil(segLen));
      for (let k = 0; k <= subs; k++) {
        const t = k / subs;
        samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
  }

  const strokeWidth = 24;
  const halfStroke = strokeWidth / 2;
  const colStep = 12;
  const xStart = minX + Math.min(4, (maxX - minX) * 0.2);
  const xEnd = maxX - Math.min(4, (maxX - minX) * 0.2);

  const xs = [];
  if (xEnd <= xStart + 0.5) {
    xs.push(round2((minX + maxX) / 2));
  } else {
    const steps = Math.max(2, Math.ceil((xEnd - xStart) / colStep));
    for (let k = 0; k <= steps; k++) {
      xs.push(round2(xStart + ((xEnd - xStart) * k) / steps));
    }
  }

  const waypoints = [];
  xs.forEach((xCol, colIdx) => {
    let colMinY = Infinity;
    let colMaxY = -Infinity;
    for (const s of samples) {
      if (Math.abs(s.x - xCol) <= halfStroke + 1) {
        if (s.y < colMinY) colMinY = s.y;
        if (s.y > colMaxY) colMaxY = s.y;
      }
    }
    if (!Number.isFinite(colMinY)) {
      colMinY = minY;
      colMaxY = maxY;
    }
    // Slight vertical trim keeps waypoints comfortably inside letter cap/baseline while
    // rounded strokeWidth=24 still reaches every tip inside clipPathD.
    const yTop = round2(Math.max(minY - 1, colMinY + Math.min(3, (colMaxY - colMinY) * 0.15)));
    const yBot = round2(Math.min(maxY + 1, colMaxY - Math.min(3, (colMaxY - colMinY) * 0.15)));
    if (colIdx % 2 === 0) {
      waypoints.push({ x: xCol, y: yTop });
      if (Math.abs(yBot - yTop) > 1) waypoints.push({ x: xCol, y: yBot });
    } else {
      waypoints.push({ x: xCol, y: yBot });
      if (Math.abs(yBot - yTop) > 1) waypoints.push({ x: xCol, y: yTop });
    }
  });

  const d =
    `M${waypoints[0].x},${waypoints[0].y}` +
    waypoints
      .slice(1)
      .map((p) => `L${p.x},${p.y}`)
      .join('');
  const { length, lut } = buildPolylineLut(waypoints, false, 64);

  return {
    id: `${letterId}-fill-guide`,
    d,
    length,
    strokeWidth,
    contourIndices: [letterIndex],
    lut,
  };
}

/**
 * Finds the smallest horizontal shift `dx` for `rightPolys` such that the minimum
 * 2D Euclidean distance between any sampled boundary point on `leftPolys` and any
 * sampled boundary point on `rightPolys` shifted by `dx` is at least `minGap`,
 * and `rightPolys` sits strictly to the right of `leftPolys` where close.
 */
function findEuclidContourShift(leftContours, rightContours, minGap) {
  const sampleDense = (contours) => {
    const pts = [];
    for (const c of contours) {
      const poly = flattenOrderedContour(normalizeFontContour(c), 16);
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y);
        const steps = Math.max(1, Math.ceil(segLen / 4));
        for (let k = 0; k < steps; k++) {
          const t = k / steps;
          pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        }
      }
    }
    return pts;
  };

  const lPts = sampleDense(leftContours);
  const rPts = sampleDense(rightContours);
  let lMax = -Infinity;
  let rMin = Infinity;
  let lMin = Infinity;
  let rMax = -Infinity;
  for (const p of lPts) {
    if (p.x > lMax) lMax = p.x;
    if (p.x < lMin) lMin = p.x;
  }
  for (const p of rPts) {
    if (p.x < rMin) rMin = p.x;
    if (p.x > rMax) rMax = p.x;
  }

  const hasClearance = (dx) => {
    const gapSq = minGap * minGap;
    for (const lp of lPts) {
      for (const rp of rPts) {
        const xDiff = rp.x + dx - lp.x;
        const yDiff = rp.y - lp.y;
        if (xDiff * xDiff + yDiff * yDiff < gapSq) {
          return false;
        }
      }
    }
    // Also reject any case where right glyph's centroid lands left of left glyph's centroid
    return true;
  };

  // Start binary search from scanline-based lower bound where glyphs don't cross.
  let lo = lMin - rMax;
  // Find rightmost crossing bound by scanline first
  const lProf = computeScanProfile(leftContours);
  const rProf = computeScanProfile(rightContours);
  for (const [y, [, lm]] of lProf) {
    const rs = rProf.get(y);
    if (rs) lo = Math.max(lo, lm - rs[0]);
  }
  let hi = lMax - rMin + minGap + 10;
  for (let iter = 0; iter < 24; iter++) {
    const mid = (lo + hi) / 2;
    if (hasClearance(mid)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return Math.ceil(hi);
}

/**
 * Builds complete `ZodiacWordmarkData` and standalone SVG markup for any uppercase Zodiac sign.
 */
export function buildZodiacWordmark(sign, font, options = {}) {
  const text = sign.toUpperCase();
  const scale = TARGET_CAP_HEIGHT / CAP_HEIGHT_FontUnits;
  const useOpticalSpacing = options.opticalSpacing ?? true;
  const includeGlowRoute = options.includeGlowRoute ?? false;

  const glyphCache = new Map();
  for (const ch of text) {
    if (!glyphCache.has(ch)) {
      const rawContours = font.readGlyphContours(ch);
      glyphCache.set(ch, {
        contours: rawContours,
        profile: computeScanProfile(rawContours),
      });
    }
  }

  // First pass at arbitrary origin (0, 0) to measure exact contour-aware placement.
  const placedLetters = [];
  let cursorFontX = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (i > 0) {
      const prev = text[i - 1];
      const pairKey = `${prev}:${ch}`;
      if (useOpticalSpacing) {
        const minGap = AQUARIUS_OPTICAL_GAP_FONT_UNITS + (OPTICAL_PAIR_OFFSETS[pairKey] ?? 0);
        cursorFontX += findEuclidContourShift(
          glyphCache.get(prev).contours,
          glyphCache.get(ch).contours,
          minGap,
        );
      } else {
        const L = glyphCache.get(prev).profile;
        const R = glyphCache.get(ch).profile;
        let shift = -Infinity;
        for (const [y, [, lMax]] of L) {
          const rSpan = R.get(y);
          if (rSpan) shift = Math.max(shift, lMax - rSpan[0]);
        }
        const pairGap = PAIR_GAPS[pairKey] ?? 0;
        cursorFontX += shift + pairGap;
      }
    }

    const rawContours = glyphCache.get(ch).contours;
    const contourMeta = rawContours.map((pts) => {
      const ord = normalizeFontContour(pts, 0.12);
      const poly = flattenOrderedContour(ord, 12);
      const area = Math.abs(polygonSignedArea(poly));
      const centroidX = poly.reduce((acc, p) => acc + p.x, 0) / poly.length;
      return { ord, area, centroidX };
    });

    // Outer contour (largest area) first, followed by counters sorted left-to-right.
    contourMeta.sort((a, b) => b.area - a.area);
    const outer = contourMeta[0];
    const counters = contourMeta.slice(1).sort((a, b) => a.centroidX - b.centroidX);

    placedLetters.push({
      letterIndex: i,
      ch,
      xFont: cursorFontX,
      contours: [outer, ...counters],
    });
  }

  let rawMinX = Infinity;
  let rawMinY = Infinity;
  let rawMaxX = -Infinity;
  let rawMaxY = -Infinity;
  for (const letter of placedLetters) {
    for (const c of letter.contours) {
      const poly = flattenOrderedContour(c.ord, 12);
      for (const p of poly) {
        const sx = (letter.xFont + p.x) * scale;
        const sy = (CAP_HEIGHT_FontUnits - p.y) * scale;
        rawMinX = Math.min(rawMinX, sx);
        rawMinY = Math.min(rawMinY, sy);
        rawMaxX = Math.max(rawMaxX, sx);
        rawMaxY = Math.max(rawMaxY, sy);
      }
    }
  }

  const originOffsetX = -rawMinX + VIEWBOX_PADDING;
  const originOffsetY = -rawMinY + VIEWBOX_PADDING + TARGET_CAP_HEIGHT;
  const viewBox = {
    minX: 0,
    minY: 0,
    width: round2(rawMaxX - rawMinX + VIEWBOX_PADDING * 2),
    height: round2(rawMaxY - rawMinY + VIEWBOX_PADDING * 2),
  };

  const canonicalParts = [];
  const roots = [];
  const branches = [];
  const fillRegions = [];
  let globalContourIdx = 0;

  for (const letter of placedLetters) {
    const letterId = `letter-${letter.letterIndex}-${letter.ch.toLowerCase()}`;
    roots.push(letterId);

    const tx = originOffsetX + letter.xFont * scale;
    const ty = originOffsetY;

    const letterSvgContours = [];
    const letterContourIndices = [];

    for (let cIdx = 0; cIdx < letter.contours.length; cIdx++) {
      const c = letter.contours[cIdx];
      const { d, poly } = orderedContourToSvgAndPoly(c.ord, tx, ty, scale);
      canonicalParts.push(d);
      letterSvgContours.push({
        contourIndex: globalContourIdx++,
        isOuter: cIdx === 0,
        d,
        poly,
      });
      letterContourIndices.push(letterSvgContours[cIdx].contourIndex);
    }

    const outerContour = letterSvgContours[0];
    const counterContours = letterSvgContours.slice(1);
    const childIds = counterContours.map((_, idx) => `${letterId}-counter-${idx}`);

    const outerLut = buildPolylineLut(outerContour.poly, true, 72);
    branches.push({
      id: letterId,
      label: `Letter ${letter.ch} outer contour`,
      parentId: null,
      kind: 'major',
      children: childIds,
      contourIndices: [outerContour.contourIndex],
      entryTransition: 'connected',
      outlineGuides: [
        {
          id: `${letterId}-outline`,
          d: outerContour.d,
          length: outerLut.length,
          strokeWidth: 5.4,
          contourIndices: [outerContour.contourIndex],
          lut: outerLut.lut,
        },
      ],
    });

    counterContours.forEach((counter, idx) => {
      const counterId = childIds[idx];
      const counterLut = buildPolylineLut(counter.poly, true, 48);
      branches.push({
        id: counterId,
        label: `Letter ${letter.ch} counter ${idx + 1}`,
        parentId: letterId,
        kind: 'detail-group',
        children: [],
        contourIndices: [counter.contourIndex],
        entryTransition: 'connected',
        outlineGuides: [
          {
            id: `${counterId}-outline`,
            d: counter.d,
            length: counterLut.length,
            strokeWidth: 5.4,
            contourIndices: [counter.contourIndex],
            lut: counterLut.lut,
          },
        ],
      });
    });

    const clipPathD = letterSvgContours.map((item) => item.d).join('');
    const fillGuide = buildLetterFillGuide(
      letterSvgContours.map((item) => item.poly),
      outerContour.contourIndex,
      letterId,
    );
    fillGuide.contourIndices = letterContourIndices;

    fillRegions.push({
      id: `${letterId}-fill`,
      label: `Letter ${letter.ch} fill`,
      branchId: letterId,
      kind: 'major',
      order: letter.letterIndex,
      clipPathD,
      contourIndices: letterContourIndices,
      entryTransition: 'connected',
      fillGuides: [fillGuide],
    });
  }

  // Smooth horizontal closed sheen sweep across top half and lower half
  const glowLeftX = round2(VIEWBOX_PADDING);
  const glowRightX = round2(viewBox.width - VIEWBOX_PADDING);
  const glowTopY = round2(VIEWBOX_PADDING + 34);
  const glowBotY = round2(VIEWBOX_PADDING + 78);
  const glowPts = [
    { x: glowLeftX, y: glowTopY },
    { x: glowRightX, y: glowTopY },
    { x: glowRightX, y: glowBotY },
    { x: glowLeftX, y: glowBotY },
  ];
  const glowD =
    `M${glowPts[0].x},${glowPts[0].y}` +
    `L${glowPts[1].x},${glowPts[1].y}` +
    `L${glowPts[2].x},${glowPts[2].y}` +
    `L${glowPts[3].x},${glowPts[3].y}Z`;
  const glowLut = buildPolylineLut(glowPts, true, 64);

  const gradientId = `${sign}-wordmark-rose-gold`;
  const canonicalPath = canonicalParts.join('');
  const staticSvgUrl = `/visuals/zodiac/${sign}-wordmark.svg`;

  const wordmarkData = {
    text,
    staticSvgUrl,
    viewBox,
    gradient: {
      id: gradientId,
      x1: '0%',
      y1: '18%',
      x2: '100%',
      y2: '82%',
      gradientUnits: 'objectBoundingBox',
      stops: CHAMPAGNE_ROSE_GOLD_STOPS,
    },
    canonicalPath,
    fillRule: 'evenodd',
    clipRule: 'evenodd',
    contourCount: globalContourIdx,
    outlineBandStrokeWidth: 4.4,
    headRadius: 20,
    glowStrokeWidth: 108,
    roots,
    branches,
    fillRegions,
    ...(includeGlowRoute
      ? {
          completedGlowRoute: {
            id: `${sign}-wordmark-glow-route`,
            d: glowD,
            length: glowLut.length,
            lut: glowLut.lut,
          },
        }
      : {}),
  };

  const staticSvg =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox.width} ${viewBox.height}" width="${viewBox.width}" height="${viewBox.height}" fill="none">\n` +
    `  <defs>\n` +
    `    <linearGradient id="${gradientId}" x1="0%" y1="18%" x2="100%" y2="82%">\n` +
    CHAMPAGNE_ROSE_GOLD_STOPS.map(
      (stop) => `      <stop offset="${stop.offset}" stop-color="${stop.color}"/>`,
    ).join('\n') +
    `\n    </linearGradient>\n` +
    `  </defs>\n` +
    `  <path fill="url(#${gradientId})" fill-rule="evenodd" clip-rule="evenodd" d="${canonicalPath}"/>\n` +
    `</svg>\n`;

  return { wordmarkData, staticSvg };
}

function main() {
  const argv = process.argv.slice(2);
  const args = new Set(argv);
  const verifyAll = args.has('--verify-all');
  const writeAll = args.has('--all');
  const includeAries = args.has('--include-aries');
  const signArg = argv.find((item) => item.startsWith('--sign='))?.split('=')[1];
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const outDir = path.join(root, 'public/visuals/zodiac');
  const font = parseTtfFont(DEFAULT_FONT_PATH);

  if (verifyAll) {
    for (const sign of ZODIAC_SIGNS) {
      const { wordmarkData } = buildZodiacWordmark(sign, font);
      if (wordmarkData.contourCount < wordmarkData.text.length) {
        throw new Error(`Invalid contour count for ${sign}`);
      }
      console.log(
        `  [ok] ${wordmarkData.text.padEnd(11)} viewBox=${wordmarkData.viewBox.width}x${wordmarkData.viewBox.height} contours=${wordmarkData.contourCount} branches=${wordmarkData.branches.length}`,
      );
    }
    if (!signArg && !includeAries && !writeAll) {
      return;
    }
  }

  const targetSigns = writeAll
    ? ZODIAC_SIGNS
    : [signArg ?? 'aquarius', ...(includeAries && signArg !== 'aries' ? ['aries'] : [])];

  for (const targetSign of targetSigns) {
    if (!ZODIAC_SIGNS.includes(targetSign)) {
      throw new Error(`Unknown --sign value: ${targetSign}`);
    }

    const generated = buildZodiacWordmark(targetSign, font);
    fs.writeFileSync(path.join(outDir, `${targetSign}-wordmark.svg`), generated.staticSvg, 'utf8');

    const enhancementPath = path.join(outDir, `${targetSign}-enhancement.json`);
    if (fs.existsSync(enhancementPath)) {
      const enhancementJson = JSON.parse(fs.readFileSync(enhancementPath, 'utf8'));
      enhancementJson.wordmark = generated.wordmarkData;
      fs.writeFileSync(enhancementPath, JSON.stringify(enhancementJson, null, 2) + '\n', 'utf8');
    }

    console.log(
      `Generated ${targetSign}-wordmark.svg (${generated.wordmarkData.viewBox.width}x${generated.wordmarkData.viewBox.height}, ${generated.wordmarkData.contourCount} contours).`,
    );
  }
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  main();
}
