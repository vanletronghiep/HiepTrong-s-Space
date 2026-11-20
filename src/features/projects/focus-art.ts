/** Decorative art in public/visuals/project/, drawn in one hand so any of it can sit together. */
export const ART_BASE = '/visuals/project';

export interface FocusArt {
  /** File name without the extension. */
  name: string;
  width: number;
  height: number;
}

/**
 * Corner art for the focus panel. Each focus keeps one of these, so a focus looks the same
 * every time it opens while different focuses feel different.
 */
export const PANEL_ART: readonly FocusArt[] = [
  { name: 'crane-against-the-moon', width: 480, height: 300 },
  { name: 'scholars-pavilion', width: 480, height: 300 },
  { name: 'pine-and-full-moon', width: 480, height: 300 },
  { name: 'paper-lantern', width: 320, height: 280 },
  { name: 'plum-blossom-branch', width: 220, height: 200 },
  { name: 'cloud-curls', width: 140, height: 140 },
];

/** FNV-1a, so the same id always picks the same art. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function panelArtIndexFor(id: string): number {
  return hash(id) % PANEL_ART.length;
}

export const artSrc = (name: string) => `${ART_BASE}/${name}.svg`;
