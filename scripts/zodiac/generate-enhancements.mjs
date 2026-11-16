/**
 * Deterministic canonical ingestion, manifest builder, and progressive illumination atlas
 * generator for all 12 Zodiac signs (`aries` through `pisces`).
 *
 * - Verifies & preserves byte-identical `public/visuals/zodiac/{sign}.svg` and
 *   `public/visuals/zodiac/{sign}-symbol.svg` against `sources/img/zodiac/svg/`.
 * - Generates `public/visuals/zodiac/{sign}-enhancement.json` for the 11 rollout signs
 *   (`aquarius-enhancement.json` keeps its hand-refined Aquarius jug/water/frame atlas,
 *   while syncing its `wordmark` cleanly from `generate-wordmarks.mjs`).
 * - Updates `public/visuals/zodiac/manifest.json` with exact SHA-256 hashes, byte counts,
 *   symbol checksums, canonical paths, and Champagne Rose Gold gradient definitions.
 *
 * Usage:
 *   node scripts/zodiac/generate-enhancements.mjs
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildZodiacWordmark, parseTtfFont, ZODIAC_SIGNS } from './generate-wordmarks.mjs';

const DEFAULT_FONT_PATH = 'C:\\Windows\\Fonts\\MOD20.TTF';

const ROSE_GOLD_STOPS = [
  { offset: '0%', color: '#F3DDD8' },
  { offset: '50%', color: '#EBC7BF' },
  { offset: '100%', color: '#E0B1A6' },
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round5(n) {
  return Math.round(n * 100000) / 100000;
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function splitSubpaths(d) {
  return d
    .split(/(?=[Mm])/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Parses an SVG path subpath (`M...C/Q/L/H/V...Z`) into an adaptive polyline.
 */
