import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

type Rgb = [number, number, number];
const css = readFileSync('src/design/tokens.css', 'utf8');
const rgb = (hex: string): Rgb => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const mix = (a: Rgb, b: Rgb, weight: number) =>
  a.map((n, i) => n * weight + b[i]! * (1 - weight)) as Rgb;
function luminance(color: Rgb) {
  return color
    .map((n) => n / 255)
    .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
    .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i]!, 0);
}
function contrast(a: Rgb, b: Rgb) {
  return (
    (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)
  );
}
function weight(token: string) {
  const declaration = css.match(
    new RegExp(`--${token}:\\s*color-mix\\(in srgb, var\\(--feature-[a-z]+\\) (\\d+)%`),
  );
  if (!declaration) throw new Error(`Update the contrast resolver for ${token}.`);
  return Number(declaration[1]) / 100;
}

it('keeps feature accent and secondary text readable on their tinted surfaces', () => {
  const palettes = [...css.matchAll(/\[data-feature-theme='([^']+)'\]\s*\{([^}]+)\}/g)];
  expect(palettes).toHaveLength(13);
  for (const [, name, body] of palettes) {
    const colors = Object.fromEntries(
      [...body!.matchAll(/--feature-(\w+): #([\da-f]{6});/g)].map(([, role, hex]) => [
        role!,
        rgb(hex!),
      ]),
    );
    const accent = mix(colors.accent!, colors.ink!, weight('ws-accent'));
    const muted = mix(colors.muted!, colors.ink!, weight('ws-text-muted'));
    const surface = mix(colors.canvas!, [255, 255, 255], 0.24);
    // Bounds the current layered header/pill tints (14% header + 15% pill).
    for (const background of [colors.canvas!, colors.soft!, mix(accent, surface, 0.27)]) {
      expect(contrast(accent, background), `${name}: accent contrast`).toBeGreaterThanOrEqual(4.5);
    }
    for (const background of [colors.canvas!, colors.soft!, mix(accent, surface, 0.14)]) {
      expect(contrast(muted, background), `${name}: secondary contrast`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  }
});

it('keeps all six note headers and bodies readable', () => {
  const notes = [...css.matchAll(/\[data-note-tone='([^']+)'\]\s*\{([^}]+)\}/g)];
  expect(notes).toHaveLength(6);
  for (const [, name, body] of notes) {
    const colors = Object.fromEntries(
      [...body!.matchAll(/--note-(\w+): #([\da-f]{6});/g)].map(([, role, hex]) => [
        role!,
        rgb(hex!),
      ]),
    );
    expect(contrast(colors.ink!, colors.header!), `${name}: header`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.ink!, colors.body!), `${name}: body`).toBeGreaterThanOrEqual(4.5);
  }
});
