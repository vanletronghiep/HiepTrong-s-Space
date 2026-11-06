import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
};
const require = createRequire(import.meta.url);
const { chromium } = require(argument('--playwright-module', 'playwright'));
const executablePath = argument('--browser', undefined);
const base = argument('--url', 'http://127.0.0.1:4137');
const output = path.join(root, 'review/phase01');
const earthOutput = path.join(root, 'public/earth');
const failures = [];
const evidence = [];
const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const cases = [
    ['opening-desktop', 'opening', 1440, 900],
    ['globe-desktop', 'globe', 1440, 900],
    ['opening-phone', 'opening', 390, 844],
    ['globe-phone', 'globe', 390, 844],
    ['wordmark-detail', 'wordmark', 1200, 500],
  ];
  for (const [name, pose, width, height] of cases) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const response = await page.goto(`${base}/review/phase01/view.html?pose=${pose}&capture`, {
      waitUntil: 'networkidle',
    });
    await page.waitForFunction(() => window.__previewReady || window.__previewError, {
      timeout: 60_000,
    });
    const state = await page.evaluate(() => {
      const box = (selector) => {
        const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width, height };
      };
      const gl = window.__earth?.renderer.getContext();
      const debug = gl?.getExtension('WEBGL_debug_renderer_info');
      return {
        ready: window.__previewReady === true,
        error: window.__previewError,
        fontLoaded: document.fonts.check('400 14px Inter'),
        wordmark: box('.wordmark'),
        explore: box('.explore'),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : undefined,
      };
    });
    if (response.status() !== 200 || !state.ready || !state.fontLoaded || errors.length) {
      failures.push({ name, status: response.status(), ...state, errors });
    }
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    if (pose === 'globe') {
      await page.locator('.wordmark').screenshot({
        path: path.join(output, `compact-logo-${width < 768 ? 'phone' : 'desktop'}.png`),
      });
    }
    evidence.push({ name, pose, width, height, ...state, errors });
    process.stdout.write(`Captured ${name}: ${width}x${height}\n`);
    await page.close();
  }

  const posters = [];
  for (const [profile, width] of [
    ['4k', 2048],
    ['2k', 1024],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: width },
      deviceScaleFactor: 1,
    });
    await page.goto(`${base}/review/phase01/view.html?pose=poster&profile=${profile}&capture`, {
      waitUntil: 'networkidle',
    });
    await page.waitForFunction(() => window.__previewReady || window.__previewError, {
      timeout: 60_000,
    });
    const error = await page.evaluate(() => window.__previewError);
    if (error) throw new Error(error);
    const url = await page.locator('#earth').evaluate((canvas) => canvas.toDataURL('image/png'));
    const data = await sharp(Buffer.from(url.split(',')[1], 'base64'))
      .webp({ quality: 94, alphaQuality: 100, effort: 6 })
      .toBuffer();
    const file = `earth-poster-${profile}.webp`;
    await fs.writeFile(path.join(earthOutput, file), data);
    posters.push({
      file,
      width,
      height: width,
      bytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
      alpha: true,
      source: 'earth-scene.js; matching profile maps, yaw -1.82 radians',
    });
    await page.close();
  }
  const manifestPath = path.join(earthOutput, 'asset-manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const wordmark = await fs.readFile(path.join(root, 'public/brand/wordmark.svg'));
  manifest.wordmark = {
    file: '../brand/wordmark.svg',
    viewBox: '0 0 1200 430',
    bytes: wordmark.length,
    sha256: createHash('sha256').update(wordmark).digest('hex'),
    source: 'Vector reconstruction of owner-supplied sources/img/img0.png; no font files used.',
  };
  manifest.posters = posters;
  manifest.profileBudgets = ['4k', '2k'].map((profile) => {
    const bytes = [...manifest.variants, ...posters]
      .filter((entry) => entry.file.includes(profile))
      .reduce((sum, entry) => sum + entry.bytes, 0);
    const targetBytes = profile === '4k' ? 6_000_000 : 2_000_000;
    return { profile, bytes, targetBytes, withinTarget: bytes <= targetBytes };
  });
  manifest.posterNote =
    'Static visual-review candidates; regenerate after material/orientation approval and before production integration.';
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const report = {
    capturedAt: new Date().toISOString(),
    browser: browser.version(),
    rendering:
      'Headless Edge with software WebGL (SwiftShader); composition review, not a GPU/device performance result.',
    evidence,
    failures,
  };
  await fs.writeFile(
    path.join(output, 'capture-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  process.stdout.write(
    `${JSON.stringify({ failures, profileBudgets: manifest.profileBudgets })}\n`,
  );
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close();
}