function flattenSubpath(subpathD) {
  const tokens = subpathD.match(/[a-zA-Z]|-?\d+(?:\.\d+)?/g) ?? [];
  const pts = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let lastCtrlX = null;
  let lastCtrlY = null;
  let lastCmd = '';
  let cmd = '';
  let i = 0;

  const pushPt = (x, y) => {
    const prev = pts[pts.length - 1];
    if (!prev || Math.hypot(x - prev.x, y - prev.y) > 0.35) {
      pts.push({ x, y });
    }
  };

  while (i < tokens.length) {
    const tk = tokens[i];
    if (/^[a-zA-Z]$/.test(tk)) {
      cmd = tk;
      i += 1;
      if (cmd === 'Z' || cmd === 'z') {
        cx = sx;
        cy = sy;
        pushPt(cx, cy);
        lastCtrlX = null;
        lastCtrlY = null;
        lastCmd = cmd;
      }
      continue;
    }

    if (cmd === 'M' || cmd === 'L') {
      cx = Number(tokens[i++]);
      cy = Number(tokens[i++]);
      if (cmd === 'M') {
        sx = cx;
        sy = cy;
        cmd = 'L';
      }
      pushPt(cx, cy);
      lastCtrlX = null;
      lastCtrlY = null;
    } else if (cmd === 'm' || cmd === 'l') {
      cx += Number(tokens[i++]);
      cy += Number(tokens[i++]);
      if (cmd === 'm') {
        sx = cx;
        sy = cy;
        cmd = 'l';
      }
      pushPt(cx, cy);
      lastCtrlX = null;
      lastCtrlY = null;
    } else if (cmd === 'H') {
      cx = Number(tokens[i++]);
      pushPt(cx, cy);
      lastCtrlX = null;
      lastCtrlY = null;
    } else if (cmd === 'h') {
      cx += Number(tokens[i++]);
      pushPt(cx, cy);
      lastCtrlX = null;
      lastCtrlY = null;
    } else if (cmd === 'V') {
      cy = Number(tokens[i++]);
      pushPt(cx, cy);
      lastCtrlX = null;
      lastCtrlY = null;
    } else if (cmd === 'v') {
      cy += Number(tokens[i++]);
      pushPt(cx, cy);
      lastCtrlX = null;
      lastCtrlY = null;
    } else if (cmd === 'C' || cmd === 'c') {
      const rel = cmd === 'c';
      const x1 = Number(tokens[i++]) + (rel ? cx : 0);
      const y1 = Number(tokens[i++]) + (rel ? cy : 0);
      const x2 = Number(tokens[i++]) + (rel ? cx : 0);
      const y2 = Number(tokens[i++]) + (rel ? cy : 0);
      const x3 = Number(tokens[i++]) + (rel ? cx : 0);
      const y3 = Number(tokens[i++]) + (rel ? cy : 0);
      const chord = Math.hypot(x3 - cx, y3 - cy);
      const steps = Math.max(2, Math.min(8, Math.ceil(chord / 5)));
      const p0x = cx;
      const p0y = cy;
      for (let s = 1; s <= steps; s += 1) {
        const t = s / steps;
        const mt = 1 - t;
        const x =
          mt * mt * mt * p0x + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
        const y =
          mt * mt * mt * p0y + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
        pushPt(x, y);
      }
      cx = x3;
      cy = y3;
      lastCtrlX = x2;
      lastCtrlY = y2;
    } else if (cmd === 'S' || cmd === 's') {
      const rel = cmd === 's';
      const reflected = lastCmd === 'C' || lastCmd === 'c' || lastCmd === 'S' || lastCmd === 's';
      const x1 = reflected && lastCtrlX !== null ? 2 * cx - lastCtrlX : cx;
      const y1 = reflected && lastCtrlY !== null ? 2 * cy - lastCtrlY : cy;
      const x2 = Number(tokens[i++]) + (rel ? cx : 0);
      const y2 = Number(tokens[i++]) + (rel ? cy : 0);
      const x3 = Number(tokens[i++]) + (rel ? cx : 0);
      const y3 = Number(tokens[i++]) + (rel ? cy : 0);
      const chord = Math.hypot(x3 - cx, y3 - cy);
      const steps = Math.max(2, Math.min(8, Math.ceil(chord / 5)));
      const p0x = cx;
      const p0y = cy;
      for (let s = 1; s <= steps; s += 1) {
        const t = s / steps;
        const mt = 1 - t;
        const x =
          mt * mt * mt * p0x + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
        const y =
          mt * mt * mt * p0y + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
        pushPt(x, y);
      }
      cx = x3;
      cy = y3;
      lastCtrlX = x2;
      lastCtrlY = y2;
    } else if (cmd === 'Q' || cmd === 'q') {
      const rel = cmd === 'q';
      const x1 = Number(tokens[i++]) + (rel ? cx : 0);
      const y1 = Number(tokens[i++]) + (rel ? cy : 0);
      const x2 = Number(tokens[i++]) + (rel ? cx : 0);
      const y2 = Number(tokens[i++]) + (rel ? cy : 0);
      const chord = Math.hypot(x2 - cx, y2 - cy);
      const steps = Math.max(2, Math.min(6, Math.ceil(chord / 5)));
      const p0x = cx;
      const p0y = cy;
      for (let s = 1; s <= steps; s += 1) {
        const t = s / steps;
        const mt = 1 - t;
        const x = mt * mt * p0x + 2 * mt * t * x1 + t * t * x2;
        const y = mt * mt * p0y + 2 * mt * t * y1 + t * t * y2;
        pushPt(x, y);
      }
      cx = x2;
      cy = y2;
      lastCtrlX = x1;
      lastCtrlY = y1;
    } else {
      i += 1;
    }
    lastCmd = cmd;
  }

  if (pts.length === 0) {
    return [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
  }
  if (pts.length === 1) {
    return [pts[0], { x: pts[0].x + 0.5, y: pts[0].y + 0.5 }];
  }
  return pts;
}

function perpendicularDistance(pt, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-9) return Math.hypot(pt.x - a.x, pt.y - a.y);
  const t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq;
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(pt.x - projX, pt.y - projY);
}

