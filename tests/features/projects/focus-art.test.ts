import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PANEL_ART, panelArtIndexFor } from '@/features/projects/focus-art';

const ART_DIR = path.resolve(process.cwd(), 'public', 'visuals', 'project');

describe('panel corner art', () => {
  it('gives the same focus the same art every time', () => {
    for (const id of ['a', 'b3f1c2d4-0000-4000-8000-000000000001', 'draft', '']) {
      expect(panelArtIndexFor(id)).toBe(panelArtIndexFor(id));
      expect(panelArtIndexFor(id)).toBeGreaterThanOrEqual(0);
      expect(panelArtIndexFor(id)).toBeLessThan(PANEL_ART.length);
    }
  });

  it('spreads different focuses across every piece', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 400; i += 1) {
      seen.add(panelArtIndexFor(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`));
    }
    expect(seen.size).toBe(PANEL_ART.length);
  });

  it('only names files that exist, with the size recorded in the file', async () => {
    for (const art of PANEL_ART) {
      const svg = await fs.readFile(path.join(ART_DIR, `${art.name}.svg`), 'utf8');
      expect(svg).toContain(`viewBox="0 0 ${art.width} ${art.height}"`);
    }
  });
});

describe('static art in public/visuals/project', () => {
  it('is decorative and safe: no scripts, handlers, embeds or external links', async () => {
    const files = (await fs.readdir(ART_DIR)).filter((f) => f.endsWith('.svg'));
    expect(files.length).toBeGreaterThanOrEqual(22);
    for (const file of files) {
      const svg = await fs.readFile(path.join(ART_DIR, file), 'utf8');
      expect(svg, file).not.toMatch(/<script|\bon\w+\s*=|<animate|<foreignObject|<image|var\(/i);
      const withoutXmlns = svg.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
      expect(withoutXmlns, file).not.toMatch(/https?:\/\//i);
    }
  });

  it('ships every piece the Focus page uses', async () => {
    const needed = [
      'ridge-and-rising-sun',
      'emblem-seal',
      'emblem-bamboo',
      'emblem-mountain',
      'lotus-done',
      'lotus-current',
      'lotus-pending',
      'summit-pennant',
      'bamboo-rule',
      'jade-stamp-check',
      'distant-mountains',
      'wooden-training-dummy',
      'auspicious-cloud-pillar',
      ...PANEL_ART.map((art) => art.name),
    ];
    for (const name of needed) {
      await expect(fs.access(path.join(ART_DIR, `${name}.svg`)), name).resolves.toBeUndefined();
    }
  });
});
