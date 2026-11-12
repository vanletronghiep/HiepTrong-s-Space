import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectSourceFiles(fullPath)));
    } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Design token closed-palette guardrail', () => {
  it('forbids raw hex, rgb(), or hsl() colour literals outside src/design/tokens.css', async () => {
    const srcRoot = path.resolve(process.cwd(), 'src');
    const tokensFile = path.resolve(srcRoot, 'design', 'tokens.css');
    const files = await collectSourceFiles(srcRoot);

    const violations: string[] = [];
    const hexColorRegex = /#[0-9a-fA-F]{3,8}\b/g;
    const functionalColorRegex = /\b(?:rgb|rgba|hsl|hsla)\s*\(/g;

    for (const file of files) {
      if (path.resolve(file) === tokensFile) {
        continue;
      }
      const content = await fs.readFile(file, 'utf8');
      const hexMatches = content.match(hexColorRegex) ?? [];
      const fnMatches = content.match(functionalColorRegex) ?? [];
      if (hexMatches.length > 0 || fnMatches.length > 0) {
        const rel = path.relative(process.cwd(), file);
        violations.push(`${rel}: ${[...hexMatches, ...fnMatches].join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });
  it('requires definitions for static no-fallback CSS variable references', async () => {
    const files = await collectSourceFiles(path.resolve('src'));
    const css = files.filter(file => file.endsWith('.css'));
    const definitions = (await Promise.all([...css, path.resolve('node_modules/tailwindcss/theme.css')].map(file => fs.readFile(file, 'utf8')))).join('\n');
    const defined = new Set([...definitions.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
    // These values are assigned by the existing homepage/carousel runtime.
    const dynamic = new Set(['--logo-x', '--logo-y', '--logo-scale', '--carousel-board-index']);
    const missing: string[] = [];
    for (const file of files.filter(file => /\.(css|tsx)$/.test(file))) {
      const content = await fs.readFile(file, 'utf8');
      for (const match of content.matchAll(/var\((--[\w-]+)\)/g)) {
        if (!defined.has(match[1]) && !dynamic.has(match[1]!)) missing.push(`${path.relative(process.cwd(), file)}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('registers referenced custom color utilities with Tailwind', async () => {
    const theme = await fs.readFile(path.resolve('src/app/globals.css'), 'utf8');
    const colors = new Set([...theme.matchAll(/--color-([\w-]+)\s*:/g)].map(match => match[1]));
    const missing: string[] = [];
    for (const file of (await collectSourceFiles(path.resolve('src'))).filter(file => file.endsWith('.tsx'))) {
      const content = await fs.readFile(file, 'utf8');
      for (const match of content.matchAll(/\b(?:bg|text|border)-((?:status|text|ws|cosmos)-[\w-]+)/g)) {
        if (!colors.has(match[1])) missing.push(`${path.relative(process.cwd(), file)}: ${match[0]}`);
      }
    }
    expect(missing).toEqual([]);
  });

});