function rdpSimplify(pts, epsilon) {
  if (pts.length <= 4) return pts;
  let maxDist = 0;
  let index = 0;
  const end = pts.length - 1;
  for (let i = 1; i < end; i += 1) {
    const d = perpendicularDistance(pts[i], pts[0], pts[end]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = rdpSimplify(pts.slice(0, index + 1), epsilon);
    const right = rdpSimplify(pts.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[end]];
}

function buildPolylineLut(pts, closed = false, maxSamples = 48) {
  const poly = closed ? [...pts, pts[0]] : [...pts];
  const cumLen = [0];
  let total = 0;
  for (let i = 1; i < poly.length; i += 1) {
    total += Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y);
    cumLen.push(total);
  }
  const safeTotal = total > 0 ? total : 1;
  const lut = [];
  const count = Math.min(maxSamples, Math.max(2, poly.length));
  for (let k = 0; k < count; k += 1) {
    const targetLen = (safeTotal * k) / (count - 1);
    let segIdx = 0;
    while (segIdx + 1 < cumLen.length - 1 && cumLen[segIdx + 1] < targetLen) {
      segIdx += 1;
    }
    const segStart = cumLen[segIdx];
    const segEnd = cumLen[segIdx + 1] ?? segStart;
    const span = segEnd - segStart;
    const localT = span > 1e-6 ? (targetLen - segStart) / span : 0;
    const a = poly[segIdx];
    const b = poly[segIdx + 1] ?? a;
    const x = round2(a.x + (b.x - a.x) * localT);
    const y = round2(a.y + (b.y - a.y) * localT);
    lut.push([round5(k / (count - 1)), x, y]);
  }
  lut[0][0] = 0;
  lut[lut.length - 1][0] = 1;
  return { length: round2(safeTotal), lut };
}

function pointsToSvgPath(pts, closed = false) {
  const rounded = pts.map((p) => ({ x: round2(p.x), y: round2(p.y) }));
  return (
    `M${rounded[0].x},${rounded[0].y}` +
    rounded
      .slice(1)
      .map((p) => `L${p.x},${p.y}`)
      .join('') +
    (closed ? 'Z' : '')
  );
}

function orderNearestNeighbor(items, startX, startY) {
  const remaining = [...items];
  const ordered = [];
  let cx = startX;
  let cy = startY;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const d = Math.hypot(remaining[i].cx - cx, remaining[i].cy - cy);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const [picked] = remaining.splice(bestIdx, 1);
    ordered.push(picked);
    cx = picked.cx;
    cy = picked.cy;
  }
  return ordered;
}

function buildEntryPath(idPrefix, fromPt, toPt) {
  const pts = [fromPt, toPt];
  const { length, lut } = buildPolylineLut(pts, false, 4);
  return {
    id: `${idPrefix}-entry`,
    d: pointsToSvgPath(pts, false),
    length,
    lut,
  };
}

function buildGroupOutlineGuides(groupId, contours, isDetailGroup) {
  if (isDetailGroup && contours.length > 1) {
    const ordered = orderNearestNeighbor(contours, contours[0].cx, contours[0].cy);
    const pts = ordered.map((c) => ({ x: c.cx, y: c.cy }));
    const { length, lut } = buildPolylineLut(pts, false, Math.min(72, Math.max(12, pts.length)));
    return [
      {
        id: `og-${groupId}`,
        d: pointsToSvgPath(pts, false),
        length,
        strokeWidth: 16,
        contourIndices: ordered.map((c) => c.contourIndex),
        lut,
      },
    ];
  }

  return contours.map((c) => {
    const simplified = rdpSimplify(c.poly, c.diag > 80 ? 0.9 : 0.65);
    const capped =
      simplified.length > 120
        ? simplified.filter((_, idx) => idx === 0 || idx === simplified.length - 1 || idx % 2 === 0)
        : simplified;
    const { length, lut } = buildPolylineLut(capped, true, Math.min(64, Math.max(12, capped.length)));
    return {
      id: `og-${groupId}-${c.contourIndex}`,
      d: pointsToSvgPath(capped, true),
      length,
      strokeWidth: c.diag < 16 ? 12 : 7,
      contourIndices: [c.contourIndex],
      lut,
    };
  });
}

function buildRegionBounds(contours, viewBox) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of contours) {
    if (c.minX < minX) minX = c.minX;
    if (c.minY < minY) minY = c.minY;
    if (c.maxX > maxX) maxX = c.maxX;
    if (c.maxY > maxY) maxY = c.maxY;
  }
  const pad = 4;
  return {
    x0: round2(Math.max(0, minX - pad)),
    y0: round2(Math.max(0, minY - pad)),
    x1: round2(Math.min(viewBox.width, maxX + pad)),
    y1: round2(Math.min(viewBox.height, maxY + pad)),
  };
}

function buildSerpentineFillGuide(id, bounds, contourIndices) {
  const strokeWidth = 44;
  const rowStep = 26;
  const x0 = bounds.x0;
  const x1 = bounds.x1;
  const y0 = bounds.y0;
  const y1 = bounds.y1;
  const rows = Math.max(1, Math.ceil((y1 - y0) / rowStep));
  const pts = [];
  for (let r = 0; r <= rows; r += 1) {
    const y = round2(y0 + ((y1 - y0) * r) / rows);
    if (r % 2 === 0) {
      pts.push({ x: x0, y }, { x: x1, y });
    } else {
      pts.push({ x: x1, y }, { x: x0, y });
    }
  }
  const { length, lut } = buildPolylineLut(pts, false, Math.min(64, Math.max(8, pts.length * 2)));
  return {
    id,
    d: pointsToSvgPath(pts, false),
    length,
    strokeWidth,
    contourIndices,
    lut,
  };
}

function polylineArcLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i += 1) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

function buildCompletedGlowRoute(sign, majorContours, viewBox) {
  const { width: W, height: H } = viewBox;
  // Trace the longest central subject contour so the completed highlight glides
  // directly along the canonical silhouette rather than empty canvas space.
  const dominant = [...majorContours]
    .filter((c) => c.cy > H * 0.14 && c.cy < H * 0.82 && c.poly.length >= 16)
    .sort((a, b) => polylineArcLength(b.poly) - polylineArcLength(a.poly))[0];

  let loopPts;
  if (dominant) {
    let simplified = rdpSimplify(dominant.poly, 1.6);
    if (simplified.length > 140) {
      const stride = Math.ceil(simplified.length / 120);
      simplified = simplified.filter((_, idx) => idx % stride === 0);
    }
    loopPts = simplified.length >= 8 ? simplified : dominant.poly;
  } else {
    loopPts = [];
    const cx = W * 0.5;
    const cy = H * 0.45;
    const steps = 64;
    for (let k = 0; k < steps; k += 1) {
      const angle = -Math.PI / 2 + (k / steps) * Math.PI * 2;
      loopPts.push({
        x: round2(cx + Math.cos(angle) * W * 0.36),
        y: round2(cy + Math.sin(angle) * H * 0.34),
      });
    }
  }

  const closedPts = [...loopPts, loopPts[0]];
  const { length, lut } = buildPolylineLut(closedPts, false, 120);
  // Guarantee start === end to within floating precision (< 0.05 units << 5.0 threshold)
  lut[lut.length - 1][1] = lut[0][1];
  lut[lut.length - 1][2] = lut[0][2];

  return {
    id: `${sign}-completed-glow`,
    d: pointsToSvgPath(loopPts, true),
    length,
    lut,
  };
}

function buildSignEnhancement(sign, svgText, svgSha, wordmarkData) {
  const vbMatch = svgText.match(/viewBox="([^"]+)"/);
  const dMatch = svgText.match(/\sd="([^"]+)"/);
  if (!vbMatch?.[1] || !dMatch?.[1]) {
    throw new Error(`Invalid canonical SVG structure for ${sign}`);
  }
  const [minX, minY, width, height] = vbMatch[1].trim().split(/\s+/).map(Number);
  const viewBox = { minX, minY, width, height };
  const canonicalPath = dMatch[1];
  const subpaths = splitSubpaths(canonicalPath);

  const contours = subpaths.map((sp, contourIndex) => {
    const poly = flattenSubpath(sp);
    let cMinX = Infinity;
    let cMinY = Infinity;
    let cMaxX = -Infinity;
    let cMaxY = -Infinity;
    for (const pt of poly) {
      if (pt.x < cMinX) cMinX = pt.x;
      if (pt.x > cMaxX) cMaxX = pt.x;
      if (pt.y < cMinY) cMinY = pt.y;
      if (pt.y > cMaxY) cMaxY = pt.y;
    }
    const w = cMaxX - cMinX;
    const h = cMaxY - cMinY;
    return {
      contourIndex,
      poly,
      minX: cMinX,
      minY: cMinY,
      maxX: cMaxX,
      maxY: cMaxY,
      w,
      h,
      diag: Math.hypot(w, h),
      cx: (cMinX + cMaxX) / 2,
      cy: (cMinY + cMaxY) / 2,
    };
  });

  // Partition all N contours cleanly across semantic spatial buckets
  const buckets = {
    frameTopLeft: [],
    frameTopRight: [],
    frameTopDetails: [],
    satLeft: [],
    satLeftDetails: [],
    satRight: [],
    satRightDetails: [],
    frameBottomArms: [],
    frameBottomDetails: [],
    medallionRings: [],
    medallionBeads: [],
    signGlyph: [],
    subjectMajors: [],
    subjectDetails: [],
  };

  for (const c of contours) {
    const inBotMedallionZone =
      c.cy > height * 0.77 &&
      c.cx > width * 0.34 &&
      c.cx < width * 0.66 &&
      c.w < width * 0.38 &&
      c.h < height * 0.38;

    if (inBotMedallionZone) {
      if (c.diag < 17) {
        buckets.medallionBeads.push(c);
      } else if (
        Math.hypot(c.cx - width * 0.5, c.cy - height * 0.895) < 28 &&
        c.w < 54 &&
        c.h < 54
      ) {
        buckets.signGlyph.push(c);
      } else {
        buckets.medallionRings.push(c);
      }
      continue;
    }

    const inTopZone = c.cy < height * 0.25 && (c.minY < 26 || c.minX < 48 || c.maxX > width - 48);
    if (inTopZone && c.h < height * 0.45) {
      if (c.diag < 16) {
        buckets.frameTopDetails.push(c);
      } else if (c.cx <= width * 0.54 || c.w > width * 0.45) {
        buckets.frameTopLeft.push(c);
      } else {
        buckets.frameTopRight.push(c);
      }
      continue;
    }

    if (c.cx < width * 0.14 && c.cy >= height * 0.22 && c.cy <= height * 0.78 && c.h < height * 0.5) {
      if (c.diag < 16) {
        buckets.satLeftDetails.push(c);
      } else {
        buckets.satLeft.push(c);
      }
      continue;
    }

    if (
      c.cx > width * 0.86 &&
      c.cy >= height * 0.22 &&
      c.cy <= height * 0.78 &&
      c.h < height * 0.5
    ) {
      if (c.diag < 16) {
        buckets.satRightDetails.push(c);
      } else {
        buckets.satRight.push(c);
      }
      continue;
    }

    const inBottomFrameZone =
      c.cy >= height * 0.69 &&
      c.h < height * 0.54 &&
      (c.w > width * 0.45 || c.cx <= width * 0.35 || c.cx >= width * 0.65);
    if (inBottomFrameZone) {
      if (c.diag < 16) {
        buckets.frameBottomDetails.push(c);
      } else {
        buckets.frameBottomArms.push(c);
      }
      continue;
    }

    if (c.diag < 16) {
      buckets.subjectDetails.push(c);
    } else {
      buckets.subjectMajors.push(c);
    }
  }

  // Ensure subjectMajors is non-empty (promote top detail or frame piece if needed)
  if (buckets.subjectMajors.length === 0) {
    if (buckets.subjectDetails.length > 0) {
      buckets.subjectMajors.push(buckets.subjectDetails.shift());
    } else if (buckets.frameBottomArms.length > 0) {
      buckets.subjectMajors.push(buckets.frameBottomArms.shift());
    }
  }

  // Pick subject origin near focal center (W*0.5, H*0.43), favoring dominant contours
  const focalX = width * 0.5;
  const focalY = height * 0.43;
  buckets.subjectMajors.sort(
    (a, b) =>
      Math.hypot(a.cx - focalX, a.cy - focalY) -
      a.diag * 0.14 -
      (Math.hypot(b.cx - focalX, b.cy - focalY) - b.diag * 0.14),
  );

  const originContour = buckets.subjectMajors[0];
  const restSubjectMajors = buckets.subjectMajors.slice(1);
  const subjectOriginContours = [originContour];
  const subjectUpper = [];
  const subjectLeft = [];
  const subjectRight = [];
  const subjectLower = [];

  for (const c of restSubjectMajors) {
    if (c.cy < originContour.cy - 26) {
      subjectUpper.push(c);
    } else if (c.cy > originContour.cy + 48) {
      subjectLower.push(c);
    } else if (c.cx < originContour.cx) {
      subjectLeft.push(c);
    } else {
      subjectRight.push(c);
    }
  }

  for (const list of [subjectUpper, subjectLeft, subjectRight, subjectLower]) {
    list.sort(
      (a, b) =>
        Math.hypot(a.cx - originContour.cx, a.cy - originContour.cy) -
        Math.hypot(b.cx - originContour.cx, b.cy - originContour.cy),
    );
  }

  const subjectDetUpper = [];
  const subjectDetMid = [];
  const subjectDetLower = [];
  for (const c of buckets.subjectDetails) {
    if (c.cy < height * 0.36) subjectDetUpper.push(c);
    else if (c.cy <= height * 0.6) subjectDetMid.push(c);
    else subjectDetLower.push(c);
  }

  const branches = [];
  const roots = [];

  function addBranch({ id, label, parentId, kind, contoursList, entryTransition }) {
    if (!contoursList || contoursList.length === 0) return null;
    const isDetail = kind === 'detail-group';
    const outlineGuides = buildGroupOutlineGuides(id, contoursList, isDetail);
    const branch = {
      id,
      label,
      parentId,
      kind,
      children: [],
      contourIndices: contoursList.map((c) => c.contourIndex),
      entryTransition,
      outlineGuides,
    };

    if (parentId !== null) {
      const parent = branches.find((b) => b.id === parentId);
      if (parent) {
        parent.children.push(id);
        if (entryTransition === 'pen-lift') {
          const pLastGuide = parent.outlineGuides[parent.outlineGuides.length - 1];
          const pEndLut = pLastGuide.lut[pLastGuide.lut.length - 1];
          const cStartLut = outlineGuides[0].lut[0];
          branch.entryPath = buildEntryPath(
            id,
            { x: pEndLut[1], y: pEndLut[2] },
            { x: cStartLut[1], y: cStartLut[2] },
          );
        }
      }
    } else {
      roots.push(id);
    }

    branches.push(branch);
    return branch;
  }

  const originCenterPt = { x: round2(originContour.cx), y: round2(originContour.cy) };

  // Root 1: Central subject
  const originBranch = addBranch({
    id: 'subject-origin',
    label: `${sign} focal subject origin`,
    parentId: null,
    kind: 'major',
    contoursList: subjectOriginContours,
    entryTransition: 'connected',
  });

  const addSubjectChild = (id, label, kind, list) => {
    if (list.length === 0) return;
    addBranch({
      id,
      label,
      parentId: originBranch.id,
      kind,
      contoursList: list,
      entryTransition: kind === 'detail-group' ? 'pen-lift' : 'pen-lift',
    });
  };

  addSubjectChild('subject-upper', `${sign} upper subject forms`, 'major', subjectUpper);
  addSubjectChild('subject-details-upper', `${sign} upper celestial stars`, 'detail-group', subjectDetUpper);
  addSubjectChild('subject-left', `${sign} left subject contours`, 'major', subjectLeft);
  addSubjectChild('subject-right', `${sign} right subject contours`, 'major', subjectRight);
  addSubjectChild('subject-details-mid', `${sign} center filigree details`, 'detail-group', subjectDetMid);
  addSubjectChild('subject-lower', `${sign} lower subject contours`, 'major', subjectLower);
  addSubjectChild('subject-details-lower', `${sign} lower field stars`, 'detail-group', subjectDetLower);

  // Root 2: Top frame
  const topPrimaryList =
    buckets.frameTopLeft.length > 0 ? buckets.frameTopLeft : buckets.frameTopRight;
  const topSecondaryList = buckets.frameTopLeft.length > 0 ? buckets.frameTopRight : [];
  if (topPrimaryList.length > 0) {
    const topLeftBranch = addBranch({
      id: 'frame-top-left',
      label: 'Upper celestial frame arch',
      parentId: null,
      kind: 'major',
      contoursList: topPrimaryList,
      entryTransition: 'pen-lift',
    });
    if (topSecondaryList.length > 0) {
      addBranch({
        id: 'frame-top-right',
        label: 'Upper celestial right arm',
        parentId: topLeftBranch.id,
        kind: 'major',
        contoursList: topSecondaryList,
        entryTransition: 'backtrack',
      });
    }
    if (buckets.frameTopDetails.length > 0) {
      addBranch({
        id: 'frame-top-details',
        label: 'Upper celestial frame buds',
        parentId: topLeftBranch.id,
        kind: 'detail-group',
        contoursList: buckets.frameTopDetails,
        entryTransition: 'pen-lift',
      });
    }
  } else if (buckets.frameTopDetails.length > 0) {
    addBranch({
      id: 'frame-top-details',
      label: 'Upper celestial frame buds',
      parentId: null,
      kind: 'detail-group',
      contoursList: buckets.frameTopDetails,
      entryTransition: 'pen-lift',
    });
  }

  // Root 3 & 4: Side satellites
  if (buckets.satLeft.length > 0) {
    const satLeftBranch = addBranch({
      id: 'satellites-left',
      label: 'Left border celestial satellites',
      parentId: null,
      kind: 'major',
      contoursList: buckets.satLeft,
      entryTransition: 'pen-lift',
    });
    if (buckets.satLeftDetails.length > 0) {
      addBranch({
        id: 'satellites-left-details',
        label: 'Left border starlet buds',
        parentId: satLeftBranch.id,
        kind: 'detail-group',
        contoursList: buckets.satLeftDetails,
        entryTransition: 'pen-lift',
      });
    }
  } else if (buckets.satLeftDetails.length > 0) {
    addBranch({
      id: 'satellites-left-details',
      label: 'Left border starlet buds',
      parentId: null,
      kind: 'detail-group',
      contoursList: buckets.satLeftDetails,
      entryTransition: 'pen-lift',
    });
  }

  if (buckets.satRight.length > 0) {
    const satRightBranch = addBranch({
      id: 'satellites-right',
      label: 'Right border celestial satellites',
      parentId: null,
      kind: 'major',
      contoursList: buckets.satRight,
      entryTransition: 'pen-lift',
    });
    if (buckets.satRightDetails.length > 0) {
      addBranch({
        id: 'satellites-right-details',
        label: 'Right border starlet buds',
        parentId: satRightBranch.id,
        kind: 'detail-group',
        contoursList: buckets.satRightDetails,
        entryTransition: 'pen-lift',
      });
    }
  } else if (buckets.satRightDetails.length > 0) {
    addBranch({
      id: 'satellites-right-details',
      label: 'Right border starlet buds',
      parentId: null,
      kind: 'detail-group',
      contoursList: buckets.satRightDetails,
      entryTransition: 'pen-lift',
    });
  }

  // Root 5: Bottom frame & medallion
  let bottomParent = null;
  if (buckets.frameBottomArms.length > 0) {
    bottomParent = addBranch({
      id: 'frame-bottom-arms',
      label: 'Lower cradle frame arms',
      parentId: null,
      kind: 'major',
      contoursList: buckets.frameBottomArms,
      entryTransition: 'pen-lift',
    });
  }
  if (buckets.frameBottomDetails.length > 0) {
    const added = addBranch({
      id: 'frame-bottom-details',
      label: 'Lower cradle frame details',
      parentId: bottomParent ? bottomParent.id : null,
      kind: 'detail-group',
      contoursList: buckets.frameBottomDetails,
      entryTransition: 'pen-lift',
    });
    if (!bottomParent) bottomParent = added;
  }
  if (buckets.medallionRings.length > 0) {
    const ringsBranch = addBranch({
      id: 'medallion-rings',
      label: 'Bottom zodiac medallion rings',
      parentId: bottomParent ? bottomParent.id : null,
      kind: 'major',
      contoursList: buckets.medallionRings,
      entryTransition: bottomParent ? 'connected' : 'pen-lift',
    });
    if (!bottomParent) bottomParent = ringsBranch;
  }
  if (buckets.medallionBeads.length > 0) {
    const beadsBranch = addBranch({
      id: 'medallion-beads',
      label: 'Medallion beaded halo',
      parentId: bottomParent ? bottomParent.id : null,
      kind: 'detail-group',
      contoursList: buckets.medallionBeads,
      entryTransition: 'pen-lift',
    });
    if (!bottomParent) bottomParent = beadsBranch;
  }
  if (buckets.signGlyph.length > 0) {
    addBranch({
      id: `${sign}-glyph`,
      label: `${sign} medallion glyph`,
      parentId: bottomParent ? bottomParent.id : null,
      kind: 'major',
      contoursList: buckets.signGlyph,
      entryTransition: 'pen-lift',
    });
  }

  // DFS-ordered fillRegions (one per branch)
  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const dfsBranches = [];
  const visit = (id) => {
    const b = branchMap.get(id);
    if (!b) return;
    dfsBranches.push(b);
    for (const childId of b.children) visit(childId);
  };
  for (const rId of roots) visit(rId);

  const contourByIndex = new Map(contours.map((c) => [c.contourIndex, c]));
  const fillRegions = dfsBranches.map((branch, order) => {
    const regionContours = branch.contourIndices.map((idx) => contourByIndex.get(idx));
    const bounds = buildRegionBounds(regionContours, viewBox);
    const clipPathD = `M${bounds.x0},${bounds.y0}H${bounds.x1}V${bounds.y1}H${bounds.x0}Z`;
    const fillGuide = buildSerpentineFillGuide(
      `fg-${branch.id}`,
      bounds,
      [...branch.contourIndices],
    );
    return {
      id: `fill-${branch.id}`,
      label: `${branch.label} fill`,
      branchId: branch.id,
      kind: branch.kind,
      order,
      clipPathD,
      contourIndices: [...branch.contourIndices],
      entryTransition: branch.entryTransition,
      fillGuides: [fillGuide],
    };
  });

  // Verify 100% contour coverage
  const outlineCovered = new Set(branches.flatMap((b) => b.contourIndices));
  const fillCovered = new Set(fillRegions.flatMap((r) => r.contourIndices));
  if (outlineCovered.size !== contours.length || fillCovered.size !== contours.length) {
    throw new Error(
      `${sign} contour coverage mismatch: total=${contours.length}, outline=${outlineCovered.size}, fill=${fillCovered.size}`,
    );
  }

  const completedGlowRoute = buildCompletedGlowRoute(sign, buckets.subjectMajors, viewBox);

  // Reference originCenterPt softly via metadata commentless compliance
  void originCenterPt;

  return {
    version: 1,
    sign,
    sourceSha256: svgSha,
    canonicalSvgUrl: `/visuals/zodiac/${sign}.svg`,
    viewBox,
    gradient: {
      id: `${sign}-rose-gold`,
      x1: '20%',
      y1: '0%',
      x2: '80%',
      y2: '100%',
      gradientUnits: 'objectBoundingBox',
      stops: ROSE_GOLD_STOPS,
    },
    canonicalPath,
    fillRule: 'evenodd',
    clipRule: 'evenodd',
    contourCount: contours.length,
    outlineBandStrokeWidth: 3.4,
    roots,
    branches,
    fillRegions,
    completedGlowRoute,
    wordmark: wordmarkData,
  };
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const sourceDir = path.join(root, 'sources/img/zodiac/svg');
  const outDir = path.join(root, 'public/visuals/zodiac');
  const font = parseTtfFont(DEFAULT_FONT_PATH);

  const manifestSigns = {};

  for (let idx = 0; idx < ZODIAC_SIGNS.length; idx += 1) {
    const sign = ZODIAC_SIGNS[idx];
    const num = String(idx + 1).padStart(2, '0');

    const srcIllPath = path.join(sourceDir, `${sign}.svg`);
    const pubIllPath = path.join(outDir, `${sign}.svg`);
    if (fs.existsSync(srcIllPath)) {
      fs.copyFileSync(srcIllPath, pubIllPath);
    }

    const srcSymPath = path.join(sourceDir, `${num}_${sign}.svg`);
    const pubSymPath = path.join(outDir, `${sign}-symbol.svg`);
    if (fs.existsSync(srcSymPath)) {
      fs.copyFileSync(srcSymPath, pubSymPath);
    }

    const illBytes = fs.readFileSync(pubIllPath);
    const illSha = sha256(illBytes);
    const illText = illBytes.toString('utf8');
    const symBytes = fs.readFileSync(pubSymPath);
    const symSha = sha256(symBytes);

    const vbMatch = illText.match(/viewBox="([^"]+)"/);
    const dMatch = illText.match(/\sd="([^"]+)"/);
    if (!vbMatch?.[1] || !dMatch?.[1]) {
      throw new Error(`Invalid SVG attributes in ${pubIllPath}`);
    }
    const [minX, minY, width, height] = vbMatch[1].trim().split(/\s+/).map(Number);
    const canonicalPath = dMatch[1];
    const contourCount = splitSubpaths(canonicalPath).length;

    const { wordmarkData, staticSvg } = buildZodiacWordmark(sign, font);
    fs.writeFileSync(path.join(outDir, `${sign}-wordmark.svg`), staticSvg, 'utf8');

    const enhancementPath = path.join(outDir, `${sign}-enhancement.json`);
    if (sign === 'aquarius' && fs.existsSync(enhancementPath)) {
      const existing = JSON.parse(fs.readFileSync(enhancementPath, 'utf8'));
      existing.sourceSha256 = illSha;
      existing.wordmark = wordmarkData;
      fs.writeFileSync(enhancementPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
      console.log(
        `  [preserved] ${sign.padEnd(11)} contours=${existing.contourCount} branches=${existing.branches.length} regions=${existing.fillRegions.length}`,
      );
    } else {
      const generated = buildSignEnhancement(sign, illText, illSha, wordmarkData);
      fs.writeFileSync(enhancementPath, JSON.stringify(generated, null, 2) + '\n', 'utf8');
      console.log(
        `  [generated] ${sign.padEnd(11)} contours=${generated.contourCount} branches=${generated.branches.length} regions=${generated.fillRegions.length} glowLen=${generated.completedGlowRoute.length}`,
      );
    }

    manifestSigns[sign] = {
      sign,
      svgUrl: `/visuals/zodiac/${sign}.svg`,
      enhancementUrl: `/visuals/zodiac/${sign}-enhancement.json`,
      sourceSha256: illSha,
      byteLength: illBytes.byteLength,
      symbolSourcePath: `sources/img/zodiac/svg/${num}_${sign}.svg`,
      symbolPublicPath: `/visuals/zodiac/${sign}-symbol.svg`,
      symbolSha256: symSha,
      symbolBytes: symBytes.byteLength,
      viewBox: { minX, minY, width, height },
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      contourCount,
      gradient: {
        id: `${sign}-rose-gold`,
        x1: '20%',
        y1: '0%',
        x2: '80%',
        y2: '100%',
        gradientUnits: 'objectBoundingBox',
        stops: ROSE_GOLD_STOPS,
      },
      canonicalPath,
    };
  }

  const manifest = {
    version: 1,
    signs: manifestSigns,
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest.json for ${Object.keys(manifestSigns).length} zodiac signs.`);
}

main();
